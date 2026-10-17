import assert from 'node:assert/strict';
import fs from 'node:fs';
import { CURSOR_OPTIONS, normalizeCursorTheme } from '../src/lib/cursor-presets.mjs';

const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');
const css = read('../src/styles.css');
assert.deepEqual(CURSOR_OPTIONS.map(option => option.id), ['windows', 'neon', 'petal', 'pixel', 'industrial', 'future', 'stoneage']);
assert.equal(CURSOR_OPTIONS.find(option => option.id === 'pixel').label, 'Retro');
for (const option of CURSOR_OPTIONS) {
  assert.equal(normalizeCursorTheme(option.id), option.id);
  if (!option.preview) continue;
  const svg = fs.readFileSync(new URL(option.preview), 'utf8');
  assert.match(svg, /width="32" height="32" viewBox="0 0 32 32"/);
  assert.match(svg, /M4 3/, 'every themed object starts at its actual native click tip');
  assert(!/<(?:script|animate|image|foreignObject)|href=|filter=/i.test(svg), 'native vectors need no script, external image or costly blur');
  const filename = new URL(option.preview).pathname.split('/').pop();
  assert(css.includes(`[data-neolib-cursor='${option.id}'] * { cursor: url('./assets/cursors/${filename}') 4 3, auto; }`), `${option.id} has a matching native asset, hotspot and fallback`);
}
assert.equal(normalizeCursorTheme('retro'), 'pixel', 'Retro alias preserves stored Pixel selections');
for (const invalid of [null, undefined, {}, 'random', 'constructor']) assert.equal(normalizeCursorTheme(invalid), 'windows');
assert.match(read('../src/assets/cursors/retro.svg'), /shape-rendering="crispEdges"/);
assert.match(read('../src/assets/cursors/retro.svg'), /stroke-linejoin="miter"/);
assert.match(read('../src/assets/cursors/petal.svg'), /M4 3C/, 'Petal is a curved pointed petal, not the standard arrow outline');
for (const name of ['petal', 'industrial', 'future']) assert(!read(`../src/assets/cursors/${name}.svg`).includes('M4 3v23'), 'themed objects must not reuse the standard Windows-style arrow');
assert(css.includes("input:is([type='text'], [type='search']"), 'I-beam reserved for actual text inputs, not checkboxes');
assert(css.includes('button:disabled') && css.includes('cursor: not-allowed'));
for (const cursor of ['col-resize', 'row-resize', 'grab', 'grabbing']) assert(css.includes(`.cursor-${cursor} { cursor: ${cursor}; }`));
assert(read('../src/App.jsx').includes('normalizeCursorTheme(settings.cursorTheme)'));
assert(read('../src/components/modules/ModuleWindowApp.jsx').includes('normalizeCursorTheme(value?.themeSettings?.cursorTheme)'));
const picker = read('../src/components/library/LibraryVisualsPopover.jsx');
assert(picker.includes('aria-pressed={selected === option.id}') && picker.includes('<img src={option.preview}'));
console.log('PASS: seven shared cursor choices, aligned native hotspots, local safe SVGs, legacy Retro/Pixel identity, main/module validation, previews and text/disabled/resize/grab semantics. Native display appearance is a separate acceptance check.');
