function createSpecialistMetadataProviderService({ httpGetText, httpPostJson, cleanTitle }) {
  if (typeof httpGetText !== 'function' || typeof httpPostJson !== 'function' || typeof cleanTitle !== 'function') {
    throw new TypeError('createSpecialistMetadataProviderService requires HTTP and title dependencies.');
  }

  async function itchSearch(term) {
    const url = `https://itch.io/search?q=${encodeURIComponent(term)}`;
    try {
      const html = await httpGetText(url);
      const results = [];
      const rich = /<a class="title game_link"[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]{0,800}?(?:data-background_image="([^"]+)"|class="lazy_loaded" src="([^"]+)")/g;
      let match;
      while ((match = rich.exec(html)) && results.length < 8) results.push({ url: match[1], title: match[2].replace(/<[^>]+>/g, '').trim(), image: match[3] || match[4] || '' });
      if (results.length === 0) {
        const simple = /<a class="title game_link"[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/g;
        while ((match = simple.exec(html)) && results.length < 8) results.push({ url: match[1], title: match[2].trim(), image: '' });
      }
      return results;
    } catch { return []; }
  }

  function extractDLsiteCode(term) {
    const match = (term || '').match(/\b(R[EJ]|VJ|BJ)\d{4,9}\b/i);
    return match ? match[0].toUpperCase() : null;
  }

  async function dlsiteLookup(code) {
    if (!code) return null;
    const url = `https://www.dlsite.com/maniax/work/=/product_id/${code}.html`;
    try {
      const html = await httpGetText(url);
      const title = (html.match(/<meta property="og:title" content="([^"]+)"/) || [])[1] || '';
      const desc = (html.match(/<meta property="og:description" content="([^"]+)"/) || [])[1] || '';
      const image = (html.match(/<meta property="og:image" content="([^"]+)"/) || [])[1] || '';
      if (!title) return null;
      const maker = (html.match(/itemprop="brand"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/) || [])[1]
        || (html.match(/class="maker_name"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/) || [])[1] || '';
      return { source: 'dlsite', name: title.trim(), shortDescription: desc.trim().slice(0, 240), about: desc.trim(), headerImage: image, capsuleImage: image, background: image, screenshots: [], genres: ['Visual Novel'], developers: maker ? [maker.trim()] : [], publishers: maker ? [maker.trim()] : [], releaseDate: '', website: url };
    } catch { return null; }
  }

  async function vndbLookup(term) {
    try {
      const body = { filters: ['search', '=', term], fields: 'title, image.url, description, released, developers.name, screenshots.url', results: 3 };
      const data = await httpPostJson('https://api.vndb.org/kana/vn', body);
      if (!data?.results?.length) return null;
      const top = data.results[0];
      const description = (top.description || '').replace(/\[.*?\]/g, '');
      return { source: 'vndb', name: top.title, shortDescription: description.slice(0, 240), about: description, headerImage: top.image?.url || '', capsuleImage: top.image?.url || '', background: top.image?.url || '', screenshots: (top.screenshots || []).map(item => item.url).slice(0, 6), genres: ['Visual Novel'], developers: (top.developers || []).map(item => item.name).slice(0, 3), publishers: [], releaseDate: top.released || '', website: `https://vndb.org/v${top.id || ''}` };
    } catch { return null; }
  }

  async function ryuugamesSearch(term) {
    try {
      const html = await httpGetText(`https://www.ryuugames.com/?s=${encodeURIComponent(term)}`);
      const match = html.match(/<h2[^>]*post-title[^>]*>\s*<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/);
      if (!match) return null;
      const pageUrl = match[1];
      const title = match[2].replace(/<[^>]+>/g, '').trim();
      const page = await httpGetText(pageUrl);
      const cover = (page.match(/<meta property="og:image" content="([^"]+)"/) || [])[1] || '';
      const desc = (page.match(/<meta property="og:description" content="([^"]+)"/) || [])[1] || '';
      return { source: 'ryuugames', name: cleanTitle(title) || term, shortDescription: desc, about: desc, headerImage: cover, capsuleImage: cover, background: cover, screenshots: [], genres: ['Visual Novel'], developers: [], publishers: [], releaseDate: '', website: pageUrl };
    } catch { return null; }
  }

  async function itchDetails(pageUrl) {
    try {
      const html = await httpGetText(pageUrl);
      const cover = (html.match(/<meta property="og:image" content="([^"]+)"/) || [])[1] || '';
      const desc = (html.match(/<meta property="og:description" content="([^"]+)"/) || [])[1] || '';
      const title = (html.match(/<meta property="og:title" content="([^"]+)"/) || [])[1] || '';
      const userMatch = pageUrl.match(/https?:\/\/([^.]+)\.itch\.io/);
      const shots = [];
      const shotPattern = /href="([^"]+\.(?:png|jpg|jpeg|webp|gif))"[^>]*class="screenshot/g;
      let shot;
      while ((shot = shotPattern.exec(html)) && shots.length < 6) shots.push(shot[1]);
      return { title, cover, desc, developer: userMatch ? userMatch[1] : '', shots };
    } catch { return null; }
  }

  const nichePage = (source, value) => {
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:' || url.username || url.password) return null;
      if (source === 'jast' && url.hostname === 'jaststore.com' && /^\/games\/[a-z0-9-]+\/[a-z0-9-]+\/?$/i.test(url.pathname)) return url.toString();
      if (source === 'gamejolt' && url.hostname === 'gamejolt.com' && /^\/games\/[a-z0-9-]+\/\d+\/?$/i.test(url.pathname)) return url.toString();
    } catch { /* invalid URL */ }
    return null;
  };

  function nicheStoreCandidates(source, results = []) {
    const seen = new Set(); const candidates = [];
    for (const result of Array.isArray(results) ? results : []) {
      const url = nichePage(source, result?.url);
      if (!url || seen.has(url)) continue;
      const name = cleanTitle(String(result?.title || ''))
        .replace(/\s+by\s+[^|–—-]+(?=\s*[-|–—]|\s*$)/i, '')
        .replace(/\s*[|–—-]\s*(?:JAST(?: Store)?|Game Jolt).*$/i, '').trim();
      if (!name) continue;
      seen.add(url);
      candidates.push({ source, id: url, name: name.slice(0, 300), image: '', year: '',
        shortDescription: String(result.snippet || '').slice(0, 320), raw: { pageUrl: url } });
      if (candidates.length >= 8) break;
    }
    return candidates;
  }

  async function nicheStoreDetails(source, pageUrl) {
    const url = nichePage(source, pageUrl);
    if (!url) return null;
    try {
      const html = await httpGetText(url);
      const tag = key => {
        const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const a = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["']`, 'i'));
        const b = html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["']`, 'i'));
        return (a?.[1] || b?.[1] || '').replace(/&amp;/g, '&').trim();
      };
      const name = tag('og:title').replace(/\s*[|–—-]\s*(?:JAST|Game Jolt).*$/i, '').trim();
      if (!name || name.length > 500) return null;
      const description = (tag('og:description') || tag('description')).slice(0, 3000);
      const image = tag('og:image');
      const safeImage = /^https:\/\//i.test(image) ? image : '';
      return { source, name, shortDescription: description.slice(0, 320), about: description,
        headerImage: safeImage, capsuleImage: safeImage, background: safeImage,
        screenshots: [], genres: [], developers: [], publishers: [], releaseDate: '', website: url };
    } catch { return null; }
  }

  return Object.freeze({ itchSearch, extractDLsiteCode, dlsiteLookup, vndbLookup, ryuugamesSearch, itchDetails, nichePage, nicheStoreCandidates, nicheStoreDetails });
}

module.exports = { createSpecialistMetadataProviderService };
