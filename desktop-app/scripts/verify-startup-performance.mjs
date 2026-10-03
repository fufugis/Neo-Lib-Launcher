import assert from 'node:assert/strict';
import fs from 'node:fs';
import { collectStartupPerformance } from '../src/lib/startup-performance.mjs';
const app = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const modals = fs.readFileSync(new URL('../src/components/app/AppModalLayer.jsx', import.meta.url), 'utf8');
assert(!modals.includes('<StartupIntro') && !modals.includes('crtboot'));
assert(app.includes('Promise.all([nativeApi.loadLibrary(), nativeApi.loadSettings()'));
assert(app.includes('if (!startupReady) return'));
assert(app.includes('startupReady && (!seen'));
const callbacks = new Map();
class Observer {
  static supportedEntryTypes = ['largest-contentful-paint', 'layout-shift', 'longtask', 'event', 'resource'];
  constructor(callback) { this.callback = callback; }
  observe({type}) { callbacks.set(type, this.callback); }
  disconnect() {}
}
const target = { PerformanceObserver: Observer };
const stop = collectStartupPerformance(target);
const emit = (type, entries) => callbacks.get(type)({ getEntries: () => entries });
emit('layout-shift', [{value: .1, startTime: 0, hadRecentInput: true}, {value: .02, startTime: 200, sources: []}]);
assert.equal(target.__NEOLIB_STARTUP_PERFORMANCE__.cls, .02);
emit('layout-shift', [{value: .01, startTime: 2000, sources: []}]);
assert.equal(target.__NEOLIB_STARTUP_PERFORMANCE__.cls, .02, 'Separate shift windows do not accumulate');
const stock = new URL('../src/themes/stock/', import.meta.url);
for (const folder of fs.readdirSync(stock)) {
  const root = new URL(`${folder}/`, stock);
  const manifest = JSON.parse(fs.readFileSync(new URL('theme.json', root), 'utf8'));
  if (manifest.layers.sidebar?.type !== 'image') continue;
  const optimized = fs.readFileSync(new URL('assets/sidebar.webp', root));
  assert.equal(optimized.subarray(8,12).toString(), 'WEBP');
  assert(optimized.length < fs.statSync(new URL(manifest.layers.sidebar.asset, root)).size);
}
emit('event', [{interactionId: 1, name: 'click', duration: 32, startTime: 10, processingStart: 14, processingEnd: 20}]);
assert.equal(target.__NEOLIB_STARTUP_PERFORMANCE__.interactions[0].inputDelay, 4);
emit('longtask', Array.from({length: 100}, () => ({startTime: 1, duration: 60})));
assert.equal(target.__NEOLIB_STARTUP_PERFORMANCE__.longTasks.length, 80);
stop();
console.log('PASS: intro removed, hydration gated/parallel, bounded local startup and interaction evidence. No live performance score asserted.');
