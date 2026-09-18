import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { launcherEntry, boundedLauncherScan } from '../src/lib/launcherImport.mjs';
import { createBoundedOperation } from '../src/services/bounded-operation.mjs';
import { OPERATION_STATUS } from '../src/state/operation-state.mjs';
import { assignLauncherCategory, ensureLauncherCategory } from '../src/state/launcher-category-state.mjs';
import { pickDetectedLauncher } from '../src/services/launcher-detection-workflow.mjs';
const read = file => fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const wizard = read('src/components/WizardModal.jsx');
const app = read('src/App.jsx');
const importSource = wizard.slice(wizard.indexOf('  const importLauncherItems'), wizard.indexOf('  const scanLauncherForImport'));
assert(!importSource.includes('fetchMetadata'), 'imports must not wait on metadata');
assert(!importSource.includes('cacheImage'), 'imports must not wait on image downloads');
assert(wizard.includes('renderForegroundPortal(<AnimatePresence>') && wizard.includes("from './ui/VisualBoundary'"), 'confirmation shares the central top-level display plane');
assert(wizard.includes('open={open && !launcherConfirm}'), 'wizard cannot cover confirmation');
assert(wizard.includes('if (run !== launcherRun.current) return;'), 'late scan results ignored');
assert(wizard.includes('Cancel scan'), 'scan can be cancelled');
await assert.rejects(boundedLauncherScan(() => new Promise(() => {}), 5), /timed out/);
await assert.rejects(boundedLauncherScan(() => Promise.reject(Error('offline')), 5), /offline/);
assert.deepEqual(await boundedLauncherScan(() => ({ ok: true, items: [] }), 5), { ok: true, items: [] });

let library = { categories: [], games: [{ id: 'existing', name: 'Existing game', categoryIds: [] }] };
let id = 0;
const addSource = app.slice(app.indexOf('  const addToGames ='), app.indexOf('  const updateGame ='));
const add = new Function('uid', 'withGenreProfile', 'setLibrary', 'notify', 'fireConfetti', 'assignLauncherCategory', 'ensureLauncherCategory', addSource + ';return addToGames;')(
  () => String(++id), data => data, update => { library = update(library); }, () => {}, () => {}, assignLauncherCategory, ensureLauncherCategory);
for (const kind of ['steam', 'epic', 'ea', 'gog', 'ubisoft', 'battlenet', 'riot', 'xbox', 'rockstar', 'itch']) {
  const known = new Set(); const operation = { current: false }; let busy = false;
  const run = new Function('launcherEntry', 'launcherOperation', 'launcherBoundedOperation', 'launcherLabelFor', 'isKnownLauncherItem', 'rememberLauncherItem', 'onAccept', 'setLauncherConfirm', 'setLauncherImportBusy', 'setLauncherStatus', 'createBoundedOperation', 'OPERATION_STATUS', 'operationFailureMessage', importSource + ';return importLauncherItems;')(
    launcherEntry, operation, { current: null }, x => x, x => known.has(x.name), x => known.add(x.name), add, () => {}, x => { busy = x; }, () => {}, createBoundedOperation, OPERATION_STATUS, (state, label) => `${label} ${state.status}`);
  const item = { name: kind + ' game', appid: kind === 'steam' ? 123 : 'NON_STEAM_ID', launchExe: 'C:/Games/' + kind + '/game.exe' };
  await run(kind, [item, item]);
  await run(kind, [item]);
  assert.equal(library.games.filter(g => g.name === item.name).length, 1, 'no duplicate ' + kind);
  assert.equal(library.categories.filter(c => c.id === '__launcher_' + kind + '__').length, 1, 'category created ' + kind);
  const saved = library.games.find(g => g.name === item.name);
  assert(saved.categoryIds.includes('__launcher_' + kind + '__'));
  assert.equal(saved.appid, kind === 'steam' ? 123 : undefined, 'no cross-launcher Steam ID');
  assert.equal(busy, false); assert.equal(operation.current, false);
}
assert(library.games.some(g => g.id === 'existing'), 'preserve old games');
const detectionNow = 2_000_000_000_000;
assert.equal(pickDetectedLauncher({ steam: true }, { games: [] , now: detectionNow }), 'steam');
assert.equal(pickDetectedLauncher({ steam: true }, { games: [{ launcher: 'steam' }], now: detectionNow }), null, 'known launcher never silently re-imports');
assert.equal(pickDetectedLauncher({ epic: true }, { dismissed: { epic: true }, now: detectionNow }), null);
assert.equal(pickDetectedLauncher({ ea: true }, { askLater: { ea: detectionNow - 1000 }, now: detectionNow }), null);
assert.equal(pickDetectedLauncher({ ea: true }, { askLater: { ea: detectionNow - 25 * 60 * 60 * 1000 }, now: detectionNow }), 'ea');
assert(!app.includes('const silentImport ='), 'dead automatic launcher import path must not return');
assert(!app.includes('launcherAutoImport'), 'retired automatic launcher-import setting must not control detection');
const require = createRequire(import.meta.url);
const babel = createRequire(require.resolve('@vitejs/plugin-react'))('@babel/core');
babel.parseSync(wizard, { configFile: false, babelrc: false, parserOpts: { plugins: ['jsx'] } });
console.log('PASS: actual Wizard import and App category creation for ten launchers, duplicate handling, existing game preservation, ID isolation, timeout/rejection recovery, detection-only polling, portal/cancellation source guards and JSX parsing. No real library writes or games launched.');
