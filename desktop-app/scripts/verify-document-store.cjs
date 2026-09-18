const assert = require('node:assert/strict');
const path = require('node:path');
const { createAppStorage } = require('../electron/storage/app-storage.cjs');
const { SCHEMA_KEY, CURRENT_SCHEMA_VERSION, createDocumentStore } = require('../electron/storage/document-store.cjs');

const appData = 'C:\\Virtual\\NeoLib';
const key = file => path.win32.resolve(String(file)).toLowerCase();

function harness(seed = {}, faults = {}) {
  const files = new Map(Object.entries(seed).map(([file, value]) => [key(file), String(value)]));
  const trace = [];
  const missing = file => Object.assign(new Error(`ENOENT: ${file}`), { code: 'ENOENT' });
  const fsp = {
    async mkdir(file, options) { trace.push(['mkdir', file, options]); },
    async readFile(file, encoding) {
      trace.push(['read', file, encoding]);
      if (!files.has(key(file))) throw missing(file);
      return files.get(key(file));
    },
    async writeFile(file, value, encoding) {
      trace.push(['write', file, String(value), encoding]);
      if (faults.write) throw new Error('simulated write failure');
      files.set(key(file), String(value));
    },
    async rename(from, to) {
      trace.push(['rename', from, to]);
      if (faults.rename) throw new Error('simulated rename failure');
      if (!files.has(key(from))) throw missing(from);
      files.set(key(to), files.get(key(from)));
      files.delete(key(from));
    },
    async copyFile(from, to) {
      trace.push(['copy', from, to]);
      if (faults.copy) throw new Error('simulated copy failure');
      if (!files.has(key(from))) throw missing(from);
      files.set(key(to), files.get(key(from)));
    },
  };
  const fs = { readFileSync() { throw new Error('sync access not expected'); }, writeFileSync() { throw new Error('sync access not expected'); }, appendFileSync() { throw new Error('sync access not expected'); } };
  const app = { getPath(name) { assert.equal(name, 'userData'); return appData; } };
  const storage = createAppStorage({ app, path: path.win32, fs, fsp });
  return { files, trace, storage, documents: createDocumentStore({ storage }) };
}

const libraryPath = path.win32.join(appData, 'library.json');
const settingsPath = path.win32.join(appData, 'settings.json');
const playtimePath = path.win32.join(appData, 'playtime-history.json');

