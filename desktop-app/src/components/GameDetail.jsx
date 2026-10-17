import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { DetailList, GameCapabilities, GameMediaGallery, GameStory } from './preview/PreviewInformationPanels';
import PreviewActionBar from './preview/PreviewActionBar';
import PreviewPageLayout from './preview/PreviewPageLayout';
import PreviewHeroTitle from './preview/PreviewHeroTitle';
import { installSizePatch, savedStorageSnapshot } from '../state/install-size-state.mjs';
import { LatestNewsPill, ManagedToolSetup, SteamManifestLine, UpdateAvailablePill } from './preview/PreviewStatusCards';
import { DEFAULT_HERO_FILTER, heroImageFilter } from './preview/hero-treatment-model.mjs';
import { libraryHeroArtworkOptions, libraryHeroCandidates, libraryHeroFocalPoint, libraryHeroMediaKind, libraryHeroMotion, libraryHeroMotionStyle, libraryHeroWidth } from './preview/library-hero-artwork.mjs';

/**
 * GameDetail — fully horizontal, "seamless" layout:
 *   [ HUGE banner with title overlay ]
 *   [ Launch + compact action menu ]
 *   [ Library-hugging information column | richer source-owned gallery ]
 *   [ Calm, readable game details + genre identity ]
 */
