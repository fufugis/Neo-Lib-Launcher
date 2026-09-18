const { guardHandler, guardResult, invalidRequest, invalidResponse, isBoolean, isBoundedArray, isBoundedString, isIdentifier, isJsonObjectWithin, isNumberBetween, isPlainObject } = require('./contract-guards.cjs');

const RELEASE_TIERS = new Set(['major', 'semi-major', 'popular', 'none']);
const isErrorResult = result => isPlainObject(result) && result.ok === false
  && isBoundedString(result.error, { required: true, max: 4000 })
  && isBoundedArray(result.items, 0);
const isRelease = item => isJsonObjectWithin(item, { maxDepth: 7, maxEntries: 100, maxString: 12000 })
  && isIdentifier(item.id) && isIdentifier(item.appid)
  && isBoundedString(item.title, { required: true, max: 1000 })
  && isBoundedString(item.url, { required: true, max: 4096 })
  && isNumberBetween(item.releaseAt, 0, Number.MAX_SAFE_INTEGER, { required: true });

function registerReleasesIpc({ registerIpc, services }) {
  if (typeof registerIpc !== 'function' || !services) throw new TypeError('registerReleasesIpc requires registerIpc and services.');
  const requireService = (all, channel) => {
    const handler = all[channel];
    if (typeof handler !== 'function') throw new TypeError(`Missing service for ${channel}.`);
    return handler;
  };
  registerIpc("releases:weekly", guardResult(guardHandler(
    requireService(services, "releases:weekly"),
    payload => payload === undefined || (isPlainObject(payload) && isBoolean(payload.force)),
    invalidRequest('The weekly-release request was malformed.', { items: [] }),
  ), result => isErrorResult(result) || (isPlainObject(result) && result.ok === true
    && isBoundedArray(result.items, 12, isRelease)
    && RELEASE_TIERS.has(result.tier)
    && isBoundedString(result.criteria, { required: true, max: 4000 })
    && isNumberBetween(result.fetchedAt, 0, Number.MAX_SAFE_INTEGER, { required: true })
    && isBoolean(result.cached)),
  invalidResponse('The weekly-release feed returned an invalid result.', { items: [] })));
}

module.exports = { registerReleasesIpc };
