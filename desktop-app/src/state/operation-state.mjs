export const OPERATION_STATUS = Object.freeze({
  IDLE: 'idle', RUNNING: 'running', SUCCEEDED: 'succeeded', PARTIAL: 'partial',
  FAILED: 'failed', CANCELLED: 'cancelled', TIMED_OUT: 'timed-out', UNAVAILABLE: 'unavailable',
});

const TERMINAL = new Set([
  OPERATION_STATUS.SUCCEEDED, OPERATION_STATUS.PARTIAL, OPERATION_STATUS.FAILED,
  OPERATION_STATUS.CANCELLED, OPERATION_STATUS.TIMED_OUT, OPERATION_STATUS.UNAVAILABLE,
]);

export function operationId(domain, now = Date.now(), sequence = 0) {
  const safeDomain = String(domain || 'operation').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32) || 'operation';
  return `${safeDomain}-${Number(now).toString(36)}-${Number(sequence).toString(36)}`;
}

export function idleOperation(domain = '') {
  return { id: '', domain, status: OPERATION_STATUS.IDLE, startedAt: 0, endedAt: 0, completed: 0, failed: 0, total: 0, code: '', message: '' };
}

export function startOperation(domain, { id, now = Date.now(), total = 0, message = '' } = {}) {
  return { ...idleOperation(domain), id: id || operationId(domain, now), status: OPERATION_STATUS.RUNNING, startedAt: now, total: Math.max(0, Number(total || 0)), message: String(message || '').slice(0, 180) };
}

export function finishOperation(operation, { status = OPERATION_STATUS.SUCCEEDED, now = Date.now(), completed, failed = 0, total, code = '', message = '' } = {}) {
  if (!operation?.id || !TERMINAL.has(status)) return operation || idleOperation();
  const safeTotal = Math.max(0, Number(total ?? operation.total ?? 0));
  const safeFailed = Math.max(0, Number(failed || 0));
  const safeCompleted = Math.max(0, Number(completed ?? (status === OPERATION_STATUS.SUCCEEDED ? safeTotal : operation.completed) ?? 0));
  return { ...operation, status, endedAt: Math.max(Number(now || 0), Number(operation.startedAt || 0)), completed: safeCompleted, failed: safeFailed, total: safeTotal, code: String(code || '').replace(/[^A-Z0-9_-]/gi, '').slice(0, 40), message: String(message || '').slice(0, 180) };
}

export function isOperationTerminal(operation) { return TERMINAL.has(operation?.status); }
export function isCurrentOperation(operation, id) { return Boolean(id && operation?.id === id && operation.status === OPERATION_STATUS.RUNNING); }

export function safeOperationDiagnostic(operation) {
  if (!operation?.id || !isOperationTerminal(operation)) return null;
  return {
    id: String(operation.id).slice(0, 80), domain: String(operation.domain || '').slice(0, 32), status: operation.status,
    startedAt: Number(operation.startedAt || 0), endedAt: Number(operation.endedAt || 0),
    durationMs: Math.max(0, Number(operation.endedAt || 0) - Number(operation.startedAt || 0)),
    completed: Math.max(0, Number(operation.completed || 0)), failed: Math.max(0, Number(operation.failed || 0)),
    total: Math.max(0, Number(operation.total || 0)), code: String(operation.code || '').slice(0, 40),
  };
}
