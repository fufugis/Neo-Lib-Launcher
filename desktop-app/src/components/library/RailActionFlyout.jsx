import React from 'react';
import { ChevronRight, X } from 'lucide-react';
import { renderForegroundPortal } from '../ui/VisualBoundary';
import { railFlyoutPosition, railFlyoutFocusIndex } from './rail-flyout-model.mjs';

// Portal outside the scrolling rail so the side-opening choices cannot be clipped.
export default function RailActionFlyout({ label, icon, tone, expanded, testid, open, onToggle, onClose, items }) {
  const trigger = React.useRef(null);
  const panel = React.useRef(null);
  const [position, setPosition] = React.useState({ top: 8, left: 56 });
  const close = React.useCallback((restoreFocus = false) => {
    onClose();
    if (restoreFocus) trigger.current?.focus();
  }, [onClose]);
  React.useLayoutEffect(() => {
    if (!open) return undefined;
    const place = () => {
      const anchor = trigger.current?.getBoundingClientRect();
      const box = panel.current?.getBoundingClientRect();
      if (!anchor || !box) return;
      setPosition(railFlyoutPosition(anchor, box, { width: window.innerWidth, height: window.innerHeight }));
    };
    place();
    panel.current?.querySelector('[role="menuitem"]')?.focus();
    const outside = event => {
      if (!panel.current?.contains(event.target) && !trigger.current?.contains(event.target)) close();
    };
    const escape = event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        close(true);
      }
    };
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
  }, [open, close, expanded]);
  const navigate = event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); close(true); return; }
    if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const buttons = [...panel.current.querySelectorAll('[role="menuitem"]')];
    const current = buttons.indexOf(document.activeElement);
    const next = railFlyoutFocusIndex(event.key, current, buttons.length);
    buttons[next]?.focus();
  };
  return <>
    <button ref={trigger} type="button" data-testid={testid} aria-label={label} aria-haspopup="menu" aria-expanded={open} aria-controls={open ? `${testid}-menu` : undefined}
      onClick={onToggle} onKeyDown={event => { if (['ArrowRight', 'ArrowDown'].includes(event.key)) { event.preventDefault(); if (!open) onToggle(); else panel.current?.querySelector('[role="menuitem"]')?.focus(); } }}
      title={expanded ? undefined : label} style={{ '--rail-color': tone }}
      className={`neo-rail-button mb-1 flex h-10 w-full shrink-0 items-center overflow-hidden rounded-lg border text-left ${expanded ? 'justify-start gap-2.5 px-2' : 'justify-center gap-0 px-0'}`}>
      <span className="neo-rail-button__icon grid h-6 w-6 shrink-0 place-items-center">{icon}</span>
      <span className={`min-w-0 flex-1 overflow-hidden whitespace-nowrap ${expanded ? 'opacity-100' : 'max-w-0 opacity-0'}`}>
        <span className="block truncate text-[10px] font-bold uppercase leading-[13px] tracking-[0.14em]">{label}</span>
        <span aria-hidden="true" className="block truncate text-[9px] leading-[11px] text-muted">Choose an option</span>
      </span>
      {expanded && <ChevronRight size={12} className="shrink-0" aria-hidden="true" />}
    </button>
    {open && renderForegroundPortal(<div ref={panel} id={`${testid}-menu`} role="menu" aria-label={label} data-testid={`${testid}-menu`} data-controller-surface="popover"
      onKeyDown={navigate} style={{ position: 'fixed', ...position, zIndex: 10000, maxHeight: 'calc(100vh - 16px)', background: 'rgb(var(--surface))' }}
      className="w-[min(240px,calc(100vw-16px))] overflow-y-auto rounded-xl hairline p-1.5 shadow-2xl">
      <div className="flex items-center justify-between px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted">
        <span>{label}</span>
        <button type="button" data-controller-close aria-label={`Close ${label} menu`} onClick={() => close(true)} className="rounded-md p-1.5 text-ink hover:bg-[rgb(var(--accent)/0.12)]"><X size={14} /></button>
      </div>
      {items.map(item => <button type="button" role="menuitem" key={item.testid} data-testid={item.testid}
        onClick={() => { close(true); item.action?.(); }}
        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-semibold text-ink hover:bg-[rgb(var(--accent)/0.12)] focus:bg-[rgb(var(--accent)/0.12)]">
        {item.icon}<span>{item.label}</span>
      </button>)}
    </div>)}
  </>;
}
