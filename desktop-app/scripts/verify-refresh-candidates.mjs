import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fieldCandidates, selectedRefreshPatch, createRefreshSearch } from '../src/lib/refreshCandidates.mjs';

const image = n => `https://example.test/image-${n}.png`;
const record = { name: 'Example', source: 'steam', icon: image(1), capsuleImage: image(1), headerImage: image(2), background: image(3), screenshots: [image(4), image(4), image(5)], about: 'Full description', shortDescription: 'Short description' };
assert.equal(fieldCandidates(record, 'icon').length, 2, 'deduplicate images');
assert.equal(fieldCandidates({ icon: 'javascript:alert(1)' }, 'icon').length, 0, 'reject unsafe image protocols');
assert.deepEqual(selectedRefreshPatch('icon', fieldCandidates(record, 'icon').slice(1)), { icon: image(2), coverUrl: image(2) });
assert.deepEqual(selectedRefreshPatch('banner', fieldCandidates(record, 'banner').slice(0, 1)), { headerImage: image(3), background: image(3) });
assert.deepEqual(selectedRefreshPatch('screenshots', fieldCandidates(record, 'screenshots')), { screenshots: [image(4), image(5)] });
assert.deepEqual(selectedRefreshPatch('description', fieldCandidates(record, 'description')), { about: 'Full description', shortDescription: 'Short description' });
assert.deepEqual(selectedRefreshPatch('icon', []), {}, 'nothing selected means no patch');
const malicious = { ...record, id: 'other', appid: 1, exePath: 'bad.exe', launchArgs: '--run', categoryId: 'private', name: 'Other game', screenshots: [] };
const full = selectedRefreshPatch('all-locked', fieldCandidates(malicious, 'all-locked'));
for (const key of ['id', 'appid', 'exePath', 'launchArgs', 'categoryId', 'name', 'screenshots']) assert.equal(key in full, false, `preserve ${key}`);

const calls = [];
const api = {
  fetchMetadata: async options => { calls.push(['initial', options]); return record; },
  listCandidates: async ({ source }) => { calls.push(['list', source]); return { candidates: Array.from({ length: 7 }, (_, id) => ({ id, source })) }; },
  expandCandidate: async ({ candidate }) => ({ source: candidate.source, name: `Edition ${candidate.id}`, icon: image(10 + candidate.id) }),
};
const search = createRefreshSearch(api, { name: 'Example', launcher: 'battlenet', launcherProductId: 'wow', appid: 99 }, 'icon');
let result = await search.next(5);
assert.equal(result.candidates.length, 5);
assert.equal(result.more, true);
assert.equal(calls[0][1].launcherProductId, 'wow');
assert.equal(calls[0][1].lockedAppid, null, 'Blizzard identity takes priority over stale Steam ID');
result = await search.next(10);
assert.ok(result.candidates.length > 5, 'Show more adds candidates');
for (let i = 0; i < 10 && result.more; i++) result = await search.next(100);
assert.equal(result.more, false, 'finite sources eventually report exhaustion');
assert.equal(new Set(result.candidates.map(c => c.key)).size, result.candidates.length);

let cancelled = false, release, moreCalls = 0;
const cancellation = createRefreshSearch({ fetchMetadata: () => new Promise(resolve => { release = resolve; }), listCandidates: async () => { moreCalls++; return {}; } }, { name: 'Test' }, 'icon');
const running = cancellation.next(5, () => cancelled);
await Promise.resolve(); cancelled = true; release(null); await running;
assert.equal(moreCalls, 0, 'cancel prevents further source requests');
const failing = createRefreshSearch({ fetchMetadata: async () => { throw Error('offline'); }, listCandidates: async () => ({ candidates: [], error: 'offline' }) }, { name: 'Test' }, 'banner');
const empty = await failing.next(5);
assert.equal(empty.candidates.length, 0); assert.equal(empty.more, false); assert.ok(empty.failures.length);

const require = createRequire(import.meta.url);
const babel = createRequire(require.resolve('@vitejs/plugin-react'))('@babel/core');
for (const relative of ['src/App.jsx', 'src/components/RefreshCandidatesModal.jsx', 'src/components/ChangelogModal.jsx']) {
  babel.parseSync(fs.readFileSync(new URL(`../${relative}`, import.meta.url), 'utf8'), { configFile: false, babelrc: false, parserOpts: { plugins: ['jsx'] } });
}
const app = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const surgical = app.slice(app.indexOf('const handleTroubleshoot'), app.indexOf('/* --- Collapsed state'));
assert.ok(surgical.includes('setRefreshReview'));
assert.ok(!surgical.includes('updateGame('), 'field refresh cannot save before review');
const bulk = app.slice(app.indexOf('const refetchAll'), app.indexOf('// Keep ref in sync'));
assert.ok(bulk.includes('setRefreshReview')); assert.ok(!bulk.includes('autoApply: true'), 'bulk refresh cannot auto-apply');
console.log('PASS: field patches, safe identity, deduplication, five-result paging, source exhaustion, Blizzard ID, cancellation, source errors, JSX parsing and shared refresh routing. No network or real library writes.');
