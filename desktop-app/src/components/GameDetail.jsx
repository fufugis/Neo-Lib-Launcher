import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, RefreshCw, Calendar, Award, Building2, Globe, FolderOpen,
  Tag, Sparkles, ChevronLeft, ChevronRight, Youtube, FileText, Wrench,
} from 'lucide-react';
import { cn, colorFromId } from '../lib/utils';
import { hoverThrottled, playLaunch } from '../lib/sound';

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
  onToggleCategory, fetching, settings = {},
}) {
  if (!game) return <EmptyState />;
  const bg = game.background || game.headerImage || game.coverUrl;
  // Hero parallax — subtle 3D tilt as mouse moves over the hero. CSS-only, no rerenders.
  const heroRef = React.useRef(null);
  const onHeroMove = React.useCallback((e) => {
    const el = heroRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;   // -0.5 .. 0.5
    const y = (e.clientY - r.top) / r.height - 0.5;
    // Max ±4° tilt + 4px shift — gentle, not nauseating
    el.style.setProperty('--hero-rx', `${(-y * 4).toFixed(2)}deg`);
    el.style.setProperty('--hero-ry', `${(x * 4).toFixed(2)}deg`);
    el.style.setProperty('--hero-tx', `${(x * 4).toFixed(1)}px`);
    el.style.setProperty('--hero-ty', `${(y * 4).toFixed(1)}px`);
  }, []);
  const onHeroLeave = React.useCallback(() => {
    const el = heroRef.current;
    if (!el) return;
    el.style.setProperty('--hero-rx', '0deg');
    el.style.setProperty('--hero-ry', '0deg');
    el.style.setProperty('--hero-tx', '0px');
    el.style.setProperty('--hero-ty', '0px');
  }, []);
  return (
    <motion.div
      key={game.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.28 }}
      className="relative flex h-full flex-1 flex-col overflow-y-auto"
    >
      {/* Unified hero section — banner image stretches from the very top down BEHIND
          the title block, action bar AND meta strip, fading cleanly into the About
          section below. The bars sit on top of the image with glass/blur. */}
      <div
        ref={heroRef}
        className="relative isolate"
        onMouseMove={onHeroMove}
        onMouseLeave={onHeroLeave}
        style={{ perspective: '1200px' }}
      >
        {/* Backdrop image — absolute, fills full hero area */}
        {bg ? (
          <motion.img
            key={bg}
            initial={{ scale: 1.06, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            src={bg}
            alt=""
            className="hero-parallax pointer-events-none absolute inset-0 h-full w-full object-cover"
            style={{
              transform:
                'perspective(1200px) ' +
                'rotateX(var(--hero-rx, 0deg)) ' +
                'rotateY(var(--hero-ry, 0deg)) ' +
                'translate3d(var(--hero-tx, 0px), var(--hero-ty, 0px), 0)',
            }}
          />
        ) : (
          <div className="pointer-events-none absolute inset-0">
            <div className="synth-grid" />
            <div className="synth-horizon" />
          </div>
        )}
        {/* Top cutoff fade — image starts cleanly below titlebar */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-14"
          style={{ background: 'linear-gradient(to bottom, rgb(var(--surface)) 0%, rgb(var(--surface)/0.6) 40%, transparent 100%)' }}
        />
        {/* Left vignette so title text is readable — darker, more focused */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'linear-gradient(to right, rgb(var(--surface)/0.92) 0%, rgb(var(--surface)/0.55) 30%, transparent 65%)' }}
        />
        {/* Bottom fade — image dissolves into ActionBar/MetaStrip+About below it */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24"
          style={{ background: 'linear-gradient(to bottom, transparent 0%, rgb(var(--surface)/0.78) 55%, rgb(var(--surface)) 100%)' }}
        />
        {/* Accent glow corner */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgb(var(--accent)/0.18),transparent_55%)]" />
        {settings.scanlinesEnabled !== false && <div className="scanlines pointer-events-none absolute inset-0 opacity-30" />}

        {/* Hero text block */}
        <HeroTitle game={game} />

        {/* Action bar — sits over backdrop, glass blur */}
        <ActionBar
          game={game}
          categories={categories}
          onLaunch={onLaunch}
          onRefetch={onRefetch}
          onRevealFolder={onRevealFolder}
          onToggleCategory={onToggleCategory}
          fetching={fetching}
          settings={settings}
        />

        {/* Meta strip — sits over backdrop, glass blur */}
        <MetaStrip game={game} />
      </div>

      <div className="px-8 py-6 space-y-7">
        <section>
          <h3 className="mb-3 text-[10px] uppercase tracking-[0.28em] text-muted">About</h3>
          <p className="max-w-4xl whitespace-pre-line text-[13.5px] leading-relaxed text-muted">
            {game.about ||
              game.shortDescription ||
              'No description yet. Press "Refresh info" to pull metadata online.'}
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

/* ---------- Hero title block (text only, sits over backdrop) ---------- */
function HeroTitle({ game }) {
  return (
    <div className="relative aspect-[16/3.2] w-full">
      <div className="absolute inset-0 flex items-end px-8 pb-3">
        <div className="max-w-3xl">
          <motion.div
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="mb-1.5 flex items-center gap-2 text-[9.5px] uppercase tracking-[0.32em] text-[rgb(var(--accent-2))] neon-text-cyan"
          >
            <span className="h-1 w-1 rounded-full bg-[rgb(var(--accent-2))]" />
            Now viewing
          </motion.div>
          <motion.h1
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 180 }}
            className="font-display text-[34px] font-extrabold leading-[1.02] tracking-tight neon-text"
            data-testid="detail-title"
            style={{ textShadow: '0 2px 24px rgb(var(--surface) / 0.95), 0 0 18px rgb(var(--accent) / 0.4)' }}
          >
            {game.name}
          </motion.h1>
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.18 }}
            className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10.5px]"
          >
            {(game.genres || []).slice(0, 5).map((g) => (
              <button
                key={g}
                onClick={() => openSearch(`${g} games`)}
                className="rounded-full px-2 py-0.5 text-muted hover:text-ink transition-colors"
                style={{
                  borderWidth: 1,
                  borderStyle: 'solid',
                  borderColor: 'rgb(var(--accent) / 0.4)',
                  backgroundColor: 'rgb(var(--surface) / 0.55)',
                  backdropFilter: 'blur(6px)',
                  color: 'rgb(var(--ink))',
                }}
                title={`Search "${g} games" on Google`}
              >
                {g}
              </button>
            ))}
            {game.releaseDate && <span className="text-muted/90">· {game.releaseDate}</span>}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/* ---------- (Hero is now inlined in GameDetail as backdrop+HeroTitle) ---------- */

