import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { loungePreviewViewport } from '../src/components/lounge/lounge-preview-viewport.mjs';
import { captureDisclosureAnchor, restoreDisclosureAnchor } from '../src/components/lounge/lounge-disclosure-anchor.mjs';

for (const initialScroll of [0, 400, 850, 1000]) {
  let baseHeight = 1600, room = 0, scroll = initialScroll;
  const scroller = {
    isConnected: true, clientHeight: 400,
    get scrollHeight() { return baseHeight + room; },
    get scrollTop() { return scroll = Math.max(0, Math.min(scroll, this.scrollHeight - this.clientHeight)); },
    set scrollTop(value) { scroll = Math.max(0, Math.min(value, this.scrollHeight - this.clientHeight)); },
    style: { removeProperty() { room = 0; }, setProperty(key, value) { assert.equal(key, '--lounge-disclosure-room'); room = parseFloat(value); } },
  };
  const button = { isConnected: true, closest: () => scroller, getBoundingClientRect: () => ({ top: 1000 - scroller.scrollTop }) };
  for (let cycle = 0; cycle < 100; cycle++) {
    const collapsed = captureDisclosureAnchor(button);
    baseHeight = 1060;
    restoreDisclosureAnchor(collapsed);
    assert.equal(button.getBoundingClientRect().top, collapsed.top, 'bottom scroll clamping cannot move the clicked control');
    const expanded = captureDisclosureAnchor(button);
    baseHeight = 1600;
    restoreDisclosureAnchor(expanded);
    assert.equal(button.getBoundingClientRect().top, expanded.top, 'repeated expansion does not drift');
    assert.equal(room, 0, 'expanded content removes temporary trailing room');
  }
}
assert.equal(captureDisclosureAnchor({ closest: () => null }), null);
restoreDisclosureAnchor(null);

for (const [width, height] of [[3440, 1440], [1920, 1080], [1280, 720], [1080, 1920]]) {
  for (const [frameWidth, frameHeight] of [[1300, 250], [600, 180], [320, 150]]) {
    const fit = loungePreviewViewport(width, height, frameWidth, frameHeight);
    assert(fit.left >= 0 && fit.top >= 0);
    assert(width * fit.scale <= frameWidth + 1e-8 && height * fit.scale <= frameHeight + 1e-8, 'whole screen fits without cropping or stretching');
    assert(Math.abs((width * fit.scale) / (height * fit.scale) - width / height) < 1e-8, 'ultrawide and portrait aspect ratios preserved');
  }
}
const livePreview = fs.readFileSync(new URL('../src/components/lounge/LoungeLivePreview.jsx', import.meta.url), 'utf8');
const mirror = fs.readFileSync(new URL('../src/components/lounge/lounge-preview-mirror.mjs', import.meta.url), 'utf8');
for (const required of ['source.getBoundingClientRect()', 'devicePixelRatio', 'ResizeObserver', 'MutationObserver', 'node.contains(event.target)', 'inert=""', 'resize.disconnect()', 'changes.disconnect()']) assert(livePreview.includes(required), required);
for (const required of ['readStyle(node)', 'target.scrollLeft = scrollLeft', 'target.scrollTop = scrollTop', "'IFRAME', 'OBJECT', 'EMBED', 'SCRIPT'"]) assert(mirror.includes(required), required);
assert(!livePreview.includes('setInterval'), 'no continuous snapshot polling');

