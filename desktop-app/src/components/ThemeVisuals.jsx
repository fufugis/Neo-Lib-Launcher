import React from 'react';
import { motion } from 'framer-motion';
import { stockThemeAssetUrl, customThemeManifest, customThemeAssetUrl } from '../themes/stock-theme-registry.mjs';
import CustomThemeParticles from './CustomThemeParticles';
import ThemeGifMedia from './ThemeGifMedia';
import ThemeVideoMedia from './ThemeVideoMedia';

export function BgAmbience({ theme, settings = {}, game = null, resting = false, eventPulse = null }) {
  // `synthGridEnabled` and `particlesEnabled` were retired legacy switches.
  // They could silently hide every modern FX layer after an upgrade, even when
  // the player selected Low–Max effects. Effects intensity is now the one
  // reliable master control; Rest Mode remains the only global hard stop.
  if (resting) return null;
  // Effects Level (0=None, 1=Low, 2=Med, 3=High, 4=Max) — persisted per-theme
  // in settings.effectsLevelByTheme[theme], so Synthwave can be Max and Modern
  // can be Low without cross-contamination. Falls back to settings.effectsLevel
  // (legacy global) then to 2 (Medium) for first-run.
  const perThemeMap = settings.effectsLevelByTheme || {};
  const perTheme = perThemeMap[theme];
  const rawLevel = Number.isFinite(perTheme)
    ? perTheme
    : (Number.isFinite(settings.effectsLevel) ? settings.effectsLevel : 2);
  const level = Math.max(0, Math.min(4, rawLevel));
  const cadence = ['full', 'balanced', 'calm'].includes(settings.motionCadence) ? settings.motionCadence : 'full';
  // Balanced remains fluid; it saves GPU work by reducing the expensive
  // decorative actors instead of turning smooth animation into visible steps.
  const cadenceProfile = cadence === 'calm'
    ? { duration: 1.7, particle: 0.48, sakura: 0.45, glow: 0.48, extraLayers: 0.34, opacity: 0.76 }
    : cadence === 'balanced'
      ? { duration: 1.12, particle: 0.78, sakura: 0.74, glow: 0.72, extraLayers: 0.6, opacity: 0.9 }
      : { duration: 1, particle: 1, sakura: 1, glow: 1, extraLayers: 1, opacity: 1 };
  const motionDurationScale = cadenceProfile.duration;
  const LEVEL_MAP = [
    { intensity: 0.00, particles: 0,  sakura: 0,  crimsonBoost: 0, edgeGlow: 0.0, extraLayers: 0 },
    { intensity: 0.55, particles: 6,  sakura: 10, crimsonBoost: 3, edgeGlow: 0.25, extraLayers: 0 },
    { intensity: 1.00, particles: 16, sakura: 24, crimsonBoost: 6, edgeGlow: 0.55, extraLayers: 1 },
    { intensity: 1.55, particles: 34, sakura: 48, crimsonBoost: 14, edgeGlow: 0.85, extraLayers: 2 },
    { intensity: 2.10, particles: 64, sakura: 88, crimsonBoost: 28, edgeGlow: 1.20, extraLayers: 3 },
  ];
  const lvl = LEVEL_MAP[level];
  const intensity = ((settings.gridIntensity ?? 100) / 100) * lvl.intensity * cadenceProfile.opacity;
  const particleBaseCount = Math.round(lvl.particles * cadenceProfile.particle);
  const sakuraCount = Math.round(lvl.sakura * cadenceProfile.sakura);
  const edgeGlow = lvl.edgeGlow * cadenceProfile.glow;
  const extraLayerCount = Math.round(lvl.extraLayers * cadenceProfile.extraLayers);
  const showParticles = particleBaseCount > 0;
  // Per-game custom backdrop — when settings.perGameBg is on, the currently selected
  // game's hero is rendered as a giant blurred wash behind the ambient. Subtle,
  // additive, never overwhelms the theme.
  const gameBg = settings.perGameBg && game ? (game.background || game.headerImage || game.coverUrl) : null;
  const gameBgLayer = gameBg ? (
    <motion.div
      key={gameBg}
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.22 }}
      transition={{ duration: 0.9 }}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        backgroundImage: `url(${gameBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'blur(40px) saturate(1.15)',
        mixBlendMode: 'overlay',
      }}
    />
  ) : null;

  // Global edge glow — a giant vignette of the accent color that pulses around
  // the window edges. Scales with the effects level so it's invisible at 0,
  // subtle at Med, and unmistakable at Max. This is what makes higher levels
  // feel "alive" — the whole viewport gets rimmed with accent light.
  const edgeGlowLayer = edgeGlow > 0 ? (
    <motion.div
      key={`edge-${theme}-${level}`}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[5]"
      initial={{ opacity: edgeGlow * 0.6 }}
      animate={{ opacity: [edgeGlow * 0.55, edgeGlow * 1.0, edgeGlow * 0.55] }}
      transition={{ duration: 4.5 * motionDurationScale, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        boxShadow: `inset 0 0 ${Math.round(60 + edgeGlow * 120)}px ${Math.round(20 + edgeGlow * 40)}px rgb(var(--accent) / ${(0.15 + edgeGlow * 0.25).toFixed(2)})`,
      }}
    />
  ) : null;

  // Extra floating layers (only at High/Max) — soft radial blobs of accent-2
  // that drift across the viewport. Cheap on GPU (just background-position
  // animation), heavy on vibe.
  const extraLayersEl = extraLayerCount > 0 ? (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[3]">
      {Array.from({ length: extraLayerCount }).map((_, i) => (
        <motion.div
          key={`blob-${i}`}
          className="absolute rounded-full visual-motion"
          style={{
            width: 500 + i * 120, height: 500 + i * 120,
            left: `${20 + i * 25}%`, top: `${10 + i * 30}%`,
            background: `radial-gradient(circle, rgb(var(--accent${i % 2 === 0 ? '' : '-2'}) / ${(0.10 + edgeGlow * 0.06).toFixed(2)}) 0%, transparent 65%)`,
            filter: 'blur(40px)',
          }}
          animate={{
            x: [0, 60, -40, 0],
            y: [0, -30, 40, 0],
          }}
          transition={{ duration: (22 + i * 4) * motionDurationScale, repeat: Infinity, ease: 'linear' }}
        />
      ))}
    </div>
  ) : null;

  // Vaporwave Day — clouds + neon grid floor
  if (theme === 'synthwave-day') {
    return (
      <>
        {gameBgLayer}
        {extraLayersEl}
        <div aria-hidden data-visual-cadence={cadence} className="fx-cadence-layer pointer-events-none fixed inset-0 z-0 overflow-hidden" style={{ opacity: intensity }}>
          {level > 0 && <ThemeArtwork theme={theme} level={level} cadence={cadence} />}
          <div className="vapor-clouds" />
          <div className="vapor-floor" />
          {showParticles && <Particles count={particleBaseCount} theme={theme} />}
        </div>
        {edgeGlowLayer}
      </>
    );
  }
  // Synthwave — grid + horizon + accent glow
  if (theme === 'synthwave') {
    return (
      <>
        {gameBgLayer}
        {extraLayersEl}
        <div aria-hidden data-visual-cadence={cadence} className="fx-cadence-layer pointer-events-none fixed inset-0 z-0 overflow-hidden" style={{ opacity: intensity }}>
          {level > 0 && <ThemeArtwork theme={theme} level={level} cadence={cadence} />}
          <div className="synth-grid" />
          <div className="synth-horizon" />
          <div
            className="absolute -top-40 left-1/2 h-[60vh] w-[80vw] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
            style={{ background: 'radial-gradient(circle, rgb(var(--accent)/0.45), transparent 60%)' }}
          />
          {showParticles && <Particles count={particleBaseCount} theme={theme} />}
        </div>
        {edgeGlowLayer}
      </>
    );
  }
  // All other themes get their own subtle ambient backdrop.
  // v1.2.8 — any theme (including future ones like Gaming/Modern that don't
  // have a dedicated ambClass) still gets particles + edge glow so the
  // effects slider is meaningful everywhere.
  // Special themes (Anime, Magical, Industrial) get amb-* backdrops PLUS extra
  // shooting-star and sparkle layers on top of the standard particle count.
  const ambClass = {
    midnight: 'amb-midnight',
    daybreak: 'amb-daybreak',
    ocean:    'amb-ocean',
    crimson:  'amb-crimson',
    anime:    'amb-anime',
    mint:     'amb-mint',
    gaming:   'amb-gaming',
    modern:   'amb-modern',
    home:     'amb-home',
    colorful: 'amb-colorful',
    pro:      'amb-pro',
    'generic-gray': 'amb-generic-gray',
    'generic-blue': 'amb-generic-blue',
    monochrome: 'amb-monochrome',
  }[theme];
  const isSpecial = ['anime', 'colorful', 'pro'].includes(theme);
  const specialDecorationOpacity = Math.max(0, Math.min(100, Number(settings.specialDecorationOpacity ?? 46))) / 100;
  // Special themes bump particle count so they always feel "extra"
  const particleCount = isSpecial
    ? Math.max(particleBaseCount * 1.5, Math.round(12 * cadenceProfile.particle)) | 0
    : (theme === 'crimson' ? particleBaseCount + Math.round(lvl.crimsonBoost * cadenceProfile.particle) : particleBaseCount);
  return (
    <>
      <ThemeCanvasAnimation theme={theme} level={level} cadence={cadence} />
      {extraLayersEl}
      <div aria-hidden data-visual-cadence={cadence} className="fx-cadence-layer pointer-events-none fixed inset-0 z-0 overflow-hidden" style={{ opacity: intensity }}>
        {ambClass && <div className={ambClass} />}
        {level > 0 && <ThemeArtwork theme={theme} level={level} cadence={cadence} />}
        {(isSpecial || theme.startsWith('custom:')) && level > 0 && specialDecorationOpacity > 0 && <SpecialThemeDecoration theme={theme} opacity={specialDecorationOpacity} />}
        {theme !== 'anime' && level > 0 && <ThemeIllustration theme={theme} level={level} />}
        {theme === 'anime' && sakuraCount > 0 && <Sakura count={sakuraCount} />}
        {/* Shooting stars — Magical only, only if effects level >= Low */}
        {theme === 'colorful' && level > 0 && (
          <div className="shooting-stars">
            {Array.from({ length: Math.max(2, level + 1) }).map((_, i) => (
              <span
                key={i}
                style={{
                  top: `${8 + i * 22}%`,
                  animationDelay: `${i * 1.6}s`,
                  animationDuration: `${5 + (i % 3)}s`,
                }}
              />
            ))}
          </div>
        )}
        {customThemeManifest(theme)
          ? <CustomThemeParticles theme={theme} level={level} cadence={cadence} eventPulse={eventPulse} />
          : showParticles && <Particles count={particleCount} theme={theme} />}
      </div>
      {edgeGlowLayer}
    </>
  );
}

function ThemeCanvasAnimation({ theme, level, cadence }) {
  const layer = customThemeManifest(theme)?.layers?.canvas;
  if (!layer || !['gif', 'video'].includes(layer.type) || level === 0 || cadence === 'calm') return null;
  const animatedUrl = customThemeAssetUrl(theme, layer.asset);
  const stillUrl = customThemeAssetUrl(theme, layer.reducedMotionAsset);
  if (!animatedUrl || !stillUrl) return null;
  const props = {
    animatedUrl, stillUrl, loop: layer.loop, showStill: false,
    className: 'absolute inset-0 h-full w-full object-cover',
    style: { opacity: layer.opacity ?? 1 },
  };
  return <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
    {layer.type === 'gif'
      ? <ThemeGifMedia key={`${theme}-${layer.loop}`} {...props} playbackMs={layer.playbackMs} />
      : <ThemeVideoMedia key={`${theme}-${layer.loop}`} {...props} />}
  </div>;
}

/**
 * Purpose-built raster atmosphere for themes that benefit from a calm, more
 * physical backdrop than lines and particles alone can provide. These stay
 * beneath every UI surface, never animate at Rest, and fade with the existing
 * FX level so readability remains the priority.
 */
function ThemeArtwork({ theme, level = 2, cadence = 'full' }) {
  const artwork = stockThemeAssetUrl(theme, 'atmosphere');
  if (!artwork) return null;
  const mediaLayer = customThemeManifest(theme)?.layers?.atmosphere;
  const isGif = mediaLayer?.type === 'gif';
  const isVideo = mediaLayer?.type === 'video';
  const motionClass = cadence === 'calm' || isGif || isVideo ? '' : 'theme-artwork-drift';
  // The earlier treatment was too dim to read as actual art beneath glass
  // panels. This stays below every interaction layer, but is now deliberately
  // present at normal FX levels instead of behaving like a nearly invisible
  // colour wash.
  const opacity = Math.min(0.58, 0.22 + (level * 0.08)) * (customThemeManifest(theme)?.layers?.atmosphere?.opacity ?? 1);
  return (
    <div
      aria-hidden
      className={`theme-artwork theme-artwork-${theme} ${motionClass}`}
      style={{
        opacity,
        backgroundImage: isGif || isVideo ? undefined : `url("${artwork}")`,
      }}
    >{isGif && <ThemeGifMedia key={`${theme}-${mediaLayer.loop}`} animatedUrl={artwork} stillUrl={customThemeAssetUrl(theme, mediaLayer.reducedMotionAsset)} loop={mediaLayer.loop} playbackMs={mediaLayer.playbackMs} forceStill={cadence === 'calm'} className="absolute inset-0 h-full w-full object-cover" />}
      {isVideo && <ThemeVideoMedia animatedUrl={artwork} stillUrl={customThemeAssetUrl(theme, mediaLayer.reducedMotionAsset)} loop={mediaLayer.loop} forceStill={cadence === 'calm'} className="absolute inset-0 h-full w-full object-cover" />}</div>
  );
}

// Small, theme-owned foreground flourishes for the three showpiece modes.
// They are decorative background actors only: no event listeners, no polling,
// and Rest Mode removes the whole ambient layer before they can render.
function SpecialThemeDecoration({ theme, opacity = 0.46 }) {
  const asset = stockThemeAssetUrl(theme, 'decoration');
  if (!asset) return null;
  // The atmosphere layer already respects FX level. Give the showpiece art a
  // slightly stronger presence than a normal particle so an ordinary 46%
  // player setting still reads as deliberate illustration rather than a faint
  // colour wash. At 0% the component is not mounted at all.
  return <div aria-hidden className={`special-theme-decoration special-decoration--${theme}`} style={{ opacity: Math.min(0.92, Math.max(0, opacity * 1.35)) * (customThemeManifest(theme)?.layers?.decoration?.opacity ?? 1) }}><img src={asset} alt="" className="special-theme-decoration-art" /></div>;
}

export function WorkspaceEmpty({ kind }) {
  const tools = kind === 'tools';
  return <section className="grid h-full place-items-center px-6 py-8" data-testid={`workspace-empty-${kind}`}>
    <div className="max-w-sm rounded-2xl border border-dashed border-[rgb(var(--border)/0.78)] bg-[rgb(var(--panel)/0.34)] px-7 py-8 text-center shadow-[0_20px_60px_-42px_rgba(0,0,0,.9)]">
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[rgb(var(--accent-2))]">{tools ? 'Your tools' : 'Your library'}</p>
      <h1 className="mt-2 text-lg font-black text-ink">{tools ? 'Add programs first' : 'No game selected'}</h1>
      <p className="mt-2 text-xs leading-relaxed text-muted">{tools ? 'Add a program from the Tools menu. Your most recently used tool will appear here afterwards.' : 'Choose a game from the Library, or use Add to bring one into NEO-LIB.'}</p>
    </div>
  </section>;
}

/** Original, low-opacity vector motifs for each theme. They are decorative
 * rather than franchise artwork, so every theme gets a recognisable identity
 * while the library and selected game's own art remain the focus. */
function ThemeIllustration({ theme, level = 2 }) {
  const art = {
    synthwave: <><circle cx="1282" cy="262" r="144" /><path d="M1090 262h384M1116 308h332M1144 354h276M0 792l300-182 168 92 196-208 192 198 238-242 222 282" /></>,
    'synthwave-day': <><path d="M0 610c132-104 232-82 346 12 122-118 248-130 384-14 144-92 276-84 402 18 144-112 290-118 468-14" /><path d="M160 752c80-170 168-246 254-244M212 704c84-36 164-28 236 18M1394 754c-72-160-154-238-244-246M1170 722c70-44 150-52 230-12" /><circle cx="1246" cy="212" r="98" /></>,
    midnight: <><path d="M1250 110a144 144 0 1 0 122 214 132 132 0 1 1-122-214Z" /><path d="M122 672l162-106 128 76 146-170 112 160 162-92 118 132 148-182 148 182" /><path d="M408 184l26 52 56 8-41 39 10 56-51-28-50 28 10-56-42-39 57-8zM824 108l17 35 39 5-28 28 7 39-35-19-35 19 8-39-29-28 39-5z" /></>,
    daybreak: <><circle cx="1250" cy="326" r="126" /><path d="M1042 612V370h416v242M1100 612V432h300v180M0 710h810M890 710h710M1120 760h360" /><path d="M1034 370c64-138 170-204 316-204s252 66 316 204" /></>,
    ocean: <><path d="M1022 276c0-122 94-206 190-206s190 84 190 206c0 70-54 110-190 110s-190-40-190-110Z" /><path d="M1090 386c-36 98-22 166 28 244M1160 386c-20 128-8 220 42 306M1238 386c18 116 28 204-10 296M1308 386c38 96 44 178 10 246" /><path d="M0 690c142-86 278-86 420 0s280 86 426 0 290-86 454 0 230 86 300 0" /></>,
    crimson: <><path d="M1210 304c-92-148-246-36-156 84-138-16-150 168-10 158-70 126 110 190 166 66 58 124 238 60 168-66 140 10 128-174-10-158 90-120-64-232-156-84Z" /><path d="M1210 386c-62 36-76 98-46 156M1210 386c70 22 100 82 60 148M1210 386c4 76-28 126-82 156M1134 628c-36 90-106 128-194 152M1288 628c36 90 104 128 194 152" /><path d="M78 788l282-114 92 52 174-168 154 174 204-118 218 162 330-176" /></>,
    mint: <><path d="M244 770c32-232 126-384 286-466M276 620c-102-6-174-54-216-144 112-24 206 22 286 144M410 482c-30-98-2-178 84-242 48 94 18 176-84 242M1356 778c-26-216-114-366-270-450M1334 626c102-10 172-60 206-150-112-18-202 32-272 150M1194 494c28-102-4-180-94-240-44 96-12 176 94 240" /><path d="M440 764c160-102 540-102 712 0" /></>,
    gaming: <><path d="M72 696h1456M196 696V432h1208v264M344 432l100-160h712l100 160M588 696V540h424v156" /><path d="M682 504c0-74 58-132 130-132s130 58 130 132c0 84-76 136-130 170-54-34-130-86-130-170Z" /></>,
    modern: <><path d="M1042 736V240h154v496M1218 736V382h128v354M1370 736V172h170v564M92 736V454h244v282M362 736V292h196v444M590 736V510h176v226" /><path d="M54 146h526M54 190h404M1008 112h532M1170 764h370" /></>,
    colorful: <><path d="M1210 128l42 116 120 4-94 76 32 118-100-62-102 62 34-118-96-76 122-4z" /><path d="M144 716l192-120 178 110 190-220 192 212 194-130 170 150 178-106" /><circle cx="418" cy="214" r="64" /><circle cx="630" cy="330" r="28" /><circle cx="1468" cy="620" r="52" /></>,
    pro: <><path d="M1030 178h378l118 116v378l-118 116h-378l-118-116V294zM1110 258h218l78 78v294l-78 78h-218l-78-78V336z" /><path d="M0 704h900M0 750h900M100 704l72 46 72-46 72 46 72-46 72 46 72-46 72 46 72-46 72 46 72-46" /></>,
    monochrome: <><path d="M86 160h430v430H86zM168 242h266v266H168zM1080 126h364v364h-364zM1162 208h200v200h-200z" /><circle cx="790" cy="448" r="188" /><circle cx="790" cy="448" r="116" /><path d="M0 730h1600M616 90v720M964 90v720" /></>,
  }[theme];
  if (!art) return null;
  return (
    <div aria-hidden className={`theme-illustration theme-illustration--${theme}`} style={{ opacity: 0.13 + level * 0.055 }}>
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" role="presentation">{art}</svg>
    </div>
  );
}

function Sakura({ count = 18 }) {
  const items = React.useMemo(() =>
    Array.from({ length: count }).map((_, i) => ({
      left: `${(i * 173) % 100}%`,
      delay: `${(i * 1.7) % 14}s`,
      duration: `${10 + (i % 6) * 3}s`,
      scale: 0.6 + ((i % 5) * 0.18),
    })),
  [count]);
  return (
    <div className="sakura">
      {items.map((p, i) => (
        <span
          key={i}
          style={{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
            transform: `scale(${p.scale})`,
          }}
        />
      ))}
    </div>
  );
}

function Particles({ count = 10, theme = 'synthwave' }) {
  // Pre-compute deterministic positions so they don't jump on re-render
  const items = React.useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      left: `${(i * 173) % 100}%`,
      delay: `${(i * 1.37) % 12}s`,
      duration: `${10 + (i % 5) * 2}s`,
      scale: 0.6 + ((i % 5) * 0.15),
    }));
  }, [count]);
  return (
    <div className={`particles particles--${theme}`}>
      {items.map((p, i) => (
        <span
          key={i}
          style={{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
            transform: `scale(${p.scale})`,
          }}
        />
      ))}
    </div>
  );
}


/* ---------- Background texture layer (v1.4.0, revised v1.6.4) ----------
   v1.6.4 — Moved OUT of the fixed viewport overlay. The full-window mix-blend
   overlay was muddying hero banners and preview screenshots on the right pane.
   Now rendered as a `background-image` layer INSIDE the sidebar only, where
   the user actually wanted the "not blank" look. Hero/preview area stays
   pristine. Exposed as a helper hook that returns inline style — Sidebar
   picks it up and applies it to its own background. */
export function useBgTextureStyle(textureId = 'none', opacity = 40) {
  return React.useMemo(() => {
    if (!textureId || textureId === 'none' || opacity <= 0) return null;
    const patterns = {
      grain: {
        backgroundImage:
          'radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px),' +
          'radial-gradient(rgba(0,0,0,0.35) 1px, transparent 1px)',
        backgroundSize: '3px 3px, 5px 5px',
        backgroundPosition: '0 0, 1px 1px',
      },
      grid: {
        backgroundImage:
          'linear-gradient(rgb(var(--accent) / 0.9) 1px, transparent 1px),' +
          'linear-gradient(90deg, rgb(var(--accent-2) / 0.75) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      },
      diagonal: {
        backgroundImage:
          'repeating-linear-gradient(135deg, rgb(var(--accent) / 0.7) 0 1px, transparent 1px 14px)',
      },
      hex: {
        backgroundImage:
          'radial-gradient(circle at 25% 25%, rgb(var(--accent) / 0.9) 1.5px, transparent 2px),' +
          'radial-gradient(circle at 75% 75%, rgb(var(--accent-2) / 0.8) 1.5px, transparent 2px)',
        backgroundSize: '28px 28px',
      },
      dots: {
        backgroundImage: 'radial-gradient(rgb(var(--accent) / 0.85) 1.2px, transparent 2px)',
        backgroundSize: '18px 18px',
      },
      scanlines: { backgroundImage: 'repeating-linear-gradient(0deg, rgb(var(--accent) / 0.85) 0 1px, transparent 1px 6px)' },
      circuit: { backgroundImage: 'linear-gradient(rgb(var(--accent) / 0.7) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--accent) / 0.7) 1px, transparent 1px), radial-gradient(rgb(var(--accent-2) / 0.9) 1.5px, transparent 2.5px)', backgroundSize: '24px 24px, 24px 24px, 24px 24px', backgroundPosition: '0 0, 0 0, 12px 12px' },
      chevron: { backgroundImage: 'repeating-linear-gradient(45deg, rgb(var(--accent) / 0.8) 0 2px, transparent 2px 12px), repeating-linear-gradient(-45deg, rgb(var(--accent-2) / 0.7) 0 2px, transparent 2px 12px)' },
      weave: { backgroundImage: 'repeating-linear-gradient(0deg, rgb(var(--accent) / 0.42) 0 1px, transparent 1px 8px), repeating-linear-gradient(90deg, rgb(var(--accent-2) / 0.30) 0 1px, transparent 1px 8px)', backgroundSize: '16px 16px' },
      brushed: { backgroundImage: 'repeating-linear-gradient(105deg, rgb(var(--accent) / 0.30) 0 1px, transparent 1px 5px), repeating-linear-gradient(105deg, transparent 0 8px, rgb(var(--accent-2) / 0.18) 8px 9px, transparent 9px 17px)' },
      stardust: { backgroundImage: 'radial-gradient(circle at 20% 30%, rgb(var(--accent-2) / 0.7) 0 1px, transparent 1.8px), radial-gradient(circle at 75% 70%, rgb(var(--accent) / 0.6) 0 1.2px, transparent 2px)', backgroundSize: '34px 34px, 53px 53px' },
    };
    return { ...patterns[textureId], opacity: Math.max(0, Math.min(100, opacity)) / 100 };
  }, [textureId, opacity]);
}
