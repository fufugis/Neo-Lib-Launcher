import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, RefreshCw, Calendar, Award, Building2, Download, Globe, FolderOpen,
  Tag, Sparkles, ChevronLeft, ChevronRight, ChevronDown, Youtube, FileText, Wrench, Wand2, ExternalLink, Star, ArchiveRestore, ImageIcon,
} from 'lucide-react';
import { cn, colorFromId } from '../lib/utils';
import { genreDisplayGroups } from '../lib/genreTaxonomy';
import { hoverThrottled, playLaunch } from '../lib/sound';
import UpdateHistoryModal from './UpdateHistoryModal';

/**
 * GameDetail — fully horizontal, "seamless" layout:
 *   [ HUGE banner with title overlay ]
 *   [ Launch + compact action menu ]
 *   [ Library-hugging information column | richer source-owned gallery ]
 *   [ Calm, readable game details + genre identity ]
 */
export default function GameDetail({
  game, categories, onLaunch, onLaunchError, onRefetch, onRevealFolder,
  onToggleCategory, onCustomize, onUpdateGame, onOpenSaveManager, onLocateManagedTool, onInstallManagedTool, managedToolInstalling = false, fetching, settings = {},
}) {
  if (!game) return <EmptyState />;
  const bg = game.background || game.headerImage || game.coverUrl;
  // Hero parallax — subtle 3D tilt as mouse moves over the hero. CSS-only, no rerenders.
  const heroRef = React.useRef(null);
  // Hero auto-brighten — sample the loaded image's average luminance. If it's
  // too dark to read text against, apply a CSS brightness/contrast lift on the
  // <img> AND a darker scrim on top. Avoids the "Cyberpunk poster" problem
  // where a near-black banner makes the title invisible.
  const [heroFilter, setHeroFilter] = React.useState(null);
  const onHeroLoad = React.useCallback((e) => {
    const img = e.currentTarget;
    try {
      const cv = document.createElement('canvas');
      const W = (cv.width = 16);
      const H = (cv.height = 16);
      const ctx = cv.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, W, H);
      const d = ctx.getImageData(0, 0, W, H).data;
      let sum = 0;
      for (let i = 0; i < d.length; i += 4) {
        // Rec. 709 luminance
        sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
      }
      const avg = sum / (W * H); // 0..255
      // Below 70 → too dark; lift brightness/contrast.
      // Below 45 → very dark; stronger lift.
      if (avg < 45) setHeroFilter('brightness(1.45) contrast(1.08) saturate(1.1)');
      else if (avg < 70) setHeroFilter('brightness(1.22) contrast(1.05)');
      else if (avg > 200) setHeroFilter('brightness(0.92) contrast(1.04)'); // ultra-bright covers (white anime keyart) get a tiny dim so text reads
      else setHeroFilter(null);
    } catch { /* CORS or tainted canvas — skip silently */ }
  }, []);
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
      className="relative flex h-full flex-1 flex-col overflow-hidden"
    >
      {/* Unified hero section — banner image stretches from the very top down BEHIND
          the title block, action bar AND meta strip, fading cleanly into the About
          section below. The bars sit on top of the image with glass/blur.
          Height reduced by ~35% (aspect 16:2.1 vs old 16:3.2) so the two
          content panels below get more room. */}
      <div
        ref={heroRef}
        className="relative isolate shrink-0"
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
            crossOrigin="anonymous"
            onLoad={onHeroLoad}
            className="hero-parallax pointer-events-none absolute inset-0 h-full w-full object-cover"
            style={{
              transform:
                'perspective(1200px) ' +
                'rotateX(var(--hero-rx, 0deg)) ' +
                'rotateY(var(--hero-ry, 0deg)) ' +
                'translate3d(var(--hero-tx, 0px), var(--hero-ty, 0px), 0)',
              filter: heroFilter || undefined,
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
        <HeroTitle game={game} onUpdateGame={onUpdateGame} />

        {/* Action bar — sits over backdrop, glass blur */}
        <ActionBar
          game={game}
          categories={categories}
          onLaunch={onLaunch}
          onLaunchError={onLaunchError}
          onRefetch={onRefetch}
          onRevealFolder={onRevealFolder}
          onToggleCategory={onToggleCategory}
          onCustomize={onCustomize}
          onOpenSaveManager={onOpenSaveManager}
          onLocateManagedTool={onLocateManagedTool}
          onInstallManagedTool={onInstallManagedTool}
          managedToolInstalling={managedToolInstalling}
          fetching={fetching}
          settings={settings}
        />

      </div>

      {/* Preview stays anchored to Library: reading stays left, while verified
          game artwork has its own fuller gallery on the right. */}
      <div className="flex min-h-0 flex-1 justify-start overflow-y-auto px-3 py-5 sm:px-4 sm:py-6">
        <section
          className="min-h-min w-full max-w-none rounded-2xl border border-[rgb(var(--border)/0.88)] bg-[rgb(var(--panel)/0.78)] px-4 py-4 shadow-[0_28px_80px_-52px_rgba(0,0,0,.96)] backdrop-blur-xl sm:px-6 sm:py-5"
          data-testid="game-text-panel"
        >
          <ManagedToolSetup game={game} onLocate={onLocateManagedTool} onInstall={onInstallManagedTool} installing={managedToolInstalling} />
          <UpdateAvailablePill game={game} />
          <LatestNewsPill game={game} />
           <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(460px,560px)]">
            <div className="min-w-0">
              <GameStory game={game} profile={game.genreProfile} />
              <DetailList game={game} />
              <div className="mt-5 rounded-xl border border-[rgb(var(--border)/0.56)] bg-[rgb(var(--surface)/0.38)] px-3 py-2.5 text-[10.5px] text-muted/75 break-all font-mono">
                {game.exePath}
                {game.appid && <span className="block mt-0.5">Steam App ID · {game.appid}</span>}
                {game.source && <span className="block mt-0.5">Source · {game.source}</span>}
              </div>
              <SteamManifestLine game={game} />
            </div>
            <aside className="min-w-0 space-y-5 xl:sticky xl:top-3">
              <GameMediaGallery game={game} />
            </aside>
          </div>
        </section>
      </div>
    </motion.div>
  );
}

