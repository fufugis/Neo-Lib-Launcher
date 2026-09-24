const { guardHandler, guardResult, invalidRequest, invalidResponse, isBoolean, isBoundedArray, isBoundedString, isIdentifier, isJsonObjectWithin, isNumberBetween, isPath, isPlainObject } = require('./contract-guards.cjs');

const validAppid = value => isIdentifier(value) && /^\d{1,12}$/.test(String(value));
const isCount = value => Number.isSafeInteger(value) && value >= 0;
const isErrorResult = result => isPlainObject(result) && result.ok === false
  && isBoundedString(result.error, { required: true, max: 2000 });
const isSearchItem = item => isPlainObject(item) && validAppid(item.appid)
  && isBoundedString(item.name, { required: true, max: 500 })
  && isBoundedString(item.tinyImage, { max: 4096 })
  && isNumberBetween(item.price, 0, Number.MAX_SAFE_INTEGER);
const isDetail = detail => detail === null || (isJsonObjectWithin(detail, { maxDepth: 10, maxEntries: 1000, maxString: 50000 })
  && validAppid(detail.appid) && isBoundedString(detail.name, { required: true, max: 500 }));
const isManifest = result => isErrorResult(result) || (isPlainObject(result) && result.ok === true
  && validAppid(result.appid) && isBoundedString(result.name, { required: true, max: 500 })
  && isBoundedString(result.buildid, { max: 500 })
  && isNumberBetween(result.lastUpdated, 0, Number.MAX_SAFE_INTEGER, { required: true })
  && isNumberBetween(result.sizeOnDisk, 0, Number.MAX_SAFE_INTEGER, { required: true })
  && isNumberBetween(result.stateFlags, 0, Number.MAX_SAFE_INTEGER, { required: true })
  && isNumberBetween(result.bytesToDownload, 0, Number.MAX_SAFE_INTEGER, { required: true })
  && isNumberBetween(result.bytesDownloaded, 0, Number.MAX_SAFE_INTEGER, { required: true })
  && isBoundedString(result.updateResult, { max: 500 }) && isPath(result.library)
  && isBoolean(result.cached));
const isPlaytimeResult = result => isErrorResult(result) || (isPlainObject(result) && result.ok === true
  && isJsonObjectWithin(result.data, { maxDepth: 5, maxEntries: 12000, maxString: 500 })
  && isBoundedArray(result.ownedAppids, 10000, validAppid)
  && isPlainObject(result.currentAccount) && validAppid(result.currentAccount.steamid3)
  && isBoundedString(result.currentAccount.personaName, { max: 500 })
  && isCount(result.count) && isCount(result.ownedCount)
  && isJsonObjectWithin(result.debug, { maxDepth: 8, maxEntries: 5000, maxString: 32767 })
  && isBoolean(result.cached));

function registerSteamIpc({ registerIpc, services }) {
  if (typeof registerIpc !== 'function' || !services) throw new TypeError('registerSteamIpc requires registerIpc and services.');
  const requireService = (all, channel) => {
    const handler = all[channel];
    if (typeof handler !== 'function') throw new TypeError(`Missing service for ${channel}.`);
    return handler;
  };
  registerIpc('steam:achievements', guardResult(guardHandler(
    requireService(services, 'steam:achievements'),
    payload => isPlainObject(payload)
      && isBoundedString(payload.apiKey, { required: true, max: 64 }) && /^[a-f0-9]{32}$/i.test(payload.apiKey)
      && validAppid(payload.appid) && validAppid(payload.steamid3),
    invalidRequest('The Steam achievement request was malformed.'),
  ), result => isErrorResult(result) || (isPlainObject(result) && result.ok === true
    && result.source === 'steam' && validAppid(result.appid)
    && /^\d{17}$/.test(String(result.steamid64 || ''))
    && isCount(result.earned) && isCount(result.total) && result.earned <= result.total
    && isCount(result.syncedAt)), invalidResponse('Steam achievement progress was invalid.')));
  registerIpc("steam:importPlaytime", guardResult(guardHandler(
    requireService(services, "steam:importPlaytime"),
    payload => payload === undefined || (isPlainObject(payload) && isBoolean(payload.force)),
    invalidRequest('The Steam playtime request was malformed.'),
  ), isPlaytimeResult, invalidResponse('Steam playtime import returned an invalid result.', { data: {}, ownedAppids: [], currentAccount: null })));
  registerIpc("steam:manifest", guardResult(
    guardHandler(requireService(services, "steam:manifest"), validAppid, invalidRequest('The Steam manifest request was malformed.')),
    isManifest,
    invalidResponse('The Steam manifest reader returned an invalid result.'),
  ));
  registerIpc("steam:details", guardResult(guardHandler(requireService(services, "steam:details"), validAppid, null), isDetail, null));
  registerIpc("steam:search", guardResult(guardHandler(
    requireService(services, "steam:search"),
    query => isBoundedString(query, { required: true, max: 500 }),
    [],
  ), result => isBoundedArray(result, 100, isSearchItem), []));
}

module.exports = { registerSteamIpc };
