import { validateThemeManifest } from './theme-manifest.mjs';

const modules = import.meta.glob('./stock/*/theme.json', { eager: true, import: 'default' });
const assets = import.meta.glob('./stock/*/assets/*', { eager: true, query: '?url', import: 'default' });
const manifests = new Map();
for (const [file, manifest] of Object.entries(modules).sort(([a], [b]) => a.localeCompare(b))) {
  const folder = file.split('/')[2];
  const result = validateThemeManifest(manifest, { assetExists: asset => Object.hasOwn(assets, `./stock/${folder}/${asset}`) });
  if (folder !== manifest.id || !result.ok) throw new Error(`Invalid built-in theme ${folder}: ${result.errors.join(' ')}`);
  manifests.set(manifest.id, Object.freeze(manifest));
}

export const STOCK_THEME_IDS = Object.freeze([...manifests.keys()]);
export function stockThemeManifest(id) { return manifests.get(id) || null; }
export function stockThemeAssetUrl(id, layerName) {
  const asset = manifests.get(id)?.layers?.[layerName]?.asset;
  return asset ? assets[`./stock/${id}/${asset}`] || '' : '';
}

const CSS_TOKEN_KEYS = {
  ink: '--ink', muted: '--muted', accent: '--accent', accent2: '--accent-2',
  accentSoft: '--accent-soft', hairlineGlow: '--hairline-glow', grad1: '--grad-1', grad2: '--grad-2',
  accentText: '--accent-text', accent2Text: '--accent-2-text',
  surface: '--surface', panel: '--panel', border: '--border',
};
export function applyStockThemePalette(element, id) {
  const manifest = stockThemeManifest(id) || stockThemeManifest('synthwave');
  if (!element || !manifest) return;
  for (const [key, cssName] of Object.entries(CSS_TOKEN_KEYS)) {
    element.style.setProperty(cssName, (manifest.palette[key] || manifest.panels[key]).join(' '));
  }
}
