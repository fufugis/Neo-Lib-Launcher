function createStoreProviderService({ httpGetJson, cleanSearchTerm, stripHtml, steamGenreEvidence }) {
  if (typeof httpGetJson !== 'function' || typeof cleanSearchTerm !== 'function' || typeof stripHtml !== 'function' || typeof steamGenreEvidence !== 'function') {
    throw new TypeError('createStoreProviderService requires HTTP, search, HTML and Steam taxonomy dependencies.');
  }

  async function searchSteam(query) {
    const term = cleanSearchTerm(query);
    if (!term) return [];
    const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(term)}&l=en&cc=us`;
    try {
      const data = await httpGetJson(url);
      return (data.items || []).map(item => ({
        appid: item.id,
        name: item.name,
        tinyImage: item.tiny_image,
        price: item.price ? item.price.final : null,
      }));
    } catch { return []; }
  }

  async function getSteamDetails(appid) {
    const url = `https://store.steampowered.com/api/appdetails?appids=${appid}&l=en&cc=us`;
    try {
      const data = await httpGetJson(url);
      const entry = data && data[appid];
      if (!entry || !entry.success) return null;
      const details = entry.data;
      const genreTags = await steamGenreEvidence(appid, details);
      return {
        appid,
        name: details.name,
        type: details.type,
        shortDescription: details.short_description,
        aboutTheGame: stripHtml(details.about_the_game || '').slice(0, 1400),
        headerImage: details.header_image,
        capsuleImage: details.capsule_imagev5 || details.capsule_image,
        background: details.background_raw || details.background,
        screenshots: (details.screenshots || []).slice(0, 6).map(item => item.path_full),
        genres: (details.genres || []).map(item => item.description),
        genreTags,
        developers: details.developers || [],
        publishers: details.publishers || [],
        releaseDate: details.release_date ? details.release_date.date : '',
        metacritic: details.metacritic ? details.metacritic.score : null,
        website: details.website || '',
      };
    } catch { return null; }
  }

  async function searchGog(query) {
    const term = cleanSearchTerm(query);
    if (!term) return [];
    const url = `https://catalog.gog.com/v1/catalog?limit=10&query=like:${encodeURIComponent(term)}&order=desc:score&productType=in:game,pack`;
    try {
      const data = await httpGetJson(url);
      return (data.products || []).map(product => ({
        id: product.id,
        slug: product.slug,
        title: product.title,
        genres: (product.genres || []).map(genre => genre.name || genre),
        developers: product.developers || [],
        publishers: product.publishers || [],
        releaseDate: product.releaseDate ? product.releaseDate.slice(0, 10) : '',
        coverHorizontal: product.coverHorizontal,
        coverVertical: product.coverVertical,
        screenshots: (product.screenshots || []).map(screenshot =>
          (typeof screenshot === 'string' ? screenshot : screenshot.url || screenshot).replace('{formatter}', 'product_card_v2_logo_710x355').replace('{ext}', 'webp')
        ).slice(0, 6),
        url: `https://www.gog.com${product.storeLink || ''}`,
      }));
    } catch { return []; }
  }

  return Object.freeze({ searchSteam, getSteamDetails, searchGog });
}

module.exports = { createStoreProviderService };
