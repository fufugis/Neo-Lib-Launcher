import React from 'react';
import { GripVertical, Tv2, Plus, Home, Library, Columns, Boxes, Palette, Settings2, Sparkles, Moon, Power } from 'lucide-react';
import Modal from '../Modal';
import { renderForegroundPortal } from '../ui/VisualBoundary';
import { DEFAULT_SIDEBAR_TWEAKS, normalizeSidebarTweaks, orderedSidebarIds, moveSidebarButton, dropSidebarButton, sidebarButtonList, sidebarButtonGeometry, sidebarButtonColor, sidebarButtonTone } from './sidebar-tweaks-model.mjs';

const BUTTON_ICONS = { 'sidebar-rail-lounge-btn': Tv2, 'sidebar-rail-wizard-btn': Plus, 'tab-home': Home, 'tab-library': Library, 'tab-cover-wall': Columns, 'sidebar-rail-visuals-menu-btn': Palette, 'sidebar-rail-settings-menu-btn': Settings2, 'sidebar-rail-changelog-btn': Sparkles, 'sidebar-rail-rest-toggle': Moon, 'sidebar-rail-quit-btn': Power };

// Preserve the original grouped layout until the user chooses a custom order.
export function SidebarButtonOrder({ order, colors, children }) {
  const decorate = nodes => React.Children.map(nodes, node => {
    if (!React.isValidElement(node)) return node;
    if (node.props.testid && !node.props.testid.startsWith('side-navigation-')) return React.cloneElement(node, { tone: sidebarButtonTone(node.props.testid, colors) });
    return node.props.children ? React.cloneElement(node, {}, decorate(node.props.children)) : node;
  });
  const decorated = decorate(children);
  if (!order.length) return decorated;
  const flatten = nodes => React.Children.toArray(nodes).flatMap(node => node.type === React.Fragment ? flatten(node.props.children) : [node]);
  const buttons = flatten(decorated).filter(node => (node.props?.testid && !node.props.testid.startsWith('side-navigation-')) || node.props?.['data-testid'] === 'sidebar-add-games-area');
  const idOf = node => node.props?.['data-testid'] === 'sidebar-add-games-area' ? 'sidebar-rail-wizard-btn' : node.props.testid;
  const available = buttons.map(idOf);
  return orderedSidebarIds(order, available).map(id => React.cloneElement(buttons.find(node => idOf(node) === id), { key: id }));
}

export function useSidebarHoverLabel(enabled) {
  const [label, setLabel] = React.useState(null);
  const tooltipRef = React.useRef(null);
  React.useEffect(() => { if (!enabled) setLabel(null); }, [enabled]);
  React.useLayoutEffect(() => {
    if (!label || !tooltipRef.current) return;
    const box = tooltipRef.current.getBoundingClientRect();
    const left = Math.max(8, Math.min(label.left, window.innerWidth - box.width - 8));
    const top = Math.max(8, Math.min(label.top, window.innerHeight - box.height - 8));
    if (left !== label.left || top !== label.top) setLabel(previous => previous && { ...previous, left, top });
  }, [label]);
  const clear = () => setLabel(null);
  const show = event => {
    if (!enabled) return;
    const button = event.target.closest?.('button[aria-label]');
    if (!button || !event.currentTarget.contains(button)) { clear(); return; }
    const rect = button.getBoundingClientRect();
    setLabel({ text: button.getAttribute('aria-label'), hint: button.dataset.sidebarHint || '', left: rect.right + 8, top: Math.max(8, rect.top) });
  };
  const tooltip = enabled && label ? renderForegroundPortal(<div ref={tooltipRef} role="tooltip" aria-hidden="true" data-testid="sidebar-instant-label" className="pointer-events-none fixed z-[10001] max-w-[240px] rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-2 text-xs font-bold text-ink shadow-xl" style={{ left: label.left, top: label.top, maxWidth: 'min(240px, calc(100vw - 16px))' }}><span data-sidebar-label className="block">{label.text}</span>{label.hint && <span data-sidebar-hint className="mt-0.5 block text-[10px] font-medium leading-snug text-muted">{label.hint}</span>}</div>) : null;
  return { show, clear, tooltip };
}

