export const MIN_SIDEBAR_WIDTH = 220;
export const MAX_SIDEBAR_WIDTH = 640;

export function clampSidebarWidth(value, viewportWidth = 0) {
  const available = Number(viewportWidth) > 0 ? Math.max(MIN_SIDEBAR_WIDTH, viewportWidth - 320) : MAX_SIDEBAR_WIDTH;
  return Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, available, Math.round(Number(value) || MIN_SIDEBAR_WIDTH)));
}
