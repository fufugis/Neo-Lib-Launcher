import React from 'react';
import Modal from '../Modal';
import { renderForegroundPortal } from '../ui/VisualBoundary';
import { DEFAULT_SIDEBAR_TWEAKS, normalizeSidebarTweaks, orderedSidebarIds, moveSidebarButton, sidebarButtonList, sidebarButtonGeometry } from './sidebar-tweaks-model.mjs';

// Preserve the original grouped layout until the user chooses a custom order.
export function SidebarButtonOrder({ order, children }) {
  if (!order.length) return children;
  const flatten = nodes => React.Children.toArray(nodes).flatMap(node => node.type === React.Fragment ? flatten(node.props.children) : [node]);
  const buttons = flatten(children).filter(node => (node.props?.testid && !node.props.testid.startsWith('side-navigation-')) || node.props?.['data-testid'] === 'sidebar-add-games-area');
  const idOf = node => node.props?.['data-testid'] === 'sidebar-add-games-area' ? 'sidebar-rail-wizard-btn' : node.props.testid;
  const available = buttons.map(idOf);
  return orderedSidebarIds(order, available).map(id => React.cloneElement(buttons.find(node => idOf(node) === id), { key: id }));
}

export function useSidebarHoverLabel(enabled) {
  const [label, setLabel] = React.useState(null);
  React.useEffect(() => { if (!enabled) setLabel(null); }, [enabled]);
  const clear = () => setLabel(null);
  const show = event => {
    if (!enabled) return;
    const button = event.target.closest?.('button[aria-label]');
    if (!button || !event.currentTarget.contains(button)) { clear(); return; }
    const rect = button.getBoundingClientRect();
    setLabel({ text: button.getAttribute('aria-label'), left: rect.right + 8, top: Math.max(8, Math.min(rect.top, window.innerHeight - 40)) });
  };
  const tooltip = enabled && label ? renderForegroundPortal(<div role="tooltip" aria-hidden="true" data-testid="sidebar-instant-label" className="pointer-events-none fixed z-[10001] max-w-[240px] rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-2 text-xs font-bold text-ink shadow-xl" style={{ left: label.left, top: label.top }}>{label.text}</div>) : null;
  return { show, clear, tooltip };
}

export default function SidebarTweaks({ open, onClose, value, onChange, addons = [] }) {
  const preferences = normalizeSidebarTweaks(value);
  const geometry = sidebarButtonGeometry(preferences);
  const [reordering, setReordering] = React.useState(false);
  const body = React.useRef(null);
  React.useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    const surface = body.current?.closest('[data-controller-surface]');
    const controls = () => [...(surface?.querySelectorAll('button:not(:disabled), input') || [])];
    controls()[0]?.focus();
    const trap = event => {
      if (event.key !== 'Tab') return;
      const list = controls(), index = list.indexOf(document.activeElement);
      if (index < 0 || (event.shiftKey ? index === 0 : index === list.length - 1)) { event.preventDefault(); (event.shiftKey ? list.at(-1) : list[0])?.focus(); }
    };
    surface?.addEventListener('keydown', trap);
    return () => { surface?.removeEventListener('keydown', trap); (previous?.isConnected ? previous : document.querySelector('[data-testid="sidebar-rail-visuals-menu-btn"]'))?.focus(); };
  }, [open]);
  const update = patch => onChange?.(normalizeSidebarTweaks({ ...preferences, ...patch }));
  const buttons = sidebarButtonList(addons);
  const ids = buttons.map(([id]) => id);
  const ordered = orderedSidebarIds(preferences.order, ids);
  const buttonClass = 'rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-xs font-bold hover:bg-[rgb(var(--accent)/0.12)] disabled:opacity-35';
  return <Modal open={open} onClose={onClose} title="Sidebar tweaks" testid="sidebar-tweaks-modal" overlayStyle={{ '--sidebar-preview-clear': `${geometry.expanded + 8}px`, '--sidebar-editor-offset': `${geometry.expanded + 16}px` }}>
    <div ref={body} role="dialog" aria-modal="true" aria-label="Sidebar tweaks" className="space-y-5 p-5">
      <p className="text-xs text-muted">Changes apply immediately and are saved on this computer.</p>
      <fieldset><legend className="mb-2 text-xs font-black uppercase tracking-wider">Button layout</legend><div className="flex gap-2">{[['default', 'Default'], ['icons', 'Icons only']].map(([mode, label]) => <button key={mode} type="button" className={buttonClass} aria-pressed={preferences.mode === mode} style={preferences.mode === mode ? { background: 'rgb(var(--accent)/0.18)', borderColor: 'rgb(var(--accent))' } : undefined} onClick={() => update({ mode })}>{label}</button>)}</div><p className="mt-2 text-xs text-muted">Default expands on hover. Icons only stays compact, with immediate labels on hover or keyboard focus.</p></fieldset>
      {[['buttonSize', 'Button size', 75, 150, '%'], ['spacing', 'Spacing', 0, 16, 'px'], ['iconSize', 'Icon size', 14, 30, 'px'], ['saturation', 'Color saturation', 0, 200, '%']].map(([key, label, min, max, unit]) => <label key={key} className="block text-xs font-bold"><span className="flex justify-between">{label}<output>{preferences[key]}{unit}</output></span><input className="mt-2 w-full accent-[rgb(var(--accent))]" type="range" min={min} max={max} step="1" value={preferences[key]} aria-label={label} onChange={event => update({ [key]: Number(event.target.value) })} /></label>)}
      <p className="text-xs text-muted">Button size scales the whole button, including its text and icon. Icon size adjusts the symbol separately. 100% keeps the original size.</p>
      <p className="text-xs text-muted">0% saturation is black and white; 100% keeps the theme colors.</p>
      <div className="flex flex-wrap gap-2"><button type="button" className={buttonClass} aria-expanded={reordering} onClick={() => setReordering(value => !value)}>Reorder buttons</button><button type="button" className={buttonClass} onClick={() => onChange?.({ ...DEFAULT_SIDEBAR_TWEAKS, order: [] })}>Reset sidebar</button></div>
      {reordering && <section aria-label="Sidebar button order" className="space-y-2"><p className="text-xs text-muted">Move buttons up or down. Custom order replaces the category headings; reset to restore the grouped layout.</p>{ordered.map((id, index) => <div key={id} className="flex items-center gap-2 rounded-lg border border-[rgb(var(--border))] p-2"><span className="min-w-0 flex-1 truncate text-xs font-bold">{buttons.find(([key]) => key === id)?.[1]}</span>{[[-1, 'Up'], [1, 'Down']].map(([direction, text]) => <button key={direction} type="button" className={buttonClass} disabled={direction < 0 ? index === 0 : index === ordered.length - 1} aria-label={`Move ${buttons.find(([key]) => key === id)?.[1]} ${text.toLowerCase()}`} onClick={() => update({ order: moveSidebarButton(preferences.order, ids, id, direction) })}>{text}</button>)}</div>)}</section>}
    </div>
  </Modal>;
}
