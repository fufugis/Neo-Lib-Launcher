const { guardHandler, guardResult, invalidRequest, invalidResponse, isBoolean, isBoundedArray, isBoundedString, isIdentifier, isJsonObjectWithin, isPath, isPlainObject } = require('./contract-guards.cjs');

const SOCIAL_PLATFORMS = new Set(['steam', 'epic', 'ea', 'ubisoft', 'battlenet']);
function validManualPaths(value) {
  if (value === undefined) return true;
  if (!isPlainObject(value) || Object.keys(value).some(key => !SOCIAL_PLATFORMS.has(key))) return false;
  return Object.values(value).every(clientPath => isPath(clientPath, { required: false }));
}

const SCAN_CHANNELS = ['steam', 'epic', 'gog', 'ea', 'ubisoft', 'battlenet', 'riot', 'xbox', 'rockstar', 'itch'];
const isActionResult = result => isPlainObject(result) && typeof result.ok === 'boolean'
  && isBoundedString(result.error, { max: 4000 });
const isRunningMap = result => isPlainObject(result)
  && Object.keys(result).every(key => SCAN_CHANNELS.includes(key))
  && Object.values(result).every(value => isBoolean(value, { required: true }));
const isClient = client => isPlainObject(client)
  && isBoolean(client.running, { required: true }) && isBoolean(client.installed, { required: true })
  && isPath(client.path, { required: false })
  && ['', 'manual', 'standard'].includes(client.pathSource)
  && isBoolean(client.savedPathMissing, { required: true });
const isClientMap = result => isPlainObject(result)
  && [...SOCIAL_PLATFORMS].every(platform => isClient(result[platform]))
  && Object.keys(result).every(key => SOCIAL_PLATFORMS.has(key));
const isScanItem = item => isJsonObjectWithin(item, { maxDepth: 7, maxEntries: 100, maxString: 32767 })
  && isBoundedString(item.name, { required: true, max: 500 })
  && isPath(item.exe, { required: false })
  && isPath(item.launchExe, { required: false })
  && isBoundedString(item.launchUrl, { max: 4096 })
  && Boolean(String(item.exe || item.launchExe || item.launchUrl || '').trim())
  && isPath(item.installdir)
  && isIdentifier(item.appid, { required: false })
  && isIdentifier(item.gogId, { required: false })
  && isIdentifier(item.launcherProductId, { required: false })
  && isBoundedString(item.launcher, { max: 100 })
  && isBoundedString(item.source, { max: 100 });
const isScanResult = result => isPlainObject(result) && (
  (result.ok === false && isBoundedString(result.error, { required: true, max: 4000 })
    && (result.items == null || isBoundedArray(result.items, 0)))
  || (result.ok === true && isBoundedArray(result.items, 2000, isScanItem)
    && isBoundedString(result.source, { required: true, max: 100 }))
);

function registerLauncherIpc({ registerIpc, services }) {
  if (typeof registerIpc !== 'function' || !services) throw new TypeError('registerLauncherIpc requires registerIpc and services.');
  const requireService = (all, channel) => {
    const handler = all[channel];
    if (typeof handler !== 'function') throw new TypeError(`Missing service for ${channel}.`);
    return handler;
  };
  registerIpc("launcher:openDownloads", guardResult(guardHandler(
    requireService(services, "launcher:openDownloads"),
    platform => SOCIAL_PLATFORMS.has(platform),
    invalidRequest('The launcher-downloads request was malformed.'),
  ), isActionResult, invalidResponse('Opening the launcher downloads page returned an invalid result.')));
  registerIpc("launcher:openSocial", guardResult(guardHandler(
    requireService(services, "launcher:openSocial"),
    (platform, manualPath) => SOCIAL_PLATFORMS.has(platform) && isPath(manualPath, { required: false }),
    invalidRequest('The launcher-open request was malformed.'),
  ), isActionResult, invalidResponse('Opening the launcher returned an invalid result.')));
  registerIpc("launcher:openSteamController", guardResult(
    requireService(services, "launcher:openSteamController"),
    isActionResult,
    invalidResponse('Opening Steam Input returned an invalid result.'),
  ));
  registerIpc("launcher:pickSocialClient", guardResult(guardHandler(
    requireService(services, "launcher:pickSocialClient"),
    platform => SOCIAL_PLATFORMS.has(platform),
    null,
  ), value => value === null || isPath(value), null));
  registerIpc("launcher:inspectSocialClients", guardResult(guardHandler(
    requireService(services, "launcher:inspectSocialClients"),
    validManualPaths,
    {},
  ), isClientMap, {}));
  registerIpc("launcher:detect", guardResult(requireService(services, "launcher:detect"), isRunningMap, {}));
  const scanHandler = (channel, launcher) => guardResult(
      requireService(services, channel),
      isScanResult,
      invalidResponse(`The ${launcher} launcher scan returned an invalid result.`, { items: [] }),
    );
  registerIpc("launcher:scan-steam", scanHandler("launcher:scan-steam", "steam"));
  registerIpc("launcher:scan-epic", scanHandler("launcher:scan-epic", "epic"));
  registerIpc("launcher:scan-gog", scanHandler("launcher:scan-gog", "gog"));
  registerIpc("launcher:scan-ea", scanHandler("launcher:scan-ea", "ea"));
  registerIpc("launcher:scan-ubisoft", scanHandler("launcher:scan-ubisoft", "ubisoft"));
  registerIpc("launcher:scan-battlenet", scanHandler("launcher:scan-battlenet", "battlenet"));
  registerIpc("launcher:scan-riot", scanHandler("launcher:scan-riot", "riot"));
  registerIpc("launcher:scan-xbox", scanHandler("launcher:scan-xbox", "xbox"));
  registerIpc("launcher:scan-rockstar", scanHandler("launcher:scan-rockstar", "rockstar"));
  registerIpc("launcher:scan-itch", scanHandler("launcher:scan-itch", "itch"));
}

module.exports = { registerLauncherIpc };
