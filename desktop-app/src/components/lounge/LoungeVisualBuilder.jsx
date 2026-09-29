import React from 'react';
import { ImagePlus, Layers3, RotateCcw, Sparkles, Waves, X } from 'lucide-react';
import { DEFAULT_LOUNGE_PREFERENCES, normalizeLoungePreferences } from './lounge-layout-model.mjs';
import LoungeLivingBackdrop from './LoungeLivingBackdrop';
import LoungeCover from './LoungeCover';
import builtinParticles from '../../../electron/themes/builtin-particles.json';
import { LOUNGE_EXTRA_PARTICLES, LOUNGE_PARTICLE_COLORS } from './lounge-particle-presets.mjs';

const BACKGROUNDS = [
  ['theme', 'Current theme', 'Use this theme’s own artwork and colour.'],
  ['game', 'Selected game', 'Follow the game you highlight; use theme art if it has no wide image.'],
  ['image', 'My artwork', 'Show an image you choose on this computer.'],
  ['light', 'Soft light', 'A bright canvas behind the Lounge controls.'],
  ['dark', 'Deep dark', 'A quiet, high-contrast canvas.'],
  ['clear', 'Clear', 'Remove the artwork layer; keep theme colour.'],
];
const MOTION = [['drift', 'Slow drift'], ['waves', 'Light waves'], ['still', 'Still']];
const PACE = [['slow', 'Slow'], ['steady', 'Steady'], ['lively', 'Lively']];
const SPEED = [['full', 'Alive'], ['subtle', 'Gentle'], ['off', 'Motion off']];
const COVER_GLOW = [['off', 'Off'], ['soft', 'Soft outline'], ['neon', 'Animated neon']];
const PREVIEW_STYLES = [['cinema', 'Cinematic'], ['framed', 'Framed art'], ['clean', 'Clean']];
const INFO_DENSITIES = [['minimal', 'Minimal'], ['balanced', 'Balanced'], ['rich', 'Detailed']];
const PARTICLE_CHOICES = [
  { id: 'theme', label: 'Follow theme', description: 'Keep the theme’s own particles.' },
  { id: 'none', label: 'No particles', description: 'Keep light and background motion.' },
  ...builtinParticles.map(({ id, label, description, pngBase64 }) => ({ id, label, description, image: `data:image/png;base64,${pngBase64}` })),
  ...LOUNGE_EXTRA_PARTICLES,
];

function Stepper({ label, value, min, max, step = 5, unit = '%', onChange }) {
  return <div className="mt-4 rounded-xl border border-[rgb(var(--border)/0.7)] bg-[rgb(var(--panel)/0.42)] p-3"><div className="mb-2 flex items-center justify-between gap-3 text-sm"><span className="font-bold">{label}</span><strong className="text-[rgb(var(--accent-2))]">{value}{unit}</strong></div><div className="flex items-center gap-3"><button type="button" aria-label={`Decrease ${label}`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - step))} className="lounge-visual-step rounded-lg border border-[rgb(var(--border))] px-4 py-2 font-black disabled:opacity-40">−</button><input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={event => onChange(Number(event.target.value))} className="min-w-0 flex-1 accent-[rgb(var(--accent))]" /><button type="button" aria-label={`Increase ${label}`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + step))} className="lounge-visual-step rounded-lg border border-[rgb(var(--border))] px-4 py-2 font-black disabled:opacity-40">+</button></div></div>;
}

