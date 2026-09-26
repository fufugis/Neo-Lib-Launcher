import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { THEMES } from '../src/lib/utils.js';
import { THEME_LAYER_NAMES, validateThemeManifest } from '../src/themes/theme-manifest.mjs';
import { particlePosition } from '../src/themes/particle-placement.mjs';
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
const folders = fs.readdirSync(stockRoot, { withFileTypes: true }).filter(item => item.isDirectory()).map(item => item.name).sort();
assert.deepEqual(folders, THEMES.map(theme => theme.id).sort(), 'Every selectable stock theme needs exactly one folder.');

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
const ambientSource = fs.readFileSync(path.join(appRoot, 'src/components/ThemeVisuals.jsx'), 'utf8');
const particleSource = fs.readFileSync(path.join(appRoot, 'src/components/CustomThemeParticles.jsx'), 'utf8');
const particleCss = fs.readFileSync(path.join(appRoot, 'src/styles.css'), 'utf8');
assert(ambientSource.includes('<CustomThemeParticles theme={theme} level={level} cadence={cadence}'), 'custom themes must use their declared emitter renderer');
assert(ambientSource.includes('if (resting) return null'), 'Rest Mode must unmount custom FX with ambience');
assert(particleSource.includes('customThemeAssetUrl(theme, emitter.asset)'), 'particle images must come from validated imported assets');
assert(particleCss.includes('@media (prefers-reduced-motion: reduce) { .custom-theme-particles, .theme-creator-sprite, .theme-creator-reaction { display: none; } }'), 'reduced motion must hide moving custom particles and preview');
const emitter = { id: 'petals', asset: 'assets/petal.png', count: 12, sizePx: 24, opacity: 0.5, durationSeconds: 18, direction: 'fall' };
assert.equal(validateThemeManifest({ ...sample, effects: { particles: [emitter] } }, { assetExists: () => true }).ok, true);
assert.equal(validateThemeManifest({ ...sample, effects: { particles: [{ ...emitter, count: 1000 }] } }, { assetExists: () => true }).ok, false);
assert.equal(validateThemeManifest({ ...sample, effects: { particles: [emitter, emitter] } }, { assetExists: () => true }).ok, false);
assert.equal(validateThemeManifest({ ...sample, effects: { particles: [{ ...emitter, placement: 'middle', depth: 'far', rotation: -90, glow: 12 }] } }, { assetExists: () => true }).ok, true);
assert.equal(validateThemeManifest({ ...sample, effects: { particles: [{ ...emitter, reaction: 'celebrate' }] } }, { assetExists: () => true }).ok, true);
assert.equal(validateThemeManifest({ ...sample, effects: { particles: [{ ...emitter, reaction: 'arbitrary-script' }] } }, { assetExists: () => true }).ok, false);
for (const patch of [{ placement: 'outside' }, { depth: 'front' }, { rotation: 181 }, { glow: 21 }]) {
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
