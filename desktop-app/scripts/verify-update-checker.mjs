import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { checkForUpdates } from '../src/lib/updateChecker.js';

const original = { fetch: globalThis.fetch, localStorage: globalThis.localStorage, now: Date.now, setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout };
const values = new Map();
let calls = 0, now = 2000000000000;
let data = { tag_name: 'v1.8.6', html_url: 'https://evil.test/download', draft: false, prerelease: false, assets: [{ name: 'NEO-LIB-Setup.exe', browser_download_url: 'https://github.com/fufugis/Neo-Lib-Launcher/releases/download/v1.8.6/NEO-LIB-Setup.exe', size: 100 }] };
try {
  globalThis.localStorage = { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value) };
  Date.now = () => now;
  globalThis.fetch = async (url, options) => {
    calls++; assert.equal(url, 'https://api.github.com/repos/fufugis/Neo-Lib-Launcher/releases/latest');
    assert.equal(options.credentials, 'omit'); assert.equal(options.cache, 'no-store'); assert(options.signal);
    return { ok: true, json: async () => data };
  };
  const newer = await checkForUpdates('1.8.5');
  assert(newer.available); assert.equal(newer.latestVersion, '1.8.6');
  assert.equal(newer.downloadUrl, data.assets[0].browser_download_url);
  assert.equal(newer.releaseUrl, 'https://github.com/fufugis/Neo-Lib-Launcher/releases/tag/v1.8.6', 'ignore arbitrary API html_url');
  assert.deepEqual(await checkForUpdates('1.8.5'), newer); assert.equal(calls, 1);
  assert.equal((await checkForUpdates('1.8.6')).available, false); assert.equal(calls, 2, 'changed installed version invalidates cache');
  await checkForUpdates('1.8.6', { force: true }); assert.equal(calls, 3, 'manual check bypasses cache');
  now += 3600001; await checkForUpdates('1.8.6'); assert.equal(calls, 4, 'hour-old cache checks GitHub again');
  values.set('neolib:updateCheck', JSON.stringify({ ts: now + 999999, currentVersion: '1.8.5', result: newer }));
  await checkForUpdates('1.8.5'); assert.equal(calls, 5, 'future timestamps cannot disable checks');
  const cached = JSON.parse(values.get('neolib:updateCheck'));
  cached.result.available = false; cached.result.releaseUrl = 'https://evil.test/'; cached.result.downloadUrl = 'https://evil.test/Setup.exe';
  values.set('neolib:updateCheck', JSON.stringify(cached));
  const repaired = await checkForUpdates('1.8.5'); assert(repaired.available); assert.equal(repaired.downloadUrl, ''); assert(!repaired.releaseUrl.includes('evil'));
  values.clear(); data = { tag_name: 'v1.9.0', assets: [] };
  assert.equal((await checkForUpdates('1.8.6')).downloadUrl, '', 'missing installer uses release-page fallback');
  for (const invalid of [{ tag_name: 'v1.9.0', draft: true }, { tag_name: 'v1.9.0', prerelease: true }, { tag_name: 'v1.9.0-beta' }, {}, null]) {
    data = invalid; assert.equal((await checkForUpdates('1.8.6', { force: true })).error, true, 'draft/prerelease/malformed data is not a stable update');
  }
  globalThis.fetch = async () => ({ ok: false, status: 403 });
  assert.equal((await checkForUpdates('1.8.6', { force: true })).error, true, 'rate limit is an error, not up to date');
  let abortCallback, cleared = false;
  globalThis.setTimeout = (callback, delay) => { assert.equal(delay, 10000); abortCallback = callback; return 77; };
  globalThis.clearTimeout = id => { assert.equal(id, 77); cleared = true; };
  globalThis.fetch = (_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener('abort', () => reject(new Error('aborted')));
    queueMicrotask(() => abortCallback());
  });
  assert.equal((await checkForUpdates('1.8.6', { force: true })).error, true);
  assert(cleared, 'network timeout always clears its timer');
} finally {
  globalThis.fetch = original.fetch; Date.now = original.now;
  globalThis.setTimeout = original.setTimeout; globalThis.clearTimeout = original.clearTimeout;
  if (original.localStorage === undefined) delete globalThis.localStorage; else globalThis.localStorage = original.localStorage;
}
const read = file => fs.readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8');
const prompt = read('components/AppUpdatePrompt.jsx'), app = read('App.jsx');
for (const text of ['New update available', 'Download update', 'DISMISSED_KEY', 'requested || dismissed !== info.latestVersion', 'document.hidden', 'new MutationObserver', 'observer.disconnect()', 'data-controller-close', 'neolib:show-app-update', 'role="dialog"', 'Nothing installs automatically', "event.key !== 'Tab'"]) assert(prompt.includes(text));
assert(!prompt.includes('fungistEnabled'), 'release popup does not depend on mascot');
assert(app.includes("paused={gameRestActive || lounge.active || firstRunPhase !== 'ready'}"));
assert(app.includes('if (!info.error) setUpdateInfo(info);'), 'manual network failure preserves previous update');
assert(app.includes('window.setInterval(check, 60 * 60 * 1000)'));
const require = createRequire(import.meta.url), babel = createRequire(require.resolve('@vitejs/plugin-react'))('@babel/core');
babel.parseSync(prompt, { configFile: false, babelrc: false, parserOpts: { plugins: ['jsx'] } });
console.log('PASS: GitHub stable version/installer lookup, cache/current-version/force/hourly behavior, trusted URLs, draft/malformed/rate-limit/timeout failures, standalone deferred popup and download wiring. Live popup/installer acceptance pending.');
