function createPublicNewsProviderService({ searchDuckDuckGo, searchGoogle, normalization, now = Date.now, cacheMs = 21600000 }) {
  if (typeof searchDuckDuckGo !== 'function' || typeof searchGoogle !== 'function' || !normalization) throw new TypeError('createPublicNewsProviderService requires search and normalization dependencies.');
  const cache = new Map();
  function cacheKey(game = {}, cutoffMs = 0) {
    const windowDays = Math.max(1, Math.round((now() - Number(cutoffMs || now())) / 86400000));
    return `${game.id || game.name}|${game.name}|${game.website || ''}|${game.launcher || game.source || ''}|${windowDays}`;
  }
  function inspectCache(game, cutoffMs) {
    const key = cacheKey(game, cutoffMs);
    const entry = cache.get(key);
    return { key, entry, fresh: Boolean(entry && now() - entry.ts < cacheMs) };
  }
  async function fetch(game, cutoffMs, force = false) {
    const state = inspectCache(game, cutoffMs);
    if (!force && state.fresh) return state.entry.items;
    const siteHost = normalization.siteHost(game);
    const queries = [siteHost ? `site:${siteHost} ${game.name} news update patch` : '', `${game.name} game latest news update patch notes`].filter(Boolean);
    let candidates = [];
    for (const query of queries) {
      try {
        let results = await searchDuckDuckGo(query);
        if (!results.length) results = await searchGoogle(query);
        candidates = candidates.concat(results || []);
        const official = candidates.map(result => normalization.result(game, result, cutoffMs)).filter(Boolean).some(item => item.platform === 'official-web');
        if (official) break;
      } catch {}
    }
    const unique = new Map();
    for (const result of candidates) {
      const item = normalization.result(game, result, cutoffMs);
      if (!item) continue;
      const identity = `${item.title.toLowerCase()}|${item.date}`;
      if (!unique.has(identity) || item.platform === 'official-web') unique.set(identity, item);
    }
    const items = [...unique.values()].sort((left, right) => Number(right.date) - Number(left.date) || (left.platform === 'official-web' ? -1 : 1)).slice(0, 2);
    cache.set(state.key, { ts: now(), items });
    return items;
  }
  return Object.freeze({ fetch, cacheKey, inspectCache });
}
module.exports = { createPublicNewsProviderService };
