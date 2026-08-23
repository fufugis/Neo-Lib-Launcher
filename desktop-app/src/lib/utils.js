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
  // Special themes — extra eye-candy (sparkles, shooting stars, textured surfaces)
  { id: 'colorful',      label: 'Colorful',       swatch: '#ff5abe', tone: 'special',
    gradient: 'linear-gradient(135deg, #0c0a16 0%, #ff5abe 45%, #5aa0ff 100%)' },
  { id: 'pro',           label: 'Pro',            swatch: '#ff7620', tone: 'special',
    gradient: 'linear-gradient(135deg, #16161a 0%, #ff7620 55%, #3c8cd2 100%)' },
  // Dark themes
  { id: 'synthwave',     label: 'Synthwave',      swatch: '#ff2a8a', tone: 'dark',
    gradient: 'linear-gradient(135deg, #0a0416 0%, #ff2a8a 55%, #00e5ff 100%)' },
  { id: 'anime',         label: 'Anime',          swatch: '#9e4ceb', tone: 'dark',
    gradient: 'linear-gradient(135deg, #10081c 0%, #9e4ceb 50%, #38c8ff 100%)' },
  { id: 'midnight',      label: 'Midnight',       swatch: '#c4a56e', tone: 'dark',
    gradient: 'linear-gradient(135deg, #0a0a0c 0%, #c4a56e 100%)' },
  { id: 'ocean',         label: 'Ocean',          swatch: '#4ea8f0', tone: 'dark',
    gradient: 'linear-gradient(135deg, #050c16 0%, #4ea8f0 55%, #78dcff 100%)' },
  { id: 'crimson',       label: 'Crimson',        swatch: '#dc263c', tone: 'dark',
    gradient: 'linear-gradient(135deg, #080405 0%, #dc263c 55%, #ff5a6e 100%)' },
  // Middle themes (somewhere between dark and bright)
  { id: 'gaming',        label: 'Gaming',         swatch: '#9b64ff', tone: 'middle',
    gradient: 'linear-gradient(135deg, #141630 0%, #9b64ff 55%, #5ac8ff 100%)' },
  { id: 'modern',        label: 'Modern',         swatch: '#e07a3c', tone: 'middle',
    gradient: 'linear-gradient(135deg, #221c18 0%, #e07a3c 55%, #87c8f0 100%)' },
  // Bright themes
  { id: 'synthwave-day', label: 'Vaporwave Day',  swatch: '#8a4fff', tone: 'bright',
    gradient: 'linear-gradient(135deg, #f0e8ff 0%, #8a4fff 55%, #16b0b0 100%)' },
  { id: 'daybreak',      label: 'Daybreak',       swatch: '#149c9e', tone: 'bright',
    gradient: 'linear-gradient(135deg, #f8f6f2 0%, #149c9e 60%, #1e1e24 100%)' },
  { id: 'mint',          label: 'Mint Garden',    swatch: '#34c98a', tone: 'bright',
    gradient: 'linear-gradient(135deg, #f4fcf6 0%, #34c98a 55%, #128ec8 100%)' },
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

// v1.4.0 — `playtime` field is now consistently stored in MINUTES across the
// entire app (Steam import already returns minutes, demo data is minutes,
// StatsPanel already reads minutes). Prior versions had `formatPlaytime()`
// interpreting the value as seconds and the game-exit handler in App.jsx adding
// raw seconds — that produced wildly inflated numbers. Standardized here.
export const formatPlaytime = (min) => {
  const m = Math.max(0, Math.round(Number(min) || 0));
  if (m < 1)  return '—';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem ? `${h}h ${rem}m` : `${h}h`;
};

// v1.5.0 — where did this game's playtime come from?
// Returns { id, label, color } for Steam / GOG / itch, or null for local/manual.
// Used to render a small chip beside playtime so users can trace inflated
// numbers back to imports vs local session tracking.
export const playtimeSource = (g) => {
  if (!g) return null;
  const src = String(g.source || '').toLowerCase();
  const web = String(g.website || '').toLowerCase();
  if (src === 'steam' || (g.appid && !src)) return { id: 'steam', label: 'STEAM',  color: '#1b8fe3' };
  if (src === 'gog'   || g.gogId)           return { id: 'gog',   label: 'GOG',    color: '#a8339a' };
  if (src === 'itch'  || /itch\.io/.test(web)) return { id: 'itch', label: 'ITCH', color: '#fa5c5c' };
  if (src === 'epic')     return { id: 'epic',  label: 'EPIC',  color: '#e5e5e5' };
  if (src === 'ea')       return { id: 'ea',    label: 'EA',    color: '#ff2b3d' };
  if (src === 'ubisoft')  return { id: 'ubi',   label: 'UBI',   color: '#1c8fe0' };
  return null;
};

// Relative-time formatter: "just now", "5m ago", "3 days ago", "2 weeks ago", "Jan 12, 2024"
export const formatRelative = (ts) => {
  if (!ts) return '—';
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 30) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return d === 1 ? 'yesterday' : `${d} days ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return w === 1 ? 'last week' : `${w} weeks ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return mo === 1 ? 'last month' : `${mo} months ago`;
  const y = Math.floor(d / 365);
  return y === 1 ? 'a year ago' : `${y} years ago`;
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