function openSearch(query, engine = 'google') {
  const url = engine === 'youtube'
    ? 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query)
    : 'https://www.google.com/search?q=' + encodeURIComponent(query);
  if (typeof window !== 'undefined' && window.api?.openExternal) window.api.openExternal(url);
  else window.open(url, '_blank');
}

/* ---------- Action bar ---------- */
function ActionBar({ game, categories, onLaunch, onRefetch, onRevealFolder, onToggleCategory, fetching, settings = {} }) {
  const [catOpen, setCatOpen] = React.useState(false);
  const [catAnchor, setCatAnchor] = React.useState(null);
  const popRef = React.useRef(null);
  React.useEffect(() => {
    const close = (e) => popRef.current && !popRef.current.contains(e.target) && setCatOpen(false);
    if (catOpen) document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [catOpen]);

  return (
    <div className="relative z-10 flex flex-wrap items-center gap-2 border-y hairline px-8 py-3" style={{ backgroundColor: 'rgb(var(--surface) / 0.45)', backdropFilter: 'blur(14px) saturate(140%)' }}>
      <motion.button
        data-testid="detail-launch-btn"
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.03 }}
        onMouseEnter={() => { if (settings.soundsEnabled !== false) hoverThrottled(); }}
        onClick={() => { if (settings.soundsEnabled !== false) playLaunch(); onLaunch(game); }}
        className="neon group inline-flex items-center gap-2 rounded-full bg-[rgb(var(--accent))] px-5 py-2 text-[13px] font-bold tracking-wide text-[rgb(var(--surface))]"
      >
        <Play size={14} className="transition-transform group-hover:translate-x-0.5" />
        LAUNCH
      </motion.button>

      <button
        data-testid="detail-youtube-btn"
        onClick={() => openSearch(`${game.name} gameplay`, 'youtube')}
        title="Search YouTube for gameplay"
        className="inline-flex items-center gap-2 rounded-full hairline px-4 py-2 text-xs text-muted hover:text-[rgb(var(--accent-2))] hover:border-[rgb(var(--accent-2)/0.5)] transition-colors"
      >
        <Youtube size={13} />
        YouTube
      </button>

      <button
        data-testid="detail-patchnotes-btn"
        onClick={() => {
          const url = game.appid
            ? `https://store.steampowered.com/news/app/${game.appid}`
            : `https://www.google.com/search?q=${encodeURIComponent(game.name + ' patch notes')}`;
          if (typeof window !== 'undefined' && window.api?.openExternal) window.api.openExternal(url);
          else window.open(url, '_blank');
        }}
        title={game.appid ? 'Steam patch notes' : 'Search patch notes online'}
        className="inline-flex items-center gap-2 rounded-full hairline px-4 py-2 text-xs text-muted hover:text-[rgb(var(--accent-2))] hover:border-[rgb(var(--accent-2)/0.5)] transition-colors"
      >
        <FileText size={13} />
        Patch Notes
      </button>

      <button
        data-testid="detail-mods-btn"
        onClick={() => {
          const url = `https://www.nexusmods.com/games?keyword=${encodeURIComponent(game.name)}`;
          if (typeof window !== 'undefined' && window.api?.openExternal) window.api.openExternal(url);
          else window.open(url, '_blank');
        }}
        title="Find mods for this game on Nexus Mods"
        className="inline-flex items-center gap-2 rounded-full hairline px-4 py-2 text-xs text-muted hover:text-[rgb(var(--accent-2))] hover:border-[rgb(var(--accent-2)/0.5)] transition-colors"
      >
        <Wrench size={13} />
        Mods
      </button>

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

      {/* Add to category dropdown — portal'd to escape backdrop stacking context */}
      <div className="relative" ref={popRef}>
        <button
          data-testid="detail-category-btn"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setCatAnchor({ x: r.left, y: r.bottom + 4 });
            setCatOpen((v) => !v);
          }}
          className="inline-flex items-center gap-2 rounded-full hairline px-4 py-2 text-xs text-muted hover:text-ink hover:border-accent/40 transition-colors"
        >
          <Tag size={13} />
          Categories
        </button>
        {catOpen && catAnchor && createPortal(
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            onMouseDown={(e) => e.stopPropagation()}
            style={{ position: 'fixed', top: catAnchor.y, left: catAnchor.x, zIndex: 1000 }}
            className="w-60 overflow-hidden rounded-lg hairline glass shadow-2xl p-1.5"
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
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-[rgb(var(--accent)/0.10)]"
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
          </motion.div>,
          document.body
        )}
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
  const linkList = (label, arr, queryPrefix = '') =>
    arr && arr.length > 0 ? (
      <span className="space-x-1">
        {arr.slice(0, 3).map((x, i) => (
          <React.Fragment key={x + i}>
            <button
              onClick={() => openSearch(`${queryPrefix}${x}`)}
              className="text-ink hover:text-[rgb(var(--accent-2))] hover:underline underline-offset-2 transition-colors"
              title={`Search "${x}" on Google`}
            >
              {x}
            </button>
            {i < Math.min(arr.length, 3) - 1 && <span className="text-muted/60">,</span>}
          </React.Fragment>
        ))}
      </span>
    ) : (
      '—'
    );

  const items = [
    { icon: <Calendar size={12} />, label: 'Released', value: game.releaseDate ? (
      <button
        onClick={() => openSearch(`${game.name} release date`)}
        className="text-ink hover:text-[rgb(var(--accent-2))] hover:underline underline-offset-2"
      >
        {game.releaseDate}
      </button>
    ) : '—' },
    { icon: <Tag size={12} />, label: 'Genres', value: linkList('Genres', game.genres, '') },
    { icon: <Building2 size={12} />, label: 'Developer', value: linkList('Dev', game.developers, '') },
    { icon: <Building2 size={12} />, label: 'Publisher', value: linkList('Pub', game.publishers, '') },
  ];
  if (typeof game.metacritic === 'number')
    items.push({
      icon: <Award size={12} />,
      label: 'Metacritic',
      value: (
        <button
          onClick={() => openSearch(`${game.name} metacritic`)}
          className="text-ink hover:text-[rgb(var(--accent-2))] hover:underline"
        >
          {game.metacritic}
        </button>
      ),
    });
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
    <div className="relative z-10 grid grid-cols-2 gap-px border-b hairline sm:grid-cols-3 lg:grid-cols-6" style={{ backgroundColor: 'rgb(var(--border) / 0.35)' }}>
      {items.map((it) => (
        <div key={it.label} className="px-4 py-3" style={{ backgroundColor: 'rgb(var(--surface) / 0.55)', backdropFilter: 'blur(14px) saturate(140%)' }}>
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
