function createOwnedNewsProviderService({ httpGetText, httpGetJson, stripHtml }) {
  if (typeof httpGetText !== 'function' || typeof httpGetJson !== 'function' || typeof stripHtml !== 'function') throw new TypeError('createOwnedNewsProviderService requires HTTP and HTML cleanup.');
  async function fetchItch(game, cutoffMs) {
    const url = game.website || ''; if (!/itch\.io/.test(url)) return [];
    const rssUrl = `${url.replace(/\/+$/, '').replace(/\/devlog(\.rss)?$/i, '')}/devlog.rss`;
    try {
      const xml = await httpGetText(rssUrl); const items = []; const pattern = /<item>([\s\S]*?)<\/item>/g; let match;
      while ((match = pattern.exec(xml)) !== null) {
        const block = match[1]; const title = stripHtml((block.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || ''); const link = ((block.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || '').trim(); const pub = (block.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1] || ''; const desc = stripHtml((block.match(/<description>([\s\S]*?)<\/description>/) || [])[1] || '');
        const image = (block.match(/<media:content[^>]+url=["'](https?:\/\/[^"']+)["']/i) || [])[1] || (block.match(/<enclosure[^>]+url=["'](https?:\/\/[^"']+)["']/i) || [])[1] || (block.match(/<img[^>]+src=["'](https?:\/\/[^"']+)["']/i) || [])[1] || '';
        const date = pub ? Date.parse(pub) : 0; if (!date || date < cutoffMs) continue;
        items.push({ id: `itch-${game.id}-${link || title}`, platform: 'itch', gameId: game.id, gameName: game.name, gameUrl: url, title: title || '(untitled devlog)', url: link || url, author: '', date, snippet: desc.slice(0, 320), image });
      }
      return items;
    } catch { return []; }
  }
  async function fetchGog(game, cutoffMs) {
    const gid = game.gogId; if (!gid) return [];
    try {
      const data = await httpGetJson(`https://api.gog.com/products/${gid}?expand=changelog&locale=en-US`, 8000); const html = String(data?.changelog || ''); if (!html) return [];
      const pattern = /<h[1-6][^>]*>\s*([^<]{4,80}?)\s*<\/h[1-6]>([\s\S]*?)(?=<h[1-6][^>]*>|$)/g; const items = []; let match;
      while ((match = pattern.exec(html)) !== null) {
        const heading = stripHtml(match[1]); const body = stripHtml(match[2]).slice(0, 320); let date = 0;
        const iso = heading.match(/\b(20\d{2}|19\d{2})[-/](0?[1-9]|1[0-2])[-/](0?[1-9]|[12]\d|3[01])\b/);
        if (iso) { const parsed = Date.parse(`${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`); if (Number.isFinite(parsed)) date = parsed; }
        if (!date) { const long = heading.match(/\b(\d{1,2})\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(20\d{2}|19\d{2})\b/i); if (long) { const parsed = Date.parse(`${long[1]} ${long[2]} ${long[3]}`); if (Number.isFinite(parsed)) date = parsed; } }
        if (!date) { const parsed = Date.parse(heading); if (Number.isFinite(parsed)) date = parsed; }
        if (!date || date < cutoffMs) continue;
        items.push({ id: `gog-${game.id}-${date}`, platform: 'gog', gameId: game.id, gameName: game.name, title: `Patch notes · ${heading}`, url: game.website || `https://www.gog.com/game/${gid}`, author: '', date, snippet: body });
      }
      return items;
    } catch { return []; }
  }
  return Object.freeze({ fetchItch, fetchGog });
}
module.exports = { createOwnedNewsProviderService };
