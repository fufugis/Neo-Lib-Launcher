const STEAM_ID_OFFSET = 76561197960265728n;
const KEY_PATTERN = /^[a-f0-9]{32}$/i;
const APP_PATTERN = /^[1-9]\d{0,11}$/;

function createSteamAchievementService({ fetchImpl = fetch } = {}) {
  async function sync({ apiKey, appid, steamid3 } = {}) {
    const key = String(apiKey || '').trim();
    const app = String(appid || '').trim();
    const account = String(steamid3 || '').trim();
    if (!KEY_PATTERN.test(key) || !APP_PATTERN.test(app) || !/^\d{1,12}$/.test(account)) {
      return { ok: false, error: 'A valid personal Steam Web API key, Steam app ID and signed-in account are required.' };
    }
    const steamid64 = String(STEAM_ID_OFFSET + BigInt(account));
    const url = new URL('https://partner.steam-api.com/ISteamUserStats/GetPlayerAchievements/v1/');
    url.searchParams.set('appid', app);
    url.searchParams.set('steamid', steamid64);
    url.searchParams.set('l', 'english');
    try {
      const response = await fetchImpl(url, {
        headers: { 'x-webapi-key': key, Accept: 'application/json' },
        signal: AbortSignal.timeout(12000),
      });
      if (!response.ok) return { ok: false, error: response.status === 403 ? 'Steam denied access. Check your key and the account privacy settings.' : `Steam returned HTTP ${response.status}. No progress was changed.` };
      if (Number(response.headers?.get?.('content-length') || 0) > 1024 * 1024) return { ok: false, error: 'Steam response exceeded the safe size limit.' };
      const body = await response.text();
      if (body.length > 1024 * 1024) return { ok: false, error: 'Steam response exceeded the safe size limit.' };
      const stats = JSON.parse(body)?.playerstats;
      if (stats?.success !== true || String(stats.steamID || '') !== steamid64 || String(stats.gameName || '').length > 500 || !Array.isArray(stats.achievements)) {
        return { ok: false, error: 'Steam did not return verified achievements for the signed-in account and this game.' };
      }
      if (stats.achievements.length > 2000 || !stats.achievements.every(item => item && typeof item.apiname === 'string' && item.apiname.length <= 200 && (item.achieved === 0 || item.achieved === 1))) {
        return { ok: false, error: 'Steam achievement data was malformed or too large.' };
      }
      const earned = stats.achievements.filter(item => item.achieved === 1).length;
      return { ok: true, source: 'steam', appid: app, steamid64, earned, total: stats.achievements.length, syncedAt: Date.now() };
    } catch {
      return { ok: false, error: 'Steam achievements could not be reached. No progress was changed.' };
    }
  }
  return Object.freeze({ sync });
}

module.exports = { createSteamAchievementService };
