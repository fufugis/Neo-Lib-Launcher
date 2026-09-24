const { guardHandler, guardResult, invalidRequest, invalidResponse, isBoolean, isIdentifier, isNumberBetween, isPath, isPlainObject, isBoundedArray, isBoundedString } = require('./contract-guards.cjs');

const isWidget = widget => isPlainObject(widget)
  && isBoundedString(widget.id, { required: true, max: 80 })
  && isBoundedString(widget.name, { required: true, max: 120 })
  && isBoundedString(widget.description, { max: 1600 })
  && isPlainObject(widget.author) && isBoundedString(widget.author.name, { required: true, max: 120 })
  && isBoundedString(widget.author.url, { max: 2048 }) && isBoundedString(widget.version, { required: true, max: 80 })
  && isBoundedString(widget.entry, { required: true, max: 240 }) && Number.isFinite(widget.installedAt)
  && isNumberBetween(widget.apiVersion, 1, 99, { required: true }) && isBoolean(widget.compatible, { required: true })
  && isBoundedArray(widget.permissions, 3, permission => ['storage', 'library.read', 'network'].includes(permission));
const isImportResult = result => isPlainObject(result) && typeof result.ok === 'boolean'
  && isBoundedString(result.error, { max: 4000 }) && isBoundedString(result.currentVersion, { max: 80 })
  && isBoundedString(result.replacedVersion, { max: 80 }) && (!result.widget || isWidget(result.widget));
const validId = id => isBoundedString(id, { required: true, max: 80 }) && /^[a-z0-9](?:[a-z0-9.-]{1,78}[a-z0-9])?$/.test(id);
const isActionResult = result => isPlainObject(result) && typeof result.ok === 'boolean'
  && isBoundedString(result.error, { max: 4000 }) && isIdentifier(result.id, { required: false });

function registerWidgetsIpc({ registerIpc, widgets }) {
  if (typeof registerIpc !== 'function' || !widgets || !['install', 'update', 'list', 'runtime', 'remove', 'restore'].every(method => typeof widgets[method] === 'function')) throw new TypeError('registerWidgetsIpc requires the complete widget service.');
  registerIpc('widgets:import', guardResult(guardHandler(
    (_event, manifestPath) => widgets.install(manifestPath),
    manifestPath => isPath(manifestPath),
    invalidRequest('The widget package path was malformed.'),
  ), isImportResult, invalidResponse('Widget import returned an invalid result.')));
  registerIpc('widgets:update', guardResult(guardHandler(
    (_event, manifestPath) => widgets.update(manifestPath), manifestPath => isPath(manifestPath),
    invalidRequest('The widget update path was malformed.'),
  ), isImportResult, invalidResponse('Widget update returned an invalid result.')));
  registerIpc('widgets:list', guardResult(async () => ({ ok: true, ...await widgets.list() }),
    result => isPlainObject(result) && result.ok === true && isBoundedArray(result.widgets, 200, isWidget) && isBoundedArray(result.recoverable, 200, isWidget),
    invalidResponse('Widget list returned an invalid result.', { widgets: [], recoverable: [] })));
  registerIpc('widgets:runtime', guardResult(guardHandler(
    (_event, id) => widgets.runtime(id), validId, invalidRequest('The widget identity was malformed.'),
  ), result => isPlainObject(result) && typeof result.ok === 'boolean' && isBoundedString(result.error, { max: 4000 }) && isBoundedString(result.html, { max: 5 * 1024 * 1024 }) && (!result.widget || isWidget(result.widget)), invalidResponse('Widget runtime returned an invalid result.')));
  registerIpc('widgets:remove', guardResult(guardHandler(
    (_event, id) => widgets.remove(id), validId, invalidRequest('The widget identity was malformed.'),
  ), isActionResult, invalidResponse('Widget removal returned an invalid result.')));
  registerIpc('widgets:restore', guardResult(guardHandler(
    (_event, id) => widgets.restore(id), validId, invalidRequest('The widget identity was malformed.'),
  ), isActionResult, invalidResponse('Widget recovery returned an invalid result.')));
}

module.exports = { registerWidgetsIpc };
