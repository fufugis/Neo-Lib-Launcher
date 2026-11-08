// One bounded queue per native bridge, shared by every artwork surface.
const bridges = new WeakMap();
export const steamArtworkId = game => {
  const value = String(game?.steamAppId || game?.appid || '').trim();
  return /^\d{1,12}$/.test(value) ? value : '';
};
export function requestSteamArtwork(api, id) {
  id = String(id);
  if (!api || typeof api.steamArtwork !== 'function' || !/^\d{1,12}$/.test(String(id))) return Promise.resolve(null);
  let state = bridges.get(api);
  if (!state) { state = { entries: new Map(), queue: [], active: 0, timer: null }; bridges.set(api, state); }
  const cached = state.entries.get(id);
  if (cached && cached.expires > Date.now()) return cached.promise;
  let finish;
  const promise = new Promise(resolve => { finish = resolve; });
  const entry = { promise, expires: Infinity };
  state.entries.set(id, entry);
  state.queue.push({ id, finish, entry });
  const schedule = () => {
    if (state.timer === null && state.queue.length && state.active < 2) state.timer = setTimeout(flush, 25);
  };
  const flush = async () => {
    state.timer = null;
    if (!state.queue.length || state.active >= 2) return;
    const batch = state.queue.splice(0, 40);
    state.active++;
    schedule();
    let rows = [];
    try { rows = await api.steamArtwork(batch.map(item => item.id)); } catch { /* Optional/offline. */ }
    finally {
      for (const item of batch) {
        const row = Array.isArray(rows) ? rows.find(value => String(value?.appid) === item.id) : null;
        const value = row && (row.icon || row.portraitImage) ? row : null;
        item.entry.expires = Date.now() + (value ? 600000 : 60000);
        item.finish(value);
      }
      state.active--;
      // Bound completed cache entries without dropping queued promises.
      for (const [key, value] of state.entries) {
        if (state.entries.size <= 512) break;
        if (value.expires !== Infinity) state.entries.delete(key);
      }
      schedule();
    }
  };
  schedule();
  return promise;
}
