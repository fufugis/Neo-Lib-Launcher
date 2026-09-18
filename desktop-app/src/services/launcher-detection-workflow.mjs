export const LAUNCHER_DETECTION_DELAY_MS = 24 * 60 * 60 * 1000;

export function pickDetectedLauncher(status, {
  dismissed = {},
  askLater = {},
  games = [],
  now = Date.now(),
} = {}) {
  for (const [key, isRunning] of Object.entries(status || {})) {
    if (!isRunning || dismissed[key]) continue;
    const postponedAt = Number(askLater[key] || 0);
    if (postponedAt && now - postponedAt < LAUNCHER_DETECTION_DELAY_MS) continue;
    const alreadyImported = (games || []).some(game =>
      game?.launcher === key || game?.source === key || game?.source === `${key}-import`);
    if (!alreadyImported) return key;
  }
  return null;
}
