export function mergeUpdateStatusLedger(settings = {}, result = {}, limit = 1500) {
  const entries = Array.isArray(result?.ledger) ? result.ledger.filter((entry) => entry?.id && entry?.status) : [];
  if (!entries.length) return settings;
  const prior = settings.updateStatusLedger && typeof settings.updateStatusLedger === 'object' ? settings.updateStatusLedger : {};
  const merged = { ...prior };
  entries.forEach((entry) => { merged[entry.id] = entry; });
  const boundedLimit = Math.max(1, Math.min(5000, Number(limit) || 1500));
  const updateStatusLedger = Object.fromEntries(
    Object.entries(merged)
      .sort((a, b) => Number(b[1]?.checkedAt || 0) - Number(a[1]?.checkedAt || 0))
      .slice(0, boundedLimit),
  );
  return { ...settings, updateStatusLedger };
}
