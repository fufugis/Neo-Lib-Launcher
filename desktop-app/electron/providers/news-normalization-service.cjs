function createNewsNormalizationService({ now = Date.now }) {
  function isLikelyEnglish(title, snippet) {
    const text = `${title || ''} ${snippet || ''}`;
    if (!text.trim()) return true;
    const nonLatin = text.match(/[\u0400-\u04FF\u0370-\u03FF\u0590-\u05FF\u0600-\u06FF\u0900-\u097F\u0E00-\u0E7F\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uAC00-\uD7A3]/g);
    return !nonLatin || nonLatin.length < 3;
  }
  function tokens(name = '') {
    return String(name).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(token => token.length >= 3 && !['game', 'the', 'for', 'and', 'edition'].includes(token));
  }
  function publicUrl(value = '') {
    const raw = String(value || '').replace(/&amp;/g, '&').trim();
    if (!raw) return '';
    try {
      const parsed = new URL(raw, 'https://www.google.com');
      const redirected = parsed.searchParams.get('uddg') || parsed.searchParams.get('q') || parsed.searchParams.get('url');
      const candidate = redirected && /^https?:\/\//i.test(redirected) ? redirected : parsed.toString();
      const target = new URL(candidate);
      if (!/^https?:$/.test(target.protocol) || /(^|\.)google\./i.test(target.hostname)) return '';
      return target.toString();
    } catch { return ''; }
  }
  function date(value = '') {
    const text = String(value || '');
    const relative = text.match(/\b(\d{1,3})\s*(minute|hour|day|week|month)s?\s+ago\b/i);
    if (relative) {
      const amount = Number(relative[1]);
      const unit = relative[2].toLowerCase();
      const multiplier = unit === 'minute' ? 60000 : unit === 'hour' ? 3600000 : unit === 'day' ? 86400000 : unit === 'week' ? 7 * 86400000 : 30 * 86400000;
      return now() - amount * multiplier;
    }
    const iso = text.match(/\b(?:20\d{2}|19\d{2})[-/.](?:0?[1-9]|1[0-2])[-/.](?:0?[1-9]|[12]\d|3[01])\b/);
    const long = text.match(/\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+(?:20\d{2}|19\d{2})\b/i) || text.match(/\b\d{1,2}\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(?:20\d{2}|19\d{2})\b/i);
    const parsed = Date.parse(iso?.[0] || long?.[0] || '');
    return Number.isFinite(parsed) ? parsed : 0;
  }
  function siteHost(game = {}) { try { return new URL(game.website || '').hostname.replace(/^www\./i, '').toLowerCase(); } catch { return ''; } }
  function result(game, searchResult, cutoffMs) {
    const title = String(searchResult?.title || '');
    const snippet = String(searchResult?.snippet || '');
    const gameTokens = tokens(game.name);
    const combined = `${title} ${snippet}`.toLowerCase();
    if (!gameTokens.length || gameTokens.filter(token => combined.includes(token)).length < Math.min(2, gameTokens.length)) return null;
    if (!/(?:news|update|patch|hotfix|devlog|changelog|roadmap|season|announcement)/i.test(combined)) return null;
    const foundDate = date(combined);
    if (!foundDate || foundDate < cutoffMs || foundDate > now() + 86400000) return null;
    const url = publicUrl(searchResult?.url);
    const host = siteHost(game);
    let sourceKind = 'web search';
    if (host && url) { try { const resultHost = new URL(url).hostname.replace(/^www\./i, '').toLowerCase(); if (resultHost === host || resultHost.endsWith(`.${host}`)) sourceKind = 'official website'; } catch {} }
    return { id: `web-${game.id || game.name}-${foundDate}-${title}`, platform: sourceKind === 'official website' ? 'official-web' : 'web', gameId: game.id || null, gameName: game.name || '', title: title || 'Recent game news', url: url || `https://www.google.com/search?q=${encodeURIComponent(`${game.name} game news update`)}`, author: '', date: foundDate, snippet: snippet.slice(0, 320), sourceKind };
  }
  return Object.freeze({ isLikelyEnglish, tokens, publicUrl, date, siteHost, result });
}
module.exports = { createNewsNormalizationService };
