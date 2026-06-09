import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, RefreshCw, Calendar, Award, Building2, Globe, FolderOpen,
  Tag, Sparkles, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { cn, colorFromId } from '../lib/utils';

/**
 * GameDetail — fully horizontal, "seamless" layout:
 *   [ HUGE banner with title overlay ]
 *   [ Action bar: Launch · Refetch · Locate · Add to category … ]
 *   [ Inline meta strip: Released · Genres · Devs · Publisher · Metacritic · Website ]
 *   [ About text — full width ]
 *   [ Screenshot strip — full width carousel ]
 */
export default function GameDetail({
  game, categories, onLaunch, onRefetch, onRevealFolder,
  onToggleCategory, fetching,
}) {
  if (!game) return <EmptyState />;
  return (
    <motion.div
      key={game.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.28 }}
      className="relative flex h-full flex-1 flex-col overflow-y-auto"
    >
      <Hero game={game} />

      <ActionBar
        game={game}
        categories={categories}
        onLaunch={onLaunch}
        onRefetch={onRefetch}
        onRevealFolder={onRevealFolder}
        onToggleCategory={onToggleCategory}
        fetching={fetching}
      />

      <MetaStrip game={game} />

      <div className="px-8 py-6 space-y-7">
        <section>
          <h3 className="mb-3 text-[10px] uppercase tracking-[0.28em] text-muted">About</h3>
          <p className="max-w-4xl whitespace-pre-line text-[13.5px] leading-relaxed text-muted">
            {game.about ||
              game.shortDescription ||
              'No description yet. Press “Re-fetch info” to pull metadata online.'}
          </p>
        </section>

        {game.screenshots && game.screenshots.length > 0 && (
          <section>
            <h3 className="mb-3 text-[10px] uppercase tracking-[0.28em] text-muted">Screenshots</h3>
            <ScreenshotStrip shots={game.screenshots} />
          </section>
        )}

        <section className="text-[11px] text-muted/80">
          <span className="font-mono break-all">{game.exePath}</span>
          {game.appid && <span> · Steam {game.appid}</span>}
          {game.source && <span> · Source: {game.source}</span>}
        </section>
      </div>
    </motion.div>
  );
}