/**
 * An editorial, source-owned reading treatment for the fetched description.
 * Images live in the dedicated gallery beside this readable prose rather than
 * interrupting the description. NEO-LIB never fetches unrelated or generated
 * imagery for a library entry.
 */
function GameStory({ game, profile }) {
  const description = game.about || game.shortDescription || '';
  const paragraphs = description
    .split(/\n{2,}|(?<=[.!?])\s+(?=[A-Z][^.!?]{20,}[.!?])/)
    .map((entry) => entry.trim())
    .filter(Boolean);
  const fallback = 'No description yet. Re-fetch info to ask NEO-LIB’s source resolver for official game details.';

  return (
    <section className="overflow-hidden rounded-xl border border-[rgb(var(--border)/0.72)] bg-[linear-gradient(145deg,rgb(var(--panel)/0.34),rgb(var(--surface)/0.14))]" data-testid="game-story-panel">
      <div className="flex items-center justify-between gap-3 border-b border-[rgb(var(--border)/0.55)] px-3.5 py-2.5">
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.28em] text-muted">About this game</h3>
          <p className="mt-0.5 text-[10px] text-muted/70">A closer look at your library entry</p>
        </div>
        {game.releaseDate && <span className="shrink-0 rounded-full border border-[rgb(var(--border)/0.55)] bg-[rgb(var(--surface)/0.24)] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">{game.releaseDate}</span>}
      </div>

      <div className="grid items-start gap-4 px-3.5 py-3.5 sm:grid-cols-[minmax(0,1fr)_190px]">
        {/* The prose has its own capped column: it may never flow behind the
            Game Identity panel or continue beneath its lower edge. */}
        <div className="min-w-0 space-y-3">
          {paragraphs.length ? paragraphs.map((paragraph, index) => (
            <p key={`${game.id}-story-${index}`} className="whitespace-pre-line text-[13.5px] leading-7 text-muted [text-wrap:pretty]">{paragraph}</p>
          )) : <p className="text-[13px] leading-7 text-muted/80">{fallback}</p>}
        </div>
        <GenreProfile profile={profile} fallbackGenres={game.genres || []} embedded />
      </div>
    </section>
  );
}

function GameMediaGallery({ game }) {
  const media = [...new Set([game.headerImage, game.background, game.hero, ...(game.screenshots || []), game.coverUrl, game.cover].filter(Boolean))].slice(0, 8);
  const [active, setActive] = React.useState(0);
  React.useEffect(() => setActive(0), [media.join('|')]);
  const current = media[active] || media[0];
  if (!current) return <section className="rounded-xl border border-[rgb(var(--border)/0.72)] bg-[rgb(var(--panel)/0.26)] p-4 text-center text-[11px] text-muted"><ImageIcon className="mx-auto mb-2 text-[rgb(var(--accent))]" size={18} /><b className="block text-ink">No game media yet</b><span className="mt-1 block">Refresh info or add screenshots in Customize.</span></section>;
  return (
    <section className="overflow-hidden rounded-xl border border-[rgb(var(--border)/0.72)] bg-[rgb(var(--panel)/0.3)]" data-testid="game-media-gallery">
      <div className="flex items-center justify-between border-b border-[rgb(var(--border)/0.55)] px-3.5 py-2.5"><div><h3 className="text-[10px] font-bold uppercase tracking-[0.28em] text-muted">Game media</h3><p className="mt-0.5 text-[10px] text-muted/70">{media.length} verified image{media.length === 1 ? '' : 's'}</p></div><span className="rounded-full border border-[rgb(var(--border)/0.55)] px-2 py-1 text-[9px] font-semibold text-muted">{active + 1} / {media.length}</span></div>
      <div className="group relative aspect-[16/10] overflow-hidden bg-[rgb(var(--surface)/0.35)]">
        <motion.img key={current} initial={{ opacity: 0.72, scale: 1.012 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.28 }} src={current} alt={`${game.name} game artwork`} className="h-full w-full object-cover" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgb(var(--surface)/0.30),transparent_36%,rgb(var(--surface)/0.24))]" />
      </div>
      {media.length > 1 && <div className="grid grid-cols-4 gap-1.5 border-t border-[rgb(var(--border)/0.45)] p-2">{media.map((url, index) => <button key={url} type="button" onClick={() => setActive(index)} className={`aspect-[16/10] overflow-hidden rounded-md border transition ${index === active ? 'border-[rgb(var(--accent))] opacity-100 shadow-[0_0_12px_-4px_rgb(var(--accent))]' : 'border-transparent opacity-58 hover:opacity-95'}`} aria-label={`Show image ${index + 1} of ${media.length}`}><img src={url} alt="" className="h-full w-full object-cover" /></button>)}</div>}
    </section>
  );
}

