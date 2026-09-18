const SIX_HOURS = 6 * 60 * 60 * 1000;
const CONFIDENCE = Object.freeze({
  'saved source': 100,
  'game website': 92,
  'Steam public patch notes': 88,
  'Battle.net product page': 88,
  'automatic web discovery': 48,
});

function createUpdateSourceDiscoveryService({ search, battleNetProducts = [], now = Date.now }) {
  if (typeof search !== 'function') throw new TypeError('createUpdateSourceDiscoveryService requires a search function.');
  const cache = new Map();

  function titleTokens(name = '') {
    return String(name).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/)
      .filter(token => token.length >= 3 && !['game', 'the', 'for', 'and'].includes(token));
  }

  function resultUrl(value = '') {
    try {
      const parsed = new URL(String(value));
      const redirected = parsed.searchParams.get('uddg');
      return redirected ? decodeURIComponent(redirected) : parsed.toString();
    } catch { return String(value || ''); }
  }

  async function discover(game = {}) {
    const key = `${game.id || game.name}|${game.website || ''}|${game.updateWatchUrl || ''}`;
    const cached = cache.get(key);
    if (cached && now() - cached.ts < SIX_HOURS) return cached.sources;
    const candidates = [];
    const add = (url, kind) => {
      try {
        const normalized = new URL(url).toString();
        if (!candidates.some(candidate => candidate.url === normalized)) candidates.push({ url: normalized, kind });
      } catch { /* Ignore non-web routes. */ }
    };
    add(game.updateWatchUrl, 'saved source');
    add(game.website, 'game website');
    if (/^\d+$/.test(String(game.appid || ''))) add(`https://steamcommunity.com/app/${game.appid}/allnews/?l=english`, 'Steam public patch notes');
    if (String(game.launcher || game.source).toLowerCase() === 'battlenet') {
      const product = battleNetProducts.find(entry => entry.match.test(String(game.name || '')));
      if (product) add(product.url, 'Battle.net product page');
    }
    const tokens = titleTokens(game.name);
    if (candidates.length < 3 && tokens.length) {
      try {
        const results = await search(`${game.name} latest version patch notes`);
        for (const result of results || []) {
          if (candidates.length >= 3) break;
          const haystack = `${result.title || ''} ${result.snippet || ''}`.toLowerCase();
          const matches = tokens.filter(token => haystack.includes(token)).length;
          if (matches < Math.min(2, tokens.length) || !/(?:update|patch|version|release|devlog|changelog)/i.test(haystack)) continue;
          add(resultUrl(result.url), 'automatic web discovery');
        }
      } catch { /* Source discovery is best effort. */ }
    }
    cache.set(key, { ts: now(), sources: candidates });
    return candidates;
  }

  function confidenceFor(kind) { return CONFIDENCE[kind] || 35; }

  return Object.freeze({ discover, confidenceFor, titleTokens, resultUrl });
}

module.exports = { createUpdateSourceDiscoveryService };