/* ---------- Hero ---------- */
function Hero({ game }) {
  const bg = game.background || game.headerImage || game.coverUrl;
  return (
    <div className="relative isolate aspect-[16/5.5] w-full overflow-hidden">
      {bg ? (
        <motion.img
          initial={{ scale: 1.08, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          src={bg}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0">
          <div className="synth-grid" />
          <div className="synth-horizon" />
        </div>
      )}
      {/* Multi-layer gradient for legibility + synthwave vibe */}
      <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-surface/85 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgb(var(--accent)/0.18),transparent_55%)]" />
      <div className="scanlines absolute inset-0 opacity-40" />

      <div className="absolute inset-0 flex items-end px-8 pb-7">
        <div className="max-w-3xl">
          <motion.div
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-[rgb(var(--accent-2))] neon-text-cyan"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[rgb(var(--accent-2))]" />
            Now viewing
          </motion.div>
          <motion.h1
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 180 }}
            className="font-display text-[42px] font-extrabold leading-[1.05] tracking-tight neon-text"
            data-testid="detail-title"
          >
            {game.name}
          </motion.h1>
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.18 }}
            className="mt-3 flex flex-wrap items-center gap-2 text-[11px]"
          >
            {(game.genres || []).slice(0, 5).map((g) => (
              <span
                key={g}
                className="rounded-full hairline px-2.5 py-1 text-muted"
                style={{ borderColor: 'rgb(var(--accent) / 0.4)', color: 'rgb(var(--ink))' }}
              >
                {g}
              </span>
            ))}
            {game.releaseDate && (
              <span className="text-muted/80">· {game.releaseDate}</span>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Action bar ---------- */
function ActionBar({ game, categories, onLaunch, onRefetch, onRevealFolder, onToggleCategory, fetching }) {
  const [catOpen, setCatOpen] = React.useState(false);
  const popRef = React.useRef(null);
  React.useEffect(() => {
    const close = (e) => popRef.current && !popRef.current.contains(e.target) && setCatOpen(false);
    if (catOpen) document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [catOpen]);

  return (
    <div className="sticky top-0 z-10 -mt-px flex flex-wrap items-center gap-2 border-y hairline glass px-8 py-3">
      <motion.button
        data-testid="detail-launch-btn"
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.03 }}
        onClick={() => onLaunch(game)}
        className="neon group inline-flex items-center gap-2 rounded-full bg-[rgb(var(--accent))] px-5 py-2 text-[13px] font-bold tracking-wide text-[rgb(var(--surface))]"
      >
        <Play size={14} className="transition-transform group-hover:translate-x-0.5" />
        LAUNCH
      </motion.button>

      <button
        data-testid="detail-refetch-btn"
        onClick={() => onRefetch(game)}
        disabled={fetching}
        className="neon-cyan inline-flex items-center gap-2 rounded-full bg-panel/60 hairline px-4 py-2 text-xs text-ink hover:text-[rgb(var(--accent-2))] disabled:opacity-50 transition-colors"
      >
        <RefreshCw size={13} className={fetching ? 'animate-spin' : ''} />
        {fetching ? 'Fetching…' : 'Re-fetch info'}
      </button>

      <button
        data-testid="detail-reveal-btn"
        onClick={() => onRevealFolder(game)}
        className="inline-flex items-center gap-2 rounded-full hairline px-4 py-2 text-xs text-muted hover:text-ink hover:border-accent/40 transition-colors"
      >
        <FolderOpen size={13} />
        Locate
      </button>

      {/* Add to category dropdown */}
      <div className="relative" ref={popRef}>
        <button
          data-testid="detail-category-btn"
          onClick={() => setCatOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-full hairline px-4 py-2 text-xs text-muted hover:text-ink hover:border-accent/40 transition-colors"
        >
          <Tag size={13} />
          Categories
        </button>
        <AnimatePresence>
          {catOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.96 }}
              className="absolute left-0 top-full z-30 mt-1 w-60 overflow-hidden rounded-lg hairline glass p-1.5"
            >
              {categories.length === 0 && (
                <div className="px-2 py-3 text-xs text-muted">No categories yet. Create one in the sidebar.</div>
              )}
              {categories.map((c) => {
                const has = (game.categoryIds || []).includes(c.id);
                return (
                  <button
                    key={c.id}
                    data-testid={`detail-cat-toggle-${c.id}`}
                    onClick={() => onToggleCategory(game, c.id)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-accent/10"
                  >
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ background: colorFromId(c.colorId) }}
                    />
                    <span className="flex-1 truncate">{c.name}</span>
                    <span className={cn('text-[10px]', has ? 'text-[rgb(var(--accent))]' : 'text-muted/60')}>
                      {has ? '✓' : ''}
                    </span>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="ml-auto flex items-center gap-2 text-[11px] text-muted">
        {(game.categoryIds || []).slice(0, 4).map((cid) => {
          const c = categories.find((x) => x.id === cid);
          if (!c) return null;
          return (
            <span
              key={cid}
              className="inline-flex items-center gap-1.5 rounded-full hairline px-2 py-0.5"
              style={{ borderColor: colorFromId(c.colorId) + '88' }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: colorFromId(c.colorId) }} />
              {c.name}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Inline meta strip ---------- */
function MetaStrip({ game }) {
  const items = [
    { icon: <Calendar size={12} />, label: 'Released', value: game.releaseDate || '—' },
    { icon: <Tag size={12} />, label: 'Genres', value: (game.genres || []).join(', ') || '—' },
    { icon: <Building2 size={12} />, label: 'Developer', value: (game.developers || []).join(', ') || '—' },
    { icon: <Building2 size={12} />, label: 'Publisher', value: (game.publishers || []).join(', ') || '—' },
  ];
  if (typeof game.metacritic === 'number')
    items.push({ icon: <Award size={12} />, label: 'Metacritic', value: String(game.metacritic) });
  if (game.website)
    items.push({
      icon: <Globe size={12} />,
      label: 'Website',
      value: (
        <button
          onClick={() => window.api?.openExternal(game.website)}
          className="text-[rgb(var(--accent-2))] hover:underline"
        >
          Open ↗
        </button>
      ),
    });
  return (
    <div className="grid grid-cols-2 gap-px border-b hairline bg-[rgb(var(--border))]/40 sm:grid-cols-3 lg:grid-cols-6">
      {items.map((it) => (
        <div key={it.label} className="bg-panel/40 px-4 py-3">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted/90">
            <span className="text-[rgb(var(--accent))]">{it.icon}</span>
            {it.label}
          </div>
          <div className="truncate text-[12.5px] text-ink" title={typeof it.value === 'string' ? it.value : ''}>
            {it.value}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Screenshots ---------- */
function ScreenshotStrip({ shots }) {
  const [idx, setIdx] = React.useState(0);
  return (
    <div>
      <div className="relative overflow-hidden rounded-xl hairline aspect-[21/9] bg-panel/40">
        <AnimatePresence mode="wait">
          <motion.img
            key={shots[idx]}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.32 }}
            src={shots[idx]}
            className="h-full w-full object-cover"
          />
        </AnimatePresence>
        <button
          onClick={() => setIdx((i) => (i - 1 + shots.length) % shots.length)}
          className="absolute left-3 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full glass hairline text-ink hover:text-[rgb(var(--accent-2))] hover:border-accent/40"
        >
          <ChevronLeft size={15} />
        </button>
        <button
          onClick={() => setIdx((i) => (i + 1) % shots.length)}
          className="absolute right-3 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full glass hairline text-ink hover:text-[rgb(var(--accent-2))] hover:border-accent/40"
        >
          <ChevronRight size={15} />
        </button>
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {shots.map((s, i) => (
          <button
            key={s}
            onClick={() => setIdx(i)}
            className={cn(
              'h-16 w-28 shrink-0 overflow-hidden rounded-md hairline transition-all',
              idx === i ? 'ring-2 ring-[rgb(var(--accent))]' : 'opacity-60 hover:opacity-100'
            )}
          >
            <img src={s} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- Empty state ---------- */
function EmptyState() {
  return (
    <div className="relative grid h-full flex-1 place-items-center overflow-hidden">
      <div className="synth-grid" />
      <div className="synth-horizon" />
      <div className="scanlines absolute inset-0 opacity-50" />
      <div className="relative z-10 max-w-md text-center px-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 220 }}
          className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl hairline neon"
        >
          <Sparkles size={20} className="text-[rgb(var(--accent))]" />
        </motion.div>
        <h2 className="font-display text-3xl font-extrabold tracking-tight neon-text">NEO-LIB</h2>
        <p className="mt-3 text-sm text-muted">
          Your retro game vault. Add an .exe, run the Wizard, or drop games into custom categories.
        </p>
      </div>
    </div>
  );
}
