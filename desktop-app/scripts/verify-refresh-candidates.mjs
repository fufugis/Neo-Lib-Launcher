import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fieldCandidates, selectedRefreshPatch, createRefreshSearch, matchesCoverTitle } from '../src/lib/refreshCandidates.mjs';

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
assert(matchesCoverTitle('TerraTech Legion', { name: 'TerraTech: Legion™' }), 'punctuation does not hide the exact game');
assert(!matchesCoverTitle('TerraTech Legion', { name: 'TerraTech Legion Demo' }), 'a demo is not the requested game');
assert(!matchesCoverTitle('TerraTech Legion', { name: 'TerraTech Legion Soundtrack' }), 'a soundtrack is not the requested game');
assert(!matchesCoverTitle('TerraTech Legion', { name: 'Rising Heat' }), 'unrelated titles are excluded');
assert(matchesCoverTitle('Local name', { source: 'steam', id: '77', name: 'Renamed store title' }, { appid: 77 }), 'a locked Steam app identity can retain a renamed title');
const reviewedIds = [];
const verifiedUrls = [];
const workingAlternate = 'https://example.test/working-portrait.png';
const reviewedCovers = createRefreshSearch({
  fetchMetadata: async () => ({ source: 'steam', name: 'TerraTech Legion', portraitImage: image(50) }),
  listCandidates: async ({ source }) => ({ candidates: source === 'steam' ? [
    { source, id: 1, name: 'TerraTech Legion Demo' },
    { source, id: 2, name: 'TerraTech Legion' },
    { source, id: 3, name: 'TerraTech Legion Soundtrack' },
  ] : source === 'gog' ? [{ source, id: 4, name: 'TerraTech Legion' }] : [] }),
  expandCandidate: async ({ candidate }) => { reviewedIds.push(candidate.id); return { source: candidate.source, name: candidate.name, portraitImage: image(candidate.id) }; },
}, { name: 'TerraTech Legion' }, 'cover', {}, async url => { verifiedUrls.push(url); return url === image(4) ? workingAlternate : false; });
const reviewed = await reviewedCovers.next(5);
assert.deepEqual(reviewedIds, [2, 4], 'only exact-title results reach artwork expansion');
assert.deepEqual(verifiedUrls, [image(50), image(2), image(4)], 'each distinct cover is verified before suggestion');
assert.deepEqual(reviewed.candidates.map(candidate => candidate.value), [workingAlternate], 'only a verified working portrait URL becomes selectable artwork');
assert.equal(selectedRefreshPatch('cover', reviewed.candidates, {}).coverUrl, workingAlternate, 'the verified URL, not the broken original, is saved');
assert(reviewed.failures.some(message => message.includes('cover images were skipped')), 'unavailable images are explained');

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
const wizard = fs.readFileSync(new URL('../src/components/WizardModal.jsx', import.meta.url), 'utf8');
const wizardScanButton = wizard.match(/data-testid="wizard-tidy-library-btn"[\s\S]*?<\/button>/)?.[0] || '';
assert.match(wizardScanButton, /onTidyLibrary/, 'cover audit opens from Wizard');
assert.doesNotMatch(wizardScanButton, /onClose\(/, 'opening cover audit must not close Wizard');
assert.match(wizard, /<Modal open=\{open && !suspended && !launcherConfirm\}/, 'Wizard stays mounted while the audit is in front');
const modalLayer = fs.readFileSync(new URL('../src/components/app/AppModalLayer.jsx', import.meta.url), 'utf8');
const auditWiring = modalLayer.slice(modalLayer.indexOf('<TidyUpModal'), modalLayer.indexOf('<PostPlayRatingModal'));
assert.match(modalLayer, /<WizardModal\s+open=\{showWizard\}\s+suspended=\{tidyOpen \|\| Boolean\(refreshReview\)\}/, 'Wizard hides during audit and cover picker without losing its open state');
assert.match(auditWiring, /open=\{tidyOpen\}\s+suspended=\{Boolean\(refreshReview\)\}/, 'audit stays open behind the cover picker');
for (const handler of ['onFixArtwork', 'onRefreshMetadata']) {
  const handoff = auditWiring.match(new RegExp(`${handler}=\\{\\(game\\) => \\{[^}]*setRefreshReview`))?.[0] || '';
  assert.ok(handoff, `${handler} opens a focused picker`);
  assert.doesNotMatch(handoff, /setTidyOpen\(false\)/, `${handler} must preserve the audit session`);
}
assert.match(modalLayer, /onClose=\{\(\) => setRefreshReview\(null\)\}/, 'cancelling one repair returns to the audit');
assert.match(modalLayer, /setRefreshReview\(review => review\.index \+ 1 < review\.games\.length \? \{ \.\.\.review, index: review\.index \+ 1 \} : null\)/, 'applying one repair returns to the audit');
const audit = fs.readFileSync(new URL('../src/components/TidyUpModal.jsx', import.meta.url), 'utf8');
assert.match(audit, /className=\{`fixed inset-0 z-\[220\][^`]*\$\{suspended \? 'invisible pointer-events-none'/, 'audit is hidden, not unmounted, during a focused repair');
const picker = fs.readFileSync(new URL('../src/components/RefreshCandidatesModal.jsx', import.meta.url), 'utf8');
assert.match(picker, /createRefreshSearch\(window\.api, game, field, options, verifySuggestedPortrait\)/, 'picker verifies each cover image before listing it');
assert.match(picker, /recoverPortraitImage\(url, record, verifyPortraitImage\)/, 'Steam cover alternatives retain dimension verification');
assert.match(picker, /onError=\{\(\) => setFailedImages\(old => new Set\(\[\.\.\.old, item\.key\]\)\)\}/, 'late image failures cannot be applied');
assert.match(picker, /const valid = await verifyPortraitImage\(manualCover\.value\)/, 'pasted artwork is checked before it can be selected');
assert.match(picker, /setSelected\(\[manualCover\.key\]\)/, 'only a verified pasted cover becomes selectable');
const { coverImageRecoveryUrls, recoverPortraitImage } = await import('../src/lib/cover-image-recovery.mjs');
const oldSteamCover = 'https://cdn.cloudflare.steamstatic.com/steam/apps/3596700/library_600x900.jpg';
const pngCover = 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/3596700/library_600x900.png';
assert(coverImageRecoveryUrls(oldSteamCover).includes(pngCover));
assert.equal(await recoverPortraitImage(oldSteamCover, {}, async url => url === pngCover), pngCover, 'working PNG survives unavailable JPEG URLs');
assert.equal(await recoverPortraitImage(oldSteamCover, {}, async () => false), '', 'unverified alternatives are never offered');
assert.deepEqual(coverImageRecoveryUrls('https://example.test/image.jpg'), ['https://example.test/image.jpg'], 'unrelated URLs do not generate Steam guesses');
assert.equal(await recoverPortraitImage(oldSteamCover, { capsuleImage: image(88) }, async url => url === image(88)), image(88), 'a genuinely portrait-shaped provider capsule can recover a failed preferred URL');
let gridKeyReceived = false;
const gridSearch = createRefreshSearch({
  fetchMetadata: async () => null,
  listCandidates: async ({source, steamGridDbKey}) => {
    if (source !== 'steamgriddb') return {candidates: []};
    assert.equal(steamGridDbKey, 'fixture-key'); gridKeyReceived = true;
    return {candidates: [{source: 'steamgriddb', name: 'TerraTech Legion', id: 'grid', portraitImage: image(90)}]};
  },
  expandCandidate: async ({candidate}) => candidate,
}, {name: 'TerraTech Legion'}, 'cover', {steamGridDbKey: 'fixture-key'}, async () => true);
assert.equal((await gridSearch.next(5)).candidates.length, 1);
assert(gridKeyReceived, 'configured artwork key reaches its source only');
console.log('PASS: reviewed cover selection, matching titles, PNG/CDN/capsule recovery, SteamGridDB key forwarding, paging, source errors and repeatable Wizard repair. No network or real library writes.');
