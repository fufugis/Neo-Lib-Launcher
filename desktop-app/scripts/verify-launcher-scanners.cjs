// Behaviour-preserving extraction checks. Every filesystem/process call is mocked.
// The checked-in baseline was captured from main.js BEFORE moving the scanners.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const { EventEmitter } = require('node:events');
const { createRequire } = require('node:module');
const babel = createRequire(require.resolve('@vitejs/plugin-react'))('@babel/core');
const root = path.resolve(__dirname, '..');
const main = fs.readFileSync(path.join(root, 'electron/main.js'), 'utf8');
const ast = babel.parseSync(main, { configFile: false, babelrc: false, sourceType: 'script' });
const channels = ['steam', 'epic', 'gog', 'ea', 'ubisoft', 'battlenet', 'riot', 'xbox', 'rockstar', 'itch'].map(x => 'launcher:scan-' + x);
const sharedNames = ['NOISE_KEYWORDS', 'isLikelyGameExe', 'readSteamLibraryFolders', 'parseAcfManifest', 'defaultSteamPath', 'BATTLENET_PRODUCTS', 'battleNetProductFor'];
const privateNames = ['queryRegistry', 'primaryExeIn', 'itchInstallRoots', 'itchDisplayName'];
const declaration = name => ast.program.body.find(n => n.id?.name === name || n.declarations?.some(d => d.id?.name === name));
const source = node => { assert(node, 'Expected source node'); return main.slice(node.start, node.end); };
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const normalize = value => value.replace(/\r\n/g, '\n').replace(/^[ \t]+/gm, '');
const helpers = sharedNames.map(name => source(declaration(name))).join('\n');
const baselinePath = path.join(__dirname, 'fixtures/launcher-scanners-baseline.json');
const capture = process.argv.includes('--capture-before-move');
const baseline = capture ? null : JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
const legacyHandlers = ast.program.body.filter(n => n.expression?.callee?.object?.name === 'ipcMain' && n.expression?.callee?.property?.name === 'handle' && channels.includes(n.expression.arguments[0]?.value));

