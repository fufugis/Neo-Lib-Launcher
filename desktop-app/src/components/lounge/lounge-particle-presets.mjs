// Lightweight Lounge-only shapes; no extra texture downloads or theme edits.
export const LOUNGE_EXTRA_PARTICLES = Object.freeze([
  Object.freeze({ id: 'rust-flakes', label: 'Rust flakes', description: 'Jagged copper-brown fragments tumble and settle without luminous snow glow.', direction: 'fall', count: 22, sizePx: 11, durationSeconds: 19, speedVariation: 55, swayPx: 52, spinDegrees: 540, shape: 'rust', color: '#b96e3e' }),
  Object.freeze({ id: 'blizzard', label: 'Blizzard', description: 'Fast wind-driven ice streaks sweep diagonally, unlike gentle falling snow.', direction: 'drift', count: 44, sizePx: 18, durationSeconds: 4, speedVariation: 40, swayPx: 70, rotation: -24, shape: 'blizzard', color: '#d5efff' }),
  Object.freeze({ id: 'fireflies', label: 'Fireflies', description: 'Warm drifting points with a soft glow.', direction: 'drift', count: 18, sizePx: 7, durationSeconds: 17, speedVariation: 40, swayPx: 32, shape: 'firefly', color: '#ffe49b' }),
  Object.freeze({ id: 'snowfall', label: 'Snowfall', description: 'Gentle flakes with varied falling speeds.', direction: 'fall', count: 24, sizePx: 8, durationSeconds: 13, speedVariation: 45, swayPx: 28, shape: 'snow', color: '#e9f6ff' }),
  Object.freeze({ id: 'comet-trails', label: 'Comet trails', description: 'Luminous twin-tone streaks with a longer, softer tail.', direction: 'drift', count: 12, sizePx: 38, durationSeconds: 10, speedVariation: 35, swayPx: 20, shape: 'comet', color: '#b9ddff' }),
  Object.freeze({ id: 'prism-shards', label: 'Prism shards', description: 'Angular crystal fragments that tumble downward.', direction: 'fall', count: 18, sizePx: 13, durationSeconds: 16, speedVariation: 42, swayPx: 38, spinDegrees: 300, shape: 'prism', color: '#b8a5ff' }),
  Object.freeze({ id: 'digital-rain', label: 'Digital rain', description: 'Tiny glowing pixels falling in uneven columns.', direction: 'fall', count: 29, sizePx: 7, durationSeconds: 10, speedVariation: 38, swayPx: 9, shape: 'pixel', color: '#80f5d6' }),
  Object.freeze({ id: 'ember-rise', label: 'Ember rise', description: 'Warm sparks that lift and flicker slowly.', direction: 'rise', count: 23, sizePx: 8, durationSeconds: 14, speedVariation: 48, swayPx: 42, shape: 'ember', color: '#ffae69' }),
  Object.freeze({ id: 'halo-rings', label: 'Halo rings', description: 'Soft luminous rings drifting through the scene.', direction: 'drift', count: 14, sizePx: 20, durationSeconds: 19, speedVariation: 32, swayPx: 28, shape: 'ring', color: '#a9e7ff' }),
  Object.freeze({ id: 'starbursts', label: 'Starbursts', description: 'Sharp four-point glints with a bright core.', direction: 'drift', count: 16, sizePx: 18, durationSeconds: 15, speedVariation: 44, swayPx: 33, shape: 'starburst', color: '#fff1b0' }),
  Object.freeze({ id: 'moon-wisps', label: 'Moon wisps', description: 'Pale, stretched light motes that float gently.', direction: 'drift', count: 14, sizePx: 27, durationSeconds: 23, speedVariation: 30, swayPx: 58, shape: 'wisp', color: '#b8c8ff' }),
]);

export const LOUNGE_PARTICLE_COLORS = Object.freeze([
  Object.freeze({ id: 'original', label: 'Original', css: '' }),
  Object.freeze({ id: 'accent', label: 'Theme accent', css: 'rgb(var(--accent))' }),
  Object.freeze({ id: 'ice', label: 'Ice blue', css: '#91d8ff' }),
  Object.freeze({ id: 'rose', label: 'Rose', css: '#ff91c8' }),
  Object.freeze({ id: 'gold', label: 'Gold', css: '#ffd878' }),
  Object.freeze({ id: 'mint', label: 'Mint', css: '#8fffd6' }),
]);
