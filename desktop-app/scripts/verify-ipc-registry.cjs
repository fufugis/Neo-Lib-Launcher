const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createIpcRegistry } = require('../electron/ipc/registry.cjs');
const { guardResult, invalidResponse } = require('../electron/ipc/contract-guards.cjs');
const { createIpcFailureReporter } = require('../electron/ipc/failure-log.cjs');
const { registerPersistenceIpc } = require('../electron/ipc/persistence-ipc.cjs');
const { registerWindowIpc } = require('../electron/ipc/window-ipc.cjs');
const { registerDialogIpc } = require('../electron/ipc/dialog-ipc.cjs');
const { registerShellIpc } = require('../electron/ipc/shell-ipc.cjs');
const { registerExeIpc } = require('../electron/ipc/exe-ipc.cjs');
const { registerSystemIpc } = require('../electron/ipc/system-ipc.cjs');
const { registerPlaytimeIpc } = require('../electron/ipc/playtime-ipc.cjs');
const { registerImageIpc } = require('../electron/ipc/image-ipc.cjs');
const { registerAppOsIpc } = require('../electron/ipc/app-os-ipc.cjs');
const { registerAppLifecycleIpc } = require('../electron/ipc/app-lifecycle-ipc.cjs');
const { registerDoctorIpc } = require('../electron/ipc/doctor-ipc.cjs');
const { createSystemHealthService } = require('../electron/system/system-health-service.cjs');
const { createPlaytimeHistoryService } = require('../electron/playtime/playtime-history-service.cjs');
const { createImageCacheService } = require('../electron/images/image-cache-service.cjs');
const { createAppOsService } = require('../electron/app/app-os-service.cjs');
const { createAppLifecycleService } = require('../electron/app/app-lifecycle-service.cjs');
const { createLaunchDoctorService } = require('../electron/doctor/launch-doctor-service.cjs');
const { createLauncherScanners } = require('../electron/launchers/scanners.cjs');

