export const IDLE_POWER_DELAY_MS = 15 * 60 * 1000;
export const IDLE_POWER_CHECK_MS = 30 * 1000;

export function shouldSaveIdlePower({ now, startedAt, lastActivityAt = 0, systemIdleSeconds = null, gameRunning = false, blocked = false, enabled = true }) {
  if (!enabled || blocked || gameRunning || !Number.isFinite(now) || !Number.isFinite(startedAt)) return false;
  const recentInput = Number.isFinite(lastActivityAt) && lastActivityAt > 0 && Math.max(0, now - lastActivityAt) < IDLE_POWER_DELAY_MS;
  // A controller may not reset Windows' keyboard/mouse idle counter.
  if (recentInput) return false;
  const appQuiet = Math.max(0, now - Math.max(startedAt, lastActivityAt || 0)) >= IDLE_POWER_DELAY_MS;
  const pcQuiet = typeof systemIdleSeconds === 'number' && Number.isFinite(systemIdleSeconds) && systemIdleSeconds >= IDLE_POWER_DELAY_MS / 1000;
  return appQuiet || pcQuiet;
}