function DetailList({ game }) {
  const rows = [];
  if (game.developers?.length) rows.push({ icon: <Building2 size={13} />, label: 'Developer', value: game.developers.join(', ') });
  if (game.publishers?.length && game.publishers.join() !== (game.developers || []).join()) rows.push({ icon: <Building2 size={13} />, label: 'Publisher', value: game.publishers.join(', ') });
  if (game.releaseDate) rows.push({ icon: <Calendar size={13} />, label: 'Released', value: game.releaseDate });
  if (game.metacritic) rows.push({ icon: <Award size={13} />, label: 'Metacritic', value: String(game.metacritic) });
  if (game.website) rows.push({ icon: <Globe size={13} />, label: 'Website', value: 'Open official site', action: () => window.api?.openExternal(game.website) });
  if (!rows.length) return null;
  return (
    <section className="mt-5 overflow-hidden rounded-xl border border-[rgb(var(--border)/0.7)] bg-[rgb(var(--surface)/0.2)]" data-testid="game-detail-list">
      <div className="border-b border-[rgb(var(--border)/0.55)] px-3.5 py-2 text-[9px] font-bold uppercase tracking-[0.24em] text-muted">Game details</div>
      <div className="divide-y divide-[rgb(var(--border)/0.45)]">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[22px_92px_minmax(0,1fr)] items-center gap-2 px-3.5 py-2.5 text-[11.5px]">
            <span className="text-[rgb(var(--accent))]">{row.icon}</span>
            <span className="font-semibold text-muted">{row.label}</span>
            {row.action ? (
              <button onClick={row.action} className="justify-self-start text-[rgb(var(--accent-2))] hover:underline">{row.value} ↗</button>
            ) : <span className="truncate text-ink" title={row.value}>{row.value}</span>}
          </div>
        ))}
      </div>
    </section>
  );
}

