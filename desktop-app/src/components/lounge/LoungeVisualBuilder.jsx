import React from 'react';
import { ImagePlus, Layers3, RotateCcw, Sparkles, Waves, X } from 'lucide-react';
import { applyLoungeVisualPreset, DEFAULT_LOUNGE_PREFERENCES, LOUNGE_VISUAL_PRESETS, matchesLoungeVisualPreset, normalizeLoungePreferences } from './lounge-layout-model.mjs';
import LoungeSoundControls from './LoungeSoundControls';
import LoungeLivingBackdrop from './LoungeLivingBackdrop';
import builtinParticles from '../../../electron/themes/builtin-particles.json';

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
const PRESET_SWATCHES = {
  cinema: 'linear-gradient(130deg, #152138 6%, #314d75 58%, #a07a6b)',
  themeGlow: 'linear-gradient(130deg, rgb(var(--grad-1)), rgb(var(--accent) / 0.75), rgb(var(--accent-2) / 0.72))',
  calm: 'linear-gradient(130deg, #253243, #778c9f 60%, #b4c5c8)',
  quiet: 'linear-gradient(130deg, #070d18, #172334 70%, #273746)',
};

function Stepper({ label, value, min, max, step = 5, onChange }) {
  return <div className="mt-4 rounded-xl border border-[rgb(var(--border)/0.7)] bg-[rgb(var(--panel)/0.42)] p-3"><div className="mb-2 flex items-center justify-between gap-3 text-sm"><span className="font-bold">{label}</span><strong className="text-[rgb(var(--accent-2))]">{value}%</strong></div><div className="flex items-center gap-3"><button type="button" aria-label={`Decrease ${label}`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - step))} className="lounge-visual-step rounded-lg border border-[rgb(var(--border))] px-4 py-2 font-black disabled:opacity-40">−</button><input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={event => onChange(Number(event.target.value))} className="min-w-0 flex-1 accent-[rgb(var(--accent))]" /><button type="button" aria-label={`Increase ${label}`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + step))} className="lounge-visual-step rounded-lg border border-[rgb(var(--border))] px-4 py-2 font-black disabled:opacity-40">+</button></div></div>;
}

