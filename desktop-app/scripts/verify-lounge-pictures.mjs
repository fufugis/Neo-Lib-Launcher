import assert from 'node:assert/strict';
import fs from 'node:fs';
import { normalizeLoungePreferences } from '../src/components/lounge/lounge-layout-model.mjs';
import { createControllerNavigator } from '../src/services/controller-navigation-service.mjs';

for (const [input, expected] of [[undefined, 100], [-50, 50], [175, 175], [999, 250]]) {
  const prefs = normalizeLoungePreferences({ previewCoverScale: input });
  assert.equal(prefs.previewCoverScale, expected);
  assert.equal(normalizeLoungePreferences(JSON.parse(JSON.stringify(prefs))).previewCoverScale, expected);
}
const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');
const panel = read('../src/components/lounge/LoungeGamePanel.jsx');
assert(panel.includes('lounge-detail-gallery grid grid-cols-1 gap-3 sm:grid-cols-3'));
assert(!panel.includes('overflow-x-auto'));
assert(panel.indexOf('lounge-detail-media') > panel.indexOf('</aside></div>'), 'gallery follows both columns');
assert(panel.includes('data-testid="lounge-picture-viewer"') && panel.includes('h-full w-full object-contain'));
assert(panel.includes("window.addEventListener('keydown', keyDown, true)"));
assert(panel.includes('dismissedKey.current === event.code'), 'held key remains consumed through release');
assert(read('../src/components/lounge/LoungeVisualBuilder.jsx').includes('label="Description cover size"'));
assert(read('../src/components/lounge/NeoLounge.jsx').includes("'--lounge-preview-cover-scale': preferences.previewCoverScale / 100"));

const frames = [], commands = [];
let time = 1000, pictureOpen = false, dismissals = 0;
const pad = { index: 0, id: 'Picture test', connected: true, mapping: 'standard', axes: [0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) };
const navigator = createControllerNavigator({
  navigatorRef: { getGamepads: () => [pad] },
  windowRef: { requestAnimationFrame: fn => { frames.push(fn); return frames.length; }, cancelAnimationFrame() {} },
  now: () => time,
  onButtonPress: () => { if (!pictureOpen) return false; pictureOpen = false; dismissals++; return true; },
  onCommand: command => { if (pictureOpen) { pictureOpen = false; dismissals++; return true; } commands.push(command); },
});
const tick = () => { time += 500; frames.shift()(); };
navigator.start(); tick(); tick();
pictureOpen = true; pad.buttons[0] = { pressed: true, value: 1 }; tick(); tick(); tick();
assert.equal(dismissals, 1); assert.deepEqual(commands, [], 'held confirm cannot reopen or activate behind viewer');
pad.buttons[0] = { pressed: false, value: 0 }; tick();
pad.buttons[0] = { pressed: true, value: 1 }; tick();
assert.deepEqual(commands, ['confirm'], 'a fresh press works after release');
pad.buttons[0] = { pressed: false, value: 0 }; tick();
pictureOpen = true; pad.buttons[10] = { pressed: true, value: 1 }; tick();
assert.equal(dismissals, 2, 'even an unmapped button dismisses the picture');
pad.buttons[10] = { pressed: false, value: 0 }; tick();
pictureOpen = true; pad.axes = [1, 0]; tick(); tick();
assert.equal(dismissals, 3); assert.deepEqual(commands, ['confirm'], 'held stick dismissal is isolated');
navigator.stop();
console.log('PASS: persisted cover size, full-width gallery, screen-fitting viewer and release-gated input.');
