import { RETRO_PLATFORMS } from '../../lib/emulation-library-model.mjs';

export const LOUNGE_CONSOLES = Object.freeze(Object.entries(RETRO_PLATFORMS).map(([id, platform]) => Object.freeze({ id, label: platform.label, shortLabel: platform.shortLabel })));

export function emulatorZoneGames(games, consoleId) {
  return (Array.isArray(games) ? games : []).filter(game => game?.source === 'emulation' && game.retroPlatform === consoleId);
}

export function emulatorZoneStatus(profiles, games, consoleId) {
  const profile = (Array.isArray(profiles) ? profiles : []).find(item => item?.platform === consoleId && item.emulatorPath && item.romFolder);
  const count = emulatorZoneGames(games, consoleId).length;
  return { configured: Boolean(profile), count, profileName: profile?.name || '' };
}

export function nextLoungeConsole(currentId, direction, consoles = LOUNGE_CONSOLES) {
  if (!consoles.length) return '';
  const index = consoles.findIndex(console => console.id === currentId);
  return consoles[(Math.max(0, index) + (direction < 0 ? -1 : 1) + consoles.length) % consoles.length].id;
}
