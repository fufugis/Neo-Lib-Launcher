export function advanceConsoleWheel(previous = {}, event, now) {
  const delta = Math.abs(event.deltaY || 0) >= Math.abs(event.deltaX || 0) ? event.deltaY : event.deltaX;
  const pixels = Number(delta) * (event.deltaMode === 1 ? 40 : event.deltaMode === 2 ? 240 : 1);
  if (event.ctrlKey || !Number.isFinite(pixels) || !pixels) return { state: previous, direction: 0, handled: false };
  const reset = now - (previous.lastAt ?? -Infinity) > 180 || Math.sign(previous.remainder || 0) !== Math.sign(pixels);
  const state = { ...previous, lastAt: now, remainder: Math.max(-240, Math.min(240, (reset ? 0 : previous.remainder || 0) + pixels)) };
  const direction = Math.abs(state.remainder) >= 48 && now - (state.lastStepAt ?? -Infinity) >= 90 ? Math.sign(state.remainder) : 0;
  if (direction) { state.remainder -= direction * 48; state.lastStepAt = now; }
  return { state, direction, handled: true };
}
