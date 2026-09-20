const DAY_MS = 86_400_000;
const MAJOR_RETENTION_MS = 14 * DAY_MS;
const SMALL_RETENTION_MS = 5 * DAY_MS;

// Search is only the index: every accepted result must land on the matching
// publisher-owned domain and describe an already-launched game.
const OFFICIAL_RELEASE_SOURCES = Object.freeze([
  { id: 'ea', platform: 'EA', domains: ['ea.com', 'news.ea.com'], query: 'site:ea.com game "available now" OR "launches worldwide" OR "released today"' },
  { id: 'ubisoft', platform: 'Ubisoft', domains: ['ubisoft.com'], query: 'site:news.ubisoft.com game "available now" OR "launches today" OR "out now"' },
  { id: 'battlenet', platform: 'Battle.net', domains: ['blizzard.com'], query: 'site:news.blizzard.com game OR expansion "now live" OR "available now" OR "launches"' },
  { id: 'xbox', platform: 'Xbox', domains: ['xbox.com'], query: 'site:news.xbox.com game "out now" OR "launches today" OR "available now"' },
  { id: 'epic', platform: 'Epic Games', domains: ['epicgames.com'], query: 'site:store.epicgames.com game "available now" OR "out now" OR "launch"' },
  { id: 'riot', platform: 'Riot', domains: ['riotgames.com'], query: 'site:riotgames.com game "available now" OR "launches" OR "now live"' },
  { id: 'rockstar', platform: 'Rockstar', domains: ['rockstargames.com'], query: 'site:rockstargames.com game "available now" OR "launches" OR "out now"' },
  { id: 'gog', platform: 'GOG', domains: ['gog.com'], query: 'site:gog.com game "release" "available now" OR "out now"' },
  { id: 'itch', platform: 'itch.io', domains: ['itch.io'], query: 'site:itch.io game "available now" OR "released today" OR "out now"' },
]);

