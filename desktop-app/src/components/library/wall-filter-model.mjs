export const WALL_FILTERS = Object.freeze([
  { id: 'all', label: 'All' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'most-played', label: 'Most played' },
  { id: 'recently-played', label: 'Recently played' },
]);

function playedTimestamp(game) {
  const timestamp = value => {
    if (value == null || value === '') return 0;
    const parsed = typeof value === 'number' || /^\d+$/.test(String(value)) ? Number(value) : Date.parse(String(value));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  };
  return timestamp(game?.lastPlayedAt) || timestamp(game?.lastPlayed);
}

export function applyWallFilter(games = [], filter = 'all', favoriteIds = []) {
  const list = Array.isArray(games) ? [...games] : [];
  if (filter === 'favorites') {
    const favorites = new Set(Array.isArray(favoriteIds) ? favoriteIds : []);
    return list.filter((game) => favorites.has(game?.id));
  }
  if (filter === 'most-played') {
    return list
      .filter((game) => Number(game?.playtime || 0) > 0)
      .sort((left, right) => Number(right?.playtime || 0) - Number(left?.playtime || 0));
  }
  if (filter === 'recently-played') {
    return list
      .filter((game) => playedTimestamp(game) > 0)
      .sort((left, right) => playedTimestamp(right) - playedTimestamp(left));
  }
  return list;
}
