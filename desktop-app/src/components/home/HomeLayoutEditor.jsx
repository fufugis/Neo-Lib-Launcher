import React from 'react';
import { Move, Save, X, Maximize2, Grip, RotateCcw } from 'lucide-react';
import { renderForegroundPortal } from '../ui/VisualBoundary';
import { adjustEditorBox, homeEditorFitZoom, HOME_EDITOR_GRID, resizeHomeEditorCanvas, parkHomeEditorBox, returnHomeEditorBox, toggleHomeEditorWidget } from './home-layout-editor-model.mjs';

// Shared box-arrangement mechanics. Preview uses its own fixed sections/model,
// never the widget registry, community runtime or Home layout settings.
export default function HomeLayoutEditor({ initialDraft, widgets, onSave, onCancel, title = 'Rearrange Home widgets', description = 'Zoomed-out Home · drag the named boxes, then Save. Overlap is allowed.', itemLabel = 'Widget', itemsLabel = 'widgets', holdingArea = false, expandableHeight = false, fitToWindow = false, chooseWidgets = false, renderPreview, renderInspector }) {
  const [draft, setDraft] = React.useState(initialDraft);
  const [previewEnabled, setPreviewEnabled] = React.useState(true);
  const [previewDraft, setPreviewDraft] = React.useState(initialDraft);
  const previewFrame = React.useRef(null);
  React.useEffect(() => setPreviewDraft(draft), [draft]);
  const [heightInput, setHeightInput] = React.useState(String(Math.round(initialDraft.height)));
  React.useEffect(() => setHeightInput(String(Math.round(draft.height))), [draft.height]);
  const latest = React.useRef(draft);
  latest.current = draft;
  const [parked, setParked] = React.useState({});
  const parkedRef = React.useRef(parked);
  parkedRef.current = parked;
  const parkingWidth = 2 * Math.max(360, ...Object.values(draft.positions).map(box => box.width + 48));
  const workspace = holdingArea ? { width: draft.width + 48 + parkingWidth, height: Math.max(draft.height * 2, ...Object.values(parked).map(box => box.y + box.height + 24)) } : draft;
  const [choicesOpen, setChoicesOpen] = React.useState(chooseWidgets);
  const hiddenIds = draft.hiddenIds || [];
  const visibleWidgets = widgets.filter(widget => !hiddenIds.includes(widget.id));
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
    cancelAnimationFrame(previewFrame.current); previewFrame.current = null;
    setPreviewDraft(latest.current);
    gesture.current = null;
    if (fitToWindow && viewport.current) setZoom(homeEditorFitZoom(latest.current, viewport.current.getBoundingClientRect(), true));
    if (save && holdingArea && !active.resize && active.moved && active.next.x + active.next.width / 2 > latest.current.width + 24) {
      // Parking is editor-only; preserve the original Home coordinates and size.
      const nextParked = parkHomeEditorBox(latest.current, parkedRef.current, active.id);
      applyBoxStyle(boxes.current.get(active.id), nextParked[active.id]);
      setParked(nextParked);
    } else if (save && active.moved) {
      const next = active.resize ? active.next : adjustEditorBox(active.next, 0, 0, latest.current, latest.current.snap, false);
      applyBoxStyle(boxes.current.get(active.id), next);
      setDraft(previous => ({ ...previous, order: [...previous.order.filter(id => id !== active.id), active.id], height: fitToWindow && active.resize ? Math.max(previous.height, next.y + next.height + 24) : previous.height, positions: { ...previous.positions, [active.id]: next } }));
      setParked(previous => { const copy = { ...previous }; delete copy[active.id]; return copy; });
    }
    else applyBoxStyle(boxes.current.get(active.id), active.initial);
    try { if (active.target.hasPointerCapture?.(active.pointerId)) active.target.releasePointerCapture(active.pointerId); }
    catch { /* A removed/OS-cancelled pointer is already released. */ }
  }, [holdingArea, fitToWindow]);
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
    const release = event => { if (gesture.current?.pointerId === event.pointerId) finishGesture(true); };
    const cancelPointer = event => { if (gesture.current?.pointerId === event.pointerId) finishGesture(false); };
    document.addEventListener('keydown', key);
    window.addEventListener('pointerup', release, true);
    window.addEventListener('pointercancel', cancelPointer, true);
    window.addEventListener('blur', cancelDrag);
    window.addEventListener('resize', cancelDrag);
    return () => { finishGesture(false); document.removeEventListener('keydown', key); window.removeEventListener('pointerup', release, true); window.removeEventListener('pointercancel', cancelPointer, true); window.removeEventListener('blur', cancelDrag); window.removeEventListener('resize', cancelDrag); originalFocus?.isConnected && originalFocus.focus?.(); };
  }, [finishGesture]);
  React.useLayoutEffect(() => {
    const rect = viewport.current?.getBoundingClientRect();
    if (rect) setZoom(homeEditorFitZoom(holdingArea ? { ...initialDraft, width: initialDraft.width + 48 + parkingWidth } : initialDraft, rect));
  }, [initialDraft, holdingArea]);
  React.useLayoutEffect(() => {
    if (!fitToWindow) return undefined;
    const host = viewport.current;
    // Content/inspector measurements can resize the viewport during a gesture.
    // Keep its original coordinate scale until release instead of cancelling it.
    const sync = () => { if (gesture.current) return; host.scrollTop = 0; host.scrollLeft = 0; setZoom(homeEditorFitZoom(latest.current, host.getBoundingClientRect(), true)); };
    sync();
    const observer = new ResizeObserver(sync); observer.observe(host);
    return () => observer.disconnect();
  }, [fitToWindow, draft.width, draft.height, finishGesture]);
  const start = (event, id, resize = false) => {
    if (event.button !== 0 || gesture.current) return;
    event.preventDefault(); event.stopPropagation();
    const element = canvas.current;
    const scale = element.getBoundingClientRect().width / element.offsetWidth;
    if (!(scale > 0)) return;
    const initial = parkedRef.current[id] || latest.current.positions[id];
    if (resize && parkedRef.current[id]) return;
    gesture.current = { id, resize, initial, next: initial, startX: event.clientX, startY: event.clientY,
      scale, scrollX: viewport.current.scrollLeft, scrollY: viewport.current.scrollTop, moved: false, pointerId: event.pointerId, target: event.currentTarget };
    try { event.currentTarget.setPointerCapture(event.pointerId); }
    catch { gesture.current = null; return; }
    setSelectedId(id);
    // Never reorder captured DOM nodes while pressed: that can strand native capture.
  };
  const move = event => {
    const active = gesture.current;
    if (!active || active.pointerId !== event.pointerId) return;
    // Recover even when the OS/browser lost the original release outside the window.
    if (event.pointerType === 'mouse' && !(event.buttons & 1)) { finishGesture(true); return; }
    active.moved ||= Math.abs(event.clientX - active.startX) + Math.abs(event.clientY - active.startY) > 3;
    const host = viewport.current;
    const bounds = host.getBoundingClientRect();
    if (!fitToWindow) {
      if (event.clientY > bounds.bottom - 32) host.scrollTop += 20;
      else if (event.clientY < bounds.top + 32) host.scrollTop -= 20;
      if (event.clientX > bounds.right - 32) host.scrollLeft += 20;
      else if (event.clientX < bounds.left + 32) host.scrollLeft -= 20;
    }
    const resizeBounds = fitToWindow && active.resize ? { ...latest.current, height: Math.max(latest.current.height, active.initial.y + active.initial.height + (event.clientY - active.startY) / active.scale + 24) } : latest.current;
    active.next = adjustEditorBox(active.initial, (event.clientX - active.startX + host.scrollLeft - active.scrollX) / active.scale,
      (event.clientY - active.startY + host.scrollTop - active.scrollY) / active.scale, active.resize ? resizeBounds : workspace, latest.current.snap, active.resize);
    applyBoxStyle(boxes.current.get(active.id), active.next);
    if (renderPreview && previewEnabled && previewFrame.current == null) previewFrame.current = requestAnimationFrame(() => {
      previewFrame.current = null;
      const current = gesture.current;
      if (current) setPreviewDraft({ ...latest.current, positions: { ...latest.current.positions, [current.id]: current.next } });
    });
  };
  const endPointer = (event, save) => {
    if (gesture.current?.pointerId === event.pointerId) finishGesture(save);
  };
  const pointerProps = { onPointerMove: move, onPointerUp: event => endPointer(event, true),
    onPointerCancel: event => endPointer(event, false), onLostPointerCapture: event => endPointer(event, false) };
  const labelById = Object.fromEntries(widgets.map(widget => [widget.id, widget.label]));
  const nudge = (event, id) => {
    if (parked[id]) return;
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
  return renderForegroundPortal(<section ref={dialog} role="dialog" aria-modal="true" aria-label={title}
    className="home-layout-editor" data-testid="home-layout-editor" data-controller-surface="layout-editor">
    <header className="home-layout-editor-toolbar">
      <div><h2><Move size={19} />{title}</h2><p>{description}</p></div>
      <div className="home-editor-controls">
        {renderPreview && <button type="button" aria-pressed={previewEnabled} data-testid="editor-preview-toggle" onClick={() => { finishGesture(false); setPreviewEnabled(value => !value); }}>Live preview {previewEnabled ? 'on' : 'off'}</button>}
        {chooseWidgets && <button type="button" aria-expanded={choicesOpen} onClick={() => { finishGesture(false); setChoicesOpen(value => !value); }}>Choose widgets · {visibleWidgets.length}/{widgets.length}</button>}
        {visibleWidgets.length > 0 && <label>{itemLabel} <select aria-label={itemLabel === 'Widget' ? 'Choose widget to move' : 'Choose preview section to move'} value={visibleWidgets.some(widget => widget.id === selectedId) ? selectedId : ''} onChange={event => chooseWidget(event.target.value)}>
          <option value="" disabled>Select a box</option>
          {visibleWidgets.map(widget => <option key={widget.id} value={widget.id}>{widget.label || widget.id}</option>)}
        </select></label>}
        {holdingArea && selectedId && !hiddenIds.includes(selectedId) && <button type="button" data-testid="home-editor-park-selected" onClick={() => {
          finishGesture(false);
          if (parked[selectedId]) {
            setDraft(previous => returnHomeEditorBox(previous, parked, selectedId));
            setParked(previous => { const copy = { ...previous }; delete copy[selectedId]; return copy; });
          } else setParked(previous => parkHomeEditorBox(draft, previous, selectedId));
        }}>{parked[selectedId] ? 'Return selected to Home' : 'Park selected temporarily'}</button>}
        <button type="button" data-testid="home-editor-snap-toggle" aria-pressed={draft.snap}
          onClick={() => { finishGesture(false); setDraft(previous => ({ ...previous, snap: !previous.snap })); }}><Grip size={15} />{draft.snap ? 'Snap on' : 'Free placement'}</button>
        {!fitToWindow && <label>Zoom <input aria-label="Editor zoom" type="range" min="10" max="100" value={Math.round(zoom * 100)}
          onChange={event => { finishGesture(false); setZoom(Number(event.target.value) / 100); }} /><span>{Math.round(zoom * 100)}%</span></label>}
        <button type="button" onClick={() => { finishGesture(false); setZoom(homeEditorFitZoom(workspace, viewport.current.getBoundingClientRect(), fitToWindow)); }}><Maximize2 size={15} />Fit {fitToWindow ? 'preview' : 'Home'}</button>
        <button type="button" onClick={() => { finishGesture(false); setDraft(initialDraft); setParked({}); }}><RotateCcw size={15} />Reset draft</button>
        <button ref={cancelButton} type="button" data-controller-close onClick={() => { finishGesture(false); onCancel(); }}><X size={15} />Cancel</button>
        <button type="button" data-testid="home-editor-save" className="home-editor-save" disabled={Object.keys(parked).length > 0} onClick={() => { if (gesture.current || Object.keys(parkedRef.current).length) return; onSave(expandableHeight ? resizeHomeEditorCanvas(latest.current, heightInput || latest.current.height) : latest.current); }}><Save size={15} />Save layout</button>
      </div>
    </header>
    {chooseWidgets && choicesOpen && <section className="home-editor-widget-choices" aria-label="Choose Home widgets">
      <p>Show widgets on Home · changes apply with Save layout. Imported package permissions stay in Import widget.</p>
      <div>{widgets.map(widget => <label key={widget.id}><input type="checkbox" checked={!hiddenIds.includes(widget.id)} onChange={event => {
        finishGesture(false);
        const enabled = event.target.checked;
        setDraft(previous => toggleHomeEditorWidget(previous, widget.id, enabled));
        if (!enabled) setParked(previous => { const copy = { ...previous }; delete copy[widget.id]; return copy; });
        else setSelectedId(widget.id);
      }} />{widget.label || widget.id}</label>)}</div>
    </section>}
    {renderPreview && previewEnabled && renderPreview(previewDraft)}
    <div className="home-editor-main">
    <div ref={viewport} className={`home-editor-viewport ${fitToWindow ? 'is-auto-fit' : ''}`}>
      <div className="home-editor-scaled-bounds" style={{ width: workspace.width * zoom, height: workspace.height * zoom }}>
        <div ref={canvas} className="home-editor-workspace" style={{ width: workspace.width, height: workspace.height, transform: `scale(${zoom})` }}>
          <div className={`home-editor-canvas ${draft.snap ? 'is-snapping' : ''}`} data-testid="home-editor-canvas" style={{ width: draft.width, height: draft.height }} />
          {holdingArea && <aside className="home-editor-parking" data-testid="home-editor-parking" style={{ left: draft.width + 48, width: parkingWidth, height: workspace.height }}>
            <b style={{ fontSize: `${13 / zoom}px`, top: `${-22 / zoom}px` }}>Temporary holding area</b>
          </aside>}
          {draft.order.filter(id => !hiddenIds.includes(id)).map((id, index) => { const box = parked[id] || draft.positions[id]; return <div key={id} ref={element => { if (element) boxes.current.set(id, element); else boxes.current.delete(id); }}
            className={`home-editor-widget ${selectedId === id ? 'is-selected' : ''} ${parked[id] ? 'is-parked' : ''}`} data-editor-widget-id={id} data-editor-parked={Boolean(parked[id])}
            style={{ left: box.x, top: box.y, width: box.width, height: box.height, zIndex: selectedId === id ? draft.order.length + 1 : index + 1, '--editor-label-size': `${13 / zoom}px`, '--editor-line-width': `${1 / zoom}px` }}>
            <button type="button" className="home-editor-widget-move" onFocus={() => setSelectedId(id)} onKeyDown={event => nudge(event, id)}
              aria-label={`Move ${labelById[id] || id}`} onPointerDown={event => start(event, id)} {...pointerProps}>
              <span>{labelById[id] || id}</span>
            </button>
            <button type="button" disabled={Boolean(parked[id])} className="home-editor-resize" aria-label={`Resize ${labelById[id] || id}`} onPointerDown={event => start(event, id, true)}
              onKeyDown={event => {
                if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
                event.preventDefault(); event.stopPropagation(); const step = draft.snap ? HOME_EDITOR_GRID : 8;
                setDraft(previous => ({ ...previous, positions: { ...previous.positions, [id]: adjustEditorBox(previous.positions[id], event.key === 'ArrowRight' ? step : event.key === 'ArrowLeft' ? -step : 0, event.key === 'ArrowDown' ? step : event.key === 'ArrowUp' ? -step : 0, previous, previous.snap, true) } }));
              }} {...pointerProps}>◢</button>
          </div>; })}
        </div>
      </div>
    </div>
    {renderInspector && <aside className="home-editor-inspector">{renderInspector({ draft, selectedId, onChange: update => { finishGesture(false); setDraft(update); } })}</aside>}
    </div>
    <footer className="home-layout-editor-footer">
      {expandableHeight && <div className="home-editor-controls home-editor-extension" data-testid="home-editor-extension">
        <button type="button" data-testid="home-editor-add-height" onClick={() => { finishGesture(false); setDraft(previous => resizeHomeEditorCanvas(previous, previous.height + 500)); }}>+500px · Extend Home area</button>
        <label>Home height <input aria-label="Home canvas height" type="number" min="540" max="100000" step="100" value={heightInput} onChange={event => setHeightInput(event.target.value)} onBlur={() => { finishGesture(false); setDraft(previous => resizeHomeEditorCanvas(previous, heightInput || previous.height)); }} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); event.currentTarget.blur(); } }} /><span>px</span></label>
      </div>}
      <p role="status">{Object.keys(parked).length ? `${Object.keys(parked).length} temporarily parked — return them to Home or turn them off before saving. Cancel leaves Home unchanged.` : visibleWidgets.length ? `${visibleWidgets.length} ${itemsLabel} · Drag to move · Corner to resize · Arrow keys to adjust · Save applies changes` : 'No visible widgets. Choose widgets above to turn them on.'}</p>
    </footer>
  </section>);
}
