const { contextBridge, ipcRenderer } = require('electron');

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

  // exe
  extractIcon: (exePath) => ipcRenderer.invoke('exe:icon', exePath),
  launchGame: (opts) => ipcRenderer.invoke('game:launch', opts),
  onGameExited: (cb) => ipcRenderer.on('game:exited', (_e, info) => cb(info)),

  // scan
  scanDirectory: (root) => ipcRenderer.invoke('scan:directory', root),

  // steam
  searchSteam: (q) => ipcRenderer.invoke('steam:search', q),
  steamDetails: (appid) => ipcRenderer.invoke('steam:details', appid),

  // multi-source metadata
  fetchMetadata: (opts) => ipcRenderer.invoke('metadata:auto', opts),
  webSearch: (q) => ipcRenderer.invoke('web:search', q),
  gogSearch: (q) => ipcRenderer.invoke('gog:search', q),

  // cache
  cacheImage: (url, name) => ipcRenderer.invoke('image:cache', { url, name }),

  // misc
  openExternal: (url) => ipcRenderer.invoke('app:openExternal', url),
  revealInFolder: (p) => ipcRenderer.invoke('app:revealInFolder', p),
  openContainingDir: (p) => ipcRenderer.invoke('app:openContainingDir', p),
});
