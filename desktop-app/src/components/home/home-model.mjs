export const PLATFORM = Object.freeze({ steam: 'Steam', epic: 'Epic', gog: 'GOG', ea: 'EA app', ubisoft: 'Ubisoft', battlenet: 'Battle.net', riot: 'Riot', xbox: 'Xbox / Game Pass', rockstar: 'Rockstar', itch: 'itch.io', private: 'Protected', local: 'Local' });

export function platformOf(game) {
  const launcher = (game?.launcher || '').toLowerCase();
  if (PLATFORM[launcher]) return launcher;
  if (/itch\.io/i.test(game?.website || '')) return 'itch';
  return 'local';
}

export function hours(minutes) { const value = Number(minutes || 0) / 60; return value ? `${value < 10 ? value.toFixed(1) : Math.round(value)}h` : '—'; }
export function relative(ms, now = Date.now()) { if (!ms) return 'Never'; const days = Math.floor((now - ms) / 86400000); return days === 0 ? 'Today' : days === 1 ? 'Yesterday' : days < 7 ? `${days}d ago` : days < 31 ? `${Math.floor(days / 7)}w ago` : `${Math.floor(days / 30)}mo ago`; }
export function added(ms) { return ms ? new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(ms)) : '—'; }

export const EMPTY_GAME_UPDATES = Object.freeze({ loading: false, items: [], needsSetup: [], ledger: [], checked: 0, launcherManagedCount: 0, scannedAt: 0, error: '' });

export function normaliseGameUpdates(value) {
  if (!value || typeof value !== 'object') return { ...EMPTY_GAME_UPDATES };
  return { ...EMPTY_GAME_UPDATES, items: Array.isArray(value.items) ? value.items : [], needsSetup: Array.isArray(value.needsSetup) ? value.needsSetup : [], ledger: Array.isArray(value.ledger) ? value.ledger : [], checked: Number(value.checked || 0), launcherManagedCount: Number(value.launcherManagedCount || 0), scannedAt: Number(value.scannedAt || 0), error: value.error || '' };
}

export function maskHomeNews(item, lockedGameCategories) {
  const category = lockedGameCategories?.[item?.gameId];
  return category ? { ...item, gameName: 'Locked game', title: 'Update from protected game', snippet: 'Unlock its category in Library to view the details.', appid: null, url: '', homeLocked: true, lockedCategoryName: category } : item;
}

function maskHomeUpdate(item, lockedGameCategories) {
  const category = lockedGameCategories?.[item?.id];
  return category ? { ...item, name: 'Locked game', platform: 'private', currentVersion: 'Protected', latestVersion: 'Protected', missing: 'Protected until unlock', sourceKind: 'private', homeLocked: true, lockedCategoryName: category } : item;
}

export function maskHomeUpdates(value, lockedGameCategories) {
  const updates = normaliseGameUpdates(value);
  return { ...updates, items: updates.items.map((item) => maskHomeUpdate(item, lockedGameCategories)), needsSetup: updates.needsSetup.map((item) => maskHomeUpdate(item, lockedGameCategories)) };
}

export function getLibraryHealth(games) {
  const inspectableGames = games.filter((game) => !game.homeLocked);
  const missingArt = inspectableGames.filter((game) => !(game.coverUrl || game.headerImage || game.background)).length;
  const missingDetails = inspectableGames.filter((game) => ![game.description, game.about, game.shortDescription].some((value) => String(value || '').trim())).length;
  const noLaunchTarget = inspectableGames.filter((game) => !(game.exePath || game.launchUrl)).length;
  const names = new Map();
  for (const game of inspectableGames) { const key = String(game.name || '').toLowerCase().replace(/[^a-z0-9]/g, ''); if (key) names.set(key, (names.get(key) || 0) + 1); }
  const duplicates = [...names.values()].reduce((total, count) => total + (count > 1 ? count - 1 : 0), 0);
  const issues = missingArt + missingDetails + noLaunchTarget + duplicates;
  const genreProfile = inspectableGames.filter((game) => Array.isArray(game.genreProfile?.rawTags) && game.genreProfile.rawTags.length > 0).length;
  return { missingArt, missingDetails, noLaunchTarget, duplicates, genreProfile, score: Math.max(0, Math.round(100 - ((issues / Math.max(inspectableGames.length, 1)) * 35))) };
}

export function getRecommendations(games, news, now = Date.now()) {
  const hasNews = (game) => news.find((item) => item.gameId === game.id || String(item.gameName || '').toLowerCase() === String(game.name || '').toLowerCase());
  const installed = games.filter((game) => game.exePath || game.launchUrl);
  const updated = installed.map((game) => ({ game, news: hasNews(game) })).filter((entry) => entry.news).sort((a, b) => Number(b.news.date || 0) - Number(a.news.date || 0))[0];
  const rediscover = installed.filter((game) => Number(game.lastPlayedAt || 0) && now - Number(game.lastPlayedAt) > 21 * 86400000).sort((a, b) => (Number(b.rating || 0) * 10000000000 + Number(b.playtime || 0)) - (Number(a.rating || 0) * 10000000000 + Number(a.playtime || 0)))[0];
  const fresh = installed.filter((game) => !Number(game.playtime || 0)).sort((a, b) => Number(b.addedAt || 0) - Number(a.addedAt || 0))[0];
  const seen = new Set();
  return [
    updated && { game: updated.game, label: 'NEW UPDATE', reason: `New patch notes appeared ${relative(updated.news.date, now)}. ${updated.news.title ? `${updated.news.title} — ` : ''}a good reason to return and see what changed.`, action: 'Read update', update: true },
    rediscover && { game: rediscover, label: 'Rediscover', reason: `You last played ${relative(rediscover.lastPlayedAt, now)}. ${rediscover.rating ? `Your ${Number(rediscover.rating).toFixed(1)}/5 rating` : `${hours(rediscover.playtime)} invested`} says this is worth another session.`, action: 'Open game' },
    fresh && { game: fresh, label: 'Fresh start', reason: `Added ${added(fresh.addedAt)} and still unplayed. Its launch target is ready, so this is an easy first session from your own library.`, action: 'Explore' },
  ].filter(Boolean).filter((entry) => { if (seen.has(entry.game.id)) return false; seen.add(entry.game.id); return true; }).slice(0, 3);
}

export function getChronicle(games, news) {
  const entries = [];
  for (const game of games) {
    if (game.addedAt) entries.push({ game, at: Number(game.addedAt), type: 'Added to NEO-LIB', detail: `via ${PLATFORM[platformOf(game)] || 'Local'}` });
    if (game.lastPlayedAt) entries.push({ game, at: Number(game.lastPlayedAt), type: 'Played', detail: `${hours(game.playtime)} total` });
    if (game.ratedAt) entries.push({ game, at: Number(game.ratedAt), type: 'Rated', detail: `${game.rating || 0}/5 personal rating` });
  }
  for (const item of news.slice(0, 12)) {
    const game = games.find((entry) => entry.id === item.gameId || String(entry.name || '').toLowerCase() === String(item.gameName || '').toLowerCase());
    if (game && item.date) entries.push({ game, at: Number(item.date), type: 'New update', detail: item.title || 'Patch notes available' });
  }
  return entries.sort((a, b) => b.at - a.at).slice(0, 24);
}
