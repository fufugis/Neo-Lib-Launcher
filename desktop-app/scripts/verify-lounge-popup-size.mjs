import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const postcss = createRequire(import.meta.resolve('vite'))('postcss');
const css = postcss.parse(fs.readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8'));
const media = css.nodes.find(node => node.type === 'atrule' && node.params === '(min-width: 900px) and (min-height: 600px)');
assert.ok(media, 'roomier popups remain viewport-safe on small screens');
for (const rule of media.nodes.filter(node => node.type === 'rule')) {
  assert.ok(rule.selector.includes("[data-testid='neo-lounge'][data-lounge-control-size='large']"), 'only Lounge across-room mode changes');
  assert.ok(!rule.nodes.some(node => ['zoom', 'transform', 'animation', 'filter'].includes(node.prop)), 'no scaled drag coordinates or additional compositing work');
}
const declaration = (selectorPart, property) => media.nodes.find(node => node.selector?.endsWith(selectorPart))?.nodes.find(node => node.prop === property)?.value;
assert.equal(declaration("[aria-modal='true']", '--lounge-popup-text-gain'), '1.12');
for (const [selector, original, width] of [
  ["[data-testid='lounge-settings-panel'] > aside", 700, 810],
  ["[data-testid='lounge-sound-panel'] > aside", 900, 1040],
  ["[data-testid='lounge-visual-builder'] > section", 1440, 1660],
  ['.lounge-detail-panel', 1024, 1180],
  ["[data-testid='lounge-jump-panel'] > section", 768, 880],
  ['.lounge-guide-panel', 1536, 1760],
]) {
  assert.equal(declaration(selector, 'max-width'), `${width}px`);
  assert.ok(width / original >= 1.14 && width / original < 1.18, 'width increase stays modest');
}
assert.ok(media.toString().includes(":not(:where([data-testid='lounge-visual-preview'] *, .lounge-settings-live-preview *))"), 'mini-screen artwork text retains its actual-layout proportions');
assert.equal(declaration("input[type='range']", 'min-height'), '28px');
const settingsPanel = fs.readFileSync(new URL('../src/components/lounge/LoungeSettingsPanel.jsx', import.meta.url), 'utf8');
assert(settingsPanel.includes('max-w-[700px]') && settingsPanel.includes('h-[min(94vh,1040px)]'), 'larger settings box remains bounded to the viewport');
assert(settingsPanel.includes('ref={draggable.panelRef}') && settingsPanel.includes('min-h-0 flex-1 overflow-y-auto'), 'settings retains dragging and internal scrolling');
const soundPanel = fs.readFileSync(new URL('../src/components/lounge/LoungeSoundPanel.jsx', import.meta.url), 'utf8');
const soundControls = fs.readFileSync(new URL('../src/components/lounge/LoungeSoundControls.jsx', import.meta.url), 'utf8');
assert.ok(soundPanel.includes('ref={draggable.panelRef} style={draggable.panelStyle}'), 'sound window uses bounded draggable panel');
assert.ok(soundPanel.includes('<header {...draggable.dragHandleProps}'), 'dragging is confined to the title bar');
assert.ok(soundPanel.includes('items-center justify-center') && soundPanel.includes('max-h-[94vh]'), 'dialog centers with scroll-safe viewport bounds');
assert.ok(soundControls.includes('lounge-sound-rows grid grid-cols-1') && soundControls.includes('aria-label="Browsing sounds"'), 'sounds and ambience are distinct stacked rows');
assert.ok(soundControls.includes('renderForegroundPortal(<LoungeSamplePicker') && soundControls.includes('document.querySelector'), 'sample picker uses shared boundary, escapes transformed sound panel and keeps Lounge styling');
console.log('PASS: modest far-mode popup sizing, roomier widths, preview and small-screen boundaries.');
