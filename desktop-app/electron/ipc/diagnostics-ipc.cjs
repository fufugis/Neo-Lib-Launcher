const { guardResult, invalidResponse, isBoundedString, isNumberBetween, isPlainObject } = require('./contract-guards.cjs');

function registerDiagnosticsIpc({ registerIpc, diagnostics, shell }) {
  if (typeof registerIpc !== 'function' || !diagnostics || typeof shell?.openPath !== 'function') {
    throw new TypeError('registerDiagnosticsIpc requires registerIpc, diagnostics and shell.');
  }
  registerIpc('diagnostics:getReport', guardResult(
    () => diagnostics.getReport(),
    result => isPlainObject(result) && result.ok === true
      && isNumberBetween(result.count, 0, 120, { required: true })
      && isBoundedString(result.report, { required: true, max: 24000 }),
    invalidResponse('The local diagnostic report was unavailable.', { count: 0, report: '' }),
  ));
  registerIpc('diagnostics:openFolder', guardResult(async () => {
    try {
      const error = await shell.openPath(diagnostics.directory());
      return error ? { ok: false, error: 'Windows could not open the diagnostic folder.' } : { ok: true };
    } catch {
      return { ok: false, error: 'Windows could not open the diagnostic folder.' };
    }
  }, result => isPlainObject(result) && typeof result.ok === 'boolean'
    && isBoundedString(result.error, { max: 400 }),
  invalidResponse('Opening the diagnostic folder returned an invalid result.')));
}

module.exports = { registerDiagnosticsIpc };