const postcss = createRequire(import.meta.resolve('vite'))('postcss');
const css = postcss.parse(fs.readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8'));
const visualColumns = css.nodes.filter(node => node.type === 'atrule' && node.name === 'container' && node.params.startsWith('lounge-visuals'));
assert.deepEqual(visualColumns.map(node => node.params), ['lounge-visuals (min-width: 820px)', 'lounge-visuals (min-width: 1500px)']);
for (const [index, count] of [[0, 2], [1, 4]]) {
  assert(visualColumns[index].toString().includes(`repeat(${count}, minmax(0, 1fr))`), 'Visuals columns adapt to panel width, not viewport width');
}
const media = css.nodes.find(node => node.type === 'atrule' && node.params === '(min-width: 900px) and (min-height: 600px)');
assert.ok(media, 'roomier popups remain viewport-safe on small screens');
for (const rule of media.nodes.filter(node => node.type === 'rule')) {
  assert.ok(rule.selector.includes("[data-testid='neo-lounge'][data-lounge-control-size='large']"), 'only Lounge across-room mode changes');
  assert.ok(!rule.nodes.some(node => ['zoom', 'transform', 'animation', 'filter'].includes(node.prop)), 'no scaled drag coordinates or additional compositing work');
}
const declaration = (selectorPart, property) => media.nodes.find(node => node.selector?.endsWith(selectorPart))?.nodes.find(node => node.prop === property)?.value;
assert.equal(declaration("[aria-modal='true']", '--lounge-popup-text-gain'), '1.12');
for (const [selector, original, width] of [
  ["[data-testid='lounge-settings-panel'] > aside", 1400, 1620],
  ["[data-testid='lounge-sound-panel'] > aside", 900, 1040],
  ["[data-testid='lounge-visual-builder'] > section", 1880, 2160],
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
const visualBuilder = fs.readFileSync(new URL('../src/components/lounge/LoungeVisualBuilder.jsx', import.meta.url), 'utf8');
assert(visualBuilder.includes('w-24 shrink-0 whitespace-nowrap'), 'Expand and Minimize use the same button width');
assert(visualBuilder.includes('details.open = !details.open; restoreDisclosureAnchor(anchor)'), 'inactive foldout restores its summary position synchronously');
assert(css.toString().includes('scrollbar-gutter: stable') && css.toString().includes('overflow-anchor: none'), 'browser anchoring and scrollbar width cannot fight manual disclosure anchoring');
assert(settingsPanel.includes('max-w-[1400px]') && settingsPanel.includes('h-[min(94dvh,1000px)]') && settingsPanel.includes('max-h-[calc(100dvh-1.5rem)]'), 'taller Settings remains viewport bounded');
assert(settingsPanel.indexOf('<LoungeLayoutPreview preferences=') < settingsPanel.indexOf('className="lounge-settings-content'), 'live preview is pinned outside scrolling Settings controls');
assert.equal((settingsPanel.match(/className="lounge-settings-category"/g) || []).length, 3, 'settings groups are navigation, games and widgets');
for (const category of ['Navigation &amp; browsing', 'Games &amp; emulators', '>Widgets</h3>']) assert(settingsPanel.includes(category));
const container = css.nodes.find(node => node.type === 'atrule' && node.name === 'container' && node.params === 'lounge-settings (min-width: 1040px)');
assert(container?.toString().includes('repeat(3, minmax(0, 1fr))'), 'columns follow actual panel width, not only monitor size');
assert.equal((settingsPanel.match(/<summary role="button" tabIndex=\{0\} data-controller-target/g) || []).length, 2, 'both collapsed pickers remain controller reachable; preview is always visible');
assert(settingsPanel.includes('ref={draggable.panelRef}') && settingsPanel.includes('min-h-0 flex-1 overflow-y-auto'), 'settings retains dragging and internal scrolling');
const soundPanel = fs.readFileSync(new URL('../src/components/lounge/LoungeSoundPanel.jsx', import.meta.url), 'utf8');
const soundControls = fs.readFileSync(new URL('../src/components/lounge/LoungeSoundControls.jsx', import.meta.url), 'utf8');
assert.ok(soundPanel.includes('ref={draggable.panelRef} style={draggable.panelStyle}'), 'sound window uses bounded draggable panel');
assert.ok(soundPanel.includes('<header {...draggable.dragHandleProps}'), 'dragging is confined to the title bar');
assert.ok(soundPanel.includes('items-center justify-center') && soundPanel.includes('max-h-[94vh]'), 'dialog centers with scroll-safe viewport bounds');
assert.ok(soundControls.includes('lounge-sound-rows grid grid-cols-1') && soundControls.includes('aria-label="Browsing sounds"'), 'sounds and ambience are distinct stacked rows');
assert.ok(soundControls.includes('renderForegroundPortal(<LoungeSamplePicker') && soundControls.includes('document.querySelector'), 'sample picker uses shared boundary, escapes transformed sound panel and keeps Lounge styling');
console.log('PASS: modest far-mode popup sizing, roomier widths, preview and small-screen boundaries.');
