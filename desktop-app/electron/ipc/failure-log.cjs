const MAX_ERROR_TEXT = 1200;

function cleanText(value) {
  return String(value || '').replace(/[\r\n\t]+/g, ' ').slice(0, MAX_ERROR_TEXT);
}

function createIpcFailureReporter({ appendTextSync, logFile, recordDiagnostic, now = () => new Date() }) {
  if (typeof appendTextSync !== 'function' || typeof logFile !== 'function') {
    throw new TypeError('createIpcFailureReporter requires appendTextSync and logFile.');
  }
  return function reportIpcFailure({ channel, domain, kind, error, receivedType } = {}) {
    try {
      const entry = {
        at: now().toISOString(),
        channel: cleanText(channel),
        domain: cleanText(domain),
        kind: cleanText(kind),
      };
      if (receivedType) entry.receivedType = cleanText(receivedType);
      if (error) entry.error = { name: cleanText(error.name || 'Error') };
      appendTextSync(logFile(), `${JSON.stringify(entry)}\n`);
      if (typeof recordDiagnostic === 'function') recordDiagnostic('ipc-failure', { channel, domain, kind, error, receivedType });
    } catch { /* diagnostics must never block or change NEO-LIB */ }
  };
}

module.exports = { createIpcFailureReporter };
