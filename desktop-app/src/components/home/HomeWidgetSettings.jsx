import React from 'react';
import Modal from '../Modal';
import { homeContentSize, homeContentSizePatch } from './home-content-size.mjs';

export default function HomeWidgetSettings({ open, onClose, layout, widgets, onChange, snapToGrid, onToggleSnap, hiddenCount = 0, onRearrange, onManage, onImport }) {
  const [selected, setSelected] = React.useState('');
  const body = React.useRef(null);
  React.useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    const surface = body.current?.closest('[data-controller-surface]');
    const controls = () => [...(surface?.querySelectorAll('button:not(:disabled), input, select') || [])];
    controls()[0]?.focus();
    const trap = event => {
      if (event.key !== 'Tab') return;
      const list = controls();
      const current = list.indexOf(document.activeElement);
      if (!list.length) return;
      if (current < 0 || (event.shiftKey ? current === 0 : current === list.length - 1)) {
        event.preventDefault(); (event.shiftKey ? list.at(-1) : list[0]).focus();
      }
    };
    surface?.addEventListener('keydown', trap);
    return () => { surface?.removeEventListener('keydown', trap); if (previous?.isConnected) previous.focus(); };
  }, [open]);
  const id = widgets.some(widget => widget.id === selected) ? selected : '';
  const size = homeContentSize(layout, id || undefined);
  const override = id && Object.hasOwn(layout.widgetContentSizes || {}, id);
  const clearOverride = () => {
    const next = { ...(layout.widgetContentSizes || {}) }; delete next[id];
    onChange({ widgetContentSizes: next });
  };
  const button = 'rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-xs font-bold hover:bg-[rgb(var(--accent)/0.12)]';
  return <Modal open={open} onClose={onClose} title="Edit widgets" testid="home-widget-settings">
    <div ref={body} role="dialog" aria-modal="true" aria-label="Edit widgets" className="space-y-4 p-5">
      <div className="grid grid-cols-2 gap-2" aria-label="Widget actions">
        <button type="button" className={button} data-testid="home-layout-lock-toggle" onClick={onRearrange}>Rearrange widgets</button>
        <button type="button" className={button} onClick={onManage}>Choose widgets{hiddenCount > 0 ? ` · ${hiddenCount} hidden` : ''}</button>
        <button type="button" className={button} data-testid="home-layout-snap-toggle" aria-pressed={snapToGrid} onClick={onToggleSnap}>{snapToGrid ? 'Snap on' : 'Free move'}</button>
        <button type="button" className={button} onClick={onImport}>Import widget</button>
      </div>
      <h3 className="text-sm font-bold">Widget settings</h3>
      <p className="text-sm text-muted">Enlarge artwork, text and controls inside widgets. Boxes keep their width, height and position; extra content scrolls inside them.</p>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={layout.excludeRoms === true} onChange={event => onChange({ excludeRoms: event.target.checked })} />Exclude ROMs from statistics (rankings, pie and calendar)</label>
      <label className="grid gap-2 text-sm">Apply to
        <select aria-label="Widget size target" value={id} onChange={event => setSelected(event.target.value)} className="rounded-lg border border-[rgb(var(--border))] bg-panel p-2">
          <option value="">All widgets (default)</option>
          {widgets.map(widget => <option key={widget.id} value={widget.id}>{widget.label}</option>)}
        </select>
      </label>
      <label className="grid gap-2 text-sm">Content size <output>{size}%</output>
        <input aria-label="Widget content size" type="range" min="100" max="180" step="5" value={size} onChange={event => onChange(homeContentSizePatch(layout, id, event.target.value))} />
      </label>
      <p className="text-xs text-muted">{id ? override ? 'This widget has its own size override.' : 'Following the shared size. Moving the slider creates an override.' : 'Individual overrides stay unchanged.'} Saved automatically. Lounge retains its own zoom controls.</p>
      <div className="flex flex-wrap gap-2">
        {id && <button type="button" className={button} disabled={!override} onClick={clearOverride}>Use shared size</button>}
        <button type="button" className={button} onClick={() => onChange({ contentSize: 100, widgetContentSizes: {} })}>Reset all content sizes</button>
        <button type="button" className={button} data-controller-close onClick={onClose}>Done</button>
      </div>
      <p className="text-xs text-muted">Tip: use Rearrange widgets to resize the boxes themselves. The pie also has its own Chart size and legend controls under Filters.</p>
    </div>
  </Modal>;
}
