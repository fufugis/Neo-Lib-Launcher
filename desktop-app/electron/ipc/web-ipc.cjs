const { guardHandler, guardResult, isBoundedArray, isBoundedString, isJsonObjectWithin, isPlainObject } = require('./contract-guards.cjs');

const isWebResult = result => isPlainObject(result)
  && isBoundedString(result.url, { required: true, max: 4096 })
  && isBoundedString(result.title, { required: true, max: 2000 })
  && isBoundedString(result.snippet, { max: 24000 });

function registerWebIpc({ registerIpc, services }) {
  if (typeof registerIpc !== 'function' || !services) throw new TypeError('registerWebIpc requires registerIpc and services.');
  const requireService = (all, channel) => {
    const handler = all[channel];
    if (typeof handler !== 'function') throw new TypeError(`Missing service for ${channel}.`);
    return handler;
  };
  registerIpc("web:search", guardResult(guardHandler(
    requireService(services, "web:search"),
    query => isBoundedString(query, { required: true, max: 500 }),
    { results: [], synthesized: null, error: 'The web-search request was malformed.' },
  ), result => isPlainObject(result)
    && isBoundedArray(result.results, 100, isWebResult)
    && (result.synthesized === null || isJsonObjectWithin(result.synthesized, { maxDepth: 10, maxEntries: 1000, maxString: 50000 })),
  { results: [], synthesized: null, error: 'The web-search service returned an invalid result.', code: 'INVALID_RESPONSE' }));
}

module.exports = { registerWebIpc };
