// Lightweight Lounge-only shapes; no extra texture downloads or theme edits.
export const LOUNGE_EXTRA_PARTICLES = Object.freeze([
  Object.freeze({ id: 'fireflies', label: 'Fireflies', description: 'Warm drifting points with a soft glow.', direction: 'drift', count: 18, sizePx: 7, durationSeconds: 17, speedVariation: 40, swayPx: 32, shape: 'firefly', color: '#ffe49b' }),
  Object.freeze({ id: 'snowfall', label: 'Snowfall', description: 'Gentle flakes with varied falling speeds.', direction: 'fall', count: 24, sizePx: 8, durationSeconds: 13, speedVariation: 45, swayPx: 28, shape: 'snow', color: '#e9f6ff' }),
  Object.freeze({ id: 'comet-trails', label: 'Comet trails', description: 'Occasional bright streaks crossing the sky.', direction: 'drift', count: 7, sizePx: 34, durationSeconds: 10, speedVariation: 35, swayPx: 20, shape: 'comet', color: '#b9ddff' }),
]);

export const LOUNGE_PARTICLE_COLORS = Object.freeze([
  Object.freeze({ id: 'original', label: 'Original', css: '' }),
  Object.freeze({ id: 'accent', label: 'Theme accent', css: 'rgb(var(--accent))' }),
  Object.freeze({ id: 'ice', label: 'Ice blue', css: '#91d8ff' }),
  Object.freeze({ id: 'rose', label: 'Rose', css: '#ff91c8' }),
  Object.freeze({ id: 'gold', label: 'Gold', css: '#ffd878' }),
  Object.freeze({ id: 'mint', label: 'Mint', css: '#8fffd6' }),
]);
