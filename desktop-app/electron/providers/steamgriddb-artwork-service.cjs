const BASE_URL = 'https://www.steamgriddb.com/api/v2';
const KINDS = Object.freeze({ cover: 'grids', hero: 'heroes', background: 'heroes', logo: 'logos', icon: 'icons' });

function createSteamGridDbArtworkService({ httpGetJson }) {
  if (typeof httpGetJson !== 'function') throw new TypeError('createSteamGridDbArtworkService requires HTTP JSON access.');
  const auth = (apiKey) => ({ Authorization: `Bearer ${String(apiKey || '').trim()}` });
  const request = async ({ apiKey, action, query, gameId, kind } = {}) => {
    const key = String(apiKey || '').trim();
    if (!key) return { ok: false, error: 'Add your SteamGridDB API key in Settings first.' };
    try {
      if (action === 'search') {
        const term = String(query || '').trim();
        if (!term) return { ok: false, error: 'Enter a game title.' };
        const result = await httpGetJson(`${BASE_URL}/search/autocomplete/${encodeURIComponent(term)}`, 9000, auth(key));
        const games = (Array.isArray(result?.data) ? result.data : []).slice(0, 12).map((game) => ({
          id: String(game.id || ''), name: String(game.name || '').slice(0, 300), verified: game.verified === true,
          types: (Array.isArray(game.types) ? game.types : []).map(String).slice(0, 12),
        })).filter((game) => game.id && game.name);
        return { ok: true, games };
      }
      if (action === 'assets') {
        const endpoint = KINDS[kind];
        const id = String(gameId || '').trim();
        if (!endpoint || !/^\d{1,12}$/.test(id)) return { ok: false, error: 'Choose a valid SteamGridDB game and artwork type.' };
        const params = endpoint === 'grids' ? '?dimensions=600x900,342x482,660x930&types=static' : '?types=static';
        const result = await httpGetJson(`${BASE_URL}/${endpoint}/game/${id}${params}`, 9000, auth(key));
        const assets = (Array.isArray(result?.data) ? result.data : []).slice(0, 36).map((asset) => ({
          id: String(asset.id || ''), url: String(asset.url || ''), thumb: String(asset.thumb || asset.url || ''),
          width: Math.max(0, Number(asset.width) || 0), height: Math.max(0, Number(asset.height) || 0),
          style: String(asset.style || '').slice(0, 80), score: Number(asset.score) || 0,
          author: String(asset.author?.name || 'SteamGridDB contributor').slice(0, 120),
          nsfw: asset.nsfw === true, humor: asset.humor === true,
        })).filter((asset) => asset.id && /^https:\/\//i.test(asset.url) && /^https:\/\//i.test(asset.thumb));
        return { ok: true, assets };
      }
      return { ok: false, error: 'Unknown artwork request.' };
    } catch { return { ok: false, error: 'SteamGridDB could not be reached. Check the API key and try again.' }; }
  };
  return Object.freeze({ request });
}

module.exports = { createSteamGridDbArtworkService };
