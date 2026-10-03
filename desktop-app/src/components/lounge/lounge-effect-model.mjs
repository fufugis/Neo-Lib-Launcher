// One catalogue drives persistence, checklists and rendering. Disabled effects
// retain their tuning; old saved settings infer their existing active look.
const control = (key, label, min = 0, max = 100, unit = '%', neutral = 0) => ({ key, label, min, max, unit, neutral });
export const LOUNGE_EFFECTS = Object.freeze([
  { id: 'ambient-light', label: 'Ambient light', group: 'atmosphere', controls: [control('ambientLight', 'Ambient light strength')] },
  { id: 'theme-flow', label: 'Theme colour flow', group: 'atmosphere', controls: [control('themeFlow', 'Theme flow strength')] },
  { id: 'waves', label: 'Light waves', group: 'atmosphere', controls: [control('waveStrength', 'Wave strength', 0, 300), control('waveScale', 'Wave scale'), control('waveDrift', 'Wave drift', 0, 200)] },
  { id: 'bloom', label: 'Bloom', group: 'atmosphere', controls: [control('lightBloom', 'Light bloom', 0, 600), control('bloomSpread', 'Bloom spread', 40, 220)] },
  { id: 'rays', label: 'Light rays', group: 'atmosphere', controls: [control('lightRays', 'Light rays', 0, 300), control('raySoftness', 'Ray softness')] },
  { id: 'highlight', label: 'Highlight pulse', group: 'atmosphere', controls: [control('highlightPulse', 'Highlight pulse')] },
  { id: 'ribbon', label: 'Aurora ribbons', group: 'atmosphere', controls: [control('ribbonIntensity', 'Aurora ribbon intensity'), control('ribbonSpeed', 'Aurora ribbon speed', 20, 200), control('ribbonPosition', 'Aurora ribbon height')] },
  { id: 'edge', label: 'Screen edge light', group: 'atmosphere', controls: [control('edgeGlow', 'Screen edge glow'), control('edgeWidth', 'Edge glow width', 20, 180, 'px'), control('edgePulse', 'Edge glow pulse')] },
  { id: 'smoke', label: 'Smoke', group: 'atmosphere', fresh: true, controls: [control('smokeStrength', 'Smoke density'), control('smokeSize', 'Smoke plume size', 40, 160), control('smokeSpeed', 'Smoke drift speed', 20, 200)] },
  { id: 'cold-rays', label: 'Cold Rays', group: 'atmosphere', fresh: true, controls: [control('coldRayStrength', 'Cold ray strength', 0, 300), control('coldRaySpread', 'Cold ray spread', 30, 150), control('coldRaySoftness', 'Cold ray softness')] },
  { id: 'saturation', label: 'Colour saturation', group: 'postprocessing', controls: [control('artSaturation', 'Artwork saturation', 50, 200, '%', 100)] },
  { id: 'contrast', label: 'Contrast', group: 'postprocessing', controls: [control('artContrast', 'Artwork contrast', 70, 150, '%', 100)] },
  { id: 'temperature', label: 'Colour temperature', group: 'postprocessing', controls: [control('artTemperature', 'Artwork temperature', -100, 100)] },
  { id: 'grain', label: 'Film grain', group: 'postprocessing', controls: [control('filmGrain', 'Film grain')] },
  { id: 'chromatic', label: 'Chromatic aberration', group: 'postprocessing', controls: [control('chromaticAberration', 'Chromatic aberration')] },
  { id: 'vignette', label: 'Vignette', group: 'postprocessing', controls: [control('vignette', 'Vignette')] },
  { id: 'drift', label: 'Scenic drift', group: 'effects', controls: [control('sceneDrift', 'Scenic drift strength', 0, 200)] },
  { id: 'art-motion', label: 'Imported artwork motion', group: 'effects', controls: [control('backgroundMotion', 'Living artwork motion · drift and mini-zooms')] },
  { id: 'card-glow', label: 'Card glow', group: 'effects', controls: [control('coverGlowStrength', 'Card glow strength', 0, 200)] },
]);
export function normalizeLoungeEffects(input, defaults) {
  return Object.fromEntries(LOUNGE_EFFECTS.map(effect => {
    const first = effect.controls[0];
    const inferred = effect.fresh ? false : effect.id === 'card-glow' ? (input.coverGlow ?? defaults.coverGlow) !== 'off' : (input[first.key] ?? defaults[first.key]) !== first.neutral;
    return [effect.id, typeof input.effects?.[effect.id] === 'boolean' ? input.effects[effect.id] : inferred];
  }));
}
// Max preserves the full configured strength. Lower levels are deliberately
// separated, not tiny reductions from Max; this never overwrites saved tuning.
export function loungeFxGain(level = 4) {
  return [0, 0.18, 0.42, 0.7, 1][Math.max(0, Math.min(4, Math.round(Number(level) || 0)))];
}

export function loungeAmbientLightOpacity(strength, level, flow, moving) {
  return moving ? Math.min(0.75, (0.12 + level * 0.055) * (flow / 0.36)) * strength / 100 : 0;
}

export function loungeEffectPreferences(preferences = {}, level = 4) {
  const result = { ...preferences };
  const gain = loungeFxGain(level);
  if (typeof preferences.atmosphereOpacity === 'number') result.atmosphereOpacity = preferences.atmosphereOpacity * gain;
  for (const effect of LOUNGE_EFFECTS) {
    const { key, neutral } = effect.controls[0];
    // Atmosphere gets one master fade after its internal intensity clamps;
    // otherwise a saturated bloom/wave could look identical at Medium and Max.
    const effectGain = effect.group === 'atmosphere' && effect.id !== 'theme-flow' && gain > 0 ? 1 : gain;
    if (typeof preferences[key] === 'number') result[key] = neutral + (preferences[key] - neutral) * effectGain;
    if (preferences.effects?.[effect.id] === false) result[key] = neutral;
  }
  if (preferences.effects?.waves === false && result.ambientMotion === 'waves') result.ambientMotion = 'drift';
  if (preferences.effects?.['card-glow'] === false) result.coverGlow = 'off';
  return result;
}

export function toggleLoungeEffect(preferences, effect) {
  const enabled = preferences.effects?.[effect.id] === true;
  const first = effect.controls[0];
  const patch = { effects: { ...preferences.effects, [effect.id]: !enabled } };
  if (!enabled && preferences[first.key] === first.neutral) {
    const initial = { artSaturation: 115, artContrast: 115, artTemperature: -15, filmGrain: 20, chromaticAberration: 8 };
    patch[first.key] = initial[first.key] ?? Math.max(first.min, Math.min(first.max, 40));
  }
  if (!enabled && effect.id === 'card-glow' && preferences.coverGlow === 'off') patch.coverGlow = 'soft';
  if (!enabled && effect.id === 'waves') patch.ambientMotion = 'waves';
  return patch;
}
