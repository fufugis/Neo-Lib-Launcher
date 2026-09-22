export const WALL_FILTERS = Object.freeze([
  { id: 'all', label: 'All' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'most-played', label: 'Most played' },
  { id: 'recently-played', label: 'Recently played' },
]);

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
      .filter((game) => Number(game?.lastPlayedAt || game?.lastPlayed || 0) > 0)
      .sort((left, right) => Number(right?.lastPlayedAt || right?.lastPlayed || 0) - Number(left?.lastPlayedAt || left?.lastPlayed || 0));
  }
  return list;
}
