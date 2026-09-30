const PRESERVED_HOME_FIELDS = Object.freeze([
  'playtime', 'playtimeImportedAt', 'playtimeSource', 'lastPlayed', 'lastPlayedAt', 'addedAt',
  'rating', 'myRating', 'ratedAt', 'ratingPromptDismissed', 'ratingPromptSnoozedUntil',
  'journeyStatus', 'journeyStartedAt', 'journeyCompletedAt', 'homeLockedCategory',
]);

export function clearLibraryGamesPreservingHome(library = {}) {
  const archive = { ...(library.homeGameDataArchive || {}) };
  for (const game of library.games || []) {
    if (!game?.id) continue;
    const homeData = { id: game.id };
    for (const key of PRESERVED_HOME_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(game, key)) homeData[key] = game[key];
    }
    archive[game.id] = homeData;
  }
  return {
    ...library,
    games: [],
    gameOrderByCategory: {},
    homeGameDataArchive: archive,
  };
}
