import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Tag, ExternalLink, Heart, Grid3x3 } from 'lucide-react';
import { wrapDealUrl } from '../lib/deals';

/**
 * DealsBar — 50px tall bar at the bottom of the window showing rotating deals.
 * Pulls from Epic free games + Steam specials + Instant Gaming hot deals via
 * Electron IPC `fetchDeals`. Affiliate ID is automatically wrapped into links.
 *
 * "View all" pill opens a small popover above the bar with every deal in a
 * scrollable grid — opt-in, hidden until clicked, so the bar stays subtle.
 *
 * The bar is dismissible per-session; re-enable from Settings.
 */
export default function DealsBar({ settings = {}, onClose, onDonate }) {
  const [items, setItems] = React.useState([]);
  const [idx, setIdx] = React.useState(0);
  const [allOpen, setAllOpen] = React.useState(false);

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

  const openDealUrl = (rawUrl) => {
    const wrapped = wrapDealUrl(rawUrl, settings.affiliate || {});
    if (window.api?.openExternal) window.api.openExternal(wrapped);
    else window.open(wrapped, '_blank');
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

      {/* View all — opt-in popover with every deal */}
      <button
        data-testid="deals-bar-view-all"
        onClick={() => setAllOpen((o) => !o)}
        title={`View all ${items.length} deals`}
        className={
          'flex items-center gap-1.5 rounded-full hairline px-2.5 h-7 text-[10.5px] transition-colors ' +
          (allOpen
            ? 'border-[rgb(var(--accent)/0.7)] bg-[rgb(var(--accent)/0.12)] text-ink'
            : 'text-muted hover:text-ink hover:border-[rgb(var(--accent)/0.5)] hover:bg-[rgb(var(--accent)/0.08)]')
        }
      >
        <Grid3x3 size={11} />
        <span className="hidden md:inline">All {items.length}</span>
      </button>

      <button
        data-testid="deals-bar-donate"
        onClick={onDonate}
        title="Buy KenLun a coffee — support NEO-LIB"
        className="flex items-center gap-1 rounded-full px-2.5 h-7 text-[10.5px] font-bold transition-colors"
        style={{ background: '#FFD140', color: '#000' }}
      >
        <Heart size={11} fill="#000" /> Tip
      </button>

      <button
        data-testid="deals-bar-close"
        onClick={onClose}
        title="Hide deals bar (re-enable in Settings)"
        className="grid h-6 w-6 place-items-center rounded text-muted/70 hover:text-ink hover:bg-surface/60"
      >
        <X size={12} />
      </button>

      {/* All-deals popover — opens above the bar, click outside to dismiss */}
      <AnimatePresence>
        {allOpen && (
          <>
            <div
              className="fixed inset-0 z-[58]"
              onClick={() => setAllOpen(false)}
              data-testid="deals-popover-backdrop"
            />
            <motion.div
              initial={{ y: 12, opacity: 0, scale: 0.97 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 12, opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="absolute bottom-[58px] right-4 z-[60] w-[min(420px,calc(100vw-2rem))] max-h-[60vh] overflow-hidden rounded-xl hairline shadow-2xl"
              style={{ backgroundColor: 'rgb(var(--panel) / 0.97)', backdropFilter: 'blur(14px) saturate(140%)' }}
              data-testid="deals-popover"
            >
              <div className="flex items-center justify-between border-b hairline px-3.5 py-2.5">
                <div className="flex items-center gap-2">
                  <Tag size={11} className="text-[rgb(var(--accent))]" />
                  <span className="font-display text-[11px] font-bold uppercase tracking-[0.18em]">
                    All deals · {items.length}
                  </span>
                </div>
                <button
                  data-testid="deals-popover-close"
                  onClick={() => setAllOpen(false)}
                  className="grid h-6 w-6 place-items-center rounded text-muted hover:text-ink hover:bg-surface/60"
                >
                  <X size={12} />
                </button>
              </div>
              <div className="max-h-[52vh] overflow-y-auto p-2.5 space-y-1.5">
                {items.map((it) => (
                  <button
                    key={it.id}
                    onClick={() => openDealUrl(it.url)}
                    data-testid={`deals-popover-item-${it.platform}`}
                    className="flex w-full items-center gap-2.5 rounded-lg hairline bg-surface/40 p-2 text-left transition-colors hover:border-[rgb(var(--accent)/0.5)] hover:bg-[rgb(var(--accent)/0.06)]"
                  >
                    <div className="h-10 w-16 shrink-0 overflow-hidden rounded hairline bg-surface/60">
                      {it.image && <img src={it.image} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12px] font-semibold text-ink">{it.title}</div>
                      <div className="truncate text-[10.5px] text-muted">{it.subtitle}</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {it.originalPrice && it.priceText !== it.originalPrice && (
                        <span className="text-[9.5px] text-muted/60 line-through">{it.originalPrice}</span>
                      )}
                      <span
                        className={
                          'rounded-full px-2 py-0.5 text-[10px] font-bold ' +
                          (it.priceText === 'FREE'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-[rgb(var(--accent)/0.18)] text-[rgb(var(--accent))]')
                        }
                      >
                        {it.priceText}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