function fixture(mode) {
  const p = path.win32;
  const nodes = new Map();
  const trace = [];
  const key = file => p.resolve(String(file)).toLowerCase();
  function dir(file) {
    const name = key(file);
    if (nodes.has(name)) return;
    nodes.set(name, { dir: true, children: [] });
    const parent = p.dirname(file);
    if (key(parent) !== name) { dir(parent); nodes.get(key(parent)).children.push(p.basename(file)); }
  }
  function file(filePath, data = '') {
    dir(p.dirname(filePath));
    const name = key(filePath);
    if (!nodes.has(name)) nodes.get(key(p.dirname(filePath))).children.push(p.basename(filePath));
    nodes.set(name, { dir: false, data });
  }
  const env = { PROGRAMDATA: 'C:\\ProgramData', APPDATA: 'C:\\Users\\Test\\AppData\\Roaming', LOCALAPPDATA: 'C:\\Users\\Test\\AppData\\Local' };
  const records = [];
  const game = (folder, exe = 'game.exe') => { file(p.join(folder, 'setup.exe')); file(p.join(folder, exe)); };
  const record = (registry, values) => records.push({ registry, text: registry.replace(/^HKLM/, 'HKEY_LOCAL_MACHINE') + '\n' + Object.entries(values).map(([name, value]) => `    ${name}    REG_SZ    ${value}`).join('\n') });
  if (mode !== 'empty') {
    const steam = 'C:\\Program Files (x86)\\Steam';
    file(p.join(steam, 'steam.exe'));
    file(p.join(steam, 'steamapps/libraryfolders.vdf'), '"path" "D:\\\\SteamLibrary"');
    const acf = (appid, name, installdir) => `"appid" "${appid}"\n"name" "${name}"\n"installdir" "${installdir}"\n"buildid" "500"`;
    file(p.join(steam, 'steamapps/appmanifest_10.acf'), acf('10', 'Steam Game', 'SteamGame'));
    file(p.join(steam, 'steamapps/appmanifest_11.acf'), acf('11', 'Steamworks Common Redistributables', 'Redist'));
    file(p.join(steam, 'steamapps/appmanifest_bad.acf'), 'invalid');
    game(p.join(steam, 'steamapps/common/SteamGame'));
    file('D:\\SteamLibrary\\steamapps\\appmanifest_12.acf', acf('12', 'Folder Only Game', 'FolderOnly'));
    const epic = p.join(env.PROGRAMDATA, 'Epic/EpicGamesLauncher/Data/Manifests');
    const epicItem = { bIsApplication: true, DisplayName: 'Epic Game', InstallLocation: 'D:\\Games\\Epic', AppName: 'epic-id', CatalogNamespace: 'ns', CatalogItemId: 'catalog', LaunchExecutable: 'bin/game.exe' };
    file(p.join(epic, 'game.item'), JSON.stringify(epicItem));
    file(p.join(epic, 'unmanaged.item'), JSON.stringify({ ...epicItem, bIsManaged: false }));
    file(p.join(epic, 'not-game.item'), JSON.stringify({ ...epicItem, bIsApplication: false }));
    file(p.join(epic, 'bad.item'), '{broken');
    game('D:\\Games\\Epic', 'bin\\game.exe');
    for (const platform of ['Gog', 'EA', 'Ubisoft', 'Warcraft', 'Rockstar']) game('D:\\Games\\' + platform);
    record('HKLM\\SOFTWARE\\GOG.com\\Games\\gog-id', { path: 'D:\\Games\\Gog', gameName: 'GOG Game', gameID: 'gog-id', buildId: '45' });
    record('HKLM\\SOFTWARE\\EA Games\\ea-id', { 'Install Dir': 'D:\\Games\\EA', DisplayName: 'EA Game', 'Product GUID': 'ea-id', DisplayVersion: '1.2' });
    record('HKLM\\SOFTWARE\\EA Games\\missing', { 'Install Dir': 'D:\\Missing', DisplayName: 'Uninstalled EA' });
    record('HKLM\\SOFTWARE\\Ubisoft\\Launcher\\Installs\\1800', { InstallDir: 'D:\\Games\\Ubisoft' });
    const uninstall = 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\';
    record(uninstall + 'Warcraft', { Publisher: 'Blizzard', DisplayName: 'Warcraft III', InstallLocation: 'D:\\Games\\Warcraft', ProductID: 'w3', DisplayVersion: '2.0' });
    record(uninstall + 'BattleNet', { Publisher: 'Blizzard', DisplayName: 'Battle.net', InstallLocation: 'D:\\Games\\Warcraft' });
    record(uninstall + 'Rockstar', { Publisher: 'Rockstar Games', DisplayName: 'Rockstar Game', UninstallString: '"D:\\Games\\Rockstar\\uninstall.exe"', DisplayVersion: '3.0' });
    record(uninstall + 'SocialClub', { Publisher: 'Rockstar Games', DisplayName: 'Social Club', InstallLocation: 'D:\\Games\\Rockstar' });
    const riot = p.join(env.PROGRAMDATA, 'Riot Games/Metadata');
    const yaml = 'product_id: riot-game\nproduct_name: Riot Game\nproduct_install_full_path: D:/Games/Riot\nproduct_executable_full_path: D:/Games/Riot/bin/game.exe\nproduct_version: 8';
    file(p.join(riot, 'game.product_settings.yaml'), yaml);
    file(p.join(riot, 'duplicate.product_settings.yml'), yaml);
    file(p.join(riot, 'client.product_settings.yaml'), 'product_id: client\nproduct_name: Riot Client');
    game('D:\\Games\\Riot', 'bin\\game.exe');
    file('D:\\XboxGames\\Xbox Game\\Content\\MicrosoftGame.config', '<Game StoreId="store-id" DefaultDisplayName="Xbox Game" Executable="bin/game.exe"/>');
    game('D:\\XboxGames\\Xbox Game\\Content', 'bin\\game.exe');
    file('D:\\XboxGames\\Localized Game\\Content\\MicrosoftGame.config', '<Game StoreId="localized" DefaultDisplayName="ms-resource:title" Executable="missing.exe"/>');
    const itchRoot = 'D:\\Itch Games';
    dir(itchRoot);
    file(p.join(env.APPDATA, 'itch/preferences.json'), JSON.stringify({ installLocations: { one: { path: itchRoot }, duplicate: { path: itchRoot } } }));
    file(p.join(itchRoot, 'cozy-game 123/.itch/receipt.json.gz'), 'marker only, never read');
    game(p.join(itchRoot, 'cozy-game 123'));
    file(p.join(itchRoot, 'downloads/.itch/receipt.json.gz'));
    game(p.join(itchRoot, 'incomplete-game'));
  }
  const lookup = target => {
    if (mode === 'denied') throw new Error('EACCES simulated');
    const node = nodes.get(key(target));
    if (!node) throw new Error('ENOENT simulated: ' + target);
    return node;
  };
  const fakeFs = {
    existsSync(target) { trace.push(['exists', target]); return nodes.has(key(target)); },
    readFileSync(target) { trace.push(['read', target]); const node = lookup(target); return mode === 'malformed' ? '{invalid' : node.data; },
    readdirSync(target, options) { trace.push(['list', target, !!options?.withFileTypes]); return lookup(target).children.map(name => options?.withFileTypes ? { name, isFile: () => !nodes.get(key(p.join(target, name))).dir, isDirectory: () => nodes.get(key(p.join(target, name))).dir } : name); },
    statSync(target) { trace.push(['stat', target]); const node = lookup(target); return { isFile: () => !node.dir, isDirectory: () => node.dir }; },
  };
  const spawn = (command, args, options) => {
    assert.equal(command, 'reg.exe', 'scanners may only query registry, never start a game');
    assert.equal(args[0], 'query'); assert.equal(args[2], '/s'); assert.equal(options.windowsHide, true);
    trace.push(['spawn', command, Array.from(args), { ...options }]);
    const child = new EventEmitter(); child.stdout = new EventEmitter();
    queueMicrotask(() => {
      if (mode === 'denied') return child.emit('error', new Error('Registry unavailable'));
      const output = mode === 'malformed' ? 'invalid registry output' : records.filter(r => r.registry.startsWith(args[1] + '\\')).map(r => r.text).join('\n');
      child.stdout.emit('data', Buffer.from(output)); child.emit('close', 0);
    });
    return child;
  };
  const scope = { fs: fakeFs, path: p, spawn, process: { env } };
  const shared = vm.runInNewContext(helpers + '\n;({ isLikelyGameExe, readSteamLibraryFolders, parseAcfManifest, defaultSteamPath, battleNetProductFor });', scope);
  return { scope, trace, dependencies: { fs: fakeFs, path: p, spawn, process: { env }, ...shared } };
}

