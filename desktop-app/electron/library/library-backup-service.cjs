const FORMAT = 'neo-lib-library-backup';
const VERSION = 1;
const MAX_BACKUP_BYTES = 200 * 1024 * 1024;
const { fileURLToPath, pathToFileURL } = require('node:url');

function validLibrary(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value)
    && (value.games === undefined || Array.isArray(value.games))
    && (value.categories === undefined || Array.isArray(value.categories))
    && (value.tools === undefined || Array.isArray(value.tools))
    && (value.toolCategories === undefined || Array.isArray(value.toolCategories))
    && (value.gameOrderByCategory === undefined || isRecord(value.gameOrderByCategory))
    && (value.toolOrderByCategory === undefined || isRecord(value.toolOrderByCategory));
}

function isRecord(value) { return !!value && typeof value === 'object' && !Array.isArray(value); }
function localPathFromUrl(value) {
  const normalized = /^file:\/\/[a-z]:\//i.test(value) ? value.replace(/^file:\/\//i, 'file:///') : value;
  return fileURLToPath(normalized);
}

function createLibraryBackupService({ dialog, getMainWindow, fsPromises, path, coversDir, now = () => Date.now() }) {
  if (typeof dialog?.showSaveDialog !== 'function' || typeof dialog?.showOpenDialog !== 'function'
    || typeof getMainWindow !== 'function' || typeof fsPromises?.writeFile !== 'function'
    || typeof fsPromises?.readFile !== 'function') {
    throw new TypeError('createLibraryBackupService requires native dialogs, a window provider and file access.');
  }

  async function exportLibrary(library) {
    if (!validLibrary(library)) return { ok: false, error: 'The current library data is not valid for backup.' };
    const exportedLibrary = JSON.parse(JSON.stringify(library));
    const assets = {};
    const assetByPath = new Map();
    if (path?.resolve && path?.relative && typeof coversDir === 'function' && fsPromises.readFile) {
      const root = path.resolve(coversDir());
      const collect = async (value) => {
        if (Array.isArray(value)) { for (const item of value) await collect(item); return; }
        if (!isRecord(value)) return;
        for (const [key, item] of Object.entries(value)) {
          if (typeof item === 'string' && item.startsWith('file://')) {
            try {
              const file = path.resolve(localPathFromUrl(item));
              const relative = path.relative(root, file);
              if (relative && !relative.startsWith('..') && !path.isAbsolute(relative)) {
                let assetId = assetByPath.get(file.toLowerCase());
                if (!assetId) {
                  const stat = await fsPromises.stat(file);
                  if (!stat.isFile() || stat.size > MAX_BACKUP_BYTES) continue;
                  assetId = `art-${Object.keys(assets).length + 1}`;
                  const fileName = path.basename(file);
                  assets[assetId] = { fileName, data: (await fsPromises.readFile(file)).toString('base64') };
                  assetByPath.set(file.toLowerCase(), assetId);
                }
                value[key] = `neolib-backup-asset://${assetId}`;
              }
            } catch { /* missing or external local artwork keeps its existing reference */ }
          } else if (isRecord(item) || Array.isArray(item)) await collect(item);
        }
      };
      await collect(exportedLibrary);
    }
    const document = { format: FORMAT, version: VERSION, exportedAt: new Date(now()).toISOString(), library: exportedLibrary, assets };
    const contents = `${JSON.stringify(document, null, 2)}\n`;
    if (Buffer.byteLength(contents, 'utf8') > MAX_BACKUP_BYTES) return { ok: false, error: 'This library backup is larger than the 50 MB safety limit.' };
    const selected = await dialog.showSaveDialog(getMainWindow(), {
      title: 'Save NEO-LIB library and metadata',
      defaultPath: `NEO-LIB-library-${new Date(now()).toISOString().slice(0, 10)}.json`,
      buttonLabel: 'Save library backup',
      filters: [{ name: 'NEO-LIB library backup', extensions: ['json'] }],
    });
    if (selected.canceled || !selected.filePath) return { ok: true, canceled: true };
    const temporaryPath = `${selected.filePath}.tmp-${process.pid}-${now()}`;
    try {
      await fsPromises.writeFile(temporaryPath, contents, { encoding: 'utf8', flag: 'wx' });
      await fsPromises.rename(temporaryPath, selected.filePath);
      return { ok: true, filePath: selected.filePath, gameCount: (library.games || []).length };
    } catch (error) {
      try { await fsPromises.unlink(temporaryPath); } catch { /* best-effort temporary-file cleanup */ }
      return { ok: false, error: String(error?.message || 'Could not save the library backup.') };
    }
  }

  async function importLibrary() {
    const selected = await dialog.showOpenDialog(getMainWindow(), {
      title: 'Import NEO-LIB library and metadata',
      properties: ['openFile'],
      filters: [{ name: 'NEO-LIB library backup', extensions: ['json'] }],
    });
    if (selected.canceled || !selected.filePaths?.[0]) return { ok: true, canceled: true };
    try {
      const stat = await fsPromises.stat(selected.filePaths[0]);
      if (stat.size > MAX_BACKUP_BYTES) return { ok: false, error: 'This backup is larger than the 50 MB safety limit.' };
      const document = JSON.parse(await fsPromises.readFile(selected.filePaths[0], 'utf8'));
      if (document?.format !== FORMAT || document?.version !== VERSION || !validLibrary(document.library)
        || (document.assets !== undefined && !isRecord(document.assets))) {
        return { ok: false, error: 'This is not a supported NEO-LIB library backup.' };
      }
      const restoredLibrary = JSON.parse(JSON.stringify(document.library));
      const restoredAssets = {};
      if (path?.resolve && typeof coversDir === 'function' && fsPromises.writeFile && fsPromises.rename) {
        const root = path.resolve(coversDir());
        for (const [assetId, asset] of Object.entries(document.assets || {})) {
          if (!/^art-\d{1,6}$/.test(assetId) || !isRecord(asset) || typeof asset.fileName !== 'string'
            || path.basename(asset.fileName) !== asset.fileName || !/\.(?:jpe?g|png|webp|gif|ico)$/i.test(asset.fileName)
            || typeof asset.data !== 'string' || asset.data.length > MAX_BACKUP_BYTES * 1.4) continue;
          const fileName = `restore_${assetId}_${asset.fileName}`;
          const output = path.join(root, fileName);
          const temporary = `${output}.tmp-${process.pid}-${now()}`;
          try {
            await fsPromises.writeFile(temporary, Buffer.from(asset.data, 'base64'), { flag: 'wx' });
            await fsPromises.rename(temporary, output);
            restoredAssets[assetId] = pathToFileURL(output).href;
          } catch {
            try { await fsPromises.unlink(temporary); } catch { /* best-effort temporary-file cleanup */ }
          }
        }
      }
      const rewrite = (value) => {
        if (Array.isArray(value)) { value.forEach(rewrite); return; }
        if (!isRecord(value)) return;
        for (const [key, item] of Object.entries(value)) {
          if (typeof item === 'string' && item.startsWith('neolib-backup-asset://')) {
            const assetId = item.slice('neolib-backup-asset://'.length);
            if (restoredAssets[assetId]) value[key] = restoredAssets[assetId];
            else value[key] = '';
          } else if (isRecord(item) || Array.isArray(item)) rewrite(item);
        }
      };
      rewrite(restoredLibrary);
      return { ok: true, library: restoredLibrary, gameCount: restoredLibrary.games?.length || 0 };
    } catch (error) {
      return { ok: false, error: String(error?.message || 'Could not read this library backup.') };
    }
  }

  async function clearArtwork() {
    if (!coversDir || !fsPromises.readdir || !fsPromises.unlink) return { ok: false, error: 'The local artwork cache is unavailable.' };
    try {
      const root = path.resolve(coversDir());
      const entries = await fsPromises.readdir(root, { withFileTypes: true });
      const artwork = entries.filter(entry => entry.isFile() && /\.(?:jpe?g|png|webp|gif|ico)$/i.test(entry.name));
      for (const entry of artwork) await fsPromises.unlink(path.join(root, entry.name));
      return { ok: true, removed: artwork.length };
    } catch (error) {
      if (error?.code === 'ENOENT') return { ok: true, removed: 0 };
      return { ok: false, error: String(error?.message || 'Could not clear cached game artwork.') };
    }
  }

  return { exportLibrary, importLibrary, clearArtwork };
}

module.exports = { FORMAT, VERSION, MAX_BACKUP_BYTES, validLibrary, createLibraryBackupService };