function GalleryBox({ shots }) {
  const [active, setActive] = React.useState(0);
  React.useEffect(() => { setActive(0); }, [shots?.length]);
  if (!shots || shots.length === 0) {
    return (
      <div className="grid h-full w-full place-items-center rounded-md hairline bg-surface/30 text-muted/60">
        <div className="flex flex-col items-center gap-1 text-[11px]">
          <span className="text-[24px] opacity-50">⚐</span>
          <span>No screenshots yet</span>
          <span className="text-[10px] opacity-70">Refresh info or paste URLs in Edit Metadata</span>
        </div>
      </div>
    );
  }
  const current = shots[active] || shots[0];
  return (
    <>
      {/* Big preview */}
      <div className="relative flex-1 min-h-0 overflow-hidden rounded-md hairline bg-surface/40">
        <motion.img
          key={current}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
          src={current}
          alt=""
          className="h-full w-full object-cover"
          data-testid="gallery-main"
        />
      </div>
      {/* Thumbnail strip — clickable to swap */}
      {shots.length > 1 && (
        <div className="flex shrink-0 gap-1.5 overflow-x-auto pb-0.5">
          {shots.map((s, i) => (
            <button
              key={s + i}
              onClick={() => setActive(i)}
              data-testid={`gallery-thumb-${i}`}
              className={cn(
                'group relative h-14 w-24 shrink-0 overflow-hidden rounded-md transition-all',
                i === active
                  ? 'ring-2 ring-[rgb(var(--accent))] ring-offset-1 ring-offset-[rgb(var(--surface))] opacity-100'
                  : 'opacity-55 hover:opacity-90'
              )}
            >
              <img src={s} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </>
  );
}

/* ---------- Hero title block (text only, sits over backdrop) ---------- */
function HeroTitle({ game, onUpdateGame }) {
  return (
    <div className="relative aspect-[16/2.1] w-full">
      <div className="absolute inset-0 flex items-end px-8 pb-3">
        <div className="max-w-3xl">
          <motion.div
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="mb-1.5 flex items-center gap-3 text-[9.5px] uppercase tracking-[0.32em] text-[rgb(var(--accent-2))] neon-text-cyan"
          >
            <span className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-[rgb(var(--accent-2))]" />
              My rating
            </span>
            <StarRating
              value={Number(game.rating) || 0}
              onChange={(v) => onUpdateGame?.(game.id, { rating: v })}
            />
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
          {game.releaseDate && (
            <motion.div
              initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.18 }}
              className="mt-2 text-[10px] font-medium uppercase tracking-[0.18em] text-muted"
            >
              Released · {game.releaseDate}
            </motion.div>
          )}
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
function ActionBar({ game, categories, onLaunch, onLaunchError, onRefetch, onRevealFolder, onToggleCategory, onCustomize, onOpenSaveManager, onLocateManagedTool, onInstallManagedTool, managedToolInstalling, fetching, settings = {} }) {
  const [catOpen, setCatOpen] = React.useState(false);
  const [catAnchor, setCatAnchor] = React.useState(null);
  const popRef = React.useRef(null);
  React.useEffect(() => {
    const close = (e) => popRef.current && !popRef.current.contains(e.target) && setCatOpen(false);
    if (catOpen) document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [catOpen]);

  return (
    <div className="special-control-surface relative z-10 flex flex-wrap items-center gap-3 border-y hairline px-6 py-3" style={{ backgroundColor: 'rgb(var(--surface) / 0.45)', backdropFilter: 'blur(14px) saturate(140%)' }}>
      <motion.button
        data-testid="detail-launch-btn"
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.03 }}
        onMouseEnter={() => { if (settings.soundsEnabled !== false) hoverThrottled(); }}
        disabled={game.managedTool && game.availability !== 'installed'}
        data-neolib-launch="true"
        onClick={async (event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const launchOrigin = { x: rect.left + (rect.width / 2), y: rect.top + (rect.height / 2) };
          if (!window.api?.armGameLaunch) {
            if (settings.soundsEnabled !== false) playLaunch();
            onLaunch(game, '', launchOrigin);
            return;
          }
          const armed = await window.api?.armGameLaunch?.();
          if (!armed?.ok) { onLaunchError?.(armed?.error || 'Launch safety could not verify that click. Please try again.'); return; }
          if (settings.soundsEnabled !== false) playLaunch();
          onLaunch(game, armed.token, launchOrigin);
        }}
        className="neon group inline-flex items-center gap-2 rounded-full bg-[rgb(var(--accent))] px-5 py-2 text-[13px] font-bold tracking-wide text-[rgb(var(--surface))] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Play size={14} className="transition-transform group-hover:translate-x-0.5" />
        {game.managedTool && game.availability !== 'installed' ? 'SET UP REQUIRED' : 'LAUNCH'}
      </motion.button>

      {game.managedTool && game.availability !== 'installed' && <ManagedToolMenu game={game} onLocate={onLocateManagedTool} onInstall={onInstallManagedTool} installing={managedToolInstalling} />}

      <div className="detail-action-menu flex flex-wrap items-center gap-1 rounded-xl border border-[rgb(var(--border)/0.75)] bg-[rgb(var(--surface)/0.45)] p-1" aria-label="Game actions">
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
        data-testid="detail-customize-btn"
        onClick={() => onCustomize?.(game)}
        title="Set custom cover, icon, screenshots, description, or .exe path"
        className="group inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold text-[rgb(var(--surface))] transition-all hover:scale-[1.04]"
        style={{
          backgroundImage: 'linear-gradient(135deg, rgb(var(--accent-2)) 0%, rgb(var(--accent)) 100%)',
          boxShadow: '0 0 14px -3px rgb(var(--accent) / 0.55)',
        }}
      >
        <Wand2 size={13} className="transition-transform group-hover:rotate-12" />
        Customize
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

      <button
        data-testid="detail-save-manager-btn"
        onClick={() => onOpenSaveManager?.(game)}
        title="Open save folder, create backups, or recover saves safely"
        className="inline-flex items-center gap-2 rounded-full hairline px-4 py-2 text-xs text-muted hover:text-ink hover:border-accent/40 transition-colors"
      >
        <ArchiveRestore size={13} />
        Save games
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

function SteamManifestLine({ game }) {
  const [info, setInfo] = React.useState(null);
  const [state, setState] = React.useState('idle'); // 'idle' | 'loading' | 'ok' | 'none'

  React.useEffect(() => {
    let alive = true;
    setInfo(null); setState('idle');
    if (!game || game.source !== 'steam' || !game.appid) return () => { alive = false; };
    if (!(typeof window !== 'undefined' && window.api?.getSteamManifest)) return () => { alive = false; };
    setState('loading');
    window.api.getSteamManifest(game.appid).then((res) => {
      if (!alive) return;
      if (res?.ok && (res.buildid || res.lastUpdated)) {
        setInfo(res); setState('ok');
      } else {
        setState('none');
      }
    }).catch(() => { if (alive) setState('none'); });
    return () => { alive = false; };
  }, [game?.id, game?.appid, game?.source]);

  if (state !== 'ok' || !info) return null;

  const daysAgo = info.lastUpdated
    ? Math.max(0, Math.floor((Date.now() - info.lastUpdated) / 86400000))
    : null;
  const updated = daysAgo == null
    ? null
    : daysAgo === 0 ? 'today'
    : daysAgo === 1 ? 'yesterday'
    : `${daysAgo} days ago`;
  const sizeGb = info.sizeOnDisk ? (info.sizeOnDisk / (1024 ** 3)) : 0;
  const sizeStr = sizeGb >= 1
    ? `${sizeGb.toFixed(sizeGb >= 10 ? 0 : 1)} GB`
    : info.sizeOnDisk ? `${Math.round(info.sizeOnDisk / (1024 ** 2))} MB` : '';

  return (
    <div
      className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]"
      data-testid="steam-manifest-line"
    >
      {updated && (
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 hairline bg-panel/40"
          style={{ color: 'rgb(var(--accent-2))' }}
          title={new Date(info.lastUpdated).toLocaleString()}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'rgb(var(--accent-2))' }} />
          Updated {updated}
        </span>
      )}
      {info.buildid && (
        <span className="font-mono text-muted">Build <span className="text-ink">{info.buildid}</span></span>
      )}
      {sizeStr && (
        <span className="font-mono text-muted">· {sizeStr} on disk</span>
      )}
    </div>
  );
}



function LatestNewsPill({ game }) {
  const [item, setItem] = React.useState(null);
  const [expanded, setExpanded] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    setItem(null); setExpanded(false);
    if (!game) return () => { alive = false; };
    const eligible = game.appid || game.gogId || /itch\.io/.test(game.website || '') || game.source === 'itch';
    if (!eligible) return () => { alive = false; };
    if (!(typeof window !== 'undefined' && window.api?.latestNewsForGame)) return () => { alive = false; };
    window.api.latestNewsForGame({
      id: game.id, appid: game.appid, gogId: game.gogId,
      website: game.website, source: game.source, name: game.name,
    }).then((res) => {
      if (!alive) return;
      if (res?.ok && res.item) setItem(res.item);
    }).catch(() => {});
    return () => { alive = false; };
  }, [game?.id, game?.appid, game?.gogId, game?.website]);

  if (!item) return null;

  const daysAgo = Math.max(0, Math.floor((Date.now() - item.date) / 86400000));
  const timeStr = daysAgo === 0 ? 'today' : daysAgo === 1 ? 'yesterday' : `${daysAgo}d ago`;
  const platformLabel = { steam: 'Steam', itch: 'itch.io', gog: 'GOG' }[item.platform] || 'News';
  const visual = item.image || game.headerImage || game.background || game.hero || game.screenshots?.[0] || game.coverUrl || game.cover || '';

  const openLink = (e) => {
    e.stopPropagation();
    if (!item.url) return;
    if (typeof window !== 'undefined' && window.api?.openExternal) window.api.openExternal(item.url);
    else window.open(item.url, '_blank');
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      onClick={() => setExpanded((v) => !v)}
      className="group relative mb-4 cursor-pointer overflow-hidden rounded-xl"
      style={{
        border: '1.5px solid rgb(var(--accent)/0.55)',
        background:
          'linear-gradient(135deg, rgb(var(--accent)/0.14) 0%, rgb(var(--accent-2)/0.10) 100%)',
        boxShadow: expanded
          ? '0 0 30px -4px rgb(var(--accent)/0.75), inset 0 1px 0 rgb(255,255,255,0.08)'
          : '0 0 18px -4px rgb(var(--accent)/0.55), inset 0 1px 0 rgb(255,255,255,0.06)',
      }}
      data-testid="latest-news-pill"
    >
      {/* Border pulse — animated gradient outline draws attention */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-xl"
        animate={{ opacity: [0.35, 0.75, 0.35] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          boxShadow: 'inset 0 0 0 1.5px rgb(var(--accent))',
        }}
      />
      {/* Shimmer sweep — a diagonal light beam that crosses the pill every 5s */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-12"
        initial={{ x: '-120%' }}
        animate={{ x: '380%' }}
        transition={{ duration: 3.4, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgb(255,255,255,0.10) 50%, transparent 100%)',
        }}
      />
      <div className="relative flex items-center gap-3 px-4 py-3">
        {visual && <div className="h-14 w-24 shrink-0 overflow-hidden rounded-lg border border-[rgb(var(--accent)/0.28)] bg-black/25 shadow-lg"><img src={visual} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" onError={(event) => { event.currentTarget.parentElement.style.display = 'none'; }} /></div>}
        {/* Left rail — big pulsing indicator + LIVE label */}
        <div className="flex shrink-0 items-center gap-2.5">
          <motion.span
            animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.35, 1] }}
            transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-block h-3 w-3 rounded-full"
            style={{
              backgroundColor: 'rgb(var(--accent))',
              boxShadow: '0 0 14px rgb(var(--accent)), 0 0 28px rgb(var(--accent)/0.7)',
            }}
          />
          <div className="flex flex-col leading-tight">
            <span
              className="text-[10.5px] font-black uppercase tracking-[0.28em]"
              style={{
                color: 'rgb(var(--accent))',
                textShadow: '0 0 10px rgb(var(--accent)/0.7)',
              }}
            >
              Live news
            </span>
            <span className="text-[10px] text-muted">
              {platformLabel} · {timeStr}
            </span>
          </div>
        </div>

        {/* Divider */}
        <span className="h-9 w-px shrink-0" style={{ background: 'rgb(var(--accent)/0.35)' }} />

        {/* Title */}
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-[14.5px] font-bold text-ink leading-snug group-hover:text-[rgb(var(--accent))] transition-colors">
            {item.title}
          </h4>
          {!expanded && item.snippet && (
            <p className="mt-0.5 truncate text-[11.5px] text-muted leading-relaxed">
              {item.snippet}
            </p>
          )}
        </div>

        {/* Chevron */}
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full hairline"
          style={{ backgroundColor: 'rgb(var(--accent)/0.18)', color: 'rgb(var(--accent))' }}
        >
          <ChevronDown size={15} />
        </motion.div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 border-t" style={{ borderColor: 'rgb(var(--accent)/0.3)' }}>
              {visual && <img src={visual} alt="" className="mb-3 max-h-44 w-full rounded-lg object-cover" onError={(event) => { event.currentTarget.style.display = 'none'; }} />}
              {item.snippet && (
                <p className="text-[12.5px] leading-relaxed text-muted line-clamp-6">
                  {item.snippet}
                </p>
              )}
              <button
                onClick={openLink}
                data-testid="latest-news-open"
                className="mt-3 inline-flex items-center gap-1.5 rounded-md px-3 h-8 text-[11.5px] font-bold text-white"
                style={{
                  background: 'linear-gradient(135deg, rgb(var(--accent)) 0%, rgb(var(--accent-2)) 100%)',
                  boxShadow: '0 0 14px -4px rgb(var(--accent)/0.7)',
                }}
              >
                Read full on {platformLabel} <ExternalLink size={11} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ---------- Managed hardware utility setup ---------- */
function ManagedToolSetup({ game, onLocate, onInstall, installing }) {
  if (!game?.managedTool) return null;
  const installed = game.availability === 'installed' && !!game.exePath;
  return (
    <motion.section
      initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
      className={`mb-4 overflow-hidden rounded-xl border ${installed ? 'border-emerald-400/28 bg-emerald-400/[0.06]' : 'border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.38)] opacity-85'}`}
      data-testid="managed-tool-setup"
    >
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <span className={`grid h-9 w-9 place-items-center rounded-lg ${installed ? 'bg-emerald-400/12 text-emerald-300' : 'bg-[rgb(var(--muted)/0.16)] text-muted'}`}><Wrench size={16} /></span>
        <div className="min-w-0 flex-1"><p className={`text-[10px] font-black uppercase tracking-[0.17em] ${installed ? 'text-emerald-300' : 'text-muted'}`}>{installed ? 'Ready to launch' : 'Not located yet'}</p><p className="mt-0.5 text-[11px] text-muted">{installed ? `Official utility linked · ${game.managedInstallMode === 'located' ? 'manual location confirmed' : 'managed tool ready'}` : 'Locate an existing copy, or let NEO-LIB download it from its official publisher.'}</p></div>
        {!installed && <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.38)] px-2 py-1 text-[9px] font-black text-muted">USE SET UP ABOVE</span>}
        {installed && <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-1 text-[9px] font-black text-emerald-300">INSTALLED</span>}
      </div>
    </motion.section>
  );
}

function ManagedToolMenu({ game, onLocate, onInstall, installing, compact = false }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const close = (event) => { if (ref.current && !ref.current.contains(event.target)) setOpen(false); };
    if (open) document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  return <div ref={ref} className="relative shrink-0"><button onClick={() => setOpen((value) => !value)} disabled={installing} className={`${compact ? 'h-8 px-3 text-[10px]' : 'h-9 px-4 text-[11px]'} inline-flex items-center gap-1.5 rounded-lg border border-[rgb(var(--accent)/0.42)] bg-[rgb(var(--accent)/0.1)] font-black text-[rgb(var(--accent))] hover:bg-[rgb(var(--accent)/0.18)] disabled:opacity-50`} title={`Set up ${game.name}`}><Wrench size={compact ? 12 : 14} />{installing ? 'Downloading…' : 'Set up'}<ChevronDown size={12} className={open ? 'rotate-180 transition-transform' : 'transition-transform'} /></button>{open && <div className="absolute right-0 top-[calc(100%+6px)] z-[90] w-56 overflow-hidden rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.98)] p-1.5 shadow-2xl"><button onClick={() => { setOpen(false); onLocate?.(game); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[10.5px] font-semibold text-ink hover:bg-[rgb(var(--accent)/0.12)]"><FolderOpen size={13} className="text-[rgb(var(--accent-2))]" /><span><b className="block">Locate it</b><span className="text-[9px] font-normal text-muted">Choose an existing official executable</span></span></button><button onClick={() => { setOpen(false); onInstall?.(game); }} className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[10.5px] font-semibold text-ink hover:bg-[rgb(var(--accent)/0.12)]"><Download size={13} className="text-emerald-300" /><span><b className="block">Install from official site</b><span className="text-[9px] font-normal text-muted">Downloads only after this click</span></span></button></div>}</div>;
}


/* ---------- Personal rating — whole stars open a precise tenth picker. */
function StarRating({ value = 0, onChange }) {
  const [hover, setHover] = React.useState(0);
  const [openFor, setOpenFor] = React.useState(null);
  const rootRef = React.useRef(null);
  const shown = hover || value;
  React.useEffect(() => {
    const close = (event) => { if (rootRef.current && !rootRef.current.contains(event.target)) setOpenFor(null); };
    const escape = (event) => { if (event.key === 'Escape') setOpenFor(null); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', escape); };
  }, []);
  return (
    <span
      ref={rootRef}
      className="relative inline-flex items-center gap-0.5"
      onMouseLeave={() => setHover(0)}
      data-testid="game-star-rating"
      onClick={(e) => e.stopPropagation()}
    >
      {[1, 2, 3, 4, 5].map((i) => {
        const fillRatio = Math.max(0, Math.min(1, shown - (i - 1)));
        const filled = fillRatio > 0;
        return (
          <button
            key={i}
            data-testid={`star-${i}`}
            title={`Choose a ${i}.0–${i}.9 rating`}
            onMouseEnter={() => setHover(i)}
            onClick={(e) => {
              e.stopPropagation();
              setOpenFor((current) => current === i ? null : i);
            }}
            className="relative grid h-6 w-6 place-items-center transition-transform hover:scale-110"
            style={{
              color: filled ? '#ffcc4a' : 'rgb(var(--muted) / 0.5)',
              filter: filled ? 'drop-shadow(0 0 4px rgba(255,204,74,0.7))' : 'none',
            }}
          >
            <Star className="absolute" size={19} strokeWidth={2} fill="none" />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fillRatio * 100}%` }} aria-hidden="true">
              <Star className="absolute left-[2px] top-[2px] text-[#ffcc4a]" size={19} strokeWidth={2} fill="#ffcc4a" />
            </span>
          </button>
        );
      })}
      <span className="ml-1 min-w-7 text-[10px] font-black tracking-normal text-[#ffdc72]" aria-label={value ? `${value.toFixed(1)} out of 5 stars` : 'No rating'}>{value ? value.toFixed(1) : '—'}</span>
      {openFor && <span className="absolute left-0 top-[calc(100%+7px)] z-[80] grid w-[186px] grid-cols-5 gap-1 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.98)] p-2 shadow-2xl" role="menu" aria-label={`Choose ${openFor}-star rating`}><button onClick={() => { onChange?.(0); setOpenFor(null); }} className="col-span-5 rounded px-2 py-1 text-left text-[10px] font-bold text-muted hover:bg-[rgb(var(--accent)/0.12)] hover:text-ink">Clear my rating</button>{(openFor === 5 ? [5] : Array.from({ length: 10 }, (_, index) => Number((openFor + index / 10).toFixed(1)))).map((rating) => <button key={rating} onClick={() => { onChange?.(rating); setOpenFor(null); }} className={`rounded px-1 py-1.5 text-[10px] font-black transition ${value === rating ? 'bg-[#ffcc4a] text-[#2d1c00]' : 'bg-[rgb(var(--surface)/0.5)] text-ink hover:bg-[rgb(var(--accent)/0.2)]'}`}>{rating.toFixed(1)}</button>)}</span>}
    </span>
  );
}

function UpdateAvailablePill({ game }) {
  const [update, setUpdate] = React.useState(null);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [openError, setOpenError] = React.useState('');
  React.useEffect(() => {
    let alive = true;
    setUpdate(null);
    setOpenError('');
    if (game?.managedTool) return () => { alive = false; };
    if ((!game?.appid && !(game?.exePath || game?.installedVersion || game?.updateWatchUrl || game?.website)) || !window.api?.scanGameUpdates) return () => { alive = false; };
    window.api.scanGameUpdates({ games: [{ id: game.id, name: game.name, appid: game.appid, launcher: game.launcher, source: game.source, steamOwned: game.steamOwned, installedVersion: game.installedVersion, updateWatchUrl: game.updateWatchUrl, website: game.website, exePath: game.exePath }] })
      .then((result) => { if (alive) setUpdate(result?.items?.[0] || null); })
      .catch(() => {});
    return () => { alive = false; };
  }, [game?.id, game?.appid, game?.name, game?.launcher, game?.source, game?.installedVersion, game?.updateWatchUrl, game?.website, game?.exePath]);
  if (!update) return null;
  const isWatchPage = update.sourceKind === 'watch-page';
  const needsVersionCheck = update.status === 'attention';
  const remaining = isWatchPage ? `${update.currentVersion} → ${update.latestVersion}` : update.remainingBytes >= 1024 ** 3 ? `${(update.remainingBytes / 1024 ** 3).toFixed(1)} GB` : `${Math.max(1, Math.round(update.remainingBytes / 1024 ** 2))} MB`;
  const tone = needsVersionCheck ? {
    border: 'border-amber-300/45', bg: 'bg-amber-300/[0.08]', icon: 'bg-amber-300/15 text-amber-200', text: 'text-amber-200', shadow: 'rgb(251 191 36 / .78)',
  } : {
    border: 'border-emerald-400/40', bg: 'bg-emerald-400/[0.07]', icon: 'bg-emerald-400/15 text-emerald-300', text: 'text-emerald-300', shadow: 'rgb(52 211 153 / .85)',
  };
  const openUpdateAction = async () => {
    setOpenError('');
    if (isWatchPage) { setHistoryOpen(true); return; }
    const result = await window.api?.openLauncherDownloads?.(update.platform);
    if (!result?.ok) setOpenError(result?.error || 'The launcher Downloads page could not be opened.');
  };
  return <>
    <motion.button
      onClick={openUpdateAction}
      animate={{ opacity: [1, 0.78, 1], boxShadow: [`0 0 12px -4px ${tone.shadow}`, `0 0 28px 0px ${tone.shadow}`, `0 0 12px -4px ${tone.shadow}`] }}
      transition={{ duration: 2.2, repeat: Infinity }}
      className={`mb-4 flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left ${tone.border} ${tone.bg}`}
      data-testid="game-update-available"
    >
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${tone.icon}`}><Download size={16} /></span>
      <span className="min-w-0 flex-1"><span className={`block text-[10px] font-black uppercase tracking-[0.22em] ${tone.text}`}>{needsVersionCheck ? 'Possible update · comparison needed' : `New update · ${update.platform}`}</span><span className="mt-0.5 block text-[12px] font-bold text-ink">{needsVersionCheck ? `Latest public version ${update.latestVersion} found` : isWatchPage ? `Version ${remaining} available` : `${remaining} remains in the launcher queue`}</span><span className="mt-0.5 block text-[10.5px] text-muted">{needsVersionCheck ? update.currentVersion && update.currentVersion !== 'Unknown' ? `NEO-LIB found ${update.currentVersion} in the Windows executable, but needs stronger game-owned evidence before comparing it. Open patch history.` : 'NEO-LIB could not read this local build version yet. Open patch history to compare it safely.' : `There is a new update for this game you might want to check out${update.installedVersionEvidence ? ` · local version found in ${update.installedVersionEvidence}` : ''}.`}</span></span>
      <span className={`shrink-0 text-[10px] font-bold ${tone.text}`}>{isWatchPage ? 'Patch history' : 'Open downloads'} ↗</span>
    </motion.button>
    {openError && <p role="status" className="-mt-2 mb-3 rounded-lg border border-amber-300/30 bg-amber-300/[0.08] px-3 py-2 text-[10px] font-bold text-amber-200">{openError}</p>}
    <UpdateHistoryModal item={historyOpen ? update : null} onClose={() => setHistoryOpen(false)} />
  </>;
}

/** A structured identity is deliberately separate from a user's Library categories. */
function GenreProfile({ profile, fallbackGenres = [], embedded = false }) {
  const groups = genreDisplayGroups(profile);
  if (!groups.length && !fallbackGenres.length) return null;
  const shownGroups = groups.length ? groups : [['Source genres', fallbackGenres.map((label) => ({ id: label, label }))]];
  return (
    <aside className={`genre-identity-blob self-start overflow-hidden rounded-xl border border-[rgb(var(--accent)/0.34)] bg-[rgb(var(--surface)/0.45)] ${embedded ? 'w-full shadow-[0_12px_28px_-22px_rgb(var(--accent))]' : ''}`} data-testid="game-genre-profile">
      <div className="border-b border-[rgb(var(--accent)/0.22)] bg-[rgb(var(--accent)/0.11)] px-3 py-2.5">
        <div className="text-[9px] font-black uppercase tracking-[0.2em] text-[rgb(var(--accent))]">Game identity</div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="text-[10px] text-muted">Genres &amp; playstyle</span>
          {profile?.confidence ? <span className="rounded-full border border-[rgb(var(--accent)/0.25)] px-1.5 py-0.5 text-[8px] font-bold text-[rgb(var(--accent-2))]" title={`Direct metadata confidence ${(profile.confidence * 100).toFixed(0)}%`}>{profile.source || 'source'}</span> : null}
        </div>
      </div>
      <div className="divide-y divide-[rgb(var(--border)/0.45)]">
        {shownGroups.map(([label, entries]) => (
          <div key={label} className="px-3 py-2.5">
            <div className="mb-1.5 text-[8.5px] font-bold uppercase tracking-[0.14em] text-muted">{label}</div>
            <div className="flex flex-wrap gap-1">
              {entries.map((entry) => <span key={entry.id} className="rounded-md border border-[rgb(var(--accent)/0.22)] bg-[rgb(var(--accent)/0.08)] px-1.5 py-0.5 text-[9.5px] font-semibold text-ink">{entry.label}</span>)}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
