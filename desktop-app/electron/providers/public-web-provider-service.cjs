function createPublicWebProviderService({ httpGetText, cleanSearchTerm, cleanTitle, publicSearchUrl }) {
  if (typeof httpGetText !== 'function' || typeof cleanSearchTerm !== 'function' || typeof cleanTitle !== 'function' || typeof publicSearchUrl !== 'function') {
    throw new TypeError('createPublicWebProviderService requires HTTP, search-term, title and public-URL dependencies.');
  }

  async function searchDuckDuckGo(term) {
    const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(term)}`;
    try {
      const html = await httpGetText(url);
      const results = [];
      const reBlock = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]{0,1200}?class="result__snippet"[^>]*>([\s\S]{0,500}?)<\/a>/g;
      let match;
      while ((match = reBlock.exec(html)) && results.length < 8) {
        results.push({
          url: decodeURIComponent(match[1]),
          title: match[2].replace(/<[^>]+>/g, '').trim(),
          snippet: match[3].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
        });
      }
      return results;
    } catch { return []; }
  }

  async function searchGoogle(term) {
    const url = `https://www.google.com/search?q=${encodeURIComponent(term)}&hl=en`;
    try {
      const html = await httpGetText(url);
      const results = [];
      const re = /<a[^>]+href="([^"]+)"[^>]*>[\s\S]{0,600}?<h3[^>]*>([\s\S]*?)<\/h3>[\s\S]{0,2200}?<div[^>]+VwiC3b[^>]*>([\s\S]{0,400}?)<\/div>/g;
      let match;
      while ((match = re.exec(html)) && results.length < 8) {
        results.push({
          url: publicSearchUrl(match[1]),
          title: match[2].replace(/<[^>]+>/g, '').trim(),
          snippet: match[3].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
        });
      }
      return results;
    } catch { return []; }
  }

  const searchGameDuckDuckGo = term => searchDuckDuckGo(`${term} video game wiki`);
  const searchGameGoogle = term => searchGoogle(`${term} video game`);

  async function searchWeb(query) {
    const term = cleanSearchTerm(query);
    if (!term) return { results: [], synthesized: null };
    let results = await searchGameDuckDuckGo(term);
    if (results.length === 0) results = await searchGameGoogle(term);
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

  return Object.freeze({ searchDuckDuckGo, searchGoogle, searchGameDuckDuckGo, searchGameGoogle, searchWeb });
}

module.exports = { createPublicWebProviderService };
