import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Gamepad2, Lightbulb, Palette, PanelLeft, Power, RefreshCw, Settings2, SlidersHorizontal, Sparkles, Tv2, UserRound } from 'lucide-react';
import { renderForegroundPortal } from '../ui/VisualBoundary';

function MenuItem({ icon, label, detail, onClick, disabled = false, testid, danger = false }) {
  return <button
    type="button"
    data-testid={testid}
    onClick={onClick}
    disabled={disabled}
    className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition ${disabled ? 'cursor-not-allowed opacity-45' : danger ? 'text-rose-200 hover:bg-rose-400/10' : 'text-ink hover:bg-[rgb(var(--accent)/0.10)]'}`}
  >
    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-md ${danger ? 'bg-rose-400/10 text-rose-300' : 'bg-[rgb(var(--accent)/0.10)] text-[rgb(var(--accent))]'}`}>{icon}</span>
    <span className="min-w-0 flex-1"><span className="block text-[11px] font-bold">{label}</span>{detail && <span className="mt-0.5 block text-[9px] leading-snug text-muted">{detail}</span>}</span>
    {disabled ? <span className="rounded-full border border-[rgb(var(--border)/0.7)] px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide text-muted">Phase 2</span> : <ChevronRight size={13} className="shrink-0 text-muted" />}
  </button>;
}

function MenuSection({ label, children }) {
  return <section className="px-1 py-1.5"><p className="px-2.5 pb-1 text-[8.5px] font-bold uppercase tracking-[0.2em] text-[rgb(var(--accent-2))]">{label}</p>{children}</section>;
}

function MenuToggle({ icon, label, detail, checked, onChange, testid }) {
  return <button type="button" data-testid={testid} role="switch" aria-checked={checked} onClick={() => onChange?.(!checked)} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-ink transition hover:bg-[rgb(var(--accent)/0.10)]">
    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-[rgb(var(--accent)/0.10)] text-[rgb(var(--accent))]">{icon}</span>
    <span className="min-w-0 flex-1"><span className="block text-[11px] font-bold">{label}</span><span className="mt-0.5 block text-[9px] leading-snug text-muted">{detail}</span></span>
    <span className={`relative h-5 w-9 shrink-0 rounded-full border transition ${checked ? 'border-[rgb(var(--accent)/0.75)] bg-[rgb(var(--accent)/0.42)]' : 'border-[rgb(var(--border)/0.75)] bg-black/25'}`}><span className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-[17px]' : 'translate-x-0.5'}`} /></span>
    <span className="w-5 text-right text-[8px] font-bold uppercase tracking-wide text-muted">{checked ? 'On' : 'Off'}</span>
  </button>;
}

/**
 * One home for presentation, devices and app-level actions. It is portalled so
 * game rows, preview panes and theme FX can never cover it.
 */