export default function SidebarTweaks({ open, onClose, value, onChange, addons = [] }) {
  const preferences = normalizeSidebarTweaks(value);
  const geometry = sidebarButtonGeometry(preferences);
  const previewWidth = preferences.mode === 'icons' ? geometry.compact : geometry.expanded;
  const [reordering, setReordering] = React.useState(false);
  const [selected, setSelected] = React.useState(null);
  const [dropTarget, setDropTarget] = React.useState(null);
  const drag = React.useRef(null);
  const clearDrag = () => { drag.current = null; setDropTarget(null); };
  React.useEffect(() => { if (!open) { drag.current = null; setDropTarget(null); setSelected(null); setReordering(false); } }, [open]);
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
  const selectedButton = buttons.find(([id]) => id === selected);
  const buttonClass = 'rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-xs font-bold hover:bg-[rgb(var(--accent)/0.12)] disabled:opacity-35';
  return <Modal open={open} onClose={onClose} title="Sidebar tweaks" testid="sidebar-tweaks-modal" overlayStyle={{ '--sidebar-preview-clear': `${previewWidth + 8}px`, '--sidebar-editor-offset': `${previewWidth + 16}px` }}>
    <div ref={body} role="dialog" aria-modal="true" aria-label="Sidebar tweaks" className="space-y-5 p-5">
      <p className="text-xs text-muted">Changes apply immediately and are saved on this computer.</p>
      <fieldset><legend className="mb-2 text-xs font-black uppercase tracking-wider">Button layout</legend><div className="flex gap-2">{[['default', 'Default'], ['icons', 'Icons only']].map(([mode, label]) => <button key={mode} type="button" className={buttonClass} aria-pressed={preferences.mode === mode} style={preferences.mode === mode ? { background: 'rgb(var(--accent)/0.18)', borderColor: 'rgb(var(--accent))' } : undefined} onClick={() => update({ mode })}>{label}</button>)}</div><p className="mt-2 text-xs text-muted">Default expands on hover. Icons only stays compact, with immediate labels on hover or keyboard focus.</p></fieldset>
      {[['buttonSize', 'Button size', 75, 150, '%'], ['spacing', 'Spacing', 0, 16, 'px'], ['iconSize', 'Icon size', 14, 30, 'px'], ['saturation', 'Color saturation', 0, 200, '%']].map(([key, label, min, max, unit]) => <label key={key} className="block text-xs font-bold"><span className="flex justify-between">{label}<output>{preferences[key]}{unit}</output></span><input className="mt-2 w-full accent-[rgb(var(--accent))]" type="range" min={min} max={max} step="1" value={preferences[key]} aria-label={label} onChange={event => update({ [key]: Number(event.target.value) })} /></label>)}
      <p className="text-xs text-muted">Button size scales the whole button, including its text and icon. Icon size adjusts the symbol separately. 100% keeps the original size.</p>
      <p className="text-xs text-muted">Color saturation affects only icons and colored button borders. 0% makes those black and white; 100% keeps their theme colors. Sidebar backgrounds, text and headings stay unchanged.</p>
      <label className="flex items-center gap-3 text-xs font-bold"><input type="checkbox" checked={preferences.frames} onChange={event => update({ frames: event.target.checked })} />Show icon frames<span className="font-normal text-muted">Off leaves just the symbols, without button boxes or icon backplates.</span></label>
      <div className="flex flex-wrap gap-2"><button type="button" className={buttonClass} aria-expanded={reordering} onClick={() => { clearDrag(); setReordering(value => !value); }}>Move icons</button><button type="button" className={buttonClass} onClick={() => { clearDrag(); onChange?.(normalizeSidebarTweaks(DEFAULT_SIDEBAR_TWEAKS)); }}>Reset sidebar</button></div>
      {reordering && <section aria-label="Sidebar button order" className="space-y-3" onDragEnd={clearDrag}>
        <p className="text-xs text-muted">Drag icons into place, or use Up / Down. Click an icon to choose its colour. Custom ordering replaces the group headings.</p>
        <div data-testid="sidebar-icon-color-editor" className="sidebar-icon-color-editor">{selectedButton ? <>
          <h3 className="text-sm font-black">{selectedButton[1]}</h3>
          <label className="flex items-center gap-3 text-xs font-bold">Icon colour<input type="color" aria-label={`${selectedButton[1]} icon colour`} value={sidebarButtonColor(selected, preferences.colors)} onChange={event => update({ colors: { ...preferences.colors, [selected]: event.target.value } })} /><span className="font-mono">{sidebarButtonColor(selected, preferences.colors)}</span></label>
          <button type="button" className={buttonClass} onClick={() => { const colors = { ...preferences.colors }; delete colors[selected]; update({ colors }); }}>Use default colour</button>
        </> : <p className="text-xs text-muted">Select an icon below to see its name and colour picker.</p>}</div>
        <ol className="sidebar-move-icons" aria-label="Move sidebar icons">{ordered.map((id, index) => {
          const name = buttons.find(([key]) => key === id)?.[1], Icon = BUTTON_ICONS[id] || Boxes;
          return <li key={id} draggable data-sidebar-move-id={id} data-drop-position={dropTarget?.id === id ? dropTarget.after ? 'after' : 'before' : undefined}
            onDragStart={event => { drag.current = id; setSelected(id); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', id); }}
            onDragOver={event => { if (!drag.current) return; event.preventDefault(); event.dataTransfer.dropEffect = 'move'; const bounds = event.currentTarget.getBoundingClientRect(); setDropTarget({ id, after: event.clientY > bounds.top + bounds.height / 2 }); }}
            onDrop={event => { event.preventDefault(); if (drag.current) { const bounds = event.currentTarget.getBoundingClientRect(); update({ order: dropSidebarButton(preferences.order, ids, drag.current, id, event.clientY > bounds.top + bounds.height / 2) }); } clearDrag(); }}>
            <GripVertical size={16} aria-hidden="true" className="shrink-0 text-muted" />
            <button type="button" aria-label={`Customize ${name} icon`} aria-pressed={selected === id} className="sidebar-move-icon-select" onClick={() => setSelected(id)}><Icon size={22} aria-hidden="true" style={{ color: sidebarButtonColor(id, preferences.colors) }} /><span>{name}</span></button>
            {[[-1, 'Up'], [1, 'Down']].map(([direction, text]) => <button key={direction} type="button" className={buttonClass} disabled={direction < 0 ? index === 0 : index === ordered.length - 1} aria-label={`Move ${name} ${text.toLowerCase()}`} onClick={() => update({ order: moveSidebarButton(preferences.order, ids, id, direction) })}>{text}</button>)}
          </li>;
        })}</ol>
      </section>}
    </div>
  </Modal>;
}
