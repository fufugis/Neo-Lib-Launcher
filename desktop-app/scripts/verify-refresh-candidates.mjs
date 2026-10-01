import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fieldCandidates, selectedRefreshPatch, createRefreshSearch } from '../src/lib/refreshCandidates.mjs';

const image = n => `https://example.test/image-${n}.png`;
const record = { name: 'Example', source: 'steam', icon: image(1), capsuleImage: image(1), headerImage: image(2), background: image(3), screenshots: [image(4), image(4), image(5)], about: 'Full description', shortDescription: 'Short description' };
assert.equal(fieldCandidates(record, 'icon').length, 2, 'deduplicate images');
assert.equal(fieldCandidates({ icon: 'javascript:alert(1)' }, 'icon').length, 0, 'reject unsafe image protocols');
assert.equal(fieldCandidates({ name: 'Wide', capsuleImage: 'https://example.test/banner_1200x400.jpg' }, 'cover').length, 0, 'known landscape results never become portrait cover candidates');
assert.equal(fieldCandidates({ name: 'Missing', headerImage: image(99) }, 'cover').length, 0, 'hero banners never become portrait cover candidates');
const coverPatch = selectedRefreshPatch('cover', fieldCandidates({ name: 'Example', source: 'steamgriddb', portraitImage: image(24) }, 'cover'), { artworkLocks: {}, artworkRevisions: [] });
assert.equal(coverPatch.coverUrl, image(24));
assert.equal(coverPatch.portraitImage, image(24));
assert.equal(coverPatch.artworkSources.cover, 'steamgriddb');
assert.deepEqual(selectedRefreshPatch('icon', fieldCandidates(record, 'icon').slice(1)), { icon: image(2) });
assert.deepEqual(selectedRefreshPatch('banner', fieldCandidates(record, 'banner').slice(0, 1)), { headerImage: image(3), background: image(3) });
assert.deepEqual(selectedRefreshPatch('screenshots', fieldCandidates(record, 'screenshots')), { screenshots: [image(4), image(5)] });
assert.deepEqual(selectedRefreshPatch('description', fieldCandidates(record, 'description')), { about: 'Full description', shortDescription: 'Short description' });
assert.deepEqual(selectedRefreshPatch('icon', []), {}, 'nothing selected means no patch');
const malicious = { ...record, id: 'other', appid: 1, exePath: 'bad.exe', launchArgs: '--run', categoryId: 'private', romPath: 'bad.rom', retroPlatform: 'wrong', name: 'Other game', screenshots: [] };
const full = selectedRefreshPatch('all-locked', fieldCandidates(malicious, 'all-locked'));
for (const key of ['id', 'appid', 'exePath', 'launchArgs', 'categoryId', 'romPath', 'retroPlatform', 'name', 'screenshots']) assert.equal(key in full, false, `preserve ${key}`);
const retroPatch = selectedRefreshPatch('all-locked', fieldCandidates({ source: 'web', name: 'Mario World', headerImage: image(8), about: 'A platform game' }, 'all-locked'), { source: 'emulation' });
assert.equal(retroPatch.headerImage, image(8));
assert.equal(retroPatch.coverUrl, undefined, 'wide hero artwork must not masquerade as a ROM case cover');
const artworkGame = { icon: image(20), portraitImage: image(21), headerImage: image(22), artworkLocks: { hero: true }, artworkSources: { hero: 'Player' }, artworkRevisions: [] };
const artwork = selectedRefreshPatch('artwork', fieldCandidates({ ...record, portraitImage: image(6), logoImage: image(7) }, 'artwork'), artworkGame);
assert.equal(artwork.portraitImage, image(6));
assert.equal(artwork.headerImage, undefined, 'protected hero remains untouched');
assert.equal(artwork.logoImage, image(7));
assert.equal(artwork.artworkRevisions.length, 1, 'previous artwork remains restorable');

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

const retroQueries = [];
const retroSearch = createRefreshSearch({
  fetchMetadata: async ({ query }) => { retroQueries.push(query); return null; },
  listCandidates: async ({ query }) => { retroQueries.push(query); return { candidates: [] }; },
}, { name: 'Mario World', metadataQuery: 'Mario World SNES', launcher: 'emulator', source: 'emulation' }, 'all-locked');
await retroSearch.next(5);
assert(retroQueries.length > 0 && retroQueries.every(query => query === 'Mario World SNES'), 'Retro review searches with the selected console');

const searchedSources = [];
const coverSearch = createRefreshSearch({
  fetchMetadata: async () => null,
  listCandidates: async ({ source }) => { searchedSources.push(source); return { candidates: [] }; },
  expandCandidate: async () => null,
}, { name: 'Example' }, 'cover', { steamGridDbKey: 'configured-key' });
await coverSearch.next(5);
assert.ok(searchedSources.includes('steamgriddb'), 'cover repair includes reviewed portrait recommendations when a SteamGridDB key is configured');

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
for (const relative of ['src/App.jsx', 'src/components/RefreshCandidatesModal.jsx', 'src/components/TidyUpModal.jsx', 'src/components/WizardModal.jsx', 'src/components/app/AppModalLayer.jsx', 'src/components/ChangelogModal.jsx', 'src/components/library/CollectionActions.jsx']) {
  babel.parseSync(fs.readFileSync(new URL(`../${relative}`, import.meta.url), 'utf8'), { configFile: false, babelrc: false, parserOpts: { plugins: ['jsx'] } });
}
const app = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const surgical = app.slice(app.indexOf('const handleTroubleshoot'), app.indexOf('/* --- Collapsed state'));
assert.ok(surgical.includes('setRefreshReview'));
assert.ok(!surgical.includes('updateGame('), 'field refresh cannot save before review');
const workflow = fs.readFileSync(new URL('../src/services/metadata-workflow.mjs', import.meta.url), 'utf8');
const bulk = workflow.slice(workflow.indexOf('const refetchAll'), workflow.indexOf('return {', workflow.indexOf('const refetchAll')));
assert.ok(bulk.includes('setTidyReviewMode')); assert.ok(bulk.includes('setTidyOpen(true)')); assert.ok(!bulk.includes('autoApply: true'), 'bulk refresh opens the scrollable list and cannot auto-apply');
console.log('PASS: field patches, safe identity, cover-only results, SteamGridDB suggestions, five-result paging, source exhaustion, Blizzard ID, cancellation, source errors, JSX parsing and scrollable bulk review routing. No network or real library writes.');
