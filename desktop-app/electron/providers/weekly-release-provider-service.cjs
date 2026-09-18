function createWeeklyReleaseProviderService({ httpGetJson, now = Date.now }) {
  if (typeof httpGetJson !== 'function') throw new TypeError('createWeeklyReleaseProviderService requires HTTP.');
  let cache = { ts: 0, payload: null };
  const parseDate = value => { if (!value || typeof value !== 'string') return 0; const parsed = Date.parse(value.replace(/,/g, '')); return Number.isFinite(parsed) ? parsed : 0; };
  const ownerFloor = value => { const match = String(value || '').match(/([\d,]+)/); return match ? Number(match[1].replace(/,/g, '')) || 0 : 0; };
  async function mapConcurrent(items, limit, worker) {
    const output = []; let cursor = 0;
    const run = async () => { while (cursor < items.length) { const index = cursor++; try { output[index] = await worker(items[index]); } catch { output[index] = null; } } };
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run)); return output;
  }
  async function fetch({ force = false } = {}) {
    const SIX_HOURS = 21600000;
    if (!force && cache.payload && now() - cache.ts < SIX_HOURS) return { ok: true, ...cache.payload, fetchedAt: cache.ts, cached: true };
    try {
      const [trendResult, featuredResult] = await Promise.allSettled([httpGetJson('https://steamspy.com/api.php?request=top100in2weeks', 10000), httpGetJson('https://store.steampowered.com/api/featuredcategories?cc=us&l=en', 10000)]);
      if (trendResult.status !== 'fulfilled' && featuredResult.status !== 'fulfilled') throw new Error('The current release sources could not be reached.');
      const byApp = new Map();
      for (const item of Object.values(trendResult.status === 'fulfilled' ? (trendResult.value || {}) : {})) if (item && Number(item.appid)) byApp.set(Number(item.appid), { ...item, appid: Number(item.appid), featured: false });
      for (const item of featuredResult.status === 'fulfilled' ? (featuredResult.value?.new_releases?.items || []) : []) {
        const appid = Number(item?.id || item?.appid || 0); if (!appid) continue; const existing = byApp.get(appid) || {};
        byApp.set(appid, { ...existing, appid, name: existing.name || item.name || '', featured: true, featuredImage: item.large_capsule_image || item.small_capsule_image || existing.featuredImage || '' });
      }
      const candidates = [...byApp.values()].sort((a, b) => Number(b.featured) - Number(a.featured) || Number(b.ccu || 0) - Number(a.ccu || 0) || Number(b.positive || 0) - Number(a.positive || 0)).slice(0, 150);
      const current = now(); const weekAgo = current - 7 * 86400000;
      const verified = await mapConcurrent(candidates, 4, async signal => {
        const raw = await httpGetJson(`https://store.steampowered.com/api/appdetails?appids=${signal.appid}&l=en&cc=us`, 8000);
        const data = raw?.[signal.appid]?.success ? raw[signal.appid].data : null; const releaseAt = parseDate(data?.release_date?.date);
        if (!data || data.type !== 'game' || data.release_date?.coming_soon || releaseAt < weekAgo || releaseAt > current + 86400000) return null;
        const ccu = Number(signal.ccu || 0); const positives = Number(signal.positive || 0); const owners = ownerFloor(signal.owners); const recommendations = Number(data.recommendations?.total || 0);
        const tier = ccu >= 150 || positives >= 250 || owners >= 20000 || recommendations >= 1000 ? 'major' : ccu >= 45 || positives >= 75 || owners >= 5000 || recommendations >= 250 ? 'noteworthy' : signal.featured ? 'popular' : null;
        if (!tier) return null;
        const why = ccu >= 500 ? 'High current player interest' : positives >= 1000 || recommendations >= 1000 ? 'Strong early review interest' : owners >= 100000 ? 'Major launch reach' : tier === 'major' ? 'Notable early player interest' : tier === 'noteworthy' ? 'Worth watching: early player interest' : 'Popular new Steam release';
        return { id: `steam-${signal.appid}`, appid: Number(signal.appid), title: data.name || signal.name || 'Untitled game', image: data.header_image || signal.featuredImage || `https://cdn.akamai.steamstatic.com/steam/apps/${signal.appid}/header.jpg`, platform: 'Steam', releaseAt, releaseDate: data.release_date?.date || '', url: `https://store.steampowered.com/app/${signal.appid}`, why, ccu, reviewCount: positives, recommendations, tier, genres: (data.genres || []).map(genre => genre.description).slice(0, 3) };
      });
      const released = verified.filter(Boolean).sort((a, b) => b.releaseAt - a.releaseAt || b.ccu - a.ccu);
      const major = released.filter(item => item.tier === 'major'); const noteworthy = released.filter(item => item.tier === 'noteworthy'); const popular = released.filter(item => item.tier === 'popular');
      const tier = major.length ? 'major' : noteworthy.length ? 'semi-major' : popular.length ? 'popular' : 'none';
      const items = (tier === 'major' ? major : tier === 'semi-major' ? noteworthy : popular).slice(0, 12);
      const criteria = tier === 'major' ? 'Released within seven days, verified as a full game, and showing major recent player, review, or launch-reach signals. SteamSpy and Steam’s New Releases shelf provide the candidates.' : tier === 'semi-major' ? 'No major launch cleared the strict threshold this week, so this view is showing noteworthy games with verified early player or review momentum.' : tier === 'popular' ? 'No major or noteworthy launch cleared the evidence threshold this week, so this view is showing verified games from Steam’s current New Releases shelf. It is a popular-release fallback, not an exhaustive store dump.' : 'No qualifying new releases were returned by the current verified sources. Try Refresh later.';
      const payload = { items, tier, criteria }; cache = { ts: now(), payload }; return { ok: true, ...payload, fetchedAt: cache.ts, cached: false };
    } catch (error) { return { ok: false, items: [], error: error?.message || 'Release feed unavailable.' }; }
  }
  return Object.freeze({ fetch, parseDate, ownerFloor });
}
module.exports = { createWeeklyReleaseProviderService };
