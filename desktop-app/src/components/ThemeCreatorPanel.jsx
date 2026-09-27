import React from 'react';
import { customThemeAssetUrl, stockThemeFileUrl, stockThemeManifest, STOCK_THEME_IDS } from '../themes/stock-theme-registry.mjs';
import blankTheme from '../../electron/themes/blank-theme.json';
import builtinParticles from '../../electron/themes/builtin-particles.json';
import { particleDuration, particleMotionStyle, particlePosition } from '../themes/particle-placement.mjs';
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
const LOUNGE_DEFAULTS = { focusGlow: 0.75, flowOpacity: 0.36, flowSeconds: 18, panelOpacity: 0.82, artOpacity: 0.75, cardLift: 4, fxBoost: 0 };
const cleanParticle = particle => ({
  id: particle.id, asset: particle.asset, sourcePath: particle.sourcePath,
  count: Number(particle.count), sizePx: Number(particle.sizePx),
  opacity: Number(particle.opacity), durationSeconds: Number(particle.durationSeconds), direction: particle.direction,
  placement: particle.placement || 'full', depth: particle.depth || 'near',
  rotation: Number(particle.rotation ?? 0), glow: Number(particle.glow ?? 0),
  speedVariation: Number(particle.speedVariation ?? 15), spinDegrees: Number(particle.spinDegrees ?? 0), swayPx: Number(particle.swayPx ?? 0),
  reaction: particle.reaction || 'ambient',
});

