export function lockedCategoryIds(categories = [], unlockedIds = []) {
  const unlocked = new Set(unlockedIds);
  return new Set(categories.filter((category) => category.private && !unlocked.has(category.id)).map((category) => category.id));
}

export function gameLockedCategoryMap(games = [], categories = [], unlockedIds = []) {
  const locked = categories.filter((category) => category.private && !new Set(unlockedIds).has(category.id));
  const byId = new Map(locked.map((category) => [category.id, category]));
  return Object.fromEntries(games.flatMap((game) => {
    const category = (game.categoryIds || []).map((id) => byId.get(id)).find(Boolean);
    return category ? [[game.id, category.name || 'Private category']] : [];
  }));
}

export function redactLockedHomeGames(games = [], categories = [], unlockedIds = []) {
  const lockedByGame = gameLockedCategoryMap(games, categories, unlockedIds);
  return games.map((game) => {
    const categoryName = lockedByGame[game.id];
    if (!categoryName) return game;
    return {
      id: game.id, name: 'Locked game', launcher: 'private', homeLocked: true,
      homeLockedCategory: categoryName, playtime: game.playtime, lastPlayed: game.lastPlayed,
      lastPlayedAt: game.lastPlayedAt, addedAt: game.addedAt, rating: game.rating,
      myRating: game.myRating, ratedAt: game.ratedAt,
    };
  });
}

export function visibleUnlockedGames(games = [], categories = [], unlockedIds = []) {
  const locked = lockedCategoryIds(categories, unlockedIds);
  return games.filter((game) => !(game.categoryIds || []).some((id) => locked.has(id)));
}

export function panicLockResult(games = [], categories = [], random = Math.random) {
  const privateIds = new Set(categories.filter((category) => category.private).map((category) => category.id));
  const safe = games.filter((game) => !(game.categoryIds || []).some((id) => privateIds.has(id)));
  const index = safe.length ? Math.min(safe.length - 1, Math.floor(Math.max(0, random()) * safe.length)) : -1;
  return { unlockedCategories: [], selectedGameId: index >= 0 ? safe[index].id : null, hasPrivate: privateIds.size > 0 };
}

export function privacyAuditPayload(game) {
  if (!game?.homeLocked) return game;
  return {
    id: game.id, name: 'Locked game', launcher: 'private', homeLocked: true,
    homeLockedCategory: game.homeLockedCategory, playtime: game.playtime,
    lastPlayed: game.lastPlayed, lastPlayedAt: game.lastPlayedAt, addedAt: game.addedAt,
    rating: game.rating, myRating: game.myRating, ratedAt: game.ratedAt,
  };
}
