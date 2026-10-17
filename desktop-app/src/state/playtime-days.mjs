export function localPlayDay(value) {
  const date = value instanceof Date ? value : new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function validPlayDay(key) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const [year, month, day] = key.split('-').map(Number);
  return year >= 2000 && year <= 9999 && localPlayDay(new Date(year, month - 1, day, 12)) === key;
}
export function normalizePlaytimeDays(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  return Object.fromEntries(Object.entries(input).filter(([key, minutes]) => validPlayDay(key)
    && Number.isFinite(minutes) && minutes > 0 && minutes <= 2880).sort(([a], [b]) => a.localeCompare(b)).slice(-3660));
}
// Sessions arrive with elapsed seconds. Split at local midnight, including DST
// days, instead of allocating lifetime totals or putting a whole night on its end day.
export function recordPlaytimeDays(existing, seconds, endedAt) {
  const days = normalizePlaytimeDays(existing);
  if (!Number.isFinite(seconds) || seconds <= 0 || seconds > 366 * 86400 || !Number.isFinite(endedAt)) return days;
  let cursor = endedAt - seconds * 1000;
  while (cursor < endedAt) {
    const date = new Date(cursor);
    const key = localPlayDay(date);
    const midnight = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).getTime();
    const end = Math.min(midnight, endedAt);
    if (!(end > cursor)) break;
    if (validPlayDay(key)) days[key] = Math.min(2880, (days[key] || 0) + (end - cursor) / 60000);
    cursor = end;
  }
  return normalizePlaytimeDays(days);
}