export default function ThemeCreatorPanel({ themes, onSaved, onExpandedChange }) {
  const [expanded, setExpanded] = React.useState(false);
  const [sourceId, setSourceId] = React.useState('blank-starter');
  const [name, setName] = React.useState('');
  const [id, setId] = React.useState('');
  const [creator, setCreator] = React.useState('');
  const [tone, setTone] = React.useState('dark');
  const [stockFx, setStockFx] = React.useState('');
  const [palette, setPalette] = React.useState({});
  const [panels, setPanels] = React.useState({});
  const [layers, setLayers] = React.useState({});
  const [particles, setParticles] = React.useState([]);
  const [lounge, setLounge] = React.useState(LOUNGE_DEFAULTS);
  const [previewReaction, setPreviewReaction] = React.useState(null);
  const [error, setError] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [assetTarget, setAssetTarget] = React.useState(null);
  const [selectedAsset, setSelectedAsset] = React.useState('');
  const [preparedAsset, setPreparedAsset] = React.useState(null);
  const [assetFilter, setAssetFilter] = React.useState('');
  const source = sourceId === 'blank-starter' ? blankTheme : stockThemeManifest(sourceId) || themes.find(theme => theme.id === sourceId) || blankTheme;
  const assetChoices = React.useMemo(() => [
    ...builtinParticles.map(particle => ({ ...particle, themeId: 'neolib-particles', themeName: 'NEO-LIB particles', slot: 'Particle', kind: 'particle',
      url: `data:image/png;base64,${particle.pngBase64}` })),
    ...[...STOCK_THEME_IDS.map(stockThemeManifest), ...themes].flatMap(theme => {
    const entries = [...Object.entries(theme.layers).map(([slot, layer]) => ({ asset: layer.asset, slot, kind: 'layer' })),
      ...(theme.effects?.particles || []).map(particle => ({ asset: particle.asset, slot: 'Particle', kind: 'particle', label: particle.id,
        direction: particle.direction, count: particle.count, sizePx: particle.sizePx, durationSeconds: particle.durationSeconds,
        speedVariation: particle.speedVariation, spinDegrees: particle.spinDegrees, swayPx: particle.swayPx }))];
    return entries.filter(entry => entry.asset && /\.(png|jpe?g|webp)$/i.test(entry.asset))
      .filter((entry, index, all) => all.findIndex(other => other.asset === entry.asset) === index)
      .map(entry => ({ ...entry, themeId: theme.id, themeName: theme.name,
        url: stockThemeFileUrl(theme.id, entry.asset) || customThemeAssetUrl(`custom:${theme.id}`, entry.asset) }));
  })].filter(entry => entry.url), [themes]);
  const visibleAssets = assetChoices.filter(entry => entry.kind === (assetTarget === 'particle' ? 'particle' : 'layer')
    && (!assetFilter || `${entry.label || ''} ${entry.description || ''} ${entry.themeName} ${entry.slot} ${entry.asset}`.toLowerCase().includes(assetFilter.toLowerCase())));
  const selectedChoice = assetChoices.find(entry => `${entry.themeId}:${entry.asset}` === selectedAsset);
  const contrast = palette.ink && panels.panel ? contrastRatio(palette.ink, panels.panel) : null;
  React.useEffect(() => {
    if (!source) return;
    setSourceId(source.id);
    setName(source.id === 'blank-starter' ? 'My Theme' : `${source.name} Remix`);
    setId(slug(source.id === 'blank-starter' ? 'my-theme' : `${source.id}-remix`));
    setTone(source.tone);
    setStockFx(STOCK_THEME_IDS.includes(source.id) ? source.id : source.effects?.stockFx || '');
    setPalette(Object.fromEntries(Object.entries(source.palette).map(([key, value]) => [key, [...value]])));
    setPanels(Object.fromEntries(Object.entries(source.panels).map(([key, value]) => [key, [...value]])));
    setLayers(Object.fromEntries(Object.entries(source.layers).map(([key, value]) => [key, { ...value }])));
    setParticles((source.effects?.particles || []).map(particle => ({ ...particle })));
    setLounge({ ...LOUNGE_DEFAULTS, ...source.lounge });
    setPreviewReaction(null);
    setPreparedAsset(null);
    setAssetTarget(null);
    setError('');
  }, [source?.id]);
  const editParticle = (index, patch) => setParticles(current => current.map((particle, at) => at === index ? { ...particle, ...patch } : particle));
  const editLayer = (name, patch) => setLayers(current => ({ ...current, [name]: { ...current[name], ...patch } }));
  const sourceAssetUrl = asset => stockThemeFileUrl(source.id, asset) || customThemeAssetUrl(`custom:${source.id}`, asset);
  const layerUrl = name => layers[name]?.previewUrl || (layers[name]?.type === 'image' ? sourceAssetUrl(layers[name].asset) : '');
  const mediaUrl = name => layers[name]?.previewUrl || sourceAssetUrl(layers[name]?.asset);
  const mediaStillUrl = name => layers[name]?.fallbackPreviewUrl || sourceAssetUrl(layers[name]?.reducedMotionAsset);
  const openAssetPicker = target => { setAssetTarget(target); setSelectedAsset(''); setPreparedAsset(null); setAssetFilter(''); };
  const applyPreparedAsset = (result, target, choice) => {
    if (target === 'particle') {
      const used = new Set(particles.map(particle => particle.id));
      let index = 1;
      while (used.has(`particle-${index}`)) index += 1;
      setParticles(current => [...current, { id: `particle-${index}`, sourcePath: result.path, previewUrl: result.url,
        count: choice?.count ?? 12, sizePx: choice?.sizePx ?? 24, opacity: 0.75,
        durationSeconds: choice?.durationSeconds ?? 18, direction: choice?.direction ?? 'rise', placement: 'full', depth: 'near', rotation: 0,
        speedVariation: choice?.speedVariation ?? 35, spinDegrees: choice?.spinDegrees ?? 0, swayPx: choice?.swayPx ?? 0,
        glow: 0, reaction: 'ambient' }]);
    } else setLayers(current => ({ ...current, [target]: { type: 'image', sourcePath: result.path, previewUrl: result.url, opacity: current[target]?.opacity ?? 1 } }));
    setPreparedAsset({ ...result, target });
    setError('');
  };
  async function useLibraryAsset(action = 'copy') {
    if (!selectedChoice || !assetTarget || (assetTarget === 'particle' && particles.length >= 3)) return;
    const target = assetTarget;
    const result = await window.api?.prepareThemeAsset?.({ sourceId: selectedChoice.themeId, asset: selectedChoice.asset, action });
    if (!result?.ok) { setError(result?.error || 'Could not make an artwork copy.'); return; }
    applyPreparedAsset(result, target, selectedChoice);
    setAssetTarget(null);
  }
  const openWebEditor = async url => {
    if (!preparedAsset?.path) { setError('Choose or edit a copy first, then use it in the web editor.'); return; }
    await window.api?.openExternal?.(url);
  };
  const refreshPreparedAsset = () => {
    if (!preparedAsset) return;
    const previewUrl = `${preparedAsset.url}?updated=${Date.now()}`;
    if (preparedAsset.target === 'particle') setParticles(current => current.map(particle => particle.sourcePath === preparedAsset.path ? { ...particle, previewUrl } : particle));
    else setLayers(current => ({ ...current, [preparedAsset.target]: { ...current[preparedAsset.target], previewUrl } }));
  };
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
    setParticles(current => [...current, { id: `particle-${index}`, sourcePath: picked.path, previewUrl: picked.url, count: 12, sizePx: 24, opacity: 0.55, durationSeconds: 18, direction: 'rise', placement: 'full', depth: 'near', rotation: 0, speedVariation: 35, spinDegrees: 0, swayPx: 0, glow: 0, reaction: 'ambient' }]);
    setError('');
  }
  async function save() {
    if (!source || busy) return;
    setBusy(true);
    setError('');
    try {
      const result = await window.api.forkTheme({ sourceId: source.id, newId: id, newName: name.trim(), creator: creator.trim(), tone, stockFx, palette, panels, layers, lounge, particles: particles.map(cleanParticle) });
      if (!result?.ok) { setError(result?.error || 'Could not save this remix.'); return; }
      await onSaved(result.id);
    } catch (failure) { setError(failure?.message || 'Could not save this remix.'); }
    finally { setBusy(false); }
  }
  if (!source) return null;
  return <section className="mt-4 rounded-xl border border-[rgb(var(--border)/0.75)] bg-[rgb(var(--panel)/0.5)] p-3" data-testid="theme-creator-panel">
    <button type="button" onClick={() => setExpanded(value => { onExpandedChange?.(!value); return !value; })} aria-expanded={expanded} className="flex w-full items-center justify-between text-left"><span><span className="block text-[12px] font-bold text-ink">Theme Creator Lab</span><span className="block text-[10px] text-muted">Start blank or remix colours, artwork layers and particle FX with a live preview.</span></span><span className="text-[10px] text-muted">{expanded ? 'Close' : 'Open'}</span></button>
    {expanded && <div className="mt-3 grid gap-4 lg:grid-cols-2" data-testid="theme-creator-workspace">
    <div className="min-w-0">
    <div className="grid gap-2 sm:grid-cols-2">
      <label className="text-[10px] text-muted">Starting point<select value={source.id} onChange={event => setSourceId(event.target.value)} className="mt-1 w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-1.5 text-ink"><option value="blank-starter">Blank starter</option><optgroup label="NEO-LIB themes">{STOCK_THEME_IDS.map(themeId => <option value={themeId} key={themeId}>{stockThemeManifest(themeId)?.name}</option>)}</optgroup>{themes.length > 0 && <optgroup label="Your themes">{themes.map(theme => <option value={theme.id} key={theme.id}>{theme.name}</option>)}</optgroup>}</select></label>
      <label className="text-[10px] text-muted">Your creator name<input value={creator} maxLength={80} onChange={event => setCreator(event.target.value)} className="mt-1 w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-1.5 text-ink" placeholder="Your name" /></label>
      <label className="text-[10px] text-muted">New theme name<input value={name} maxLength={80} onChange={event => setName(event.target.value)} className="mt-1 w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-1.5 text-ink" /></label>
      <label className="text-[10px] text-muted">New theme ID<input value={id} maxLength={64} onChange={event => setId(slug(event.target.value))} className="mt-1 w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-1.5 text-ink" /></label>
      <label className="text-[10px] text-muted">Theme tone<select value={tone} onChange={event => setTone(event.target.value)} className="mt-1 w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-1.5 text-ink">{['bright', 'middle', 'dark', 'special'].map(value => <option key={value}>{value}</option>)}</select></label>
      <label className="text-[10px] text-muted">Built-in particle &amp; FX style<select value={stockFx} onChange={event => setStockFx(event.target.value)} className="mt-1 w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-1.5 text-ink"><option value="">None</option>{STOCK_THEME_IDS.map(themeId => <option value={themeId} key={themeId}>{stockThemeManifest(themeId)?.name}</option>)}</select></label>
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
          <button type="button" onClick={() => openAssetPicker(key)} disabled={busy} className="rounded border border-[rgb(var(--accent)/0.6)] px-2 py-1 text-ink">NEO-LIB art</button>
          <button type="button" onClick={() => pickLayer(key)} disabled={busy} className="rounded border border-[rgb(var(--border))] px-2 py-1">Choose image</button>
          {['canvas', 'atmosphere'].includes(key) && <><button type="button" onClick={() => pickGif(key)} disabled={busy} className="rounded border border-[rgb(var(--border))] px-2 py-1">GIF + still</button><button type="button" onClick={() => pickVideo(key)} disabled={busy} className="rounded border border-[rgb(var(--border))] px-2 py-1">WebM + still</button></>}
          <button type="button" onClick={() => setLayers(current => ({ ...current, [key]: key === 'canvas' ? { type: 'gradient', from: 'grad1', to: 'grad2', opacity: 1 } : { type: 'none' } }))} disabled={busy || (key === 'canvas' ? layers[key]?.type === 'gradient' : layers[key]?.type === 'none')} className="text-muted disabled:opacity-40">{key === 'canvas' ? 'Use gradient' : 'Remove'}</button>
        </div>
        {['canvas', 'atmosphere'].includes(key) && ['gif', 'video'].includes(layers[key]?.type) && <label className="mt-1 block text-muted">Playback<select value={layers[key].loop} onChange={event => editLayer(key, { loop: event.target.value })} className="mt-1 w-full rounded bg-[rgb(var(--surface))] p-1 text-ink"><option value="once">Once, then still</option><option value="while-visible">Only while visible</option><option value="always">While NEO-LIB is awake</option></select></label>}
        {['canvas', 'atmosphere'].includes(key) && layers[key]?.type === 'gif' && layers[key].loop === 'once' && !layers[key].playbackMs && <p className="mt-1 text-[9px] text-muted">New GIF timing is checked on Save; the one-shot preview appears after reopening the saved theme.</p>}
        {['image', 'gif', 'video'].includes(layers[key]?.type) && <label className="mt-1 block text-muted">Opacity: {Math.round((layers[key].opacity ?? 1) * 100)}%<input type="range" min="0" max="1" step="0.05" value={layers[key].opacity ?? 1} onChange={event => editLayer(key, { opacity: Number(event.target.value) })} className="w-full accent-[rgb(var(--accent))]" /></label>}
      </div>)}</div>
    </details>
    <details className="mt-2 rounded-lg border border-[rgb(var(--accent)/0.45)] p-2" data-testid="theme-lounge-editor">
      <summary className="cursor-pointer text-[10px] font-bold text-ink">Lounge · fullscreen visuals</summary>
      <p className="mt-1 text-[9px] text-muted">These controls apply only in Lounge. Theme colours and particle art above are reused; reduced-motion and Rest still pause movement.</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">{[
        ['focusGlow', 'Selected-game glow', 0, 1, 0.05], ['flowOpacity', 'Ambient flow', 0, 1, 0.05],
        ['flowSeconds', 'Flow duration (seconds)', 6, 60, 1], ['panelOpacity', 'Lounge panel opacity', 0.5, 1, 0.05],
        ['artOpacity', 'Selected artwork brightness', 0.3, 1, 0.05], ['cardLift', 'Selected-cover lift (px)', 0, 12, 1],
        ['fxBoost', 'Lounge-only FX boost', 0, 2, 1],
      ].map(([key, label, min, max, step]) => <label key={key} className="text-[10px] text-muted">{label}: {lounge[key]}<input type="range" min={min} max={max} step={step} value={lounge[key]} onChange={event => setLounge(current => ({ ...current, [key]: Number(event.target.value) }))} className="mt-1 w-full accent-[rgb(var(--accent))]" /></label>)}</div>
      <div className="relative mt-3 overflow-hidden rounded-xl border border-[rgb(var(--accent)/0.6)] bg-[rgb(var(--panel))] p-4" style={{ opacity: lounge.panelOpacity, boxShadow: `0 0 ${Math.round(lounge.focusGlow * 35)}px rgb(var(--accent) / ${lounge.focusGlow * 0.65})` }}><div className="lounge-flow pointer-events-none absolute inset-0" style={{ '--lounge-flow-opacity': lounge.flowOpacity, '--lounge-flow-seconds': `${lounge.flowSeconds}s` }} aria-hidden="true" /><span className="relative text-xs font-black text-ink">Selected game</span><span className="relative ml-3 text-[10px] text-muted">Lounge preview · flow, glow and panel</span></div>
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
          ['rotation', 'Starting angle', -180, 180, 5], ['speedVariation', 'Speed variation %', 0, 75, 5],
          ['spinDegrees', 'Spin per pass °', -720, 720, 15], ['swayPx', 'Side-to-side sway px', 0, 120, 5],
          ['glow', 'Glow', 0, 20, 1],
        ].map(([key, label, min, max, step]) => <label key={key} className="text-muted">{label}: {particle[key] ?? (key === 'speedVariation' ? 15 : 0)}<input type="range" min={min} max={max} step={step} value={particle[key] ?? (key === 'speedVariation' ? 15 : 0)} onChange={event => editParticle(index, { [key]: Number(event.target.value) })} className="mt-1 w-full accent-[rgb(var(--accent))]" /></label>)}
      </div>
      <p className="mt-1 text-muted">Speed variation gives each particle a stable faster or slower pace. Spin turns it during travel; sway moves it sideways like a falling leaf. Zero keeps either effect off.</p>
    </div>)}
    {assetTarget && <div className="mt-3 rounded-lg border border-[rgb(var(--accent)/0.45)] bg-[rgb(var(--surface)/0.35)] p-3 text-[10px]" data-testid="theme-asset-library">
      <div className="flex items-center justify-between gap-2"><b className="text-ink">NEO-LIB artwork · {assetTarget === 'particle' ? 'Particle' : ARTWORK_LAYERS.find(([key]) => key === assetTarget)?.[1]}</b><button type="button" onClick={() => setAssetTarget(null)} className="text-muted hover:text-ink">Close</button></div>
      {assetTarget === 'particle' && <p className="mt-1 text-muted">Transparent sprites only. Choose one to see its motion in the live preview; upload your own with “Add particle image”.</p>}
      <input value={assetFilter} onChange={event => setAssetFilter(event.target.value)} placeholder={assetTarget === 'particle' ? 'Find rain, hearts, petals, embers…' : 'Find theme artwork…'} aria-label="Find NEO-LIB artwork" className="mt-2 w-full rounded border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1.5 text-ink" />
      <div className="mt-2 grid max-h-56 grid-cols-3 gap-2 overflow-y-auto pr-1">{visibleAssets.map(entry => <button type="button" key={`${entry.themeId}:${entry.asset}`} onClick={() => setSelectedAsset(`${entry.themeId}:${entry.asset}`)} aria-pressed={selectedAsset === `${entry.themeId}:${entry.asset}`} title={entry.description || entry.themeName} className={`min-w-0 rounded border p-1 text-left ${selectedAsset === `${entry.themeId}:${entry.asset}` ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.14)]' : 'border-[rgb(var(--border))]'}`}><img src={entry.url} alt="" className="h-16 w-full rounded bg-[rgb(var(--panel))] object-contain" /><span className="mt-1 block truncate font-bold text-ink">{entry.label || entry.themeName}</span><span className="block truncate text-muted">{entry.kind === 'particle' ? `${entry.themeName} · ${entry.direction || 'custom motion'}` : entry.slot}</span></button>)}</div>
      {visibleAssets.length === 0 && <p className="mt-2 text-muted">No matching {assetTarget === 'particle' ? 'particle sprites' : 'artwork'}.</p>}
      {selectedChoice && <div className="mt-2 flex flex-wrap gap-2"><button type="button" onClick={() => useLibraryAsset('copy')} className="rounded bg-[rgb(var(--accent))] px-2.5 py-1.5 font-bold text-[rgb(var(--surface))]">Use a copy</button><button type="button" onClick={() => useLibraryAsset('edit')} className="rounded border border-[rgb(var(--border))] px-2.5 py-1.5 text-ink">Edit copy in default app</button><button type="button" onClick={() => useLibraryAsset('reveal')} className="rounded border border-[rgb(var(--border))] px-2.5 py-1.5 text-ink">Show copy / Open with…</button></div>}
      <p className="mt-2 text-muted">Copies are stored in your NEO-LIB theme workbench. Original artwork is never changed.</p>
    </div>}
    {preparedAsset && <div className="mt-2 rounded-lg border border-[rgb(var(--border)/0.6)] p-2 text-[10px]" data-testid="theme-edit-roundtrip"><b className="text-ink">Your editable copy is ready</b><p className="mt-1 text-muted">Edit it in your desktop app, or upload it yourself to Canva or ChatGPT Images. NEO-LIB does not send files to either service. Save the result as PNG, JPG or WebP, then choose it above if it is a new file.</p><div className="mt-2 flex flex-wrap gap-2"><button type="button" onClick={refreshPreparedAsset} className="rounded border border-[rgb(var(--border))] px-2 py-1 text-ink">Refresh edited copy</button><button type="button" onClick={() => openWebEditor('https://www.canva.com/photo-editor/')} className="rounded border border-[rgb(var(--border))] px-2 py-1 text-ink">Open Canva</button><button type="button" onClick={() => openWebEditor('https://chatgpt.com/')} className="rounded border border-[rgb(var(--border))] px-2 py-1 text-ink">Open AI Images</button></div><label className="mt-2 block text-muted">Suggested AI request<textarea readOnly onFocus={event => event.currentTarget.select()} value="Revamp this NEO-LIB theme artwork while keeping its purpose and transparent background. Preserve the original canvas size and clear space around any button text. Return one PNG image, without adding a UI screenshot or extra labels." className="mt-1 h-16 w-full resize-none rounded border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-1.5 text-ink" /></label></div>}
    <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={addParticle} disabled={particles.length >= 3 || busy} className="rounded-lg border border-[rgb(var(--border))] px-2.5 py-1.5 text-[10px] disabled:opacity-45">+ Add particle image</button><button type="button" onClick={() => openAssetPicker('particle')} disabled={particles.length >= 3 || busy} className="rounded-lg border border-[rgb(var(--border))] px-2.5 py-1.5 text-[10px] disabled:opacity-45">+ Use NEO-LIB particle art</button><button type="button" onClick={save} disabled={busy || !creator.trim() || !id || !name.trim()} className="rounded-lg bg-[rgb(var(--accent))] px-3 py-1.5 text-[10px] font-bold text-[rgb(var(--surface))] disabled:opacity-45">{busy ? 'Saving…' : 'Save as new theme'}</button></div>
    <p className="mt-2 text-[9px] text-muted">A remix preserves source artwork credit. For a new theme, use only images you have permission to redistribute.</p>
    {error && <p role="alert" className="mt-2 text-[10px] text-red-300">{error}</p>}
    </div>
    <aside className="min-w-0 lg:sticky lg:top-0 lg:self-start" aria-label="Theme preview pane">
      <div className="theme-creator-preview relative h-72 overflow-hidden rounded-lg border border-[rgb(var(--border))] lg:h-96" style={{ background: `linear-gradient(135deg, rgb(${(palette.grad1 || source.palette.grad1).join(' ')}), rgb(${(palette.grad2 || source.palette.grad2).join(' ')}))` }} aria-label="Live theme preview">
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
          const image = particle.previewUrl || sourceAssetUrl(particle.asset);
          if (!image || (particle.reaction && particle.reaction !== 'ambient' && previewReaction?.kind !== particle.reaction)) return null;
          const burst = particle.reaction && particle.reaction !== 'ambient';
          const count = burst ? Math.min(12, particle.count) : particle.count;
          return Array.from({ length: count }, (_, index) => {
            const duration = particleDuration(particle, index);
            return <img key={`${particle.id}-${burst ? previewReaction.key : 'ambient'}-${index}`} src={image} alt="" draggable={false} className={burst ? 'theme-creator-reaction' : `theme-creator-sprite theme-creator-sprite--${particle.direction}`} style={{ width: particle.sizePx * (particle.depth === 'far' ? 0.65 : 1), height: particle.sizePx * (particle.depth === 'far' ? 0.65 : 1), ...(burst ? { left: particle.direction === 'drift' ? '50%' : particlePosition(particle, index).left, top: particle.direction === 'drift' ? particlePosition(particle, index).top : '45%' } : particlePosition(particle, index)), '--preview-opacity': particle.opacity * (particle.depth === 'far' ? 0.6 : 1), '--fx-opacity': particle.opacity * (particle.depth === 'far' ? 0.6 : 1), ...particleMotionStyle(particle), filter: particle.glow ? `drop-shadow(0 0 ${particle.glow}px currentColor)` : undefined, color: 'rgb(var(--accent))', animationDuration: burst ? '1.2s' : `${duration}s`, animationDelay: burst ? `${index * 45}ms` : `${-(index / count) * duration}s` }} />;
          });
        })}
      </div>
      {stockFx && <p className="mt-2 text-[10px] text-muted">{stockThemeManifest(stockFx)?.name} particle/FX style will animate in the saved theme. Image particles above remain separately editable.</p>}
    </aside>
    </div>}
  </section>;
}
