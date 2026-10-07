import React from 'react';
import { Boxes, Settings2, X } from 'lucide-react';
import { TabPill } from '../library/LibraryToolbarControls';
import { railFlyoutFocusIndex } from '../library/rail-flyout-model.mjs';
import { renderForegroundPortal } from '../ui/VisualBoundary';

export default function AddonMenu({ addons, onOpen, onManage, showLabel = true, decorationTheme, decorationOpacity }) {
  const trigger = React.useRef(null), panel = React.useRef(null);
  const [open, setOpen] = React.useState(false);
  const [position, setPosition] = React.useState({ top: 48, left: 8 });
  const close = (restore = false) => { setOpen(false); if (restore) trigger.current?.focus(); };
  React.useLayoutEffect(() => {
    if (!open) return undefined;
    const place = () => {
      const anchor = trigger.current?.getBoundingClientRect(), box = panel.current?.getBoundingClientRect();
      if (!anchor || !box) return;
      setPosition({ left: Math.max(8, Math.min(anchor.left, window.innerWidth - box.width - 8)), top: Math.max(8, Math.min(anchor.bottom + 6, window.innerHeight - box.height - 8)) });
    };
    place();
    panel.current?.querySelector('[role="menuitem"]')?.focus();
    const outside = event => { if (!panel.current?.contains(event.target) && !trigger.current?.contains(event.target)) setOpen(false); };
    const escape = event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setOpen(false); trigger.current?.focus(); } };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('focusin', outside);
    document.addEventListener('keydown', escape, true);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('focusin', outside);
      document.removeEventListener('keydown', escape, true);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]);
  const navigate = event => {
    const buttons = [...panel.current.querySelectorAll('[role="menuitem"]')];
    const index = railFlyoutFocusIndex(event.key, buttons.indexOf(document.activeElement), buttons.length);
    if (index >= 0) { event.preventDefault(); buttons[index]?.focus(); }
  };
  return <>
    <TabPill label="Addons" icon={<Boxes size={15} />} showLabel={showLabel} active={open} testid="addons-dropdown" buttonRef={trigger}
      menuId="addons-menu" menuExpanded={open} decorationTheme={decorationTheme} decorationOpacity={decorationOpacity}
      onClick={() => setOpen(value => !value)} onKeyDown={event => { if (event.key === 'ArrowDown') { event.preventDefault(); if (!open) setOpen(true); else panel.current?.querySelector('[role="menuitem"]')?.focus(); } }} />
    {open && renderForegroundPortal(<div ref={panel} id="addons-menu" role="menu" aria-label="Addons" data-controller-surface="popover" onKeyDown={navigate}
      style={{ position: 'fixed', ...position, zIndex: 10000, maxHeight: 'calc(100vh - 16px)', background: 'rgb(var(--surface))' }}
      className="w-[min(260px,calc(100vw-16px))] overflow-y-auto rounded-xl hairline p-2 shadow-2xl">
      <div className="flex items-center justify-between px-2 pb-1 text-xs font-bold text-muted"><span>Addons</span><button type="button" data-controller-close aria-label="Close Addons menu" onClick={() => close(true)} className="rounded p-1.5 hover:bg-white/10"><X size={14} /></button></div>
      {addons.map(addon => <button type="button" role="menuitem" key={addon.id} onClick={() => { close(true); onOpen?.(addon.id); }}
        className="mb-1 flex w-full items-center gap-2 rounded-lg hairline bg-[rgb(var(--panel))] px-3 py-2.5 text-left text-xs font-semibold text-ink hover:border-[rgb(var(--accent)/0.6)]"><Boxes size={16} className="shrink-0" /><span className="min-w-0 break-words">{addon.name}</span></button>)}
      {!addons.length && <p className="px-2 py-2 text-xs text-muted">No enabled Addons yet.</p>}
      <button type="button" role="menuitem" onClick={() => { close(true); onManage?.(); }} className="mt-1 flex w-full items-center gap-2 rounded-lg hairline bg-[rgb(var(--panel))] px-3 py-2.5 text-left text-xs font-semibold text-ink hover:border-[rgb(var(--accent)/0.6)]"><Settings2 size={16} />Manage Addons</button>
    </div>)}
  </>;
}
