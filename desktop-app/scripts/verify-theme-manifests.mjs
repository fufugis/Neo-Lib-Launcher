import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { softenDesktopArtwork } from '../src/themes/artwork-presentation.mjs';
import { fileURLToPath } from 'node:url';
import { THEMES } from '../src/lib/utils.js';
import { THEME_LAYER_NAMES, validateThemeManifest } from '../src/themes/theme-manifest.mjs';
import { particleDuration, particleMotionStyle, particlePosition } from '../src/themes/particle-placement.mjs';
import { themeVideoMetadataAllowed } from '../src/themes/theme-video-model.mjs';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const stockRoot = path.join(appRoot, 'src', 'themes', 'stock');
const css = fs.readFileSync(path.join(appRoot, 'src', 'styles.css'), 'utf8');
function cssTokens(id) {
  const block = css.match(new RegExp(`\\[data-theme='${id}'\\]\\s*\\{([^}]+)\\}`));
  assert(block, `Missing CSS fallback for ${id}`);
  return Object.fromEntries([...block[1].matchAll(/--([a-z0-9-]+):\s*(\d+)\s+(\d+)\s+(\d+)/g)].map(([, key, r, g, b]) => [key, [Number(r), Number(g), Number(b)]]));
}
const baseTokens = cssTokens('synthwave');
const arcana = JSON.parse(fs.readFileSync(path.join(stockRoot, 'moonlit-arcana', 'theme.json'), 'utf8'));
const luminance = rgb => rgb.map(channel => channel / 255).map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
for (const [current, previous] of [[arcana.panels.surface, [13, 24, 48]], [arcana.panels.panel, [23, 39, 68]], [arcana.palette.grad1, [8, 16, 38]], [arcana.palette.grad2, [24, 35, 77]]]) assert(luminance(current) > luminance(previous), 'Moonlit Arcana surfaces are brighter than their former palette');
for (const text of [arcana.palette.ink, arcana.palette.muted, arcana.palette.accentText, arcana.palette.accent2Text]) {
  for (const background of [arcana.panels.surface, arcana.panels.panel, arcana.palette.grad2]) assert((luminance(text) + 0.05) / (luminance(background) + 0.05) >= 4.5, 'Arcana text retains readable contrast on its brighter base surfaces');
}
assert.match(css, /\.theme-artwork-moonlit-arcana\[data-desktop-art-softened='true'\] \{\s*filter: blur\(2px\) saturate\(0.82\) contrast\(0.88\) brightness\(0.98\);/, 'Arcana desktop artwork is brighter without removing softening or touching Lounge');
for (const [id, name] of [['gaming', 'Ember'], ['modern', 'Camo']]) {
  const manifest = JSON.parse(fs.readFileSync(path.join(stockRoot, id, 'theme.json'), 'utf8'));
  assert.equal(manifest.id, id, 'renaming preserves saved settings identity');
  assert.equal(manifest.name, name);
  assert.equal(manifest.layers.atmosphere.asset, `assets/${name.toLowerCase()}-atmosphere.webp`, 'new background replaces legacy artwork');
  const original = fs.readFileSync(path.join(appRoot, 'artwork-originals/mid-theme-refresh', `${name.toLowerCase()}-original.png`));
  assert.equal(original.readUInt32BE(16), 1672); assert.equal(original.readUInt32BE(20), 941);
  const currentSidebar = fs.readFileSync(path.join(stockRoot, id, 'assets/sidebar.webp'));
  const previousSidebar = fs.readFileSync(path.join(appRoot, 'artwork-originals/mid-theme-refresh', `${id}-previous-sidebar.webp`));
  assert.notEqual(crypto.createHash('sha256').update(currentSidebar).digest('hex'), crypto.createHash('sha256').update(previousSidebar).digest('hex'), 'matching fresh sidebar is installed and previous art retained');
}
const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);
for (const id of ['gaming', 'modern']) {
  const theme = JSON.parse(fs.readFileSync(path.join(stockRoot, id, 'theme.json'), 'utf8'));
  assert.equal(theme.tone, 'middle', 'recolour keeps Mid classification and saved theme identity');
  for (const foreground of ['ink', 'muted', 'accentText', 'accent2Text']) {
    for (const background of ['surface', 'panel']) assert(contrast(theme.palette[foreground], theme.panels[background]) >= 4.5, `${id} ${foreground} readable on ${background}`);
  }
  assert(theme.layers.atmosphere.opacity <= 0.32 && theme.layers.sidebar.opacity <= 0.12, 'artwork cannot dominate the new palette');
}
assert(cssTokens('gaming').surface[0] > cssTokens('gaming').surface[1] && cssTokens('gaming').surface[1] > cssTokens('gaming').surface[2] && cssTokens('gaming').surface[0] < 110, 'Gaming is dark-mid brown, not an orange canvas');
assert(cssTokens('gaming').accent[0] > 220 && cssTokens('gaming').accent[1] > 150 && cssTokens('gaming').accent[2] > 100, 'Gaming highlights are soft peach orange');
assert(cssTokens('modern').surface[1] > Math.max(cssTokens('modern').surface[0], cssTokens('modern').surface[2]) && cssTokens('modern').surface[1] <= 70, 'Modern is darker military green');
const folders = fs.readdirSync(stockRoot, { withFileTypes: true }).filter(item => item.isDirectory()).map(item => item.name).sort();
assert(cssTokens('gaming').surface[0] <= 64 && cssTokens('gaming').panel[0] <= 74, 'brown canvas and panels are noticeably darker');
assert(cssTokens('modern').surface[1] <= 49 && cssTokens('modern').panel[1] <= 61, 'military-green canvas and panels are noticeably darker');
assert.deepEqual(folders, THEMES.map(theme => theme.id).sort(), 'Every selectable stock theme needs exactly one folder.');

