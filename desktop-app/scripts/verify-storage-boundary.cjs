// Behaviour-preserving storage extraction checks. Uses a virtual app-data drive;
// it never reads or writes the user's NEO-LIB files.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const mainPath = path.join(root, 'electron', 'main.js');
const baselinePath = path.join(__dirname, 'fixtures', 'storage-boundary-baseline.json');
const main = fs.readFileSync(mainPath, 'utf8').replace(/\r\n/g, '\n');
const capture = process.argv.includes('--capture-before-move');
const sha = value => crypto.createHash('sha256').update(value).digest('hex');

function legacySource() {
  const pathsStart = main.indexOf('// ---------------- Paths ---------------- //');
  const pathsEnd = main.indexOf('function safePathPart', pathsStart);
  const jsonStart = main.indexOf('// ---------------- JSON store ---------------- //');
  const jsonEnd = main.indexOf('// ---------------- Window ---------------- //', jsonStart);
  assert(pathsStart >= 0 && pathsEnd > pathsStart && jsonStart >= 0 && jsonEnd > jsonStart,
    'capture is allowed only while the original storage blocks remain in main.js');
  return `${main.slice(pathsStart, pathsEnd)}\n${main.slice(jsonStart, jsonEnd)}`;
}

function virtualDisk(seed = {}) {
  const files = new Map(Object.entries(seed).map(([key, value]) => [path.win32.resolve(key).toLowerCase(), String(value)]));
  const trace = [];
  const key = file => path.win32.resolve(String(file)).toLowerCase();
  const missing = file => Object.assign(new Error(`ENOENT: ${file}`), { code: 'ENOENT' });
  return {
    trace,
    files,
    fs: {
      readFileSync(file, encoding) {
        trace.push(['readFileSync', file, encoding]);
        if (!files.has(key(file))) throw missing(file);
        return files.get(key(file));
      },
      writeFileSync(file, value, encoding) {
        trace.push(['writeFileSync', file, String(value), encoding]);
        files.set(key(file), String(value));
      },
      appendFileSync(file, value, encoding) {
        trace.push(['appendFileSync', file, String(value), encoding]);
        files.set(key(file), (files.get(key(file)) || '') + String(value));
      },
    },
    fsp: {
      async mkdir(file, options) { trace.push(['mkdir', file, options]); },
      async readFile(file, encoding) {
        trace.push(['readFile', file, encoding]);
        if (!files.has(key(file))) throw missing(file);
        return files.get(key(file));
      },
      async writeFile(file, value, encoding) {
        trace.push(['writeFile', file, String(value), encoding]);
        files.set(key(file), String(value));
      },
      async rename(from, to) {
        trace.push(['rename', from, to]);
        if (!files.has(key(from))) throw missing(from);
        files.set(key(to), files.get(key(from)));
        files.delete(key(from));
      },
    },
  };
}

function makeLegacy(disk) {
  const app = { getPath(name) { assert.equal(name, 'userData'); return 'C:\\Users\\Test\\AppData\\Roaming\\neo-lib'; } };
  return vm.runInNewContext(`${legacySource()}\n;({
    dataDir, libraryFile, settingsFile, coversDir, saveBackupsDir,
    managedToolsDir, playtimeHistoryFile, ensureDirs, readJson, writeJson,
  });`, { app, path: path.win32, fsp: disk.fsp });
}

function makeExtracted(disk) {
  const app = { getPath(name) { assert.equal(name, 'userData'); return 'C:\\Users\\Test\\AppData\\Roaming\\neo-lib'; } };
  return require('../electron/storage/app-storage.cjs').createAppStorage({ app, path: path.win32, fs: disk.fs, fsp: disk.fsp });
}

async function snapshot(factory) {
  const disk = virtualDisk({
    'C:\\Users\\Test\\AppData\\Roaming\\neo-lib\\valid.json': JSON.stringify({ value: 7, nested: { keep: true } }),
    'C:\\Users\\Test\\AppData\\Roaming\\neo-lib\\broken.json': '{broken',
  });
  const storage = factory(disk);
  const paths = Object.fromEntries([
    'dataDir', 'libraryFile', 'settingsFile', 'coversDir', 'saveBackupsDir',
    'managedToolsDir', 'diagnosticsDir', 'playtimeHistoryFile',
  ].map(name => [name, storage[name]()]));
  await storage.ensureDirs();
  const directoryTrace = disk.trace.splice(0);
  const valid = await storage.readJson(path.win32.join(paths.dataDir, 'valid.json'), { fallback: true });
  const malformedFallback = { exact: 'malformed fallback identity is not serialized' };
  const malformed = await storage.readJson(path.win32.join(paths.dataDir, 'broken.json'), malformedFallback);
  assert.equal(malformed, malformedFallback, 'malformed JSON returns the exact fallback object');
  const missingFallback = { exact: 'missing fallback identity is not serialized' };
  const missing = await storage.readJson(path.win32.join(paths.dataDir, 'missing.json'), missingFallback);
  assert.equal(missing, missingFallback, 'missing JSON returns the exact fallback object');
  const readTrace = disk.trace.splice(0);
  const payload = { games: [{ id: 'manual', name: 'Keep me', categoryIds: ['private'] }], categories: [{ id: 'private', pin: '1234' }] };
  await storage.writeJson(paths.libraryFile, payload);
  const writeTrace = disk.trace.splice(0);
  return {
    paths,
    directoryTrace,
    valid: JSON.parse(JSON.stringify(valid)),
    malformed: JSON.parse(JSON.stringify(malformed)),
    missing: JSON.parse(JSON.stringify(missing)),
    readTrace,
    writeTrace,
    savedLibrary: disk.files.get(path.win32.resolve(paths.libraryFile).toLowerCase()),
    temporaryFileLeftBehind: disk.files.has(path.win32.resolve(paths.libraryFile + '.tmp').toLowerCase()),
  };
}

