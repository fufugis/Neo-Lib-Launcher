// IPC surface for native file/folder pickers. Selection policy stays explicit
// here while the caller only receives the same path/result shapes as before.
const { importLoungeBackground } = require('../images/lounge-background-import.cjs');
const { importLoungeAudio } = require('../audio/lounge-audio-import.cjs');

function registerDialogIpc({ registerIpc, dialog, getMainWindow, loungeBackgroundRoot, loungeAudioRoot }) {
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
      title: 'Pick artwork or a hero video',
      properties: ['openFile'],
      filters: [
        { name: 'Artwork and video', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'mp4', 'm4v', 'webm', 'mov', 'ogv'] },
        { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'ico'] },
        { name: 'Video', extensions: ['mp4', 'm4v', 'webm', 'mov', 'ogv'] },
      ],
    });
    if (!selected) return null;
    return { path: selected, url: 'file://' + selected.replace(/\\/g, '/') };
  }, value => value === null || (isPlainObject(value) && isPath(value.path)
    && isBoundedString(value.url, { required: true, max: 32767 }) && value.url.startsWith('file://')), null));

  registerIpc('dialog:importLoungeBackground', guardResult(async () => {
    const selected = await pickFirst({
      title: 'Import Lounge background artwork or video',
      properties: ['openFile'],
      filters: [
        { name: 'Lounge artwork and video', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'apng', 'mp4', 'm4v', 'webm', 'mov', 'ogv'] },
        { name: 'Animated and still images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'apng'] },
        { name: 'Video', extensions: ['mp4', 'm4v', 'webm', 'mov', 'ogv'] },
      ],
    });
    if (!selected) return null;
    if (typeof loungeBackgroundRoot !== 'function') return null;
    return importLoungeBackground(selected, loungeBackgroundRoot());
  }, value => value === null || (isPlainObject(value) && (value.ok === true
    ? isBoundedString(value.url, { required: true, max: 2048 }) && value.url.startsWith('file:///')
    : value.ok === false && isBoundedString(value.error, { required: true, max: 160 }))), null));

  registerIpc('dialog:importLoungeAudio', guardResult(async () => {
    const selected = await pickFirst({
      title: 'Import Lounge ambience or music',
      properties: ['openFile'],
      filters: [{ name: 'MP3 audio', extensions: ['mp3'] }],
    });
    if (!selected) return null;
    if (typeof loungeAudioRoot !== 'function') return null;
    return importLoungeAudio(selected, loungeAudioRoot());
  }, value => value === null || (isPlainObject(value) && (value.ok === true
    ? isBoundedString(value.url, { required: true, max: 2048 }) && value.url.startsWith('file:///')
    : value.ok === false && isBoundedString(value.error, { required: true, max: 160 }))), null));

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
