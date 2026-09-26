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
