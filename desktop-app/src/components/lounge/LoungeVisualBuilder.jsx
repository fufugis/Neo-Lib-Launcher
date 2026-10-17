import React from 'react';
import { ImagePlus, Layers3, RotateCcw, Sparkles, Waves, X } from 'lucide-react';
import { DEFAULT_LOUNGE_PREFERENCES, LOUNGE_COVER_FRAMES, LOUNGE_FRAME_COLORS, LOUNGE_LIGHT_LOOKS, LOUNGE_SURFACE_OPACITY_RANGE, loungeFramePaletteStyle, loungeSceneParticleStyle, normalizeLoungePreferences } from './lounge-layout-model.mjs';
import LoungeLivingBackdrop from './LoungeLivingBackdrop';
import LoungeParticleLayer from './LoungeParticleLayer';
import useDraggablePanel from './use-draggable-panel';
import { loungePanelPositions } from './lounge-widget-layout.mjs';
import LoungeLivePreview from './LoungeLivePreview';
import builtinParticles from '../../../electron/themes/builtin-particles.json';
import { LOUNGE_EXTRA_PARTICLES, LOUNGE_PARTICLE_COLORS } from './lounge-particle-presets.mjs';
import { LOUNGE_EFFECTS, loungeEffectPreferences, toggleLoungeEffect } from './lounge-effect-model.mjs';
import { captureDisclosureAnchor, restoreDisclosureAnchor } from './lounge-disclosure-anchor.mjs';

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
const INFO_DENSITIES = [['minimal', 'Minimal'], ['balanced', 'Balanced'], ['rich', 'Detailed']];
const PARTICLE_CHOICES = [
  { id: 'theme', label: 'Follow theme', description: 'Keep the theme’s own particles.' },
  { id: 'none', label: 'No particles', description: 'Keep light and background motion.' },
  ...builtinParticles.map(({ id, label, description, pngBase64 }) => ({ id, label, description, image: `data:image/png;base64,${pngBase64}` })),
  ...LOUNGE_EXTRA_PARTICLES,
];

function Stepper({ label, value, min, max, step = 5, unit = '%', onChange }) {
  return <div className="lounge-visual-slider-box mt-4 rounded-xl border border-[rgb(var(--border)/0.7)] bg-[rgb(var(--panel)/0.42)] p-3"><div className="lounge-visual-slider-label mb-2 flex items-center justify-between gap-3 text-sm"><span className="font-bold">{label}</span><strong className="text-[rgb(var(--accent-2))]">{value}{unit}</strong></div><div className="flex items-center gap-3"><button type="button" aria-label={`Decrease ${label}`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - step))} className="lounge-visual-step rounded-lg border border-[rgb(var(--border))] px-4 py-2 font-black disabled:opacity-40">−</button><input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={event => onChange(Number(event.target.value))} className="min-w-0 flex-1 accent-[rgb(var(--accent))]" /><button type="button" aria-label={`Increase ${label}`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + step))} className="lounge-visual-step rounded-lg border border-[rgb(var(--border))] px-4 py-2 font-black disabled:opacity-40">+</button></div></div>;
}

