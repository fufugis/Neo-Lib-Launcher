// IPC surface for versioned local documents. Business rules remain in the
// document store; this file only translates the stable renderer contract.
function registerPersistenceIpc({ registerIpc, documents }) {
  if (typeof registerIpc !== 'function' || !documents) {
    throw new TypeError('registerPersistenceIpc requires registerIpc and documents.');
  }

  registerIpc('library:load', guardResult(async () => documents.loadLibrary(),
    data => isJsonObjectWithin(data, { maxDepth: 14, maxEntries: 250000, maxString: 100000 }), {}));
  registerIpc('library:save', guardResult(guardHandler(async (_event, data) => {
    await documents.saveLibrary(data);
    return true;
  }, data => isJsonObjectWithin(data, { maxDepth: 14, maxEntries: 250000, maxString: 100000 }), false), value => value === true, false));
  registerIpc('settings:load', guardResult(async () => documents.loadSettings(),
    data => isJsonObjectWithin(data, { maxDepth: 12, maxEntries: 50000, maxString: 100000 }), {}));
  registerIpc('settings:save', guardResult(guardHandler(async (_event, data) => {
    await documents.saveSettings(data);
    return true;
  }, data => isJsonObjectWithin(data, { maxDepth: 12, maxEntries: 50000, maxString: 100000 }), false), value => value === true, false));
}

module.exports = { registerPersistenceIpc };
const { guardHandler, guardResult, isJsonObjectWithin } = require('./contract-guards.cjs');