function ParticlePicker({ value, onChange }) {
  const choices = [
    { id: 'theme', label: 'Follow theme', description: 'Keep the theme’s own particles.' },
    { id: 'none', label: 'No particles', description: 'Keep light and background motion.' },
    ...builtinParticles.map(({ id, label, description, pngBase64 }) => ({ id, label, description, image: `data:image/png;base64,${pngBase64}` })),
  ];
  return <fieldset className="mt-5"><legend className="text-sm font-black">Lounge particles</legend><p className="mt-1 text-xs text-muted">Choose a particle look for Lounge only. The desktop theme stays untouched.</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{choices.map(choice => <button key={choice.id} type="button" aria-pressed={value === choice.id} onClick={() => onChange(choice.id)} className={`lounge-visual-choice flex min-h-14 items-center gap-3 rounded-xl border p-2 text-left ${value === choice.id ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.18)]' : 'border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.45)]'}`}>{choice.image ? <img src={choice.image} alt="" className="h-9 w-9 shrink-0 object-contain" /> : <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[rgb(var(--accent)/0.12)]"><Sparkles size={18} /></span>}<span><strong className="block text-xs">{choice.label}</strong><small className="block text-[10px] text-muted">{choice.description}</small></span></button>)}</div></fieldset>;
}

function ParticlePreview({ styleId, active }) {
  const preset = builtinParticles.find(item => item.id === styleId);
  if (!active || !preset) return null;
  const source = `data:image/png;base64,${preset.pngBase64}`;
  return <div data-testid="lounge-particle-preview" aria-hidden="true" className="lounge-particle-preview pointer-events-none absolute inset-0 z-[1] overflow-hidden">{Array.from({ length: 6 }, (_, index) => <img key={index} src={source} alt="" className={`lounge-particle-preview__item lounge-particle-preview__item--${preset.direction}`} style={{ left: `${(index * 23 + 9) % 90}%`, top: `${(index * 29 + 8) % 70}%`, width: Math.min(28, preset.sizePx), height: Math.min(28, preset.sizePx), animationDuration: `${Math.max(4, preset.durationSeconds * 0.55 + index * 0.7)}s`, animationDelay: `${-index * 1.4}s` }} />)}</div>;
}

export default function LoungeVisualBuilder({ preferences, game, theme = 'synthwave', loungeLevel = 2, flowOpacity, flowSeconds, soundsEnabled = true, effectsActive = true, onChange, onPreviewSound, ambienceError, onRetryAmbience, onClose }) {
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
  const visualReset = () => set({ backdropMode: DEFAULT_LOUNGE_PREFERENCES.backdropMode, backgroundUrl: '', backgroundOpacity: DEFAULT_LOUNGE_PREFERENCES.backgroundOpacity, backgroundPositionY: DEFAULT_LOUNGE_PREFERENCES.backgroundPositionY, panelOpacity: DEFAULT_LOUNGE_PREFERENCES.panelOpacity, ambientMotion: DEFAULT_LOUNGE_PREFERENCES.ambientMotion, ambientPace: DEFAULT_LOUNGE_PREFERENCES.ambientPace, waveStrength: DEFAULT_LOUNGE_PREFERENCES.waveStrength, motion: DEFAULT_LOUNGE_PREFERENCES.motion, fxLevel: DEFAULT_LOUNGE_PREFERENCES.fxLevel, particleStyle: DEFAULT_LOUNGE_PREFERENCES.particleStyle });
  return <div role="dialog" aria-modal="true" aria-label="Lounge visual builder" data-testid="lounge-visual-builder" className="fixed inset-0 z-[9100] flex items-center justify-center bg-black/75 p-3 backdrop-blur-lg sm:p-6" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="lounge-visual-builder flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-[rgb(var(--accent)/0.55)] bg-[rgb(var(--surface))] shadow-[0_28px_100px_rgb(0_0_0/0.55)]">
      <header className="lounge-guide-heading flex shrink-0 items-center justify-between gap-3 border-b border-[rgb(var(--border))] px-5 py-4 sm:px-7"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[rgb(var(--accent)/0.18)] text-[rgb(var(--accent-2))]"><Sparkles size={24} /></span><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[rgb(var(--accent-2))]">Lounge only</p><h2 className="text-xl font-black sm:text-2xl">Visual Builder</h2></div></div><button ref={closeRef} type="button" data-controller-close onClick={onClose} aria-label="Close Lounge visual builder" className="lounge-visual-step rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.7)] p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[rgb(var(--accent))]"><X size={20} /></button></header>
      <div className="grid min-h-0 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]"><div className="min-w-0 p-5 sm:p-7"><div className="flex items-center gap-2"><ImagePlus size={19} className="text-[rgb(var(--accent-2))]" /><h3 className="text-lg font-black">Background</h3></div><p className="mt-1 text-sm text-muted">Choose what sits behind your games. Desktop themes stay untouched.</p>
        <div data-testid="lounge-visual-preview" className="lounge-visual-preview relative mt-4 flex h-40 items-end overflow-hidden rounded-2xl border border-[rgb(var(--accent)/0.45)] p-4">
          <LoungeLivingBackdrop theme={theme} game={game} loungeLevel={loungeLevel} motion={preferences.motion} active={effectsActive} flowOpacity={flowOpacity} flowSeconds={flowSeconds} preferences={preferences} />
          {preferences.backdropMode === 'image' && preferences.backgroundUrl && !imageFailed && <img src={preferences.backgroundUrl} alt="" onError={() => { setImageFailed(true); setError('The chosen image is unavailable. Choose it again.'); }} className="pointer-events-none absolute h-px w-px opacity-0" />}
          <ParticlePreview styleId={preferences.particleStyle} active={effectsActive} />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" /><span className="relative z-10 rounded-xl border border-white/35 bg-black/55 px-4 py-2 text-sm font-black text-white backdrop-blur-md" style={{ opacity: Math.max(0.4, preferences.panelOpacity / 100) }}>Your Lounge</span><span className="relative z-10 ml-auto flex gap-1.5"><i className="h-12 w-9 rounded-md border border-white/50 bg-[rgb(var(--accent)/0.6)]" /><i className="h-12 w-9 rounded-md border border-white/40 bg-[rgb(var(--accent-2)/0.5)]" /><i className="h-12 w-9 rounded-md border border-white/30 bg-white/20" /></span>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">{BACKGROUNDS.map(([id, title, note]) => <button key={id} type="button" aria-pressed={preferences.backdropMode === id} onClick={() => set({ backdropMode: id })} className={`lounge-visual-choice rounded-xl border p-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[rgb(var(--accent))] ${preferences.backdropMode === id ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.17)]' : 'border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.45)]'}`}><strong className="block text-sm">{title}</strong><span className="mt-1 block text-xs text-muted">{note}</span></button>)}</div>
        <button type="button" onClick={pickBackground} className="lounge-visual-choice mt-3 inline-flex min-h-12 items-center gap-2 rounded-xl border border-[rgb(var(--accent)/0.65)] bg-[rgb(var(--accent)/0.13)] px-4 py-2 text-sm font-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-[rgb(var(--accent))]"><ImagePlus size={18} /> Choose my image</button><p className="mt-2 text-xs text-muted">NEO-LIB keeps its own copy. You can move the original afterward.</p>{error && <p role="alert" className="mt-2 text-sm font-semibold text-rose-300">{error}</p>}
        <Stepper label="Artwork visibility" value={preferences.backgroundOpacity} min={0} max={100} onChange={backgroundOpacity => set({ backgroundOpacity })} /><Stepper label="Artwork vertical position" value={preferences.backgroundPositionY} min={0} max={100} onChange={backgroundPositionY => set({ backgroundPositionY })} /><Stepper label="Panel opacity" value={preferences.panelOpacity} min={40} max={100} onChange={panelOpacity => set({ panelOpacity })} />
      </div><div className="min-w-0 border-t border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.28)] p-5 sm:p-7 lg:border-l lg:border-t-0"><div className="flex items-center gap-2"><Sparkles size={19} className="text-[rgb(var(--accent-2))]" /><h3 className="text-lg font-black">Starting looks</h3></div><p className="mt-1 text-sm text-muted">Apply a look, then tune any control below. Your imported artwork stays saved.</p><div className="mt-4 grid gap-2 sm:grid-cols-2">{Object.entries(LOUNGE_VISUAL_PRESETS).map(([id, preset]) => <button key={id} type="button" aria-pressed={matchesLoungeVisualPreset(preferences, id)} onClick={() => { setError(''); onChange(applyLoungeVisualPreset(preferences, id)); }} className={`lounge-visual-choice overflow-hidden rounded-xl border text-left focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--accent))] ${matchesLoungeVisualPreset(preferences, id) ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.15)]' : 'border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.48)]'}`}><span aria-hidden="true" className="block h-12 w-full" style={{ backgroundImage: PRESET_SWATCHES[id] }} /><span className="block px-3 py-2.5"><strong className="block text-sm">{preset.label}</strong><span className="mt-0.5 block text-xs text-muted">{preset.note}</span></span></button>)}</div><div className="mt-7 flex items-center gap-2"><Waves size={19} className="text-[rgb(var(--accent-2))]" /><h3 className="text-lg font-black">Atmosphere</h3></div><p className="mt-1 text-sm text-muted">Subtle movement over your background, plus the selected theme’s particle effects.</p>
        <div className="mt-4 flex flex-wrap gap-2">{MOTION.map(([id, label]) => <button key={id} type="button" aria-pressed={preferences.ambientMotion === id} onClick={() => set({ ambientMotion: id })} className={`lounge-visual-choice rounded-xl border px-4 py-3 text-sm font-bold ${preferences.ambientMotion === id ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.18)]' : 'border-[rgb(var(--border))]'}`}>{label}</button>)}</div><p className="mt-5 text-xs font-black uppercase tracking-[0.14em] text-muted">Background pace</p><div className="mt-2 flex flex-wrap gap-2">{PACE.map(([id, label]) => <button key={id} type="button" aria-pressed={preferences.ambientPace === id} onClick={() => set({ ambientPace: id })} className={`lounge-visual-choice rounded-xl border px-4 py-3 text-sm font-bold ${preferences.ambientPace === id ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.18)]' : 'border-[rgb(var(--border))]'}`}>{label}</button>)}</div><p className="mt-2 text-xs text-muted">Only changes drift and wave speed, not game browsing.</p><p className="mt-5 text-xs font-black uppercase tracking-[0.14em] text-muted">Overall movement</p><div className="mt-2 flex flex-wrap gap-2">{SPEED.map(([id, label]) => <button key={id} type="button" aria-pressed={preferences.motion === id} onClick={() => set({ motion: id })} className={`lounge-visual-choice rounded-xl border px-4 py-3 text-sm font-bold ${preferences.motion === id ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.18)]' : 'border-[rgb(var(--border))]'}`}>{label}</button>)}</div>
        <Stepper label="Wave strength" value={preferences.waveStrength} min={0} max={100} onChange={waveStrength => set({ waveStrength })} />
        <ParticlePicker value={preferences.particleStyle} onChange={particleStyle => set({ particleStyle })} />
        <div className="mt-5 flex items-center gap-2"><Layers3 size={18} className="text-[rgb(var(--accent-2))]" /><h4 className="font-black">FX strength</h4></div><div className="mt-3 flex flex-wrap gap-2">{[['theme', 'Theme'], [0, 'Off'], [1, 'Low'], [2, 'Medium'], [3, 'High'], [4, 'Max']].map(([id, label]) => <button key={String(id)} type="button" aria-pressed={preferences.fxLevel === id} onClick={() => set({ fxLevel: id })} className={`lounge-visual-choice rounded-xl border px-3 py-2.5 text-sm font-bold ${preferences.fxLevel === id ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.18)]' : 'border-[rgb(var(--border))]'}`}>{label}</button>)}</div><p className="mt-3 text-xs text-muted">Controls the chosen particle look and theme glow. Motion Off, reduced-motion, Rest and hidden windows pause movement.</p><LoungeSoundControls preferences={preferences} soundsEnabled={soundsEnabled} onChange={onChange} onPreview={onPreviewSound} ambienceError={ambienceError} onRetryAmbience={onRetryAmbience} /><button type="button" onClick={visualReset} className="lounge-visual-choice mt-6 inline-flex items-center gap-2 rounded-xl border border-[rgb(var(--border))] px-4 py-3 text-sm font-bold"><RotateCcw size={17} /> Reset visuals</button>
      </div></div>
    </section>
  </div>;
}
