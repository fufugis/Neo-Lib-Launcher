const WINDOWS_SETTINGS_ROUTES = Object.freeze([
  'ms-settings:bluetooth',
  'ms-settings:display-advancedgraphics',
  'ms-settings:gaming-gamedvr',
  'ms-settings:gaming-gamemode',
  'ms-settings:powersleep',
]);

const WINDOWS_SETTINGS_ROUTE_SET = new Set(WINDOWS_SETTINGS_ROUTES);

function isAllowedWindowsSettingsRoute(value) {
  return typeof value === 'string' && WINDOWS_SETTINGS_ROUTE_SET.has(value.toLowerCase());
}

module.exports = { WINDOWS_SETTINGS_ROUTES, isAllowedWindowsSettingsRoute };
