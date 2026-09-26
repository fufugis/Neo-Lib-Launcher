// IPC surface for native file/folder pickers. Selection policy stays explicit
// here while the caller only receives the same path/result shapes as before.
function registerDialogIpc({ registerIpc, dialog, getMainWindow }) {
  if (typeof registerIpc !== 'function' || typeof dialog?.showOpenDialog !== 'function' || typeof getMainWindow !== 'function') {
    throw new TypeError('registerDialogIpc requires registerIpc, dialog and getMainWindow.');
  }

  async function pickFirst(options) {
    const result = await dialog.showOpenDialog(getMainWindow(), options);
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  }

  registerIpc('dialog:pickExe', guardResult(() => pickFirst({
    title: 'Select game executable',
    properties: ['openFile'],
    filters: [{ name: 'Executables', extensions: ['exe', 'lnk', 'bat', 'cmd'] }],
  }), value => value === null || isPath(value), null));

  registerIpc('dialog:pickDirectory', guardResult(() => pickFirst({
    title: 'Select folder',
    properties: ['openDirectory'],
  }), value => value === null || isPath(value), null));

  // Used by Edit metadata. The file URL shape is retained for renderer images.
  registerIpc('dialog:pickImage', guardResult(async () => {
    const selected = await pickFirst({
      title: 'Pick an image (icon / cover / hero)',
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'ico'] }],
    });
    if (!selected) return null;
    return { path: selected, url: 'file://' + selected.replace(/\\/g, '/') };
  }, value => value === null || (isPlainObject(value) && isPath(value.path)
    && isBoundedString(value.url, { required: true, max: 32767 }) && value.url.startsWith('file://')), null));

  registerIpc('dialog:pickThemeVideo', guardResult(async () => {
    const selected = await pickFirst({
      title: 'Pick a theme atmosphere video',
      properties: ['openFile'],
      filters: [{ name: 'WebM video', extensions: ['webm'] }],
    });
    if (!selected) return null;
    return { path: selected, url: 'file://' + selected.replace(/\\/g, '/') };
  }, value => value === null || (isPlainObject(value) && isPath(value.path)
    && isBoundedString(value.url, { required: true, max: 32767 }) && value.url.startsWith('file://')), null));

  registerIpc('dialog:pickSaveFolder', guardResult(() => pickFirst({
    title: 'Select this game\'s save folder',
    properties: ['openDirectory'],
  }), value => value === null || isPath(value), null));

  // A widget is selected through its explicit manifest, never by executing a
  // dropped script or DLL. The native widget service validates/copies it next.
  registerIpc('dialog:pickWidgetManifest', guardResult(() => pickFirst({
    title: 'Import NEO-LIB widget',
    properties: ['openFile'],
    filters: [{ name: 'NEO-LIB widget manifest', extensions: ['json'] }],
  }), value => value === null || isPath(value), null));

  registerIpc('dialog:pickThemeManifest', guardResult(() => pickFirst({
    title: 'Import NEO-LIB theme',
    properties: ['openFile'],
    filters: [{ name: 'NEO-LIB theme manifest', extensions: ['json'] }],
  }), value => value === null || isPath(value), null));
}

module.exports = { registerDialogIpc };
const { guardResult, isBoundedString, isPath, isPlainObject } = require('./contract-guards.cjs');
