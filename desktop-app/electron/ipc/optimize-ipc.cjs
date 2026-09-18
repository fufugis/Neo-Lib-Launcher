const { guardHandler, guardResult, invalidRequest, invalidResponse, isBoolean, isBoundedArray, isBoundedString, isIdentifier, isJsonObjectWithin, isNumberBetween, isPath, isPlainObject } = require('./contract-guards.cjs');

const isCount = value => Number.isSafeInteger(value) && value >= 0;
const isBytes = value => Number.isFinite(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER;
const isErrorResult = result => isPlainObject(result)
  && result.ok === false
  && isBoundedString(result.error, { required: true, max: 2000 });
const isProcess = entry => isPlainObject(entry)
  && Number.isSafeInteger(entry.pid) && entry.pid > 0
  && isBoundedString(entry.name, { required: true, max: 500 })
  && isPath(entry.path, { required: false })
  && isBoolean(entry.protected, { required: true })
  && isNumberBetween(entry.capturedAt, 0, Number.MAX_SAFE_INTEGER, { required: true })
  && isNumberBetween(entry.cpuPercent, 0, 100, { required: true })
  && isBytes(entry.memoryBytes);
const isGpuProcess = entry => isPlainObject(entry)
  && Number.isSafeInteger(entry.pid) && entry.pid >= 0
  && isBoundedString(entry.name, { required: true, max: 500 })
  && isNumberBetween(entry.percent, 0, 100, { required: true });
const isJunkItem = item => isPlainObject(item)
  && isBoundedString(item.token, { required: true, max: 200 })
  && isPath(item.path) && isBoundedString(item.name, { required: true, max: 1000 })
  && isPath(item.folder) && isBytes(item.bytes)
  && isNumberBetween(item.modifiedAt, 0, Number.MAX_SAFE_INTEGER, { required: true })
  && isBoundedString(item.kind, { required: true, max: 500 })
  && isBoolean(item.selectedByDefault, { required: true });
const isTrashedItem = item => isPlainObject(item)
  && isBoundedString(item.token, { required: true, max: 200 }) && isPath(item.path) && isBytes(item.bytes);
const isFailedItem = item => isPlainObject(item)
  && isBoundedString(item.token, { required: true, max: 200 })
  && isBoundedString(item.error, { required: true, max: 2000 });

function validGameReference(game) {
  return isPlainObject(game)
    && isIdentifier(game.id, { required: false })
    && isBoundedString(game.name, { max: 500 })
    && isPath(game.exePath, { required: false })
    && isPath(game.saveFolder, { required: false });
}

function registerOptimizeIpc({ registerIpc, services }) {
  if (typeof registerIpc !== 'function' || !services) throw new TypeError('registerOptimizeIpc requires registerIpc and services.');
  const requireService = (all, channel) => {
    const handler = all[channel];
    if (typeof handler !== 'function') throw new TypeError(`Missing service for ${channel}.`);
    return handler;
  };
  registerIpc("optimize:trashJunk", guardResult(guardHandler(
    requireService(services, "optimize:trashJunk"),
    payload => isPlainObject(payload)
      && (payload.tokens == null || isBoundedArray(payload.tokens, 100, token => isBoundedString(token, { required: true, max: 200 }))),
    invalidRequest('The junk-removal request was malformed.', { trashed: [], failed: [], reclaimedBytes: 0 }),
  ), result => isPlainObject(result) && typeof result.ok === 'boolean'
    && isBoundedArray(result.trashed, 100, isTrashedItem)
    && isBoundedArray(result.failed, 100, isFailedItem)
    && isBytes(result.reclaimedBytes),
  invalidResponse('Junk removal returned an invalid result.', { trashed: [], failed: [], reclaimedBytes: 0 })));
  registerIpc("optimize:scanJunk", guardResult(guardHandler(
    requireService(services, "optimize:scanJunk"),
    payload => isPlainObject(payload) && (payload.games == null || isBoundedArray(payload.games, 500, validGameReference)),
    invalidRequest('The junk-scan request was malformed.', { items: [], totalBytes: 0 }),
  ), result => isPlainObject(result) && result.ok === true
    && isBoundedArray(result.items, 500, isJunkItem) && isBytes(result.totalBytes)
    && isNumberBetween(result.scannedAt, 0, Number.MAX_SAFE_INTEGER, { required: true })
    && isCount(result.visited) && isBoundedString(result.scope, { required: true, max: 2000 }),
  invalidResponse('The junk scan returned an invalid result.', { items: [], totalBytes: 0 })));
  registerIpc("optimize:closeProcess", guardResult(guardHandler(
    requireService(services, "optimize:closeProcess"),
    payload => isPlainObject(payload)
      && Number.isSafeInteger(payload.pid) && payload.pid > 0
      && isBoundedString(payload.name, { required: true, max: 500 }),
    invalidRequest('The process-close request was malformed.'),
  ), result => isErrorResult(result) || (isPlainObject(result) && result.ok === true
    && isBoundedString(result.name, { required: true, max: 500 })),
  invalidResponse('The process-close service returned an invalid result.')));
  registerIpc("optimize:inspectGaming", guardResult(
    requireService(services, "optimize:inspectGaming"),
    result => isErrorResult(result) || (isPlainObject(result) && result.ok === true
      && isBoundedArray(result.processes, 100, isProcess)
      && isBoundedArray(result.gpu, 100, isGpuProcess)
      && isBoolean(result.gpuAvailable, { required: true })
      && isJsonObjectWithin(result.os, { maxDepth: 4, maxEntries: 40, maxString: 2000 })
      && isJsonObjectWithin(result.settings, { maxDepth: 4, maxEntries: 40, maxString: 4000 })
      && isNumberBetween(result.inspectedAt, 0, Number.MAX_SAFE_INTEGER, { required: true })),
    invalidResponse('Windows performance inspection returned an invalid result.', { processes: [], gpu: [], gpuAvailable: false, os: {}, settings: {} }),
  ));
}

module.exports = { registerOptimizeIpc };
