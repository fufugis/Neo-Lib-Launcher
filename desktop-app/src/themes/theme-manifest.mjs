export const THEME_FORMAT_VERSION = 1;
export const THEME_LAYER_NAMES = Object.freeze(['canvas', 'atmosphere', 'sidebar', 'decoration', 'navigationFrame', 'navigationFlourish', 'controlFrame']);
const PALETTE_NAMES = ['ink', 'muted', 'accent', 'accent2', 'accentSoft', 'hairlineGlow', 'grad1', 'grad2', 'accentText', 'accent2Text'];
const PANEL_NAMES = ['surface', 'panel', 'border'];
const MEDIA_EXTENSIONS = { image: ['png', 'jpg', 'jpeg', 'webp'], gif: ['gif'], video: ['mp4', 'webm'] };
const LOOP_MODES = new Set(['once', 'always', 'while-visible']);

export function validateThemeManifest(input, { assetExists = () => true } = {}) {
  const errors = [];
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { ok: false, errors: ['Theme manifest must be an object.'] };
  if (input.schemaVersion !== THEME_FORMAT_VERSION) errors.push('Unsupported theme format version.');
  if (!/^[a-z0-9][a-z0-9-]{1,63}$/.test(input.id || '')) errors.push('Theme ID must be a short lowercase slug.');
  if (!String(input.name || '').trim() || String(input.name).length > 80) errors.push('Theme name must be 1–80 characters.');
  if (!['bright', 'middle', 'dark', 'special'].includes(input.tone)) errors.push('Theme tone is invalid.');
  const rgb = (value) => Array.isArray(value) && value.length === 3 && value.every((channel) => Number.isInteger(channel) && channel >= 0 && channel <= 255);
  for (const key of PALETTE_NAMES) if (!rgb(input.palette?.[key])) errors.push(`palette.${key} must be an RGB triplet.`);
  for (const key of PANEL_NAMES) if (!rgb(input.panels?.[key])) errors.push(`panels.${key} must be an RGB triplet.`);
  if (!input.layers || typeof input.layers !== 'object' || Array.isArray(input.layers)) errors.push('Named visual layers are required.');
  for (const name of THEME_LAYER_NAMES) {
    const layer = input.layers?.[name];
    if (!layer || typeof layer !== 'object' || Array.isArray(layer)) { errors.push(`layers.${name} is required.`); continue; }
    if (!['none', 'gradient', 'image', 'gif', 'video'].includes(layer.type)) { errors.push(`layers.${name} has an unsupported type.`); continue; }
    if (layer.type === 'gradient' && (!['grad1', 'grad2'].includes(layer.from) || !['grad1', 'grad2'].includes(layer.to))) errors.push(`layers.${name} needs palette gradient endpoints.`);
    if (['image', 'gif', 'video'].includes(layer.type)) {
      const asset = String(layer.asset || '');
      const extension = asset.split('.').pop()?.toLowerCase();
      if (!/^assets\/[a-z0-9][a-z0-9._-]*$/i.test(asset) || !MEDIA_EXTENSIONS[layer.type].includes(extension) || !assetExists(asset)) errors.push(`layers.${name} has an invalid or missing asset.`);
      if (layer.type === 'video' && (!LOOP_MODES.has(layer.loop) || !/^assets\/[a-z0-9][a-z0-9._-]*\.(?:png|jpe?g|webp)$/i.test(layer.reducedMotionAsset || '') || !assetExists(layer.reducedMotionAsset))) errors.push(`layers.${name} video needs a loop rule and still-image fallback.`);
      if (layer.type === 'gif' && (!LOOP_MODES.has(layer.loop) || !/^assets\/[a-z0-9][a-z0-9._-]*\.(?:png|jpe?g|webp)$/i.test(layer.reducedMotionAsset || '') || !assetExists(layer.reducedMotionAsset))) errors.push(`layers.${name} GIF needs a loop rule and still-image fallback.`);
    }
    if (layer.opacity !== undefined && (!Number.isFinite(layer.opacity) || layer.opacity < 0 || layer.opacity > 1)) errors.push(`layers.${name} opacity must be 0–1.`);
  }
  if (!input.motion || !['calm', 'normal', 'energetic'].includes(input.motion.cadence) || input.motion.reducedMotion !== 'still') errors.push('Motion needs a cadence and still reduced-motion mode.');
  if (!String(input.license?.name || '').trim() || !String(input.license?.attribution || '').trim()) errors.push('License and attribution are required.');
  if (Object.hasOwn(input, 'css') || Object.hasOwn(input, 'script') || Object.hasOwn(input, 'javascript')) errors.push('Executable scripts and custom CSS are not supported.');
  return { ok: errors.length === 0, errors };
}
