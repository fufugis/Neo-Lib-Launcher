import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ExternalLink, X } from 'lucide-react';
import { wrapDealUrl } from '../lib/deals';

/**
 * FeaturedDealBanner — a slim 56px sponsored card that sits above the main
 * DealsBar. Rotates exclusively through Instant Gaming hot deals (the only
 * currently-paying affiliate source). Falls back gracefully to other deals
 * if no IG entries are present.
 *
 * Independently dismissible from the DealsBar — user can hide just this
 * banner without losing the bottom rotator.
 */
export default function FeaturedDealBanner({ settings = {}, onDismiss }) {
  const [items, setItems] = React.useState([]);
  const [idx, setIdx] = React.useState(0);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.api?.fetchDeals) return;
    let cancelled = false;
    window.api.fetchDeals().then((arr) => {
      if (cancelled || !Array.isArray(arr)) return;
      // Prefer Instant Gaming (paying affiliate). Fall back to Steam if none.
      const ig = arr.filter((d) => d.platform === 'instant-gaming');
      const pool = ig.length ? ig : arr.filter((d) => d.discount && d.discount >= 25);
      setItems(pool.slice(0, 10));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Rotate every 12s (slower than the main bar so the two don't change in sync)
  React.useEffect(() => {
    if (items.length < 2) return undefined;
    const t = setInterval(() => setIdx((i) => (i + 1) % items.length), 12000);
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
      data-testid="featured-deal-banner"
      className="relative z-20 flex h-[56px] shrink-0 items-stretch gap-2 border-t hairline px-3"
      style={{
        backgroundImage: 'linear-gradient(90deg, rgb(var(--accent-2)/0.10), rgb(var(--accent)/0.08) 60%, transparent)',
        backgroundColor: 'rgb(var(--surface) / 0.92)',
      }}
    >
      <AnimatePresence mode="wait">
        <motion.button
          key={d.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          onClick={open}
          className="group flex w-full items-center gap-3 rounded-md px-2 text-left transition-colors hover:bg-[rgb(var(--accent)/0.06)]"
          data-testid={`featured-deal-${d.platform}`}
        >
          {/* Cover */}
          <div className="h-10 w-[88px] shrink-0 overflow-hidden rounded hairline bg-surface/60">
            {d.image && (
              <img
                src={d.image}
                alt=""
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            )}
          </div>
          {/* Title + sub */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <Sparkles size={10} className="text-[rgb(var(--accent-2))]" />
              <span className="text-[9px] uppercase tracking-[0.22em] text-[rgb(var(--accent-2))]">
                Sponsored
              </span>
              <span className="text-[9px] uppercase tracking-[0.18em] text-muted/70">
                · {d.platform === 'instant-gaming' ? 'Instant Gaming' : d.subtitle}
              </span>
            </div>
            <div className="truncate text-[13px] font-semibold text-ink">{d.title}</div>
          </div>
          {/* Price chip */}
          <div className="flex shrink-0 items-center gap-2">
            {d.originalPrice && d.priceText !== d.originalPrice && (
              <span className="text-[10px] text-muted/60 line-through">{d.originalPrice}</span>
            )}
            <span
              className="rounded-full px-3 py-1 text-[12px] font-bold shadow-[0_0_12px_-3px_rgb(var(--accent))]"
              style={{
                backgroundImage: 'linear-gradient(90deg, rgb(var(--accent)) 0%, rgb(var(--accent-2)) 100%)',
                color: 'rgb(var(--surface))',
              }}
            >
              {d.priceText}
            </span>
            <ExternalLink size={11} className="text-muted/60 transition-colors group-hover:text-[rgb(var(--accent))]" />
          </div>
        </motion.button>
      </AnimatePresence>

      <button
        data-testid="featured-deal-dismiss"
        onClick={onDismiss}
        title="Hide featured banner (re-enable in Settings)"
        className="my-auto grid h-6 w-6 place-items-center rounded text-muted/70 hover:text-ink hover:bg-surface/60"
      >
        <X size={12} />
      </button>
    </div>
  );
}
