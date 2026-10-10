// Deliberately not the main app preload. No library/settings/files/shell API.
const { contextBridge, ipcRenderer } = require('electron');
let launchIntentExpiresAt = 0;
const markIntent = event => { if (event.isTrusted && event.target?.closest?.('[data-neolib-launch]')) launchIntentExpiresAt = Date.now() + 1800; };
document.addEventListener('pointerdown', markIntent, true); document.addEventListener('keydown', markIntent, true);
const subscribe = (channel, callback) => { const listener = (_event, value) => callback(value); ipcRenderer.on(channel, listener); return () => ipcRenderer.removeListener(channel, listener); };
contextBridge.exposeInMainWorld('api', {
  readSystemIdleSeconds: () => ipcRenderer.invoke('system:idleSeconds'),
  moduleSnapshot: () => ipcRenderer.invoke('modules:snapshot'),
  onModuleContext: callback => subscribe('modules:context', callback),
  onModuleCloseRequest: callback => subscribe('modules:prepareClose', callback),
  moduleRequest: action => ipcRenderer.invoke('modules:request', action),
  closeModule: () => ipcRenderer.invoke('modules:close'),
  loadAddonRuntime: id => ipcRenderer.invoke('modules:runtime', id),
  armGameLaunch: () => {
    if (Date.now() > launchIntentExpiresAt) return Promise.resolve({ ok: false, error: 'Press the visible Launch button.' });
    launchIntentExpiresAt = 0; return ipcRenderer.invoke('modules:armLaunch');
  },
  importLoungeBackground: () => ipcRenderer.invoke('dialog:importLoungeBackground'),
  loungeBackgroundProfile: (url, profile) => ipcRenderer.invoke('dialog:loungeBackgroundProfile', url, profile),
  importLoungeAudio: () => ipcRenderer.invoke('dialog:importLoungeAudio'),
  fetchAllNews: options => ipcRenderer.invoke('news:fetchAll', options),
  fetchWeeklyReleases: options => ipcRenderer.invoke('releases:weekly', options),
  openExternal: url => ipcRenderer.invoke('app:openExternal', url),
  listWidgets: () => ipcRenderer.invoke('widgets:list'),
  loadWidgetRuntime: id => ipcRenderer.invoke('widgets:runtime', id),
  scanGameUpdates: options => ipcRenderer.invoke('modules:request', { type: 'updates', value: options }).then(result => result.data || result),
  scanGameStorage: options => ipcRenderer.invoke('modules:request', { type: 'storageScan', value: options }).then(result => result.data || result),
});
