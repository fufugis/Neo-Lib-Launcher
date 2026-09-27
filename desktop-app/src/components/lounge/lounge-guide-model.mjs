import { formatPlaytime } from '../../lib/utils.js';

function timestamp(raw) {
  const date = typeof raw === 'number' || /^\d+$/.test(String(raw || '')) ? new Date(Number(raw)) : new Date(raw);
  const time = date.getTime();
  return Number.isFinite(time) && time > 0 ? time : 0;
}
function lastPlayedAt(game) { return timestamp(game?.lastPlayedAt || game?.lastPlayed); }

export function continueLoungeGames(games = []) {
  const visible = Array.isArray(games) ? games.filter(game => game?.id != null) : [];
  const resumable = visible.filter(game => lastPlayedAt(game) > 0
    && !['finished', 'mastered', 'dropped', 'on-hold'].includes(game.journeyStatus))
    .sort((a, b) => lastPlayedAt(b) - lastPlayedAt(a));
  const seen = new Set(resumable.map(game => game.id));
  return [...resumable, ...visible.filter(game => game.journeyStatus === 'in-progress' && !seen.has(game.id))];
}

export function recentlyAddedLoungeGames(games = [], now = Date.now()) {
  return (Array.isArray(games) ? games : []).filter(game => game?.id != null
    && timestamp(game.addedAt) > 0 && timestamp(game.addedAt) <= Number(now))
    .sort((a, b) => timestamp(b.addedAt) - timestamp(a.addedAt));
}

export function recentlyActiveLoungeGames(games = [], now = Date.now()) {
  const current = Number(now);
  const start = current - 7 * 24 * 60 * 60 * 1000;
  return (Array.isArray(games) ? games : []).filter(game => game?.id != null
    && lastPlayedAt(game) >= start && lastPlayedAt(game) <= current)
    .sort((a, b) => lastPlayedAt(b) - lastPlayedAt(a));
}

export function inProgressLoungeGames(games = []) {
  return (Array.isArray(games) ? games : []).filter(game => game?.id != null && game.journeyStatus === 'in-progress')
    .sort((a, b) => lastPlayedAt(b) - lastPlayedAt(a) || String(a.name || '').localeCompare(String(b.name || '')));
}

export function sortLoungeBrowseGames(games = [], order = 'library', now = Date.now()) {
  const visible = Array.isArray(games) ? games : [];
  const validDate = value => value > 0 && value <= Number(now) ? value : 0;
  if (order === 'name') return [...visible].sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), undefined, { numeric: true }));
  if (order === 'last-played') return [...visible].sort((a, b) => validDate(lastPlayedAt(b)) - validDate(lastPlayedAt(a)));
  if (order === 'recently-added') return [...visible].sort((a, b) => validDate(timestamp(b.addedAt)) - validDate(timestamp(a.addedAt)));
  return visible;
}

export function loungeGuideSnapshot(games = [], now = Date.now(), favoriteIds = []) {
  const visible = Array.isArray(games) ? games.filter(game => game?.id != null) : [];
  const played = visible.filter(game => lastPlayedAt(game) > 0).sort((a, b) => lastPlayedAt(b) - lastPlayedAt(a));
  const inProgress = inProgressLoungeGames(visible);
  const continueGames = continueLoungeGames(visible).slice(0, 4);
  const continuingIds = new Set(continueGames.map(game => game.id));
  const favorites = new Set((Array.isArray(favoriteIds) ? favoriteIds : []).map(String));
  const sortPicks = (a, b) => Number(favorites.has(String(b.id))) - Number(favorites.has(String(a.id)))
    || timestamp(b.addedAt) - timestamp(a.addedAt)
    || String(a.name || '').localeCompare(String(b.name || ''));
  const backlog = visible.filter(game => game.journeyStatus === 'backlog' && !continuingIds.has(game.id)).sort(sortPicks);
  const unplayed = visible.filter(game => game.journeyStatus !== 'backlog' && !continuingIds.has(game.id)
    && (!game.journeyStatus || game.journeyStatus === 'not-started')
    && !(Number(game.playtime) > 0) && !lastPlayedAt(game)).sort(sortPicks);
  const nextUpGames = [...backlog, ...unplayed].slice(0, 5);
  const featuredKind = continueGames.length ? 'continue' : nextUpGames.length ? 'next-up' : visible.length ? 'library' : 'empty';
  const featuredGame = continueGames[0] || nextUpGames[0] || [...visible].sort(sortPicks)[0] || null;
  const nextUpShelfGames = featuredKind === 'next-up' ? nextUpGames.slice(1) : nextUpGames;
  const recentlyAddedGames = recentlyAddedLoungeGames(visible, now).slice(0, 14);
  const trackedMinutes = visible.reduce((total, game) => {
    const minutes = Number(game.playtime);
    return total + (Number.isFinite(minutes) && minutes > 0 ? minutes : 0);
  }, 0);
  return {
    continueGames,
    nextUpGames,
    nextUpShelfGames,
    recentlyAddedGames,
    featuredGame,
    featuredKind,
    recentlyActiveCount: recentlyActiveLoungeGames(visible, now).length,
    inProgressCount: inProgress.length,
    trackedTime: trackedMinutes > 0 ? formatPlaytime(trackedMinutes) : 'Not tracked yet',
    latestPlayedAt: played.length ? lastPlayedAt(played[0]) : 0,
  };
}
