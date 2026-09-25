import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { THEMES } from '../src/lib/utils.js';
import { THEME_LAYER_NAMES, validateThemeManifest } from '../src/themes/theme-manifest.mjs';

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
assert.equal(validateThemeManifest({ ...sample, css: 'body{display:none}' }).ok, false);
assert.equal(validateThemeManifest({ ...sample, layers: { ...sample.layers, atmosphere: { type: 'image', asset: '../private.png' } } }).ok, false);
assert.equal(validateThemeManifest({ ...sample, layers: { ...sample.layers, atmosphere: { type: 'video', asset: 'assets/demo.mp4', loop: 'always' } } }).ok, false);
assert.equal(validateThemeManifest({ ...sample, layers: { ...sample.layers, atmosphere: { type: 'video', asset: 'assets/demo.mp4', loop: 'while-visible', reducedMotionAsset: 'assets/still.png' } } }, { assetExists: () => true }).ok, true);
console.log(`PASS: ${folders.length} stock theme folders have complete palettes, named layers, local assets, motion and attribution; unsafe CSS, traversal and video without still fallback are rejected.`);
