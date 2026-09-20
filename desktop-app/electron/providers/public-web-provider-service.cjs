function createPublicWebProviderService({ httpGetText, cleanSearchTerm, cleanTitle, publicSearchUrl }) {
  if (typeof httpGetText !== 'function' || typeof cleanSearchTerm !== 'function' || typeof cleanTitle !== 'function' || typeof publicSearchUrl !== 'function') {
    throw new TypeError('createPublicWebProviderService requires HTTP, search-term, title and public-URL dependencies.');
  }

  async function searchDuckDuckGo(term) {
    const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(term)}&kp=-2`;
    try {
      const html = await httpGetText(url);
      const results = [];
      const reBlock = /<a[^>]+class="[^"]*result__a[^"]*"[^>]+href="([^"]+)"[^>]*>([\s\S]{0,500}?)<\/a>[\s\S]{0,1400}?class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]{0,700}?)<\/(?:a|div|span)>/g;
      let match;
      while ((match = reBlock.exec(html)) && results.length < 8) {
        results.push({
          url: decodeURIComponent(match[1]),
          title: match[2].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim(),
          snippet: match[3].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
        });
      }
      return results;
    } catch { return []; }
  }

  async function searchGoogle(term) {
    const url = `https://www.google.com/search?q=${encodeURIComponent(term)}&hl=en&safe=off`;
    try {
      const html = await httpGetText(url);
      const results = [];
      const re = /<a[^>]+href="([^"]+)"[^>]*>[\s\S]{0,900}?<h3[^>]*>([\s\S]*?)<\/h3>[\s\S]{0,2400}?(?:<div[^>]+(?:VwiC3b|yXK7lf|IsZvec)[^>]*>|<span[^>]+(?:aCOpRe|hgKElc)[^>]*>)([\s\S]{0,650}?)<\/(?:div|span)>/g;
      let match;
      while ((match = re.exec(html)) && results.length < 8) {
        results.push({
          url: publicSearchUrl(match[1]),
          title: match[2].replace(/<[^>]+>/g, '').trim(),
          snippet: match[3].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
        });
      }
      if (!results.length) {
        const headings = /<a[^>]+href="([^"]+)"[^>]*>[\s\S]{0,900}?<h3[^>]*>([\s\S]*?)<\/h3>/g;
        while ((match = headings.exec(html)) && results.length < 8) {
          const urlValue = publicSearchUrl(match[1]);
          if (!/^https?:\/\//i.test(urlValue)) continue;
          const after = html.slice(headings.lastIndex, headings.lastIndex + 1400);
          const snippet = (after.match(/<(?:div|span)[^>]*>([\s\S]{20,600}?)<\/(?:div|span)>/) || [])[1] || '';
          results.push({ url: urlValue, title: match[2].replace(/<[^>]+>/g, '').trim(), snippet: snippet.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() });
        }
      }
      return results;
    } catch { return []; }
  }

  const searchGameDuckDuckGo = term => searchDuckDuckGo(`${term} video game wiki`);
  const searchGameGoogle = term => searchGoogle(`${term} video game`);

  const compact = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  const gameTitleVariants = value => {
    const original = cleanSearchTerm(value);
    if (!original) return [];
    const spaced = original
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[._-]+/g, ' ')
      .replace(/[\[(].*?[\])]/g, ' ')
      .replace(/\b(?:v?\d+(?:\.\d+)+|build\s*\d+|demo|alpha|beta|win64|win32|x64|x86)\b/gi, ' ')
      .replace(/\s+/g, ' ').trim();
    return [...new Set([original, spaced].filter(term => term.length >= 2))];
  };
  const relevance = (term, result) => {
    const needle = compact(term); const title = compact(result?.title); const body = compact(`${result?.title || ''} ${result?.snippet || ''} ${result?.url || ''}`);
    if (!needle || !body) return 0;
    if (title === needle) return 1;
    if (title.startsWith(needle) || title.includes(needle)) return 0.94;
    if (body.includes(needle)) return 0.78;
    const tokens = String(term).toLowerCase().split(/[^a-z0-9]+/).filter(token => token.length > 1);
    return tokens.length ? tokens.filter(token => body.includes(token)).length / tokens.length * 0.62 : 0;
  };
  const rankResults = (term, results) => {
    const unique = new Map();
    for (const result of results.flat()) if (result?.url && !unique.has(result.url)) unique.set(result.url, result);
    return [...unique.values()].map(result => ({ result, score: relevance(term, result) })).filter(entry => entry.score >= 0.28).sort((a, b) => b.score - a.score).map(entry => entry.result).slice(0, 8);
  };
  async function searchGameMetadata(value) {
    const variants = gameTitleVariants(value);
    for (const variant of variants) {
      for (const query of [`"${variant}"`, `${variant} game`]) {
        const [duck, google] = await Promise.all([searchDuckDuckGo(query), searchGoogle(query)]);
        const ranked = rankResults(variant, [duck, google]);
        if (ranked.length && relevance(variant, ranked[0]) >= 0.76) return ranked;
      }
    }
    return [];
  }

  async function searchWeb(query) {
    const term = cleanSearchTerm(query);
    if (!term) return { results: [], synthesized: null };
    const results = await searchGameMetadata(term);
    let synthesized = null;
    if (results.length > 0) {
      const top = results[0];
      const yearMatch = `${top.snippet} ${top.title}`.match(/\b(19|20)\d{2}\b/);
      const genreKeywords = [
        'RPG', 'action', 'adventure', 'puzzle', 'platformer', 'shooter', 'strategy',
        'simulation', 'roguelike', 'rogue-like', 'horror', 'survival', 'racing', 'sports',
        'fighting', 'metroidvania', 'visual novel', 'sandbox', 'open-world', 'open world', 'indie',
      ];
      const text = `${top.snippet} ${top.title}`.toLowerCase();
      const genres = Array.from(new Set(genreKeywords.filter(keyword => text.includes(keyword.toLowerCase()))))
        .map(genre => genre.replace(/\b\w/g, character => character.toUpperCase()));
      synthesized = {
        name: cleanTitle(top.title) || term,
        about: top.snippet,
        shortDescription: top.snippet,
        genres,
        releaseDate: yearMatch ? yearMatch[0] : '',
        website: top.url || '',
        developers: [], publishers: [], screenshots: [], source: 'web',
      };
    }
    return { results, synthesized };
  }

  return Object.freeze({ searchDuckDuckGo, searchGoogle, searchGameDuckDuckGo, searchGameGoogle, gameTitleVariants, searchGameMetadata, searchWeb });
}

module.exports = { createPublicWebProviderService };
