const { contextBridge, ipcRenderer } = require('electron');

// A renderer timer must never be able to arm a game launch. Electron's
// window-level before-input-event timestamp is not reliable on every Windows
// compositor path, though, which could also reject a perfectly real click.
// The isolated preload sees trusted DOM input directly and only arms while a
// real pointer/key event began on the visible, explicitly marked Launch button.
let launchIntentExpiresAt = 0;
const markLaunchIntent = (event) => {
  if (!event.isTrusted || !event.target?.closest?.('[data-neolib-launch]')) return;
  launchIntentExpiresAt = Date.now() + 1800;
};
document.addEventListener('pointerdown', markLaunchIntent, true);
document.addEventListener('keydown', markLaunchIntent, true);

const armGameLaunch = () => {
  if (Date.now() > launchIntentExpiresAt) {
    return Promise.resolve({ ok: false, error: 'Press the visible Launch button to start a game.' });
  }
  // One trusted press can arm exactly one native request.
  launchIntentExpiresAt = 0;
  return ipcRenderer.invoke('game:armLaunch');
};

contextBridge.exposeInMainWorld('api', {
  // window
  minimize: () => ipcRenderer.invoke('window:minimize'),
  toggleMaximize: () => ipcRenderer.invoke('window:toggleMaximize'),
  close: () => ipcRenderer.invoke('window:close'),
  onMaximizeChange: (cb) => ipcRenderer.on('window:maximized', (_e, v) => cb(v)),

  // library
  loadLibrary: () => ipcRenderer.invoke('library:load'),
  saveLibrary: (data) => ipcRenderer.invoke('library:save', data),

  // settings
  loadSettings: () => ipcRenderer.invoke('settings:load'),
  saveSettings: (data) => ipcRenderer.invoke('settings:save', data),

  // dialogs
  pickExe: () => ipcRenderer.invoke('dialog:pickExe'),
  pickDirectory: () => ipcRenderer.invoke('dialog:pickDirectory'),
  pickSaveFolder: () => ipcRenderer.invoke('dialog:pickSaveFolder'),
  pickImage: () => ipcRenderer.invoke('dialog:pickImage'),

  // shortcuts
  resolveLnk: (lnkPath) => ipcRenderer.invoke('shell:resolveLnk', lnkPath),

  // exe
  extractIcon: (exePath) => ipcRenderer.invoke('exe:icon', exePath),
  armGameLaunch,
  launchGame: (opts) => ipcRenderer.invoke('game:launch', opts),
  onGameExited: (cb) => ipcRenderer.on('game:exited', (_e, info) => cb(info)),
  watchExternalGames: (payload) => ipcRenderer.invoke('game:watchExternal', payload),
  onExternalGameState: (cb) => ipcRenderer.on('game:externalState', (_e, info) => cb(info)),

  // scan
  scanDirectory: (root, excludes, options) => ipcRenderer.invoke('scan:directory', root, excludes, options),

  // steam
  searchSteam: (q) => ipcRenderer.invoke('steam:search', q),
  steamDetails: (appid) => ipcRenderer.invoke('steam:details', appid),

  // multi-source metadata
  fetchMetadata: (opts) => ipcRenderer.invoke('metadata:auto', opts),
  deriveMetadataHints: (opts) => ipcRenderer.invoke('metadata:deriveHints', opts),
  listCandidates: (opts) => ipcRenderer.invoke('metadata:listCandidates', opts),
  expandCandidate: (opts) => ipcRenderer.invoke('metadata:expandCandidate', opts),
  webSearch: (q) => ipcRenderer.invoke('web:search', q),
  gogSearch: (q) => ipcRenderer.invoke('gog:search', q),
  testGemini: (opts) => ipcRenderer.invoke('gemini:test', opts),
  askFungist: (opts) => ipcRenderer.invoke('gemini:assistant', opts),

  // cache
  cacheImage: (url, name) => ipcRenderer.invoke('image:cache', { url, name }),

  // misc
  openExternal: (url) => ipcRenderer.invoke('app:openExternal', url),
  openPath: (p) => ipcRenderer.invoke('app:openPath', p),
  revealInFolder: (p) => ipcRenderer.invoke('app:revealInFolder', p),
  openContainingDir: (p) => ipcRenderer.invoke('app:openContainingDir', p),
  setAutoStart: (v) => ipcRenderer.invoke('app:setAutoStart', v),
  setMinimizeToTray: (v) => ipcRenderer.invoke('app:setMinimizeToTray', v),
  setDiscordRpc: (v) => ipcRenderer.invoke('app:setDiscordRpc', v),
  discordRpcStatus: () => ipcRenderer.invoke('app:discordRpcStatus'),
  getAutoStart: () => ipcRenderer.invoke('app:getAutoStart'),
  getSystemHealth: () => ipcRenderer.invoke('system:health'),
  detectGpuSetup: () => ipcRenderer.invoke('tools:detectGpuSetup'),
  verifyManagedTool: (payload) => ipcRenderer.invoke('tools:verifyManagedTool', payload),
  installManagedTool: (toolId) => ipcRenderer.invoke('tools:installManagedTool', toolId),
  inspectGamingPerformance: () => ipcRenderer.invoke('optimize:inspectGaming'),
  closeOptimizableProcess: (payload) => ipcRenderer.invoke('optimize:closeProcess', payload),
  scanSafeJunk: (payload) => ipcRenderer.invoke('optimize:scanJunk', payload),
  trashSafeJunk: (payload) => ipcRenderer.invoke('optimize:trashJunk', payload),

  // local save folders — all writes stay inside NEO-LIB's app-data backup area
  inspectSaveFolder: (savePath) => ipcRenderer.invoke('saves:inspect', savePath),
  listSaveBackups: (gameId) => ipcRenderer.invoke('saves:listBackups', gameId),
  createSaveBackup: (payload) => ipcRenderer.invoke('saves:createBackup', payload),
  restoreSaveBackup: (payload) => ipcRenderer.invoke('saves:restore', payload),
  detectCommonSaveFolders: (payload) => ipcRenderer.invoke('saves:detectCommon', payload),
  findSaveCandidates: (payload) => ipcRenderer.invoke('saves:findCandidates', payload),
  scanGameStorage: (payload) => ipcRenderer.invoke('storage:scanGames', payload),
  inspectLaunchDoctor: (payload) => ipcRenderer.invoke('doctor:inspectLaunch', payload),

  // launcher imports
  scanSteam: () => ipcRenderer.invoke('launcher:scan-steam'),
  scanEpic: () => ipcRenderer.invoke('launcher:scan-epic'),
  scanGog: () => ipcRenderer.invoke('launcher:scan-gog'),
  scanEa: () => ipcRenderer.invoke('launcher:scan-ea'),
  scanUbisoft: () => ipcRenderer.invoke('launcher:scan-ubisoft'),
  scanBattlenet: () => ipcRenderer.invoke('launcher:scan-battlenet'),
  scanRiot: () => ipcRenderer.invoke('launcher:scan-riot'),
  scanXbox: () => ipcRenderer.invoke('launcher:scan-xbox'),
  scanRockstar: () => ipcRenderer.invoke('launcher:scan-rockstar'),
  scanItch: () => ipcRenderer.invoke('launcher:scan-itch'),

  // deals (Epic free + Steam specials)
  fetchDeals: () => ipcRenderer.invoke('deals:fetch'),

  // steam news feed (last N days, all owned Steam games)
  fetchSteamNews: (opts) => ipcRenderer.invoke('news:fetchSteam', opts),
  fetchAllNews: (opts) => ipcRenderer.invoke('news:fetchAll', opts),
  fetchWeeklyReleases: (opts) => ipcRenderer.invoke('releases:weekly', opts),
  latestNewsForGame: (game) => ipcRenderer.invoke('news:latestForGame', game),
  getSteamManifest: (appid) => ipcRenderer.invoke('steam:manifest', appid),
  scanGameUpdates: (opts) => ipcRenderer.invoke('updates:scan', opts),
  fetchUpdateHistory: (opts) => ipcRenderer.invoke('updates:history', opts),
  importSteamPlaytime: (opts) => ipcRenderer.invoke('steam:importPlaytime', opts),
  playtimeHistory: (opts) => ipcRenderer.invoke('playtime:history', opts),

  // launcher process detection
  detectLaunchers: () => ipcRenderer.invoke('launcher:detect'),
  inspectSocialClients: (manualPaths) => ipcRenderer.invoke('launcher:inspectSocialClients', manualPaths),
  pickSocialClient: (platform) => ipcRenderer.invoke('launcher:pickSocialClient', platform),
  openLauncherSocial: (platform, manualPath) => ipcRenderer.invoke('launcher:openSocial', platform, manualPath),
  openLauncherDownloads: (platform) => ipcRenderer.invoke('launcher:openDownloads', platform),
});
