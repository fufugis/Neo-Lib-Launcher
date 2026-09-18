const RECENT_RESULT_MS = 15_000;

function createUpdateScanCoordinatorService({ scan, now = Date.now }) {
  if (typeof scan !== 'function') throw new TypeError('createUpdateScanCoordinatorService requires a scan function.');

  let inFlight = null;
  let recent = { at: 0, key: '', result: null };

  function keyOf(games = []) {
    return (Array.isArray(games) ? games : []).map(game => [
      game?.id, game?.appid, game?.launcher, game?.steamOwned,
      game?.installedVersion, game?.updateWatchUrl, game?.website, game?.exePath,
    ].map(value => String(value ?? '')).join('~')).sort().join('|');
  }

  async function run({ games = [], force = false } = {}) {
    const key = keyOf(games);
    if (!force && recent.result && recent.key === key && now() - recent.at < RECENT_RESULT_MS) {
      return { ...recent.result, cached: true };
    }
    if (inFlight) {
      if (inFlight.key === key) return inFlight.promise;
      try { await inFlight.promise; } catch { /* the next request still gets its own attempt */ }
    }
    const pending = scan(games)
      .then(result => {
        recent = { at: now(), key, result };
        return result;
      })
      .finally(() => {
        if (inFlight?.promise === pending) inFlight = null;
      });
    inFlight = { key, promise: pending };
    return pending;
  }

  return Object.freeze({ run, keyOf });
}

module.exports = { createUpdateScanCoordinatorService };
