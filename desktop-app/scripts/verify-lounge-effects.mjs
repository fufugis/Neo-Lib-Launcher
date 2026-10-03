import assert from 'node:assert/strict';
import fs from 'node:fs';
import { LOUNGE_EFFECTS, loungeAmbientLightOpacity, loungeEffectPreferences, loungeFxGain, toggleLoungeEffect } from '../src/components/lounge/lounge-effect-model.mjs';
import { normalizeLoungePreferences, applyLoungeScene, applyLoungeVisualPreset, LOUNGE_VISUAL_PRESETS, loungeSceneParticleStyle } from '../src/components/lounge/lounge-layout-model.mjs';
import { LOUNGE_EXTRA_PARTICLES } from '../src/components/lounge/lounge-particle-presets.mjs';

const original = normalizeLoungePreferences({ filmGrain: 43, chromaticAberration: 19, lightBloom: 125 });
assert.deepEqual([0, 1, 2, 3, 4].map(loungeFxGain), [0, .18, .42, .7, 1]);
const intense = normalizeLoungePreferences({ lightBloom: 600, waveStrength: 300, atmosphereOpacity: 100, filmGrain: 100, artSaturation: 200, coverGlow: 'neon', coverGlowStrength: 200, smokeStrength: 100, effects: { smoke: true } });
const intact = JSON.stringify(intense);
for (const level of [0, 1, 2, 3, 4]) {
  const gain = loungeFxGain(level);
  const rendered = loungeEffectPreferences(intense, level);
  assert.equal(rendered.atmosphereOpacity, gain * 100, 'master atmosphere fade happens after saturation');
  assert.equal(rendered.filmGrain, gain * 100);
  assert.equal(rendered.artSaturation, 100 + gain * 100, 'grading approaches neutral rather than black');
  assert.equal(rendered.coverGlowStrength, gain * 200);
  assert.equal(rendered.backgroundZoom, intense.backgroundZoom, 'FX strength never reframes artwork');
}
assert.equal(JSON.stringify(intense), intact, 'master FX does not overwrite effect tuning');
assert.deepEqual(loungeEffectPreferences(intense, 4), loungeEffectPreferences(intense), 'Max is the complete configured look');
assert(original.effects.grain && original.effects.chromatic && original.effects.bloom, 'legacy active effects migrate intact');
assert(!original.effects.smoke && !original.effects['cold-rays'], 'new atmosphere effects are opt-in outside new scenes');
for (const [id, preset] of Object.entries(LOUNGE_VISUAL_PRESETS)) {
  const refreshed = applyLoungeVisualPreset(normalizeLoungePreferences({ effects: Object.fromEntries(LOUNGE_EFFECTS.map(effect => [effect.id, false])) }), id);
  for (const effect of LOUNGE_EFFECTS) {
    const control = effect.controls[0];
    if (Object.hasOwn(preset, control.key)) assert.equal(refreshed.effects[effect.id], preset[control.key] !== control.neutral, `${id} updates its effect checkmarks`);
  }
}
for (const effect of LOUNGE_EFFECTS) {
  const first = effect.controls[0];
  const on = normalizeLoungePreferences({ ...original, effects: { ...original.effects, [effect.id]: true } });
  const off = normalizeLoungePreferences({ ...on, ...toggleLoungeEffect(on, effect) });
  assert.equal(loungeEffectPreferences(off)[first.key], first.neutral, effect.id + ' is neutralized in rendering');
  assert.equal(off[first.key], on[first.key], effect.id + ' retains tuning');
  const restored = normalizeLoungePreferences({ ...off, ...toggleLoungeEffect(off, effect) });
  assert.equal(restored.effects[effect.id], true);
  if (on[first.key] !== first.neutral) assert.equal(restored[first.key], on[first.key]);
  assert.deepEqual(normalizeLoungePreferences(JSON.parse(JSON.stringify(off))), off, 'disabled state survives hydration');
}
for (const id of ['steampunk', 'anime-winter']) {
  const scene = applyLoungeScene(original, id);
  assert.equal(scene.specialTheme, id);
  assert(scene.effects[id === 'steampunk' ? 'smoke' : 'cold-rays']);
  const art = fs.readFileSync(new URL(`../src/assets/lounge/scene-${id}.png`, import.meta.url));
  assert.equal(art.toString('hex', 0, 8), '89504e470d0a1a0a');
  assert(art.readUInt32BE(16) >= 1600 && art.readUInt32BE(20) >= 900);
}
assert.equal(loungeSceneParticleStyle('steampunk'), 'rust-flakes');
assert.equal(loungeSceneParticleStyle('anime-winter'), 'blizzard');
const rust = LOUNGE_EXTRA_PARTICLES.find(p => p.id === 'rust-flakes');
const blizzard = LOUNGE_EXTRA_PARTICLES.find(p => p.id === 'blizzard');
const snow = LOUNGE_EXTRA_PARTICLES.find(p => p.id === 'snowfall');
assert(rust.spinDegrees > 0 && rust.shape !== snow.shape);
assert(blizzard.direction !== snow.direction && blizzard.durationSeconds < snow.durationSeconds && blizzard.count <= 48);
const bounds = normalizeLoungePreferences({ smokeStrength: 999, smokeSize: 999, smokeSpeed: -1, coldRayStrength: 999, coldRaySpread: -1, coldRaySoftness: 999 });
assert.deepEqual([bounds.smokeStrength, bounds.smokeSize, bounds.smokeSpeed, bounds.coldRayStrength, bounds.coldRaySpread, bounds.coldRaySoftness], [100, 160, 20, 300, 30, 100]);
const builder = fs.readFileSync(new URL('../src/components/lounge/LoungeVisualBuilder.jsx', import.meta.url), 'utf8');
assert(builder.includes('role="checkbox" aria-checked={enabled}') && builder.includes('{enabled && <div data-effect-controls={effect.id}>'));
for (const group of ['atmosphere', 'postprocessing', 'effects']) assert(builder.includes(`EffectChecklist group="${group}"`));
assert(builder.includes('<ParticlePicker'), 'particle section is independent');
const layer = fs.readFileSync(new URL('../src/components/lounge/LoungeAtmosphereLayer.jsx', import.meta.url), 'utf8');
assert(!/setInterval|requestAnimationFrame|backdrop-filter|feTurbulence/.test(layer), 'new atmospheres do not run per-frame JS or fullscreen procedural filters');
assert(layer.includes('project({ x, y') && layer.includes('sun.x'), 'local emission tracks framed artwork');
const allOn = normalizeLoungePreferences({ effects: Object.fromEntries(LOUNGE_EFFECTS.map(effect => [effect.id, true])), ambientLight: 80, lightBloom: 600, smokeStrength: 80, lightRays: 200 });
for (const bloom of [0, 55, 600]) {
  const rendered = loungeEffectPreferences({ ...allOn, lightBloom: bloom }, 4);
  assert.equal(loungeAmbientLightOpacity(rendered.ambientLight, 4, .36, true), loungeAmbientLightOpacity(80, 4, .36, true), 'ambient lighting does not depend on bloom');
  assert.equal(rendered.smokeStrength, 80); assert.equal(rendered.lightRays, 200);
}
assert.equal(loungeAmbientLightOpacity(0, 4, .36, true), 0);
const backdrop = fs.readFileSync(new URL('../src/components/lounge/LoungeLivingBackdrop.jsx', import.meta.url), 'utf8');
assert(backdrop.includes('loungeAmbientLightOpacity(preferences.ambientLight, loungeLevel, flow, animated)'));
assert(!backdrop.includes('(flow / 0.36) * lightBloom'));
assert(backdrop.indexOf('className="lounge-living-backdrop__shade') < backdrop.indexOf('className="lounge-living-backdrop__fx'));
const css = fs.readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
const wave = rules.find(([, selector, declarations]) => selector.trim() === '.lounge-living-backdrop__waves' && declarations.includes('background:'))?.[2];
assert(wave.includes('inset: -35%') && wave.includes('mask-image: radial-gradient'), 'wave surface overscans and feathers its own edges');
assert(wave.includes('min(8%,') && wave.includes('min(3.2%,') && wave.includes('min(3deg,'), 'combined strength/motion/drift cannot expose a travelling rectangle');
assert(!backdrop.includes('lounge-living-backdrop__waves absolute inset-0'), 'utility inset cannot override wave overscan');
// Inverse-transform screen corners at sampled motion phases: every corner
// stays within the wave plane, even at maximum sliders and ultrawide ratios.
for (const ratio of [0.5, 1, 16 / 9, 3440 / 1440, 4]) {
  const width = ratio, height = 1, planeW = width * 1.7, planeH = height * 1.7;
  for (let phase = -1; phase <= 1; phase += .1) {
    const angle = phase * 3 * Math.PI / 180;
    for (const x of [-width / 2, width / 2]) for (const y of [-height / 2, height / 2]) {
      const px = x / 1.2 - phase * .08 * planeW, py = y / 1.2 + phase * .032 * planeH;
      const localX = px * Math.cos(angle) + py * Math.sin(angle), localY = -px * Math.sin(angle) + py * Math.cos(angle);
      assert(Math.abs(localX) < planeW / 2 && Math.abs(localY) < planeH / 2, 'wave plane covers the screen throughout drift');
    }
  }
}
for (const scene of ['steampunk', 'anime-winter']) {
  const rule = rules.find(([, selector, declarations]) => selector.includes(`.lounge-living-backdrop__rays[data-lounge-scene-art='${scene}']`) && declarations.includes('background:'));
  assert(rule && rule[2].includes('var(--lounge-light-rays)'), scene + ' has independently controlled visible ray artwork');
}
const z = selector => {
  const rule = rules.find(([, candidate, declarations]) => candidate.trim() === selector && declarations.includes('z-index:'));
  assert(rule, selector + ' has an explicit stacking position');
  return Number(rule[2].match(/z-index:\s*(\d+)/)[1]);
};
assert(z('.lounge-living-backdrop__shade') < z('.lounge-living-backdrop__fx'));
const fxLayer = name => z('.lounge-living-backdrop__fx > .' + name);
assert(fxLayer('lounge-living-backdrop__bloom') < fxLayer('lounge-living-backdrop__rays'));
assert(fxLayer('lounge-living-backdrop__highlight') < fxLayer('lounge-local-atmosphere'));
const pulseFan = rules.find(([, selector, declarations]) => selector.trim().endsWith('.lounge-living-backdrop__highlight::before') && declarations.includes('background:'))?.[2];
assert(pulseFan?.includes('conic-gradient') && pulseFan.includes('mask-image: radial-gradient'), 'pulse rays softly fade around their own source');
assert(pulseFan.includes('--lounge-highlight-color') && pulseFan.includes('--lounge-shimmer-duration'), 'pulse rays share sampled tint and existing shimmer tuning');
const sway = css.match(/@keyframes lounge-pulse-ray-sway\s*\{([\s\S]*?)\n\}/)?.[1];
assert(sway && sway.includes('rotate(-1.8deg)') && sway.includes('rotate(1.8deg)'));
assert(!/background|mask|filter|width|height|left|top/.test(sway), 'ray animation changes only transform/opacity, not gradient rasterization or layout');
assert(css.includes("[data-lounge-backdrop-active='false'] .lounge-living-backdrop__highlight::before { animation: none !important; }"));
assert(/@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.lounge-living-backdrop__highlight::before \{ animation: none !important; \}/.test(css));
console.log('PASS: legacy migration, retained checkmarked tuning, neutral rendering, scene assets, distinct bounded particles and lightweight projected atmospheres.');
