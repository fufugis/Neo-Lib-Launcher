import assert from 'node:assert/strict';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createAppStorage } from '../electron/storage/app-storage.cjs';
import { createDocumentStore } from '../electron/storage/document-store.cjs';
import { applyStorageMeasurements, installSizePatch, savedStorageSnapshot } from '../src/state/install-size-state.mjs';
import { hydrateLibrary } from '../src/state/library-state.mjs';
import { projectLoungeGames } from '../src/components/modules/module-model.mjs';

const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'neolib-size-persistence-'));
const store = () => createDocumentStore({ storage: createAppStorage({ app: { getPath: () => root }, fs, fsp, path }) });
const games = [{ id: 'a', name: 'One', exePath: 'C:\\Games\\One\\game.exe' }, { id: 'b', name: 'Two', exePath: 'C:\\Games\\Two\\game.exe' }];
const result = (game, bytes) => ({ id: game.id, exePath: game.exePath, root: path.win32.dirname(game.exePath), bytes, files: 123, modBytes: 1024, modFiles: 2, truncated: false });
try {
  let library = { games, tools: [{ id: 'a', name: 'Unrelated tool' }] };
  library = applyStorageMeasurements(library, { ok: true, scannedAt: 1000, results: games.map(game => result(game, 40 * 1024 ** 3)) });
  assert.equal(library.games[0].installSizeBytes, 40 * 1024 ** 3, 'Home bulk scan updates Library game facts');
  assert.equal(library.tools[0].installSizeBytes, undefined, 'Active workspace cannot redirect game measurements into tools');
  await store().saveLibrary(library);
  library = hydrateLibrary(await store().loadLibrary(), { now: 100_000_000_000 });
  assert.equal(savedStorageSnapshot(library.games).results.length, 2, 'A fresh document store restores Home results after restart without scanning');
  assert.equal(savedStorageSnapshot(library.games).results[0].root, 'C:\\Games\\One', 'Measured folder and file/mod statistics survive disk reload');
  assert.equal(library.games[0].installSizeMeasuredAt, 1000, 'Measurements do not expire with scanner cache or hydration age');
  const patch = installSizePatch(library.games[0], { ...result(games[0], 45 * 1024 ** 3), truncated: true }, 2000);
  library = { ...library, games: library.games.map(game => game.id === 'a' ? { ...game, ...patch, rating: 4 } : game) };
  await store().saveLibrary(library);
  library = await store().loadLibrary();
  const home = savedStorageSnapshot(library.games);
  assert.equal(home.results[0].bytes, 45 * 1024 ** 3, 'Individual Library scan is saved on disk and reflected in Home');
  assert.equal(home.results[0].truncated, true);
  assert.equal(library.games[0].rating, 4, 'Unrelated metadata updates preserve size');
  for (const scan of [{ ok: false, results: [result(games[0], 0)] }, { ok: true, results: [], skipped: [{ id: 'a' }] }, { ok: true, scannedAt: 500, results: [result(games[0], 1)] }, { ok: true, results: [{ ...result(games[0], 1), exePath: 'C:\\Changed\\game.exe' }] }]) {
    assert.equal(applyStorageMeasurements(library, scan), library, 'Failed, skipped, stale and changed-target scans keep saved sizes');
  }
  const partial = applyStorageMeasurements(library, { ok: true, scannedAt: 3000, results: [result(games[1], 7)], skipped: [{ id: 'a' }] });
  assert.equal(partial.games[0], library.games[0], 'Partial bulk scans retain the skipped game measurement');
  assert.equal(partial.games[1].installSizeBytes, 7);
  for (const bytes of [null, undefined, NaN, -1, Infinity, '12']) assert.equal(installSizePatch(games[0], result(games[0], bytes)), null);
  assert.equal(savedStorageSnapshot([{ ...games[0], installSizeBytes: null }]).results.length, 0, 'Null is not a measured zero-byte folder');
  assert.equal(installSizePatch(games[0], result(games[0], 0)).installSizeBytes, 0, 'A genuinely measured empty folder remains valid');
  assert.equal(savedStorageSnapshot(library.games.map(game => ({ ...game, homeLocked: true }))).results.length, 0, 'Private locked measurements are not exposed in Home');
  const projected = projectLoungeGames(library.games)[0];
  assert.equal(projected.installSizeMeasuredAt, 2000);
  assert.equal(projected.installSizeScan, undefined, 'Local scan paths stay out of module snapshots');
  const source = relative => fs.readFileSync(new URL(relative, import.meta.url), 'utf8');
  assert.match(source('../src/components/HomeHub.jsx'), /onStorageMeasured\?\.\(result\)/);
  assert.match(source('../src/components/HomeHub.jsx'), /\.\.\.savedStorageSnapshot\(games\)/);
  assert.doesNotMatch(source('../src/components/HomeHub.jsx'), /STORAGE_SESSION_CACHE/);
  assert.match(source('../src/App.jsx'), /onStorageMeasured=\{saveStorageMeasurements\}/);
  assert.match(source('../src/components/modules/useModuleCoreBridge.mjs'), /current.saveStorageMeasurements\?\.\(data\)/);
  console.log('PASS: Home and individual measurements persist through real disk save/reopen; shared views, partial/failure/stale protection and privacy verified.');
} finally {
  assert.equal(path.dirname(root), os.tmpdir());
  assert.ok(path.basename(root).startsWith('neolib-size-persistence-'));
  await fsp.rm(root, { recursive: true, force: true });
}
