import React from 'react';
import Modal from '../Modal';
import { Newspaper } from 'lucide-react';
import { homeContentSize, homeContentSizePatch } from './home-content-size.mjs';
import { homeTitleTweaks, homeTitlePatch, homeTitleStyles } from './home-title-tweaks.mjs';

export default function HomeWidgetSettings({ open, onClose, layout, widgets, onChange, snapToGrid, onToggleSnap, onRearrange, onImport }) {
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
  const titles = homeTitleTweaks(layout, id);
  const titleStyle = homeTitleStyles(titles);
  const selectedWidget = widgets.find(widget => widget.id === id);
  const titleOverride = id && Object.hasOwn(layout.widgetTitleTweaks || {}, id);
  const changeTitle = (field, value) => onChange(homeTitlePatch(layout, id, field, value));
  const clearOverride = () => {
    const next = { ...(layout.widgetContentSizes || {}) }; delete next[id];
    onChange({ widgetContentSizes: next });
  };
  const button = 'rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-xs font-bold hover:bg-[rgb(var(--accent)/0.12)]';
  return <Modal open={open} onClose={onClose} title="Edit widgets" testid="home-widget-settings">
    <div ref={body} role="dialog" aria-modal="true" aria-label="Edit widgets" className="space-y-4 p-5">
      <div className="grid grid-cols-2 gap-2" aria-label="Widget actions">
        <button type="button" className={button} data-testid="home-layout-lock-toggle" onClick={onRearrange}>Rearrange widgets</button>
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
      <section aria-label="Widget title appearance" className="space-y-3 rounded-xl border border-[rgb(var(--border))] bg-panel/40 p-4">
        <h3 className="text-sm font-black uppercase tracking-wider">Title appearance</h3>
        <p className="text-xs text-muted">Make headings stand out independently of the widget content. Uses the Apply to choice above; updates are live and saved automatically.</p>
        <div data-testid="home-title-settings-preview" className="flex items-center gap-2 overflow-hidden rounded-lg border border-[rgb(var(--accent)/0.4)] bg-[rgb(var(--accent)/0.11)] px-2" style={{ ...titleStyle.bar, '--accent': selectedWidget?.accents?.[0], '--accent-2': selectedWidget?.accents?.[1] }}>
          <Newspaper size={titleStyle.iconSize} className="shrink-0 text-[rgb(var(--accent-2))]" /><span className="min-w-0 truncate tracking-wide" style={titleStyle.text}>{selectedWidget?.label || 'Widget title preview'}</span>
        </div>
        <label className="grid gap-1 text-sm">Title text size <output>{titles.size}px</output><input aria-label="Widget title size" type="range" min="11" max="26" step="1" value={titles.size} onChange={event => changeTitle('size', event.target.value)} /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1 text-sm">Weight<select aria-label="Widget title weight" value={titles.weight} onChange={event => changeTitle('weight', event.target.value)} className="rounded-lg border hairline bg-panel p-2"><option value="600">Semibold</option><option value="700">Bold</option><option value="900">Extra bold</option></select></label>
          <label className="grid gap-1 text-sm">Text colour<select aria-label="Widget title colour" value={titles.color} onChange={event => changeTitle('color', event.target.value)} className="rounded-lg border hairline bg-panel p-2"><option value="theme">Theme text</option><option value="bright">Bright white</option><option value="accent">Widget accent</option></select></label>
        </div>
        <label className="grid gap-1 text-sm">Title bar darkening <output>{titles.contrast}%</output><input aria-label="Widget title contrast" type="range" min="0" max="90" step="5" value={titles.contrast} onChange={event => changeTitle('contrast', event.target.value)} /></label>
        <label className="flex items-center gap-2 text-sm"><input aria-label="Widget title uppercase" type="checkbox" checked={titles.uppercase} onChange={event => changeTitle('uppercase', event.target.checked)} />Uppercase titles</label>
        <p className="text-xs text-muted">{id ? titleOverride ? 'This widget has title overrides; untouched controls still follow the shared style.' : 'Following the shared title style.' : 'Changes shared defaults; individual title overrides stay unchanged.'} Larger headings use more header space, without resizing the box.</p>
        <div className="flex flex-wrap gap-2">
          {id && <button type="button" className={button} disabled={!titleOverride} onClick={() => { const next = { ...layout.widgetTitleTweaks }; delete next[id]; onChange({ widgetTitleTweaks: next }); }}>Use shared title style</button>}
          <button type="button" className={button} onClick={() => onChange({ titleTweaks: {}, widgetTitleTweaks: {} })}>Reset all title styles</button>
        </div>
      </section>
      <p className="text-xs text-muted">{id ? override ? 'This widget has its own size override.' : 'Following the shared size. Moving the slider creates an override.' : 'Individual overrides stay unchanged.'} Saved automatically. Lounge retains its own zoom controls.</p>
      <div className="flex flex-wrap gap-2">
        {id && <button type="button" className={button} disabled={!override} onClick={clearOverride}>Use shared size</button>}
        <button type="button" className={button} onClick={() => onChange({ contentSize: 100, widgetContentSizes: {} })}>Reset all content sizes</button>
        <button type="button" className={button} data-controller-close onClick={onClose}>Done</button>
      </div>
      <p className="text-xs text-muted">Tip: Rearrange widgets lets you choose which widgets are shown, move and resize boxes, and extend the Home area. The pie has Chart size and legend controls under Filters.</p>
    </div>
  </Modal>;
}
