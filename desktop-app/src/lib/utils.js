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

// Preset palette for user categories
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

// Lightweight, deterministic hash for PIN storage (NOT cryptographic — just obfuscation
// since the file is local; full secrecy isn't possible without a master password).
export const hashPin = (pin) => {
  const s = `neo-lib:${pin}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return String(h);
};