function ParticlePicker({ value, onChange, scene }) {
  const sceneChoice = PARTICLE_CHOICES.find(choice => choice.id === loungeSceneParticleStyle(scene));
  return <fieldset className="mt-5"><legend className="text-sm font-black">Lounge particles</legend><p className="mt-1 text-xs text-muted">Choose a particle look for Lounge only. The desktop theme stays untouched.</p><div data-controller-grid className="mt-3 grid gap-2 sm:grid-cols-2">{PARTICLE_CHOICES.map(choice => <button key={choice.id} type="button" aria-pressed={value === choice.id} onClick={() => onChange(choice.id)} className={`lounge-visual-choice flex min-h-14 items-center gap-3 rounded-xl border p-2 text-left ${value === choice.id ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.18)]' : 'border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.45)]'}`}>{choice.image ? <img src={choice.image} alt="" className="h-9 w-9 shrink-0 object-contain" /> : <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[rgb(var(--accent)/0.12)]">{choice.shape ? <i className={`lounge-procedural-particle lounge-procedural-particle--${choice.shape} block h-4 w-4`} style={{ color: choice.color, backgroundColor: choice.shape === 'ring' ? 'transparent' : choice.color, filter: `drop-shadow(0 0 6px ${choice.color})` }} /> : <Sparkles size={18} />}</span>}<span><strong className="block text-xs">{choice.id === 'theme' && scene !== 'theme' ? `Scene ${sceneChoice?.label || 'starlight'}` : choice.label}</strong><small className="block text-[10px] text-muted">{choice.id === 'theme' && scene !== 'theme' ? sceneChoice?.description : choice.description}</small></span></button>)}</div></fieldset>;
}

function CoverFramePicker({ value, frameColor, frameCustomColor, motion, onChange }) {
  return <fieldset className="mt-5" data-lounge-motion={motion} style={loungeFramePaletteStyle(frameColor, frameCustomColor)}><legend className="text-sm font-black">Carousel card frame</legend><p className="mt-1 text-xs text-muted">Choose the outer frame around each game’s artwork and title. Cover glow is a separate effect below.</p><div data-controller-grid className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">{Object.entries(LOUNGE_COVER_FRAMES).map(([id, frame]) => <button key={id} type="button" data-lounge-cover-frame={id} aria-pressed={value === id} onClick={() => onChange(id)} className={`lounge-visual-choice rounded-xl border p-3 text-center ${value === id ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.18)]' : 'border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.45)]'}`}><span className="lounge-game-card lounge-frame-sample relative mx-auto mb-2 block h-20 w-14 overflow-hidden border-2" data-lounge-cover-frame={id} data-lounge-frame-color={frameColor}><span className="block h-[74%] bg-[linear-gradient(155deg,rgb(var(--accent)/0.55),rgb(var(--surface)/0.9))]" /><span className="block h-[26%] bg-[rgb(var(--panel)/0.9)]" /><i className="lounge-card-frame" aria-hidden="true" /></span><strong className="block text-xs">{frame.label}</strong><small className="mt-1 block text-[10px] text-muted">{frame.note}</small></button>)}</div></fieldset>;
}

function EffectChecklist({ group, preferences, set }) {
  const [minimized, setMinimized] = React.useState({});
  const disclosureAnchor = React.useRef(null);
  React.useLayoutEffect(() => {
    restoreDisclosureAnchor(disclosureAnchor.current);
    disclosureAnchor.current = null;
  }, [minimized]);
  const host = React.useRef(null), inactiveSummary = React.useRef(null), pendingFocus = React.useRef(null);
  const effects = LOUNGE_EFFECTS.filter(effect => effect.group === group);
  const active = effects.filter(effect => preferences.effects?.[effect.id] === true);
  const inactive = effects.filter(effect => preferences.effects?.[effect.id] !== true);
  React.useLayoutEffect(() => {
    const id = pendingFocus.current;
    if (!id) return;
    pendingFocus.current = null;
    if (preferences.effects?.[id]) host.current?.querySelector(`[data-effect-toggle="${id}"]`)?.focus();
    else inactiveSummary.current?.focus();
  }, [preferences.effects]);
  const renderEffect = effect => {
      const enabled = preferences.effects?.[effect.id] === true;
      return <section key={effect.id} className="lounge-visual-effect-box rounded-xl border border-[rgb(var(--border)/0.65)] p-3">
        <div className="flex items-center gap-2">
          <button type="button" data-effect-toggle={effect.id} role="checkbox" aria-checked={enabled} onClick={() => { pendingFocus.current = effect.id; setMinimized(current => ({ ...current, [effect.id]: false })); set(toggleLoungeEffect(preferences, effect)); }} className="lounge-visual-choice flex min-w-0 flex-1 items-center gap-3 text-left text-sm font-bold"><span aria-hidden="true" className="grid h-6 w-6 shrink-0 place-items-center rounded border border-[rgb(var(--accent))]">{enabled ? '✓' : ''}</span>{effect.label}</button>
          {enabled && <button type="button" aria-label={`${minimized[effect.id] ? 'Expand' : 'Minimize'} ${effect.label} controls`} aria-expanded={!minimized[effect.id]} aria-controls={`lounge-effect-controls-${effect.id}`} onClick={event => { disclosureAnchor.current = captureDisclosureAnchor(event.currentTarget); setMinimized(current => ({ ...current, [effect.id]: !current[effect.id] })); }} className="lounge-visual-choice w-24 shrink-0 whitespace-nowrap rounded-lg border border-[rgb(var(--border))] px-2 py-2 text-xs font-bold">{minimized[effect.id] ? 'Expand' : 'Minimize'}</button>}
        </div>
        {enabled && <div data-effect-controls={effect.id} id={`lounge-effect-controls-${effect.id}`} hidden={Boolean(minimized[effect.id])}>
          {effect.id === 'card-glow' && <div className="mt-3 flex flex-wrap gap-2">{COVER_GLOW.filter(([id]) => id !== 'off').map(([id, label]) => <button key={id} type="button" aria-pressed={preferences.coverGlow === id} onClick={() => set({ coverGlow: id })} className="lounge-visual-choice rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-xs font-bold">{label}</button>)}</div>}
          {effect.controls.map(control => <Stepper key={control.key} label={control.label} value={preferences[control.key]} min={control.min} max={control.max} unit={control.unit} onChange={value => set({ [control.key]: value })} />)}
          {effect.id === 'smoke' && <p className="mt-2 text-xs text-muted">Local wisps lift around the scenery, not a fog sheet over your games.</p>}
          {effect.id === 'cold-rays' && <p className="mt-2 text-xs text-muted">Ice-blue shafts originate from the artwork's sampled sunlight and follow its framing.</p>}
        </div>}
      </section>;
  };
  return <div ref={host} className="mt-3 space-y-2" data-testid={`lounge-effect-checklist-${group}`}>
    {active.map(renderEffect)}
    {inactive.length > 0 && <details className="rounded-xl border border-[rgb(var(--border)/0.65)] bg-[rgb(var(--panel)/0.2)]" data-inactive-effects={group}>
      <summary ref={inactiveSummary} role="button" tabIndex={0} data-controller-target onClick={event => { event.preventDefault(); const anchor = captureDisclosureAnchor(event.currentTarget); const details = event.currentTarget.parentElement; details.open = !details.open; restoreDisclosureAnchor(anchor); }} className="lounge-visual-choice cursor-pointer px-3 py-3 text-sm font-bold">Inactive effects · {inactive.length}<span className="ml-2 text-xs font-normal text-muted">Expand to enable</span></summary>
      <div className="space-y-2 px-2 pb-2">{inactive.map(renderEffect)}</div>
    </details>}
  </div>;
}

export default function LoungeVisualBuilder({ preferences, panelShelfPosition = preferences.shelfPosition, game, games = [], theme = 'synthwave', loungeLevel = 2, flowOpacity, flowSeconds, effectsActive = true, onChange, onClose }) {
  const renderPreferences = React.useMemo(() => loungeEffectPreferences(preferences, loungeLevel), [preferences, loungeLevel]);
  const closeRef = React.useRef(null);
  const draggable = useDraggablePanel();
  const [error, setError] = React.useState('');
  const [imageFailed, setImageFailed] = React.useState(false);
  const [screenSize, setScreenSize] = React.useState(() => `${Math.round(window.innerWidth * window.devicePixelRatio)} × ${Math.round(window.innerHeight * window.devicePixelRatio)}`);
  React.useEffect(() => { closeRef.current?.focus(); }, []);
  React.useEffect(() => { const resize = () => setScreenSize(`${Math.round(window.innerWidth * window.devicePixelRatio)} × ${Math.round(window.innerHeight * window.devicePixelRatio)}`); window.addEventListener('resize', resize); return () => window.removeEventListener('resize', resize); }, []);
  React.useEffect(() => { setImageFailed(false); }, [preferences.backgroundUrl]);
  const set = patch => onChange(normalizeLoungePreferences({ ...preferences, ...patch }));
  const screenHeight = Math.max(80, Math.min(8640, window.innerHeight));
  const visualReset = () => {
    const keys = ['backdropMode', 'backgroundUrl', 'backgroundOpacity', 'backgroundFit', 'backgroundPositionX', 'backgroundPositionY', 'backgroundZoom', 'backgroundMotion', 'carouselVerticalOffset', 'panelOpacity', 'shelfOpacity', 'previewPosition', 'previewWidth', 'previewBoxHeight', 'previewVerticalOffset', 'previewCornerRadius', 'previewTextScale', 'previewCoverScale', 'previewPanelOpacity', 'previewShowCover', 'previewShowDescription', 'previewShowFacts', 'previewShowProgress', 'previewShowIndex', 'previewShowFactIcons', 'previewShowPlaytime', 'previewShowJourney', 'previewShowSource', 'previewShowRelease', 'previewShowYourRating', 'previewShowMetacritic', 'ambientMotion', 'ambientPace', 'waveStrength', 'atmosphereOpacity', 'lightBloom', 'lightRays', 'highlightPulse', 'vignette', 'waveScale', 'waveDrift', 'bloomSpread', 'raySoftness', 'lightShimmer', 'motion', 'fxLevel', 'particleStyle', 'particleAmount', 'particleRandomness', 'particleColor', 'particleOpacity', 'particleSize', 'particleTrail', 'particleGlow', 'particleSpeed', 'coverGlow', 'coverFrame', 'frameColor', 'frameCustomColor', 'sceneDrift', 'artSaturation', 'artContrast', 'artTemperature', 'filmGrain', 'chromaticAberration', 'ribbonIntensity', 'ribbonSpeed', 'ribbonPosition', 'edgeGlow', 'edgeWidth', 'edgePulse', 'previewStyle', 'infoDensity'];
    set({ ...Object.fromEntries([...keys, 'ambientLight', 'themeFlow', 'coverGlowStrength', 'smokeStrength', 'smokeSize', 'smokeSpeed', 'coldRayStrength', 'coldRaySpread', 'coldRaySoftness'].map(key => [key, DEFAULT_LOUNGE_PREFERENCES[key]])), effects: undefined });
  };
  return <div role="dialog" aria-modal="true" aria-label="Lounge visual builder" data-testid="lounge-visual-builder" className="fixed inset-0 z-[9100] flex items-center justify-center bg-black/80 p-3 sm:p-6" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={draggable.panelRef} style={{ ...draggable.panelStyle, '--lounge-card-glow-gain': renderPreferences.coverGlowStrength / 100, '--lounge-card-glow-radius': Math.sqrt(renderPreferences.coverGlowStrength / 100), '--lounge-card-glow-near-alpha': `${Math.min(100, renderPreferences.coverGlowStrength * 0.88)}%`, '--lounge-card-glow-far-alpha': `${Math.min(100, renderPreferences.coverGlowStrength * 0.62)}%`, '--lounge-card-glow-visibility': renderPreferences.coverGlowStrength === 0 ? 'hidden' : 'visible' }} className="lounge-visual-builder flex h-[96dvh] max-h-[calc(100dvh-3rem)] w-full max-w-[1880px] flex-col overflow-hidden rounded-3xl border border-[rgb(var(--accent)/0.55)] bg-[rgb(var(--surface))] shadow-[0_28px_100px_rgb(0_0_0/0.55)]">
      <header {...draggable.dragHandleProps} className="lounge-guide-heading flex shrink-0 items-center justify-between gap-3 border-b border-[rgb(var(--border))] px-5 py-4 sm:px-7"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[rgb(var(--accent)/0.18)] text-[rgb(var(--accent-2))]"><Sparkles size={24} /></span><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[rgb(var(--accent-2))]">Lounge only</p><h2 className="text-xl font-black sm:text-2xl">Visual Builder</h2></div></div><button ref={closeRef} type="button" data-controller-close onClick={onClose} aria-label="Close Lounge visual builder" className="lounge-visual-step rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.7)] p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[rgb(var(--accent))]"><X size={20} /></button></header>
      <div className="shrink-0 border-b border-[rgb(var(--border)/0.7)] bg-[rgb(var(--surface))] px-5 pb-4 pt-4 sm:px-7">
        <div className="mb-3 flex items-center gap-2"><ImagePlus size={19} className="text-[rgb(var(--accent-2))]" /><h3 className="text-lg font-black">Background</h3><span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-muted">Live preview · stays visible</span></div>
        <p className="mb-3 text-sm text-muted">Choose what sits behind your games. Desktop themes stay untouched.</p>
        <LoungeLivePreview preferences={preferences}><div data-testid="lounge-visual-preview" className="lounge-visual-preview absolute inset-0 z-0 overflow-hidden" data-lounge-scene={preferences.specialTheme} data-lounge-cover-glow={renderPreferences.coverGlow} data-lounge-cover-frame={preferences.coverFrame} data-lounge-motion={effectsActive ? preferences.motion : 'off'} data-lounge-preview-layout={preferences.shelfPosition} style={{ ...loungeFramePaletteStyle(preferences.frameColor, preferences.frameCustomColor), '--lounge-panel-opacity': preferences.panelOpacity / 100, '--lounge-shelf-opacity': preferences.shelfOpacity / 100, '--lounge-preview-panel-opacity': preferences.previewPanelOpacity / 100, '--lounge-atmosphere-opacity': preferences.atmosphereOpacity / 100, '--lounge-light-bloom': renderPreferences.lightBloom / 100, '--lounge-bloom-spread': `${preferences.bloomSpread}%`, '--lounge-ray-blur': `${1 + preferences.raySoftness * 0.08}px`, '--lounge-shimmer-duration': `${Math.max(0.28, 1.35 - preferences.lightShimmer / 100)}s`, '--lounge-vignette': renderPreferences.vignette / 100, '--lounge-vignette-blur': `${renderPreferences.vignette * 0.9}px`, '--lounge-vignette-alpha': renderPreferences.vignette / 100 * 0.32, '--lounge-wave-size': `${150 + preferences.waveScale}%`, '--lounge-wave-drift': preferences.waveDrift / 100 }}>
          <LoungeLivingBackdrop theme={theme} game={preferences.backdropMode === 'game' ? game : null} loungeLevel={loungeLevel} motion={preferences.motion} active={effectsActive} flowOpacity={flowOpacity} flowSeconds={flowSeconds} preferences={preferences} onBackgroundError={() => { setImageFailed(true); setError('This artwork or video could not play. Choose another file.'); }} />
          {effectsActive && <LoungeParticleLayer styleId={preferences.particleStyle === 'theme' ? loungeSceneParticleStyle(preferences.specialTheme) : preferences.particleStyle} level={loungeLevel} motion={preferences.motion} amount={preferences.particleAmount} randomness={preferences.particleRandomness} color={preferences.particleColor} opacity={preferences.particleOpacity} size={preferences.particleSize} trail={preferences.particleTrail} glow={preferences.particleGlow} speed={preferences.particleSpeed} preview />}
          <div className="lounge-flow pointer-events-none absolute inset-0" aria-hidden="true" style={{ '--lounge-flow-opacity': effectsActive ? flowOpacity * renderPreferences.themeFlow / 100 : 0, '--lounge-flow-seconds': `${flowSeconds * (preferences.motion === 'subtle' ? 1.8 : 1)}s` }} />

        </div></LoungeLivePreview>
      </div>
      <nav aria-label="Visuals categories" className="lounge-visual-category-nav flex shrink-0 flex-wrap gap-2 border-b border-[rgb(var(--border))] px-4 py-3">
        {['surfaces', 'scenery', 'layout', 'effects'].map((id, index) => <button key={id} type="button" className="lounge-visual-choice rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-sm font-bold" onClick={() => { const target = draggable.panelRef.current?.querySelector(`#lounge-visual-${id}`); target?.scrollIntoView({ block: 'start', behavior: 'instant' }); (target?.querySelector('button:not(:disabled), input:not(:disabled)') || target)?.focus({ preventScroll: true }); }}>{index + 1} · {['Opacity & surfaces', 'Artwork & particles', 'Game layout', 'Effects'][index]}</button>)}
      </nav>
      <div className="lounge-visual-controls grid min-h-0 flex-1 content-start gap-4 overflow-y-auto p-4">
        <section id="lounge-visual-surfaces" tabIndex={-1} data-testid="lounge-visual-row-surfaces" className="lounge-visual-category min-w-0 rounded-2xl border border-[rgb(var(--border)/0.8)] bg-[rgb(var(--panel)/0.24)] p-4">
          <h3 className="lounge-visual-category-title"><span>01</span>Opacity & surfaces</h3>
          <p className="mt-2 text-xs text-muted">All screen backdrops and glass transparency in one place. Effects keep their own strength controls.</p>
        <Stepper label="Artwork visibility" value={preferences.backgroundOpacity} min={0} max={100} onChange={backgroundOpacity => set({ backgroundOpacity })} />
        <Stepper label="Main Lounge surfaces opacity" value={preferences.panelOpacity} min={LOUNGE_SURFACE_OPACITY_RANGE.min} max={LOUNGE_SURFACE_OPACITY_RANGE.max} onChange={panelOpacity => set({ panelOpacity })} />
        <Stepper label="Bottom game bar opacity" value={preferences.shelfOpacity} min={LOUNGE_SURFACE_OPACITY_RANGE.min} max={LOUNGE_SURFACE_OPACITY_RANGE.max} onChange={shelfOpacity => set({ shelfOpacity })} />
        <p className="mt-2 text-xs text-muted">Main surfaces include the top bar, filters, Wall details and card bases. The game bar and preview box have separate overrides; cover art stays clear.</p>
        <Stepper label="Hero and widget opacity" value={preferences.previewPanelOpacity} min={20} max={100} onChange={previewPanelOpacity => set({ previewPanelOpacity })} />
        <p className="mt-2 text-xs text-muted">Hero and widget boxes share this opacity. Text and game artwork stay readable. Widget box visibility is in Lounge Settings → Widgets.</p>
        </section>
        <section id="lounge-visual-scenery" tabIndex={-1} data-testid="lounge-visual-row-scenery" className="lounge-visual-category min-w-0 rounded-2xl border border-[rgb(var(--border)/0.8)] bg-[rgb(var(--panel)/0.24)] p-4">
          <h3 className="lounge-visual-category-title"><span>02</span>Artwork & particles</h3>
          <p className="mt-2 text-xs text-muted">Choose and frame your scenery. Particles stay separate from atmosphere effects.</p>
        <div data-controller-grid className="mt-4 grid gap-2 sm:grid-cols-2">{BACKGROUNDS.map(([id, title, note]) => <button key={id} type="button" aria-pressed={preferences.backdropMode === id} onClick={() => set({ backdropMode: id })} className={`lounge-visual-choice rounded-xl border p-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[rgb(var(--accent))] ${preferences.backdropMode === id ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.17)]' : 'border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.45)]'}`}><strong className="block text-sm">{title}</strong><span className="mt-1 block text-xs text-muted">{note}</span></button>)}</div>
        <p className="mt-3 text-xs text-muted">Add custom backgrounds in Themes; select their Custom-tagged cards there. Adjust its framing and effects here.</p>{error && <p role="alert" className="mt-2 text-sm font-semibold text-rose-300">{error}</p>}
        {['theme', 'game', 'image'].includes(preferences.backdropMode) && <>
          <p className="mt-4 text-xs font-bold text-[rgb(var(--accent-2))]">Lounge window {screenSize} · artwork adapts to your screen shape</p>
          {['game', 'image'].includes(preferences.backdropMode) && <><div className="mt-2 flex flex-wrap gap-2">{[['adaptive', 'Smart fit'], ['fit', 'Show full image'], ['fill', 'Fill screen']].map(([id, label]) => <button key={id} type="button" aria-pressed={preferences.backgroundFit === id} onClick={() => set({ backgroundFit: id })} className="lounge-visual-choice rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-xs font-bold">{label}</button>)}</div><p className="mt-2 text-xs text-muted">Smart fit avoids magnifying a normal wide image across an ultrawide display. Empty side space uses your theme colours.</p></>}
          <Stepper label="Artwork horizontal position" value={preferences.backgroundPositionX} min={0} max={100} onChange={backgroundPositionX => set({ backgroundPositionX })} />
          <Stepper label="Artwork vertical position" value={preferences.backgroundPositionY} min={0} max={100} onChange={backgroundPositionY => set({ backgroundPositionY })} />
          <Stepper label="Artwork zoom" value={preferences.backgroundZoom} min={50} max={200} onChange={backgroundZoom => set({ backgroundZoom })} />
          <p className="mt-2 text-xs text-muted">Below 100% reveals more canvas; above 100% enlarges the image. Position adjusts the crop and zoom anchor. If an axis already fits exactly at 100%, increase zoom to move it without exposing an empty edge. Zoom cannot add detail beyond the source artwork.</p>
          {preferences.backdropMode === 'image' && imageFailed && <p role="status" className="mt-2 text-xs text-rose-300">That file could not be played. It is preserved; choose another file to replace it.</p>}
        </>}
<h4 className="lounge-visual-subheading">Particles</h4>
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

        </section>
        <section id="lounge-visual-layout" tabIndex={-1} data-testid="lounge-visual-row-layout" className="lounge-visual-category min-w-0 rounded-2xl border border-[rgb(var(--border)/0.8)] bg-[rgb(var(--panel)/0.24)] p-4">
          <h3 className="lounge-visual-category-title"><span>03</span>Game layout</h3>
          <p className="mt-2 text-xs text-muted">Placement, sizing, details and carousel frame styling.</p>
          <div className="min-w-0">
        <div className="mt-7 border-t border-[rgb(var(--border)/0.7)] pt-5"><h3 className="text-lg font-black">Game presentation</h3><p className="mt-1 text-xs text-muted">The hero shows the selected game cover and information. Screenshots are shown inside the game-details popup after you choose a game.</p><p className="mt-4 text-xs font-black uppercase tracking-[0.14em] text-muted">Information density</p><div className="mt-2 flex flex-wrap gap-2">{INFO_DENSITIES.map(([id, label]) => <button key={id} type="button" aria-pressed={preferences.infoDensity === id} onClick={() => set({ infoDensity: id })} className={`lounge-visual-choice rounded-xl border px-3 py-2.5 text-sm font-bold ${preferences.infoDensity === id ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.18)]' : 'border-[rgb(var(--border))]'}`}>{label}</button>)}</div><p className="mt-2 text-xs text-muted">Minimal keeps the title and essentials; Balanced adds a short description and up to three selected facts; Detailed adds every selected fact plus developer, publisher, genres and install size when available.</p></div>
          </div><div className="lounge-visual-subsection" data-testid="lounge-preview-box-builder">
          <h3 className="text-lg font-black">Selected-game preview box</h3>
          <p className="mt-1 text-xs text-muted">Shape the compact info box over Lounge-only scenery. The standard Game Browser keeps its own preview styles above.</p>
          <p className="mt-4 text-xs font-black uppercase tracking-[0.14em] text-muted">Placement</p>
          {['top', 'bottom'].includes(preferences.shelfPosition) && <><Stepper label="Carousel vertical position" value={preferences.carouselVerticalOffset} min={-300} max={300} step={10} unit="px" onChange={carouselVerticalOffset => set({ carouselVerticalOffset })} /><p className="mt-2 text-xs text-muted">Negative moves up; positive moves down. Stops at the screen edge to keep enlarged covers visible.</p></>}
          <div className="mt-2 flex flex-wrap gap-2">{loungePanelPositions(panelShelfPosition).map(id => <button key={id} type="button" aria-pressed={preferences.previewPosition === id} onClick={() => set({ previewPosition: id })} className="lounge-preview-choice lounge-visual-choice rounded-xl border border-[rgb(var(--border))] px-4 py-2.5 text-sm font-bold">{id.replace('center', 'middle').replace('-', ' ')}</button>)}</div>
          <Stepper label="Preview box width" value={preferences.previewWidth} min={20} max={100} onChange={previewWidth => set({ previewWidth })} />
          <p className="mt-2 text-xs text-muted">Widen the box to fit more details, especially in Detailed mode. It stays inside the Lounge window.</p>
          <Stepper label="Hero preview height" value={Math.min(preferences.previewBoxHeight, screenHeight)} min={80} max={screenHeight} step={1} unit="px" onChange={previewBoxHeight => set({ previewBoxHeight })} />
          <p className="mt-1 text-xs text-muted">From 80px to the full Lounge screen height. Preview vertical position controls where it sits.</p>
          <Stepper label="Preview vertical position" value={preferences.previewVerticalOffset} min={-300} max={100} step={10} unit="px" onChange={previewVerticalOffset => set({ previewVerticalOffset })} />
          <p className="mt-2 text-xs text-muted">Negative values move the preview lower; positive values lift it.</p>
          <Stepper label="Preview corner radius" value={preferences.previewCornerRadius} min={0} max={48} unit="px" onChange={previewCornerRadius => set({ previewCornerRadius })} />
          <Stepper label="Preview text size" value={preferences.previewTextScale} min={75} max={135} onChange={previewTextScale => set({ previewTextScale })} />
          </div><div className="lounge-visual-subsection"><h3 className="text-lg font-black">Preview appearance & contents</h3><p className="mt-1 text-xs text-muted">Tune the cover, glass and details independently of placement.</p>
          <Stepper label="Description cover size" value={preferences.previewCoverScale} min={50} max={250} onChange={previewCoverScale => set({ previewCoverScale })} />
          <p className="mt-1 text-xs text-muted">Resize the portrait cover independently. It stays within the description panel, leaving room for text.</p>
          <p className="mt-5 text-xs font-black uppercase tracking-[0.14em] text-muted">Show in the preview</p>
          <div className="mt-2 grid grid-cols-2 gap-2">{[['previewShowCover', 'Game cover'], ['previewShowDescription', 'Description'], ['previewShowIndex', 'Game position'], ['previewShowFactIcons', 'Fact icons'], ['previewShowPlaytime', 'Playtime'], ['previewShowJourney', 'Journey status'], ['previewShowSource', 'Store / source'], ['previewShowRelease', 'Release date'], ['previewShowYourRating', 'Your rating'], ['previewShowMetacritic', 'Metacritic'], ['previewShowProgress', 'Position line']].map(([id, label]) => <button key={id} type="button" aria-pressed={preferences[id]} onClick={() => set({ [id]: !preferences[id] })} className="lounge-preview-choice lounge-visual-choice min-h-11 rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-left text-sm font-bold">{label}</button>)}</div>
          <p className="mt-2 text-xs text-muted">Explore game always stays available. The position line lives inside this box, never across the full scene.</p>
</div>
        <CoverFramePicker value={preferences.coverFrame} frameColor={preferences.frameColor} frameCustomColor={preferences.frameCustomColor} motion={effectsActive ? preferences.motion : 'off'} onChange={coverFrame => set({ coverFrame })} />
        <fieldset className="mt-5" style={loungeFramePaletteStyle(preferences.frameColor, preferences.frameCustomColor)}>
          <legend className="text-sm font-black">Carousel frame colour</legend>
          <p className="mt-1 text-xs text-muted">Colour the artwork and title frame without changing the game art or cover glow.</p>
          <div data-controller-grid className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {Object.entries(LOUNGE_FRAME_COLORS).map(([id, choice]) => <button key={id} type="button" aria-pressed={preferences.frameColor === id} onClick={() => set({ frameColor: id })} className={`lounge-visual-choice flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-bold ${preferences.frameColor === id ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.18)]' : 'border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.45)]'}`}><span aria-hidden="true" className="h-5 w-5 shrink-0 rounded-full border border-white/40" style={{ background: id === 'custom' ? preferences.frameCustomColor : choice.primary }} />{choice.label}</button>)}
          </div>
          <label className="mt-3 flex items-center gap-3 text-xs font-bold">Custom colour <input aria-label="Custom carousel frame colour" type="color" value={preferences.frameCustomColor} onChange={event => set({ frameColor: 'custom', frameCustomColor: event.target.value })} className="h-9 w-14 cursor-pointer rounded-lg border border-[rgb(var(--border))] bg-transparent p-1" /></label>
          {preferences.frameColor === 'custom' && <div aria-label="Controller custom frame colour"><p className="mt-2 text-xs text-muted">Controller-friendly custom colour: adjust red, green and blue without opening the native colour picker.</p>{['Red', 'Green', 'Blue'].map((channel, index) => <Stepper key={channel} label={`Frame ${channel}`} value={parseInt(preferences.frameCustomColor.slice(1 + index * 2, 3 + index * 2), 16)} min={0} max={255} step={1} unit="" onChange={value => { const channels = [0, 1, 2].map(part => parseInt(preferences.frameCustomColor.slice(1 + part * 2, 3 + part * 2), 16)); channels[index] = value; set({ frameCustomColor: `#${channels.map(part => part.toString(16).padStart(2, '0')).join('')}` }); }} />)}</div>}
        </fieldset>

        </section>
        <section id="lounge-visual-effects" tabIndex={-1} data-testid="lounge-visual-row-effects" className="lounge-visual-category min-w-0 rounded-2xl border border-[rgb(var(--border)/0.8)] bg-[rgb(var(--panel)/0.24)] p-4">
          <h3 className="lounge-visual-category-title"><span>04</span>Effects & movement</h3>
          <p className="mt-2 text-xs text-muted">Atmospheres, colour grading and motion. Check an effect to reveal its sliders.</p>
<div className="mt-5 flex items-center gap-2"><Layers3 size={18} className="text-[rgb(var(--accent-2))]" /><h4 className="font-black">FX strength</h4></div><div className="mt-3 flex flex-wrap gap-2">{[['theme', 'Theme'], [0, 'Off'], [1, 'Low'], [2, 'Medium'], [3, 'High'], [4, 'Max']].map(([id, label]) => <button key={String(id)} type="button" aria-pressed={preferences.fxLevel === id} onClick={() => set({ fxLevel: id })} className={`lounge-visual-choice rounded-xl border px-3 py-2.5 text-sm font-bold ${preferences.fxLevel === id ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.18)]' : 'border-[rgb(var(--border))]'}`}>{label}</button>)}</div><p className="mt-3 text-xs text-muted">Master intensity for atmosphere, postprocessing, motion, card glow and particles: Low 18%, Medium 42%, High 70%, Max 100% of your tuning. Saved slider values stay unchanged. Motion Off, reduced-motion, Rest and hidden windows pause movement.</p><button type="button" onClick={visualReset} className="lounge-visual-choice mt-6 inline-flex items-center gap-2 rounded-xl border border-[rgb(var(--border))] px-4 py-3 text-sm font-bold"><RotateCcw size={17} /> Reset visuals</button>

<h4 className="lounge-visual-subheading">Colour & film finish</h4>
<EffectChecklist group="postprocessing" preferences={preferences} set={set} />
<h4 className="lounge-visual-subheading">Atmospheres & movement</h4>
        <div className="mt-4 flex flex-wrap gap-2">{MOTION.map(([id, label]) => <button key={id} type="button" aria-pressed={preferences.ambientMotion === id} onClick={() => set({ ambientMotion: id })} className={`lounge-visual-choice rounded-xl border px-4 py-3 text-sm font-bold ${preferences.ambientMotion === id ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.18)]' : 'border-[rgb(var(--border))]'}`}>{label}</button>)}</div><p className="mt-5 text-xs font-black uppercase tracking-[0.14em] text-muted">Background pace</p><div className="mt-2 flex flex-wrap gap-2">{PACE.map(([id, label]) => <button key={id} type="button" aria-pressed={preferences.ambientPace === id} onClick={() => set({ ambientPace: id })} className={`lounge-visual-choice rounded-xl border px-4 py-3 text-sm font-bold ${preferences.ambientPace === id ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.18)]' : 'border-[rgb(var(--border))]'}`}>{label}</button>)}</div><p className="mt-2 text-xs text-muted">Only changes drift and wave speed, not game browsing.</p><p className="mt-5 text-xs font-black uppercase tracking-[0.14em] text-muted">Overall movement</p><div className="mt-2 flex flex-wrap gap-2">{SPEED.map(([id, label]) => <button key={id} type="button" aria-pressed={preferences.motion === id} onClick={() => set({ motion: id })} className={`lounge-visual-choice rounded-xl border px-4 py-3 text-sm font-bold ${preferences.motion === id ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.18)]' : 'border-[rgb(var(--border))]'}`}>{label}</button>)}</div>

        <p className="mt-3 text-xs text-muted">Check any combination. Each effect reveals its own controls. Particles remain separate.</p>
        <EffectChecklist group="atmosphere" preferences={preferences} set={set} />
        {LOUNGE_EFFECTS.some(effect => effect.group === 'atmosphere' && preferences.effects?.[effect.id]) && <Stepper label="Atmosphere opacity" value={preferences.atmosphereOpacity} min={0} max={100} onChange={atmosphereOpacity => set({ atmosphereOpacity })} />}
        {['bloom', 'rays', 'highlight'].some(id => preferences.effects?.[id]) && <Stepper label="Light shimmer speed" value={preferences.lightShimmer} min={0} max={100} onChange={lightShimmer => set({ lightShimmer })} />}
          <h4 className="lounge-visual-subheading">Motion & game glow</h4>
        <EffectChecklist group="effects" preferences={preferences} set={set} />
        <h4 className="mt-5 font-black">Ready-made light looks</h4>
        <div data-controller-grid className="mt-3 grid gap-2">{Object.entries(LOUNGE_LIGHT_LOOKS).map(([id, look]) => <button key={id} type="button" aria-pressed={Object.entries(look.settings).every(([key, value]) => preferences[key] === value) && ['ribbon', 'edge', 'saturation', 'contrast', 'temperature', 'drift'].every(key => preferences.effects?.[key])} onClick={() => set({ ...look.settings, effects: { ...preferences.effects, ribbon: true, edge: true, saturation: true, contrast: true, temperature: true, drift: true } })} className="lounge-visual-choice lounge-light-look rounded-xl border border-[rgb(var(--border))] p-3 text-left"><strong className="block text-xs">{look.label}</strong><small className="block text-[10px] text-muted">{look.note}</small></button>)}</div>

        </section>
      </div>
    </section>
  </div>;
}
