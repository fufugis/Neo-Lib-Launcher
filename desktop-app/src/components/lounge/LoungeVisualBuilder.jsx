import React from 'react';
import { ImagePlus, Layers3, RotateCcw, Sparkles, Waves, X } from 'lucide-react';
import { applyLoungeVisualPreset, DEFAULT_LOUNGE_PREFERENCES, LOUNGE_VISUAL_PRESETS, matchesLoungeVisualPreset, normalizeLoungePreferences } from './lounge-layout-model.mjs';
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
const PRESET_SWATCHES = {
  cinema: 'linear-gradient(130deg, #152138 6%, #314d75 58%, #a07a6b)',
  themeGlow: 'linear-gradient(130deg, rgb(var(--grad-1)), rgb(var(--accent) / 0.75), rgb(var(--accent-2) / 0.72))',
  calm: 'linear-gradient(130deg, #253243, #778c9f 60%, #b4c5c8)',
  quiet: 'linear-gradient(130deg, #070d18, #172334 70%, #273746)',
};
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
  return <fieldset className="mt-5"><legend className="text-sm font-black">Lounge particles</legend><p className="mt-1 text-xs text-muted">Choose a particle look for Lounge only. The desktop theme stays untouched.</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{PARTICLE_CHOICES.map(choice => <button key={choice.id} type="button" aria-pressed={value === choice.id} onClick={() => onChange(choice.id)} className={`lounge-visual-choice flex min-h-14 items-center gap-3 rounded-xl border p-2 text-left ${value === choice.id ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.18)]' : 'border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.45)]'}`}>{choice.image ? <img src={choice.image} alt="" className="h-9 w-9 shrink-0 object-contain" /> : <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[rgb(var(--accent)/0.12)]"><Sparkles size={18} /></span>}<span><strong className="block text-xs">{choice.id === 'theme' && scene !== 'theme' ? 'Scene starlight' : choice.label}</strong><small className="block text-[10px] text-muted">{choice.id === 'theme' && scene !== 'theme' ? 'Soft stars chosen for this Lounge scene.' : choice.description}</small></span></button>)}</div></fieldset>;
}

const ParticlePreview = React.memo(function ParticlePreview({ styleId, active, amount = 100, randomness = 50, color = 'original' }) {
  const preset = builtinParticles.find(item => item.id === styleId) || LOUNGE_EXTRA_PARTICLES.find(item => item.id === styleId);
  if (!active || !preset || amount === 0) return null;
  const source = preset.pngBase64 ? 'data:image/png;base64,' + preset.pngBase64 : '';
  const tint = LOUNGE_PARTICLE_COLORS.find(item => item.id === color)?.css || '';
  const count = Math.max(1, Math.round(8 * amount / 100));
  return <div data-testid="lounge-particle-preview" aria-hidden="true" className="lounge-particle-preview pointer-events-none absolute inset-0 z-[1] overflow-hidden">{Array.from({ length: count }, (_, index) => {
    const spread = randomness / 100;
    const style = {
      left: String((index * 23 + 9 + spread * ((index * 31) % 17)) % 90) + '%',
      top: String((index * 29 + 8 + spread * ((index * 19) % 13)) % 70) + '%',
      width: Math.min(28, preset.sizePx),
      height: preset.shape === 'comet' ? 2 : Math.min(28, preset.sizePx),
      animationDuration: String(Math.max(4, preset.durationSeconds * 0.55 + index * 0.7)) + 's',
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
  React.useEffect(() => { closeRef.current?.focus(); }, []);
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
  const visualReset = () => set({ backdropMode: DEFAULT_LOUNGE_PREFERENCES.backdropMode, backgroundUrl: '', backgroundOpacity: DEFAULT_LOUNGE_PREFERENCES.backgroundOpacity, backgroundPositionY: DEFAULT_LOUNGE_PREFERENCES.backgroundPositionY, panelOpacity: DEFAULT_LOUNGE_PREFERENCES.panelOpacity, shelfOpacity: DEFAULT_LOUNGE_PREFERENCES.shelfOpacity, previewPosition: DEFAULT_LOUNGE_PREFERENCES.previewPosition, previewWidth: DEFAULT_LOUNGE_PREFERENCES.previewWidth, previewBoxHeight: DEFAULT_LOUNGE_PREFERENCES.previewBoxHeight, previewPanelOpacity: DEFAULT_LOUNGE_PREFERENCES.previewPanelOpacity, previewShowCover: DEFAULT_LOUNGE_PREFERENCES.previewShowCover, previewShowDescription: DEFAULT_LOUNGE_PREFERENCES.previewShowDescription, previewShowFacts: DEFAULT_LOUNGE_PREFERENCES.previewShowFacts, previewShowProgress: DEFAULT_LOUNGE_PREFERENCES.previewShowProgress, ambientMotion: DEFAULT_LOUNGE_PREFERENCES.ambientMotion, ambientPace: DEFAULT_LOUNGE_PREFERENCES.ambientPace, waveStrength: DEFAULT_LOUNGE_PREFERENCES.waveStrength, motion: DEFAULT_LOUNGE_PREFERENCES.motion, fxLevel: DEFAULT_LOUNGE_PREFERENCES.fxLevel, particleStyle: DEFAULT_LOUNGE_PREFERENCES.particleStyle, particleAmount: DEFAULT_LOUNGE_PREFERENCES.particleAmount, particleRandomness: DEFAULT_LOUNGE_PREFERENCES.particleRandomness, particleColor: DEFAULT_LOUNGE_PREFERENCES.particleColor, coverGlow: DEFAULT_LOUNGE_PREFERENCES.coverGlow, previewStyle: DEFAULT_LOUNGE_PREFERENCES.previewStyle, infoDensity: DEFAULT_LOUNGE_PREFERENCES.infoDensity });
  return <div role="dialog" aria-modal="true" aria-label="Lounge visual builder" data-testid="lounge-visual-builder" className="fixed inset-0 z-[9100] flex items-center justify-center bg-black/80 p-3 sm:p-6" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="lounge-visual-builder flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-[rgb(var(--accent)/0.55)] bg-[rgb(var(--surface))] shadow-[0_28px_100px_rgb(0_0_0/0.55)]">
      <header className="lounge-guide-heading flex shrink-0 items-center justify-between gap-3 border-b border-[rgb(var(--border))] px-5 py-4 sm:px-7"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[rgb(var(--accent)/0.18)] text-[rgb(var(--accent-2))]"><Sparkles size={24} /></span><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[rgb(var(--accent-2))]">Lounge only</p><h2 className="text-xl font-black sm:text-2xl">Visual Builder</h2></div></div><button ref={closeRef} type="button" data-controller-close onClick={onClose} aria-label="Close Lounge visual builder" className="lounge-visual-step rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.7)] p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[rgb(var(--accent))]"><X size={20} /></button></header>
      <div className="grid min-h-0 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]"><div className="min-w-0 p-5 sm:p-7"><div className="flex items-center gap-2"><ImagePlus size={19} className="text-[rgb(var(--accent-2))]" /><h3 className="text-lg font-black">Background</h3></div><p className="mt-1 text-sm text-muted">Choose what sits behind your games. Desktop themes stay untouched.</p>
        <div data-testid="lounge-visual-preview" className="lounge-visual-preview relative mt-4 flex h-48 items-end overflow-hidden rounded-2xl border border-[rgb(var(--accent)/0.45)]" data-lounge-cover-glow={preferences.coverGlow} style={{ '--lounge-panel-opacity': preferences.panelOpacity / 100, '--lounge-shelf-opacity': preferences.shelfOpacity / 100, '--lounge-preview-panel-opacity': preferences.previewPanelOpacity / 100 }}>
          <LoungeLivingBackdrop theme={theme} game={game} loungeLevel={loungeLevel} motion={preferences.motion} active={effectsActive} flowOpacity={flowOpacity} flowSeconds={flowSeconds} preferences={preferences} />
          {preferences.backdropMode === 'image' && preferences.backgroundUrl && !imageFailed && <img src={preferences.backgroundUrl} alt="" onError={() => { setImageFailed(true); setError('The chosen image is unavailable. Choose it again.'); }} className="pointer-events-none absolute h-px w-px opacity-0" />}
          <ParticlePreview styleId={preferences.particleStyle === 'theme' && preferences.specialTheme !== 'theme' ? 'starlight' : preferences.particleStyle} active={effectsActive} amount={preferences.particleAmount} randomness={preferences.particleRandomness} color={preferences.particleColor} />
          <div className="lounge-flow pointer-events-none absolute inset-0" aria-hidden="true" style={{ '--lounge-flow-opacity': effectsActive ? flowOpacity : 0, '--lounge-flow-seconds': String(flowSeconds) + 's' }} />
          <div className="relative z-10 flex h-full w-full items-end p-3 pb-14" style={{ justifyContent: { left: 'flex-start', center: 'center', right: 'flex-end' }[preferences.previewPosition] }}>
            <div className="min-w-0 rounded-xl border border-white/30 p-2.5 text-white shadow-lg" style={{ width: String(preferences.previewWidth) + '%', minHeight: Math.min(90, preferences.previewBoxHeight / 4), backgroundColor: 'rgb(var(--panel) / ' + preferences.previewPanelOpacity / 100 + ')' }}>
              <span className="block truncate text-[8px] font-black uppercase tracking-widest text-[rgb(var(--accent-2))]">Now in focus</span>
              <strong className="mt-1 block line-clamp-2 text-sm leading-tight">{game?.name || 'Your game'}</strong>
              {preferences.previewShowDescription && <span className="mt-1 block truncate text-[9px] text-white/80">{game?.shortDescription || 'Game details in your Lounge'}</span>}
              {preferences.previewShowFacts && <span className="mt-1 block text-[8px] text-white/75">Playtime · Journey</span>}
              {preferences.previewShowProgress && <span className="mt-2 block h-0.5 w-2/3 rounded-full bg-[rgb(var(--accent))]" />}
            </div>
          </div>
          <div className="absolute inset-x-2 bottom-2 z-10 flex h-10 items-center gap-2 rounded-lg border border-[rgb(var(--border)/0.7)] px-2" style={{ backgroundColor: 'rgb(var(--panel) / ' + preferences.shelfOpacity / 100 + ')' }}>
            {game && <span className="h-8 w-6 shrink-0 overflow-hidden rounded border border-[rgb(var(--accent))]"><LoungeCover game={game} /></span>}
            <span className="truncate text-[10px] font-bold text-ink">{game?.name || 'Game carousel'}</span>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted">The backdrop, light and glass use Lounge's live layers; this is a miniature composition, not a full-screen screenshot.</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">{BACKGROUNDS.map(([id, title, note]) => <button key={id} type="button" aria-pressed={preferences.backdropMode === id} onClick={() => set({ backdropMode: id })} className={`lounge-visual-choice rounded-xl border p-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[rgb(var(--accent))] ${preferences.backdropMode === id ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.17)]' : 'border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.45)]'}`}><strong className="block text-sm">{title}</strong><span className="mt-1 block text-xs text-muted">{note}</span></button>)}</div>
        <button type="button" onClick={pickBackground} className="lounge-visual-choice mt-3 inline-flex min-h-12 items-center gap-2 rounded-xl border border-[rgb(var(--accent)/0.65)] bg-[rgb(var(--accent)/0.13)] px-4 py-2 text-sm font-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-[rgb(var(--accent))]"><ImagePlus size={18} /> Choose my image</button><p className="mt-2 text-xs text-muted">NEO-LIB keeps its own copy. You can move the original afterward.</p>{error && <p role="alert" className="mt-2 text-sm font-semibold text-rose-300">{error}</p>}
        <Stepper label="Artwork visibility" value={preferences.backgroundOpacity} min={0} max={100} onChange={backgroundOpacity => set({ backgroundOpacity })} />
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
          <Stepper label="Preview box opacity" value={preferences.previewPanelOpacity} min={35} max={100} onChange={previewPanelOpacity => set({ previewPanelOpacity })} />
          <p className="mt-5 text-xs font-black uppercase tracking-[0.14em] text-muted">Show in the preview</p>
          <div className="mt-2 grid grid-cols-2 gap-2">{[['previewShowCover', 'Game cover'], ['previewShowDescription', 'Description'], ['previewShowFacts', 'Game facts'], ['previewShowProgress', 'Position line']].map(([id, label]) => <button key={id} type="button" aria-pressed={preferences[id]} onClick={() => set({ [id]: !preferences[id] })} className="lounge-preview-choice lounge-visual-choice min-h-11 rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-left text-sm font-bold">{label}</button>)}</div>
          <p className="mt-2 text-xs text-muted">Explore game always stays available. The position line lives inside this box, never across the full scene.</p>
        </div>
      </div><div className="min-w-0 border-t border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.28)] p-5 sm:p-7 lg:border-l lg:border-t-0"><div className="flex items-center gap-2"><Sparkles size={19} className="text-[rgb(var(--accent-2))]" /><h3 className="text-lg font-black">Visual presets</h3></div><p className="mt-1 text-sm text-muted">Apply a look, then tune any control below. Your imported artwork stays saved.</p><div className="mt-4 grid gap-2 sm:grid-cols-2">{Object.entries(LOUNGE_VISUAL_PRESETS).map(([id, preset]) => <button key={id} type="button" aria-pressed={matchesLoungeVisualPreset(preferences, id)} onClick={() => { setError(''); onChange(applyLoungeVisualPreset(preferences, id)); }} className={`lounge-visual-choice overflow-hidden rounded-xl border text-left focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--accent))] ${matchesLoungeVisualPreset(preferences, id) ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.15)]' : 'border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.48)]'}`}><span aria-hidden="true" className="block h-12 w-full" style={{ backgroundImage: PRESET_SWATCHES[id] }} /><span className="block px-3 py-2.5"><strong className="block text-sm">{preset.label}</strong><span className="mt-0.5 block text-xs text-muted">{preset.note}</span></span></button>)}</div><div className="mt-7 flex items-center gap-2"><Waves size={19} className="text-[rgb(var(--accent-2))]" /><h3 className="text-lg font-black">Atmosphere</h3></div><p className="mt-1 text-sm text-muted">Subtle movement over your background, plus the selected theme’s particle effects.</p>
        <div className="mt-4 flex flex-wrap gap-2">{MOTION.map(([id, label]) => <button key={id} type="button" aria-pressed={preferences.ambientMotion === id} onClick={() => set({ ambientMotion: id })} className={`lounge-visual-choice rounded-xl border px-4 py-3 text-sm font-bold ${preferences.ambientMotion === id ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.18)]' : 'border-[rgb(var(--border))]'}`}>{label}</button>)}</div><p className="mt-5 text-xs font-black uppercase tracking-[0.14em] text-muted">Background pace</p><div className="mt-2 flex flex-wrap gap-2">{PACE.map(([id, label]) => <button key={id} type="button" aria-pressed={preferences.ambientPace === id} onClick={() => set({ ambientPace: id })} className={`lounge-visual-choice rounded-xl border px-4 py-3 text-sm font-bold ${preferences.ambientPace === id ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.18)]' : 'border-[rgb(var(--border))]'}`}>{label}</button>)}</div><p className="mt-2 text-xs text-muted">Only changes drift and wave speed, not game browsing.</p><p className="mt-5 text-xs font-black uppercase tracking-[0.14em] text-muted">Overall movement</p><div className="mt-2 flex flex-wrap gap-2">{SPEED.map(([id, label]) => <button key={id} type="button" aria-pressed={preferences.motion === id} onClick={() => set({ motion: id })} className={`lounge-visual-choice rounded-xl border px-4 py-3 text-sm font-bold ${preferences.motion === id ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.18)]' : 'border-[rgb(var(--border))]'}`}>{label}</button>)}</div>
        <Stepper label="Wave strength" value={preferences.waveStrength} min={0} max={100} onChange={waveStrength => set({ waveStrength })} />
        <div className="mt-5 flex items-center gap-2"><Sparkles size={18} className="text-[rgb(var(--accent-2))]" /><h4 className="font-black">Game cover outline</h4></div><p className="mt-1 text-xs text-muted">A thin theme-colour edge on every game. Animated neon pauses with Motion Off and reduced-motion settings.</p><div className="mt-3 flex flex-wrap gap-2">{COVER_GLOW.map(([id, label]) => <button key={id} type="button" aria-pressed={preferences.coverGlow === id} onClick={() => set({ coverGlow: id })} className={`lounge-visual-choice rounded-xl border px-3 py-2.5 text-sm font-bold ${preferences.coverGlow === id ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.18)]' : 'border-[rgb(var(--border))]'}`}>{label}</button>)}</div>
        <ParticlePicker value={preferences.particleStyle} scene={preferences.specialTheme} onChange={particleStyle => set({ particleStyle })} />
        <Stepper label="Particle amount" value={preferences.particleAmount} min={0} max={100} onChange={particleAmount => set({ particleAmount })} />
        <Stepper label="Particle randomness" value={preferences.particleRandomness} min={0} max={100} onChange={particleRandomness => set({ particleRandomness })} />
        <p className="mt-4 text-xs font-black uppercase tracking-[0.14em] text-muted">Particle colour</p>
        <div className="mt-2 flex flex-wrap gap-2">{LOUNGE_PARTICLE_COLORS.map(choice => <button key={choice.id} type="button" aria-pressed={preferences.particleColor === choice.id} onClick={() => set({ particleColor: choice.id })} className="lounge-preview-choice lounge-visual-choice inline-flex min-h-10 items-center gap-2 rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-xs font-bold"><span aria-hidden="true" className="h-3 w-3 rounded-full border border-white/30" style={{ backgroundColor: choice.css || 'rgb(var(--accent-2))' }} />{choice.label}</button>)}</div>
        <p className="mt-2 text-xs text-muted">These controls affect bundled and Lounge-only particles. Follow theme keeps the desktop theme's own particle behavior.</p>
        <div className="mt-5 flex items-center gap-2"><Layers3 size={18} className="text-[rgb(var(--accent-2))]" /><h4 className="font-black">FX strength</h4></div><div className="mt-3 flex flex-wrap gap-2">{[['theme', 'Theme'], [0, 'Off'], [1, 'Low'], [2, 'Medium'], [3, 'High'], [4, 'Max']].map(([id, label]) => <button key={String(id)} type="button" aria-pressed={preferences.fxLevel === id} onClick={() => set({ fxLevel: id })} className={`lounge-visual-choice rounded-xl border px-3 py-2.5 text-sm font-bold ${preferences.fxLevel === id ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.18)]' : 'border-[rgb(var(--border))]'}`}>{label}</button>)}</div><p className="mt-3 text-xs text-muted">Controls the chosen particle look and theme glow. Motion Off, reduced-motion, Rest and hidden windows pause movement.</p><button type="button" onClick={visualReset} className="lounge-visual-choice mt-6 inline-flex items-center gap-2 rounded-xl border border-[rgb(var(--border))] px-4 py-3 text-sm font-bold"><RotateCcw size={17} /> Reset visuals</button>
      </div></div>
    </section>
  </div>;
}
