const { guardResult, isBoundedArray, isBoundedString, isIdentifier, isJsonObjectWithin, isPlainObject } = require('./contract-guards.cjs');

const isDeal = item => isPlainObject(item)
  && isIdentifier(item.id) && isBoundedString(item.platform, { required: true, max: 200 })
  && isBoundedString(item.title, { required: true, max: 1000 })
  && isBoundedString(item.url, { required: true, max: 4096 })
  && isJsonObjectWithin(item, { maxDepth: 6, maxEntries: 100, maxString: 12000 });

function registerDealsIpc({ registerIpc, services }) {
  if (typeof registerIpc !== 'function' || !services) throw new TypeError('registerDealsIpc requires registerIpc and services.');
  const requireService = (all, channel) => {
    const handler = all[channel];
    if (typeof handler !== 'function') throw new TypeError(`Missing service for ${channel}.`);
    return handler;
  };
  registerIpc("deals:fetch", guardResult(requireService(services, "deals:fetch"), result => isBoundedArray(result, 100, isDeal), []));
}

module.exports = { registerDealsIpc };
