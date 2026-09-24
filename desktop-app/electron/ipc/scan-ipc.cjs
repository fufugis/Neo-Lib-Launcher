const { guardHandler, guardResult, invalidRequest, invalidResponse, isBoundedArray, isBoundedString, isPath, isPlainObject } = require('./contract-guards.cjs');

const isScanCandidate = candidate => isPlainObject(candidate)
  && isPath(candidate.folder) && isBoundedString(candidate.folderName, { required: true, max: 1000 })
  && isPath(candidate.exe) && isBoundedArray(candidate.alternativeExes, 5, value => isPath(value));

const isRomCandidate = candidate => isPlainObject(candidate)
  && isPath(candidate.path) && /^\.[a-z0-9]{1,8}$/i.test(candidate.extension || '')
  && Number.isSafeInteger(candidate.sizeBytes) && candidate.sizeBytes >= 0
  && Number.isFinite(candidate.modifiedAt) && candidate.modifiedAt >= 0;

const isRomScanResult = result => isPlainObject(result) && (
  (result.ok === false && isBoundedString(result.error, { required: true, max: 1000 }) && isBoundedArray(result.items, 0))
  || (result.ok === true && isBoundedArray(result.items, 2000, isRomCandidate)
    && typeof result.truncated === 'boolean' && Number.isSafeInteger(result.visitedFiles) && result.visitedFiles >= 0)
);

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
  registerIpc('scan:roms', guardResult(guardHandler(
    requireService(services, 'scan:roms'),
    request => isPlainObject(request) && isPath(request.root)
      && isBoundedArray(request.extensions, 64, value => /^\.[a-z0-9]{1,8}$/i.test(value || ''))
      && (request.maxDepth == null || (Number.isSafeInteger(request.maxDepth) && request.maxDepth >= 0 && request.maxDepth <= 10))
      && (request.maxFiles == null || (Number.isSafeInteger(request.maxFiles) && request.maxFiles >= 1 && request.maxFiles <= 2000)),
    invalidRequest('The ROM scan request was malformed.', { items: [], truncated: false, visitedFiles: 0 }),
  ), isRomScanResult, invalidResponse('The ROM scan returned an invalid result.', { items: [], truncated: false, visitedFiles: 0 })));
}

module.exports = { registerScanIpc };