function ParticlePicker({ value, onChange, scene }) {
  return <fieldset className="mt-5"><legend className="text-sm font-black">Lounge particles</legend><p className="mt-1 text-xs text-muted">Choose a particle look for Lounge only. The desktop theme stays untouched.</p><div data-controller-grid className="mt-3 grid gap-2 sm:grid-cols-2">{PARTICLE_CHOICES.map(choice => <button key={choice.id} type="button" aria-pressed={value === choice.id} onClick={() => onChange(choice.id)} className={`lounge-visual-choice flex min-h-14 items-center gap-3 rounded-xl border p-2 text-left ${value === choice.id ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.18)]' : 'border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.45)]'}`}>{choice.image ? <img src={choice.image} alt="" className="h-9 w-9 shrink-0 object-contain" /> : <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[rgb(var(--accent)/0.12)]"><Sparkles size={18} /></span>}<span><strong className="block text-xs">{choice.id === 'theme' && scene !== 'theme' ? 'Scene starlight' : choice.label}</strong><small className="block text-[10px] text-muted">{choice.id === 'theme' && scene !== 'theme' ? 'Soft stars chosen for this Lounge scene.' : choice.description}</small></span></button>)}</div></fieldset>;
}

const ParticlePreview = React.memo(function ParticlePreview({ styleId, active, amount = 100, randomness = 50, color = 'original', opacity = 70, size = 100, trail = 45, glow = 65, speed = 100 }) {
  const preset = builtinParticles.find(item => item.id === styleId) || LOUNGE_EXTRA_PARTICLES.find(item => item.id === styleId);
  if (!active || !preset || amount === 0) return null;
  const source = preset.pngBase64 ? 'data:image/png;base64,' + preset.pngBase64 : '';
  const tint = LOUNGE_PARTICLE_COLORS.find(item => item.id === color)?.css || '';
  const count = Math.max(1, Math.round(14 * amount / 100));
  return <div data-testid="lounge-particle-preview" aria-hidden="true" className="lounge-particle-preview pointer-events-none absolute inset-0 z-[1] overflow-hidden">{Array.from({ length: count }, (_, index) => {
    const spread = randomness / 100;
    const style = {
      left: String((index * 23 + 9 + spread * ((index * 31) % 17)) % 90) + '%',
      top: String((index * 29 + 8 + spread * ((index * 19) % 13)) % 70) + '%',
      width: Math.min(54, preset.sizePx * size / 100),
      height: preset.shape === 'comet' ? 2 + trail / 10 : Math.min(54, preset.sizePx * size / 100),
      '--particle-glow': glow / 100,
      '--particle-glow-blur': `${3 + glow / 100 * 15}px`,
      '--particle-glow-spread': `${8 + glow / 100 * 20}px`,
      '--particle-trail': trail / 100,
      '--particle-trail-length': `${24 + trail / 100 * 86}px`,
      '--fx-opacity': opacity / 100,
      color: tint || preset.color,
      animationDuration: String(Math.max(2, preset.durationSeconds * 0.55 + index * 0.7) * (100 / speed)) + 's',
      animationDelay: String(-index * 1.4) + 's',
    };
    const className = 'lounge-particle-preview__item lounge-particle-preview__item--' + preset.direction;
    if (source && !tint) return <img key={index} src={source} alt="" className={className} style={style} />;
    return <span key={index} className={className + ' lounge-procedural-particle lounge-procedural-particle--' + (preset.shape || 'sprite')} style={{ ...style, color: tint || preset.color, backgroundColor: tint || preset.color, ...(source ? { maskImage: 'url(' + JSON.stringify(source) + ')', WebkitMaskImage: 'url(' + JSON.stringify(source) + ')', maskSize: 'contain', WebkitMaskSize: 'contain', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat' } : {}) }} />;
  })}</div>;
});

export default function LoungeVisualBuilder({ preferences, game, theme = 'synthwave', loungeLevel = 2, flowOpacity, flowSeconds, effectsActive = true, onChange, onClose }) {
  const closeRef = React.useRef(null);
  const [error, setError] = React.useState('');
  const [imageFailed, setImageFailed] = React.useState(false);
  const [screenSize, setScreenSize] = React.useState(() => `${Math.round(window.innerWidth * window.devicePixelRatio)} × ${Math.round(window.innerHeight * window.devicePixelRatio)}`);
  React.useEffect(() => { closeRef.current?.focus(); }, []);
  React.useEffect(() => { const resize = () => setScreenSize(`${Math.round(window.innerWidth * window.devicePixelRatio)} × ${Math.round(window.innerHeight * window.devicePixelRatio)}`); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize); }, []);
  React.useEffect(() => { setImageFailed(false); }, [preferences.backgroundUrl]);
  const set = patch => onChange(normalizeLoungePreferences({ ...preferences, ...patch }));
  const pickBackground = async () => {
    if (!window.api?.importLoungeBackground) { setError('Choose artwork in the installed Windows app.'); return; }
    try {
      const picked = await window.api.importLoungeBackground();
      if (!picked) return;
      if (!picked.ok) { setError(picked.error || 'Could not import this image.'); return; }
      const next = normalizeLoungePreferences({ ...preferences, backdropMode: 'image', backgroundUrl: picked.url });
      if (!next.backgroundUrl) { setError('This image path could not be saved.'); return; }
      setError('');
      onChange(next);
    } catch { setError('Could not import this image.'); }
  };
  const visualReset = () => {
    const keys = ['backdropMode', 'backgroundUrl', 'backgroundOpacity', 'backgroundFit', 'backgroundPositionX', 'backgroundPositionY', 'backgroundZoom', 'panelOpacity', 'shelfOpacity', 'previewPosition', 'previewWidth', 'previewBoxHeight', 'previewVerticalOffset', 'previewCornerRadius', 'previewTextScale', 'previewPanelOpacity', 'previewShowCover', 'previewShowDescription', 'previewShowFacts', 'previewShowProgress', 'previewShowIndex', 'previewShowFactIcons', 'previewShowPlaytime', 'previewShowJourney', 'previewShowSource', 'previewShowRelease', 'previewShowYourRating', 'previewShowMetacritic', 'ambientMotion', 'ambientPace', 'waveStrength', 'atmosphereOpacity', 'lightBloom', 'lightRays', 'highlightPulse', 'vignette', 'waveScale', 'motion', 'fxLevel', 'particleStyle', 'particleAmount', 'particleRandomness', 'particleColor', 'particleOpacity', 'particleSize', 'particleTrail', 'particleGlow', 'particleSpeed', 'coverGlow', 'previewStyle', 'infoDensity'];
    set(Object.fromEntries(keys.map(key => [key, DEFAULT_LOUNGE_PREFERENCES[key]])));
  };
  return <div role="dialog" aria-modal="true" aria-label="Lounge visual builder" data-testid="lounge-visual-builder" className="fixed inset-0 z-[9100] flex items-center justify-center bg-black/80 p-3 sm:p-6" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="lounge-visual-builder flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-[rgb(var(--accent)/0.55)] bg-[rgb(var(--surface))] shadow-[0_28px_100px_rgb(0_0_0/0.55)]">
      <header className="lounge-guide-heading flex shrink-0 items-center justify-between gap-3 border-b border-[rgb(var(--border))] px-5 py-4 sm:px-7"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[rgb(var(--accent)/0.18)] text-[rgb(var(--accent-2))]"><Sparkles size={24} /></span><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[rgb(var(--accent-2))]">Lounge only</p><h2 className="text-xl font-black sm:text-2xl">Visual Builder</h2></div></div><button ref={closeRef} type="button" data-controller-close onClick={onClose} aria-label="Close Lounge visual builder" className="lounge-visual-step rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.7)] p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[rgb(var(--accent))]"><X size={20} /></button></header>
      <div className="shrink-0 border-b border-[rgb(var(--border)/0.7)] bg-[rgb(var(--surface))] px-5 pb-4 pt-4 sm:px-7">
        <div className="mb-3 flex items-center gap-2"><ImagePlus size={19} className="text-[rgb(var(--accent-2))]" /><h3 className="text-lg font-black">Background</h3><span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-muted">Live preview · stays visible</span></div>
        <p className="mb-3 text-sm text-muted">Choose what sits behind your games. Desktop themes stay untouched.</p>
        <div data-testid="lounge-visual-preview" className="lounge-visual-preview relative z-20 flex h-40 items-end overflow-hidden rounded-2xl border border-[rgb(var(--accent)/0.45)] sm:h-48" data-lounge-cover-glow={preferences.coverGlow} style={{ '--lounge-panel-opacity': preferences.panelOpacity / 100, '--lounge-shelf-opacity': preferences.shelfOpacity / 100, '--lounge-preview-panel-opacity': preferences.previewPanelOpacity / 100, '--lounge-atmosphere-opacity': preferences.atmosphereOpacity / 100, '--lounge-light-bloom': preferences.lightBloom / 100, '--lounge-vignette': preferences.vignette / 100, '--lounge-vignette-blur': `${preferences.vignette * 0.9}px`, '--lounge-vignette-alpha': preferences.vignette / 100 * 0.32, '--lounge-wave-size': `${150 + preferences.waveScale}%` }}>
          <LoungeLivingBackdrop theme={theme} game={game} loungeLevel={loungeLevel} motion={preferences.motion} active={effectsActive} flowOpacity={flowOpacity} flowSeconds={flowSeconds} preferences={preferences} />
          {preferences.backdropMode === 'image' && preferences.backgroundUrl && !imageFailed && <img src={preferences.backgroundUrl} alt="" onError={() => { setImageFailed(true); setError('The chosen image is unavailable. Choose it again.'); }} className="pointer-events-none absolute h-px w-px opacity-0" />}
          <ParticlePreview styleId={preferences.particleStyle === 'theme' && preferences.specialTheme !== 'theme' ? 'starlight' : preferences.particleStyle} active={effectsActive} amount={preferences.particleAmount} randomness={preferences.particleRandomness} color={preferences.particleColor} opacity={preferences.particleOpacity} size={preferences.particleSize} trail={preferences.particleTrail} glow={preferences.particleGlow} speed={preferences.particleSpeed} />
          <div className="lounge-flow pointer-events-none absolute inset-0" aria-hidden="true" style={{ '--lounge-flow-opacity': effectsActive ? flowOpacity : 0, '--lounge-flow-seconds': String(flowSeconds) + 's' }} />
          <div className="relative z-10 flex h-full w-full items-end p-3 pb-14" style={{ justifyContent: { left: 'flex-start', center: 'center', right: 'flex-end' }[preferences.previewPosition] }}>
            <div className="min-w-0 border border-white/30 p-2.5 text-white shadow-lg" style={{ width: String(preferences.previewWidth) + '%', minHeight: Math.min(90, preferences.previewBoxHeight / 4), marginBottom: preferences.previewVerticalOffset / 4, borderRadius: Math.max(0, preferences.previewCornerRadius / 2), fontSize: `${preferences.previewTextScale}%`, backgroundColor: 'rgb(var(--panel) / ' + preferences.previewPanelOpacity / 100 + ')' }}>
              <span className="block truncate text-[8px] font-black uppercase tracking-widest text-[rgb(var(--accent-2))]">Now in focus</span>
              <strong className="mt-1 block line-clamp-2 leading-tight" style={{ fontSize: `${14 * preferences.previewTextScale / 100}px` }}>{game?.name || 'Your game'}</strong>
              {preferences.previewShowDescription && <span className="mt-1 block truncate text-[9px] text-white/80">{game?.shortDescription || 'Game details in your Lounge'}</span>}
              {preferences.previewShowFacts && <span className="mt-1 block line-clamp-2 text-[8px] text-white/75">{[preferences.previewShowPlaytime && 'Playtime', preferences.previewShowJourney && 'Journey', preferences.previewShowSource && 'Source', preferences.previewShowRelease && 'Released', preferences.previewShowYourRating && 'Your rating', preferences.previewShowMetacritic && 'Metacritic'].filter(Boolean).join(' · ')}</span>}
              {preferences.previewShowProgress && <span className="mt-2 block h-0.5 w-2/3 rounded-full bg-[rgb(var(--accent))]" />}
            </div>
          </div>
          <div className="absolute inset-x-2 bottom-2 z-10 flex h-10 items-center gap-2 rounded-lg border border-[rgb(var(--border)/0.7)] px-2" style={{ backgroundColor: 'rgb(var(--panel) / ' + preferences.shelfOpacity / 100 + ')' }}>
            {game && <span className="h-8 w-6 shrink-0 overflow-hidden rounded border border-[rgb(var(--accent))]"><LoungeCover game={game} /></span>}
            <span className="truncate text-[10px] font-bold text-ink">{game?.name || 'Game carousel'}</span>
          </div>
        </div>
      </div>
      <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]"><div className="min-w-0 p-5 sm:p-7">
        <p className="mt-2 text-xs text-muted">The backdrop, light and glass use Lounge's live layers; this is a miniature composition, not a full-screen screenshot.</p>
        <div data-controller-grid className="mt-4 grid gap-2 sm:grid-cols-2">{BACKGROUNDS.map(([id, title, note]) => <button key={id} type="button" aria-pressed={preferences.backdropMode === id} onClick={() => set({ backdropMode: id })} className={`lounge-visual-choice rounded-xl border p-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[rgb(var(--accent))] ${preferences.backdropMode === id ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.17)]' : 'border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.45)]'}`}><strong className="block text-sm">{title}</strong><span className="mt-1 block text-xs text-muted">{note}</span></button>)}</div>
        <button type="button" onClick={pickBackground} className="lounge-visual-choice mt-3 inline-flex min-h-12 items-center gap-2 rounded-xl border border-[rgb(var(--accent)/0.65)] bg-[rgb(var(--accent)/0.13)] px-4 py-2 text-sm font-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-[rgb(var(--accent))]"><ImagePlus size={18} /> Choose my image</button><p className="mt-2 text-xs text-muted">NEO-LIB keeps its own copy. You can move the original afterward.</p>{error && <p role="alert" className="mt-2 text-sm font-semibold text-rose-300">{error}</p>}
        <Stepper label="Artwork visibility" value={preferences.backgroundOpacity} min={0} max={100} onChange={backgroundOpacity => set({ backgroundOpacity })} />
        {preferences.backdropMode === 'game' && <><p className="mt-4 text-xs font-bold text-[rgb(var(--accent-2))]">Lounge window {screenSize} · artwork adapts to your screen shape</p><div className="mt-2 flex flex-wrap gap-2">{[['adaptive', 'Smart fit'], ['fit', 'Show full image'], ['fill', 'Fill screen']].map(([id, label]) => <button key={id} type="button" aria-pressed={preferences.backgroundFit === id} onClick={() => set({ backgroundFit: id })} className="lounge-visual-choice rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-xs font-bold">{label}</button>)}</div><p className="mt-2 text-xs text-muted">Smart fit avoids magnifying a normal wide image across an ultrawide display. Empty side space uses your theme colours.</p><Stepper label="Artwork horizontal position" value={preferences.backgroundPositionX} min={0} max={100} onChange={backgroundPositionX => set({ backgroundPositionX })} /><Stepper label="Artwork zoom" value={preferences.backgroundZoom} min={70} max={140} onChange={backgroundZoom => set({ backgroundZoom })} /></>}
        <Stepper label="Artwork vertical position" value={preferences.backgroundPositionY} min={0} max={100} onChange={backgroundPositionY => set({ backgroundPositionY })} />
        <Stepper label="Main Lounge surfaces opacity" value={preferences.panelOpacity} min={40} max={100} onChange={panelOpacity => set({ panelOpacity })} />
        <Stepper label="Bottom game bar opacity" value={preferences.shelfOpacity} min={25} max={100} onChange={shelfOpacity => set({ shelfOpacity })} />
        <p className="mt-2 text-xs text-muted">Main surfaces include the top bar, filters, Wall details and card bases. The game bar and preview box have separate overrides; cover art stays clear.</p>
        <div className="mt-7 border-t border-[rgb(var(--border)/0.7)] pt-5"><h3 className="text-lg font-black">Game presentation</h3><p className="mt-1 text-xs text-muted">The scenic Lounge themes use their own cover-and-details stage. These preview styles apply to the standard Game Browser.</p><p className="mt-4 text-xs font-black uppercase tracking-[0.14em] text-muted">Preview style</p><div className="mt-2 flex flex-wrap gap-2">{PREVIEW_STYLES.map(([id, label]) => <button key={id} type="button" aria-pressed={preferences.previewStyle === id} onClick={() => set({ previewStyle: id })} className={`lounge-visual-choice rounded-xl border px-3 py-2.5 text-sm font-bold ${preferences.previewStyle === id ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.18)]' : 'border-[rgb(var(--border))]'}`}>{label}</button>)}</div><p className="mt-4 text-xs font-black uppercase tracking-[0.14em] text-muted">Information density</p><div className="mt-2 flex flex-wrap gap-2">{INFO_DENSITIES.map(([id, label]) => <button key={id} type="button" aria-pressed={preferences.infoDensity === id} onClick={() => set({ infoDensity: id })} className={`lounge-visual-choice rounded-xl border px-3 py-2.5 text-sm font-bold ${preferences.infoDensity === id ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.18)]' : 'border-[rgb(var(--border))]'}`}>{label}</button>)}</div></div>
        <div className="mt-7 border-t border-[rgb(var(--border)/0.7)] pt-5" data-testid="lounge-preview-box-builder">
          <h3 className="text-lg font-black">Selected-game preview box</h3>
          <p className="mt-1 text-xs text-muted">Shape the compact info box over Lounge-only scenery. The standard Game Browser keeps its own preview styles above.</p>
          <p className="mt-4 text-xs font-black uppercase tracking-[0.14em] text-muted">Placement</p>
          <div className="mt-2 flex flex-wrap gap-2">{[['left', 'Left'], ['center', 'Center'], ['right', 'Right']].map(([id, label]) => <button key={id} type="button" aria-pressed={preferences.previewPosition === id} onClick={() => set({ previewPosition: id })} className="lounge-preview-choice lounge-visual-choice rounded-xl border border-[rgb(var(--border))] px-4 py-2.5 text-sm font-bold">{label}</button>)}</div>
          <Stepper label="Preview box width" value={preferences.previewWidth} min={35} max={85} onChange={previewWidth => set({ previewWidth })} />
          <Stepper label="Preview box height" value={preferences.previewBoxHeight} min={160} max={460} step={20} unit="px" onChange={previewBoxHeight => set({ previewBoxHeight })} />
          <Stepper label="Preview bottom offset" value={preferences.previewVerticalOffset} min={0} max={100} unit="px" onChange={previewVerticalOffset => set({ previewVerticalOffset })} />
          <Stepper label="Preview corner radius" value={preferences.previewCornerRadius} min={0} max={48} unit="px" onChange={previewCornerRadius => set({ previewCornerRadius })} />
          <Stepper label="Preview text size" value={preferences.previewTextScale} min={75} max={135} onChange={previewTextScale => set({ previewTextScale })} />
          <Stepper label="Preview box opacity" value={preferences.previewPanelOpacity} min={35} max={100} onChange={previewPanelOpacity => set({ previewPanelOpacity })} />
          <p className="mt-5 text-xs font-black uppercase tracking-[0.14em] text-muted">Show in the preview</p>
          <div className="mt-2 grid grid-cols-2 gap-2">{[['previewShowCover', 'Game cover'], ['previewShowDescription', 'Description'], ['previewShowIndex', 'Game position'], ['previewShowFactIcons', 'Fact icons'], ['previewShowPlaytime', 'Playtime'], ['previewShowJourney', 'Journey status'], ['previewShowSource', 'Store / source'], ['previewShowRelease', 'Release date'], ['previewShowYourRating', 'Your rating'], ['previewShowMetacritic', 'Metacritic'], ['previewShowProgress', 'Position line']].map(([id, label]) => <button key={id} type="button" aria-pressed={preferences[id]} onClick={() => set({ [id]: !preferences[id] })} className="lounge-preview-choice lounge-visual-choice min-h-11 rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-left text-sm font-bold">{label}</button>)}</div>
          <p className="mt-2 text-xs text-muted">Explore game always stays available. The position line lives inside this box, never across the full scene.</p>
        </div>
      </div><div className="min-w-0 border-t border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.28)] p-5 sm:p-7 lg:border-l lg:border-t-0"><div className="flex items-center gap-2"><Waves size={19} className="text-[rgb(var(--accent-2))]" /><h3 className="text-lg font-black">Atmosphere</h3></div><p className="mt-1 text-sm text-muted">Shape light, waves, and particles here. Ready-made looks now live under Themes → Lounge-only presets.</p>
        <div className="mt-4 flex flex-wrap gap-2">{MOTION.map(([id, label]) => <button key={id} type="button" aria-pressed={preferences.ambientMotion === id} onClick={() => set({ ambientMotion: id })} className={`lounge-visual-choice rounded-xl border px-4 py-3 text-sm font-bold ${preferences.ambientMotion === id ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.18)]' : 'border-[rgb(var(--border))]'}`}>{label}</button>)}</div><p className="mt-5 text-xs font-black uppercase tracking-[0.14em] text-muted">Background pace</p><div className="mt-2 flex flex-wrap gap-2">{PACE.map(([id, label]) => <button key={id} type="button" aria-pressed={preferences.ambientPace === id} onClick={() => set({ ambientPace: id })} className={`lounge-visual-choice rounded-xl border px-4 py-3 text-sm font-bold ${preferences.ambientPace === id ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.18)]' : 'border-[rgb(var(--border))]'}`}>{label}</button>)}</div><p className="mt-2 text-xs text-muted">Only changes drift and wave speed, not game browsing.</p><p className="mt-5 text-xs font-black uppercase tracking-[0.14em] text-muted">Overall movement</p><div className="mt-2 flex flex-wrap gap-2">{SPEED.map(([id, label]) => <button key={id} type="button" aria-pressed={preferences.motion === id} onClick={() => set({ motion: id })} className={`lounge-visual-choice rounded-xl border px-4 py-3 text-sm font-bold ${preferences.motion === id ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.18)]' : 'border-[rgb(var(--border))]'}`}>{label}</button>)}</div>
        <Stepper label="Wave strength" value={preferences.waveStrength} min={0} max={100} onChange={waveStrength => set({ waveStrength })} />
        <Stepper label="Atmosphere opacity" value={preferences.atmosphereOpacity} min={0} max={100} onChange={atmosphereOpacity => set({ atmosphereOpacity })} />
        <Stepper label="Light bloom" value={preferences.lightBloom} min={0} max={100} onChange={lightBloom => set({ lightBloom })} />
        <Stepper label="Light rays" value={preferences.lightRays} min={0} max={100} onChange={lightRays => set({ lightRays })} />
        <Stepper label="Highlight pulse" value={preferences.highlightPulse} min={0} max={100} onChange={highlightPulse => set({ highlightPulse })} />
        <p className="mt-2 text-xs text-muted">These are simulated screen-space light effects, not true HDR. Motion Off and reduced-motion pause the pulse.</p>
        <Stepper label="Vignette" value={preferences.vignette} min={0} max={100} onChange={vignette => set({ vignette })} />
        <Stepper label="Wave scale" value={preferences.waveScale} min={0} max={100} onChange={waveScale => set({ waveScale })} />
        <div className="mt-5 flex items-center gap-2"><Sparkles size={18} className="text-[rgb(var(--accent-2))]" /><h4 className="font-black">Game cover outline</h4></div><p className="mt-1 text-xs text-muted">A thin theme-colour edge on every game. Animated neon pauses with Motion Off and reduced-motion settings.</p><div className="mt-3 flex flex-wrap gap-2">{COVER_GLOW.map(([id, label]) => <button key={id} type="button" aria-pressed={preferences.coverGlow === id} onClick={() => set({ coverGlow: id })} className={`lounge-visual-choice rounded-xl border px-3 py-2.5 text-sm font-bold ${preferences.coverGlow === id ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.18)]' : 'border-[rgb(var(--border))]'}`}>{label}</button>)}</div>
        <ParticlePicker value={preferences.particleStyle} scene={preferences.specialTheme} onChange={particleStyle => set({ particleStyle })} />
        <Stepper label="Particle amount" value={preferences.particleAmount} min={0} max={100} onChange={particleAmount => set({ particleAmount })} />
        <Stepper label="Particle randomness" value={preferences.particleRandomness} min={0} max={100} onChange={particleRandomness => set({ particleRandomness })} />
        <Stepper label="Particle opacity" value={preferences.particleOpacity} min={10} max={100} onChange={particleOpacity => set({ particleOpacity })} />
        <Stepper label="Particle size" value={preferences.particleSize} min={50} max={180} onChange={particleSize => set({ particleSize })} />
        <Stepper label="Particle trail" value={preferences.particleTrail} min={0} max={100} onChange={particleTrail => set({ particleTrail })} />
        <Stepper label="Particle glow" value={preferences.particleGlow} min={0} max={100} onChange={particleGlow => set({ particleGlow })} />
        <Stepper label="Particle speed" value={preferences.particleSpeed} min={25} max={200} onChange={particleSpeed => set({ particleSpeed })} />
        <p className="mt-4 text-xs font-black uppercase tracking-[0.14em] text-muted">Particle colour</p>
        <div className="mt-2 flex flex-wrap gap-2">{LOUNGE_PARTICLE_COLORS.map(choice => <button key={choice.id} type="button" aria-pressed={preferences.particleColor === choice.id} onClick={() => set({ particleColor: choice.id })} className="lounge-preview-choice lounge-visual-choice inline-flex min-h-10 items-center gap-2 rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-xs font-bold"><span aria-hidden="true" className="h-3 w-3 rounded-full border border-white/30" style={{ backgroundColor: choice.css || 'rgb(var(--accent-2))' }} />{choice.label}</button>)}</div>
        <p className="mt-2 text-xs text-muted">These controls affect bundled and Lounge-only particles. Follow theme keeps the desktop theme's own particle behavior.</p>
        <div className="mt-5 flex items-center gap-2"><Layers3 size={18} className="text-[rgb(var(--accent-2))]" /><h4 className="font-black">FX strength</h4></div><div className="mt-3 flex flex-wrap gap-2">{[['theme', 'Theme'], [0, 'Off'], [1, 'Low'], [2, 'Medium'], [3, 'High'], [4, 'Max']].map(([id, label]) => <button key={String(id)} type="button" aria-pressed={preferences.fxLevel === id} onClick={() => set({ fxLevel: id })} className={`lounge-visual-choice rounded-xl border px-3 py-2.5 text-sm font-bold ${preferences.fxLevel === id ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.18)]' : 'border-[rgb(var(--border))]'}`}>{label}</button>)}</div><p className="mt-3 text-xs text-muted">Controls the chosen particle look and theme glow. Motion Off, reduced-motion, Rest and hidden windows pause movement.</p><button type="button" onClick={visualReset} className="lounge-visual-choice mt-6 inline-flex items-center gap-2 rounded-xl border border-[rgb(var(--border))] px-4 py-3 text-sm font-bold"><RotateCcw size={17} /> Reset visuals</button>
      </div></div>
    </section>
  </div>;
}
