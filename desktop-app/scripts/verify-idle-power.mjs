import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { shouldSaveIdlePower, IDLE_POWER_DELAY_MS, IDLE_POWER_CHECK_MS } from '../src/state/idle-power-model.mjs';

const source = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const start = 100000;
const evaluate = patch => shouldSaveIdlePower({ now: start + IDLE_POWER_DELAY_MS, startedAt: start, ...patch });
assert.equal(evaluate({}), true);
assert.equal(evaluate({ now: start + IDLE_POWER_DELAY_MS - 1 }), false);
assert.equal(evaluate({ gameRunning: true }), false);
assert.equal(evaluate({ blocked: true }), false);
assert.equal(evaluate({ enabled: false }), false);
assert.equal(evaluate({ lastActivityAt: start + IDLE_POWER_DELAY_MS - 1, systemIdleSeconds: 900 }), false, 'controller input overrides Windows keyboard/mouse idle');
assert.equal(evaluate({ now: start, systemIdleSeconds: 900 }), true, 'already-idle PC can enter without another 15-minute wait');
assert.equal(evaluate({ now: start, systemIdleSeconds: '900' }), false);
assert.equal(evaluate({ now: start, systemIdleSeconds: NaN }), false);
assert.equal(evaluate({ now: NaN }), false);
assert.equal(evaluate({ now: start - 1000 }), false);

const hookSource = source('../src/state/use-idle-power-saver.mjs');
const hookBody = hookSource.replace(/^import .*\r?\n/gm, '').replace('export function useIdlePowerSaver', 'function useIdlePowerSaver');
function harness({ nativeApi = { async readSystemIdleSeconds() { return 0; } }, enabled = true, gameRunning = false, blocked = false } = {}) {
  let time = start; let saving = false; let cleanup; let interval; let cleared = false;
  const listeners = new Map();
  const win = {
    addEventListener(name, callback) { listeners.set(name, callback); },
    removeEventListener(name, callback) { assert.equal(listeners.get(name), callback); listeners.delete(name); },
    setInterval(callback, delay) { assert.equal(delay, IDLE_POWER_CHECK_MS); interval = callback; return 1; },
    clearInterval(id) { assert.equal(id, 1); cleared = true; },
  };
  const React = { useState: () => [false, value => { saving = value; }], useRef: value => ({ current: value }), useEffect: callback => { cleanup = callback(); } };
  const hook = vm.runInNewContext(`${hookBody}\nuseIdlePowerSaver;`, { React, window: win, Date: { now: () => time }, shouldSaveIdlePower, IDLE_POWER_CHECK_MS });
  hook({ nativeApi, enabled, gameRunning, blocked });
  return { get saving() { return saving; }, get listeners() { return listeners.size; }, get cleared() { return cleared; },
    time: value => { time = value; }, tick: () => interval?.(), activity: (type, isTrusted = true) => listeners.get(type)?.({ type, isTrusted }), dispose: () => cleanup?.() };
}
const fixture = harness();
await Promise.resolve(); await Promise.resolve();
fixture.time(start + IDLE_POWER_DELAY_MS - 1); await fixture.tick(); assert.equal(fixture.saving, false);
fixture.time(start + IDLE_POWER_DELAY_MS); await fixture.tick(); assert.equal(fixture.saving, true);
fixture.activity('pointermove', false); assert.equal(fixture.saving, true, 'synthetic layout/animation events do not wake the app');
fixture.activity('neolib:controller-activity', false); assert.equal(fixture.saving, false);
await fixture.tick(); assert.equal(fixture.saving, false);
fixture.time(start + 2 * IDLE_POWER_DELAY_MS); await fixture.tick(); assert.equal(fixture.saving, true);
fixture.activity('wheel'); assert.equal(fixture.saving, false);
fixture.dispose(); assert.equal(fixture.listeners, 0); assert.equal(fixture.cleared, true);
for (const config of [{ enabled: false }, { gameRunning: true }, { blocked: true }]) {
  let reads = 0;
  const off = harness({ ...config, nativeApi: { readSystemIdleSeconds() { reads++; return 900; } } });
  assert.equal(reads, 0); assert.equal(off.listeners, 0); assert.equal(off.saving, false);
}
let finish;
const late = harness({ nativeApi: { readSystemIdleSeconds: () => new Promise(resolve => { finish = resolve; }) } });
late.time(start + IDLE_POWER_DELAY_MS); late.dispose(); finish(900);
await Promise.resolve(); await Promise.resolve(); assert.equal(late.saving, false, 'disposed native replies cannot change idle state');
const fallback = harness({ nativeApi: { async readSystemIdleSeconds() { throw new Error('unavailable'); } } });
await Promise.resolve(); await Promise.resolve(); fallback.time(start + IDLE_POWER_DELAY_MS); await fallback.tick(); assert.equal(fallback.saving, true); fallback.dispose();

const require = createRequire(import.meta.url);
const { registerSystemIpc } = require('../electron/ipc/system-ipc.cjs');
let idle = 900;
const handlers = {};
registerSystemIpc({ registerIpc: (name, handler) => { handlers[name] = handler; }, systemHealth: { read() { return {}; } }, readSystemIdleSeconds() { if (idle instanceof Error) throw idle; return idle; } });
assert.equal(await handlers['system:idleSeconds'](), 900);
for (const invalid of [-1, Infinity, 1.5, '900', {}, new Error('native unavailable')]) { idle = invalid; assert.equal(await handlers['system:idleSeconds'](), null); }
idle = 0; assert.equal(await handlers['system:idleSeconds'](), 0);
const app = source('../src/App.jsx');
assert.match(app, /const visualRestActive = gameRestActive \|\| idlePowerSaving/);
assert.match(app, /<BgAmbience[^\n]+resting=\{visualRestActive\}/);
assert.match(app, /<HomeHub[^\n]+resting=\{visualRestActive\}/);
assert.match(app, /<FungistMascot[\s\S]+?resting=\{gameRestActive\}/);
assert.match(app, /newsPaused=\{gameRestActive \|\| lounge.active\}/);
assert.match(app, /setSoundPack\(gameRestActive \|\| settings.soundsEnabled/);
assert.match(app, /window.setInterval\(check, 60 \* 60 \* 1000\)/);
assert.match(source('../src/components/controller/ControllerNavigationBridge.jsx'), /new Event\('neolib:controller-activity'\)/);
assert.match(source('../src/components/modules/ModuleWindowApp.jsx'), /idlePowerSaving=\{idlePowerSaving\}/);
assert.match(source('../src/components/lounge/NeoLounge.jsx'), /const fxEnabled = !resting && !idlePowerSaving/);
assert.match(source('../src/components/lounge/NeoLounge.jsx'), /soundsEnabled && !resting && !idlePowerSaving/);
assert.match(source('../electron/main.js'), /readSystemIdleSeconds: \(\) => powerMonitor.getSystemIdleTime\(\)/);
assert.match(source('../src/components/SettingsModal.jsx'), /opt-idle-power-saver/);
assert.doesNotMatch(hookSource, /localStorage|sessionStorage|event\.key|clientX|clientY/);
console.log('PASS: 15-minute idle boundary, actual/controller input wake, native-idle fallback and cleanup, no polling during hard Rest/gameplay, bounded aggregate native IPC, separate FX/mascot/news/voice gates, hourly release checks and detached Lounge wiring. Live acceptance and power measurements remain separate.');
