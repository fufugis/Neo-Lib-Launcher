const { guardHandler, guardResult, invalidRequest, invalidResponse, isPath, isPlainObject, isBoundedArray, isBoundedString } = require('./contract-guards.cjs');

const isWidget = widget => isPlainObject(widget)
  && isBoundedString(widget.id, { required: true, max: 80 })
  && isBoundedString(widget.name, { required: true, max: 120 })
  && isBoundedString(widget.description, { max: 1600 })
  && isPlainObject(widget.author) && isBoundedString(widget.author.name, { required: true, max: 120 })
  && isBoundedString(widget.author.url, { max: 2048 }) && isBoundedString(widget.version, { required: true, max: 80 })
  && isBoundedString(widget.entry, { required: true, max: 240 }) && Number.isFinite(widget.installedAt);
const isImportResult = result => isPlainObject(result) && typeof result.ok === 'boolean'
  && isBoundedString(result.error, { max: 4000 }) && (!result.widget || isWidget(result.widget));

function registerWidgetsIpc({ registerIpc, widgets }) {
  if (typeof registerIpc !== 'function' || !widgets || typeof widgets.install !== 'function' || typeof widgets.list !== 'function') throw new TypeError('registerWidgetsIpc requires registerIpc and widget service.');
  registerIpc('widgets:import', guardResult(guardHandler(
    (_event, manifestPath) => widgets.install(manifestPath),
    manifestPath => isPath(manifestPath),
    invalidRequest('The widget package path was malformed.'),
  ), isImportResult, invalidResponse('Widget import returned an invalid result.')));
  registerIpc('widgets:list', guardResult(async () => ({ ok: true, widgets: await widgets.list() }),
    result => isPlainObject(result) && result.ok === true && isBoundedArray(result.widgets, 200, isWidget),
    invalidResponse('Widget list returned an invalid result.', { widgets: [] })));
}

module.exports = { registerWidgetsIpc };
