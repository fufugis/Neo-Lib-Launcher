const selectedIds = (ids) => new Set(Array.isArray(ids) ? ids : []);

export function collectionFavoriteIds(currentIds = [], ids = [], favorite) {
  const picked = selectedIds(ids);
  if (!picked.size) return currentIds;
  return favorite ? [...new Set([...currentIds, ...picked])] : currentIds.filter((id) => !picked.has(id));
}

export function collectionJourneyStatus(games = [], ids = [], journeyStatus = '') {
  const picked = selectedIds(ids);
  if (!picked.size || !journeyStatus) return games;
  return games.map((game) => picked.has(game.id) ? { ...game, journeyStatus } : game);
}

export function collectionCategoryAssignment(games = [], ids = [], categoryId = '') {
  const picked = selectedIds(ids);
  if (!picked.size || !categoryId) return games;
  return games.map((game) => picked.has(game.id) ? { ...game, categoryIds: [...new Set([...(game.categoryIds || []), categoryId])] } : game);
}
