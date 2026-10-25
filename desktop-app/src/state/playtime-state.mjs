import { recordPlaytimeDays } from './playtime-days.mjs';
import { isEmulatorEntry } from '../lib/emulator-profile-model.mjs';

export function sessionResult(game, seconds, now = Date.now()) {
  if (!game || isEmulatorEntry(game)) return { patch: null, shouldPromptRating: false };
  const numericSeconds = Number.isFinite(Number(seconds)) ? Math.max(0, Number(seconds)) : 0;
  const patch = { playtime: (Number(game.playtime) || 0) + numericSeconds / 60, lastPlayedAt: now,
    playtimeDays: recordPlaytimeDays(game.playtimeDays, numericSeconds, now) };
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
    const reset = Number(patch.playtimeResetAt) > 0 || patch.playtimeManual === true;
    const observed = !reset && Object.keys(game.externalPlaytimeSessions || {}).length > 0;
    return {
      ...game,
      ...fields,
      ...(reset ? {playtimeResetAt: Number(patch.playtimeResetAt) || now, externalPlaytimeSessions: {}} : {}),
      playtime: Number.isFinite(Number(patch.playtime)) ? Math.max(0, Number(patch.playtime), observed ? Number(game.playtime) || 0 : 0) : game.playtime,
      lastPlayedAt: Number.isFinite(Number(patch.lastPlayedAt)) ? Math.max(Number(patch.lastPlayedAt), observed ? Number(game.lastPlayedAt) || 0 : 0) : game.lastPlayedAt,
      playtimeImportedAt: now,
    };
  });
}
