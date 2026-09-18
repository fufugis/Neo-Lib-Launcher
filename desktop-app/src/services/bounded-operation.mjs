import { finishOperation, OPERATION_STATUS, operationId, startOperation } from '../state/operation-state.mjs';
import { recordOperationDiagnostic } from './operation-journal.mjs';

let sequence = 0;

export function createBoundedOperation({ domain, task, timeoutMs = 30_000, total = 0, onState = () => {}, now = () => Date.now(), setTimer = setTimeout, clearTimer = clearTimeout, journal = recordOperationDiagnostic }) {
  const id = operationId(domain, now(), ++sequence);
  let state = startOperation(domain, { id, now: now(), total });
  let settled = false;
  let timer = null;
  const abortController = new AbortController();
  onState(state);

  let settle;
  const promise = new Promise((resolve) => { settle = resolve; });
  const complete = (status, details = {}, value) => {
    if (settled) return false;
    settled = true;
    clearTimer(timer);
    state = finishOperation(state, { ...details, status, now: now() });
    onState(state);
    journal?.(state);
    settle({ state, value });
    return true;
  };
  timer = setTimer(() => {
    abortController.abort('timed-out');
    complete(OPERATION_STATUS.TIMED_OUT, { code: 'TIMEOUT', message: 'The operation took too long and was stopped.' });
  }, Math.max(1, Number(timeoutMs || 30_000)));

  Promise.resolve().then(() => task({ signal: abortController.signal, operationId: id, isCurrent: () => !settled }))
    .then((value) => {
      if (settled) return;
      const failed = Math.max(0, Number(value?.operationFailed || 0));
      const completed = Math.max(0, Number(value?.operationCompleted ?? total ?? 0));
      const status = failed > 0 ? OPERATION_STATUS.PARTIAL : OPERATION_STATUS.SUCCEEDED;
      complete(status, { completed, failed, total: Math.max(Number(total || 0), completed + failed), code: status === OPERATION_STATUS.PARTIAL ? 'PARTIAL' : '' }, value);
    })
    .catch((error) => {
      if (settled) return;
      const unavailable = error?.code === 'UNAVAILABLE';
      complete(unavailable ? OPERATION_STATUS.UNAVAILABLE : OPERATION_STATUS.FAILED, { code: unavailable ? 'UNAVAILABLE' : 'FAILED', message: error?.message || 'Operation failed.' });
    });

  return {
    id,
    promise,
    cancel(message = 'Cancelled by the player.') {
      abortController.abort('cancelled');
      return complete(OPERATION_STATUS.CANCELLED, { code: 'CANCELLED', message });
    },
    snapshot: () => state,
  };
}
