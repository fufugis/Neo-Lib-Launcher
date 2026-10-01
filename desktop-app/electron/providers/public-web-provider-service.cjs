function createPublicWebProviderService({ httpGetText, cleanSearchTerm, cleanTitle, publicSearchUrl }) {
  if (typeof httpGetText !== 'function' || typeof cleanSearchTerm !== 'function' || typeof cleanTitle !== 'function' || typeof publicSearchUrl !== 'function') {
    throw new TypeError('createPublicWebProviderService requires HTTP, search-term, title and public-URL dependencies.');
  }

  const decodeText = value => String(value || '')
    .replace(/&#(x[0-9a-f]+|\d+);/gi, (_, entity) => {
      const codepoint = entity[0].toLowerCase() === 'x' ? parseInt(entity.slice(1), 16) : parseInt(entity, 10);
      return Number.isFinite(codepoint) && codepoint > 0 && codepoint <= 0x10ffff ? String.fromCodePoint(codepoint) : '';
    })
    .replace(/&(?:amp|quot|apos|#39|lt|gt|nbsp);/gi, entity => ({
      '&amp;': '&', '&quot;': '"', '&apos;': "'", '&#39;': "'", '&lt;': '<', '&gt;': '>', '&nbsp;': ' ',
    })[entity.toLowerCase()] || entity);
  const plainText = value => decodeText(String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')).trim();
  const attribute = (html, name) => {
    const match = String(html || '').match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'));
    return decodeText(match?.[2] || '');
  };
  const resultUrl = raw => {
    let value = String(raw || '');
    if (/^https?%3a/i.test(value)) {
      try { value = decodeURIComponent(value); } catch { return ''; }
    }
    return publicSearchUrl(value);
  };
  const snippetAfter = (html, offset) => {
    const tail = html.slice(offset, offset + 4000);
    const nearby = tail.split(/<h3\b/i, 1)[0];
    const match = nearby.match(/<(?:div|span|a)\b[^>]*class=["'][^"']*(?:result__snippet|VwiC3b|yXK7lf|IsZvec|aCOpRe|hgKElc)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|span|a)>/i);
    const fallback = nearby.match(/<div\b[^>]*>([\s\S]{20,650}?)<\/div>/i);
    return plainText(match?.[1] || fallback?.[1] || '').slice(0, 700);
  };

  async function searchDuckDuckGo(term) {
    const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(term)}&kp=-2`;
    try {
      const html = await httpGetText(url);
      const results = [];
      const reBlock = /<a\b([^>]*class=["'][^"']*result__a[^"']*["'][^>]*)>([\s\S]*?)<\/a>/gi;
      let match;
      while ((match = reBlock.exec(html)) && results.length < 8) {
        const url = resultUrl(attribute(match[1], 'href'));
        const title = plainText(match[2]);
        if (!url || !title) continue;
        results.push({
          url, title, snippet: snippetAfter(html, reBlock.lastIndex),
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
      const re = /<h3\b[^>]*>([\s\S]*?)<\/h3>/gi;
      let match;
      while ((match = re.exec(html)) && results.length < 8) {
        const before = html.slice(Math.max(0, match.index - 2500), match.index);
        const anchors = [...before.matchAll(/<a\b([^>]*)>/gi)];
        const url = resultUrl(attribute(anchors.at(-1)?.[1], 'href'));
        const title = plainText(match[1]);
        if (!url || !title) continue;
        results.push({
          url, title, snippet: snippetAfter(html, re.lastIndex),
        });
      }
      return results;
    } catch { return []; }
  }

  async function searchBing(term) {
    const url = `https://www.bing.com/search?format=rss&q=${encodeURIComponent(term)}`;
    try {
      const xml = await httpGetText(url);
      const results = [];
      const items = xml.match(/<item\b[^>]*>[\s\S]*?<\/item>/gi) || [];
      const field = (item, tag) => {
        const content = item.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))?.[1] || '';
        return plainText(content.replace(/^<!\[CDATA\[|\]\]>$/g, ''));
      };
      for (const item of items.slice(0, 12)) {
        const url = resultUrl(field(item, 'link'));
        const title = field(item, 'title');
        if (url && title) results.push({ url, title, snippet: field(item, 'description').slice(0, 700) });
        if (results.length >= 8) break;
      }
      return results;
    } catch { return []; }
  }

  const searchGameDuckDuckGo = term => searchDuckDuckGo(`${term} video game wiki`);
  const searchGameGoogle = async term => {
    const query = `${term} video game`;
    const google = await searchGoogle(query);
    return google.length ? google : searchBing(query);
  };

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
        const [google, bing] = await Promise.all([searchGoogle(query), searchBing(query)]);
        const fastRanked = rankResults(variant, [google, bing]);
        if (fastRanked.length && relevance(variant, fastRanked[0]) >= 0.76) return fastRanked;
        const duck = await searchDuckDuckGo(query);
        const ranked = rankResults(variant, [google, bing, duck]);
        if (ranked.length && relevance(variant, ranked[0]) >= 0.76) return ranked;
      }
    }
    return [];
  }

  async function searchGameCandidates(value) {
    const variants = gameTitleVariants(value);
    let best = [];
    for (const variant of variants) {
      for (const query of [`"${variant}"`, `${variant} game`]) {
        const [google, bing] = await Promise.all([searchGoogle(query), searchBing(query)]);
        const fastRanked = rankResults(variant, [google, bing]);
        if (fastRanked.length && relevance(variant, fastRanked[0]) >= 0.76) return fastRanked;
        const duck = await searchDuckDuckGo(query);
        const ranked = rankResults(variant, [google, bing, duck]);
        if (ranked.length && relevance(variant, ranked[0]) >= 0.76) return ranked;
        if (ranked.length && relevance(variant, ranked[0]) >= 0.42 && (!best.length || relevance(variant, ranked[0]) > relevance(variant, best[0]))) best = ranked;
      }
    }
    return best;
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

  return Object.freeze({ searchDuckDuckGo, searchGoogle, searchBing, searchGameDuckDuckGo, searchGameGoogle, gameTitleVariants, searchGameMetadata, searchGameCandidates, searchWeb });
}

module.exports = { createPublicWebProviderService };
