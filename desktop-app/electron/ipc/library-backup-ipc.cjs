const { guardHandler, guardResult, isJsonObjectWithin, isPlainObject } = require('./contract-guards.cjs');
const { validLibrary } = require('../library/library-backup-service.cjs');

function registerLibraryBackupIpc({ registerIpc, service }) {
  if (typeof registerIpc !== 'function' || !service?.exportLibrary || !service?.importLibrary || !service?.clearArtwork) {
    throw new TypeError('registerLibraryBackupIpc requires registerIpc and the library backup service.');
  }
  const validDocument = value => validLibrary(value) && isJsonObjectWithin(value, { maxDepth: 18, maxEntries: 400000, maxString: 100000 });
  registerIpc('library:exportBackup', guardResult(guardHandler(
    (_event, library) => service.exportLibrary(library), validDocument,
    { ok: false, error: 'The current library data is too large or malformed to save safely.' },
  ), value => isPlainObject(value) && typeof value.ok === 'boolean'
    && (value.canceled === true || (value.ok && Number.isInteger(value.gameCount)) || (!value.ok && typeof value.error === 'string')), { ok: false, error: 'Could not save the library backup.' }));
  registerIpc('library:importBackup', guardResult(
    () => service.importLibrary(), value => isPlainObject(value) && typeof value.ok === 'boolean'
      && (value.canceled === true || (value.ok && validDocument(value.library) && Number.isInteger(value.gameCount)) || (!value.ok && typeof value.error === 'string')),
    { ok: false, error: 'Could not import the library backup.' },
  ));
  registerIpc('library:clearArtwork', guardResult(
    () => service.clearArtwork(), value => isPlainObject(value) && typeof value.ok === 'boolean'
      && (Number.isInteger(value.removed) || typeof value.error === 'string'), { ok: false, error: 'Could not clear cached game artwork.' },
  ));
}

module.exports = { registerLibraryBackupIpc };
