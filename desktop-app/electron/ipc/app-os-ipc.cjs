const { guardHandler, guardResult, invalidRequest, invalidResponse, isBoolean, isBoundedString, isHttpUrl, isPath, isPlainObject } = require('./contract-guards.cjs');
const { isAllowedWindowsSettingsRoute } = require('../app/windows-settings-routes.cjs');

const GAME_PROTOCOL = /^(?:steam:\/\/run\/|com\.epicgames\.launcher:\/\/apps\/.*(?:action=launch|launch)|uplay:\/\/launch\/|battlenet:\/\/|ea(?:desktop)?:\/\/.*launch|riotclient:\/\/)/i;
const validExternalTarget = value => isHttpUrl(value) || isAllowedWindowsSettingsRoute(value) || (isBoundedString(value, { required: true, max: 4096 }) && GAME_PROTOCOL.test(value));

function registerAppOsIpc({ registerIpc, appOs }) {
  if (typeof registerIpc !== 'function' || !appOs) throw new TypeError('registerAppOsIpc requires registerIpc and appOs.');
  const isActionResult = result => isPlainObject(result) && typeof result.ok === 'boolean'
    && isBoundedString(result.error, { max: 4000 }) && isPath(result.opened, { required: false })
    && isBoolean(result.missingTarget);
  registerIpc('app:openExternal', guardResult(guardHandler((_event, value) => appOs.openExternal(value), validExternalTarget, invalidRequest('Only a valid public HTTP/HTTPS link or approved Windows settings page can be opened.')), isActionResult, invalidResponse('Opening the external link returned an invalid result.')));
  registerIpc('app:revealInFolder', guardResult(guardHandler((_event, value) => appOs.revealInFolder(value), value => isPath(value), invalidRequest('The reveal request was malformed.')), isActionResult, invalidResponse('Reveal in folder returned an invalid result.')));
  registerIpc('app:openContainingDir', guardResult(guardHandler((_event, value) => appOs.openContainingDir(value), value => isPath(value), undefined), value => value === undefined, undefined));
  registerIpc('app:setAutoStart', guardResult(guardHandler((_event, enabled) => appOs.setAutoStart(enabled), enabled => isBoolean(enabled, { required: true }), invalidRequest('The auto-start request was malformed.')), isActionResult, invalidResponse('The auto-start setting returned an invalid result.')));
  registerIpc('app:getAutoStart', guardResult(() => appOs.getAutoStart(), value => typeof value === 'boolean', false));
  registerIpc('app:openPath', guardResult(guardHandler((_event, value) => appOs.openPath(value), value => isPath(value), invalidRequest('The open-path request was malformed.')), isActionResult, invalidResponse('Opening the path returned an invalid result.')));
  registerIpc('app:checkLibraryRoot', guardResult(guardHandler((_event, value) => appOs.checkLibraryRoot(value), value => isPath(value), invalidRequest('The library-root check was malformed.')), result => isPlainObject(result) && typeof result.ok === 'boolean' && typeof result.available === 'boolean' && isBoundedString(result.error, { max: 4000 }), invalidResponse('The library-root check returned an invalid result.')));
}

module.exports = { registerAppOsIpc };