async function main() {
  const calls = [];
  const native = { handle(channel, handler) { calls.push({ channel, handler }); } };
  const registry = createIpcRegistry({ ipcMain: native });
  const handler = async () => ({ ok: true });
  assert.equal(registry.handle('test:one', handler), handler);
  assert.equal(calls[0].handler, handler, 'registry must not wrap or alter handler behaviour');
  assert.throws(() => registry.handle('test:one', handler), /Duplicate IPC/);
  assert.throws(() => registry.handle('missing-colon', handler), /Invalid IPC/);
  assert.throws(() => registry.handle('Test:upper-domain', handler), /Invalid IPC/);
  assert.throws(() => registry.handle('test:bad', null), /must be a function/);
  assert.deepEqual(registry.list(), [{ channel: 'test:one', domain: 'test' }]);
  assert(Object.isFrozen(registry.list()));

  const failures = [];
  const guardedCalls = [];
  const guardedRegistry = createIpcRegistry({
    ipcMain: { handle(channel, fn) { guardedCalls.push({ channel, fn }); } },
    onFailure(failure) { failures.push(failure); },
  });
  const syncFailure = guardResult(
    () => { throw new Error('sync service failed'); },
    result => result?.ok === true,
    invalidResponse('Safe fallback'),
  );
  const asyncFailure = guardResult(
    async () => { throw new TypeError('async service failed'); },
    result => result?.ok === true,
    invalidResponse('Safe fallback'),
  );
  const malformedResponse = guardResult(
    () => ({ unexpected: true }),
    result => result?.ok === true,
    invalidResponse('Safe fallback'),
  );
  guardedRegistry.handle('test:syncFailure', syncFailure);
  guardedRegistry.handle('test:asyncFailure', asyncFailure);
  guardedRegistry.handle('test:malformedResponse', malformedResponse);
  for (const call of guardedCalls) {
    assert.deepEqual(await call.fn(), invalidResponse('Safe fallback'));
  }
  assert.deepEqual(failures.map(({ channel, domain, kind, error, receivedType }) => ({
    channel, domain, kind, errorName: error?.name, errorMessage: error?.message, receivedType,
  })), [
    { channel: 'test:syncFailure', domain: 'test', kind: 'service-throw', errorName: 'Error', errorMessage: 'sync service failed', receivedType: undefined },
    { channel: 'test:asyncFailure', domain: 'test', kind: 'service-rejection', errorName: 'TypeError', errorMessage: 'async service failed', receivedType: undefined },
    { channel: 'test:malformedResponse', domain: 'test', kind: 'invalid-response', errorName: undefined, errorMessage: undefined, receivedType: 'object' },
  ]);

  const diagnosticLines = [];
  const reportFailure = createIpcFailureReporter({
    appendTextSync(file, line) { diagnosticLines.push({ file, line }); },
    logFile: () => 'ipc-failures.log',
    now: () => new Date('2026-09-15T12:34:56.000Z'),
  });
  reportFailure(failures[1]);
  reportFailure({ channel: 'test:private', domain: 'test', kind: 'service-throw', error: new Error('line one\nline two') });
  assert.equal(diagnosticLines.length, 2);
  assert.equal(diagnosticLines[0].file, 'ipc-failures.log');
  assert.deepEqual(JSON.parse(diagnosticLines[0].line), {
    at: '2026-09-15T12:34:56.000Z', channel: 'test:asyncFailure', domain: 'test', kind: 'service-rejection',
    error: { name: 'TypeError' },
  });
  assert.equal(JSON.parse(diagnosticLines[1].line).error.name, 'Error');
  assert(!diagnosticLines[1].line.includes('line one'), 'diagnostics must not serialize error message text');
  assert(!diagnosticLines[0].line.includes('payload'), 'diagnostics must not serialize request payloads');

  const root = path.resolve(__dirname, '..');
  const mainSource = fs.readFileSync(path.join(root, 'electron/main.js'), 'utf8');
  const preload = fs.readFileSync(path.join(root, 'electron/preload.js'), 'utf8');
  const ipcDir = path.join(root, 'electron/ipc');
  const ipcSources = fs.readdirSync(ipcDir)
    .filter(name => name.endsWith('-ipc.cjs'))
    .sort()
    .map(name => fs.readFileSync(path.join(ipcDir, name), 'utf8'));
  assert(mainSource.includes("require('./ipc/registry.cjs')"));
  assert(mainSource.includes('createIpcRegistry({ ipcMain, onFailure:'));
  assert(!mainSource.includes('ipcMain.handle('), 'all handler registration must pass through the duplicate-safe registry');
  assert(!mainSource.includes('registerIpc('), 'main must define services, not register renderer commands directly');

  const registrationSource = ipcSources.join('\n');
const staticChannels = Array.from(registrationSource.matchAll(/registerIpc\(['"]([^'"]+)['"]/g), match => match[1]);
const nativeChannels = staticChannels;
assert.equal(nativeChannels.length, 85, 'known native command count changed; review the contract intentionally');
assert.equal(new Set(nativeChannels).size, nativeChannels.length, 'source contains a duplicate channel');

const rendererChannels = Array.from(new Set(Array.from(preload.matchAll(/ipcRenderer\.invoke\(['"]([^'"]+)['"]/g), match => match[1])));
const missingNative = rendererChannels.filter(channel => !nativeChannels.includes(channel));
assert.deepEqual(missingNative, [], 'every preload command has exactly one native handler');
const nativeOnly = nativeChannels.filter(channel => !rendererChannels.includes(channel));
assert.deepEqual(nativeOnly, ['gemini:metadata'], 'review internal-only/dead native commands intentionally');

const groups = Object.groupBy(nativeChannels, channel => channel.split(':', 1)[0]);
assert.equal(Object.keys(groups).length, 28, 'domain inventory changed; document the new boundary');

const persistenceHandlers = {};
const documentCalls = [];
const documents = {
  async loadLibrary() { documentCalls.push(['loadLibrary']); return { games: [{ id: 'one' }] }; },
  async saveLibrary(value) { documentCalls.push(['saveLibrary', value]); },
  async loadSettings() { documentCalls.push(['loadSettings']); return { theme: 'home' }; },
  async saveSettings(value) { documentCalls.push(['saveSettings', value]); },
};
registerPersistenceIpc({ registerIpc(channel, fn) { assert(!persistenceHandlers[channel]); persistenceHandlers[channel] = fn; }, documents });
assert.deepEqual(Object.keys(persistenceHandlers), ['library:load', 'library:save', 'settings:load', 'settings:save']);
assert.deepEqual(await persistenceHandlers['library:load'](), { games: [{ id: 'one' }] });
assert.equal(await persistenceHandlers['library:save']({}, { games: [] }), true);
assert.deepEqual(await persistenceHandlers['settings:load'](), { theme: 'home' });
assert.equal(await persistenceHandlers['settings:save']({}, { theme: 'anime' }), true);
assert.deepEqual(documentCalls, [
  ['loadLibrary'], ['saveLibrary', { games: [] }], ['loadSettings'], ['saveSettings', { theme: 'anime' }],
]);

  const windowHandlers = {};
  const windowCalls = [];
  let maximized = false;
  const fakeWindow = {
    minimize() { windowCalls.push('minimize'); },
    close() { windowCalls.push('close'); },
    isMaximized() { return maximized; },
    maximize() { windowCalls.push('maximize'); maximized = true; },
    unmaximize() { windowCalls.push('unmaximize'); maximized = false; },
  };
  let activeWindow = fakeWindow;
  registerWindowIpc({
    registerIpc(channel, fn) { assert(!windowHandlers[channel]); windowHandlers[channel] = fn; },
    getMainWindow: () => activeWindow,
  });
  assert.deepEqual(Object.keys(windowHandlers), ['window:minimize', 'window:toggleMaximize', 'window:close']);
  windowHandlers['window:minimize']();
  assert.equal(windowHandlers['window:toggleMaximize'](), true);
  assert.equal(windowHandlers['window:toggleMaximize'](), false);
  windowHandlers['window:close']();
  assert.deepEqual(windowCalls, ['minimize', 'maximize', 'unmaximize', 'close']);
  activeWindow = null;
  assert.equal(windowHandlers['window:minimize'](), undefined);
  assert.equal(windowHandlers['window:toggleMaximize'](), false);
  assert.equal(windowHandlers['window:close'](), undefined);

  const dialogHandlers = {};
  const dialogCalls = [];
  const firstWindow = { id: 'first-window' };
  let pickerWindow = firstWindow;
  const selectedByTitle = {
    'Select game executable': 'C:\\Games\\One.exe',
    'Select folder to scan for games': 'D:\\Games',
    'Pick an image (icon / cover / hero)': 'C:\\Art\\cover.png',
    "Select this game's save folder": 'C:\\Saves\\One',
  };
  registerDialogIpc({
    registerIpc(channel, fn) { assert(!dialogHandlers[channel]); dialogHandlers[channel] = fn; },
    dialog: { async showOpenDialog(parent, options) {
      dialogCalls.push({ parent, options });
      return { canceled: false, filePaths: [selectedByTitle[options.title]] };
    } },
    getMainWindow: () => pickerWindow,
  });
  assert.deepEqual(Object.keys(dialogHandlers), ['dialog:pickExe', 'dialog:pickDirectory', 'dialog:pickImage', 'dialog:pickSaveFolder']);
  assert.equal(await dialogHandlers['dialog:pickExe'](), 'C:\\Games\\One.exe');
  pickerWindow = { id: 'replacement-window' };
  assert.equal(await dialogHandlers['dialog:pickDirectory'](), 'D:\\Games');
  assert.deepEqual(await dialogHandlers['dialog:pickImage'](), { path: 'C:\\Art\\cover.png', url: 'file://C:/Art/cover.png' });
  assert.equal(await dialogHandlers['dialog:pickSaveFolder'](), 'C:\\Saves\\One');
  assert.equal(dialogCalls[0].parent, firstWindow);
  assert.equal(dialogCalls[1].parent, pickerWindow, 'picker must resolve the current window for every call');
  assert.deepEqual(dialogCalls.map(call => call.options.properties), [['openFile'], ['openDirectory'], ['openFile'], ['openDirectory']]);
  assert.deepEqual(dialogCalls[0].options.filters[0].extensions, ['exe', 'lnk', 'bat', 'cmd']);
  assert.deepEqual(dialogCalls[2].options.filters[0].extensions, ['png', 'jpg', 'jpeg', 'webp', 'gif', 'ico']);

  const cancelledHandlers = {};
  registerDialogIpc({
    registerIpc(channel, fn) { cancelledHandlers[channel] = fn; },
    dialog: { async showOpenDialog() { return { canceled: true, filePaths: [] }; } },
    getMainWindow: () => null,
  });
  for (const cancelled of Object.values(cancelledHandlers)) assert.equal(await cancelled(), null);

  const shellHandlers = {};
  registerShellIpc({
    registerIpc(channel, fn) { shellHandlers[channel] = fn; },
    shell: { readShortcutLink(lnkPath) { assert.equal(lnkPath, 'C:\\Game.lnk'); return { target: 'D:\\Game.exe', args: '--safe' }; } },
  });
  assert.deepEqual(await shellHandlers['shell:resolveLnk']({}, 'C:\\Game.lnk'), { ok: true, target: 'D:\\Game.exe', args: '--safe' });
  const failingShellHandlers = {};
  registerShellIpc({
    registerIpc(channel, fn) { failingShellHandlers[channel] = fn; },
    shell: { readShortcutLink() { throw new Error('broken shortcut'); } },
  });
  assert.deepEqual(await failingShellHandlers['shell:resolveLnk']({}, 'bad.lnk'), { ok: false, error: 'broken shortcut' });

  const exeHandlers = {};
  let iconMode = 'valid';
  registerExeIpc({
    registerIpc(channel, fn) { exeHandlers[channel] = fn; },
    app: { async getFileIcon(exePath, options) {
      assert.equal(exePath, 'C:\\Game.exe');
      assert.deepEqual(options, { size: 'large' });
      if (iconMode === 'error') throw new Error('unreadable');
      return { isEmpty: () => iconMode === 'empty', toDataURL: () => 'data:image/png;base64,icon' };
    } },
  });
  assert.equal(await exeHandlers['exe:icon']({}, 'C:\\Game.exe'), 'data:image/png;base64,icon');
  iconMode = 'empty';
  assert.equal(await exeHandlers['exe:icon']({}, 'C:\\Game.exe'), null);
  iconMode = 'error';
  assert.equal(await exeHandlers['exe:icon']({}, 'C:\\Game.exe'), null);

  const gib = 1024 ** 3;
  const cpuSnapshots = [
    [{ times: { idle: 100, user: 100 } }],
    [{ times: { idle: 120, user: 180 } }],
    [{ times: { idle: 900, user: 100 } }],
    [{ times: { idle: 950, user: 150 } }],
  ];
  const delays = [];
  const systemHealth = createSystemHealthService({
    os: {
      cpus() { return cpuSnapshots.shift(); },
      totalmem() { return 10 * gib; },
      freemem() { return 4 * gib; },
    },
    async delay(ms) { delays.push(ms); },
  });
  const systemHandlers = {};
  registerSystemIpc({ registerIpc(channel, fn) { systemHandlers[channel] = fn; }, systemHealth });
  assert.deepEqual(await systemHandlers['system:health'](), {
    cpuPercent: 80, ramPercent: 60, memoryUsedGb: 6, memoryFreeGb: 4, memoryTotalGb: 10,
  });
  assert.equal((await systemHandlers['system:health']()).cpuPercent, 50);
  assert.deepEqual(delays, [1000, 1000], 'every health read uses its own fresh one-second CPU window');

  const historyDocument = {
    lastSnapshotAt: 1234,
    byAppid: {
      one: { '2026-09-01': 10, '2026-09-09': 20, '2026-09-15': 50 },
      two: { '2026-09-14': 5, '2026-09-15': 15 },
      zero: { '2026-09-08': 20, '2026-09-15': 20 },
    },
  };
  const playtimeHistory = createPlaytimeHistoryService({
    documents: { async loadPlaytimeHistory() { return historyDocument; } },
    now: () => new Date('2026-09-15T12:00:00Z'),
  });
  const playtimeHandlers = {};
  registerPlaytimeIpc({ registerIpc(channel, fn) { playtimeHandlers[channel] = fn; }, playtimeHistory });
  assert.deepEqual(await playtimeHandlers['playtime:history']({}, { days: 7 }), {
    ok: true, deltas: { one: 40, two: 10 }, lastSnapshotAt: 1234,
  });
  const failingPlaytime = createPlaytimeHistoryService({
    documents: { async loadPlaytimeHistory() { throw new Error('history unreadable'); } },
    now: () => new Date('2026-09-15T12:00:00Z'),
  });
  assert.deepEqual(await failingPlaytime.read({ days: 7 }), { ok: false, error: 'history unreadable', deltas: {} });

  const imageDownloads = [];
  const imageCache = createImageCacheService({
    path: path.win32,
    coversDir: () => 'C:\\Data\\covers',
    download: async (url, outputPath) => { imageDownloads.push({ url, outputPath }); },
    now: () => 777,
  });
  const imageHandlers = {};
  registerImageIpc({ registerIpc(channel, fn) { imageHandlers[channel] = fn; }, imageCache });
  assert.equal(await imageHandlers['image:cache']({}, { url: 'https://cdn.example/art.PNG?size=2', name: 'My Game!' }), 'file://C:/Data/covers/My_Game__777.PNG');
  assert.deepEqual(imageDownloads, [{ url: 'https://cdn.example/art.PNG?size=2', outputPath: 'C:\\Data\\covers\\My_Game__777.PNG' }]);
  assert.equal(await imageHandlers['image:cache']({}, {}), null);
  const fallbackImageCache = createImageCacheService({
    path: path.win32, coversDir: () => 'C:\\Data\\covers', download: async () => {}, now: () => 778,
  });
  assert.equal(await fallbackImageCache.cache({ url: 'https://cdn.example/art', name: '' }), 'file://C:/Data/covers/cover_778.jpg');
  const failingImageCache = createImageCacheService({
    path: path.win32, coversDir: () => 'C:\\Data\\covers', download: async () => { throw new Error('offline'); }, now: () => 779,
  });
  assert.equal(await failingImageCache.cache({ url: 'https://cdn.example/art.jpg', name: 'Game' }), null);

  const appCalls = [];
  let pathKind = 'file';
  let openPathError = '';
  const appOs = createAppOsService({
    app: {
      setLoginItemSettings(settings) { appCalls.push(['setLoginItemSettings', settings]); },
      getLoginItemSettings() { return { openAtLogin: true }; },
    },
    shell: {
      async openExternal(value) { appCalls.push(['openExternal', value]); },
      async openPath(value) { appCalls.push(['openPath', value]); return openPathError; },
      showItemInFolder(value) { appCalls.push(['showItemInFolder', value]); },
    },
    fsp: { async stat() { if (pathKind === 'missing') throw new Error('missing'); return { isDirectory: () => pathKind === 'directory' }; } },
    path: path.win32,
    execPath: 'C:\\NEO-LIB\\NEO-LIB.exe',
    recordLaunchSafety(event, details) { appCalls.push(['safety', event, details]); },
  });
  const appHandlers = {};
  registerAppOsIpc({ registerIpc(channel, fn) { appHandlers[channel] = fn; }, appOs });
  assert.deepEqual(Object.keys(appHandlers), ['app:openExternal', 'app:revealInFolder', 'app:openContainingDir', 'app:setAutoStart', 'app:getAutoStart', 'app:openPath']);
  assert.deepEqual(await appHandlers['app:openExternal']({}, 'https://neo-lib.example/news'), { ok: true });
  assert.deepEqual(await appHandlers['app:openExternal']({}, 'ms-settings:bluetooth'), { ok: true });
  assert.deepEqual(await appHandlers['app:openExternal']({}, 'ms-settings:privacy'), { ok: false, code: 'INVALID_REQUEST', error: 'Only a valid public HTTP/HTTPS link or approved Windows settings page can be opened.' });
  assert.deepEqual(await appOs.openExternal('ms-settings:privacy'), { ok: false, error: 'That Windows settings page is not approved by NEO-LIB.' });
  assert.deepEqual(await appHandlers['app:openExternal']({}, 'steam://run/123'), { ok: false, error: 'Launch safety blocked a game protocol outside the Launch action.' });
  assert(!appCalls.some(call => call[0] === 'openExternal' && call[1] === 'steam://run/123'), 'blocked game protocol must not reach the OS');
  assert.deepEqual(await appHandlers['app:revealInFolder']({}, 'C:\\Games\\Game.exe'), { ok: true, opened: 'C:\\Games' });
  pathKind = 'directory';
  assert.deepEqual(await appHandlers['app:revealInFolder']({}, 'C:\\Games'), { ok: true, opened: 'C:\\Games' });
  pathKind = 'missing';
  assert.deepEqual(await appHandlers['app:revealInFolder']({}, 'C:\\Moved\\Game.exe'), { ok: true, opened: 'C:\\Moved', missingTarget: true });
  assert.equal(await appHandlers['app:openContainingDir']({}, 'C:\\Games\\Game.exe'), undefined);
  assert.deepEqual(await appHandlers['app:setAutoStart']({}, true), { ok: true });
  assert.equal(await appHandlers['app:getAutoStart'](), true);
  assert.deepEqual(await appHandlers['app:openPath']({}, 'C:\\Games'), { ok: true });
  assert.deepEqual(await appHandlers['app:openPath']({}, ''), { ok: false, code: 'INVALID_REQUEST', error: 'The open-path request was malformed.' });
  openPathError = 'access denied';
  assert.deepEqual(await appHandlers['app:openPath']({}, 'C:\\Blocked'), { ok: false, error: 'access denied' });
  assert.deepEqual(appCalls.find(call => call[0] === 'setLoginItemSettings')[1], { openAtLogin: true, path: 'C:\\NEO-LIB\\NEO-LIB.exe' });

  const lifecycleCalls = [];
  let lifecycleSocket = { destroy() { lifecycleCalls.push('socket.destroy'); } };
  let lifecycleReady = true;
  const appLifecycle = createAppLifecycleService({
    buildTray() { lifecycleCalls.push('buildTray'); },
    destroyTray() { lifecycleCalls.push('destroyTray'); },
    clearDiscordActivity() { lifecycleCalls.push('clearDiscordActivity'); },
    getDiscordSocket: () => lifecycleSocket,
    setDiscordSocket(value) { lifecycleCalls.push(['setDiscordSocket', value]); lifecycleSocket = value; },
    getDiscordReady: () => lifecycleReady,
    setDiscordReady(value) { lifecycleCalls.push(['setDiscordReady', value]); lifecycleReady = value; },
    getDiscordAppId: () => 'discord-app-id',
    quitApp() { lifecycleCalls.push('quitApp'); },
  });
  const lifecycleHandlers = {};
  registerAppLifecycleIpc({ registerIpc(channel, fn) { lifecycleHandlers[channel] = fn; }, appLifecycle });
  assert.deepEqual(Object.keys(lifecycleHandlers), ['app:setMinimizeToTray', 'app:setDiscordRpc', 'app:discordRpcStatus', 'app:quit']);
  assert.equal(await lifecycleHandlers['app:setMinimizeToTray']({}, true), true);
  assert.equal(await lifecycleHandlers['app:setMinimizeToTray']({}, false), false);
  assert.deepEqual(await lifecycleHandlers['app:discordRpcStatus'](), { hasAppId: true, installed: true, ready: true });
  assert.deepEqual(await lifecycleHandlers['app:setDiscordRpc']({}, false), { ok: true, hasAppId: true });
  assert.deepEqual(lifecycleCalls, [
    'buildTray', 'destroyTray', 'clearDiscordActivity', 'socket.destroy', ['setDiscordSocket', null], ['setDiscordReady', false],
  ]);
  assert.deepEqual(await lifecycleHandlers['app:discordRpcStatus'](), { hasAppId: true, installed: true, ready: false });
  assert.equal(await lifecycleHandlers['app:quit'](), true);
  assert(lifecycleCalls.includes('quitApp'));

  const doctor = createLaunchDoctorService({
    fs: { existsSync: () => true },
    fsp: { async stat() { return { isFile: () => true }; } },
    path: path.win32,
    async walkDir(_root, _depth, _maxDepth, found) { found.push('C:\\Games\\Other.exe', 'C:\\Games\\MyGame.exe'); },
  });
  const doctorHandlers = {};
  registerDoctorIpc({ registerIpc(channel, fn) { doctorHandlers[channel] = fn; }, launchDoctor: doctor });
  const diagnosis = await doctorHandlers['doctor:inspectLaunch']({}, { exePath: 'C:\\Games\\Configured.exe', gameName: 'My Game' });
  assert.equal(diagnosis.exists, true);
  assert.deepEqual(diagnosis.candidates.map(candidate => candidate.path), ['C:\\Games\\MyGame.exe', 'C:\\Games\\Other.exe']);
  const noTarget = await doctor.inspect({});
  assert.equal(noTarget.exists, false);
  assert.match(noTarget.notes[0], /No launch executable/);
  console.log(`PASS: ${nativeChannels.length} unique native commands across ${Object.keys(groups).length} domains; every preload invoke resolves exactly once, duplicate/invalid registration fails before Electron, contract failures retain channel-aware safe diagnostics, and the registry preserves each supplied handler. One documented native-only command: gemini:metadata.`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