// Preserve the actual user originals, not a downsampled chat attachment.
const originalScenes = {
  'moonlit-arcana': '36f4b1eafa340195a8aef969a9d9747601ea2e0ad8541a9a5600399da4693827',
  'cosmic-citadel': '5f21910e219efe7b0637f8ce248c2d7cc643e25bb467973b77dddfb43d2e3bf0',
};
const sceneRegistry = fs.readFileSync(path.join(appRoot, 'src/components/lounge/lounge-scene-art.mjs'), 'utf8');
const sceneModel = fs.readFileSync(path.join(appRoot, 'src/components/lounge/lounge-layout-model.mjs'), 'utf8');
for (const [id, expectedHash] of Object.entries(originalScenes)) {
  const bytes = fs.readFileSync(path.join(stockRoot, id, 'assets/scene.jpg'));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), expectedHash, `${id} keeps the original JPEG byte-for-byte`);
  assert.equal(bytes.readUInt16BE(0), 0xffd8);
  let dimensions;
  for (let offset = 2; offset < bytes.length - 10;) {
    if (bytes[offset] !== 0xff) break;
    const marker = bytes[offset + 1];
    if (marker === 0xc0 || marker === 0xc2) { dimensions = [bytes.readUInt16BE(offset + 7), bytes.readUInt16BE(offset + 5)]; break; }
    offset += 2 + bytes.readUInt16BE(offset + 2);
  }
  assert.deepEqual(dimensions, [5504, 3072]);
  assert(sceneRegistry.includes(`themes/stock/${id}/assets/scene.jpg`), 'Lounge shares the original stock asset rather than a reduced duplicate');
  assert(sceneModel.includes(`'${id}': Object.freeze`), 'New scene is selectable and persists through normalization');
  assert(css.includes(`[data-lounge-scene-art='${id}']`), 'New scene supports regular atmosphere light rays');
}

