const { guardHandler, guardResult, isBoundedString, isHttpUrl, isPath, isPlainObject } = require('./contract-guards.cjs');

function registerImageIpc({ registerIpc, imageCache }) {
  if (typeof registerIpc !== 'function' || typeof imageCache?.cache !== 'function') {
    throw new TypeError('registerImageIpc requires registerIpc and imageCache.');
  }
  registerIpc('image:cache', guardResult(guardHandler(
    (_event, request) => imageCache.cache(request),
    request => isPlainObject(request) && isHttpUrl(request.url) && isBoundedString(request.name, { max: 500 }),
    null,
  ), value => value === null || isPath(value), null));
}

module.exports = { registerImageIpc };