export default function AppControlMenu({ onOpenThemes, onOpenVisuals, onOpenControllers, onOpenMascot, onOpenSettings, onOpenChangelog, onCheckForUpdates, onOpenFeedback, onQuit, sidebarMode = false, sidebarExpanded = false, sidebarEnabled = false, onToggleSidebar }) {
  const [open, setOpen] = React.useState(false);
  const buttonRef = React.useRef(null);
  const panelRef = React.useRef(null);
  const [position, setPosition] = React.useState({ top: 56, left: 12 });

  const place = React.useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPosition(sidebarMode
      ? { top: Math.max(12, Math.min(window.innerHeight - 24, rect.top)), left: Math.max(12, Math.min(window.innerWidth - 350, rect.right + 8)) }
      : { top: Math.min(window.innerHeight - 24, rect.bottom + 6), left: Math.max(12, rect.left) });
  }, [sidebarMode]);
  const toggle = () => { if (!open) place(); setOpen(value => !value); };
  const choose = (action) => { setOpen(false); action?.(); };

  React.useEffect(() => {
    if (!open) return undefined;
    const outside = (event) => {
      if (!panelRef.current?.contains(event.target) && !buttonRef.current?.contains(event.target)) setOpen(false);
    };
    const escape = (event) => { if (event.key === 'Escape') setOpen(false); };
    window.addEventListener('resize', place);
    document.addEventListener('mousedown', outside);
    document.addEventListener('keydown', escape);
    return () => { window.removeEventListener('resize', place); document.removeEventListener('mousedown', outside); document.removeEventListener('keydown', escape); };
  }, [open, place]);

  return <div className={`relative z-[60] shrink-0 pointer-events-auto ${sidebarMode ? 'w-full' : ''}`}>
    <button
      ref={buttonRef}
      type="button"
      data-testid="app-control-menu-toggle"
      aria-label="Open NEO-LIB menu"
      aria-expanded={open}
      onPointerDown={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={toggle}
      className={`relative z-[61] h-9 w-9 rounded-lg border pointer-events-auto transition ${sidebarMode ? 'flex items-center justify-start gap-3 px-2.5' : 'grid place-items-center'} ${open ? 'border-[rgb(var(--accent)/0.85)] bg-[rgb(var(--accent)/0.15)] text-[rgb(var(--accent))] shadow-[0_0_16px_-5px_rgb(var(--accent))]' : 'border-[rgb(var(--border)/0.7)] bg-[rgb(var(--panel))] text-ink/85 hover:border-[rgb(var(--accent)/0.55)] hover:text-ink'}`}
      style={sidebarMode ? { width: '100%' } : undefined}
      title="NEO-LIB menu"
    >
      <Settings2 size={17} />
      {sidebarMode && <span className={`overflow-hidden whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.14em] transition-all ${sidebarExpanded ? 'max-w-20 opacity-100' : 'max-w-0 opacity-0'}`}>Menu</span>}
    </button>
    {open && renderForegroundPortal(
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.98 }} transition={{ duration: 0.14 }}
          style={{ position: 'fixed', top: position.top, left: position.left, background: 'rgb(var(--surface))' }}
          className="z-[10000] w-[min(338px,calc(100vw-24px))] overflow-hidden rounded-xl border border-[rgb(var(--border)/0.92)] shadow-2xl"
          data-testid="app-control-menu"
          onPointerDown={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="border-b border-[rgb(var(--border)/0.62)] bg-[rgb(var(--panel))] px-4 py-3">
            <div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-lg bg-[rgb(var(--accent)/0.13)] text-[rgb(var(--accent))]"><Sparkles size={14} /></span><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[rgb(var(--accent-2))]">NEO-LIB</p><p className="text-[11px] font-semibold text-ink">Control Center</p></div></div>
          </div>
          <MenuSection label="Modes">
            <MenuItem icon={<Tv2 size={15} />} label="TV Mode" detail="Controller-first fullscreen experience" disabled testid="app-menu-tv-mode" />
          </MenuSection>
          <div className="mx-3 h-px bg-[rgb(var(--border)/0.55)]" />
          <MenuSection label="Personalise">
            <MenuItem icon={<Palette size={15} />} label="Themes" detail="Choose NEO-LIB's overall atmosphere" onClick={() => choose(onOpenThemes)} testid="app-menu-themes" />
            <MenuItem icon={<Palette size={15} />} label="Custom theme" detail="Build and save a personal theme" disabled testid="app-menu-custom-theme" />
            <MenuItem icon={<SlidersHorizontal size={15} />} label="Visual Tweaks" detail="Library type, layout, texture, motion and FX" onClick={() => choose(onOpenVisuals)} testid="app-menu-visuals" />
            <MenuToggle icon={<PanelLeft size={15} />} label="Sidebar" detail="Move Home, Library, Wall and Tools into a left icon rail" checked={sidebarEnabled} onChange={onToggleSidebar} testid="app-menu-sidebar-toggle" />
          </MenuSection>
          <div className="mx-3 h-px bg-[rgb(var(--border)/0.55)]" />
          <MenuSection label="Devices">
            <MenuItem icon={<Gamepad2 size={15} />} label="Controllers" detail="Connected pads, live input and game routes" onClick={() => choose(onOpenControllers)} testid="app-menu-controllers" />
          </MenuSection>
          <div className="mx-3 h-px bg-[rgb(var(--border)/0.55)]" />
          <MenuSection label="NEO-LIB">
            <MenuItem icon={<UserRound size={15} />} label="Mascot" detail="Companion, warnings, voice and chat settings" onClick={() => choose(onOpenMascot)} testid="app-menu-mascot" />
            <MenuItem icon={<Settings2 size={15} />} label="Settings" detail="Startup, privacy, mascot, sound and data" onClick={() => choose(onOpenSettings)} testid="app-menu-settings" />
            <MenuItem icon={<Sparkles size={15} />} label="Patch notes" detail="See what changed in this version" onClick={() => choose(onOpenChangelog)} testid="app-menu-changelog" />
            <MenuItem icon={<RefreshCw size={15} />} label="Check for updates" detail="Check GitHub for a newer NEO-LIB release" onClick={() => choose(onCheckForUpdates)} testid="app-menu-check-update" />
            <MenuItem icon={<Lightbulb size={15} />} label="Help & feedback" detail="Report a bug, suggest an idea or send feedback" onClick={() => choose(onOpenFeedback)} testid="app-menu-feedback" />
          </MenuSection>
          <div className="mx-3 h-px bg-[rgb(var(--border)/0.55)]" />
          <div className="p-1.5"><MenuItem icon={<Power size={15} />} label="Quit NEO-LIB" detail="Closes the launcher; never closes a running game" onClick={() => choose(onQuit)} testid="app-menu-quit" danger /></div>
        </motion.div>
      )}
  </div>;
}
