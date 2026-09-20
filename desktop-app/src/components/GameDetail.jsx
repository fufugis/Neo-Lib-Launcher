import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { DetailList, GameCapabilities, GameMediaGallery, GameStory } from './preview/PreviewInformationPanels';
import PreviewActionBar from './preview/PreviewActionBar';
import PreviewHeroTitle from './preview/PreviewHeroTitle';
import { LatestNewsPill, ManagedToolSetup, SteamManifestLine, UpdateAvailablePill } from './preview/PreviewStatusCards';
import { DEFAULT_HERO_FILTER, heroImageFilter } from './preview/hero-treatment-model.mjs';

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
  const [installSize, setInstallSize] = React.useState(null);
  const [measuringSize, setMeasuringSize] = React.useState(false);
  React.useEffect(() => {
    setInstallSize(game && Number.isFinite(Number(game.installSizeBytes))
      ? { bytes: Number(game.installSizeBytes), truncated: Boolean(game.installSizePartial) }
      : null);
  }, [game?.id, game?.installSizeBytes, game?.installSizePartial]);
  const measureInstallSize = React.useCallback(async () => {
    if (!game?.exePath || !window.api?.scanGameStorage || measuringSize) return;
    setMeasuringSize(true);
    try {
      const result = await window.api.scanGameStorage({ games: [{ id: game.id, name: game.name, exePath: game.exePath, launcher: game.launcher }], force: true });
      const found = result?.results?.[0];
      if (!result?.ok || !found || !Number.isFinite(Number(found.bytes))) return;
      const next = { bytes: Number(found.bytes), truncated: Boolean(found.truncated) };
      setInstallSize(next);
      onUpdateGame?.(game.id, { installSizeBytes: next.bytes, installSizeMeasuredAt: Date.now(), installSizePartial: next.truncated });
    } finally { setMeasuringSize(false); }
  }, [game, measuringSize, onUpdateGame]);
  if (!game) return <EmptyState />;
  const bg = game.hero || game.background || game.headerImage || game.coverUrl;
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
          className="min-h-min w-full max-w-none rounded-2xl border border-[rgb(var(--border)/0.88)] bg-[rgb(var(--panel)/0.56)] px-4 py-4 shadow-[0_28px_80px_-52px_rgba(0,0,0,.96)] backdrop-blur-md sm:px-6 sm:py-5"
          data-testid="game-text-panel"
        >
          <ManagedToolSetup game={game} onLocate={onLocateManagedTool} onInstall={onInstallManagedTool} installing={managedToolInstalling} />
          <UpdateAvailablePill game={game} />
          <LatestNewsPill game={game} />
          <DetailList game={game} />
          <GameCapabilities game={game} />
          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(460px,560px)]">
            <div className="min-w-0">
              <GameStory game={game} profile={game.genreProfile} />
              <div className="mt-5 rounded-xl border border-[rgb(var(--border)/0.56)] bg-[rgb(var(--surface)/0.30)] px-3 py-2.5 text-[10.5px] text-muted/75 break-all font-mono">
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
