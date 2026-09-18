import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import NavButtonArtwork from '../NavButtonArtwork';

export const SideBtn = React.forwardRef(function SideBtn({ icon, label, labelStyle, onClick, testid, title }, ref) {
  return (
    <button
      ref={ref}
      data-testid={testid}
      onClick={onClick}
      title={title || label}
      className="library-toolbar-control group inline-flex items-center gap-1.5 rounded-md hairline px-3 h-8 text-[12px] font-semibold text-ink/90 hover:text-ink hover:border-[rgb(var(--accent)/0.62)] transition-all"
    >
      <span className="text-[rgb(var(--accent))] transition-transform group-hover:scale-110">{icon}</span>
      {label && <span className="overflow-hidden whitespace-nowrap" style={labelStyle}>{label}</span>}
    </button>
  );
});

export function TabPill({ label, icon, active, onClick, testid, big = false, badge = null, showLabel = true, labelStyle, decorationTheme, decorationOpacity }) {
  return (
    <button
      data-testid={testid}
      onClick={onClick}
      title={label}
      aria-pressed={active}
      className={cn(
        'neolib-nav-tab group relative inline-flex flex-1 min-w-0 items-center justify-center gap-1.5 rounded-lg transition-all overflow-visible',
        big ? 'px-3 h-11 text-[12px]' : 'px-2 h-9 text-[10.5px]',
        'font-bold uppercase tracking-[0.14em]',
        active
          ? 'text-ink'
          : 'text-ink/85 hover:text-ink'
      )}
      style={{
        // Navigation is always functional chrome, never transparent art.
        // Theme decoration is attached at the edge by CSS, behind this layer.
        background: active
          ? 'linear-gradient(180deg, rgb(var(--accent)/0.20) 0%, rgb(var(--accent)/0.07) 100%), rgb(var(--panel))'
          : 'rgb(var(--panel))',
        border: `1px solid ${active ? 'rgb(var(--accent)/0.6)' : 'rgb(var(--border)/0.55)'}`,
        boxShadow: active
          ? '0 0 16px -4px rgb(var(--accent)/0.55), inset 0 1px 0 rgb(255,255,255,0.05)'
          : 'inset 0 1px 0 rgb(255,255,255,0.03)',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'rgb(var(--panel))';
          e.currentTarget.style.borderColor = 'rgb(var(--accent)/0.45)';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'rgb(var(--panel))';
          e.currentTarget.style.borderColor = 'rgb(var(--border)/0.55)';
        }
      }}
    >
      <NavButtonArtwork theme={decorationTheme} opacity={decorationOpacity} active={active} />
      <span className="neolib-nav-content">
      <span
        className="grid h-5 w-5 shrink-0 place-items-center rounded transition-colors"
        style={{
          backgroundColor: active ? 'rgb(var(--accent)/0.2)' : 'transparent',
          color: active ? 'rgb(var(--accent))' : 'currentColor',
        }}
      >
        {icon}
      </span>
      {showLabel && (
        <span className="relative overflow-hidden whitespace-nowrap" style={labelStyle}>
          {label}
        </span>
      )}
      {/* Live badge — pulses when there's unseen news; also visible when tab isn't active */}
      </span>
      {badge != null && badge > 0 && (
        <motion.span
          animate={{ scale: [1, 1.15, 1], opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1.5 right-2 grid min-w-[16px] h-4 place-items-center rounded-full px-1 text-[9px] font-black text-white"
          style={{
            background: 'linear-gradient(135deg, #ff3b6b 0%, #ff6b95 100%)',
            boxShadow: '0 0 10px rgba(255,59,107,0.75)',
          }}
          data-testid="tab-news-badge"
        >
          {badge > 99 ? '99+' : badge}
        </motion.span>
      )}
      {active && (
        <motion.span
          layoutId="tab-underline"
          className="pointer-events-none absolute bottom-1 left-4 right-4 h-[2px] rounded-full"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgb(var(--accent)) 50%, transparent)',
            boxShadow: '0 0 10px rgb(var(--accent))',
          }}
        />
      )}
    </button>
  );
}

/* v1.6.4 — Launcher filter dropdown. Compact replacement for the 6-pill row.
   Uses a click-outside listener + Escape to close. */
const LAUNCHER_OPTIONS = [
  { id: 'all',   label: 'All launchers' },
  { id: 'steam', label: 'Steam' },
  { id: 'epic',  label: 'Epic' },
  { id: 'ea',    label: 'EA' },
  { id: 'gog',   label: 'GOG' },
  { id: 'ubisoft', label: 'Ubisoft' },
  { id: 'battlenet', label: 'Battle.net' },
  { id: 'riot', label: 'Riot' },
  { id: 'xbox', label: 'Xbox / Game Pass' },
  { id: 'rockstar', label: 'Rockstar' },
  { id: 'itch', label: 'itch.io' },
  { id: 'other', label: 'Other' },
];
export function LauncherDropdown({ value = 'all', onChange }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return undefined;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const k = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', h);
    document.addEventListener('keydown', k);
    return () => {
      document.removeEventListener('mousedown', h);
      document.removeEventListener('keydown', k);
    };
  }, [open]);
  const current = LAUNCHER_OPTIONS.find((o) => o.id === value) || LAUNCHER_OPTIONS[0];
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        data-testid="launcher-dropdown-toggle"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'inline-flex items-center gap-1 rounded-md hairline px-2.5 h-6 text-[10.5px] font-semibold tracking-wide transition-all',
          open || value !== 'all'
            ? 'text-ink border-[rgb(var(--accent-2)/0.78)]'
            : 'text-ink/85 hover:text-ink hover:border-[rgb(var(--accent)/0.62)]'
        )}
      >
        <ChevronDown size={10} className={cn('transition-transform', open && 'rotate-180')} />
        {current.label}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="library-toolbar-popover absolute left-0 top-full z-40 mt-1 w-40 rounded-md hairline shadow-2xl p-1"
            data-testid="launcher-dropdown-menu"
          >
            {LAUNCHER_OPTIONS.map((o) => (
              <button
                key={o.id}
                type="button"
                data-testid={`lp-${o.id}`}
                onClick={() => { onChange?.(o.id); setOpen(false); }}
                className={cn(
                  'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[11px] transition-colors',
                  o.id === value
                    ? 'bg-[rgb(var(--accent)/0.15)] text-ink'
                    : 'text-muted hover:text-ink hover:bg-[rgb(var(--accent)/0.08)]'
                )}
              >
                {o.id === value && <Check size={10} className="text-[rgb(var(--accent))]" />}
                <span className={o.id === value ? '' : 'ml-3.5'}>{o.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


