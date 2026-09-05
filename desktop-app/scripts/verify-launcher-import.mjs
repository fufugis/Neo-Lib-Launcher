import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { launcherEntry, boundedLauncherScan } from '../src/lib/launcherImport.mjs';
const read = file => fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const wizard = read('src/components/WizardModal.jsx');
const app = read('src/App.jsx');
const importSource = wizard.slice(wizard.indexOf('  const importLauncherItems'), wizard.indexOf('  const scanLauncherForImport'));
assert(!importSource.includes('fetchMetadata'), 'imports must not wait on metadata');
assert(!importSource.includes('cacheImage'), 'imports must not wait on image downloads');
assert(wizard.includes('createPortal(<AnimatePresence>') && wizard.includes('</AnimatePresence>, document.body)'), 'confirmation shares top-level display plane');
assert(wizard.includes('open={open && !launcherConfirm}'), 'wizard cannot cover confirmation');
assert(wizard.includes('if (run !== launcherRun.current) return;'), 'late scan results ignored');
assert(wizard.includes('Cancel scan'), 'scan can be cancelled');
await assert.rejects(boundedLauncherScan(() => new Promise(() => {}), 5), /timed out/);
await assert.rejects(boundedLauncherScan(() => Promise.reject(Error('offline')), 5), /offline/);
assert.deepEqual(await boundedLauncherScan(() => ({ ok: true, items: [] }), 5), { ok: true, items: [] });

let library = { categories: [], games: [{ id: 'existing', name: 'Existing game', categoryIds: [] }] };
let id = 0;
const addSource = app.slice(app.indexOf('  const addToGames ='), app.indexOf('  const importMany ='));
const add = new Function('uid', 'withGenreProfile', 'setLibrary', 'notify', 'fireConfetti', addSource + ';return addToGames;')(
  () => String(++id), data => data, update => { library = update(library); }, () => {}, () => {});
for (const kind of ['steam', 'epic', 'ea', 'gog', 'ubisoft', 'battlenet', 'riot', 'xbox', 'rockstar', 'itch']) {
  const known = new Set(); const operation = { current: false }; let busy = false;
  const run = new Function('launcherEntry', 'launcherOperation', 'launcherLabelFor', 'isKnownLauncherItem', 'rememberLauncherItem', 'onAccept', 'setLauncherConfirm', 'setLauncherImportBusy', 'setLauncherStatus', importSource + ';return importLauncherItems;')(
    launcherEntry, operation, x => x, x => known.has(x.name), x => known.add(x.name), add, () => {}, x => { busy = x; }, () => {});
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
const require = createRequire(import.meta.url);
const babel = createRequire(require.resolve('@vitejs/plugin-react'))('@babel/core');
babel.parseSync(wizard, { configFile: false, babelrc: false, parserOpts: { plugins: ['jsx'] } });
console.log('PASS: actual Wizard import and App category creation for ten launchers, duplicate handling, existing game preservation, ID isolation, timeout/rejection recovery, portal/cancellation source guards and JSX parsing. No real library writes or games launched.');
