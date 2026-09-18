function localDayKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function createPlaytimeHistoryService({ documents, now = () => new Date() }) {
  if (typeof documents?.loadPlaytimeHistory !== 'function' || typeof now !== 'function') {
    throw new TypeError('createPlaytimeHistoryService requires documents and now.');
  }

  async function read({ days = 7 } = {}) {
    try {
      const history = await documents.loadPlaytimeHistory();
      const byAppid = history.byAppid || {};
      const cutoff = new Date(now());
      cutoff.setDate(cutoff.getDate() - days);
      cutoff.setHours(0, 0, 0, 0);
      const cutoffKey = localDayKey(cutoff);
      const deltas = {};

      for (const [appid, dayMap] of Object.entries(byAppid)) {
        const keys = Object.keys(dayMap).sort();
        if (keys.length === 0) continue;
        const latestKey = keys[keys.length - 1];
        const latestVal = Number(dayMap[latestKey]) || 0;
        let baselineVal = null;
        for (const key of keys) {
          if (key <= cutoffKey) baselineVal = Number(dayMap[key]) || 0;
          else break;
        }
        if (baselineVal === null) baselineVal = Number(dayMap[keys[0]]) || 0;
        const delta = Math.max(0, latestVal - baselineVal);
        if (delta > 0) deltas[appid] = delta;
      }

      return { ok: true, deltas, lastSnapshotAt: history.lastSnapshotAt || 0 };
    } catch (error) {
      return { ok: false, error: String(error?.message || error), deltas: {} };
    }
  }

  return Object.freeze({ read });
}

module.exports = { createPlaytimeHistoryService, localDayKey };
