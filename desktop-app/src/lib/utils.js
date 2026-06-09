// Tiny utility helpers shared by components
export const cn = (...a) => a.filter(Boolean).join(' ');

export const guessNameFromPath = (filePath) => {
  if (!filePath) return '';
  const parts = filePath.replace(/\\/g, '/').split('/').filter(Boolean);
  const exe = parts[parts.length - 1] || '';
  const folder = parts[parts.length - 2] || '';
  const base = (folder || exe).replace(/\.exe$/i, '');
  return base
    .replace(/[_\-]+/g, ' ')
    .replace(/\b(v?\d+(\.\d+)+|\d{4})\b/g, ' ')
    .replace(/\b(launcher|client|win64|win32|x64|x86|game|setup)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export const THEMES = [
  { id: 'synthwave', label: 'Synthwave', swatch: '#ff2a8a' },
  { id: 'midnight',  label: 'Midnight',  swatch: '#c4a56e' },
  { id: 'daybreak',  label: 'Daybreak',  swatch: '#1c1c20' },
  { id: 'ocean',     label: 'Ocean',     swatch: '#4ea8f0' },
  { id: 'crimson',   label: 'Crimson',   swatch: '#dc263c' },
];

export const CATEGORY_COLORS = [
  { id: 'magenta', label: 'Magenta', hex: '#ff2a8a' },
  { id: 'cyan',    label: 'Cyan',    hex: '#00e5ff' },
  { id: 'orange',  label: 'Orange',  hex: '#ff7a18' },
  { id: 'amber',   label: 'Amber',   hex: '#ffc857' },
  { id: 'lime',    label: 'Lime',    hex: '#a8ff60' },
  { id: 'mint',    label: 'Mint',    hex: '#5af2c4' },
  { id: 'violet',  label: 'Violet',  hex: '#b061ff' },
  { id: 'crimson', label: 'Crimson', hex: '#ff3654' },
  { id: 'slate',   label: 'Slate',   hex: '#7a869a' },
];
export const colorFromId = (id) =>
  CATEGORY_COLORS.find((c) => c.id === id)?.hex || '#ff2a8a';

// Local-only PIN obfuscation (not cryptographic — file is on disk anyway).
export const hashPin = (pin) => {
  const s = `neo-lib:${pin}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return String(h);
};

// Library appearance sizes
export const SIZES = [
  { id: 'small',  label: 'Small',  rowH: 26, icon: 16, font: 12 },
  { id: 'medium', label: 'Medium', rowH: 44, icon: 32, font: 13 },
  { id: 'big',    label: 'Big',    rowH: 64, icon: 52, font: 14 },
];
export const sizeById = (id) => SIZES.find((s) => s.id === id) || SIZES[1];

// Showcase sort modes
export const SHOWCASE_MODES = [
  { id: 'recent_added',  label: 'Recently added' },
  { id: 'recent_played', label: 'Recently played' },
  { id: 'most_played',   label: 'Most played' },
  { id: 'untouched',     label: 'Untouched gems' },
  { id: 'random',        label: 'Random pick' },
];

export const formatPlaytime = (sec) => {
  if (!sec || sec < 60) return `${sec || 0}s`;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

export const sortGamesForShowcase = (games, mode) => {
  const list = [...games];
  switch (mode) {
    case 'recent_added':
      return list.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
    case 'recent_played':
      return list.sort((a, b) => (b.lastPlayedAt || 0) - (a.lastPlayedAt || 0));
    case 'most_played':
      return list.sort((a, b) => (b.playtime || 0) - (a.playtime || 0));
    case 'untouched':
      return list.filter((g) => !g.playtime).sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
    case 'random':
      return list.sort(() => Math.random() - 0.5);
    default:
      return list;
  }
};
