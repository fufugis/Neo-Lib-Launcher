// Pure emulation-library contracts. These functions never inspect a drive or
// launch anything; the native layer will scan only a player-selected folder.
export const ROM_EXTENSION_GROUPS = Object.freeze({
  nes: Object.freeze(['.nes', '.fds']),
  snes: Object.freeze(['.sfc', '.smc']),
  n64: Object.freeze(['.z64', '.n64', '.v64']),
  gameboy: Object.freeze(['.gb', '.gbc', '.gba']),
  genesis: Object.freeze(['.md', '.gen', '.bin']),
  playstation: Object.freeze(['.cue', '.chd', '.pbp', '.iso']),
  psp: Object.freeze(['.iso', '.cso', '.pbp']),
  arcade: Object.freeze(['.zip', '.7z']),
  generic: Object.freeze(['.nes', '.fds', '.sfc', '.smc', '.z64', '.n64', '.v64', '.gb', '.gbc', '.gba', '.md', '.gen', '.cue', '.chd', '.iso', '.cso', '.pbp', '.zip', '.7z']),
});

const text = (value, fallback = '') => String(value || '').trim() || fallback;
const safeId = (value) => text(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 56);

export function romExtensions(platform = 'generic') {
  return ROM_EXTENSION_GROUPS[safeId(platform)] || ROM_EXTENSION_GROUPS.generic;
}

export function emulatorCategory(profile = {}) {
  const id = safeId(profile.id || profile.name);
  return Object.freeze({
    id: `emulator-${id || 'library'}`,
    name: text(profile.categoryName, text(profile.name, 'Emulation Library')),
    color: '#7c5cff',
    emulation: true,
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
  return Object.freeze({
    name: romDisplayName(path),
    exePath: profile.emulatorPath,
    launchArgs: `${text(profile.argumentPrefix)} ${quoteLaunchArgument(path)}`.trim(),
    launcher: 'emulator',
    source: 'emulation',
    emulatorProfileId: text(profile.id),
    romPath: path,
    romSizeBytes: Math.max(0, Number(sizeBytes) || 0),
    categoryIds: [category.id],
    capabilities: [{ id: 'controller-partial', label: 'Controller support depends on emulator', source: 'Player', detail: 'Configured emulator profile' }],
    addedAt: Number(now) || Date.now(),
  });
}