const MAJOR_LANGUAGE = /\b(?:worldwide|global launch|blockbuster|flagship|highly anticipated|all[- ]new|new era|major release|launches worldwide)\b/i;
const MAJOR_FRANCHISE = /\b(?:world of warcraft|warcraft|diablo|overwatch|starcraft|the sims|sims\s*5|battlefield|dragon age|mass effect|star wars|ea sports|assassin'?s creed|far cry|tom clancy|rainbow six|ghost recon|prince of persia|call of duty|elder scrolls|fallout|halo|forza|fable|gears of war|grand theft auto|\bgta\b|red dead|league of legends|valorant)\b/i;
const RELEASE_LANGUAGE = /\b(?:now available|available now|out now|launch(?:ed|es today|es worldwide)|released today|arrives today|now live)\b/i;
const NON_RELEASE_LANGUAGE = /\b(?:patch notes?|hotfix|roadmap|soundtrack|guide|tips?|interview|developer update|season\s+\d+|free play days?|trial|beta|pre[- ]?load|pre[- ]?order|coming soon|goes gold)\b/i;

function createWeeklyReleaseProviderService({ httpGetJson, searchDuckDuckGo, searchGoogle, now = Date.now }) {
  if (typeof httpGetJson !== 'function') throw new TypeError('createWeeklyReleaseProviderService requires HTTP.');
  let cache = { ts: 0, payload: null };

  const parseDate = value => {
    const text = String(value || '');
    const relative = text.match(/\b(\d{1,3})\s*(minute|hour|day|week)s?\s+ago\b/i);
    if (relative) {
      const unit = relative[2].toLowerCase();
      const multiplier = unit === 'minute' ? 60_000 : unit === 'hour' ? 3_600_000 : unit === 'day' ? DAY_MS : 7 * DAY_MS;
      return now() - Number(relative[1]) * multiplier;
    }
    const iso = text.match(/\b(?:20\d{2}|19\d{2})[-/.](?:0?[1-9]|1[0-2])[-/.](?:0?[1-9]|[12]\d|3[01])\b/);
    const long = text.match(/\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+(?:20\d{2}|19\d{2})\b/i)
      || text.match(/\b\d{1,2}\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(?:20\d{2}|19\d{2})\b/i);
    const parsed = Date.parse(iso?.[0] || long?.[0] || '');
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const ownerFloor = value => { const match = String(value || '').match(/([\d,]+)/); return match ? Number(match[1].replace(/,/g, '')) || 0 : 0; };
  const publicUrl = value => {
    try {
      const parsed = new URL(String(value || '').replace(/&amp;/g, '&'));
      const redirected = parsed.searchParams.get('uddg') || parsed.searchParams.get('url') || parsed.searchParams.get('q');
      return new URL(redirected && /^https?:\/\//i.test(redirected) ? decodeURIComponent(redirected) : parsed.toString()).toString();
    } catch { return ''; }
  };
  const officialHost = (url, domains) => {
    try {
      const host = new URL(url).hostname.replace(/^www\./i, '').toLowerCase();
      return domains.some(domain => host === domain || host.endsWith(`.${domain}`));
    } catch { return false; }
  };
  const titleKey = value => String(value || '').toLowerCase().replace(/\b(?:deluxe|ultimate|standard|edition|pc|game)\b/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const cleanOfficialTitle = value => String(value || '')
    .replace(/\s*[|–—-]\s*(?:Electronic Arts|EA|Ubisoft|Blizzard|Battle\.net|Xbox Wire|Epic Games|Riot Games|Rockstar Games|GOG).*$/i, '')
    .replace(/\s+(?:is\s+)?(?:now available|available now|out now|launch(?:ed|es today|es worldwide)|released today|arrives today|now live)\b[\s\S]*$/i, '')
    .replace(/^Introducing\s+/i, '').trim();

  async function mapConcurrent(items, limit, worker) {
    const output = []; let cursor = 0;
    const run = async () => { while (cursor < items.length) { const index = cursor++; try { output[index] = await worker(items[index]); } catch { output[index] = null; } } };
    await Promise.all(Array.from({ length: Math.min(limit, items.length || 1) }, run));
    return output;
  }

  async function steamReleases(current) {
    const [trendResult, featuredResult] = await Promise.allSettled([
      httpGetJson('https://steamspy.com/api.php?request=top100in2weeks', 10000),
      httpGetJson('https://store.steampowered.com/api/featuredcategories?cc=us&l=en', 10000),
    ]);
    if (trendResult.status !== 'fulfilled' && featuredResult.status !== 'fulfilled') {
      throw new Error('Steam release discovery is unavailable.');
    }
    const byApp = new Map();
    for (const item of Object.values(trendResult.status === 'fulfilled' ? (trendResult.value || {}) : {})) if (item && Number(item.appid)) byApp.set(Number(item.appid), { ...item, appid: Number(item.appid), featured: false });
    for (const item of featuredResult.status === 'fulfilled' ? (featuredResult.value?.new_releases?.items || []) : []) {
      const appid = Number(item?.id || item?.appid || 0); if (!appid) continue; const existing = byApp.get(appid) || {};
      byApp.set(appid, { ...existing, appid, name: existing.name || item.name || '', featured: true, featuredImage: item.large_capsule_image || item.small_capsule_image || existing.featuredImage || '' });
    }
    const candidates = [...byApp.values()].sort((a, b) => Number(b.featured) - Number(a.featured) || Number(b.ccu || 0) - Number(a.ccu || 0) || Number(b.positive || 0) - Number(a.positive || 0)).slice(0, 150);
    const verified = await mapConcurrent(candidates, 4, async signal => {
      const raw = await httpGetJson(`https://store.steampowered.com/api/appdetails?appids=${signal.appid}&l=en&cc=us`, 8000);
      const data = raw?.[signal.appid]?.success ? raw[signal.appid].data : null;
      const releaseAt = parseDate(data?.release_date?.date);
      if (!data || data.type !== 'game' || data.release_date?.coming_soon || !releaseAt || releaseAt > current + DAY_MS) return null;
      const ccu = Number(signal.ccu || 0); const positives = Number(signal.positive || 0); const owners = ownerFloor(signal.owners); const recommendations = Number(data.recommendations?.total || 0);
      const tier = ccu >= 150 || positives >= 250 || owners >= 20000 || recommendations >= 1000 ? 'major' : ccu >= 45 || positives >= 75 || owners >= 5000 || recommendations >= 250 ? 'noteworthy' : signal.featured ? 'popular' : null;
      const retention = tier === 'major' ? MAJOR_RETENTION_MS : SMALL_RETENTION_MS;
      if (!tier || releaseAt < current - retention) return null;
      const why = ccu >= 500 ? 'Major Steam player interest' : positives >= 1000 || recommendations >= 1000 ? 'Strong early Steam reviews' : owners >= 100000 ? 'Major Steam launch reach' : tier === 'major' ? 'Major early Steam momentum' : tier === 'noteworthy' ? 'Worth watching: early Steam interest' : 'Popular new Steam release';
      return { id: `steam-${signal.appid}`, appid: Number(signal.appid), title: data.name || signal.name || 'Untitled game', image: data.header_image || signal.featuredImage || `https://cdn.akamai.steamstatic.com/steam/apps/${signal.appid}/header.jpg`, platform: 'Steam', sourceKind: 'steam', releaseAt, releaseDate: data.release_date?.date || '', url: `https://store.steampowered.com/app/${signal.appid}`, why, ccu, reviewCount: positives, recommendations, tier, genres: (data.genres || []).map(genre => genre.description).slice(0, 3) };
    });
    return verified.filter(Boolean);
  }

  async function officialReleases(current) {
    if (typeof searchDuckDuckGo !== 'function' && typeof searchGoogle !== 'function') {
      throw new Error('Official publisher release discovery is unavailable.');
    }
    let completedSearches = 0;
    const resultGroups = await mapConcurrent(OFFICIAL_RELEASE_SOURCES, 4, async source => {
      let results = typeof searchDuckDuckGo === 'function' ? await searchDuckDuckGo(source.query) : [];
      if (!results?.length && typeof searchGoogle === 'function') results = await searchGoogle(source.query);
      completedSearches += 1;
      return (results || []).slice(0, 8).map(result => ({ source, result }));
    });
    if (!completedSearches) throw new Error('Official publisher release discovery is unavailable.');
    const accepted = [];
    for (const entry of resultGroups.flat().filter(Boolean)) {
      const { source, result } = entry;
      const url = publicUrl(result.url);
      const combined = `${result.title || ''} ${result.snippet || ''}`;
      const releaseAt = parseDate(combined);
      if (!url || !officialHost(url, source.domains) || !releaseAt || releaseAt > current + DAY_MS || !RELEASE_LANGUAGE.test(combined) || NON_RELEASE_LANGUAGE.test(combined)) continue;
      const title = cleanOfficialTitle(result.title);
      if (!title || title.length < 2) continue;
      const tier = MAJOR_LANGUAGE.test(combined) || MAJOR_FRANCHISE.test(combined) ? 'major' : 'noteworthy';
      const retention = tier === 'major' ? MAJOR_RETENTION_MS : SMALL_RETENTION_MS;
      if (releaseAt < current - retention) continue;
      const id = `${source.id}-${titleKey(title).replace(/\s+/g, '-').slice(0, 80)}`;
      accepted.push({
        id, appid: id, title, image: '', platform: source.platform, sourceKind: 'official-publisher', releaseAt,
        releaseDate: new Date(releaseAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }),
        url, why: tier === 'major' ? `Major launch verified by ${source.platform}` : `New release verified by ${source.platform}`,
        ccu: 0, reviewCount: 0, recommendations: 0, tier, genres: [],
      });
    }
    return accepted;
  }

  function mergeAndRank(items, current) {
    const unique = new Map();
    for (const item of items) {
      const key = titleKey(item.title);
      if (!key) continue;
      const existing = unique.get(key);
      if (!existing || item.sourceKind === 'official-publisher' || (item.tier === 'major' && existing.tier !== 'major')) unique.set(key, item);
    }
    const ranked = [...unique.values()].filter(item => item.releaseAt >= current - (item.tier === 'major' ? MAJOR_RETENTION_MS : SMALL_RETENTION_MS));
    const majors = ranked.filter(item => item.tier === 'major').sort((a, b) => Number(b.sourceKind === 'official-publisher') - Number(a.sourceKind === 'official-publisher') || b.releaseAt - a.releaseAt || b.ccu - a.ccu);
    const small = ranked.filter(item => item.tier !== 'major').sort((a, b) => b.releaseAt - a.releaseAt || Number(b.sourceKind === 'official-publisher') - Number(a.sourceKind === 'official-publisher') || b.ccu - a.ccu);
    const smallSlots = Math.min(4, Math.max(0, 12 - majors.length));
    return [...majors.slice(0, 12), ...small.slice(0, smallSlots)].slice(0, 12);
  }

  async function fetch({ force = false } = {}) {
    const SIX_HOURS = 21_600_000;
    if (!force && cache.payload && now() - cache.ts < SIX_HOURS) return { ok: true, ...cache.payload, fetchedAt: cache.ts, cached: true };
    try {
      const current = now();
      const [steamResult, officialResult] = await Promise.allSettled([steamReleases(current), officialReleases(current)]);
      if (steamResult.status !== 'fulfilled' && officialResult.status !== 'fulfilled') throw new Error('The current release sources could not be reached.');
      const items = mergeAndRank([...(steamResult.value || []), ...(officialResult.value || [])], current);
      const majorCount = items.filter(item => item.tier === 'major').length;
      const tier = majorCount ? 'major' : items.some(item => item.tier === 'noteworthy') ? 'semi-major' : items.length ? 'popular' : 'none';
      const criteria = majorCount
        ? `${majorCount} major release${majorCount === 1 ? '' : 's'} kept for up to 14 days and ranked first across Steam, Epic, EA, GOG, Ubisoft, Battle.net, Riot, Xbox, Rockstar and itch.io sources. Up to four smaller verified releases may follow and expire after 5 days.`
        : items.length
          ? 'No major launch is currently verified. Showing a small set of noteworthy or popular releases from the last 5 days; Steam volume cannot override official publisher evidence.'
          : 'No qualifying release was verified through the current official publisher and Steam sources. Try Refresh later.';
      const payload = { items, tier, criteria };
      cache = { ts: now(), payload };
      return { ok: true, ...payload, fetchedAt: cache.ts, cached: false };
    } catch (error) { return { ok: false, items: [], error: error?.message || 'Release feed unavailable.' }; }
  }

  return Object.freeze({ fetch, parseDate, ownerFloor, publicUrl, mergeAndRank, officialSources: OFFICIAL_RELEASE_SOURCES, retention: { major: MAJOR_RETENTION_MS, small: SMALL_RETENTION_MS } });
}

module.exports = { createWeeklyReleaseProviderService };
