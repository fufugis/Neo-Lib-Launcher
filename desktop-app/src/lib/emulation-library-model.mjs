// Pure emulation-library contracts. These functions never inspect a drive or
// launch anything; the native layer will scan only a player-selected folder.
export const RETRO_PLATFORMS = Object.freeze({
  atari2600: Object.freeze({ label: 'Atari 2600', shortLabel: 'Atari 2600', extensions: ['.a26'] }),
  c64: Object.freeze({ label: 'Commodore 64', shortLabel: 'C64', extensions: ['.d64', '.t64', '.prg', '.crt'] }),
  nes: Object.freeze({ label: 'Nintendo Entertainment System', shortLabel: 'NES', extensions: ['.nes', '.fds'] }),
  snes: Object.freeze({ label: 'Super Nintendo', shortLabel: 'SNES', extensions: ['.sfc', '.smc'] }),
  n64: Object.freeze({ label: 'Nintendo 64', shortLabel: 'N64', extensions: ['.z64', '.n64', '.v64'] }),
  gb: Object.freeze({ label: 'Game Boy', shortLabel: 'GB', extensions: ['.gb'] }),
  gbc: Object.freeze({ label: 'Game Boy Color', shortLabel: 'GBC', extensions: ['.gbc'] }),
  gba: Object.freeze({ label: 'Game Boy Advance', shortLabel: 'GBA', extensions: ['.gba'] }),
  nds: Object.freeze({ label: 'Nintendo DS', shortLabel: 'NDS', extensions: ['.nds'] }),
  '3ds': Object.freeze({ label: 'Nintendo 3DS', shortLabel: '3DS', extensions: ['.3ds', '.cia', '.cci'] }),
  gamecube: Object.freeze({ label: 'Nintendo GameCube', shortLabel: 'GameCube', extensions: ['.gcm', '.rvz', '.iso'] }),
  wii: Object.freeze({ label: 'Nintendo Wii', shortLabel: 'Wii', extensions: ['.wbfs', '.wia', '.rvz', '.iso'] }),
  wiiu: Object.freeze({ label: 'Nintendo Wii U', shortLabel: 'Wii U', extensions: ['.wua', '.wud', '.wux', '.rpx'] }),
  switch: Object.freeze({ label: 'Nintendo Switch', shortLabel: 'Switch', extensions: ['.nsp', '.xci'] }),
  genesis: Object.freeze({ label: 'Sega Genesis / Mega Drive', shortLabel: 'Genesis', extensions: ['.md', '.gen', '.bin'] }),
  dreamcast: Object.freeze({ label: 'Sega Dreamcast', shortLabel: 'Dreamcast', extensions: ['.gdi', '.cdi', '.chd'] }),
  ps1: Object.freeze({ label: 'PlayStation', shortLabel: 'PS1', extensions: ['.cue', '.chd', '.pbp', '.m3u'] }),
  ps2: Object.freeze({ label: 'PlayStation 2', shortLabel: 'PS2', extensions: ['.iso', '.chd', '.cso'] }),
  psp: Object.freeze({ label: 'PlayStation Portable', shortLabel: 'PSP', extensions: ['.iso', '.cso', '.pbp'] }),
  arcade: Object.freeze({ label: 'Arcade', shortLabel: 'Arcade', extensions: ['.zip', '.7z'] }),
});

export const ROM_EXTENSION_GROUPS = Object.freeze({
  ...Object.fromEntries(Object.entries(RETRO_PLATFORMS).map(([id, platform]) => [id, Object.freeze(platform.extensions)])),
  generic: Object.freeze([...new Set(Object.values(RETRO_PLATFORMS).flatMap((platform) => platform.extensions))]),
});

const text = (value, fallback = '') => String(value || '').trim() || fallback;
const safeId = (value) => text(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 56);

export function romExtensions(platform = 'generic') {
  return ROM_EXTENSION_GROUPS[safeId(platform)] || ROM_EXTENSION_GROUPS.generic;
}

export function retroPlatform(platform = 'generic') {
  const id = safeId(platform);
  const definition = RETRO_PLATFORMS[id];
  return definition ? { id, ...definition } : { id: 'generic', label: 'Retro game', shortLabel: 'Retro', extensions: ROM_EXTENSION_GROUPS.generic };
}

export function detectRomPlatform(romPath = '', preferred = 'generic') {
  const selected = safeId(preferred);
  if (RETRO_PLATFORMS[selected]) return selected;
  const extension = `.${text(romPath).split('.').pop().toLowerCase()}`;
  const matches = Object.entries(RETRO_PLATFORMS).filter(([, platform]) => platform.extensions.includes(extension));
  return matches.length === 1 ? matches[0][0] : 'generic';
}

export function emulatorCategory(profile = {}) {
  const platform = retroPlatform(profile.platform);
  return Object.freeze({
    id: `retro-${platform.id}`,
    name: text(profile.categoryName, platform.label),
    color: '#7c5cff',
    emulation: true,
    platform: platform.id,
  });
}

export function quoteLaunchArgument(value) {
  const input = text(value);
  if (!input) return '';
  return `"${input.replace(/"/g, '\\"')}"`;
}

export function romDisplayName(romPath = '') {
  return text(romPath).split(/[\\/]/).pop().replace(/\.[^.]+$/, '').replace(/[._]+/g, ' ').replace(/\s+/g, ' ').trim() || 'Untitled ROM';
}

export function romLibraryEntry({ profile, romPath, sizeBytes = 0, now = Date.now() } = {}) {
  const category = emulatorCategory(profile);
  const path = text(romPath);
  if (!profile?.emulatorPath || !path) return null;
  const platform = detectRomPlatform(path, profile.platform);
  const platformInfo = retroPlatform(platform);
  const name = romDisplayName(path);
  return Object.freeze({
    name,
    exePath: profile.emulatorPath,
    launchArgs: `${text(profile.argumentPrefix)} ${quoteLaunchArgument(path)}`.trim(),
    workingDirectory: text(profile.workingDirectory),
    launcher: 'emulator',
    source: 'emulation',
    emulatorProfileId: text(profile.id),
    emulatorProfileName: text(profile.name, 'Emulator'),
    retroPlatform: platform,
    platform: platformInfo.label,
    metadataQuery: `${name} ${platformInfo.shortLabel}`,
    romPath: path,
    romSizeBytes: Math.max(0, Number(sizeBytes) || 0),
    installSizeBytes: Math.max(0, Number(sizeBytes) || 0),
    categoryIds: [category.id],
    capabilities: [{ id: 'controller-partial', label: 'Controller support depends on emulator', source: 'Player', detail: 'Configured emulator profile' }],
    addedAt: Number(now) || Date.now(),
  });
}
