const { guardHandler, guardResult, invalidRequest, invalidResponse, isBoolean, isBoundedArray, isBoundedString, isNumberBetween, isPath, isPlainObject } = require('./contract-guards.cjs');

function registerDoctorIpc({ registerIpc, launchDoctor }) {
  if (typeof registerIpc !== 'function' || typeof launchDoctor?.inspect !== 'function') throw new TypeError('registerDoctorIpc requires registerIpc and launchDoctor.');
  registerIpc('doctor:inspectLaunch', guardResult(guardHandler(
    (_event, request) => launchDoctor.inspect(request),
    request => isPlainObject(request) && isPath(request.exePath, { required: false }) && isBoundedString(request.gameName, { max: 500 }),
    invalidRequest('The Launch Doctor request was malformed.', { exists: false, candidates: [], notes: ['The inspection request was invalid.'] }),
  ), result => isPlainObject(result) && result.ok === true
    && isPath(result.configuredPath, { required: false }) && isBoolean(result.exists, { required: true })
    && isBoundedArray(result.candidates, 12, candidate => isPlainObject(candidate)
      && isPath(candidate.path) && isNumberBetween(candidate.matchScore, 0, Number.MAX_SAFE_INTEGER, { required: true }))
    && isBoundedArray(result.notes, 20, note => isBoundedString(note, { required: true, max: 2000 })),
  invalidResponse('Launch Doctor returned an invalid result.', { exists: false, candidates: [], notes: ['Launch inspection returned an invalid result.'] })));
}
module.exports = { registerDoctorIpc };
