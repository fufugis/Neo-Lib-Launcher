const { guardHandler, guardResult, invalidRequest, invalidResponse, isBoolean, isBoundedArray, isBoundedString, isIdentifier, isNumberBetween, isPath, isPlainObject } = require('./contract-guards.cjs');

const isCount = value => Number.isSafeInteger(value) && value >= 0;
const isStorageResult = item => isPlainObject(item)
  && isIdentifier(item.id) && isBoundedString(item.name, { required: true, max: 500 })
  && isPath(item.exePath) && isPath(item.root)
  && isNumberBetween(item.bytes, 0, Number.MAX_SAFE_INTEGER, { required: true })
  && isCount(item.files) && isNumberBetween(item.modBytes, 0, Number.MAX_SAFE_INTEGER, { required: true })
  && isCount(item.modFiles) && isBoolean(item.truncated, { required: true }) && isBoolean(item.cached, { required: true });
const isSkipped = item => isPlainObject(item) && isIdentifier(item.id)
  && isBoundedString(item.name, { required: true, max: 500 })
  && isBoundedString(item.reason, { required: true, max: 2000 });

function registerStorageIpc({ registerIpc, services }) {
  if (typeof registerIpc !== 'function' || !services) throw new TypeError('registerStorageIpc requires registerIpc and services.');
  const requireService = (all, channel) => {
    const handler = all[channel];
    if (typeof handler !== 'function') throw new TypeError(`Missing service for ${channel}.`);
    return handler;
  };
  registerIpc("storage:scanGames", guardResult(guardHandler(
    requireService(services, "storage:scanGames"),
    payload => isPlainObject(payload)
      && (payload.games == null || isBoundedArray(payload.games, 250, game => isPlainObject(game)
        && isIdentifier(game.id)
        && isBoundedString(game.name, { max: 500 })
        && isPath(game.exePath)
        && isBoundedString(game.launcher, { max: 200 })))
      && (payload.force == null || typeof payload.force === 'boolean'),
    invalidRequest('The storage scan request was malformed.', { results: [], skipped: [] }),
  ), result => isPlainObject(result) && result.ok === true
    && isBoundedArray(result.results, 250, isStorageResult)
    && isBoundedArray(result.skipped, 40, isSkipped)
    && isNumberBetween(result.scannedAt, 0, Number.MAX_SAFE_INTEGER, { required: true }),
  invalidResponse('The storage scan returned an invalid result.', { results: [], skipped: [] })));
}

module.exports = { registerStorageIpc };
