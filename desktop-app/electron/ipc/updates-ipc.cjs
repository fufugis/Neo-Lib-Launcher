const { guardHandler, guardResult, invalidRequest, invalidResponse, isBoolean, isBoundedArray, isBoundedString, isHttpUrl, isIdentifier, isJsonObjectWithin, isNumberBetween, isPath, isPlainObject } = require('./contract-guards.cjs');

const isCount = value => Number.isSafeInteger(value) && value >= 0;
const isErrorResult = result => isPlainObject(result) && result.ok === false
  && isBoundedString(result.error, { required: true, max: 4000 });
const isHistoryEntry = entry => isPlainObject(entry)
  && isBoundedString(entry.version, { required: true, max: 500 })
  && isBoundedString(entry.date, { max: 200 })
  && isBoundedString(entry.summary, { max: 2000 })
  && isHttpUrl(entry.url)
  && (entry.newerThanInstalled === null || typeof entry.newerThanInstalled === 'boolean');
const isUpdateRecord = entry => isJsonObjectWithin(entry, { maxDepth: 10, maxEntries: 500, maxString: 24000 });

function validUpdateGame(game) {
  return isPlainObject(game)
    && isIdentifier(game.id, { required: false })
    && isIdentifier(game.appid, { required: false })
    && isBoundedString(game.name, { max: 500 })
    && isBoundedString(game.launcher, { max: 200 })
    && isBoundedString(game.source, { max: 200 })
    && isBoolean(game.steamOwned)
    && isBoundedString(game.installedVersion, { max: 500 })
    && isHttpUrl(game.updateWatchUrl, { required: false })
    && isHttpUrl(game.website, { required: false })
    && isPath(game.exePath, { required: false });
}

function registerUpdatesIpc({ registerIpc, services }) {
  if (typeof registerIpc !== 'function' || !services) throw new TypeError('registerUpdatesIpc requires registerIpc and services.');
  const requireService = (all, channel) => {
    const handler = all[channel];
    if (typeof handler !== 'function') throw new TypeError(`Missing service for ${channel}.`);
    return handler;
  };
  registerIpc("updates:history", guardResult(guardHandler(
    requireService(services, "updates:history"),
    payload => isPlainObject(payload)
      && isHttpUrl(payload.url)
      && isBoundedString(payload.currentVersion, { max: 500 }),
    invalidRequest('The update-history request was malformed.', { entries: [] }),
  ), result => isErrorResult(result) || (isPlainObject(result) && result.ok === true
    && isBoundedArray(result.entries, 20, isHistoryEntry)
    && isHttpUrl(result.sourceUrl)
    && isBoundedString(result.currentVersion, { max: 500 })
    && isNumberBetween(result.fetchedAt, 0, Number.MAX_SAFE_INTEGER, { required: true })),
  invalidResponse('Update history returned an invalid result.', { entries: [] })));
  registerIpc("updates:scan", guardResult(guardHandler(
    requireService(services, "updates:scan"),
    payload => payload === undefined || (isPlainObject(payload)
      && (payload.games == null || isBoundedArray(payload.games, 2500, validUpdateGame))
      && isBoolean(payload.force)),
    invalidRequest('The update-scan request was malformed.', { items: [], needsSetup: [], ledger: [], checked: 0 }),
  ), result => isPlainObject(result) && result.ok === true
    && isCount(result.checked)
    && isCount(result.launcherManagedCount)
    && isBoundedArray(result.items, 2500, isUpdateRecord)
    && isBoundedArray(result.needsSetup, 20, isUpdateRecord)
    && isBoundedArray(result.ledger, 2500, isUpdateRecord)
    && isNumberBetween(result.scannedAt, 0, Number.MAX_SAFE_INTEGER, { required: true })
    && isBoundedString(result.confidence, { required: true, max: 500 })
    && isBoolean(result.cached),
  invalidResponse('The update scan returned an invalid result.', { items: [], needsSetup: [], ledger: [], checked: 0 })));
}

module.exports = { registerUpdatesIpc };
