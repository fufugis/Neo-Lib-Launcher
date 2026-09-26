const { guardHandler, guardResult, invalidRequest, invalidResponse, isPath, isPlainObject, isBoundedString, isBoundedArray } = require('./contract-guards.cjs');

function registerThemesIpc({ registerIpc, themes }) {
  if (typeof registerIpc !== 'function' || !themes) throw new TypeError('Theme IPC needs a theme service.');
  const isResult = result => isPlainObject(result) && typeof result.ok === 'boolean'
    && isBoundedString(result.error, { max: 2000 });
  registerIpc('themes:inspect', guardResult(guardHandler(
    (_event, manifestPath) => themes.inspect(manifestPath), isPath,
    invalidRequest('Select a valid theme manifest path.'),
  ), isResult, invalidResponse('Theme inspection failed.')));
  registerIpc('themes:install', guardResult(guardHandler(
    (_event, manifestPath) => themes.install(manifestPath), isPath,
    invalidRequest('Select a valid theme manifest path.'),
  ), isResult, invalidResponse('Theme installation failed.')));
  registerIpc('themes:fork', guardResult(guardHandler(
    (_event, request) => themes.fork(request),
    request => isPlainObject(request) && isBoundedString(request.sourceId, { required: true, max: 64 })
      && isBoundedString(request.newId, { required: true, max: 64 })
      && isBoundedString(request.newName, { required: true, max: 80 })
      && isBoundedString(request.creator, { required: true, max: 80 })
      && ['bright', 'middle', 'dark', 'special'].includes(request.tone)
      && isPlainObject(request.palette) && Object.keys(request.palette).length === 10
      && isPlainObject(request.panels) && Object.keys(request.panels).length === 3
      && (request.layers === undefined || (isPlainObject(request.layers)
        && Object.keys(request.layers).length === 7
        && Object.values(request.layers).every(layer => isPlainObject(layer)
          && ['none', 'gradient', 'image', 'gif', 'video'].includes(layer.type)
          && isBoundedString(layer.asset, { max: 240 })
          && isBoundedString(layer.sourcePath, { max: 32767 })
          && isBoundedString(layer.reducedMotionAsset, { max: 240 })
          && isBoundedString(layer.reducedMotionSourcePath, { max: 32767 }))))
      && isBoundedArray(request.particles, 3, particle => isPlainObject(particle)
        && isBoundedString(particle.id, { required: true, max: 32 })
        && isBoundedString(particle.asset, { max: 240 })
        && isBoundedString(particle.sourcePath, { max: 32767 })),
    invalidRequest('Theme remix details are malformed.'),
  ), isResult, invalidResponse('Theme remix failed.')));
  registerIpc('themes:list', guardResult(() => themes.list(),
    result => isPlainObject(result) && result.ok === true && isBoundedArray(result.themes, 100, isPlainObject),
    invalidResponse('Could not list installed themes.', { themes: [] })));
}

module.exports = { registerThemesIpc };
