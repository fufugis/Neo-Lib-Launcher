// Created only after the player manually sends a mascot chat message. Paths,
// saves, accounts and locked games must be filtered before this boundary.
export function mascotLibraryContext(games = []) {
  const visibleGames = Array.isArray(games) ? games : [];
  const entries = visibleGames.slice(0, 420).map((game) => {
    const profileTags = Array.isArray(game.genreProfile?.tags) ? game.genreProfile.tags.map((tag) => typeof tag === 'string' ? tag : (tag?.label || tag?.name || '')).filter(Boolean) : [];
    const tags = [...new Set([...(game.genres || []), ...(game.genreTags || []), ...profileTags])].slice(0, 10);
    const rating = Number(game.myRating ?? game.rating ?? 0);
    const hours = Number(game.playtimeMinutes || game.playtime || 0);
    return `${game.name || 'Untitled'}${game.source || game.launcher ? ` [${game.source || game.launcher}]` : ''}${tags.length ? ` — ${tags.join(', ')}` : ''}${rating ? ` — my rating ${rating.toFixed(1)}/5` : ''}${hours ? ` — ${Math.round(hours / 60)}h played` : ''}`;
  });
  const suffix = visibleGames.length > entries.length ? `\n…plus ${visibleGames.length - entries.length} more visible games.` : '';
  return `Visible NEO-LIB games (${visibleGames.length}):\n${entries.join('\n')}${suffix}`.slice(0, 24_000);
}
