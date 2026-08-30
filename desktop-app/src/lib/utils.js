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
  { id: 'pro',           label: 'Industrial',     swatch: '#f0a31a', tone: 'special',
    gradient: 'linear-gradient(135deg, #101114 0%, #f0a31a 55%, #4a4d54 100%)' },
  { id: 'generic-gray',  label: 'Generic Gray',   swatch: '#b7bbc2', tone: 'middle',
    gradient: 'linear-gradient(135deg, #202226 0%, #b7bbc2 55%, #f4f5f6 100%)' },
  { id: 'generic-blue',  label: 'Generic Blue',   swatch: '#6ba5ff', tone: 'middle',
    gradient: 'linear-gradient(135deg, #101a33 0%, #315b9f 52%, #6ba5ff 100%)' },
  // Dark themes
  { id: 'synthwave',     label: 'Synthwave',      swatch: '#ff2a8a', tone: 'dark',
    gradient: 'linear-gradient(135deg, #0a0416 0%, #ff2a8a 55%, #00e5ff 100%)' },
  { id: 'anime',         label: 'Anime',          swatch: '#ff63b8', tone: 'dark',
    gradient: 'linear-gradient(135deg, #1d081d 0%, #ff63b8 50%, #b268ff 100%)' },
  { id: 'midnight',      label: 'Midnight',       swatch: '#ffe587', tone: 'dark',
    gradient: 'linear-gradient(135deg, #060916 0%, #16295b 52%, #ffe587 100%)' },
  { id: 'ocean',         label: 'Ocean',          swatch: '#4ea8f0', tone: 'dark',
    gradient: 'linear-gradient(135deg, #050c16 0%, #4ea8f0 55%, #78dcff 100%)' },
  { id: 'crimson',       label: 'Crimson',        swatch: '#dc263c', tone: 'dark',
    gradient: 'linear-gradient(135deg, #080405 0%, #dc263c 55%, #ff5a6e 100%)' },
  // Middle themes (somewhere between dark and bright)
  { id: 'gaming',        label: 'Gaming',         swatch: '#b889ff', tone: 'middle',
    gradient: 'linear-gradient(135deg, #141630 0%, #b889ff 55%, #72d6ff 100%)' },
  { id: 'modern',        label: 'Modern',         swatch: '#b83a45', tone: 'middle',
    gradient: 'linear-gradient(135deg, #121722 0%, #3c4658 55%, #b83a45 100%)' },
  { id: 'home',          label: 'Home',           swatch: '#7cc7f4', tone: 'middle',
    gradient: 'linear-gradient(135deg, #e7e9eb 0%, #d2e7f4 52%, #f2c65e 100%)' },
  // Bright themes
  { id: 'synthwave-day', label: 'Vaporwave Day',  swatch: '#8a4fff', tone: 'bright',
    gradient: 'linear-gradient(135deg, #f0e8ff 0%, #8a4fff 55%, #16b0b0 100%)' },
  { id: 'daybreak',      label: 'Daybreak',       swatch: '#e77555', tone: 'bright',
    gradient: 'linear-gradient(135deg, #fff6e7 0%, #ffc36c 52%, #8ccbf0 100%)' },
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
// Returns { id, label, color } for Steam / GOG / itch / Manual, or null for local/manual.
// v1.6.0 — Steam requires explicit `steamOwned: true` (set at import time from
// Steam's own account signals — sharedconfig + localconfig + installed manifests).
// This stops pirated repacks / manually-added games with a metadata `appid`
// from being tagged as Steam-owned.
export const playtimeSource = (g) => {
  if (!g) return null;
  // Manual override wins (user typed the number in the preview modal)
  if (g.playtimeManual) return { id: 'manual', label: 'MANUAL', color: '#ffcc4a' };
  const src = String(g.source || '').toLowerCase().replace(/-import$/, '');
  const web = String(g.website || '').toLowerCase();
  if (g.steamOwned === true)                    return { id: 'steam', label: 'STEAM',  color: '#1b8fe3' };
  if (src === 'gog'   || g.gogId)               return { id: 'gog',   label: 'GOG',    color: '#a8339a' };
  if (src === 'itch'  || /itch\.io/.test(web))  return { id: 'itch',  label: 'ITCH',   color: '#fa5c5c' };
  if (src === 'epic')     return { id: 'epic',  label: 'EPIC',  color: '#e5e5e5' };
  if (src === 'ea')       return { id: 'ea',    label: 'EA',    color: '#ff2b3d' };
  if (src === 'ubisoft')  return { id: 'ubi',   label: 'UBI',   color: '#1c8fe0' };
  if (src === 'battlenet') return { id: 'bnet', label: 'BNET',  color: '#00aeff' };
  if (src === 'riot')      return { id: 'riot', label: 'RIOT',  color: '#d13639' };
  if (src === 'xbox')      return { id: 'xbox', label: 'XBOX',  color: '#107c10' };
  if (src === 'rockstar')  return { id: 'rstar', label: 'R*',   color: '#f59f00' };
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
