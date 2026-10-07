export function workshopArtworkAssets(record, slot) {
  if (!record) return [];
  const screenshots = Array.isArray(record.screenshots) ? record.screenshots : String(record.screenshots || '').split(/\r?\n/);
  const urls = slot === 'cover' ? [record.portraitImage, record.coverUrl, record.capsuleImage]
    : slot === 'logo' ? [record.logoImage, record.logo]
      : slot === 'icon' ? [record.icon, record.portraitImage, record.coverUrl]
        : slot === 'hero' ? [record.headerImage, record.hero, record.background, ...screenshots]
          : [record.background, ...screenshots, record.headerImage, record.hero];
  return [...new Set(urls.filter(url => typeof url === 'string' && /^(https?:|file:|neolib-background:|data:image\/)/i.test(url.trim())).map(url => url.trim()))].slice(0, 24).map((url, index) => ({id: `${slot}-${index}-${url}`, url, thumb: url, author: record.source || 'Existing game images', style: slot}));
}

export async function searchWorkshopTitles(api, source, query, key) {
  if (['screenscraper', 'romm'].includes(source)) {
    const result = await api.searchRetroSource({ source, query });
    if (!result?.ok) throw Error(result?.error || 'Configure this retro source in Settings first.');
    return result.games || [];
  }
  if (source === 'steamgriddb') {
    if (!String(key || '').trim()) throw Error('SteamGridDB needs your key in Settings. Steam, GOG and web search do not.');
    const result = await api.steamGridDbArtwork({apiKey: key, action: 'search', query});
    if (!result?.ok) throw Error(result?.error || 'SteamGridDB search failed.');
    return result.games || [];
  }
  const result = await api.listCandidates({source, query});
  if (result?.error) throw Error(result.error);
  return result?.candidates || [];
}

export async function loadWorkshopAssets(api, source, title, slot, key) {
  if (['screenscraper', 'romm'].includes(source)) {
    const result = await api.retroSourceDetails({ source, id: String(title.id), slot });
    if (!result?.ok) throw Error(result?.error || 'Retro artwork could not be loaded.');
    return result.assets || [];
  }
  if (source === 'steamgriddb') {
    const result = await api.steamGridDbArtwork({apiKey: key, action: 'assets', gameId: title.id, kind: slot});
    if (!result?.ok) throw Error(result?.error || 'Artwork could not be loaded.');
    return result.assets || [];
  }
  const record = await api.expandCandidate({candidate: title});
  return workshopArtworkAssets(record, slot);
}
