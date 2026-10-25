export const DEFAULT_HOME_TITLE = Object.freeze({ size: 11, weight: 900, color: 'theme', contrast: 0, uppercase: false });
const number = (value, fallback, min, max) => value != null && Number.isFinite(Number(value)) ? Math.max(min, Math.min(max, Math.round(Number(value)))) : fallback;
export function normalizeHomeTitle(raw = {}) {
  raw = raw || {};
  return { size: number(raw.size, 11, 11, 26), weight: [600, 700, 900].includes(Number(raw.weight)) ? Number(raw.weight) : 900,
    color: ['theme', 'bright', 'accent'].includes(raw.color) ? raw.color : 'theme',
    contrast: number(raw.contrast, 0, 0, 90), uppercase: raw.uppercase === true };
}
export function homeTitleTweaks(layout = {}, id) {
  return normalizeHomeTitle({ ...layout.titleTweaks, ...(id ? layout.widgetTitleTweaks?.[id] : {}) });
}
export function homeTitlePatch(layout, id, field, value) {
  if (!Object.hasOwn(DEFAULT_HOME_TITLE, field)) return {};
  const normalized = normalizeHomeTitle({ [field]: value })[field];
  return id ? { widgetTitleTweaks: { ...layout.widgetTitleTweaks, [id]: { ...layout.widgetTitleTweaks?.[id], [field]: normalized } } }
    : { titleTweaks: { ...layout.titleTweaks, [field]: normalized } };
}
export function homeTitleStyles(tweaks) {
  const value = normalizeHomeTitle(tweaks);
  return { bar: { minHeight: Math.max(32, Math.ceil(value.size * 1.25 + 12)), boxShadow: value.contrast ? `inset 0 0 0 200px rgb(0 0 0 / ${value.contrast / 100})` : undefined },
    text: { fontSize: value.size, lineHeight: 1.25, fontWeight: value.weight, color: { theme: 'rgb(var(--ink))', bright: '#ffffff', accent: 'rgb(var(--accent-2))' }[value.color], textTransform: value.uppercase ? 'uppercase' : 'none' },
    iconSize: Math.max(18, value.size + 4) };
}
