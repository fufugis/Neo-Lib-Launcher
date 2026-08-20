import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Flame, Plus, Sparkles, Shuffle, ChevronLeft, ChevronRight, LayoutGrid, Tag, ExternalLink } from 'lucide-react';
import { SHOWCASE_MODES, sortGamesForShowcase, formatPlaytime, formatRelative, cn } from '../lib/utils';
import { wrapDealUrl } from '../lib/deals';

const ICONS = {
  recent_added:  <Plus size={11} />,
  recent_played: <Clock size={11} />,
  most_played:   <Flame size={11} />,
  untouched:     <Sparkles size={11} />,
  random:        <Shuffle size={11} />,
};

export default function ShowcaseStrip({ games, mode, setMode, onSelect, selectedId, settings = {} }) {
  const sorted = React.useMemo(() => sortGamesForShowcase(games, mode).slice(0, 30), [games, mode]);
  const scrollRef = React.useRef(null);
  const scroll = (dir) => scrollRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });

  // Fetch a single deal for the inline tile
  const [deal, setDeal] = React.useState(null);
  React.useEffect(() => {
    if (settings.dealsEnabled === false) return undefined;
    if (typeof window === 'undefined' || !window.api?.fetchDeals) return undefined;
    let cancelled = false;
    window.api.fetchDeals().then((arr) => {
      if (cancelled || !Array.isArray(arr) || !arr.length) return;
      // Prefer Epic free games as the showcase tile (most attention-grabbing)
      setDeal(arr.find((d) => d.platform === 'epic') || arr[0]);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [settings.dealsEnabled]);

  if (games.length === 0) return null;

  return (
    <div
      data-testid="showcase-strip"
      className="relative isolate flex-shrink-0 overflow-hidden"
      style={{
        background:
          'linear-gradient(180deg, rgb(var(--panel)/0.4) 0%, rgb(var(--accent-soft)/0.25) 100%)',
      }}
    >
      {/* Flashy top divider — magenta → cyan gradient line with bloom */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgb(var(--accent)/0.9) 25%, rgb(var(--accent-2)/0.9) 75%, transparent 100%)',
          boxShadow:
            '0 0 12px rgb(var(--accent)/0.55), 0 0 24px rgb(var(--accent-2)/0.35)',
        }}
      />
      {/* Faint diagonal stripes for retro panel feel */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(135deg, currentColor 0 1px, transparent 1px 12px)',
          color: 'rgb(var(--accent))',
        }}
      />

      {/* Header */}
      <div className="relative flex items-center justify-between px-6 pt-3 pb-1.5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 pr-2 border-r border-[rgb(var(--border))]">
            <LayoutGrid size={12} className="text-[rgb(var(--accent-2))] neon-text-cyan" />
            <span className="font-display text-[10px] font-bold uppercase tracking-[0.32em] text-[rgb(var(--accent-2))] neon-text-cyan">
              Deck
            </span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {SHOWCASE_MODES.map((m) => (
              <button
                key={m.id}
                data-testid={`showcase-mode-${m.id}`}
                onClick={() => setMode(m.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-medium uppercase tracking-wider transition-all',
                  mode === m.id
                    ? 'bg-[rgb(var(--accent)/0.16)] text-ink hairline border-[rgb(var(--accent)/0.6)] shadow-[0_0_12px_-2px_rgb(var(--accent)/0.45)]'
                    : 'text-muted hover:text-ink'
                )}
              >
                <span className="text-[rgb(var(--accent))]">{ICONS[m.id]}</span>
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <ScrollBtn onClick={() => scroll(-1)}><ChevronLeft size={13} /></ScrollBtn>
          <ScrollBtn onClick={() => scroll(1)}><ChevronRight size={13} /></ScrollBtn>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="relative flex items-stretch gap-4 overflow-x-auto px-6 pb-3 pt-1.5 [scrollbar-width:thin]"
        style={{ scrollbarWidth: 'thin' }}
      >
        {(() => {
          // Bucket games into This Week / This Month / Long Ago based on the
          // timestamp that matches the current mode. Playtime modes bucket by
          // lastPlayedAt; add-based modes bucket by addedAt. Falls back to
          // addedAt so newer additions always appear.
          const now = Date.now();
          const WEEK  = 7  * 86400_000;
          const MONTH = 30 * 86400_000;
          const timestampFor = (g) => {
            if (mode === 'recent_played' || mode === 'most_played') return g.lastPlayedAt || g.addedAt || 0;
            return g.addedAt || g.lastPlayedAt || 0;
          };
          const buckets = { week: [], month: [], long: [] };
          for (const g of sorted) {
            const ts = timestampFor(g);
            const age = ts ? now - ts : Infinity;
            if (age <= WEEK)       buckets.week.push(g);
            else if (age <= MONTH) buckets.month.push(g);
            else                    buckets.long.push(g);
          }
          // v1.4.0 — "This week" is always ranked by most-played (regardless
          // of the current showcase mode). Games with no playtime fall to the
          // bottom by lastPlayedAt.
          buckets.week.sort((a, b) => {
            const pa = Number(a.playtime) || 0;
            const pb = Number(b.playtime) || 0;
            if (pb !== pa) return pb - pa;
            return (Number(b.lastPlayedAt) || 0) - (Number(a.lastPlayedAt) || 0);
          });
          const groups = [
            { key: 'week',  label: 'This week',  tone: 'accent',   size: 'lg', games: buckets.week,  showHoursBadge: true },
            { key: 'month', label: 'This month', tone: 'accent-2', size: 'md', games: buckets.month, showHoursBadge: true },
            { key: 'long',  label: 'Long ago',   tone: 'muted',    size: 'sm', games: buckets.long,  showHoursBadge: false },
          ];
          const nonEmpty = groups.filter((gr) => gr.games.length > 0);
          if (nonEmpty.length === 0) {
            return <div className="px-2 py-4 text-xs text-muted">Nothing here yet.</div>;
          }
          return (
            <>
              {deal && <DealTile key={`deal-${deal.id}`} deal={deal} affiliate={settings.affiliate || {}} />}
              {nonEmpty.map((gr, gi) => (
                <ShowcaseGroup
                  key={gr.key}
                  label={gr.label}
                  tone={gr.tone}
                  size={gr.size}
                  games={gr.games}
                  mode={mode}
                  showHoursBadge={gr.showHoursBadge}
                  onSelect={onSelect}
                  selectedId={selectedId}
                  showSeparator={gi > 0}
                />
              ))}
            </>
          );
        })()}
      </div>
    </div>
  );
}

function ShowcaseGroup({ label, tone, size, games, mode, showHoursBadge, onSelect, selectedId, showSeparator }) {
  const toneColor =
    tone === 'accent'   ? 'rgb(var(--accent))'   :
    tone === 'accent-2' ? 'rgb(var(--accent-2))' :
                          'rgb(var(--muted))';
  return (
    <div className="flex items-stretch gap-2">
      {showSeparator && (
        <span
          aria-hidden
          className="mx-1 w-px shrink-0 self-stretch"
          style={{ background: 'linear-gradient(180deg, transparent, rgb(var(--border))/0.9, transparent)' }}
        />
      )}
      <div className="flex flex-col gap-1.5">
        <div
          className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.24em]"
          style={{ color: toneColor, textShadow: `0 0 6px ${toneColor}55` }}
        >
          <span
            className="inline-block h-1 w-1 rounded-full"
            style={{ background: toneColor, boxShadow: `0 0 6px ${toneColor}` }}
          />
          {label}
          <span className="opacity-60">· {games.length}</span>
        </div>
        <div className="flex items-stretch gap-2">
          {games.map((g, i) => (
            <ShowcaseTile
              key={g.id}
              g={g}
              size={size}
              mode={mode}
              showHoursBadge={showHoursBadge}
              selected={selectedId === g.id}
              index={i}
              onClick={() => onSelect(g.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ScrollBtn({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="grid h-6 w-6 place-items-center rounded-md hairline text-muted hover:text-ink hover:border-[rgb(var(--accent)/0.4)] hover:bg-[rgb(var(--accent)/0.06)]"
    >
      {children}
    </button>
  );
}

function ShowcaseTile({ g, size, mode, showHoursBadge, selected, index, onClick }) {
  const stat = (() => {
    if (mode === 'most_played')  return g.playtime ? formatPlaytime(g.playtime) : '';
    if (mode === 'recent_played') return g.lastPlayedAt ? formatRelative(g.lastPlayedAt) : '';
    if (mode === 'recent_added')  return g.addedAt ? formatRelative(g.addedAt) : '';
    if (mode === 'untouched')     return g.addedAt ? formatRelative(g.addedAt) : '';
    return '';
  })();
  // v1.4.0 — hours-played badge on This Week & This Month tiles
  const hoursBadge = (showHoursBadge && Number(g.playtime) > 0)
    ? formatPlaytime(g.playtime)
    : '';
  const dims =
    size === 'lg' ? 'h-[72px] w-[128px]' :
    size === 'md' ? 'h-[56px] w-[92px]'  :
                    'h-[44px] w-[44px]';
  const isSm = size === 'sm';

  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.018, 0.15) }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      title={isSm ? `${g.name}${stat ? ' — ' + stat : ''}` : g.name}
      data-testid={`showcase-tile-${g.id}`}
      className={cn(
        'showcase-card group relative shrink-0 overflow-hidden rounded-md hairline glass-soft text-left',
        dims,
        selected ? 'ring-1 ring-[rgb(var(--accent))] shadow-[0_0_16px_-2px_rgb(var(--accent)/0.55)]' : ''
      )}
    >
      {(g.coverUrl || g.headerImage) ? (
        <img
          src={g.headerImage || g.coverUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-[rgb(var(--surface))]/70 text-[10px] font-bold uppercase text-muted">
          {g.name?.slice(0, 2)}
        </div>
      )}
      {!isSm && <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />}
      {/* v1.4.0 — hours-played badge for This Week / This Month tiles */}
      {hoursBadge && (
        <span
          className="absolute right-1 top-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold tabular-nums"
          style={{
            background: 'linear-gradient(135deg, rgb(var(--accent) / 0.9), rgb(var(--accent-2) / 0.9))',
            color: 'white',
            boxShadow: '0 0 6px rgba(0,0,0,0.5), 0 0 8px rgb(var(--accent) / 0.5)',
            textShadow: '0 1px 2px rgba(0,0,0,0.6)',
          }}
          data-testid={`hours-badge-${g.id}`}
        >
          {hoursBadge}
        </span>
      )}
      {!isSm && (
        <div className="absolute inset-0 flex flex-col justify-end p-1.5">
          <div className={cn(
            'truncate font-semibold text-white',
            size === 'lg' ? 'text-[11px]' : 'text-[10px]',
          )}>{g.name}</div>
          {stat && (
            <div className="truncate text-[9px] text-[rgb(var(--accent-2))]">{stat}</div>
          )}
        </div>
      )}
    </motion.button>
  );
}

function Tile({ g, mode, selected, index, onClick }) {
  const stat = (() => {
    if (mode === 'most_played') return g.playtime ? formatPlaytime(g.playtime) : 'Never played';
    if (mode === 'recent_played') return g.lastPlayedAt ? `Played ${formatRelative(g.lastPlayedAt)}` : 'Never played';
    if (mode === 'recent_added')  return g.addedAt ? `Added ${formatRelative(g.addedAt)}` : '—';
    if (mode === 'untouched')     return g.addedAt ? `Added ${formatRelative(g.addedAt)}` : 'Untouched';
    return '';
  })();

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ delay: Math.min(index * 0.018, 0.18) }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      data-testid={`showcase-tile-${g.id}`}
      className={cn(
        'showcase-card group relative h-[88px] w-[158px] shrink-0 overflow-hidden rounded-lg hairline glass-soft text-left',
        selected ? 'ring-1 ring-[rgb(var(--accent))] shadow-[0_0_18px_-2px_rgb(var(--accent)/0.55)]' : ''
      )}
    >
      {(g.coverUrl || g.headerImage) ? (
        <img
          src={g.headerImage || g.coverUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
        />
      ) : (
        <div className="absolute inset-0">
          <div className="synth-grid opacity-60" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-end p-2">
        <div className="truncate text-[11.5px] font-semibold text-white">{g.name}</div>
        {stat && (
          <div className="truncate text-[10px] text-[rgb(var(--accent-2))] neon-text-cyan">{stat}</div>
        )}
      </div>
    </motion.button>
  );
}


function DealTile({ deal, affiliate }) {
  const url = wrapDealUrl(deal.url, affiliate);
  const open = () => {
    if (typeof window !== 'undefined' && window.api?.openExternal) window.api.openExternal(url);
    else window.open(url, '_blank');
  };
  const isFree = deal.priceText === 'FREE';
  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.28 }}
      onClick={open}
      data-testid={`showcase-deal-${deal.platform}`}
      className={cn(
        'showcase-card group relative h-[72px] w-[128px] shrink-0 overflow-hidden rounded-md text-left',
        'ring-1 ring-[rgb(var(--accent)/0.55)]'
      )}
      style={{
        // Subtle sponsored shimmer border
        boxShadow: '0 0 14px -2px rgb(var(--accent) / 0.55), inset 0 0 0 1px rgb(var(--accent) / 0.4)',
      }}
    >
      {/* "Deal" ribbon */}
      <div
        className="absolute left-0 top-0 z-10 flex items-center gap-1 rounded-br-md px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wider"
        style={{ background: 'rgb(var(--accent))', color: 'rgb(var(--surface))' }}
      >
        <Tag size={8} /> Deal
      </div>
      {/* Price tag */}
      <div
        className={cn(
          'absolute right-1.5 top-1.5 z-10 rounded-full px-1.5 py-0.5 text-[9px] font-bold',
          isFree ? 'bg-emerald-500/90 text-black' : 'bg-black/70 text-white'
        )}
      >
        {deal.priceText}
      </div>

      {deal.image ? (
        <img src={deal.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
      ) : (
        <div className="absolute inset-0 bg-[rgb(var(--accent-soft))]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-end p-2">
        <div className="truncate text-[11.5px] font-semibold text-white">{deal.title}</div>
        <div className="flex items-center gap-1 truncate text-[10px] text-white/70">
          {deal.subtitle} <ExternalLink size={9} />
        </div>
      </div>
    </motion.button>
  );
}