(async () => {
  if (capture) {
    const original = legacySource();
    process.stdout.write(JSON.stringify({ sourceSha256: sha(original), snapshot: await snapshot(makeLegacy) }, null, 2) + '\n');
    return;
  }
  const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  const expected = JSON.parse(JSON.stringify(baseline.snapshot));
  expected.paths.diagnosticsDir = path.win32.join(expected.paths.dataDir, 'diagnostics');
  expected.directoryTrace.push(['mkdir', expected.paths.diagnosticsDir, { recursive: true }]);
  assert.deepEqual(await snapshot(makeExtracted), expected,
    'legacy paths, fallbacks, formatting and ordered storage I/O remain stable while the diagnostics directory is added explicitly');
  assert(!main.includes("app.getPath('userData')"), 'main no longer owns the app-data root');
  assert(!/async function (?:readJson|writeJson|ensureDirs)\(/.test(main), 'main does not retain duplicate storage implementations');
  assert(main.includes("require('./storage/app-storage.cjs')"), 'main imports the storage boundary');
  assert(main.includes('createAppStorage({ app, path, fs, fsp })'), 'main creates storage with explicit dependencies');
  assert(main.includes('registerPersistenceIpc({ registerIpc, documents })'),
    'main delegates library/settings IPC to the persistence boundary');
  assert(!/fs\.(?:readFileSync|writeFileSync|appendFileSync)\((?:settingsFile|libraryFile|playtimeHistoryFile|launchSafetyStateFile|launchSafetyLogFile)\(\)/.test(main),
    'main has no direct reads/writes for boundary-owned JSON and log files');
  const syncDisk = virtualDisk({
    'C:\\Users\\Test\\AppData\\Roaming\\neo-lib\\valid.json': '{"ok":true}',
    'C:\\Users\\Test\\AppData\\Roaming\\neo-lib\\broken.json': '{bad',
  });
  const syncStorage = makeExtracted(syncDisk);
  assert.deepEqual(syncStorage.parseJsonSync('C:\\Users\\Test\\AppData\\Roaming\\neo-lib\\valid.json'), { ok: true });
  const syncFallback = { keep: 'identity' };
  assert.equal(syncStorage.readJsonSync('C:\\Users\\Test\\AppData\\Roaming\\neo-lib\\broken.json', syncFallback), syncFallback);
  assert.throws(() => syncStorage.parseJsonSync('C:\\Users\\Test\\AppData\\Roaming\\neo-lib\\broken.json'));
  syncStorage.writeJsonSync('C:\\Users\\Test\\AppData\\Roaming\\neo-lib\\pretty.json', { a: 1 }, 2);
  syncStorage.writeJsonSync('C:\\Users\\Test\\AppData\\Roaming\\neo-lib\\compact.json', { a: 1 });
  syncStorage.appendTextSync('C:\\Users\\Test\\AppData\\Roaming\\neo-lib\\events.log', 'one\n');
  syncStorage.appendTextSync('C:\\Users\\Test\\AppData\\Roaming\\neo-lib\\events.log', 'two\n');
  assert.equal(syncDisk.files.get(path.win32.resolve('C:\\Users\\Test\\AppData\\Roaming\\neo-lib\\pretty.json').toLowerCase()), '{\n  "a": 1\n}');
  assert.equal(syncDisk.files.get(path.win32.resolve('C:\\Users\\Test\\AppData\\Roaming\\neo-lib\\compact.json').toLowerCase()), '{"a":1}');
  assert.equal(syncDisk.files.get(path.win32.resolve('C:\\Users\\Test\\AppData\\Roaming\\neo-lib\\events.log').toLowerCase()), 'one\ntwo\n');
  const pkg = require('../package.json');
  assert(pkg.build.files.includes('electron/**/*'), 'storage module is included in packaged app');
  console.log('PASS: storage paths, directory creation, exact fallback identity, JSON formatting and atomic temp-write/rename sequence match the pre-extraction baseline. No real app-data files were accessed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
