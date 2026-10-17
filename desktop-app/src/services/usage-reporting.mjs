export const USAGE_KEY = 'neolib:optional-usage-v1';
export const USAGE_WITHDRAWAL_KEY = 'neolib:usage-withdrawal-v1';
export const validReportingId = value => typeof value === 'string' && /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(value);
const KINDS = new Set(['first_open', 'setup_complete', 'active_day']);
export function validUsageEndpoint(value) {
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash ? url.href : ''; } catch { return ''; }
}
export function usageEvent(id, kind, version, day) {
  if (!/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(id) || !KINDS.has(kind) || !/^\d+\.\d+\.\d+$/.test(version) || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  return { schemaVersion: 1, consentVersion: 2, installationId: id, kind, appVersion: version, day };
}
// Withdrawal is a deletion request, not a usage report. Preserve only its UUID
// while offline, and never begin a new reporting identity until it completes.
export async function withdrawStoredUsage({ endpoint, storage, fetchImpl = globalThis.fetch }) {
  let id;
  try {
    id = storage.getItem(USAGE_WITHDRAWAL_KEY);
    const previous = JSON.parse(storage.getItem(USAGE_KEY) || 'null')?.id;
    if (!validReportingId(id) && validReportingId(previous)) {
      id = previous;
      storage.setItem(USAGE_WITHDRAWAL_KEY, id);
    }
    storage.removeItem(USAGE_KEY);
    if (!validReportingId(id)) { storage.removeItem(USAGE_WITHDRAWAL_KEY); return true; }
  } catch { return false; }
  const url = validUsageEndpoint(endpoint);
  if (!url) return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetchImpl(new URL('/withdraw', url).href, { method: 'POST', credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store', signal: controller.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ installationId: id }) });
    if (!response.ok || (await response.json())?.erased !== true) return false;
    if (storage.getItem(USAGE_WITHDRAWAL_KEY) === id) storage.removeItem(USAGE_WITHDRAWAL_KEY);
    return true;
  } catch { return false; } finally { clearTimeout(timer); }
}
export function createUsageReporter({ endpoint, version, storage, fetchImpl = globalThis.fetch, uuid = () => crypto.randomUUID(), now = () => Date.now() }) {
  const url = validUsageEndpoint(endpoint);
  let state = null; let alive = true; let controller = null; let busy = false;
  if (!url) return { record() {}, flush: async () => {}, stop() {} };
  try {
    if (storage.getItem(USAGE_WITHDRAWAL_KEY)) return { record() {}, flush: async () => {}, stop() {} };
    const raw = JSON.parse(storage.getItem(USAGE_KEY) || 'null');
    state = raw && usageEvent(raw.id, 'first_open', version, new Date(now()).toISOString().slice(0, 10)) && Array.isArray(raw.pending) && Array.isArray(raw.sent)
      ? { id: raw.id, sent: raw.sent.filter(key => typeof key === 'string' && key.length < 40).slice(-120), pending: raw.pending.filter(event => event?.installationId === raw.id).map(event => usageEvent(raw.id, event.kind, event.appVersion, event.day)).filter(Boolean).slice(-10) }
      : { id: uuid(), sent: [], pending: [] };
    storage.setItem(USAGE_KEY, JSON.stringify(state));
  } catch { state = null; }
  const save = next => { try { storage.setItem(USAGE_KEY, JSON.stringify(next)); state = next; return true; } catch { return false; } };
  const key = event => event.kind === 'active_day' ? `${event.kind}:${event.day}` : event.kind;
  const flush = async () => {
    if (!alive || busy || !state) return;
    busy = true;
    try {
      while (alive && state.pending.length) {
        if (Date.parse(`${state.pending[0].day}T00:00:00Z`) < now() - 8 * 86400000) {
          if (!save({ ...state, pending: state.pending.slice(1) })) break;
          continue;
        }
        const event = state.pending[0]; controller = new AbortController();
        const timer = setTimeout(() => controller?.abort(), 5000);
        let response;
        try { response = await fetchImpl(url, { method: 'POST', credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store', signal: controller.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(event) }); }
        catch { break; }
        finally { clearTimeout(timer); controller = null; }
        if (!alive || !response?.ok) break;
        const sent = [...new Set([...state.sent, key(event)])];
        if (!save({ ...state, sent: [...sent.filter(value => value === 'first_open' || value === 'setup_complete'), ...sent.filter(value => value.startsWith('active_day:')).slice(-60)], pending: state.pending.slice(1) })) break;
      }
    } finally { busy = false; }
  };
  return {
    record(kind) {
      if (!alive || !state) return;
      const event = usageEvent(state.id, kind, version, new Date(now()).toISOString().slice(0, 10));
      if (!event || state.sent.includes(key(event)) || state.pending.some(item => key(item) === key(event))) return;
      if (save({ ...state, pending: [...state.pending, event].slice(-10) })) void flush();
    }, flush,
    stop() { alive = false; controller?.abort(); },
  };
}
