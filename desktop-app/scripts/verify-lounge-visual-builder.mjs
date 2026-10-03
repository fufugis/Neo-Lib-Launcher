import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.resolve('vite'));
const postcss = require('postcss');
const source = fs.readFileSync('src/components/lounge/LoungeVisualBuilder.jsx', 'utf8');
const css = postcss.parse(fs.readFileSync('src/styles.css', 'utf8'));
assert(source.includes('max-w-[1440px]') && source.includes('max-h-[94vh]'));
assert(source.includes('ref={draggable.panelRef}') && source.includes('<header {...draggable.dragHandleProps}'));
const scenery = source.indexOf('data-testid="lounge-visual-row-scenery"');
const layout = source.indexOf('data-testid="lounge-visual-row-layout"');
const effects = source.indexOf('data-testid="lounge-visual-row-effects"');
assert(scenery < layout && layout < effects, 'three ordered rows retained');
for (const group of ['atmosphere', 'postprocessing', 'effects']) assert.equal(source.split(`EffectChecklist group="${group}"`).length - 1, 1, 'effect controls are never duplicated');
assert(source.indexOf('EffectChecklist group="postprocessing"') < layout, 'colour/film controls occupy the former empty scenery column');
assert(source.slice(layout, effects).includes('xl:grid-cols-3') && source.slice(layout, effects).includes('Preview appearance & contents'));
assert(source.indexOf('<CoverFramePicker value=') < source.indexOf('<h4 className="font-black">Particles</h4>'), 'frames have their own group separate from particles');
assert(source.includes('lounge-visual-slider-box') && source.includes('lounge-visual-slider-label'));
const compactRules = [];
css.walkRules(rule => { if (rule.selector.includes('comfortable') && rule.selector.includes('.lounge-visual-')) compactRules.push(rule); });
assert.equal(compactRules.length, 3);
for (const rule of compactRules) {
  assert(rule.selector.includes("data-lounge-control-size='compact'") && !rule.selector.includes("data-lounge-control-size='large'"));
  assert(!rule.selector.includes('input') && !rule.selector.includes('button'), 'actual sliders/buttons remain unchanged');
  for (const declaration of rule.nodes) assert(['margin-top', 'margin-bottom', 'padding-block'].includes(declaration.prop), 'only box spacing becomes slimmer');
}
assert(source.includes('shrink-0 border-b') && source.includes('lounge-visual-controls grid min-h-0 flex-1'), 'preview remains pinned above scrollable controls');
console.log('PASS: wider viewport-bounded draggable builder, balanced three rows, unique effect groups, unchanged slider targets and near/medium-only compact boxes.');
