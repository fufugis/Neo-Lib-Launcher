const { guardHandler, guardResult, isBoundedArray, isBoundedString, isIdentifier, isJsonObjectWithin, isPlainObject } = require('./contract-guards.cjs');

const isGogItem = item => isPlainObject(item)
  && isIdentifier(item.id) && isBoundedString(item.title, { required: true, max: 500 })
  && isJsonObjectWithin(item, { maxDepth: 10, maxEntries: 1000, maxString: 50000 });

function registerGogIpc({ registerIpc, services }) {
  if (typeof registerIpc !== 'function' || !services) throw new TypeError('registerGogIpc requires registerIpc and services.');
  const requireService = (all, channel) => {
    const handler = all[channel];
    if (typeof handler !== 'function') throw new TypeError(`Missing service for ${channel}.`);
    return handler;
  };
  registerIpc("gog:search", guardResult(guardHandler(
    requireService(services, "gog:search"),
    query => isBoundedString(query, { required: true, max: 500 }),
    [],
  ), result => isBoundedArray(result, 100, isGogItem), []));
}

module.exports = { registerGogIpc };
