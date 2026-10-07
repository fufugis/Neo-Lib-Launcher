import { RETRO_PLATFORMS } from '../../lib/emulation-library-model.mjs';

export const LOUNGE_CONSOLES = Object.freeze(Object.entries(RETRO_PLATFORMS).map(([id, platform]) => Object.freeze({ id, label: platform.label, shortLabel: platform.shortLabel })));

export function normalizeHiddenLoungeConsoles(value) {
  const requested = new Set(Array.isArray(value) ? value : []);
  return LOUNGE_CONSOLES.filter(console => requested.has(console.id)).map(console => console.id);
}

export function shownLoungeConsoles(hidden) {
  const excluded = new Set(normalizeHiddenLoungeConsoles(hidden));
  return LOUNGE_CONSOLES.filter(console => !excluded.has(console.id));
}

export function reconcileLoungeConsole(currentId, consoles) {
  return consoles.some(console => console.id === currentId) ? currentId : consoles[0]?.id || '';
}

export function emulatorZoneGames(games, consoleId) {
  return (Array.isArray(games) ? games : []).filter(game => game?.source === 'emulation' && game.retroPlatform === consoleId);
}

export function emulatorZoneStatus(profiles, games, consoleId) {
  const profile = (Array.isArray(profiles) ? profiles : []).find(item => item?.platform === consoleId && item.emulatorPath && item.romFolder);
  const emulatorConfigured = (Array.isArray(profiles) ? profiles : []).some(item => item?.platform === consoleId && Boolean(item.emulatorPath));
  const count = emulatorZoneGames(games, consoleId).length;
  return { configured: Boolean(profile), emulatorConfigured, count, profileName: profile?.name || '' };
}

export function nextLoungeConsole(currentId, direction, consoles = LOUNGE_CONSOLES) {
  if (!consoles.length) return '';
  const index = consoles.findIndex(console => console.id === currentId);
  return consoles[(Math.max(0, index) + (direction < 0 ? -1 : 1) + consoles.length) % consoles.length].id;
}

/** Odd-sized circular window keeps the active system at its center. */
export function loungeConsoleVisibleCount(width = 1600, size = 100) {
  const capacity = Math.floor(Math.max(0, width - 400) / (220 * size / 100));
  return Math.max(3, Math.min(9, capacity % 2 ? capacity : capacity - 1));
}

export function visibleLoungeConsoles(currentId, consoles = LOUNGE_CONSOLES, visibleCount = 5) {
  if (!consoles.length) return [];
  const center = Math.max(0, consoles.findIndex(console => console.id === currentId));
  const count = Math.min(visibleCount, consoles.length);
  return Array.from({ length: count }, (_, index) => index - Math.floor(count / 2)).map(offset => ({
    ...consoles[(center + offset + consoles.length) % consoles.length],
    offset,
  }));
}
