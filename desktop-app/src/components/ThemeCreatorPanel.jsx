import React from 'react';
import { customThemeAssetUrl } from '../themes/stock-theme-registry.mjs';
import blankTheme from '../../electron/themes/blank-theme.json';
import { particlePosition } from '../themes/particle-placement.mjs';
import ThemeGifMedia from './ThemeGifMedia';
import ThemeVideoMedia from './ThemeVideoMedia';

const slug = value => String(value || '').toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64);
const toHex = rgb => `#${rgb.map(channel => channel.toString(16).padStart(2, '0')).join('')}`;
const fromHex = value => [1, 3, 5].map(index => Number.parseInt(value.slice(index, index + 2), 16));
const luminance = rgb => rgb.map(channel => { const value = channel / 255; return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4; }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
const contrastRatio = (a, b) => { const values = [luminance(a), luminance(b)].sort((x, y) => y - x); return (values[0] + 0.05) / (values[1] + 0.05); };
const COLOR_GROUPS = [
  ['Main colours', 'ink', 'muted', 'accent', 'accent2', 'accentSoft'],
  ['Background & panels', 'grad1', 'grad2', 'surface', 'panel', 'border'],
  ['Fine details', 'hairlineGlow', 'accentText', 'accent2Text'],
];
const ARTWORK_LAYERS = [
  ['canvas', 'Canvas behind UI'], ['atmosphere', 'Atmosphere overlay'], ['sidebar', 'Library sidebar'], ['decoration', 'Decoration'],
  ['navigationFrame', 'Navigation frame'], ['navigationFlourish', 'Navigation flourish'], ['controlFrame', 'Control frame'],
];
const cleanParticle = particle => ({
  id: particle.id, asset: particle.asset, sourcePath: particle.sourcePath,
  count: Number(particle.count), sizePx: Number(particle.sizePx),
  opacity: Number(particle.opacity), durationSeconds: Number(particle.durationSeconds), direction: particle.direction,
  placement: particle.placement || 'full', depth: particle.depth || 'near',
  rotation: Number(particle.rotation ?? 0), glow: Number(particle.glow ?? 0),
  reaction: particle.reaction || 'ambient',
});

export default function ThemeCreatorPanel({ themes, onSaved }) {
  const [expanded, setExpanded] = React.useState(false);
  const [sourceId, setSourceId] = React.useState('blank-starter');
  const [name, setName] = React.useState('');
  const [id, setId] = React.useState('');
  const [creator, setCreator] = React.useState('');
  const [tone, setTone] = React.useState('dark');
  const [palette, setPalette] = React.useState({});
  const [panels, setPanels] = React.useState({});
  const [layers, setLayers] = React.useState({});
  const [particles, setParticles] = React.useState([]);
  const [previewReaction, setPreviewReaction] = React.useState(null);
  const [error, setError] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const source = sourceId === 'blank-starter' ? blankTheme : themes.find(theme => theme.id === sourceId) || blankTheme;
  const contrast = palette.ink && panels.panel ? contrastRatio(palette.ink, panels.panel) : null;
  React.useEffect(() => {
    if (!source) return;
    setSourceId(source.id);
    setName(source.id === 'blank-starter' ? 'My Theme' : `${source.name} Remix`);
    setId(slug(source.id === 'blank-starter' ? 'my-theme' : `${source.id}-remix`));
    setTone(source.tone);
    setPalette(Object.fromEntries(Object.entries(source.palette).map(([key, value]) => [key, [...value]])));
    setPanels(Object.fromEntries(Object.entries(source.panels).map(([key, value]) => [key, [...value]])));
    setLayers(Object.fromEntries(Object.entries(source.layers).map(([key, value]) => [key, { ...value }])));
    setParticles((source.effects?.particles || []).map(particle => ({ ...particle })));
    setPreviewReaction(null);
    setError('');
  }, [source?.id]);
  const editParticle = (index, patch) => setParticles(current => current.map((particle, at) => at === index ? { ...particle, ...patch } : particle));
  const editLayer = (name, patch) => setLayers(current => ({ ...current, [name]: { ...current[name], ...patch } }));
  const layerUrl = name => layers[name]?.previewUrl || (layers[name]?.type === 'image' ? customThemeAssetUrl(`custom:${source.id}`, layers[name].asset) : '');
  const mediaUrl = name => layers[name]?.previewUrl || customThemeAssetUrl(`custom:${source.id}`, layers[name]?.asset);
  const mediaStillUrl = name => layers[name]?.fallbackPreviewUrl || customThemeAssetUrl(`custom:${source.id}`, layers[name]?.reducedMotionAsset);
  async function pickLayer(name) {
    const picked = await window.api?.pickImage?.();
    if (!picked) return;
    if (!/\.(png|jpe?g|webp)$/i.test(picked.path)) { setError('Choose a PNG, JPG or WebP artwork image.'); return; }
    setLayers(current => ({ ...current, [name]: { type: 'image', sourcePath: picked.path, previewUrl: picked.url, opacity: current[name]?.opacity ?? 1 } }));
    setError('');
  }
  async function pickGif(name) {
    const animated = await window.api?.pickImage?.();
    if (!animated) return;
    if (!/\.gif$/i.test(animated.path)) { setError('Choose a GIF89a animation first.'); return; }
    const still = await window.api?.pickImage?.();
    if (!still) return;
    if (!/\.(png|jpe?g|webp)$/i.test(still.path)) { setError('The GIF also needs a PNG, JPG or WebP still fallback.'); return; }
    setLayers(current => ({ ...current, [name]: { type: 'gif', sourcePath: animated.path, previewUrl: animated.url, reducedMotionSourcePath: still.path, fallbackPreviewUrl: still.url, loop: 'while-visible', opacity: current[name]?.opacity ?? 1 } }));
    setError('');
  }
  async function pickVideo(name) {
    const animated = await window.api?.pickThemeVideo?.();
    if (!animated) return;
    if (!/\.webm$/i.test(animated.path)) { setError('Choose a WebM theme video.'); return; }
    const still = await window.api?.pickImage?.();
    if (!still) return;
    if (!/\.(png|jpe?g|webp)$/i.test(still.path)) { setError('The video also needs a PNG, JPG or WebP still fallback.'); return; }
    setLayers(current => ({ ...current, [name]: { type: 'video', sourcePath: animated.path, previewUrl: animated.url, reducedMotionSourcePath: still.path, fallbackPreviewUrl: still.url, loop: 'while-visible', opacity: current[name]?.opacity ?? 1 } }));
    setError('');
  }
  const editColor = (key, value) => (Object.hasOwn(panels, key) ? setPanels : setPalette)(current => ({ ...current, [key]: fromHex(value) }));
  async function addParticle() {
    if (particles.length >= 3) return;
    const picked = await window.api?.pickImage?.();
    if (!picked) return;
    if (!/\.(png|jpe?g|webp)$/i.test(picked.path)) { setError('Choose a PNG, JPG or WebP particle image.'); return; }
    const used = new Set(particles.map(particle => particle.id));
    let index = 1;
    while (used.has(`particle-${index}`)) index += 1;
    setParticles(current => [...current, { id: `particle-${index}`, sourcePath: picked.path, previewUrl: picked.url, count: 12, sizePx: 24, opacity: 0.55, durationSeconds: 18, direction: 'rise', placement: 'full', depth: 'near', rotation: 0, glow: 0, reaction: 'ambient' }]);
    setError('');
  }
  async function save() {
    if (!source || busy) return;
    setBusy(true);
    setError('');
    try {
      const result = await window.api.forkTheme({ sourceId: source.id, newId: id, newName: name.trim(), creator: creator.trim(), tone, palette, panels, layers, particles: particles.map(cleanParticle) });
      if (!result?.ok) { setError(result?.error || 'Could not save this remix.'); return; }
      await onSaved(result.id);
    } catch (failure) { setError(failure?.message || 'Could not save this remix.'); }
    finally { setBusy(false); }
  }
  if (!source) return null;
  return <section className="mt-4 rounded-xl border border-[rgb(var(--border)/0.75)] bg-[rgb(var(--panel)/0.5)] p-3" data-testid="theme-creator-panel">
    <button type="button" onClick={() => setExpanded(value => !value)} aria-expanded={expanded} className="flex w-full items-center justify-between text-left"><span><span className="block text-[12px] font-bold text-ink">Theme Creator Lab</span><span className="block text-[10px] text-muted">Start blank or remix colours, artwork layers and particle FX with a live preview.</span></span><span className="text-[10px] text-muted">{expanded ? 'Close' : 'Open'}</span></button>
    {expanded && <>
    <div className="grid gap-2 sm:grid-cols-2">
      <label className="text-[10px] text-muted">Starting point<select value={source.id} onChange={event => setSourceId(event.target.value)} className="mt-1 w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-1.5 text-ink"><option value="blank-starter">Blank starter</option>{themes.map(theme => <option value={theme.id} key={theme.id}>{theme.name}</option>)}</select></label>
      <label className="text-[10px] text-muted">Your creator name<input value={creator} maxLength={80} onChange={event => setCreator(event.target.value)} className="mt-1 w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-1.5 text-ink" placeholder="Your name" /></label>
      <label className="text-[10px] text-muted">New theme name<input value={name} maxLength={80} onChange={event => setName(event.target.value)} className="mt-1 w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-1.5 text-ink" /></label>
      <label className="text-[10px] text-muted">New theme ID<input value={id} maxLength={64} onChange={event => setId(slug(event.target.value))} className="mt-1 w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-1.5 text-ink" /></label>
      <label className="text-[10px] text-muted">Theme tone<select value={tone} onChange={event => setTone(event.target.value)} className="mt-1 w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-1.5 text-ink">{['bright', 'middle', 'dark', 'special'].map(value => <option key={value}>{value}</option>)}</select></label>
    </div>
    <div className="theme-creator-preview relative mt-3 h-44 overflow-hidden rounded-lg border border-[rgb(var(--border))]" style={{ background: `linear-gradient(135deg, rgb(${(palette.grad1 || source.palette.grad1).join(' ')}), rgb(${(palette.grad2 || source.palette.grad2).join(' ')}))` }} aria-label="Live theme preview">
      {layerUrl('canvas') && <img src={layerUrl('canvas')} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover" style={{ opacity: layers.canvas?.opacity ?? 1 }} />}
      {['gif', 'video'].includes(layers.canvas?.type) && mediaStillUrl('canvas') && <img src={mediaStillUrl('canvas')} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover" style={{ opacity: layers.canvas.opacity ?? 1 }} />}
      {layers.canvas?.type === 'gif' && mediaUrl('canvas') && mediaStillUrl('canvas') && <ThemeGifMedia key={`${source.id}-${layers.canvas.sourcePath || layers.canvas.asset}-${layers.canvas.loop}`} animatedUrl={mediaUrl('canvas')} stillUrl={mediaStillUrl('canvas')} loop={layers.canvas.loop} playbackMs={layers.canvas.playbackMs} showStill={false} className="pointer-events-none absolute inset-0 h-full w-full object-cover" style={{ opacity: layers.canvas.opacity ?? 1 }} />}
      {layers.canvas?.type === 'video' && mediaUrl('canvas') && mediaStillUrl('canvas') && <ThemeVideoMedia key={`${source.id}-${layers.canvas.sourcePath || layers.canvas.asset}-${layers.canvas.loop}`} animatedUrl={mediaUrl('canvas')} stillUrl={mediaStillUrl('canvas')} loop={layers.canvas.loop} showStill={false} className="pointer-events-none absolute inset-0 h-full w-full object-cover" style={{ opacity: layers.canvas.opacity ?? 1 }} />}
      {layerUrl('atmosphere') && <img src={layerUrl('atmosphere')} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover" style={{ opacity: layers.atmosphere?.opacity ?? 1 }} />}
      {layers.atmosphere?.type === 'gif' && mediaUrl('atmosphere') && mediaStillUrl('atmosphere') && <ThemeGifMedia key={`${source.id}-${layers.atmosphere.sourcePath || layers.atmosphere.asset}-${layers.atmosphere.loop}`} animatedUrl={mediaUrl('atmosphere')} stillUrl={mediaStillUrl('atmosphere')} loop={layers.atmosphere.loop} playbackMs={layers.atmosphere.playbackMs} className="pointer-events-none absolute inset-0 h-full w-full object-cover" style={{ opacity: layers.atmosphere.opacity ?? 1 }} />}
      {layers.atmosphere?.type === 'video' && mediaUrl('atmosphere') && mediaStillUrl('atmosphere') && <ThemeVideoMedia key={`${source.id}-${layers.atmosphere.sourcePath || layers.atmosphere.asset}-${layers.atmosphere.loop}`} animatedUrl={mediaUrl('atmosphere')} stillUrl={mediaStillUrl('atmosphere')} loop={layers.atmosphere.loop} className="pointer-events-none absolute inset-0 h-full w-full object-cover" style={{ opacity: layers.atmosphere.opacity ?? 1 }} />}
      {layerUrl('decoration') && <img src={layerUrl('decoration')} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover" style={{ opacity: layers.decoration?.opacity ?? 1 }} />}
      <div className="absolute bottom-0 left-0 top-0 w-20 border-r border-white/20" style={{ backgroundColor: `rgb(${(panels.surface || source.panels.surface).join(',')})` }}>{layerUrl('sidebar') && <img src={layerUrl('sidebar')} alt="" className="pointer-events-none h-full w-full object-cover" style={{ opacity: layers.sidebar?.opacity ?? 1 }} />}</div>
      <span className="absolute left-2 top-2 z-10 rounded bg-black/45 px-1.5 py-0.5 text-[9px] text-white">Live preview</span>
      <div className="absolute left-24 top-12 z-10 flex gap-1">{['navigationFrame', 'navigationFlourish', 'controlFrame'].map(layerName => <span key={layerName} className="relative rounded border border-white/40 bg-black/40 px-2 py-1 text-[8px] text-white">{layerName === 'controlFrame' ? 'Control' : 'Nav'}{layerUrl(layerName) && <img src={layerUrl(layerName)} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-fill" style={{ opacity: layers[layerName]?.opacity ?? 1 }} />}</span>)}</div>
      <div className="absolute bottom-3 right-3 z-10 rounded-lg border px-3 py-2 shadow-lg" style={{ backgroundColor: `rgb(${(panels.panel || source.panels.panel).join(',')})`, borderColor: `rgb(${(panels.border || source.panels.border).join(',')})`, color: `rgb(${(palette.ink || source.palette.ink).join(',')})` }}><span className="block text-[11px] font-bold">Sample panel</span><span className="block text-[9px]" style={{ color: `rgb(${(palette.muted || source.palette.muted).join(',')})` }}>Readable text and <b style={{ color: `rgb(${(palette.accentText || source.palette.accentText).join(',')})` }}>accent</b></span></div>
      {particles.map(particle => {
        const image = particle.previewUrl || customThemeAssetUrl(`custom:${source.id}`, particle.asset);
        if (!image || (particle.reaction && particle.reaction !== 'ambient' && previewReaction?.kind !== particle.reaction)) return null;
        const burst = particle.reaction && particle.reaction !== 'ambient';
        const count = burst ? Math.min(12, particle.count) : particle.count;
        return Array.from({ length: count }, (_, index) => <img key={`${particle.id}-${burst ? previewReaction.key : 'ambient'}-${index}`} src={image} alt="" draggable={false} className={burst ? 'theme-creator-reaction' : `theme-creator-sprite theme-creator-sprite--${particle.direction}`} style={{ width: particle.sizePx * (particle.depth === 'far' ? 0.65 : 1), height: particle.sizePx * (particle.depth === 'far' ? 0.65 : 1), ...(burst ? { left: particle.direction === 'drift' ? '50%' : particlePosition(particle, index).left, top: particle.direction === 'drift' ? particlePosition(particle, index).top : '45%' } : particlePosition(particle, index)), '--preview-opacity': particle.opacity * (particle.depth === 'far' ? 0.6 : 1), '--fx-opacity': particle.opacity * (particle.depth === 'far' ? 0.6 : 1), '--fx-rotation': `${particle.rotation ?? 0}deg`, filter: particle.glow ? `drop-shadow(0 0 ${particle.glow}px currentColor)` : undefined, color: 'rgb(var(--accent))', animationDuration: burst ? '1.2s' : `${particle.durationSeconds}s`, animationDelay: burst ? `${index * 45}ms` : `${-(index / count) * particle.durationSeconds}s` }} />);
      })}
    </div>
    <details className="mt-3 rounded-lg border border-[rgb(var(--border)/0.55)] p-2" data-testid="theme-color-editor"><summary className="cursor-pointer text-[10px] font-bold text-ink">Edit all theme colours</summary><div className="mt-2 grid gap-3 sm:grid-cols-3">{COLOR_GROUPS.map(([label, ...keys]) => <div key={label}><p className="mb-1 text-[9px] font-bold uppercase tracking-wide text-muted">{label}</p>{keys.map(key => <label key={key} className="mb-1 flex items-center justify-between gap-2 text-[10px] text-muted"><span>{key}</span><input type="color" aria-label={`${key} colour`} value={toHex(panels[key] || palette[key] || source.panels[key] || source.palette[key])} onChange={event => editColor(key, event.target.value)} className="h-6 w-9 cursor-pointer rounded border border-[rgb(var(--border))] bg-transparent" /></label>)}</div>)}</div></details>
    <details className="mt-2 rounded-lg border border-[rgb(var(--border)/0.55)] p-2" data-testid="theme-artwork-editor">
      <summary className="cursor-pointer text-[10px] font-bold text-ink">Edit artwork layers</summary>
      <p className="mt-1 text-[9px] text-muted">Use PNG, JPG or WebP stills. Canvas or Atmosphere can use one bounded GIF/WebM with a still fallback; only one may animate at a time. The source theme stays untouched.</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">{ARTWORK_LAYERS.map(([key, label]) => <div key={key} className="rounded border border-[rgb(var(--border)/0.55)] p-2 text-[10px]">
        <div className="flex items-center justify-between gap-2"><span className="font-bold text-ink">{label}</span><span className="text-muted">{layers[key]?.type === 'gradient' ? 'Gradient' : layers[key]?.type === 'gif' ? 'GIF' : layers[key]?.type === 'video' ? 'WebM' : layers[key]?.type === 'image' ? 'Image' : 'Empty'}</span></div>
        {layerUrl(key) && <img src={layerUrl(key)} alt={`${label} preview`} className="mt-1 h-12 w-full rounded object-cover" style={{ opacity: layers[key]?.opacity ?? 1 }} />}
        {['canvas', 'atmosphere'].includes(key) && ['gif', 'video'].includes(layers[key]?.type) && mediaStillUrl(key) && <img src={mediaStillUrl(key)} alt="Reduced-motion still preview" className="mt-1 h-12 w-full rounded object-cover" />}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => pickLayer(key)} disabled={busy} className="rounded border border-[rgb(var(--border))] px-2 py-1">Choose image</button>
          {['canvas', 'atmosphere'].includes(key) && <><button type="button" onClick={() => pickGif(key)} disabled={busy} className="rounded border border-[rgb(var(--border))] px-2 py-1">GIF + still</button><button type="button" onClick={() => pickVideo(key)} disabled={busy} className="rounded border border-[rgb(var(--border))] px-2 py-1">WebM + still</button></>}
          <button type="button" onClick={() => setLayers(current => ({ ...current, [key]: key === 'canvas' ? { type: 'gradient', from: 'grad1', to: 'grad2', opacity: 1 } : { type: 'none' } }))} disabled={busy || (key === 'canvas' ? layers[key]?.type === 'gradient' : layers[key]?.type === 'none')} className="text-muted disabled:opacity-40">{key === 'canvas' ? 'Use gradient' : 'Remove'}</button>
        </div>
        {['canvas', 'atmosphere'].includes(key) && ['gif', 'video'].includes(layers[key]?.type) && <label className="mt-1 block text-muted">Playback<select value={layers[key].loop} onChange={event => editLayer(key, { loop: event.target.value })} className="mt-1 w-full rounded bg-[rgb(var(--surface))] p-1 text-ink"><option value="once">Once, then still</option><option value="while-visible">Only while visible</option><option value="always">While NEO-LIB is awake</option></select></label>}
        {['canvas', 'atmosphere'].includes(key) && layers[key]?.type === 'gif' && layers[key].loop === 'once' && !layers[key].playbackMs && <p className="mt-1 text-[9px] text-muted">New GIF timing is checked on Save; the one-shot preview appears after reopening the saved theme.</p>}
        {['image', 'gif', 'video'].includes(layers[key]?.type) && <label className="mt-1 block text-muted">Opacity: {Math.round((layers[key].opacity ?? 1) * 100)}%<input type="range" min="0" max="1" step="0.05" value={layers[key].opacity ?? 1} onChange={event => editLayer(key, { opacity: Number(event.target.value) })} className="w-full accent-[rgb(var(--accent))]" /></label>}
      </div>)}</div>
    </details>
    {contrast !== null && <p className={`mt-1 text-[9px] ${contrast < 4.5 ? 'text-amber-300' : 'text-muted'}`}>Panel text contrast: {contrast.toFixed(1)}:1{contrast < 4.5 ? ' · May be hard to read; try a lighter or darker Ink/Panel pair.' : ' · Readable contrast.'}</p>}
    {particles.map((particle, index) => <div key={particle.id} className="mt-2 rounded-lg border border-[rgb(var(--border)/0.55)] p-2 text-[10px]" data-testid="theme-particle-editor">
      <div className="flex items-center justify-between"><span className="font-bold text-ink">{particle.id}</span><button type="button" onClick={() => setParticles(current => current.filter((_, at) => at !== index))} className="text-muted hover:text-ink">Remove</button></div>
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        <label className="text-muted">Direction<select value={particle.direction} onChange={event => editParticle(index, { direction: event.target.value })} className="mt-1 w-full rounded bg-[rgb(var(--surface))] p-1 text-ink">{['rise', 'fall', 'drift'].map(value => <option key={value}>{value}</option>)}</select></label>
        <label className="text-muted">Placement<select value={particle.placement || 'full'} onChange={event => editParticle(index, { placement: event.target.value })} className="mt-1 w-full rounded bg-[rgb(var(--surface))] p-1 text-ink">{['full', 'start', 'middle', 'end'].map(value => <option key={value} value={value}>{value === 'full' ? 'Whole screen' : value === 'start' ? 'Left / top' : value === 'middle' ? 'Middle' : 'Right / bottom'}</option>)}</select></label>
        <label className="text-muted">Depth<select value={particle.depth || 'near'} onChange={event => editParticle(index, { depth: event.target.value })} className="mt-1 w-full rounded bg-[rgb(var(--surface))] p-1 text-ink"><option value="near">Near</option><option value="far">Far (smaller, dimmer)</option></select></label>
        <label className="text-muted">When to show<select value={particle.reaction || 'ambient'} onChange={event => editParticle(index, { reaction: event.target.value })} className="mt-1 w-full rounded bg-[rgb(var(--surface))] p-1 text-ink"><option value="ambient">Always, while FX are on</option><option value="launch">On launch (only if awake)</option><option value="celebrate">On a NEO-LIB celebration</option></select></label>
        {particle.reaction && particle.reaction !== 'ambient' && <button type="button" onClick={() => setPreviewReaction({ kind: particle.reaction, key: Date.now() })} className="self-end rounded border border-[rgb(var(--border))] p-1 text-ink">Preview burst</button>}
        {[
          ['count', 'Particles', 1, 24, 1], ['sizePx', 'Size', 4, 80, 1],
          ['opacity', 'Opacity', 0.05, 1, 0.05], ['durationSeconds', 'Seconds', 5, 60, 1],
          ['rotation', 'Rotation', -180, 180, 5], ['glow', 'Glow', 0, 20, 1],
        ].map(([key, label, min, max, step]) => <label key={key} className="text-muted">{label}: {particle[key] ?? 0}<input type="range" min={min} max={max} step={step} value={particle[key] ?? 0} onChange={event => editParticle(index, { [key]: Number(event.target.value) })} className="mt-1 w-full accent-[rgb(var(--accent))]" /></label>)}
      </div>
    </div>)}
    <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={addParticle} disabled={particles.length >= 3 || busy} className="rounded-lg border border-[rgb(var(--border))] px-2.5 py-1.5 text-[10px] disabled:opacity-45">+ Add particle image</button><button type="button" onClick={save} disabled={busy || !creator.trim() || !id || !name.trim()} className="rounded-lg bg-[rgb(var(--accent))] px-3 py-1.5 text-[10px] font-bold text-[rgb(var(--surface))] disabled:opacity-45">{busy ? 'Saving…' : 'Save as new theme'}</button></div>
    <p className="mt-2 text-[9px] text-muted">A remix preserves source artwork credit. For a new theme, use only images you have permission to redistribute.</p>
    {error && <p role="alert" className="mt-2 text-[10px] text-red-300">{error}</p>}
    </>}
  </section>;
}
