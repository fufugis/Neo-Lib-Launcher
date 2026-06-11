import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Tag, ExternalLink } from 'lucide-react';
import { wrapDealUrl } from '../lib/deals';

/**
 * DealsBar — 50px tall bar at the bottom of the window showing rotating deals.
 * Pulls from Epic free games + Steam specials via Electron IPC `fetchDeals`.
 * Affiliate ID (if set in Settings) is automatically wrapped into the link.
 * The bar is dismissible per-session; user can re-enable it from Settings.
 */
export default function DealsBar({ settings = {}, onClose }) {
  const [items, setItems] = React.useState([]);
  const [idx, setIdx] = React.useState(0);

  // Fetch once on mount
  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.api?.fetchDeals) return;
    let cancelled = false;
    window.api.fetchDeals().then((arr) => {
      if (!cancelled && Array.isArray(arr)) setItems(arr);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Rotate every 8s
  React.useEffect(() => {
    if (items.length < 2) return undefined;
    const t = setInterval(() => setIdx((i) => (i + 1) % items.length), 8000);
    return () => clearInterval(t);
  }, [items.length]);

  if (!items.length) return null;
  const d = items[idx];
  const url = wrapDealUrl(d.url, settings.affiliate || {});

  const open = () => {
    if (window.api?.openExternal) window.api.openExternal(url);
    else window.open(url, '_blank');
  };

  return (
    <div
      data-testid="deals-bar"
      className="relative z-20 flex h-[50px] shrink-0 items-center gap-3 border-t hairline px-4"
      style={{ backgroundColor: 'rgb(var(--surface) / 0.85)', backdropFilter: 'blur(10px) saturate(140%)' }}
    >
      {/* Sponsored label */}
      <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.22em] text-muted/80">
        <Tag size={9} /> Deal
      </div>

      {/* Rotating deal content */}
      <div className="relative flex-1 min-w-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.button
            key={d.id}
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -24, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            onClick={open}
            className="absolute inset-0 flex w-full items-center gap-3 text-left hover:bg-[rgb(var(--accent)/0.06)] rounded transition-colors px-1"
            data-testid={`deal-${d.platform}`}
          >
            <div className="h-9 w-16 shrink-0 overflow-hidden rounded hairline bg-surface/60">
              {d.image && <img src={d.image} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12px] font-semibold text-ink">{d.title}</div>
              <div className="truncate text-[10.5px] text-muted">{d.subtitle}</div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {d.originalPrice && d.priceText !== d.originalPrice && (
                <span className="text-[10px] text-muted/60 line-through">{d.originalPrice}</span>
              )}
              <span
                className={
                  'rounded-full px-2.5 py-1 text-[10.5px] font-bold ' +
                  (d.priceText === 'FREE'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-[rgb(var(--accent)/0.18)] text-[rgb(var(--accent))]')
                }
              >
                {d.priceText}
              </span>
              <ExternalLink size={11} className="text-muted/60" />
            </div>
          </motion.button>
        </AnimatePresence>
      </div>

      {/* Indicator dots */}
      <div className="hidden gap-1 sm:flex">
        {items.slice(0, Math.min(items.length, 6)).map((_, i) => (
          <span
            key={i}
            className="h-1 rounded-full transition-all"
            style={{
              width: i === idx % Math.min(items.length, 6) ? 12 : 4,
              background: i === idx % Math.min(items.length, 6) ? 'rgb(var(--accent))' : 'rgb(var(--border))',
            }}
          />
        ))}
      </div>

      <button
        data-testid="deals-bar-close"
        onClick={onClose}
        title="Hide deals bar (re-enable in Settings)"
        className="grid h-6 w-6 place-items-center rounded text-muted/70 hover:text-ink hover:bg-surface/60"
      >
        <X size={12} />
      </button>
    </div>
  );
}
