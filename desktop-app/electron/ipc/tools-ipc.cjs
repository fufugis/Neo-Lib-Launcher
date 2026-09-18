const { guardHandler, guardResult, invalidRequest, invalidResponse, isBoundedArray, isBoundedString, isIdentifier, isJsonObjectWithin, isNumberBetween, isPath, isPlainObject } = require('./contract-guards.cjs');

const MANAGED_TOOLS = new Set(['gpuz', 'cpuz']);
const isErrorResult = result => isPlainObject(result) && result.ok === false
  && isBoundedString(result.error, { required: true, max: 4000 });
const isToolMetadata = result => isPlainObject(result)
  && isBoundedString(result.source, { required: true, max: 500 })
  && isBoundedString(result.name, { required: true, max: 500 })
  && isBoundedString(result.shortDescription, { max: 1000 })
  && isBoundedString(result.about, { max: 5000 })
  && isBoundedArray(result.developers, 100, value => isBoundedString(value, { required: true, max: 500 }))
  && isBoundedArray(result.genres, 100, value => isBoundedString(value, { required: true, max: 500 }))
  && isNumberBetween(result.metadataFetchedAt, 0, Number.MAX_SAFE_INTEGER, { required: true })
  && isJsonObjectWithin(result, { maxDepth: 8, maxEntries: 500, maxString: 24000 });
const isManagedToolResult = result => isErrorResult(result) || (isPlainObject(result) && result.ok === true
  && isPath(result.exePath, { required: false })
  && (result.installed == null || typeof result.installed === 'boolean')
  && isBoundedString(result.mode, { max: 200 })
  && isBoundedString(result.officialPage, { max: 4096 })
  && isBoundedString(result.error, { max: 4000 }));
const isVerifiedToolResult = result => isErrorResult(result) || (isPlainObject(result) && result.ok === true
  && isPath(result.exePath));
const isAdapter = adapter => isPlainObject(adapter)
  && isBoundedString(adapter.name, { required: true, max: 500 })
  && isBoundedString(adapter.videoProcessor, { max: 500 })
  && isBoundedString(adapter.driverVersion, { max: 500 })
  && isBoundedString(adapter.pnpDeviceId, { max: 2000 })
  && isNumberBetween(adapter.memoryBytes, 0, Number.MAX_SAFE_INTEGER, { required: true });
const isGpuSetup = result => isPlainObject(result) && result.ok === true
  && isBoundedArray(result.adapters, 32, isAdapter)
  && isPlainObject(result.primary) && isBoundedString(result.primary.name, { required: true, max: 500 })
  && isBoundedString(result.primary.vendor, { required: true, max: 100 })
  && isJsonObjectWithin(result.controlCenter, { maxDepth: 5, maxEntries: 50, maxString: 32767 })
  && isJsonObjectWithin(result.utilities, { maxDepth: 5, maxEntries: 50, maxString: 32767 });

function registerToolsIpc({ registerIpc, services }) {
  if (typeof registerIpc !== 'function' || !services) throw new TypeError('registerToolsIpc requires registerIpc and services.');
  const requireService = (all, channel) => {
    const handler = all[channel];
    if (typeof handler !== 'function') throw new TypeError(`Missing service for ${channel}.`);
    return handler;
  };
  registerIpc("tools:fetchMetadata", guardResult(guardHandler(
    requireService(services, "tools:fetchMetadata"),
    payload => isPlainObject(payload)
      && isBoundedString(payload.query, { max: 500 })
      && isPath(payload.exePath, { required: false })
      && Boolean(String(payload.query || '').trim() || String(payload.exePath || '').trim()),
    invalidRequest('The tool metadata request was malformed.'),
  ), isToolMetadata, invalidResponse('Tool metadata returned an invalid result.')));
  registerIpc("tools:installManagedTool", guardResult(guardHandler(
    requireService(services, "tools:installManagedTool"),
    toolId => MANAGED_TOOLS.has(toolId),
    invalidRequest('The managed-tool install request was malformed.'),
  ), isManagedToolResult, invalidResponse('The managed-tool installer returned an invalid result.')));
  registerIpc("tools:verifyManagedTool", guardResult(guardHandler(
    requireService(services, "tools:verifyManagedTool"),
    payload => isPlainObject(payload) && MANAGED_TOOLS.has(payload.toolId) && isPath(payload.exePath),
    invalidRequest('The managed-tool verification request was malformed.'),
  ), isVerifiedToolResult, invalidResponse('Managed-tool verification returned an invalid result.')));
  registerIpc("tools:detectGpuSetup", guardResult(
    requireService(services, "tools:detectGpuSetup"),
    isGpuSetup,
    invalidResponse('GPU setup detection returned an invalid result.', { adapters: [] }),
  ));
}

module.exports = { registerToolsIpc };
