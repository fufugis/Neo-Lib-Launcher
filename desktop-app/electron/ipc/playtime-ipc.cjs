const { guardHandler, guardResult, invalidRequest, invalidResponse, isBoundedString, isJsonObjectWithin, isNumberBetween, isPlainObject } = require('./contract-guards.cjs');

function registerPlaytimeIpc({ registerIpc, playtimeHistory }) {
  if (typeof registerIpc !== 'function' || typeof playtimeHistory?.read !== 'function') {
    throw new TypeError('registerPlaytimeIpc requires registerIpc and playtimeHistory.');
  }
  registerIpc('playtime:history', guardResult(guardHandler(
    (_event, options) => playtimeHistory.read(options),
    options => options === undefined || (isPlainObject(options) && isNumberBetween(options.days, 1, 3650)),
    invalidRequest('The playtime-history request was malformed.', { deltas: {} }),
  ), result => isPlainObject(result) && typeof result.ok === 'boolean'
    && isJsonObjectWithin(result.deltas, { maxDepth: 3, maxEntries: 10000, maxString: 100 })
    && (result.ok === true
      ? isNumberBetween(result.lastSnapshotAt, 0, Number.MAX_SAFE_INTEGER, { required: true })
      : isBoundedString(result.error, { required: true, max: 4000 })),
  invalidResponse('Playtime history returned an invalid result.', { deltas: {} })));
}

module.exports = { registerPlaytimeIpc };
