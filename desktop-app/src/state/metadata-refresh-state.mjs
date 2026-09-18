import { finishOperation, OPERATION_STATUS, startOperation } from './operation-state.mjs';

export const EMPTY_REFRESH_QUEUE = Object.freeze({ active: false, ids: [], index: 0, repaired: 0, skipped: 0, operation: null });

export function metadataRefreshTargets(items = [], mode = 'missing', now = Date.now()) {
  const eligible = items.filter((item) => !item.manualOverride);
  if (mode === 'full') return eligible;
  return eligible.filter((item) => {
    const missingArt = !(item.coverUrl || item.headerImage || item.background);
    const missingCopy = !(item.about || item.shortDescription);
    const missingIdentity = !(item.genres?.length || item.genreTags?.length || item.genreProfile?.core?.length);
    const lastFetch = Number(item.metadataFetchedAt || item.metadataUpdatedAt || 0);
    const stale = lastFetch > 0 && now - lastFetch > 90 * 24 * 60 * 60 * 1000;
    return missingArt || missingCopy || missingIdentity || stale;
  });
}

export function startRefreshQueue(items = [], now = Date.now()) {
  const ids = items.map((item) => item?.id).filter(Boolean);
  return ids.length ? { active: true, ids, index: 0, repaired: 0, skipped: 0, operation: startOperation('metadata-refresh', { now, total: ids.length }) } : { ...EMPTY_REFRESH_QUEUE };
}

export function advanceRefreshQueue(queue, outcome, existingIds = []) {
  if (!queue?.active) return { queue: queue || { ...EMPTY_REFRESH_QUEUE }, nextId: null, complete: false };
  const existing = new Set(existingIds);
  const repaired = queue.repaired + (outcome === 'repaired' ? 1 : 0);
  const skipped = queue.skipped + (outcome === 'skipped' ? 1 : 0);
  let index = queue.index + 1;
  while (index < queue.ids.length && !existing.has(queue.ids[index])) index += 1;
  if (index >= queue.ids.length) return { queue: { ...EMPTY_REFRESH_QUEUE }, nextId: null, complete: true, repaired, skipped, operation: finishOperation(queue.operation, { status: OPERATION_STATUS.SUCCEEDED, completed: repaired + skipped, total: queue.ids.length }) };
  return { queue: { ...queue, index, repaired, skipped }, nextId: queue.ids[index], complete: false, repaired, skipped };
}

export function stopRefreshQueue(queue) {
  const repaired = Number(queue?.repaired || 0);
  const skipped = Number(queue?.skipped || 0);
  return { queue: { ...EMPTY_REFRESH_QUEUE }, repaired, skipped, operation: finishOperation(queue?.operation, { status: OPERATION_STATUS.CANCELLED, completed: repaired + skipped, total: queue?.ids?.length || 0, code: 'CANCELLED' }) };
}
