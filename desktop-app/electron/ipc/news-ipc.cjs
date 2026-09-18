const { guardHandler, guardResult, invalidRequest, invalidResponse, isBoolean, isBoundedArray, isBoundedString, isIdentifier, isJsonObjectWithin, isNumberBetween, isPlainObject } = require('./contract-guards.cjs');

const isCount = value => Number.isSafeInteger(value) && value >= 0;
const isNewsItem = item => isJsonObjectWithin(item, { maxDepth: 7, maxEntries: 100, maxString: 24000 })
  && isBoundedString(item.platform, { required: true, max: 200 })
  && isBoundedString(item.title, { required: true, max: 2000 })
  && isBoundedString(item.url, { required: true, max: 4096 })
  && isNumberBetween(item.date, 0, Number.MAX_SAFE_INTEGER, { required: true })
  && isBoundedString(item.snippet, { max: 24000 });
const isNewsFeed = result => isPlainObject(result) && result.ok === true
  && isBoundedArray(result.items, 10000, isNewsItem)
  && isNumberBetween(result.fetchedAt, 0, Number.MAX_SAFE_INTEGER, { required: true })
  && isBoolean(result.cached);

function validNewsGame(game) {
  return isPlainObject(game)
    && isIdentifier(game.id, { required: false })
    && isIdentifier(game.appid, { required: false })
    && isIdentifier(game.gogId, { required: false })
    && isBoundedString(game.name, { max: 500 })
    && isBoundedString(game.website, { max: 4096 })
    && isBoundedString(game.source, { max: 200 })
    && isBoundedString(game.launcher, { max: 200 });
}

function validNewsRequest(payload) {
  return (payload === undefined || (isPlainObject(payload)
    && (payload.games == null || isBoundedArray(payload.games, 2500, validNewsGame))
    && isNumberBetween(payload.days, 1, 365)
    && isBoolean(payload.force)));
}

function registerNewsIpc({ registerIpc, services }) {
  if (typeof registerIpc !== 'function' || !services) throw new TypeError('registerNewsIpc requires registerIpc and services.');
  const requireService = (all, channel) => {
    const handler = all[channel];
    if (typeof handler !== 'function') throw new TypeError(`Missing service for ${channel}.`);
    return handler;
  };
  registerIpc("news:latestForGame", guardResult(guardHandler(
    requireService(services, "news:latestForGame"),
    game => game == null || validNewsGame(game),
    invalidRequest('The latest-news request was malformed.', { item: null }),
  ), result => isPlainObject(result) && result.ok === true
    && (result.item === null || isNewsItem(result.item)) && isBoolean(result.cached),
  invalidResponse('Latest-news lookup returned an invalid result.', { item: null })));
  registerIpc("news:fetchAll", guardResult(guardHandler(
    requireService(services, "news:fetchAll"),
    validNewsRequest,
    invalidRequest('The all-launcher news request was malformed.', { items: [] }),
  ), result => isNewsFeed(result)
    && isPlainObject(result.counts) && Object.values(result.counts).every(isCount)
    && isPlainObject(result.sources) && Object.values(result.sources).every(isCount),
  invalidResponse('The all-launcher news feed returned an invalid result.', { items: [], counts: {}, sources: {} })));
  registerIpc("news:fetchSteam", guardResult(guardHandler(
    requireService(services, "news:fetchSteam"),
    validNewsRequest,
    invalidRequest('The Steam-news request was malformed.', { items: [] }),
  ), isNewsFeed, invalidResponse('The Steam-news feed returned an invalid result.', { items: [] })));
}

module.exports = { registerNewsIpc };