export default function GameDetail({
  game, categories, onLaunch, onLaunchError, onRefetch, onRevealFolder,
  onToggleCategory, onCustomize, onUpdateGame, onOpenSaveManager, onLocateManagedTool, onInstallManagedTool, managedToolInstalling = false, fetching, settings = {}, onPreviewLayoutChange,
}) {
  const installSize = React.useMemo(() => savedStorageSnapshot(game ? [game] : []).results[0] || null, [game]);
  const [measuringSize, setMeasuringSize] = React.useState(false);
  const measureInstallSize = React.useCallback(async () => {
    if (!game?.exePath || !window.api?.scanGameStorage || measuringSize) return;
    setMeasuringSize(true);
    try {
      const result = await window.api.scanGameStorage({ games: [{ id: game.id, name: game.name, exePath: game.exePath, launcher: game.launcher }], force: true });
      if (result?.ok !== true) return;
      const patch = installSizePatch(game, result.results?.find(entry => entry.id === game.id), result.scannedAt || Date.now());
      if (patch) onUpdateGame?.(game.id, patch);
    } catch {
      // A failed rescan must never erase a saved measurement.
    } finally { setMeasuringSize(false); }
  }, [game, measuringSize, onUpdateGame]);
  const heroCandidates = React.useMemo(() => libraryHeroCandidates(game), [game]);
  const [heroIndex, setHeroIndex] = React.useState(0);
  const bg = heroCandidates[heroIndex];
  const [heroDimensions, setHeroDimensions] = React.useState(null);
  const focalPoint = libraryHeroFocalPoint(game);
  const heroMotion = libraryHeroMotion(game);
  const heroVideoRef = React.useRef(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(() => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  React.useEffect(() => {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!query) return undefined;
    const update = () => setPrefersReducedMotion(query.matches);
    query.addEventListener?.('change', update);
    return () => query.removeEventListener?.('change', update);
  }, []);
  React.useEffect(() => {
    const video = heroVideoRef.current;
    if (!video) return;
    if (prefersReducedMotion) video.pause();
    else video.play().catch(() => {});
  }, [bg, prefersReducedMotion]);
  React.useEffect(() => { setHeroIndex(0); setHeroDimensions(null); }, [game?.id, heroCandidates[0]]);
  // Hero parallax — subtle 3D tilt as mouse moves over the hero. CSS-only, no rerenders.
  const heroRef = React.useRef(null);
  // Hero auto-brighten — sample the loaded image's average luminance. If it's
  // too dark to read text against, apply a CSS brightness/contrast lift on the
  // <img> AND a darker scrim on top. Avoids the "Cyberpunk poster" problem
  // where a near-black banner makes the title invisible.
  const [heroFilter, setHeroFilter] = React.useState(DEFAULT_HERO_FILTER);
  React.useEffect(() => setHeroFilter(DEFAULT_HERO_FILTER), [bg]);
  const onHeroLoad = React.useCallback((e) => {
    const img = e.currentTarget;
    const width = img.naturalWidth || img.videoWidth;
    const height = img.naturalHeight || img.videoHeight;
    if (!width || !height) return;
    setHeroDimensions({ src: img.getAttribute('src'), width, height });
    try {
      const cv = document.createElement('canvas');
      const W = (cv.width = 16);
      const H = (cv.height = 16);
      const ctx = cv.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, W, H);
      const d = ctx.getImageData(0, 0, W, H).data;
      let sum = 0;
      let saturationSum = 0;
      for (let i = 0; i < d.length; i += 4) {
        // Rec. 709 luminance
        sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
        const high = Math.max(d[i], d[i + 1], d[i + 2]);
        const low = Math.min(d[i], d[i + 1], d[i + 2]);
        saturationSum += high ? (high - low) / high : 0;
      }
      const avg = sum / (W * H); // 0..255
      const saturation = saturationSum / (W * H); // 0..1
      setHeroFilter(heroImageFilter({ luminance: avg, saturation }));
    } catch { setHeroFilter(DEFAULT_HERO_FILTER); /* CORS or tainted canvas: use safe recovery. */ }
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
  if (!game) return <EmptyState />;
  const measuredWidth = heroDimensions?.src === bg ? heroDimensions.width : 0;
  const isHeroVideo = libraryHeroMediaKind(bg) === 'video';
  const compactWidth = isHeroVideo ? null : libraryHeroWidth(measuredWidth, heroRef.current?.clientWidth || 0);
  const blocks = {
    hero: (<div
        ref={heroRef}
        className="relative isolate shrink-0"
        onMouseMove={onHeroMove}
        onMouseLeave={onHeroLeave}
        style={{ perspective: '1200px' }}
      >
        {/* A small store header remains a smaller sharp art panel over a soft ambient fill. */}
        {bg ? (
          <>
            {compactWidth && <div className="pointer-events-none absolute inset-0 overflow-hidden bg-[rgb(var(--surface))]" aria-hidden="true"><img src={bg} alt="" className="h-full w-full scale-110 object-cover opacity-40 blur-2xl" /></div>}
            <div className={`library-hero-motion-layer pointer-events-none absolute inset-0 ${heroMotion > 0 && !prefersReducedMotion ? 'library-hero-alive' : ''}`} style={libraryHeroMotionStyle(game.id, heroMotion)} aria-hidden="true">
              {isHeroVideo ? <motion.video
                key={bg}
                ref={heroVideoRef}
                initial={{ opacity: 0 }}
                animate={{ opacity: measuredWidth ? 1 : 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                src={bg}
                muted
                autoPlay={!prefersReducedMotion}
                loop
                playsInline
                preload="metadata"
                onLoadedMetadata={onHeroLoad}
                onLoadedData={onHeroLoad}
                onError={() => setHeroIndex(index => Math.min(index + 1, heroCandidates.length))}
                className="hero-parallax absolute inset-y-0 right-0 h-full w-full object-cover"
                style={{ objectPosition: `${focalPoint.x}% ${focalPoint.y}%`, filter: heroFilter || undefined, transform: 'perspective(1200px) rotateX(var(--hero-rx, 0deg)) rotateY(var(--hero-ry, 0deg)) translate3d(var(--hero-tx, 0px), var(--hero-ty, 0px), 0)' }}
              /> : <motion.img
                key={bg}
                initial={{ opacity: 0 }}
                animate={{ opacity: measuredWidth ? 1 : 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                src={bg}
                alt=""
                crossOrigin="anonymous"
                onLoad={onHeroLoad}
                onError={() => setHeroIndex(index => Math.min(index + 1, heroCandidates.length))}
                className="hero-parallax absolute inset-y-0 right-0 h-full object-cover"
                style={{
                  width: compactWidth ? `${compactWidth}px` : '100%',
                  objectPosition: `${focalPoint.x}% ${focalPoint.y}%`,
                  // Compact artwork is right-aligned to avoid enlarging small store headers
                  // across ultrawide screens. Fade its leading edge into the ambient fill so
                  // the image doesn't read as a misaligned, hard-edged panel.
                  ...(compactWidth ? { maskImage: 'linear-gradient(to right, transparent 0%, black 28%)', WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 28%)' } : {}),
                  transform: 'perspective(1200px) rotateX(var(--hero-rx, 0deg)) rotateY(var(--hero-ry, 0deg)) translate3d(var(--hero-tx, 0px), var(--hero-ty, 0px), 0)',
                  filter: heroFilter || undefined,
                }}
              />}
            </div>
          </>
        ) : (
          <div className="pointer-events-none absolute inset-0">
            <div className="synth-grid" />
            <div className="synth-horizon" />
          </div>
        )}
        {/* Top cutoff fade — image starts cleanly below titlebar */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-14"
          style={{ background: 'linear-gradient(to bottom, rgb(var(--surface)/0.72) 0%, rgb(var(--surface)/0.22) 42%, transparent 100%)' }}
        />
        {/* Left vignette so title text is readable — darker, more focused */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'linear-gradient(to right, rgb(var(--surface)/0.76) 0%, rgb(var(--surface)/0.38) 24%, rgb(var(--surface)/0.10) 46%, transparent 62%)' }}
        />
        {/* Bottom fade — image dissolves into ActionBar/MetaStrip+About below it */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24"
          style={{ background: 'linear-gradient(to bottom, transparent 0%, rgb(var(--surface)/0.18) 58%, rgb(var(--surface)/0.64) 100%)' }}
        />
        {/* Accent glow corner */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgb(var(--accent)/0.10),transparent_48%)]" />
        {settings.scanlinesEnabled !== false && <div className="scanlines pointer-events-none absolute inset-0 opacity-[0.12]" />}

        {/* Hero text block */}
        <PreviewHeroTitle game={game} onUpdateGame={onUpdateGame} installSize={installSize} measuringSize={measuringSize} onMeasureSize={measureInstallSize} />

        {/* Action bar — sits over backdrop, glass blur */}
        <PreviewActionBar
          game={game}
          categories={categories}
          onLaunch={onLaunch}
          onLaunchError={onLaunchError}
          onRefetch={onRefetch}
          onRevealFolder={onRevealFolder}
          onToggleCategory={onToggleCategory}
          onCustomize={onCustomize}
          onUpdateGame={onUpdateGame}
          onOpenSaveManager={onOpenSaveManager}
          onLocateManagedTool={onLocateManagedTool}
          onInstallManagedTool={onInstallManagedTool}
          managedToolInstalling={managedToolInstalling}
          fetching={fetching}
          settings={settings}
        />

      </div>),
    notices: <><ManagedToolSetup game={game} onLocate={onLocateManagedTool} onInstall={onInstallManagedTool} installing={managedToolInstalling} /><UpdateAvailablePill game={game} /><LatestNewsPill game={game} /></>,
    details: <DetailList game={game} />,
    capabilities: <GameCapabilities game={game} onUpdateGame={onUpdateGame} />,
    description: <GameStory game={game} profile={game.genreProfile} />,
    media: <GameMediaGallery game={game} />,
    source: <><div className="rounded-xl border border-[rgb(var(--border)/0.56)] bg-[rgb(var(--surface)/0.30)] px-3 py-2.5 text-[10.5px] text-muted/75 break-all font-mono">
      {game.exePath}
      {game.appid && <span className="block mt-0.5">Steam App ID · {game.appid}</span>}
      {game.source && <span className="block mt-0.5">Source · {game.source}</span>}
    </div><SteamManifestLine game={game} /></>,
  };
  return <motion.div key={game.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.28 }} className="relative flex h-full flex-1 flex-col overflow-hidden">
    <PreviewPageLayout blocks={blocks} savedLayout={settings.previewLayout} onLayoutChange={onPreviewLayoutChange} />
  </motion.div>;
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
