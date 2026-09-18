const MAX_WINDOWS_PATH = 32767;

function isPlainObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isBoundedString(value, { required = false, max = 500 } = {}) {
  if (typeof value !== 'string') return !required && value == null;
  return (!required || value.trim().length > 0) && value.length <= max;
}

function isPath(value, { required = true } = {}) {
  return isBoundedString(value, { required, max: MAX_WINDOWS_PATH });
}

function isIdentifier(value, { required = true } = {}) {
  if (value == null || value === '') return !required;
  return (typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value))) && String(value).length <= 500;
}

function isBoundedArray(value, max, itemValidator = () => true) {
  return Array.isArray(value) && value.length <= max && value.every(itemValidator);
}

function isBoolean(value, { required = false } = {}) {
  return typeof value === 'boolean' || (!required && value == null);
}

function isNumberBetween(value, minimum, maximum, { required = false } = {}) {
  if (value == null) return !required;
  return Number.isFinite(value) && value >= minimum && value <= maximum;
}

function isHttpUrl(value, { required = true, max = 4096 } = {}) {
  if (value == null || value === '') return !required;
  if (!isBoundedString(value, { required: true, max })) return false;
  try { return ['http:', 'https:'].includes(new URL(value).protocol); } catch { return false; }
}

function isJsonObjectWithin(value, { maxDepth = 8, maxEntries = 500, maxString = 24000 } = {}) {
  let entries = 0;
  const visit = (current, depth) => {
    if (current == null || typeof current === 'boolean' || typeof current === 'undefined') return true;
    if (typeof current === 'number') return Number.isFinite(current);
    if (typeof current === 'string') return current.length <= maxString;
    if (depth >= maxDepth || typeof current !== 'object') return false;
    const values = Array.isArray(current) ? current : (isPlainObject(current) ? Object.values(current) : null);
    if (!values || (entries += values.length) > maxEntries) return false;
    return values.every(entry => visit(entry, depth + 1));
  };
  return isPlainObject(value) && visit(value, 0);
}

function invalidRequest(error, extra = {}) {
  return { ok: false, code: 'INVALID_REQUEST', error, ...extra };
}

function invalidResponse(error, extra = {}) {
  return { ok: false, code: 'INVALID_RESPONSE', error, ...extra };
}

function guardHandler(handler, validate, invalid) {
  if (typeof handler !== 'function') throw new TypeError('guardHandler requires a service handler.');
  if (typeof validate !== 'function') throw new TypeError('guardHandler requires a validator.');
  return function guardedIpcHandler(event, ...args) {
    if (!validate(...args)) return typeof invalid === 'function' ? invalid(...args) : invalid;
    return handler.call(this, event, ...args);
  };
}

function guardResult(handler, validate, invalid) {
  if (typeof handler !== 'function') throw new TypeError('guardResult requires a service handler.');
  if (typeof validate !== 'function') throw new TypeError('guardResult requires a validator.');
  let reportFailure = () => {};
  const report = (failure) => {
    try { reportFailure(failure); } catch { /* diagnostics must never alter IPC behaviour */ }
  };
  const fallback = (value) => (typeof invalid === 'function' ? invalid(value) : invalid);
  const check = (result) => {
    // Request guards sit inside response guards. Their domain-safe rejection
    // must reach the renderer unchanged and must not be mislabeled as a bad
    // native response.
    if (isPlainObject(result) && result.ok === false && result.code === 'INVALID_REQUEST') return result;
    let valid = false;
    try { valid = validate(result); } catch { valid = false; }
    if (valid) return result;
    report({ kind: 'invalid-response', receivedType: result === null ? 'null' : Array.isArray(result) ? 'array' : typeof result });
    return fallback(result);
  };
  const guardedIpcResult = function guardedIpcResult(event, ...args) {
    try {
      const result = handler.call(this, event, ...args);
      return result && typeof result.then === 'function'
        ? result.then(check, error => {
          report({ kind: 'service-rejection', error });
          return fallback(error);
        })
        : check(result);
    } catch (error) {
      report({ kind: 'service-throw', error });
      return fallback(error);
    }
  };
  Object.defineProperty(guardedIpcResult, 'setFailureReporter', {
    value(reporter) { reportFailure = typeof reporter === 'function' ? reporter : () => {}; },
    enumerable: false,
  });
  return guardedIpcResult;
}

module.exports = {
  MAX_WINDOWS_PATH,
  guardHandler,
  guardResult,
  invalidRequest,
  invalidResponse,
  isBoundedArray,
  isBoundedString,
  isBoolean,
  isHttpUrl,
  isIdentifier,
  isJsonObjectWithin,
  isNumberBetween,
  isPath,
  isPlainObject,
};
