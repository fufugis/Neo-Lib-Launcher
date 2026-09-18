const { guardHandler, guardResult, invalidRequest, invalidResponse, isBoolean, isBoundedArray, isBoundedString, isIdentifier, isNumberBetween, isPath, isPlainObject } = require('./contract-guards.cjs');

const isErrorResult = result => isPlainObject(result)
  && result.ok === false
  && isBoundedString(result.error, { required: true, max: 2000 });

const isScanResult = result => isPlainObject(result) && (
  (result.ok === false && result.busy === true)
  || (result.ok === true
    && isBoolean(result.active, { required: true })
    && isIdentifier(result.gameId, { required: false })
    && isBoundedString(result.name, { max: 500 }))
);

const isWatchResult = result => isPlainObject(result)
  && result.ok === true
  && Number.isSafeInteger(result.watching) && result.watching >= 0
  && Number.isSafeInteger(result.ignored) && result.ignored >= 0;

const isLaunchResult = result => isErrorResult(result) || (isPlainObject(result)
  && result.ok === true
  && isBoundedString(result.target, { max: 100 })
  && isBoundedString(result.error, { max: 2000 }));

const isArmResult = result => isErrorResult(result) || (isPlainObject(result)
  && result.ok === true
  && isBoundedString(result.token, { required: true, max: 256 }));

function registerGameIpc({ registerIpc, services }) {
  if (typeof registerIpc !== 'function' || !services) throw new TypeError('registerGameIpc requires registerIpc and services.');
  const requireService = (all, channel) => {
    const handler = all[channel];
    if (typeof handler !== 'function') throw new TypeError(`Missing service for ${channel}.`);
    return handler;
  };
  registerIpc("game:scanExternalNow", guardResult(
    requireService(services, "game:scanExternalNow"),
    isScanResult,
    invalidResponse('The external-game scan returned an invalid result.', { active: false, gameId: null, name: '' }),
  ));
  registerIpc("game:watchExternal", guardResult(guardHandler(
    requireService(services, "game:watchExternal"),
    payload => isPlainObject(payload)
      && (payload.games == null || isBoundedArray(payload.games, 1000, game => isPlainObject(game)
        && isIdentifier(game.id)
        && isBoundedString(game.name, { max: 500 })
        && isPath(game.exePath)
        && isPath(game.installDir, { required: false })
        && isBoundedString(game.launcher, { max: 100 }))),
    invalidRequest('The external-game watch request was malformed.'),
  ), isWatchResult, invalidResponse('The external-game watcher returned an invalid result.', { watching: 0, ignored: 0 })));
  registerIpc("game:launch", guardResult(guardHandler(
    requireService(services, "game:launch"),
    payload => isPlainObject(payload)
      && isPath(payload.exePath)
      && isBoundedString(payload.launchArgs, { max: 8192 })
      && isIdentifier(payload.gameId, { required: false })
      && isBoundedString(payload.name, { max: 500 })
      && isBoundedString(payload.launchToken, { max: 256 }),
    invalidRequest('The game launch request was malformed.'),
  ), isLaunchResult, invalidResponse('The game launch service returned an invalid result.')));
  registerIpc("game:armLaunch", guardResult(
    requireService(services, "game:armLaunch"),
    isArmResult,
    invalidResponse('Launch authorization returned an invalid result.'),
  ));
}

module.exports = { registerGameIpc };
