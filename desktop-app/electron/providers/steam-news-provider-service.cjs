function createSteamNewsProviderService({ httpGetJson, isLikelyEnglish, now = Date.now }) {
  if (typeof httpGetJson !== 'function' || typeof isLikelyEnglish !== 'function') throw new TypeError('createSteamNewsProviderService requires HTTP and language filtering.');
  let cache = { ts: 0, keyHash: '', items: [] };
  function normalizeItem(game, item, cutoffSec) {
    if (typeof item?.date !== 'number' || item.date < cutoffSec) return null;
    const raw = String(item.contents || '');
    const image = raw.match(/\[img](https?:\/\/[^\]\s]+)\[\/img]/i)?.[1] || raw.match(/<img[^>]+src=["'](https?:\/\/[^"']+)["']/i)?.[1] || '';
    const snippet = raw.replace(/\[img][\s\S]*?\[\/img]/gi, '').replace(/\[url=[^\]]*]([\s\S]*?)\[\/url]/gi, '$1').replace(/\[\/?[a-z0-9=*\s"'.:/#-]+]/gi, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 320);
    if (!isLikelyEnglish(item.title, snippet)) return null;
    return { id: `${game.appid}-${item.gid}`, platform: 'steam', gameId: game.gameId, appid: game.appid, gameName: game.name, title: item.title || '(untitled)', url: item.url, author: item.author || '', date: item.date * 1000, feedname: item.feedname || '', feedlabel: item.feedlabel || '', feed_type: typeof item.feed_type === 'number' ? item.feed_type : null, snippet, image };
  }
  async function fetch({ games = [], days = 14, force = false } = {}) {
    const list = (games || []).filter(game => game && game.appid).map(game => ({ appid: String(game.appid), name: game.name || String(game.appid), gameId: game.id || null }));
    if (!list.length) return { ok: true, items: [], fetchedAt: now() };
    const keyHash = `${list.map(game => game.appid).sort().join(',')}|${days}`;
    if (!force && cache.keyHash === keyHash && now() - cache.ts < 1800000) return { ok: true, items: cache.items, fetchedAt: cache.ts, cached: true };
    const cutoffSec = Math.floor((now() - days * 86400000) / 1000); const out = [];
    for (let index = 0; index < list.length; index += 8) {
      const slice = list.slice(index, index + 8);
      await Promise.all(slice.map(async game => {
        try {
          const data = await httpGetJson(`https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=${game.appid}&count=15&maxlength=400&format=json`, 8000);
          for (const item of data?.appnews?.newsitems || []) { const normalized = normalizeItem(game, item, cutoffSec); if (normalized) out.push(normalized); }
        } catch {}
      }));
    }
    out.sort((left, right) => right.date - left.date); cache = { ts: now(), keyHash, items: out };
    return { ok: true, items: out, fetchedAt: now(), cached: false };
  }
  return Object.freeze({ fetch, normalizeItem });
}
module.exports = { createSteamNewsProviderService };
