const assert = require('node:assert/strict');
const { registerGameIpc } = require('../electron/ipc/game-ipc.cjs');
const { registerSavesIpc } = require('../electron/ipc/saves-ipc.cjs');
const { registerOptimizeIpc } = require('../electron/ipc/optimize-ipc.cjs');
const { registerStorageIpc } = require('../electron/ipc/storage-ipc.cjs');
const { registerScanIpc } = require('../electron/ipc/scan-ipc.cjs');
const { registerMetadataIpc } = require('../electron/ipc/metadata-ipc.cjs');
const { registerNewsIpc } = require('../electron/ipc/news-ipc.cjs');
const { registerUpdatesIpc } = require('../electron/ipc/updates-ipc.cjs');
const { registerReleasesIpc } = require('../electron/ipc/releases-ipc.cjs');
const { registerSteamIpc } = require('../electron/ipc/steam-ipc.cjs');
const { registerGogIpc } = require('../electron/ipc/gog-ipc.cjs');
const { registerGeminiIpc } = require('../electron/ipc/gemini-ipc.cjs');
const { registerWebIpc } = require('../electron/ipc/web-ipc.cjs');
const { registerDealsIpc } = require('../electron/ipc/deals-ipc.cjs');
const { registerToolsIpc } = require('../electron/ipc/tools-ipc.cjs');
const { registerLauncherIpc } = require('../electron/ipc/launcher-ipc.cjs');
const { registerAppOsIpc } = require('../electron/ipc/app-os-ipc.cjs');
const { registerAppLifecycleIpc } = require('../electron/ipc/app-lifecycle-ipc.cjs');
const { registerPersistenceIpc } = require('../electron/ipc/persistence-ipc.cjs');
const { registerPlaytimeIpc } = require('../electron/ipc/playtime-ipc.cjs');
const { registerImageIpc } = require('../electron/ipc/image-ipc.cjs');
const { registerDoctorIpc } = require('../electron/ipc/doctor-ipc.cjs');
const { registerShellIpc } = require('../electron/ipc/shell-ipc.cjs');
const { registerExeIpc } = require('../electron/ipc/exe-ipc.cjs');
const { registerWindowIpc } = require('../electron/ipc/window-ipc.cjs');
const { registerDialogIpc } = require('../electron/ipc/dialog-ipc.cjs');
const { registerSystemIpc } = require('../electron/ipc/system-ipc.cjs');

function register(registerDomain, channels, results = {}) {
  const calls = [];
  const handlers = {};
  const services = Object.fromEntries(channels.map(channel => [channel, function service(event, ...args) {
    calls.push({ channel, event, args, receiver: this });
    return Object.prototype.hasOwnProperty.call(results, channel) ? results[channel] : { forwarded: channel, args };
  }]));
  registerDomain({ registerIpc(channel, handler) { handlers[channel] = handler; }, services });
  return { calls, handlers, services, results };
}

async function verifyGuard({ handlers, calls, results = {} }, channel, validArgs, invalidArgs, invalidShape = {}, exactInvalid) {
  const event = { sender: { id: 7 } };
  const beforeInvalid = calls.length;
  const invalidResult = await handlers[channel](event, ...invalidArgs);
  assert.equal(calls.length, beforeInvalid, `${channel} must reject malformed input before its service`);
  if (exactInvalid !== undefined) assert.deepEqual(invalidResult, exactInvalid, `${channel} invalid result`);
  for (const [key, value] of Object.entries(invalidShape)) assert.deepEqual(invalidResult[key], value, `${channel} invalid ${key}`);

  const receiver = { channel };
  const validResult = await handlers[channel].call(receiver, event, ...validArgs);
  const call = calls.at(-1);
  assert.equal(call.channel, channel);
  assert.equal(call.event, event);
  assert.deepEqual(call.args, validArgs, `${channel} must forward valid arguments without normalization`);
  assert.equal(call.receiver, receiver, `${channel} must retain the service receiver`);
  const expected = Object.prototype.hasOwnProperty.call(results, channel) ? results[channel] : { forwarded: channel, args: validArgs };
  assert.deepEqual(validResult, expected);
}

async function verifyResponseGuard(contract, channel, validArgs, malformed, invalidShape = {}, exactInvalid) {
  const previous = contract.results[channel];
  const before = contract.calls.length;
  contract.results[channel] = malformed;
  try {
    const result = await contract.handlers[channel]({ sender: { id: 7 } }, ...validArgs);
    assert.equal(contract.calls.length, before + 1, `${channel} must call its service for a valid request`);
    if (exactInvalid !== undefined) {
      assert.deepEqual(result, exactInvalid, `${channel} malformed service result fallback`);
      return;
    }
    assert.equal(result?.ok, false, `${channel} must reject a malformed service result`);
    assert.equal(result?.code, 'INVALID_RESPONSE', `${channel} invalid response code`);
    for (const [key, value] of Object.entries(invalidShape)) assert.deepEqual(result?.[key], value, `${channel} invalid response ${key}`);
  } finally {
    contract.results[channel] = previous;
  }
}

async function verifyServiceResultPreserved(contract, channel, validArgs, serviceResult) {
  const previous = contract.results[channel];
  contract.results[channel] = serviceResult;
  try {
    assert.deepEqual(
      await contract.handlers[channel]({ sender: { id: 7 } }, ...validArgs),
      serviceResult,
      `${channel} must preserve a valid service failure/result`,
    );
  } finally {
    contract.results[channel] = previous;
  }
}

async function verifyRejected(handlers, calls, channel, invalidArgs, invalidShape = {}, exactInvalid) {
  const before = calls.length;
  const result = await handlers[channel]({ sender: { id: 7 } }, ...invalidArgs);
  assert.equal(calls.length, before, `${channel} must reject malformed input before its service`);
  if (exactInvalid !== undefined) assert.deepEqual(result, exactInvalid, `${channel} invalid result`);
  for (const [key, value] of Object.entries(invalidShape)) assert.deepEqual(result?.[key], value, `${channel} invalid ${key}`);
}

