export function sessionResult(game, seconds, now = Date.now()) {
  if (!game) return { patch: null, shouldPromptRating: false };
  const numericSeconds = Math.max(0, Number(seconds) || 0);
  const patch = { playtime: (Number(game.playtime) || 0) + numericSeconds / 60, lastPlayedAt: now };
  const shouldPromptRating = numericSeconds >= 15 * 60
    && !Number(game.rating) && !game.ratingPromptDismissed
    && Number(game.ratingPromptSnoozedUntil || 0) <= now;
  return { patch, shouldPromptRating };
}

export function applyPlaytimeImport(games = [], patches = [], now = Date.now()) {
  const byId = new Map(patches.filter((patch) => patch?.id).map((patch) => [patch.id, patch]));
  return games.map((game) => {
    const patch = byId.get(game.id);
    if (!patch) return game;
    const { id: _id, ...fields } = patch;
    return {
      ...game,
      ...fields,
      playtime: Number.isFinite(Number(patch.playtime)) ? Math.max(0, Number(patch.playtime)) : game.playtime,
      lastPlayedAt: Number.isFinite(Number(patch.lastPlayedAt)) ? Number(patch.lastPlayedAt) : game.lastPlayedAt,
      playtimeImportedAt: now,
    };
  });
}
