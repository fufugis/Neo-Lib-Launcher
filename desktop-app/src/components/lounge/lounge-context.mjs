import { formatPlaytime } from '../../lib/utils.js';
import { journeyStatusDefinition } from '../../lib/game-journey-model.mjs';

function playedDate(value) {
  if (!value) return null;
  const date = new Date(typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value);
  return Number.isFinite(date.getTime()) ? date : null;
}

export function loungeSessionContext(game, updateLedger = {}) {
  if (!game?.id) return null;
  const minutes = Number(game.playtime);
  const lastPlayed = playedDate(game.lastPlayedAt || game.lastPlayed);
  const updateFlagged = updateLedger?.[game.id]?.status === 'available';
  return {
    playtime: Number.isFinite(minutes) && minutes > 0 ? formatPlaytime(minutes) : 'Not tracked yet',
    lastPlayed: lastPlayed ? new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).format(lastPlayed) : 'Not tracked yet',
    journey: journeyStatusDefinition(game.journeyStatus).label,
    updateFlagged,
    updateNote: updateFlagged ? 'NEO-LIB flagged a possible update. Confirm it in the game Preview before taking action.' : '',
  };
}

// Static, local guidance only: no auto-voice, network call or private game names.
export function loungeGuide(view, context) {
  if (context?.updateFlagged) return 'A possible update was flagged. Check its history in Library before updating.';
  if (view === 'continue') return 'Pick up a game you have played or marked In progress. Open details without leaving Lounge.';
  if (view === 'recent') return 'Your latest tracked sessions are here. Open game details without leaving Lounge.';
  if (view === 'most') return 'Games with tracked playtime lead this view. Open details without leaving Lounge.';
  if (view === 'favorites') return 'Your favorites are close at hand. Add or remove favorites in the normal Library.';
  return 'Browse at your pace. Open game details or launch without leaving Lounge.';
}
