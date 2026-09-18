const { guardHandler, guardResult, invalidRequest, invalidResponse, isBoolean, isPlainObject } = require('./contract-guards.cjs');

function registerAppLifecycleIpc({ registerIpc, appLifecycle }) {
  if (typeof registerIpc !== 'function' || !appLifecycle) throw new TypeError('registerAppLifecycleIpc requires registerIpc and appLifecycle.');
  const isDiscordResult = result => isPlainObject(result) && result.ok === true && isBoolean(result.hasAppId, { required: true });
  const isDiscordStatus = result => isPlainObject(result)
    && isBoolean(result.hasAppId, { required: true }) && isBoolean(result.installed, { required: true }) && isBoolean(result.ready, { required: true });
  registerIpc('app:setMinimizeToTray', guardResult(guardHandler((_event, enabled) => appLifecycle.setMinimizeToTray(enabled), enabled => isBoolean(enabled, { required: true }), false), value => typeof value === 'boolean', false));
  registerIpc('app:setDiscordRpc', guardResult(guardHandler((_event, enabled) => appLifecycle.setDiscordRpc(enabled), enabled => isBoolean(enabled, { required: true }), invalidRequest('The Discord setting request was malformed.')), isDiscordResult, invalidResponse('The Discord setting returned an invalid result.')));
  registerIpc('app:discordRpcStatus', guardResult(() => appLifecycle.discordRpcStatus(), isDiscordStatus, { hasAppId: false, installed: false, ready: false, code: 'INVALID_RESPONSE' }));
  registerIpc('app:quit', guardResult(() => appLifecycle.quit(), value => value === true, false));
}

module.exports = { registerAppLifecycleIpc };
