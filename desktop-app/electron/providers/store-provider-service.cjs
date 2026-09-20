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
      const capabilities = steamCapabilities(details);
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
        portraitImage: steamPortraitImage(appid),
        capabilities,
        achievementSummary: steamAchievementSummary(details, capabilities),
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

function steamPortraitImage(appid) {
  const key = String(appid || '').trim();
  return /^\d+$/.test(key) ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${key}/library_600x900.jpg` : '';
}

function steamCapabilities(details = {}) {
  const entries = Array.isArray(details.categories) ? details.categories : [];
  const output = [];
  const add = (id, label, detail) => {
    if (!output.some((item) => item.id === id)) output.push({ id, label, source: 'steam', detail });
  };
  for (const entry of entries) {
    const label = String(entry?.description || '').trim();
    const key = label.toLowerCase();
    if (key === 'single-player') add('single-player', 'Single-player', label);
    else if (key === 'multi-player' || key === 'multiplayer' || key === 'online multiplayer') add('online-multiplayer', 'Online multiplayer', label);
    else if (key === 'local multiplayer') add('local-multiplayer', 'Local multiplayer', label);
    else if (key === 'co-op' || key === 'online co-op' || key === 'local co-op') add('co-op', 'Co-op', label);
    else if (key === 'online pvp') add('pvp', 'PvP', label);
    else if (key === 'steam achievements') add('achievements', 'Achievements', label);
    else if (key === 'steam cloud') add('cloud-saves', 'Cloud saves', label);
    else if (key === 'steam workshop') add('workshop', 'Workshop', label);
    else if (/^remote play/.test(key)) add('remote-play', 'Remote play', label);
    else if (key === 'full controller support') add('controller-full', 'Full controller support', label);
    else if (key === 'partial controller support') add('controller-partial', 'Partial controller support', label);
  }
  if (details.controller_support === 'full') add('controller-full', 'Full controller support', 'Steam controller support');
  if (details.controller_support === 'partial') add('controller-partial', 'Partial controller support', 'Steam controller support');
  return output;
}

function steamAchievementSummary(details = {}, capabilities = []) {
  if (!capabilities.some((item) => item.id === 'achievements')) return null;
  const total = Number(details?.achievements?.total);
  return {
    source: 'steam',
    supported: true,
    total: Number.isFinite(total) && total >= 0 ? total : null,
    // Store metadata can confirm support/count, not player-earned progress.
    // Progress is deliberately held for the future opt-in account connector.
    syncState: 'not-linked',
  };
}

module.exports = { createStoreProviderService };
