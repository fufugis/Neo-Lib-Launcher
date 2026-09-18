const { guardHandler, guardResult, invalidRequest, invalidResponse, isBoolean, isBoundedArray, isBoundedString, isIdentifier, isNumberBetween, isPath, isPlainObject } = require('./contract-guards.cjs');

const isCount = value => Number.isSafeInteger(value) && value >= 0;
const isBytes = value => Number.isFinite(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER;
const isErrorResult = result => isPlainObject(result)
  && result.ok === false
  && isBoundedString(result.error, { required: true, max: 2000 });
const hasFolderStats = result => isCount(result.files) && isBytes(result.bytes) && isBoolean(result.truncated, { required: true });
const isBackup = backup => isPlainObject(backup)
  && isPath(backup.backupPath)
  && isIdentifier(backup.gameId, { required: false })
  && isBoundedString(backup.gameName, { max: 500 })
  && isPath(backup.originalPath, { required: false })
  && isNumberBetween(backup.createdAt, 0, Number.MAX_SAFE_INTEGER)
  && (backup.files == null || isCount(backup.files))
  && (backup.bytes == null || isBytes(backup.bytes))
  && isBoolean(backup.truncated);
const isCandidate = candidate => isPlainObject(candidate)
  && isPath(candidate.path)
  && isBoundedString(candidate.source, { max: 500 })
  && (candidate.score == null || Number.isFinite(candidate.score))
  && (candidate.matchedTerms == null || isCount(candidate.matchedTerms));

function registerSavesIpc({ registerIpc, services }) {
  if (typeof registerIpc !== 'function' || !services) throw new TypeError('registerSavesIpc requires registerIpc and services.');
  const requireService = (all, channel) => {
    const handler = all[channel];
    if (typeof handler !== 'function') throw new TypeError(`Missing service for ${channel}.`);
    return handler;
  };
  registerIpc("saves:findCandidates", guardResult(guardHandler(
    requireService(services, "saves:findCandidates"),
    payload => isPlainObject(payload) && isPath(payload.root) && isBoundedString(payload.gameName, { required: true, max: 500 }),
    invalidRequest('The save search request was malformed.', { candidates: [] }),
  ), result => isErrorResult(result) || (isPlainObject(result) && result.ok === true
    && isBoundedArray(result.candidates, 80, isCandidate)
    && isCount(result.visited) && isBoolean(result.truncated, { required: true })),
  invalidResponse('The save search returned an invalid result.', { candidates: [] })));
  registerIpc("saves:detectCommon", guardResult(guardHandler(
    requireService(services, "saves:detectCommon"),
    payload => isPlainObject(payload)
      && isBoundedString(payload.gameName, { required: true, max: 500 })
      && isPath(payload.exePath, { required: false })
      && isIdentifier(payload.appid, { required: false }),
    invalidRequest('The save-folder detection request was malformed.', { candidates: [] }),
  ), result => isPlainObject(result) && result.ok === true && isBoundedArray(result.candidates, 12, isCandidate),
  invalidResponse('Save-folder detection returned an invalid result.', { candidates: [] })));
  registerIpc("saves:restore", guardResult(guardHandler(
    requireService(services, "saves:restore"),
    payload => isPlainObject(payload)
      && isPath(payload.backupPath)
      && isPath(payload.savePath)
      && (payload.mode == null || payload.mode === 'empty' || payload.mode === 'safe-copy'),
    invalidRequest('The save restore request was malformed.'),
  ), result => isErrorResult(result) || (isPlainObject(result) && result.ok === true && isPath(result.restoredTo) && hasFolderStats(result)),
  invalidResponse('The save restore returned an invalid result.')));
  registerIpc("saves:createBackup", guardResult(guardHandler(
    requireService(services, "saves:createBackup"),
    payload => isPlainObject(payload)
      && isIdentifier(payload.gameId)
      && isBoundedString(payload.gameName, { max: 500 })
      && isPath(payload.savePath),
    invalidRequest('The save backup request was malformed.'),
  ), result => isErrorResult(result) || (isPlainObject(result) && result.ok === true && isBackup(result.backup)),
  invalidResponse('The save backup returned an invalid result.')));
  registerIpc("saves:listBackups", guardResult(guardHandler(
    requireService(services, "saves:listBackups"),
    gameId => isIdentifier(gameId),
    invalidRequest('The backup-list request was malformed.', { backups: [] }),
  ), result => isErrorResult(result) || (isPlainObject(result) && result.ok === true && isBoundedArray(result.backups, 1000, isBackup)),
  invalidResponse('The backup list returned an invalid result.', { backups: [] })));
  registerIpc("saves:inspect", guardResult(guardHandler(
    requireService(services, "saves:inspect"),
    savePath => isPath(savePath),
    invalidRequest('The save-folder request was malformed.'),
  ), result => isErrorResult(result) || (isPlainObject(result) && result.ok === true && isPath(result.path) && hasFolderStats(result)),
  invalidResponse('The save-folder inspection returned an invalid result.')));
}

module.exports = { registerSavesIpc };