for (const folder of folders) {
  const theme = JSON.parse(fs.readFileSync(path.join(stockRoot, folder, 'theme.json'), 'utf8'));
  const assetExists = asset => fs.existsSync(path.join(stockRoot, folder, asset));
  const verdict = validateThemeManifest(theme, { assetExists });
  assert.equal(verdict.ok, true, `${folder}: ${verdict.errors.join(' ')}`);
  assert.equal(theme.id, folder);
  assert.equal(theme.name, THEMES.find(item => item.id === folder).label);
  assert.equal(theme.tone, THEMES.find(item => item.id === folder).tone);
  assert.deepEqual(Object.keys(theme.layers).sort(), [...THEME_LAYER_NAMES].sort());
  assert.equal(theme.layers.atmosphere.type, 'image');
  assert.equal(theme.layers.sidebar.asset, theme.layers.atmosphere.asset);
  const legacy = { ...baseTokens, ...cssTokens(folder) };
  for (const [key, token] of Object.entries({ ink: 'ink', muted: 'muted', accent: 'accent', accent2: 'accent-2', accentSoft: 'accent-soft', hairlineGlow: 'hairline-glow', grad1: 'grad-1', grad2: 'grad-2' })) assert.deepEqual(theme.palette[key], legacy[token], `${folder} palette.${key} must preserve the existing colours.`);
  for (const key of ['surface', 'panel', 'border']) assert.deepEqual(theme.panels[key], legacy[key], `${folder} panels.${key} must preserve the existing colours.`);
  for (const layer of Object.values(theme.layers)) {
    if (!layer.asset) continue;
    const file = path.join(stockRoot, folder, layer.asset);
    assert.equal(fs.statSync(file).isFile(), true);
    assert(fs.statSync(file).size > 0, `${folder}: ${layer.asset} is empty.`);
  }
}
for (const file of ['src/App.jsx', 'src/components/Sidebar.jsx', 'src/components/ThemeVisuals.jsx', 'src/components/NavButtonArtwork.jsx']) {
  const source = fs.readFileSync(path.join(appRoot, file), 'utf8');
  assert(!source.includes('theme-art/'), `${file} still reads the old shared artwork folder.`);
  assert(source.includes('stockThemeAssetUrl'), `${file} must resolve artwork through the theme manifest.`);
}
const sample = JSON.parse(fs.readFileSync(path.join(stockRoot, 'anime', 'theme.json'), 'utf8'));
assert.equal(validateThemeManifest({ ...sample, lounge: { focusGlow: 0.75, flowOpacity: 0.35, flowSeconds: 18, panelOpacity: 0.8, artOpacity: 0.7, cardLift: 4, fxBoost: 1 } }).ok, true);
assert.equal(validateThemeManifest({ ...sample, lounge: { fxBoost: 99 } }).ok, false, 'Lounge FX boost must stay bounded');
assert.equal(validateThemeManifest({ ...sample, lounge: { flowOpacity: 'full' } }).ok, false, 'Lounge values cannot contain CSS');
const ambientSource = fs.readFileSync(path.join(appRoot, 'src/components/ThemeVisuals.jsx'), 'utf8');
for (const id of ['moonlit-arcana', 'cosmic-citadel']) {
  assert.equal(softenDesktopArtwork(id), true);
  assert.equal(softenDesktopArtwork(id, true), false, 'Lounge must keep the sharp presentation');
}
for (const id of ['anime', 'midnight', 'custom:example', undefined]) assert.equal(softenDesktopArtwork(id), false);
assert(ambientSource.includes('cadence={cadence} loungeMode={loungeMode}'), 'Lounge context must reach the artwork layer');
assert(ambientSource.includes('opacity: opacity * (softened ? 0.82 : 1)'), 'Only softened desktop themes have reduced art prominence');
assert(css.includes(".theme-artwork[data-desktop-art-softened='true']"), 'Softening must be scoped to the opted-in artwork layer');
assert(css.includes('filter: blur(2px) saturate(0.82) contrast(0.88) brightness(0.86);'), 'Desktop treatment stays subtle and static');
const particleSource = fs.readFileSync(path.join(appRoot, 'src/components/CustomThemeParticles.jsx'), 'utf8');
const particleCss = fs.readFileSync(path.join(appRoot, 'src/styles.css'), 'utf8');
assert(ambientSource.includes('<CustomThemeParticles theme={theme} level={level} cadence={cadence}'), 'custom themes must use their declared emitter renderer');
assert(ambientSource.includes('if (resting) return null'), 'Rest Mode must unmount custom FX with ambience');
assert(particleSource.includes('customThemeAssetUrl(theme, emitter.asset)'), 'particle images must come from validated imported assets');
assert(particleCss.includes('@media (prefers-reduced-motion: reduce) { .custom-theme-particles, .theme-creator-sprite, .theme-creator-reaction { display: none; } }'), 'reduced motion must hide moving custom particles and preview');
const emitter = { id: 'petals', asset: 'assets/petal.png', count: 12, sizePx: 24, opacity: 0.5, durationSeconds: 18, direction: 'fall' };
assert.equal(validateThemeManifest({ ...sample, effects: { particles: [emitter] } }, { assetExists: () => true }).ok, true);
assert.equal(validateThemeManifest({ ...sample, effects: { particles: [], stockFx: 'anime' } }).ok, true);
assert.equal(validateThemeManifest({ ...sample, effects: { particles: [], stockFx: 'run-script' } }).ok, false);
assert.equal(validateThemeManifest({ ...sample, effects: { particles: [{ ...emitter, count: 1000 }] } }, { assetExists: () => true }).ok, false);
assert.equal(validateThemeManifest({ ...sample, effects: { particles: [emitter, emitter] } }, { assetExists: () => true }).ok, false);
assert.equal(validateThemeManifest({ ...sample, effects: { particles: [{ ...emitter, placement: 'middle', depth: 'far', rotation: -90, glow: 12 }] } }, { assetExists: () => true }).ok, true);
const animatedEmitter = { ...emitter, speedVariation: 50, spinDegrees: 360, swayPx: 55 };
assert.equal(validateThemeManifest({ ...sample, effects: { particles: [animatedEmitter] } }, { assetExists: () => true }).ok, true);
assert.notEqual(particleDuration(animatedEmitter, 0), particleDuration(animatedEmitter, 1), 'speed variation should give individual sprites different travel times');
assert.equal(particleDuration({ ...emitter, speedVariation: 0 }, 0), particleDuration({ ...emitter, speedVariation: 0 }, 1), 'zero variation should keep a uniform speed');
assert.equal(particleDuration(animatedEmitter, 0), particleDuration(animatedEmitter, 0), 'individual speed must remain stable across renders');
assert.equal(particleMotionStyle(animatedEmitter)['--fx-angle-100'], '360deg');
assert.equal(particleMotionStyle(animatedEmitter)['--fx-sway'], '55px');
assert.equal(validateThemeManifest({ ...sample, effects: { particles: [{ ...emitter, reaction: 'celebrate' }] } }, { assetExists: () => true }).ok, true);
assert.equal(validateThemeManifest({ ...sample, effects: { particles: [{ ...emitter, reaction: 'arbitrary-script' }] } }, { assetExists: () => true }).ok, false);
for (const patch of [{ placement: 'outside' }, { depth: 'front' }, { rotation: 181 }, { glow: 21 }, { speedVariation: 76 }, { spinDegrees: 721 }, { swayPx: 121 }]) {
  assert.equal(validateThemeManifest({ ...sample, effects: { particles: [{ ...emitter, ...patch }] } }, { assetExists: () => true }).ok, false);
}
for (const [placement, low, high] of [['start', 0, 30], ['middle', 35, 65], ['end', 70, 100]]) {
  for (const direction of ['rise', 'fall', 'drift']) {
    for (let index = 0; index < 24; index += 1) {
      const position = particlePosition({ ...emitter, placement, direction }, index);
      const across = Number.parseInt(direction === 'drift' ? position.top : position.left, 10);
      assert(across >= low && across <= high, 'particles stay in their selected placement band');
    }
  }
}
assert.equal(validateThemeManifest({ ...sample, css: 'body{display:none}' }).ok, false);
assert.equal(validateThemeManifest({ ...sample, layers: { ...sample.layers, atmosphere: { type: 'image', asset: '../private.png' } } }).ok, false);
assert.equal(validateThemeManifest({ ...sample, layers: { ...sample.layers, atmosphere: { type: 'video', asset: 'assets/demo.mp4', loop: 'always' } } }).ok, false);
assert.equal(validateThemeManifest({ ...sample, layers: { ...sample.layers, atmosphere: { type: 'video', asset: 'assets/demo.webm', loop: 'while-visible', reducedMotionAsset: 'assets/still.png' } } }, { assetExists: () => true }).ok, true);
assert.equal(validateThemeManifest({ ...sample, layers: { ...sample.layers, atmosphere: { type: 'video', asset: 'assets/demo.mp4', loop: 'while-visible', reducedMotionAsset: 'assets/still.png' } } }, { assetExists: () => true }).ok, false);
assert.equal(validateThemeManifest({ ...sample, layers: { ...sample.layers, sidebar: { type: 'video', asset: 'assets/demo.webm', loop: 'always', reducedMotionAsset: 'assets/still.png' } } }, { assetExists: () => true }).ok, false);
assert.equal(themeVideoMetadataAllowed({ duration: 12, videoWidth: 1920, videoHeight: 1080 }), true);
for (const video of [{ duration: Infinity, videoWidth: 1280, videoHeight: 720 }, { duration: 21, videoWidth: 1280, videoHeight: 720 }, { duration: 4, videoWidth: 1921, videoHeight: 1080 }]) assert.equal(themeVideoMetadataAllowed(video), false);
assert.equal(validateThemeManifest({ ...sample, layers: { ...sample.layers, atmosphere: { type: 'gif', asset: 'assets/motion.gif', loop: 'while-visible', reducedMotionAsset: 'assets/still.png' } } }, { assetExists: () => true }).ok, true);
assert.equal(validateThemeManifest({ ...sample, layers: { ...sample.layers, canvas: { type: 'image', asset: 'assets/canvas.png', opacity: 0.45 } } }, { assetExists: () => true }).ok, true);
assert.equal(validateThemeManifest({ ...sample, layers: { ...sample.layers, canvas: { type: 'gif', asset: 'assets/canvas.gif', reducedMotionAsset: 'assets/still.png', loop: 'once', playbackMs: 100 } } }, { assetExists: () => true }).ok, true);
assert.equal(validateThemeManifest({ ...sample, layers: { ...sample.layers, canvas: { type: 'video', asset: 'assets/canvas.webm', reducedMotionAsset: 'assets/still.png', loop: 'while-visible' } } }, { assetExists: () => true }).ok, true);
assert.equal(validateThemeManifest({ ...sample, layers: { ...sample.layers, canvas: { type: 'video', asset: 'assets/canvas.webm', reducedMotionAsset: 'assets/still.png', loop: 'while-visible' }, atmosphere: { type: 'gif', asset: 'assets/motion.gif', reducedMotionAsset: 'assets/still.png', loop: 'always' } } }, { assetExists: () => true }).ok, false);
assert(ambientSource.includes('<ThemeCanvasAnimation theme={theme} level={level} cadence={cadence} />'), 'canvas animation follows the ambient Rest/Effects contract');
assert.equal(validateThemeManifest({ ...sample, layers: { ...sample.layers, atmosphere: { type: 'gif', asset: 'assets/motion.gif', loop: 'once', reducedMotionAsset: 'assets/still.png', playbackMs: 500 } } }, { assetExists: () => true }).ok, true);
assert.equal(validateThemeManifest({ ...sample, layers: { ...sample.layers, atmosphere: { type: 'gif', asset: 'assets/motion.gif', loop: 'once', reducedMotionAsset: 'assets/still.png' } } }, { assetExists: () => true }).ok, false);
assert.equal(validateThemeManifest({ ...sample, layers: { ...sample.layers, atmosphere: { type: 'gif', asset: 'assets/motion.gif', loop: 'once', reducedMotionAsset: 'assets/still.png', playbackMs: 20_001 } } }, { assetExists: () => true }).ok, false);
assert.equal(validateThemeManifest({ ...sample, layers: { ...sample.layers, sidebar: { type: 'gif', asset: 'assets/motion.gif', loop: 'while-visible', reducedMotionAsset: 'assets/still.png' } } }, { assetExists: () => true }).ok, false);
console.log(`PASS: ${folders.length} stock theme folders have complete palettes, named layers, local assets, motion and attribution; unsafe CSS, traversal and video without still fallback are rejected.`);
