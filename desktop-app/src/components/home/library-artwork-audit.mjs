const coverFor = (game) => String(game?.portraitImage || game?.coverUrl || game?.capsuleImage || '').trim();

function knownDimensions(game, url) {
  const width = Number(game?.coverWidth || game?.artworkDimensions?.cover?.width || game?.artworkDimensions?.cover?.w);
  const height = Number(game?.coverHeight || game?.artworkDimensions?.cover?.height || game?.artworkDimensions?.cover?.h);
  if (width > 0 && height > 0) return { width, height };
  const match = String(url || '').match(/(?:^|[^\d])(\d{2,4})[x×](\d{2,4})(?:[^\d]|$)/i);
  return match ? { width: Number(match[1]), height: Number(match[2]) } : null;
}

function artKey(url) {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname.toLowerCase()}${parsed.pathname.toLowerCase()}`;
  } catch { return url.toLowerCase().split(/[?#]/)[0]; }
}

export function libraryArtworkAudit(games = []) {
  const inspectable = games.filter((game) => !game?.homeLocked);
  const usage = new Map();
  for (const game of inspectable) {
    const url = coverFor(game);
    if (url) {
      const key = artKey(url);
      usage.set(key, (usage.get(key) || 0) + 1);
    }
  }
  const rows = inspectable.map((game) => {
    const cover = coverFor(game);
    const dimensions = knownDimensions(game, cover);
    const reasons = [];
    if (!cover) reasons.push('Missing cover');
    if (dimensions && (dimensions.width >= dimensions.height || dimensions.height / dimensions.width < 1.15)) reasons.push('Not portrait artwork');
    if (cover && (usage.get(artKey(cover)) || 0) > 1) reasons.push('Same cover used by multiple games');
    const metadata = [
      ['Description', game.about || game.shortDescription || game.description],
      ['Genres', game.genreProfile?.core?.length || game.genreProfile?.rawTags?.length || game.genres?.length || game.genreTags?.length],
      ['Developer / publisher', game.developers?.length || game.publishers?.length],
      ['Release date', game.releaseDate || game.year],
      ['Metacritic', Number.isFinite(Number(game.metacritic)) && game.metacritic != null],
      ['Launch target', game.exePath || game.launchUrl],
    ].map(([label, value]) => ({ label, present: typeof value === 'number' ? value > 0 : Boolean(String(value || '').trim()) }));
    const exePath = String(game.exePath || game.launchUrl || '');
    const exeName = exePath.split(/[\\/]/).filter(Boolean).at(-1) || 'No launch target';
    return { game, cover, dimensions, reasons, metadata, exeName, needsReview: reasons.length > 0 || metadata.some((item) => !item.present) };
  });
  return rows;
}

export function libraryArtworkIssueCounts(rows = libraryArtworkAudit()) {
  return rows.reduce((counts, row) => {
    if (row.reasons.includes('Missing cover')) counts.missing += 1;
    if (row.reasons.includes('Not portrait artwork')) counts.wrongShape += 1;
    if (row.reasons.includes('Same cover used by multiple games')) counts.reused += 1;
    return counts;
  }, { missing: 0, wrongShape: 0, reused: 0 });
}