async function main() {
  const gameChannels = ['game:scanExternalNow', 'game:watchExternal', 'game:launch', 'game:armLaunch'];
  const gameResults = {
    'game:scanExternalNow': { ok: true, active: false, gameId: null, name: '' },
    'game:watchExternal': { ok: true, watching: 1, ignored: 0 },
    'game:launch': { ok: true },
    'game:armLaunch': { ok: true, token: 'launch-token' },
  };
  const game = register(registerGameIpc, gameChannels, gameResults);
  await verifyGuard(game, 'game:watchExternal', [{ games: [{ id: 'g1', name: 'Game', exePath: 'C:\\Games\\Game.exe' }] }], [{ games: 'not-an-array' }], { ok: false, code: 'INVALID_REQUEST' });
  assert.deepEqual(await game.handlers['game:watchExternal']({}, {}), gameResults['game:watchExternal'], 'empty watch payload must retain stop-watching behavior');
  await verifyGuard(game, 'game:launch', [{ exePath: 'C:\\Games\\Game.exe', launchArgs: '--safe', gameId: 'g1', name: 'Game', launchToken: 'token' }], [{ exePath: ['C:\\Games\\Game.exe'] }], { ok: false, code: 'INVALID_REQUEST' });
  assert.deepEqual(await game.handlers['game:scanExternalNow']({}), gameResults['game:scanExternalNow']);
  assert.deepEqual(await game.handlers['game:armLaunch']({ sender: { id: 7 } }), gameResults['game:armLaunch']);
  await verifyResponseGuard(game, 'game:scanExternalNow', [], { ok: true, active: 'no' }, { active: false, gameId: null, name: '' });
  await verifyResponseGuard(game, 'game:watchExternal', [{ games: [] }], { ok: true, watching: -1, ignored: 0 }, { watching: 0, ignored: 0 });
  await verifyResponseGuard(game, 'game:launch', [{ exePath: 'C:\\Games\\Game.exe' }], { ok: true, target: [] });
  await verifyResponseGuard(game, 'game:armLaunch', [], { ok: true, token: '' });
  await verifyServiceResultPreserved(game, 'game:scanExternalNow', [], { ok: false, busy: true });
  await verifyServiceResultPreserved(game, 'game:launch', [{ exePath: 'C:\\Games\\Game.exe' }], { ok: false, error: 'Launch blocked.' });
  await verifyServiceResultPreserved(game, 'game:armLaunch', [], { ok: false, error: 'Still starting.' });

  const saveChannels = ['saves:findCandidates', 'saves:detectCommon', 'saves:restore', 'saves:createBackup', 'saves:listBackups', 'saves:inspect'];
  const backup = { gameId: 'g1', gameName: 'Game', originalPath: 'C:\\Saves', createdAt: 1, files: 2, bytes: 3, truncated: false, backupPath: 'C:\\Backups\\g1' };
  const saveResults = {
    'saves:findCandidates': { ok: true, candidates: [{ path: 'C:\\Saves', matchedTerms: 1 }], visited: 20, truncated: false },
    'saves:detectCommon': { ok: true, candidates: [{ path: 'C:\\Saves', source: 'Documents', score: 5 }] },
    'saves:restore': { ok: true, restoredTo: 'C:\\Restored', files: 2, bytes: 3, truncated: false },
    'saves:createBackup': { ok: true, backup },
    'saves:listBackups': { ok: true, backups: [backup] },
    'saves:inspect': { ok: true, path: 'C:\\Saves', files: 2, bytes: 3, truncated: false },
  };
  const saves = register(registerSavesIpc, saveChannels, saveResults);
  await verifyGuard(saves, 'saves:findCandidates', [{ root: 'C:\\Saves', gameName: 'Game' }], [{ root: {}, gameName: 'Game' }], { ok: false, code: 'INVALID_REQUEST', candidates: [] });
  await verifyGuard(saves, 'saves:detectCommon', [{ gameName: 'Game', exePath: 'C:\\Games\\Game.exe', appid: 123 }], [{ gameName: '' }], { ok: false, code: 'INVALID_REQUEST', candidates: [] });
  await verifyGuard(saves, 'saves:restore', [{ backupPath: 'C:\\Backup', savePath: 'C:\\Saves', mode: 'safe-copy' }], [{ backupPath: 'C:\\Backup', savePath: 'C:\\Saves', mode: 'overwrite' }], { ok: false, code: 'INVALID_REQUEST' });
  await verifyGuard(saves, 'saves:createBackup', [{ gameId: 'g1', gameName: 'Game', savePath: 'C:\\Saves' }], [{ gameId: '', savePath: 'C:\\Saves' }], { ok: false, code: 'INVALID_REQUEST' });
  await verifyGuard(saves, 'saves:listBackups', ['g1'], [{}], { ok: false, code: 'INVALID_REQUEST', backups: [] });
  await verifyGuard(saves, 'saves:inspect', ['C:\\Saves'], [''], { ok: false, code: 'INVALID_REQUEST' });
  await verifyResponseGuard(saves, 'saves:findCandidates', [{ root: 'C:\\Saves', gameName: 'Game' }], { ok: true, candidates: [], visited: -1, truncated: false }, { candidates: [] });
  await verifyResponseGuard(saves, 'saves:detectCommon', [{ gameName: 'Game' }], { ok: true, candidates: [{ path: [] }] }, { candidates: [] });
  await verifyResponseGuard(saves, 'saves:restore', [{ backupPath: 'C:\\Backup', savePath: 'C:\\Saves' }], { ok: true, restoredTo: 'C:\\Saves', files: 'two' });
  await verifyResponseGuard(saves, 'saves:createBackup', [{ gameId: 'g1', savePath: 'C:\\Saves' }], { ok: true, backup: { backupPath: '' } });
  await verifyResponseGuard(saves, 'saves:listBackups', ['g1'], { ok: true, backups: 'all' }, { backups: [] });
  await verifyResponseGuard(saves, 'saves:inspect', ['C:\\Saves'], { ok: true, path: 'C:\\Saves', files: 2, bytes: -1, truncated: false });
  await verifyServiceResultPreserved(saves, 'saves:restore', [{ backupPath: 'C:\\Backup', savePath: 'C:\\Saves' }], { ok: false, conflict: true, error: 'Destination is not empty.' });
  await verifyServiceResultPreserved(saves, 'saves:listBackups', ['g1'], { ok: false, error: 'Backup folder unavailable.', backups: [] });

  const optimizeChannels = ['optimize:trashJunk', 'optimize:scanJunk', 'optimize:closeProcess', 'optimize:inspectGaming'];
  const optimizeResults = {
    'optimize:trashJunk': { ok: true, trashed: [], failed: [], reclaimedBytes: 0 },
    'optimize:scanJunk': { ok: true, items: [], totalBytes: 0, scannedAt: 1, visited: 0, scope: 'Known locations only.' },
    'optimize:closeProcess': { ok: true, name: 'helper.exe' },
    'optimize:inspectGaming': { ok: true, processes: [], gpu: [], gpuAvailable: false, os: {}, settings: {}, inspectedAt: 1 },
  };
  const optimize = register(registerOptimizeIpc, optimizeChannels, optimizeResults);
  await verifyGuard(optimize, 'optimize:trashJunk', [{ tokens: ['one', 'two'] }], [{ tokens: new Array(101).fill('token') }], { ok: false, code: 'INVALID_REQUEST', trashed: [], failed: [], reclaimedBytes: 0 });
  assert.deepEqual(await optimize.handlers['optimize:trashJunk']({}, {}), optimizeResults['optimize:trashJunk']);
  await verifyGuard(optimize, 'optimize:scanJunk', [{ games: [{ id: 'g1', name: 'Game', exePath: 'C:\\Games\\Game.exe', saveFolder: 'C:\\Saves' }] }], [{ games: [{ exePath: 42 }] }], { ok: false, code: 'INVALID_REQUEST', items: [], totalBytes: 0 });
  assert.deepEqual(await optimize.handlers['optimize:scanJunk']({}, {}), optimizeResults['optimize:scanJunk']);
  await verifyGuard(optimize, 'optimize:closeProcess', [{ pid: 1234, name: 'helper.exe' }], [{ pid: '1234', name: 'helper.exe' }], { ok: false, code: 'INVALID_REQUEST' });
  assert.deepEqual(await optimize.handlers['optimize:inspectGaming']({}), optimizeResults['optimize:inspectGaming']);
  await verifyResponseGuard(optimize, 'optimize:trashJunk', [{ tokens: [] }], { ok: true, trashed: [{}], failed: [], reclaimedBytes: 0 }, { trashed: [], failed: [], reclaimedBytes: 0 });
  await verifyResponseGuard(optimize, 'optimize:scanJunk', [{ games: [] }], { ok: true, items: [], totalBytes: 0 }, { items: [], totalBytes: 0 });
  await verifyResponseGuard(optimize, 'optimize:closeProcess', [{ pid: 1234, name: 'helper.exe' }], { ok: true, name: [] });
  await verifyResponseGuard(optimize, 'optimize:inspectGaming', [], { ok: true, processes: 'all' }, { processes: [], gpu: [], gpuAvailable: false, os: {}, settings: {} });
  await verifyServiceResultPreserved(optimize, 'optimize:trashJunk', [{ tokens: ['one'] }], { ok: false, trashed: [], failed: [{ token: 'one', error: 'Stale scan result' }], reclaimedBytes: 0 });
  await verifyServiceResultPreserved(optimize, 'optimize:closeProcess', [{ pid: 1234, name: 'helper.exe' }], { ok: false, error: 'Process list is stale.' });
  await verifyServiceResultPreserved(optimize, 'optimize:inspectGaming', [], { ok: false, error: 'Windows performance details are unavailable.' });

  const storageResult = { ok: true, results: [{ id: 'g1', name: 'Game', exePath: 'C:\\Games\\Game.exe', root: 'C:\\Games', bytes: 10, files: 1, modBytes: 0, modFiles: 0, truncated: false, cached: false }], skipped: [], scannedAt: 1 };
  const storage = register(registerStorageIpc, ['storage:scanGames'], { 'storage:scanGames': storageResult });
  await verifyGuard(storage, 'storage:scanGames', [{ games: [{ id: 'g1', name: 'Game', exePath: 'C:\\Games\\Game.exe', launcher: 'steam' }], force: true }], [{ games: [], force: 'yes' }], { ok: false, code: 'INVALID_REQUEST', results: [], skipped: [] });
  assert.deepEqual(await storage.handlers['storage:scanGames']({}, {}), storageResult);
  await verifyResponseGuard(storage, 'storage:scanGames', [{ games: [] }], { ok: true, results: [], skipped: [] }, { results: [], skipped: [] });

  const scanResult = [{ folder: 'D:\\Games\\Game', folderName: 'Game', exe: 'D:\\Games\\Game\\Game.exe', alternativeExes: [] }];
  const scan = register(registerScanIpc, ['scan:directory'], { 'scan:directory': scanResult });
  await verifyGuard(scan, 'scan:directory', ['D:\\Games', ['steamapps'], { deep: true }], ['D:\\Games', 'steamapps', { deep: true }], { length: 0 });
  assert.deepEqual(await scan.handlers['scan:directory']({}, 'D:\\Games'), scanResult);
  await verifyResponseGuard(scan, 'scan:directory', ['D:\\Games'], [{ folder: 'D:\\Games', exe: [] }], {}, []);

  const metadataChannels = ['metadata:auto', 'metadata:expandCandidate', 'metadata:listCandidates', 'metadata:deriveHints'];
  const metadataResults = {
    'metadata:auto': { source: 'steam', name: 'Portal 2', appid: '620' },
    'metadata:expandCandidate': { source: 'steam', name: 'Portal 2', appid: '620' },
    'metadata:listCandidates': { candidates: [{ source: 'steam', id: '620', name: 'Portal 2', image: '', year: '2011', shortDescription: '', raw: {} }] },
    'metadata:deriveHints': { hints: [{ query: 'Portal 2', evidence: 'Executable name' }] },
  };
  const metadata = register(registerMetadataIpc, metadataChannels, metadataResults);
  await verifyGuard(metadata, 'metadata:auto', [{ query: 'Portal 2', skipSources: ['gog'], force: true }], [{ query: 'x'.repeat(501) }], {}, null);
  await verifyGuard(metadata, 'metadata:expandCandidate', [{ candidate: { source: 'steam', id: '620', name: 'Portal 2' } }], [{ candidate: { source: 'unknown', id: '620' } }], {}, null);
  await verifyGuard(metadata, 'metadata:listCandidates', [{ source: 'gog', query: 'Cyberpunk 2077' }], [{ source: 'unknown', query: 'Cyberpunk 2077' }], { candidates: [] });
  await verifyGuard(metadata, 'metadata:deriveHints', [{ exePath: 'C:\\Games\\Game.exe', currentName: 'Game' }], [{ exePath: 42, currentName: 'Game' }], { hints: [] });
  await verifyResponseGuard(metadata, 'metadata:auto', [{ query: 'Portal 2' }], { source: 'steam', name: [] }, {}, null);
  await verifyResponseGuard(metadata, 'metadata:expandCandidate', [{ candidate: { source: 'steam', id: '620', name: 'Portal 2' } }], [], {}, null);
  await verifyResponseGuard(metadata, 'metadata:listCandidates', [{ source: 'steam', query: 'Portal 2' }], { candidates: [{ source: 'steam', id: '', name: 'Portal 2' }] }, {}, { candidates: [], error: 'The metadata candidate service returned an invalid result.', code: 'INVALID_RESPONSE' });
  await verifyResponseGuard(metadata, 'metadata:deriveHints', [{ currentName: 'Portal 2' }], { hints: [{ query: '', evidence: 'Name' }] }, {}, { hints: [], error: 'Metadata hints returned an invalid result.', code: 'INVALID_RESPONSE' });
  await verifyServiceResultPreserved(metadata, 'metadata:auto', [{ query: 'Unknown' }], null);

  const newsChannels = ['news:latestForGame', 'news:fetchAll', 'news:fetchSteam'];
  const newsItem = { platform: 'steam', title: 'Patch notes', url: 'https://example.test/news', date: 1, snippet: 'Updated.' };
  const newsResults = {
    'news:latestForGame': { ok: true, item: newsItem, cached: false },
    'news:fetchAll': { ok: true, items: [newsItem], counts: { steam: 1, itch: 0, gog: 0, officialWeb: 0, web: 0 }, sources: { steam: 1, itch: 0, gog: 0, publicWeb: 0 }, fetchedAt: 1, cached: false },
    'news:fetchSteam': { ok: true, items: [newsItem], fetchedAt: 1, cached: false },
  };
  const news = register(registerNewsIpc, newsChannels, newsResults);
  const newsGame = { id: 'g1', appid: 620, name: 'Portal 2', website: 'https://example.test', source: 'steam', launcher: 'steam' };
  await verifyGuard(news, 'news:latestForGame', [newsGame], [{ ...newsGame, name: [] }], { ok: false, code: 'INVALID_REQUEST', item: null });
  await verifyGuard(news, 'news:fetchAll', [{ games: [newsGame], days: 14, force: false }], [{ games: [newsGame], days: 0 }], { ok: false, code: 'INVALID_REQUEST', items: [] });
  await verifyGuard(news, 'news:fetchSteam', [{ games: [newsGame], days: 30, force: true }], [{ games: 'all', days: 30 }], { ok: false, code: 'INVALID_REQUEST', items: [] });
  await verifyResponseGuard(news, 'news:latestForGame', [newsGame], { ok: true, item: { title: 'Missing fields' } }, { item: null });
  await verifyResponseGuard(news, 'news:fetchAll', [{ games: [newsGame], days: 14 }], { ok: true, items: [], counts: {}, sources: {} }, { items: [], counts: {}, sources: {} });
  await verifyResponseGuard(news, 'news:fetchSteam', [{ games: [newsGame], days: 14 }], { ok: true, items: 'all', fetchedAt: 1 }, { items: [] });
  await verifyServiceResultPreserved(news, 'news:latestForGame', [null], { ok: true, item: null });

  const updateChannels = ['updates:history', 'updates:scan'];
  const updateResults = {
    'updates:history': { ok: true, entries: [{ version: '1.1', date: '2026-09-15', summary: 'Patch.', url: 'https://example.test/patches', newerThanInstalled: true }], sourceUrl: 'https://example.test/patches', currentVersion: '1.0', fetchedAt: 1 },
    'updates:scan': { ok: true, checked: 1, launcherManagedCount: 1, items: [], needsSetup: [], ledger: [{ gameId: 'g1', status: 'launcher-managed' }], scannedAt: 1, confidence: 'launcher-manifest-and-local-version' },
  };
  const updates = register(registerUpdatesIpc, updateChannels, updateResults);
  const updateGame = { id: 'g1', name: 'Game', appid: 620, launcher: 'steam', source: 'steam', steamOwned: true, installedVersion: '1.0', updateWatchUrl: 'https://example.test/patches', website: 'https://example.test', exePath: 'C:\\Games\\Game.exe' };
  await verifyGuard(updates, 'updates:history', [{ url: 'https://example.test/patches', currentVersion: '1.0' }], [{ url: 'file:///C:/secret.txt' }], { ok: false, code: 'INVALID_REQUEST', entries: [] });
  await verifyGuard(updates, 'updates:scan', [{ games: [updateGame], force: true }], [{ games: [{ ...updateGame, updateWatchUrl: 'file:///C:/secret.txt' }] }], { ok: false, code: 'INVALID_REQUEST', items: [], needsSetup: [], ledger: [], checked: 0 });
  await verifyResponseGuard(updates, 'updates:history', [{ url: 'https://example.test/patches' }], { ok: true, entries: 'all' }, { entries: [] });
  await verifyResponseGuard(updates, 'updates:scan', [{ games: [updateGame] }], { ok: true, checked: -1, items: [], needsSetup: [], ledger: [] }, { items: [], needsSetup: [], ledger: [], checked: 0 });
  await verifyServiceResultPreserved(updates, 'updates:history', [{ url: 'https://example.test/patches' }], { ok: false, entries: [], error: 'Unavailable.' });

  const releaseResults = { ok: true, items: [{ id: 'steam-620', appid: 620, title: 'Portal 2', url: 'https://store.example/620', releaseAt: 1 }], tier: 'major', criteria: 'Verified release.', fetchedAt: 1, cached: false };
  const releases = register(registerReleasesIpc, ['releases:weekly'], { 'releases:weekly': releaseResults });
  await verifyGuard(releases, 'releases:weekly', [{ force: true }], [{ force: 'yes' }], { ok: false, code: 'INVALID_REQUEST', items: [] });
  assert.deepEqual(await releases.handlers['releases:weekly']({}), releaseResults);
  await verifyResponseGuard(releases, 'releases:weekly', [{ force: true }], { ok: true, items: [], tier: 'unknown', criteria: '', fetchedAt: 1 }, { items: [] });
  await verifyServiceResultPreserved(releases, 'releases:weekly', [{ force: true }], { ok: false, items: [], error: 'Unavailable.' });

  const steamChannels = ['steam:importPlaytime', 'steam:manifest', 'steam:details', 'steam:search'];
  const steamResults = {
    'steam:importPlaytime': { ok: true, data: { 620: { playtime: 120, lastPlayed: 1 } }, ownedAppids: ['620'], currentAccount: { steamid3: '12345', personaName: 'Player' }, count: 1, ownedCount: 1, debug: {}, cached: false },
    'steam:manifest': { ok: true, appid: '620', name: 'Portal 2', buildid: '42', lastUpdated: 1, sizeOnDisk: 2, stateFlags: 4, bytesToDownload: 0, bytesDownloaded: 0, updateResult: '', library: 'C:\\Steam', cached: false },
    'steam:details': { appid: '620', name: 'Portal 2', screenshots: [] },
    'steam:search': [{ appid: 620, name: 'Portal 2', tinyImage: 'https://cdn.example/620.jpg', price: 999 }],
  };
  const steam = register(registerSteamIpc, steamChannels, steamResults);
  await verifyGuard(steam, 'steam:importPlaytime', [{ force: true }], [{ force: 1 }], { ok: false, code: 'INVALID_REQUEST' });
  await verifyGuard(steam, 'steam:manifest', [620], ['../../secret'], { ok: false, code: 'INVALID_REQUEST' });
  await verifyGuard(steam, 'steam:details', ['620'], [{}], {}, null);
  await verifyGuard(steam, 'steam:search', ['Portal 2'], [new Array(600).fill('x').join('')], {}, []);
  await verifyResponseGuard(steam, 'steam:importPlaytime', [{ force: true }], { ok: true, data: [], ownedAppids: [] }, { data: {}, ownedAppids: [], currentAccount: null });
  await verifyResponseGuard(steam, 'steam:manifest', ['620'], { ok: true, appid: '620' });
  await verifyResponseGuard(steam, 'steam:details', ['620'], { appid: '620', name: [] }, {}, null);
  await verifyResponseGuard(steam, 'steam:search', ['Portal 2'], [{ appid: 'bad', name: 'Wrong' }], {}, []);
  await verifyServiceResultPreserved(steam, 'steam:manifest', ['620'], { ok: false, error: 'Manifest not found.' });
  await verifyServiceResultPreserved(steam, 'steam:details', ['620'], null);

  const gog = register(registerGogIpc, ['gog:search'], { 'gog:search': [{ id: '1', title: 'Cyberpunk 2077' }] });
  await verifyGuard(gog, 'gog:search', ['Cyberpunk 2077'], [42], {}, []);
  await verifyResponseGuard(gog, 'gog:search', ['Cyberpunk 2077'], [{ id: null, title: 'Wrong' }], {}, []);

  const geminiChannels = ['gemini:assistant', 'gemini:test', 'gemini:metadata'];
  const geminiResults = {
    'gemini:assistant': { ok: true, model: 'gemini-2.5-flash', text: 'Try Portal 2.' },
    'gemini:test': { ok: true, model: 'gemini-2.5-flash', name: 'Portal 2' },
    'gemini:metadata': { ok: true, model: 'gemini-2.5-flash', metadata: { name: 'Portal 2', genres: ['Puzzle'] } },
  };
  const gemini = register(registerGeminiIpc, geminiChannels, geminiResults);
  await verifyGuard(gemini, 'gemini:assistant', [{ apiKey: 'key', message: 'What should I play?', model: 'gemini-2.5-flash', history: [{ role: 'user', text: 'Hello' }], libraryContext: 'Portal 2' }], [{ apiKey: 'key', message: 'x'.repeat(1801) }], { ok: false, code: 'INVALID_REQUEST' });
  await verifyGuard(gemini, 'gemini:test', [{ apiKey: 'key', model: 'gemini-2.5-flash' }], [{ apiKey: {} }], { ok: false, code: 'INVALID_REQUEST' });
  await verifyGuard(gemini, 'gemini:metadata', [{ apiKey: 'key', query: 'Portal 2', model: 'gemini-2.5-flash' }], [{ apiKey: 'key', query: [] }], { ok: false, code: 'INVALID_REQUEST' });
  await verifyResponseGuard(gemini, 'gemini:assistant', [{ apiKey: 'key', message: 'Hello' }], { ok: true, model: 'gemini-2.5-flash', text: '' });
  await verifyResponseGuard(gemini, 'gemini:test', [{ apiKey: 'key' }], { ok: true, model: '', name: 'Portal 2' });
  await verifyResponseGuard(gemini, 'gemini:metadata', [{ apiKey: 'key', query: 'Portal 2' }], { ok: true, model: 'gemini-2.5-flash', metadata: [] });
  await verifyServiceResultPreserved(gemini, 'gemini:assistant', [{ apiKey: 'key', message: 'Hello' }], { ok: false, error: 'AI unavailable.' });

  const webResult = { results: [{ url: 'https://example.test/game', title: 'Game', snippet: 'A game.' }], synthesized: { name: 'Game', source: 'web' } };
  const web = register(registerWebIpc, ['web:search'], { 'web:search': webResult });
  await verifyGuard(web, 'web:search', ['Portal 2 game'], [{ query: 'Portal 2' }], { results: [], synthesized: null });
  await verifyResponseGuard(web, 'web:search', ['Portal 2 game'], { results: 'all', synthesized: null }, {}, { results: [], synthesized: null, error: 'The web-search service returned an invalid result.', code: 'INVALID_RESPONSE' });

  const toolChannels = ['tools:fetchMetadata', 'tools:installManagedTool', 'tools:verifyManagedTool', 'tools:detectGpuSetup'];
  const toolResults = {
    'tools:fetchMetadata': { source: 'Windows executable', name: 'GPU-Z', shortDescription: 'GPU details.', about: 'GPU details.', developers: ['TechPowerUp'], genres: ['Hardware monitor'], metadataFetchedAt: 1 },
    'tools:installManagedTool': { ok: true, exePath: 'C:\\Tools\\GPU-Z.exe', installed: true, mode: 'portable', officialPage: 'https://example.test/gpuz' },
    'tools:verifyManagedTool': { ok: true, exePath: 'C:\\Tools\\CPU-Z.exe' },
    'tools:detectGpuSetup': { ok: true, adapters: [{ name: 'GPU', videoProcessor: '', driverVersion: '1.0', pnpDeviceId: '', memoryBytes: 1024 }], primary: { name: 'GPU', videoProcessor: '', driverVersion: '1.0', pnpDeviceId: '', memoryBytes: 1024, vendor: 'generic' }, controlCenter: { name: 'Graphics settings' }, utilities: { gpuz: { exePath: '' }, cpuz: { exePath: '' } } },
  };
  const toolContracts = register(registerToolsIpc, toolChannels, toolResults);
  await verifyGuard(toolContracts, 'tools:fetchMetadata', [{ query: 'GPU-Z', exePath: 'C:\\Tools\\GPU-Z.exe' }], [{ query: '', exePath: '' }], { ok: false, code: 'INVALID_REQUEST' });
  await verifyGuard(toolContracts, 'tools:installManagedTool', ['gpuz'], ['unknown'], { ok: false, code: 'INVALID_REQUEST' });
  await verifyGuard(toolContracts, 'tools:verifyManagedTool', [{ toolId: 'cpuz', exePath: 'C:\\Tools\\CPU-Z.exe' }], [{ toolId: 'cpuz', exePath: 42 }], { ok: false, code: 'INVALID_REQUEST' });
  assert.deepEqual(await toolContracts.handlers['tools:detectGpuSetup']({}), toolResults['tools:detectGpuSetup']);
  await verifyResponseGuard(toolContracts, 'tools:fetchMetadata', [{ query: 'GPU-Z' }], { source: 'Windows', name: '', developers: [], genres: [], metadataFetchedAt: 1 });
  await verifyResponseGuard(toolContracts, 'tools:installManagedTool', ['gpuz'], { ok: true, exePath: [] });
  await verifyResponseGuard(toolContracts, 'tools:verifyManagedTool', [{ toolId: 'cpuz', exePath: 'C:\\Tools\\CPU-Z.exe' }], { ok: true, exePath: '' });
  await verifyResponseGuard(toolContracts, 'tools:detectGpuSetup', [], { ok: true, adapters: 'all' }, { adapters: [] });
  await verifyServiceResultPreserved(toolContracts, 'tools:installManagedTool', ['gpuz'], { ok: false, error: 'Download unavailable.' });

  const dealResults = [{ id: 'steam-620', platform: 'steam', title: 'Portal 2', url: 'https://store.example/620' }];
  const deals = register(registerDealsIpc, ['deals:fetch'], { 'deals:fetch': dealResults });
  assert.deepEqual(await deals.handlers['deals:fetch']({}), dealResults);
  await verifyResponseGuard(deals, 'deals:fetch', [], [{ id: 'deal', platform: 'steam', title: 'Game' }], {}, []);

  const launcherChannels = ['launcher:openDownloads', 'launcher:openSocial', 'launcher:openSteamController', 'launcher:pickSocialClient', 'launcher:inspectSocialClients', 'launcher:detect', 'launcher:scan-steam', 'launcher:scan-epic', 'launcher:scan-gog', 'launcher:scan-ea', 'launcher:scan-ubisoft', 'launcher:scan-battlenet', 'launcher:scan-riot', 'launcher:scan-xbox', 'launcher:scan-rockstar', 'launcher:scan-itch'];
  const client = { running: false, installed: true, path: 'C:\\Launcher\\client.exe', pathSource: 'standard', savedPathMissing: false };
  const launcherResults = {
    'launcher:openDownloads': { ok: true },
    'launcher:openSocial': { ok: true },
    'launcher:openSteamController': { ok: true },
    'launcher:pickSocialClient': 'C:\\Launcher\\client.exe',
    'launcher:inspectSocialClients': { steam: client, epic: client, ea: client, ubisoft: client, battlenet: client },
    'launcher:detect': { steam: false, epic: false, ea: false, ubisoft: false, gog: false, battlenet: false, riot: false, xbox: false, rockstar: false, itch: false },
  };
  for (const channel of launcherChannels.filter(channel => channel.startsWith('launcher:scan-'))) {
    const source = channel.replace('launcher:scan-', '');
    launcherResults[channel] = { ok: true, items: [{ name: 'Game', exe: 'C:\\Games\\Game.exe', installdir: 'C:\\Games', launcher: source, source }], source };
  }
  const launcher = register(registerLauncherIpc, launcherChannels, launcherResults);
  await verifyGuard(launcher, 'launcher:openDownloads', ['steam'], ['unknown'], { ok: false, code: 'INVALID_REQUEST' });
  await verifyGuard(launcher, 'launcher:openSocial', ['epic', 'C:\\Epic\\Launcher.exe'], ['epic', {}], { ok: false, code: 'INVALID_REQUEST' });
  await verifyGuard(launcher, 'launcher:pickSocialClient', ['ea'], ['origin'], {}, null);
  await verifyGuard(launcher, 'launcher:inspectSocialClients', [{ steam: 'C:\\Steam\\steam.exe' }], [{ unknown: 'C:\\Unknown.exe' }], {}, {});
  await verifyResponseGuard(launcher, 'launcher:openDownloads', ['steam'], { ok: 'yes' });
  await verifyResponseGuard(launcher, 'launcher:openSocial', ['epic', 'C:\\Epic\\Launcher.exe'], null);
  await verifyResponseGuard(launcher, 'launcher:pickSocialClient', ['steam'], 42, {}, null);
  await verifyResponseGuard(launcher, 'launcher:inspectSocialClients', [{}], { steam: client }, {}, {});
  await verifyResponseGuard(launcher, 'launcher:detect', [], { steam: 'no' }, {}, {});
  for (const channel of launcherChannels.filter(channel => channel.startsWith('launcher:scan-'))) {
    await verifyResponseGuard(launcher, channel, [], { ok: true, items: [{ name: 'Game' }] }, { items: [] });
  }
  await verifyServiceResultPreserved(launcher, 'launcher:openSocial', ['epic'], { ok: false, error: 'Client not found.' });
  await verifyServiceResultPreserved(launcher, 'launcher:scan-epic', [], { ok: false, error: 'Epic manifests not found.' });

  const appOsHandlers = {};
  const appOsCalls = [];
  const appOsResults = {
    openExternal: { ok: true }, revealInFolder: { ok: true, opened: 'C:\\Games' }, openContainingDir: undefined,
    setAutoStart: { ok: true }, getAutoStart: true, openPath: { ok: true },
  };
  const appOs = Object.fromEntries(Object.keys(appOsResults).map(method => [method, async (...args) => {
    appOsCalls.push({ method, args }); return appOsResults[method];
  }]));
  registerAppOsIpc({ registerIpc(channel, handler) { appOsHandlers[channel] = handler; }, appOs });
  await verifyRejected(appOsHandlers, appOsCalls, 'app:openExternal', ['file:///C:/private.txt'], { ok: false, code: 'INVALID_REQUEST' });
  await verifyRejected(appOsHandlers, appOsCalls, 'app:openExternal', ['ms-settings:privacy'], { ok: false, code: 'INVALID_REQUEST' });
  await verifyRejected(appOsHandlers, appOsCalls, 'app:revealInFolder', [{}], { ok: false, code: 'INVALID_REQUEST' });
  await verifyRejected(appOsHandlers, appOsCalls, 'app:openContainingDir', [42]);
  await verifyRejected(appOsHandlers, appOsCalls, 'app:setAutoStart', [1], { ok: false, code: 'INVALID_REQUEST' });
  await verifyRejected(appOsHandlers, appOsCalls, 'app:openPath', [[]], { ok: false, code: 'INVALID_REQUEST' });
  assert.deepEqual(await appOsHandlers['app:openExternal']({}, 'https://neo-lib.example'), { ok: true });
  assert.deepEqual(await appOsHandlers['app:openExternal']({}, 'ms-settings:bluetooth'), { ok: true });
  appOsResults.openExternal = { ok: 'yes' };
  assert.equal((await appOsHandlers['app:openExternal']({}, 'https://neo-lib.example')).code, 'INVALID_RESPONSE');
  appOsResults.openExternal = { ok: true };
  appOsResults.revealInFolder = { ok: true, opened: [] };
  assert.equal((await appOsHandlers['app:revealInFolder']({}, 'C:\\Games\\Game.exe')).code, 'INVALID_RESPONSE');
  appOsResults.revealInFolder = { ok: true, opened: 'C:\\Games' };
  appOsResults.openContainingDir = 'opened';
  assert.equal(await appOsHandlers['app:openContainingDir']({}, 'C:\\Games\\Game.exe'), undefined);
  appOsResults.openContainingDir = undefined;
  appOsResults.getAutoStart = 'yes';
  assert.equal(await appOsHandlers['app:getAutoStart']({}), false);
  appOsResults.getAutoStart = true;
  appOsResults.setAutoStart = { ok: 'yes' };
  assert.equal((await appOsHandlers['app:setAutoStart']({}, true)).code, 'INVALID_RESPONSE');
  appOsResults.setAutoStart = { ok: true };
  appOsResults.openPath = null;
  assert.equal((await appOsHandlers['app:openPath']({}, 'C:\\Games')).code, 'INVALID_RESPONSE');
  appOsResults.openPath = { ok: true };

  const lifecycleHandlers = {};
  const lifecycleCalls = [];
  const lifecycleResults = { minimize: true, discord: { ok: true, hasAppId: true }, status: { hasAppId: true, installed: true, ready: false }, quit: true };
  const appLifecycle = {
    async setMinimizeToTray(...args) { lifecycleCalls.push(['setMinimizeToTray', ...args]); return lifecycleResults.minimize; },
    async setDiscordRpc(...args) { lifecycleCalls.push(['setDiscordRpc', ...args]); return lifecycleResults.discord; },
    async discordRpcStatus() { lifecycleCalls.push(['discordRpcStatus']); return lifecycleResults.status; },
    async quit() { lifecycleCalls.push(['quit']); return lifecycleResults.quit; },
  };
  registerAppLifecycleIpc({ registerIpc(channel, handler) { lifecycleHandlers[channel] = handler; }, appLifecycle });
  await verifyRejected(lifecycleHandlers, lifecycleCalls, 'app:setMinimizeToTray', ['yes'], {}, false);
  await verifyRejected(lifecycleHandlers, lifecycleCalls, 'app:setDiscordRpc', [0], { ok: false, code: 'INVALID_REQUEST' });
  assert.equal(await lifecycleHandlers['app:setMinimizeToTray']({}, true), true);
  assert.deepEqual(await lifecycleHandlers['app:setDiscordRpc']({}, true), lifecycleResults.discord);
  assert.equal(await lifecycleHandlers['app:quit']({}), true);
  lifecycleResults.minimize = 'yes';
  assert.equal(await lifecycleHandlers['app:setMinimizeToTray']({}, true), false);
  lifecycleResults.minimize = true;
  lifecycleResults.discord = { ok: true, hasAppId: 'yes' };
  assert.equal((await lifecycleHandlers['app:setDiscordRpc']({}, true)).code, 'INVALID_RESPONSE');
  lifecycleResults.discord = { ok: true, hasAppId: true };
  lifecycleResults.status = { ready: 'no' };
  assert.deepEqual(await lifecycleHandlers['app:discordRpcStatus']({}), { hasAppId: false, installed: false, ready: false, code: 'INVALID_RESPONSE' });

  const persistenceHandlers = {};
  const persistenceCalls = [];
  const documentResults = { library: { games: [], categories: [] }, settings: { theme: 'home' }, saveLibrary: true, saveSettings: true };
  const documents = {
    async loadLibrary() { return documentResults.library; }, async loadSettings() { return documentResults.settings; },
    async saveLibrary(value) { persistenceCalls.push(['library', value]); },
    async saveSettings(value) { persistenceCalls.push(['settings', value]); },
  };
  registerPersistenceIpc({ registerIpc(channel, handler) { persistenceHandlers[channel] = handler; }, documents });
  await verifyRejected(persistenceHandlers, persistenceCalls, 'library:save', [[{ id: 'not-a-document' }]], {}, false);
  await verifyRejected(persistenceHandlers, persistenceCalls, 'settings:save', ['not-a-document'], {}, false);
  assert.equal(await persistenceHandlers['library:save']({}, { games: [{ id: 'g1', optionalField: undefined }], categories: [] }), true);
  assert.deepEqual(await persistenceHandlers['library:load']({}), documentResults.library);
  documentResults.library = [];
  assert.deepEqual(await persistenceHandlers['library:load']({}), {});
  documentResults.library = { games: [], categories: [] };
  documentResults.settings = [];
  assert.deepEqual(await persistenceHandlers['settings:load']({}), {});
  documentResults.settings = { theme: 'home' };

  const playtimeHandlers = {};
  const playtimeCalls = [];
  let playtimeResult = { ok: true, deltas: { 620: 30 }, lastSnapshotAt: 1 };
  registerPlaytimeIpc({ registerIpc(channel, handler) { playtimeHandlers[channel] = handler; }, playtimeHistory: { async read(value) { playtimeCalls.push(value); return playtimeResult; } } });
  await verifyRejected(playtimeHandlers, playtimeCalls, 'playtime:history', [{ days: -1 }], { ok: false, code: 'INVALID_REQUEST', deltas: {} });
  assert.deepEqual(await playtimeHandlers['playtime:history']({}, { days: 30 }), playtimeResult);
  playtimeResult = { ok: true, deltas: [], lastSnapshotAt: 1 };
  assert.equal((await playtimeHandlers['playtime:history']({}, { days: 30 })).code, 'INVALID_RESPONSE');

  const imageHandlers = {};
  const imageCalls = [];
  let imageResult = 'file:///C:/Covers/Game.png';
  registerImageIpc({ registerIpc(channel, handler) { imageHandlers[channel] = handler; }, imageCache: { async cache(value) { imageCalls.push(value); return imageResult; } } });
  await verifyRejected(imageHandlers, imageCalls, 'image:cache', [{ url: 'file:///C:/private.png', name: 'Private' }], {}, null);
  assert.equal(await imageHandlers['image:cache']({}, { url: 'https://cdn.example/cover.png', name: 'Game' }), imageResult);
  imageResult = 42;
  assert.equal(await imageHandlers['image:cache']({}, { url: 'https://cdn.example/cover.png', name: 'Game' }), null);

  const doctorHandlers = {};
  const doctorCalls = [];
  let doctorResult = { ok: true, configuredPath: 'C:\\Games\\Game.exe', exists: true, candidates: [], notes: [] };
  registerDoctorIpc({ registerIpc(channel, handler) { doctorHandlers[channel] = handler; }, launchDoctor: { async inspect(value) { doctorCalls.push(value); return doctorResult; } } });
  await verifyRejected(doctorHandlers, doctorCalls, 'doctor:inspectLaunch', [{ exePath: [], gameName: 'Game' }], { ok: false, code: 'INVALID_REQUEST', candidates: [] });
  assert.deepEqual(await doctorHandlers['doctor:inspectLaunch']({}, { exePath: 'C:\\Games\\Game.exe', gameName: 'Game' }), doctorResult);
  doctorResult = { ok: true, configuredPath: 'C:\\Games\\Game.exe', exists: 'yes', candidates: [], notes: [] };
  assert.equal((await doctorHandlers['doctor:inspectLaunch']({}, { exePath: 'C:\\Games\\Game.exe', gameName: 'Game' })).code, 'INVALID_RESPONSE');

  const shellHandlers = {};
  const shellCalls = [];
  let shortcutResult = { target: 'C:\\Game.exe', args: '' };
  registerShellIpc({ registerIpc(channel, handler) { shellHandlers[channel] = handler; }, shell: { readShortcutLink(value) { shellCalls.push(value); return shortcutResult; } } });
  await verifyRejected(shellHandlers, shellCalls, 'shell:resolveLnk', ['C:\\Game.exe'], { ok: false, code: 'INVALID_REQUEST' });
  assert.equal((await shellHandlers['shell:resolveLnk']({}, 'C:\\Game.lnk')).ok, true);
  shortcutResult = { target: [], args: '' };
  assert.equal((await shellHandlers['shell:resolveLnk']({}, 'C:\\Game.lnk')).code, 'INVALID_RESPONSE');

  const exeHandlers = {};
  const exeCalls = [];
  let iconResult = 'data:image/png;base64,aWNvbg==';
  registerExeIpc({ registerIpc(channel, handler) { exeHandlers[channel] = handler; }, app: { async getFileIcon(value) { exeCalls.push(value); return { isEmpty: () => false, toDataURL: () => iconResult }; } } });
  await verifyRejected(exeHandlers, exeCalls, 'exe:icon', [42], {}, null);
  assert.equal(await exeHandlers['exe:icon']({}, 'C:\\Game.exe'), iconResult);
  iconResult = 'not-an-image';
  assert.equal(await exeHandlers['exe:icon']({}, 'C:\\Game.exe'), null);

  const windowHandlers = {};
  let windowMode = 'normal';
  const windowMock = {
    minimize() { return windowMode === 'bad-minimize' ? 42 : undefined; },
    close() { return windowMode === 'bad-close' ? 'closed' : undefined; },
    isMaximized() { return windowMode === 'bad-maximize' ? 'yes' : windowMode === 'maximized'; },
    maximize() { if (windowMode !== 'bad-maximize') windowMode = 'maximized'; },
    unmaximize() { if (windowMode !== 'bad-maximize') windowMode = 'normal'; },
  };
  registerWindowIpc({ registerIpc(channel, handler) { windowHandlers[channel] = handler; }, getMainWindow: () => windowMock });
  assert.equal(await windowHandlers['window:minimize']({}), undefined);
  assert.equal(await windowHandlers['window:toggleMaximize']({}), true);
  assert.equal(await windowHandlers['window:close']({}), undefined);
  windowMode = 'bad-minimize';
  assert.equal(await windowHandlers['window:minimize']({}), undefined);
  windowMode = 'bad-close';
  assert.equal(await windowHandlers['window:close']({}), undefined);
  windowMode = 'bad-maximize';
  assert.equal(await windowHandlers['window:toggleMaximize']({}), false);

  const dialogHandlers = {};
  let dialogResult = { canceled: false, filePaths: ['C:\\Games\\Game.exe'] };
  const dialog = { async showOpenDialog() { return dialogResult; } };
  registerDialogIpc({ registerIpc(channel, handler) { dialogHandlers[channel] = handler; }, dialog, getMainWindow: () => ({}) });
  assert.equal(await dialogHandlers['dialog:pickExe']({}), 'C:\\Games\\Game.exe');
  dialogResult = { canceled: false, filePaths: ['C:\\Games'] };
  assert.equal(await dialogHandlers['dialog:pickDirectory']({}), 'C:\\Games');
  assert.equal(await dialogHandlers['dialog:pickSaveFolder']({}), 'C:\\Games');
  assert.equal(await dialogHandlers['dialog:pickWidgetManifest']({}), 'C:\\Games');
  dialogResult = { canceled: false, filePaths: ['C:\\Images\\cover.png'] };
  assert.deepEqual(await dialogHandlers['dialog:pickImage']({}), { path: 'C:\\Images\\cover.png', url: 'file://C:/Images/cover.png' });
  dialogResult = { canceled: false, filePaths: [42] };
  assert.equal(await dialogHandlers['dialog:pickExe']({}), null);
  assert.equal(await dialogHandlers['dialog:pickDirectory']({}), null);
  assert.equal(await dialogHandlers['dialog:pickSaveFolder']({}), null);
  assert.equal(await dialogHandlers['dialog:pickWidgetManifest']({}), null);
  dialogResult = { canceled: false, filePaths: [{ replace: () => '' }] };
  assert.equal(await dialogHandlers['dialog:pickImage']({}), null);

  const systemHandlers = {};
  let healthResult = { cpuPercent: 20, ramPercent: 50, memoryUsedGb: 8, memoryFreeGb: 8, memoryTotalGb: 16 };
  registerSystemIpc({ registerIpc(channel, handler) { systemHandlers[channel] = handler; }, systemHealth: { async read() { return healthResult; } } });
  assert.deepEqual(await systemHandlers['system:health']({}), healthResult);
  healthResult = { cpuPercent: 120, ramPercent: 50, memoryUsedGb: 8, memoryFreeGb: 8, memoryTotalGb: 16 };
  assert.deepEqual(await systemHandlers['system:health']({}), { cpuPercent: null, ramPercent: null, memoryUsedGb: 0, memoryFreeGb: 0, memoryTotalGb: 0, code: 'INVALID_RESPONSE' });

  console.log('PASS: all 53 renderer payload contracts reject malformed input before native services, and all 88 native commands enforce response contracts while preserving valid success and failure results. The other 35 native commands are intentionally no-payload.');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