(async () => {
  const snapshots = { sharedHelpersSha256: sha(normalize(helpers)), cases: {} };
  const capturedHashes = {};
  for (const mode of ['empty', 'installed', 'denied', 'malformed']) {
    const f = fixture(mode);
    let scanners;
    if (capture) {
      assert.equal(legacyHandlers.length, 10, 'Capture is allowed only before extraction');
      scanners = {};
      const ipcMain = { handle(channel, handler) { scanners[channel] = handler; capturedHashes[channel] = sha(normalize(handler.toString())); } };
      vm.runInNewContext(helpers + '\n' + privateNames.map(n => source(declaration(n))).join('\n') + '\n' + legacyHandlers.map(source).join('\n'), { ...f.scope, ipcMain });
    } else {
      const { createLauncherScanners } = require('../electron/launchers/scanners.cjs');
      scanners = createLauncherScanners(f.dependencies);
    }
    assert.deepEqual(Object.keys(scanners), channels, 'exactly the original ten channels, same order');
    snapshots.cases[mode] = {};
    for (const channel of channels) {
      f.trace.length = 0;
      const result = await scanners[channel]();
      snapshots.cases[mode][channel] = { result: JSON.parse(JSON.stringify(result)), ioSha256: sha(JSON.stringify(f.trace)) };
      if (mode === 'installed') {
        assert.equal(result.ok, true, channel + ' finds its fixture');
        assert(result.items.length > 0, channel + ' has games');
      }
      if (!capture) assert.equal(sha(normalize(scanners[channel].toString())), baseline.handlerSha256[channel], channel + ' original handler body unchanged');
    }
  }
  if (capture) {
    process.stdout.write(JSON.stringify({ ...snapshots, handlerSha256: capturedHashes }, null, 2) + '\n');
    return;
  }
  assert.deepEqual(snapshots, { sharedHelpersSha256: baseline.sharedHelpersSha256, cases: baseline.cases }, 'all results and read/process traces must match pre-refactor behaviour');
  assert.equal(legacyHandlers.length, 0, 'main must not retain duplicate scanner registrations');
  const registration = ast.program.body.find(n => n.type === 'ExpressionStatement' && source(n).includes('Object.assign(remainingIpcServices, createLauncherScanners('));
  assert(registration, 'main assigns the extracted scanner services');
  const deps = fixture('empty').dependencies;
  const services = {};
  const registered = {};
  vm.runInNewContext(source(registration), { ...deps, remainingIpcServices: services, createLauncherScanners: require('../electron/launchers/scanners.cjs').createLauncherScanners });
  require('../electron/ipc/launcher-ipc.cjs').registerLauncherIpc({ registerIpc(channel, handler) { assert(!registered[channel]); registered[channel] = handler; }, services: new Proxy(services, { get(target, key) { return target[key] || (async () => null); } }) });
  for (const channel of Object.keys(registered).filter(channel => !channels.includes(channel))) delete registered[channel];
  assert.deepEqual(Object.keys(registered), channels, 'actual main registration registers all ten handlers exactly once');
  for (const channel of channels) assert.deepEqual(JSON.parse(JSON.stringify(await registered[channel]())), baseline.cases.empty[channel].result);
  // Execute the entire entry point, with Electron readiness withheld. This tests
  // real require/registration order and shared closures, not just a copied loop.
  // UI startup, network, writes and real subprocesses are deliberately unavailable.
  const startup = fixture('installed');
  const nativeHandlers = {};
  const deny = label => () => { throw new Error('Unexpected side effect: ' + label); };
  const noIo = label => new Proxy({}, { get: (_, name) => deny(label + '.' + String(name)) });
  const nativeRequire = createRequire(path.join(root, 'electron/main.js'));
  const fakeApp = { getPath: () => 'C:\\VirtualAppData', getVersion: () => '1.7.5', getFileIcon: deny('app.getFileIcon'), setLoginItemSettings: deny('app.setLoginItemSettings'), getLoginItemSettings: deny('app.getLoginItemSettings'), setAppUserModelId() {}, requestSingleInstanceLock: () => true, on() {}, whenReady: () => ({ then() {} }) };
  const mockedModules = {
    electron: {
      app: fakeApp,
      ipcMain: { handle(channel, handler) { assert(!nativeHandlers[channel], 'duplicate IPC ' + channel); nativeHandlers[channel] = handler; }, on() {} },
      dialog: { showOpenDialog: deny('dialog.showOpenDialog') },
      shell: { readShortcutLink: deny('shell.readShortcutLink'), openExternal: deny('shell.openExternal'), openPath: deny('shell.openPath'), showItemInFolder: deny('shell.showItemInFolder') },
    },
    path: path.win32, fs: startup.dependencies.fs, 'fs/promises': noIo('fs/promises'),
    child_process: { spawn: startup.dependencies.spawn, execFile: deny('execFile') },
    crypto, http: noIo('http'), https: noIo('https'), net: noIo('net'), os: new Proxy({ release: () => '10.0-test' }, { get: (target, name) => target[name] || deny('os.' + String(name)) }),
    './discord-config': { DISCORD_APP_ID: '' },
  };
  vm.runInNewContext(main, {
    require(name) {
      if (Object.hasOwn(mockedModules, name)) return mockedModules[name];
      const knownService = ['./themes/custom-theme-service.cjs', './launchers/scanners.cjs', './storage/app-storage.cjs', './storage/document-store.cjs', './storage/storage-scan-service.cjs', './ipc/registry.cjs', './ipc/failure-log.cjs', './diagnostics/diagnostic-recorder.cjs', './system/system-health-service.cjs', './playtime/playtime-history-service.cjs', './images/image-cache-service.cjs', './app/app-os-service.cjs', './app/app-lifecycle-service.cjs', './doctor/launch-doctor-service.cjs', './saves/save-service.cjs', './optimize/junk-service.cjs', './optimize/process-inspection-service.cjs', './game/external-game-watch-service.cjs', './game/game-launch-service.cjs', './emulation/rom-scan-service.cjs', './providers/store-provider-service.cjs', './providers/steam-achievement-service.cjs', './providers/steamgriddb-artwork-service.cjs', './providers/public-web-provider-service.cjs', './providers/specialist-metadata-provider-service.cjs', './providers/metadata-candidate-service.cjs', './providers/gemini-provider-service.cjs', './providers/news-normalization-service.cjs', './providers/public-news-provider-service.cjs', './providers/weekly-release-provider-service.cjs', './providers/steam-news-provider-service.cjs', './providers/owned-news-provider-service.cjs', './providers/update-history-provider-service.cjs', './providers/deals-provider-service.cjs', './providers/update-scan-coordinator-service.cjs', './providers/update-source-discovery-service.cjs', './providers/installed-version-evidence-service.cjs', './providers/update-page-version-service.cjs', './providers/independent-update-assessment-service.cjs', './widgets/widget-package-service.cjs'].includes(name);
      const domainContract = /^\.\/ipc\/[a-z-]+-ipc\.cjs$/.test(name);
      assert(knownService || domainContract, `unexpected local module ${name}`);
      return nativeRequire(name);
    },
    process: { ...startup.dependencies.process, platform: 'win32', arch: 'x64', on() {} }, __dirname: path.join(root, 'electron'),
    console, Buffer, URL, setTimeout: deny('timer'), setInterval: deny('interval'),
  }, { filename: 'isolated-main.js', timeout: 5000 });
  assert.equal(Object.keys(nativeHandlers).length, 104, 'all current native IPC endpoints still registered');
  for (const channel of channels) {
    startup.trace.length = 0;
    const result = await nativeHandlers[channel]();
    assert.deepEqual({ result: JSON.parse(JSON.stringify(result)), ioSha256: sha(JSON.stringify(startup.trace)) }, baseline.cases.installed[channel], 'full main integration ' + channel);
  }
  const pkg = require('../package.json');
  assert(pkg.build.files.includes('electron/**/*'), 'new native module included in packaged app');
  console.log('PASS: 40 scanner fixture runs plus 10 full-main integration scans match pre-refactor results and I/O traces; unchanged handler bodies/shared helpers, all 104 IPC registrations and packaging inclusion verified. UI readiness withheld. No real disk scans, registry calls, library writes or game launches.');
})().catch(error => { console.error(error); process.exitCode = 1; });
