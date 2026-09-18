const { guardHandler, guardResult, isBoundedArray, isBoundedString, isPath, isPlainObject } = require('./contract-guards.cjs');

const isScanCandidate = candidate => isPlainObject(candidate)
  && isPath(candidate.folder) && isBoundedString(candidate.folderName, { required: true, max: 1000 })
  && isPath(candidate.exe) && isBoundedArray(candidate.alternativeExes, 5, value => isPath(value));

function registerScanIpc({ registerIpc, services }) {
  if (typeof registerIpc !== 'function' || !services) throw new TypeError('registerScanIpc requires registerIpc and services.');
  const requireService = (all, channel) => {
    const handler = all[channel];
    if (typeof handler !== 'function') throw new TypeError(`Missing service for ${channel}.`);
    return handler;
  };
  registerIpc("scan:directory", guardResult(guardHandler(
    requireService(services, "scan:directory"),
    (root, excludes, options) => isPath(root)
      && (excludes === undefined || isBoundedArray(excludes, 100, value => isBoundedString(value, { required: true, max: 1024 })))
      && (options == null || (isPlainObject(options) && (options.deep == null || typeof options.deep === 'boolean'))),
    [],
  ), result => isBoundedArray(result, 80, isScanCandidate), []));
}

module.exports = { registerScanIpc };
