import React from 'react';
import { Move, Save, X, Maximize2, Grip, RotateCcw } from 'lucide-react';
import { renderForegroundPortal } from '../ui/VisualBoundary';
import { adjustEditorBox, homeEditorFitZoom, HOME_EDITOR_GRID } from './home-layout-editor-model.mjs';

export default function HomeLayoutEditor({ initialDraft, widgets, onSave, onCancel }) {
  const [draft, setDraft] = React.useState(initialDraft);
  const latest = React.useRef(draft);
  latest.current = draft;
  const [zoom, setZoom] = React.useState(0.6);
  const [selectedId, setSelectedId] = React.useState(widgets[0]?.id || '');
  const viewport = React.useRef(null);
  const canvas = React.useRef(null);
  const dialog = React.useRef(null);
  const cancelButton = React.useRef(null);
  const gesture = React.useRef(null);
  const boxes = React.useRef(new Map());
  const cancelRef = React.useRef(onCancel);
  cancelRef.current = onCancel;
  const applyBoxStyle = (element, box) => {
    if (!element) return;
    Object.assign(element.style, { left: `${box.x}px`, top: `${box.y}px`, width: `${box.width}px`, height: `${box.height}px` });
  };
  const finishGesture = React.useCallback(save => {
    const active = gesture.current;
    if (!active) return;
    gesture.current = null;
    if (save) setDraft(previous => ({ ...previous, positions: { ...previous.positions, [active.id]: active.next } }));
    else applyBoxStyle(boxes.current.get(active.id), active.initial);
    if (active.target.hasPointerCapture?.(active.pointerId)) active.target.releasePointerCapture(active.pointerId);
  }, []);
  React.useEffect(() => {
    const originalFocus = document.activeElement;
    cancelButton.current?.focus();
    const key = event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); finishGesture(false); cancelRef.current(); }
      if (event.key !== 'Tab') return;
      const controls = [...(dialog.current?.querySelectorAll('button:not(:disabled), input, select') || [])];
      const index = controls.indexOf(document.activeElement);
      if (!controls.length) return;
      if (event.shiftKey && index <= 0) { event.preventDefault(); controls.at(-1).focus(); }
      else if (!event.shiftKey && (index < 0 || index === controls.length - 1)) { event.preventDefault(); controls[0].focus(); }
    };
    const cancelDrag = () => finishGesture(false);
    document.addEventListener('keydown', key);
    window.addEventListener('blur', cancelDrag);
    window.addEventListener('resize', cancelDrag);
    return () => { finishGesture(false); document.removeEventListener('keydown', key); window.removeEventListener('blur', cancelDrag); window.removeEventListener('resize', cancelDrag); originalFocus?.isConnected && originalFocus.focus?.(); };
  }, [finishGesture]);
  React.useLayoutEffect(() => {
    const rect = viewport.current?.getBoundingClientRect();
    if (rect) setZoom(homeEditorFitZoom(initialDraft, rect));
  }, [initialDraft]);
  const start = (event, id, resize = false) => {
    if (event.button !== 0 || gesture.current) return;
    event.preventDefault(); event.stopPropagation();
    const element = canvas.current;
    const scale = element.getBoundingClientRect().width / element.offsetWidth;
    if (!(scale > 0)) return;
    const initial = latest.current.positions[id];
    gesture.current = { id, resize, initial, next: initial, startX: event.clientX, startY: event.clientY,
      scale, pointerId: event.pointerId, target: event.currentTarget };
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedId(id);
    setDraft(previous => ({ ...previous, order: [...previous.order.filter(value => value !== id), id] }));
  };
  const move = event => {
    const active = gesture.current;
    if (!active || active.pointerId !== event.pointerId) return;
    active.next = adjustEditorBox(active.initial, (event.clientX - active.startX) / active.scale,
      (event.clientY - active.startY) / active.scale, latest.current, latest.current.snap, active.resize);
    applyBoxStyle(boxes.current.get(active.id), active.next);
  };
  const endPointer = (event, save) => {
    if (gesture.current?.pointerId === event.pointerId) finishGesture(save);
  };
  const pointerProps = { onPointerMove: move, onPointerUp: event => endPointer(event, true),
    onPointerCancel: event => endPointer(event, false), onLostPointerCapture: event => endPointer(event, false) };
  const labelById = Object.fromEntries(widgets.map(widget => [widget.id, widget.label]));
  const nudge = (event, id) => {
    const direction = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
    if (!direction) return;
    event.preventDefault(); event.stopPropagation();
    const step = (draft.snap ? HOME_EDITOR_GRID : 1) * (event.shiftKey ? 5 : 1);
    setDraft(previous => ({ ...previous, positions: { ...previous.positions,
      [id]: adjustEditorBox(previous.positions[id], direction[0] * step, direction[1] * step, previous, previous.snap) } }));
  };
  const chooseWidget = id => {
    finishGesture(false);
    setSelectedId(id);
    setDraft(previous => ({ ...previous, order: [...previous.order.filter(value => value !== id), id] }));
    // Selecting by name recovers boxes completely covered by another widget.
    requestAnimationFrame(() => boxes.current.get(id)?.querySelector('.home-editor-widget-move')?.focus());
  };
  return renderForegroundPortal(<section ref={dialog} role="dialog" aria-modal="true" aria-label="Rearrange Home widgets"
    className="home-layout-editor" data-testid="home-layout-editor">
    <header className="home-layout-editor-toolbar">
      <div><h2><Move size={19} /> Rearrange widgets</h2><p>Zoomed-out Home · drag the named boxes, then Save. Overlap is allowed.</p></div>
      <div className="home-editor-controls">
        {widgets.length > 0 && <label>Widget <select aria-label="Choose widget to move" value={selectedId} onChange={event => chooseWidget(event.target.value)}>
          {widgets.map(widget => <option key={widget.id} value={widget.id}>{widget.label || widget.id}</option>)}
        </select></label>}
        <button type="button" data-testid="home-editor-snap-toggle" aria-pressed={draft.snap}
          onClick={() => { finishGesture(false); setDraft(previous => ({ ...previous, snap: !previous.snap })); }}><Grip size={15} />{draft.snap ? 'Snap on' : 'Free placement'}</button>
        <label>Zoom <input aria-label="Editor zoom" type="range" min="10" max="100" value={Math.round(zoom * 100)}
          onChange={event => { finishGesture(false); setZoom(Number(event.target.value) / 100); }} /><span>{Math.round(zoom * 100)}%</span></label>
        <button type="button" onClick={() => { finishGesture(false); setZoom(homeEditorFitZoom(draft, viewport.current.getBoundingClientRect())); }}><Maximize2 size={15} />Fit Home</button>
        <button type="button" onClick={() => { finishGesture(false); setDraft(initialDraft); }}><RotateCcw size={15} />Reset draft</button>
        <button ref={cancelButton} type="button" data-controller-close onClick={() => { finishGesture(false); onCancel(); }}><X size={15} />Cancel</button>
        <button type="button" data-testid="home-editor-save" className="home-editor-save" onClick={() => { if (gesture.current) return; onSave(latest.current); }}><Save size={15} />Save layout</button>
      </div>
    </header>
    <div ref={viewport} className="home-editor-viewport">
      <div className="home-editor-scaled-bounds" style={{ width: draft.width * zoom, height: draft.height * zoom }}>
        <div ref={canvas} className={`home-editor-canvas ${draft.snap ? 'is-snapping' : ''}`} data-testid="home-editor-canvas"
          style={{ width: draft.width, height: draft.height, transform: `scale(${zoom})` }}>
          {draft.order.map((id, index) => <div key={id} ref={element => { if (element) boxes.current.set(id, element); else boxes.current.delete(id); }}
            className={`home-editor-widget ${selectedId === id ? 'is-selected' : ''}`} data-editor-widget-id={id}
            style={{ left: draft.positions[id].x, top: draft.positions[id].y, width: draft.positions[id].width, height: draft.positions[id].height, zIndex: index + 1, '--editor-label-size': `${13 / zoom}px`, '--editor-line-width': `${1 / zoom}px` }}>
            <button type="button" className="home-editor-widget-move" onFocus={() => setSelectedId(id)} onKeyDown={event => nudge(event, id)}
              aria-label={`Move ${labelById[id] || id}`} onPointerDown={event => start(event, id)} {...pointerProps}>
              <span>{labelById[id] || id}</span>
            </button>
            <button type="button" className="home-editor-resize" aria-label={`Resize ${labelById[id] || id}`} onPointerDown={event => start(event, id, true)}
              onKeyDown={event => {
                if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
                event.preventDefault(); event.stopPropagation(); const step = draft.snap ? HOME_EDITOR_GRID : 8;
                setDraft(previous => ({ ...previous, positions: { ...previous.positions, [id]: adjustEditorBox(previous.positions[id], event.key === 'ArrowRight' ? step : event.key === 'ArrowLeft' ? -step : 0, event.key === 'ArrowDown' ? step : event.key === 'ArrowUp' ? -step : 0, previous, previous.snap, true) } }));
              }} {...pointerProps}>◢</button>
          </div>)}
        </div>
      </div>
    </div>
    <footer className="home-layout-editor-footer">{widgets.length ? `${widgets.length} widgets · Drag to move · Corner to resize · Arrow keys to adjust · Save applies changes` : 'No visible widgets. Cancel and enable widgets in the Widgets manager.'}</footer>
  </section>);
}
