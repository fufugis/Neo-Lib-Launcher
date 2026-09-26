import { validateThemeManifest } from './theme-manifest.mjs';

const modules = import.meta.glob('./stock/*/theme.json', { eager: true, import: 'default' });
const assets = import.meta.glob('./stock/*/assets/*', { eager: true, query: '?url', import: 'default' });
const manifests = new Map();
const customThemes = new Map();
for (const [file, manifest] of Object.entries(modules).sort(([a], [b]) => a.localeCompare(b))) {
  const folder = file.split('/')[2];
  const result = validateThemeManifest(manifest, { assetExists: asset => Object.hasOwn(assets, `./stock/${folder}/${asset}`) });
  if (folder !== manifest.id || !result.ok) throw new Error(`Invalid built-in theme ${folder}: ${result.errors.join(' ')}`);
  manifests.set(manifest.id, Object.freeze(manifest));
}

export const STOCK_THEME_IDS = Object.freeze([...manifests.keys()]);
export function stockThemeManifest(id) { return manifests.get(id) || null; }
export function setCustomThemes(items) {
  customThemes.clear();
  for (const item of items || []) {
    const manifest = item?.manifest;
    if (!manifest || manifests.has(manifest.id) || !validateThemeManifest(manifest, { assetExists: asset => Boolean(item.assetUrls?.[asset]) }).ok) continue;
    customThemes.set(`custom:${manifest.id}`, item);
  }
}
export function customThemeManifest(id) { return customThemes.get(id)?.manifest || null; }
export function customThemeAssetUrl(id, asset) { return customThemes.get(id)?.assetUrls?.[asset] || ''; }
export function customThemeList() { return [...customThemes.values()].map(item => item.manifest); }
export function customThemeCanvas(id) {
  const manifest = customThemeManifest(id);
  const layer = manifest?.layers?.canvas;
  if (layer?.type === 'gradient') return `linear-gradient(135deg, rgb(${manifest.palette[layer.from].join(' ')}), rgb(${manifest.palette[layer.to].join(' ')}))`;
  if (!['image', 'gif', 'video'].includes(layer?.type)) return undefined;
  const asset = customThemeAssetUrl(id, layer.type === 'image' ? layer.asset : layer.reducedMotionAsset);
  if (!asset) return undefined;
  const wash = 1 - (layer.opacity ?? 1);
  return `linear-gradient(135deg, rgb(${manifest.palette.grad1.join(' ')} / ${wash}), rgb(${manifest.palette.grad2.join(' ')} / ${wash})), url("${asset}")`;
}
export function stockThemeAssetUrl(id, layerName) {
  const custom = customThemes.get(id);
  const asset = (custom?.manifest || manifests.get(id))?.layers?.[layerName]?.asset;
  if (custom) return asset ? custom.assetUrls?.[asset] || '' : '';
  return asset ? assets[`./stock/${id}/${asset}`] || '' : '';
}

const CSS_TOKEN_KEYS = {
  ink: '--ink', muted: '--muted', accent: '--accent', accent2: '--accent-2',
  accentSoft: '--accent-soft', hairlineGlow: '--hairline-glow', grad1: '--grad-1', grad2: '--grad-2',
  accentText: '--accent-text', accent2Text: '--accent-2-text',
  surface: '--surface', panel: '--panel', border: '--border',
};
export function applyStockThemePalette(element, id) {
  const manifest = customThemeManifest(id) || stockThemeManifest(id) || stockThemeManifest('synthwave');
  if (!element || !manifest) return;
  for (const [key, cssName] of Object.entries(CSS_TOKEN_KEYS)) {
    element.style.setProperty(cssName, (manifest.palette[key] || manifest.panels[key]).join(' '));
  }
}
