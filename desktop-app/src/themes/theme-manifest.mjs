export const THEME_FORMAT_VERSION = 1;
export const THEME_LAYER_NAMES = Object.freeze(['canvas', 'atmosphere', 'sidebar', 'decoration', 'navigationFrame', 'navigationFlourish', 'controlFrame']);
const PALETTE_NAMES = ['ink', 'muted', 'accent', 'accent2', 'accentSoft', 'hairlineGlow', 'grad1', 'grad2', 'accentText', 'accent2Text'];
const PANEL_NAMES = ['surface', 'panel', 'border'];
const MEDIA_EXTENSIONS = { image: ['png', 'jpg', 'jpeg', 'webp'], gif: ['gif'], video: ['webm'] };
const LOOP_MODES = new Set(['once', 'always', 'while-visible']);
const PARTICLE_DIRECTIONS = new Set(['rise', 'fall', 'drift']);
const STILL_ASSET = /^assets\/[a-z0-9][a-z0-9._-]*\.(?:png|jpe?g|webp)$/i;

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
  let animatedLayers = 0;
  for (const name of THEME_LAYER_NAMES) {
    const layer = input.layers?.[name];
    if (!layer || typeof layer !== 'object' || Array.isArray(layer)) { errors.push(`layers.${name} is required.`); continue; }
    if (!['none', 'gradient', 'image', 'gif', 'video'].includes(layer.type)) { errors.push(`layers.${name} has an unsupported type.`); continue; }
    if (['gif', 'video'].includes(layer.type)) animatedLayers += 1;
    if (layer.type === 'gradient' && (!['grad1', 'grad2'].includes(layer.from) || !['grad1', 'grad2'].includes(layer.to))) errors.push(`layers.${name} needs palette gradient endpoints.`);
    if (['image', 'gif', 'video'].includes(layer.type)) {
      const asset = String(layer.asset || '');
      const extension = asset.split('.').pop()?.toLowerCase();
      if (!/^assets\/[a-z0-9][a-z0-9._-]*$/i.test(asset) || !MEDIA_EXTENSIONS[layer.type].includes(extension) || !assetExists(asset)) errors.push(`layers.${name} has an invalid or missing asset.`);
      if (layer.type === 'video' && (!LOOP_MODES.has(layer.loop) || !/^assets\/[a-z0-9][a-z0-9._-]*\.(?:png|jpe?g|webp)$/i.test(layer.reducedMotionAsset || '') || !assetExists(layer.reducedMotionAsset))) errors.push(`layers.${name} video needs a loop rule and still-image fallback.`);
      if (layer.type === 'video' && !['atmosphere', 'canvas'].includes(name)) errors.push(`layers.${name} video is currently limited to canvas/atmosphere artwork.`);
      if (layer.type === 'gif' && (!LOOP_MODES.has(layer.loop) || !/^assets\/[a-z0-9][a-z0-9._-]*\.(?:png|jpe?g|webp)$/i.test(layer.reducedMotionAsset || '') || !assetExists(layer.reducedMotionAsset))) errors.push(`layers.${name} GIF needs a loop rule and still-image fallback.`);
      if (layer.type === 'gif' && (!['atmosphere', 'canvas'].includes(name) || !LOOP_MODES.has(layer.loop))) errors.push(`layers.${name} GIF is currently limited to canvas/atmosphere artwork.`);
      if (layer.type === 'gif' && layer.loop === 'once' && (!Number.isInteger(layer.playbackMs) || layer.playbackMs < 100 || layer.playbackMs > 20_000)) errors.push(`layers.${name} one-shot GIF needs validated timing of at most 20 seconds.`);
    }
    if (layer.opacity !== undefined && (!Number.isFinite(layer.opacity) || layer.opacity < 0 || layer.opacity > 1)) errors.push(`layers.${name} opacity must be 0–1.`);
  }
  if (animatedLayers > 1) errors.push('Only one animated Canvas or Atmosphere layer is allowed.');
  if (!input.motion || !['calm', 'normal', 'energetic'].includes(input.motion.cadence) || input.motion.reducedMotion !== 'still') errors.push('Motion needs a cadence and still reduced-motion mode.');
  if (input.effects !== undefined) {
    const emitters = input.effects?.particles;
    if (!input.effects || typeof input.effects !== 'object' || Array.isArray(input.effects) || !Array.isArray(emitters) || emitters.length > 3) errors.push('effects.particles must contain at most three emitters.');
    else {
      const seen = new Set();
      for (const [index, emitter] of emitters.entries()) {
        const label = `effects.particles[${index}]`;
        if (!emitter || typeof emitter !== 'object' || Array.isArray(emitter)) { errors.push(`${label} must be an object.`); continue; }
        if (!/^[a-z0-9][a-z0-9-]{0,31}$/.test(emitter.id || '') || seen.has(emitter.id)) errors.push(`${label} needs a unique ID.`);
        seen.add(emitter.id);
        if (typeof emitter.asset !== 'string' || !STILL_ASSET.test(emitter.asset) || !assetExists(emitter.asset)) errors.push(`${label} needs a local still-image asset.`);
        if (!Number.isInteger(emitter.count) || emitter.count < 1 || emitter.count > 24) errors.push(`${label}.count must be 1–24.`);
        if (!Number.isInteger(emitter.sizePx) || emitter.sizePx < 4 || emitter.sizePx > 80) errors.push(`${label}.sizePx must be 4–80.`);
        if (!Number.isFinite(emitter.opacity) || emitter.opacity < 0.05 || emitter.opacity > 1) errors.push(`${label}.opacity must be 0.05–1.`);
        if (!Number.isFinite(emitter.durationSeconds) || emitter.durationSeconds < 5 || emitter.durationSeconds > 60) errors.push(`${label}.durationSeconds must be 5–60.`);
        if (!PARTICLE_DIRECTIONS.has(emitter.direction)) errors.push(`${label}.direction must be rise, fall or drift.`);
        if (emitter.placement !== undefined && !['full', 'start', 'middle', 'end'].includes(emitter.placement)) errors.push(`${label}.placement must be full, start, middle or end.`);
        if (emitter.depth !== undefined && !['near', 'far'].includes(emitter.depth)) errors.push(`${label}.depth must be near or far.`);
        if (emitter.rotation !== undefined && (!Number.isInteger(emitter.rotation) || emitter.rotation < -180 || emitter.rotation > 180)) errors.push(`${label}.rotation must be -180–180.`);
        if (emitter.glow !== undefined && (!Number.isInteger(emitter.glow) || emitter.glow < 0 || emitter.glow > 20)) errors.push(`${label}.glow must be 0–20.`);
        if (emitter.reaction !== undefined && !['ambient', 'launch', 'celebrate'].includes(emitter.reaction)) errors.push(`${label}.reaction must be ambient, launch or celebrate.`);
      }
    }
  }
  if (!String(input.license?.name || '').trim() || !String(input.license?.attribution || '').trim()) errors.push('License and attribution are required.');
  if (Object.hasOwn(input, 'css') || Object.hasOwn(input, 'script') || Object.hasOwn(input, 'javascript')) errors.push('Executable scripts and custom CSS are not supported.');
  return { ok: errors.length === 0, errors };
}
