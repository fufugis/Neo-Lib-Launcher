import { RETRO_PLATFORMS, ROM_EXTENSION_GROUPS, quoteLaunchArgument } from './emulation-library-model.mjs';
import { localPlayDay, normalizePlaytimeDays } from '../state/playtime-days.mjs';

const CATALOG = [
  ['pcsx2', 'PCSX2', 'ps2'], ['duckstation', 'DuckStation', 'ps1'], ['ppsspp', 'PPSSPP', 'psp'],
  ['snes9x', 'Snes9x', 'snes'], ['desmume', 'DeSmuME', 'nds'], ['cemu', 'Cemu', 'wiiu'],
  ['citra', 'Citra', '3ds'], ['lime3ds', 'Lime3DS', '3ds'], ['flycast', 'Flycast', 'dreamcast'],
  ['ryujinx', 'Ryujinx', 'switch'], ['yuzu', 'Yuzu', 'switch'], ['mame', 'MAME', 'arcade'],
  ['dolphin', 'Dolphin', 'generic'], ['retroarch', 'RetroArch', 'generic'], ['mgba', 'mGBA', 'generic'],
];
export const emulatorPathKey = value => String(value || '').trim().replace(/\//g, '\\').replace(/\\+$/, '').toLowerCase();
export function emulatorIdentity(path) {
  const file = String(path || '').split(/[\\/]/).pop().replace(/\.exe$/i, '');
  const match = CATALOG.find(([key]) => new RegExp(`^${key}(?:$|[-_ .\\d]|windows|qt)`, 'i').test(file));
  const [emulatorId, name, platform] = match || ['', file.replace(/[-_]+/g, ' ').trim() || 'Emulator', 'generic'];
  return { emulatorId, name, platform, argumentPrefix: emulatorId === 'dolphin' ? '-b -e' : emulatorId === 'cemu' ? '-g' : '', description: emulatorId === 'retroarch' ? 'Multi-system emulator — choose the platform and configure your installed core in the launch arguments (for example -L "core.dll").' : emulatorId ? platform === 'generic' ? 'Multi-system emulator — choose the platform for this ROM folder.' : `${RETRO_PLATFORMS[platform].label} emulator.` : 'Unrecognized executable — name it and choose its ROM platform.', metadataSource: emulatorId ? 'Known executable filename; confirm the selection' : 'Executable filename; manual configuration' };
}
export function normalizeRetroProfiles(profiles) {
  const seen = new Set();
  return (Array.isArray(profiles) ? profiles : []).slice(0, 128).flatMap((profile, index) => {
    const id = String(profile?.id || `retro-${index + 1}`).replace(/[^a-z0-9-]/gi, '-').slice(0, 64);
    if (!id || seen.has(id)) return []; seen.add(id);
    const str = (key, max, fallback = '') => String(profile?.[key] || fallback).trim().slice(0, max);
    const icon = str('icon', 300000);
    return [{ id, name: str('name', 80, 'Emulator') || 'Emulator', platform: Object.hasOwn(ROM_EXTENSION_GROUPS, profile?.platform) ? profile.platform : 'generic',
      emulatorPath: str('emulatorPath', 1024), romFolder: str('romFolder', 1024), argumentPrefix: str('argumentPrefix', 240), workingDirectory: str('workingDirectory', 1024),
      trackingMethod: profile?.trackingMethod === 'manual' ? 'manual' : 'emulator-process', emulatorId: str('emulatorId', 64), description: str('description', 500), metadataSource: str('metadataSource', 160),
      icon: /^(?:data:image\/(?:png|jpeg|webp|gif);base64,|file:\/\/\/)/i.test(icon) ? icon : '' }];
  });
}
export function isRomGame(game) { return Boolean(game?.romPath) || game?.emulationKind === 'rom' || game?.source === 'emulation'; }
export function isEmulatorEntry(game, profiles = []) {
  return !isRomGame(game) && (game?.source === 'emulator-app' || game?.launcher === 'emulator' || profiles.some(profile => profile.emulatorPath && emulatorPathKey(profile.emulatorPath) === emulatorPathKey(game?.exePath)));
}
export function statisticsGames(games = [], excludeRoms = false, profiles = []) {
  return games.filter(game => game && !game.homeLocked && !isEmulatorEntry(game, profiles) && (!excludeRoms || !isRomGame(game)));
}
export function resolveRomLaunch(game, profiles) {
  if (!isRomGame(game)) return { game };
  const profile = normalizeRetroProfiles(profiles).find(item => item.id === game.emulatorProfileId);
  if (!profile?.emulatorPath || !game.romPath) return { error: 'Configure this ROM’s emulator in Retro setup before launching.' };
  if (profile.platform !== 'generic' && game.retroPlatform && profile.platform !== game.retroPlatform) return { error: 'This ROM’s console no longer matches its emulator profile. Correct the platform in Retro setup.' };
  let launchArgs = `${profile.argumentPrefix} ${quoteLaunchArgument(game.romPath)}`.trim();
  if (profile.emulatorId === 'mame') {
    const parts = game.romPath.split(/[\\/]/); const machine = parts.pop().replace(/\.(zip|7z)$/i, '');
    if (!/^[a-z0-9_]+$/i.test(machine)) return { error: 'MAME requires an original machine-shortname ROM archive, not a renamed game title.' };
    launchArgs = `${profile.argumentPrefix} -rompath ${quoteLaunchArgument(parts.join('/'))} ${quoteLaunchArgument(machine)}`.trim();
  }
  return { game: { ...game, exePath: profile.emulatorPath, launchArgs, workingDirectory: profile.workingDirectory, trackingMethod: profile.trackingMethod } };
}

export function recordedMinutesInPeriod(game, days, now = new Date()) {
  const start = new Date(now); start.setDate(start.getDate() - Math.max(0, Number(days) - 1));
  const first = localPlayDay(start), last = localPlayDay(now);
  return Object.entries(normalizePlaytimeDays(game?.playtimeDays)).reduce((total, [day, minutes]) => total + (day >= first && day <= last ? minutes : 0), 0);
}

export function gameLaunchContext(game, profiles = [], tools = [], toolsView = false) {
  const resolved = resolveRomLaunch(game, profiles);
  const toolLaunch = !isRomGame(game) && (toolsView || tools.some(tool => tool.id === game.id));
  return { ...resolved, toolLaunch, trackPlaytime: !toolLaunch && !isEmulatorEntry(game, profiles) && resolved.game?.trackingMethod !== 'manual' };
}
