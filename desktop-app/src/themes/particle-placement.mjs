export const PARTICLE_PLACEMENTS = Object.freeze(['full', 'start', 'middle', 'end']);
export const PARTICLE_DEPTHS = Object.freeze(['near', 'far']);

// Placement follows the axis perpendicular to travel. It never changes the
// full-screen, pointer-safe FX container or puts artwork above app controls.
export function particlePosition(emitter, index) {
  const placement = PARTICLE_PLACEMENTS.includes(emitter.placement) ? emitter.placement : 'full';
  const band = { full: [0, 100], start: [0, 30], middle: [35, 65], end: [70, 100] }[placement];
  const seed = emitter.direction === 'drift'
    ? (index * 53 + emitter.id.length * 11) % 101
    : (index * 73 + emitter.id.length * 19) % 101;
  const position = `${Math.round(band[0] + (seed / 100) * (band[1] - band[0]))}%`;
  return emitter.direction === 'drift' ? { left: 0, top: position } : { left: position, top: 0 };
}

// Stable per sprite: changing a control must not reshuffle all particle speeds.
export function particleDuration(emitter, index, cadence = 'normal') {
  const variation = (emitter.speedVariation ?? 15) / 100;
  const seed = (index * 37 + emitter.id.length * 23) % 101;
  const speed = 1 + ((seed / 50) - 1) * variation;
  return Math.max(3, Math.min(105, emitter.durationSeconds / speed * (cadence === 'calm' ? 1.5 : 1)));
}

export function particleMotionStyle(emitter) {
  const start = emitter.rotation ?? 0;
  const spin = emitter.spinDegrees ?? 0;
  const sway = emitter.swayPx ?? 0;
  return {
    '--fx-rotation': `${start}deg`,
    '--fx-angle-25': `${start + spin * 0.25}deg`,
    '--fx-angle-50': `${start + spin * 0.5}deg`,
    '--fx-angle-75': `${start + spin * 0.75}deg`,
    '--fx-angle-100': `${start + spin}deg`,
    '--fx-sway': `${sway}px`,
    '--fx-sway-negative': `${-sway}px`,
  };
}