(async () => {
  // Legacy data migrates in place only after an exact rollback copy is made.
  const legacyLibrary = {
    games: [{ id: 'g1', name: 'Private Game', categoryIds: ['secret'], customFutureField: { keep: true } }],
    categories: [{ id: 'secret', private: true, pin: '1234', color: '#abc' }],
    gameOrderByCategory: { secret: ['g1'] },
    unknownTopLevel: { mustSurvive: true },
  };
  const migrated = harness({ [libraryPath]: JSON.stringify(legacyLibrary) });
  const loadedLibrary = await migrated.documents.loadLibrary();
  assert.equal(loadedLibrary[SCHEMA_KEY], CURRENT_SCHEMA_VERSION);
  assert.deepEqual(loadedLibrary.games, legacyLibrary.games);
  assert.deepEqual(loadedLibrary.categories, legacyLibrary.categories);
  assert.deepEqual(loadedLibrary.unknownTopLevel, legacyLibrary.unknownTopLevel);
  assert.deepEqual(JSON.parse(migrated.files.get(key(libraryPath + '.bak'))), legacyLibrary, 'pre-migration backup is exact');
  assert.equal(JSON.parse(migrated.files.get(key(libraryPath)))[SCHEMA_KEY], CURRENT_SCHEMA_VERSION);
  assert.equal(migrated.documents.getDiagnostics().library.state, 'migrated');
  const copyIndex = migrated.trace.findIndex(entry => entry[0] === 'copy');
  const writeIndex = migrated.trace.findIndex(entry => entry[0] === 'write');
  assert(copyIndex >= 0 && writeIndex > copyIndex, 'backup precedes migration write');

  // A damaged primary recovers in memory from last-known-good without erasing evidence.
  const backupLibrary = { games: [{ id: 'safe', name: 'Recovered' }], [SCHEMA_KEY]: 1 };
  const recovery = harness({ [libraryPath]: '{broken', [libraryPath + '.bak']: JSON.stringify(backupLibrary) });
  assert.deepEqual(await recovery.documents.loadLibrary(), backupLibrary);
  assert.equal(recovery.files.get(key(libraryPath)), '{broken', 'load does not overwrite corrupt evidence');
  assert.equal(recovery.documents.getDiagnostics().library.state, 'recovered-backup');

  // Invalid/future documents fail closed and are never rewritten or downgraded.
  const invalid = harness({ [libraryPath]: JSON.stringify({ games: [] }) });
  const beforeInvalid = invalid.files.get(key(libraryPath));
  await assert.rejects(invalid.documents.saveLibrary({ games: 'not-an-array' }), /Invalid library/);
  assert.equal(invalid.files.get(key(libraryPath)), beforeInvalid);
  const futureValue = { games: [], [SCHEMA_KEY]: 99 };
  const future = harness({ [libraryPath]: JSON.stringify(futureValue) });
  assert.deepEqual(await future.documents.loadLibrary(), { games: [] });
  assert.deepEqual(JSON.parse(future.files.get(key(libraryPath))), futureValue, 'newer schema remains untouched');
  await assert.rejects(future.documents.saveLibrary({ games: [] }), /Refusing to overwrite/);
  assert.deepEqual(JSON.parse(future.files.get(key(libraryPath))), futureValue, 'autosave cannot downgrade a newer schema');

  // Writes are serialized. The latest save wins and the prior good value is rollback data.
  const queued = harness();
  const firstSave = queued.documents.saveSettings({ theme: 'first', custom: { keep: 1 } });
  const secondSave = queued.documents.saveSettings({ theme: 'second', custom: { keep: 2 } });
  await Promise.all([firstSave, secondSave]);
  assert.equal(JSON.parse(queued.files.get(key(settingsPath))).theme, 'second');
  assert.equal(JSON.parse(queued.files.get(key(settingsPath + '.bak'))).theme, 'first');
  assert.equal(JSON.parse(queued.files.get(key(settingsPath))).custom.keep, 2);

  // Native window updates merge against the latest queued settings save.
  await queued.documents.patchSettings({ windowBounds: { width: 1200, height: 800, x: 10, y: 20 } });
  const patchedSettings = JSON.parse(queued.files.get(key(settingsPath)));
  assert.equal(patchedSettings.theme, 'second');
  assert.equal(patchedSettings.custom.keep, 2);
  assert.deepEqual(patchedSettings.windowBounds, { width: 1200, height: 800, x: 10, y: 20 });

  // Early synchronous app/tray reads validate and can use the known-good backup.
  // Build a settings-specific recovery fixture because library and settings have different validators.
  const syncSettings = harness({ [settingsPath]: '[]', [settingsPath + '.bak']: JSON.stringify({ theme: 'magical', minimizeToTray: true, [SCHEMA_KEY]: 1 }) });
  syncSettings.storage.parseJsonSync = file => JSON.parse(syncSettings.files.get(key(file)));
  const syncDocuments = createDocumentStore({ storage: syncSettings.storage });
  assert.equal(syncDocuments.loadSettingsSnapshot().theme, 'magical');
  assert.equal(syncDocuments.loadSettingsSnapshot().minimizeToTray, true);
  const futureSettings = harness({ [settingsPath]: JSON.stringify({ theme: 'future', [SCHEMA_KEY]: 88 }), [settingsPath + '.bak']: JSON.stringify({ theme: 'old', [SCHEMA_KEY]: 1 }) });
  futureSettings.storage.parseJsonSync = file => JSON.parse(futureSettings.files.get(key(file)));
  const futureSettingsDocuments = createDocumentStore({ storage: futureSettings.storage });
  assert.deepEqual(futureSettingsDocuments.loadSettingsSnapshot(), { theme: 'synthwave', firstRun: true });
  assert.equal(futureSettingsDocuments.getDiagnostics().settings.state, 'unsupported-newer-schema');
  await assert.rejects(futureSettingsDocuments.patchSettings({ windowBounds: { width: 1000, height: 700 } }), /Refusing to overwrite/);
  assert.equal(JSON.parse(futureSettings.files.get(key(settingsPath))).theme, 'future');

  // Atomic migration failure keeps showing the user's actual data, leaves the
  // original and rollback readable, and blocks later writes for this session.
  const failedMigration = harness({ [settingsPath]: JSON.stringify({ theme: 'anime' }) }, { rename: true });
  const recoveredSettings = await failedMigration.documents.loadSettings();
  assert.equal(recoveredSettings.theme, 'anime');
  assert.equal(failedMigration.documents.getDiagnostics().settings.state, 'migration-deferred');
  assert.deepEqual(JSON.parse(failedMigration.files.get(key(settingsPath))), { theme: 'anime' });
  assert.deepEqual(JSON.parse(failedMigration.files.get(key(settingsPath + '.bak'))), { theme: 'anime' });
  await assert.rejects(failedMigration.documents.saveSettings({ theme: 'home' }), /Refusing to overwrite/);
  const failedBackup = harness({ [libraryPath]: JSON.stringify(legacyLibrary) }, { copy: true });
  const readableAfterBackupFailure = await failedBackup.documents.loadLibrary();
  assert.equal(readableAfterBackupFailure.games[0].name, 'Private Game');
  assert.equal(failedBackup.documents.getDiagnostics().library.state, 'migration-deferred');
  assert.deepEqual(JSON.parse(failedBackup.files.get(key(libraryPath))), legacyLibrary);
  await assert.rejects(failedBackup.documents.saveLibrary(readableAfterBackupFailure), /Refusing to overwrite/);

  // Missing and malformed files return conservative defaults. Arrays are not settings.
  const missing = harness();
  assert.deepEqual(await missing.documents.loadLibrary(), { games: [] });
  assert.deepEqual(await missing.documents.loadSettings(), { theme: 'synthwave', firstRun: true });
  const malformedSettings = harness({ [settingsPath]: '[]' });
  assert.deepEqual(await malformedSettings.documents.loadSettings(), { theme: 'synthwave', firstRun: true });
  assert.equal(malformedSettings.files.get(key(settingsPath)), '[]');
  await assert.rejects(malformedSettings.documents.saveSettings({ theme: 'home' }), /Refusing to overwrite/);
  assert.equal(malformedSettings.files.get(key(settingsPath)), '[]', 'invalid primary remains available for manual recovery');

  // Playtime has the same versioning/backups while retaining arbitrary app IDs/days.
  const history = { byAppid: { '123': { '2026-09-01': 50 } }, lastSnapshotAt: 44 };
  const playtime = harness({ [playtimePath]: JSON.stringify(history) });
  const loadedHistory = await playtime.documents.loadPlaytimeHistory();
  assert.deepEqual(loadedHistory.byAppid, history.byAppid);
  loadedHistory.byAppid['123']['2026-09-02'] = 75;
  await playtime.documents.savePlaytimeHistory(loadedHistory);
  assert.equal(JSON.parse(playtime.files.get(key(playtimePath))).byAppid['123']['2026-09-02'], 75);
  await assert.rejects(playtime.documents.savePlaytimeHistory({ byAppid: [] }), /Invalid playtimeHistory/);

  console.log('PASS: versioned library/settings/playtime documents preserve unknown and private fields, back up before migration/save, recover from last-known-good, serialize writes, reject invalid/future shapes, and survive simulated migration failure. Virtual app-data only.');
})().catch(error => { console.error(error); process.exitCode = 1; });
