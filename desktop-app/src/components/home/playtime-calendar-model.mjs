import { localPlayDay, normalizePlaytimeDays } from '../../state/playtime-days.mjs';
import { statisticsGames } from '../../lib/emulator-profile-model.mjs';

export const CALENDAR_HEAT = Object.freeze(['rgb(var(--surface)/0.7)', '#164e63', '#0e7490', '#0891b2', '#22d3ee']);
export function calendarHeat(minutes) { return minutes <= 0 ? 0 : minutes < 30 ? 1 : minutes < 120 ? 2 : minutes < 240 ? 3 : 4; }
export function normalizeCalendarPreferences(input = {}, now = new Date(), { allowFuture = false } = {}) {
  input = input && typeof input === 'object' ? input : {};
  return { view: input.view === 'month' ? 'month' : 'year',
    excludeRoms: input.excludeRoms === true,
    year: Number.isFinite(Number(input.year)) && input.year != null ? Math.max(2000, Math.min(now.getFullYear() + (allowFuture ? 5 : 0), Math.round(Number(input.year)))) : now.getFullYear(),
    month: Number.isFinite(Number(input.month)) && input.month != null ? Math.max(0, Math.min(11, Math.round(Number(input.month)))) : now.getMonth(),
    gameId: typeof input.gameId === 'string' ? input.gameId.slice(0, 200) : '' };
}
export function calendarMonth(year, month, today = localPlayDay(new Date())) {
  const leading = (new Date(year, month, 1, 12).getDay() + 6) % 7;
  const count = new Date(year, month + 1, 0, 12).getDate();
  return [...Array(leading).fill(null), ...Array.from({ length: count }, (_, index) => {
    const key = localPlayDay(new Date(year, month, index + 1, 12));
    return { key, day: index + 1, future: key > today };
  })];
}
export function playtimeCalendar(games = [], input = {}, now = new Date(), options = {}) {
  const preferences = normalizeCalendarPreferences(input, now, options);
  const today = localPlayDay(now);
  const visible = [], seen = new Set();
  for (const game of statisticsGames(games, preferences.excludeRoms)) {
    if (!game || game.homeLocked || game.id == null || seen.has(String(game.id))) continue;
    seen.add(String(game.id)); visible.push(game);
  }
  const effectiveGameId = visible.some(game => String(game.id) === preferences.gameId) ? preferences.gameId : '';
  const byDay = {};
  for (const game of visible) {
    if (effectiveGameId && String(game.id) !== effectiveGameId) continue;
    for (const [day, minutes] of Object.entries(normalizePlaytimeDays(game.playtimeDays))) {
      if (day > today || Number(day.slice(0, 4)) !== preferences.year || (preferences.view === 'month' && Number(day.slice(5, 7)) !== preferences.month + 1)) continue;
      const entry = byDay[day] ||= { minutes: 0, games: [] };
      entry.minutes += minutes; entry.games.push({ id: game.id, name: game.name || 'Game', minutes });
    }
  }
  for (const entry of Object.values(byDay)) entry.games.sort((a, b) => b.minutes - a.minutes);
  const entries = Object.entries(byDay);
  return { preferences: { ...preferences, gameId: effectiveGameId }, byDay,
    total: entries.reduce((sum, [, entry]) => sum + entry.minutes, 0), activeDays: entries.length,
    busiestDay: entries.sort((a, b) => b[1].minutes - a[1].minutes || a[0].localeCompare(b[0]))[0]?.[0] || null,
    months: (preferences.view === 'month' ? [preferences.month] : Array.from({ length: 12 }, (_, index) => index))
      .map(month => ({ month, cells: calendarMonth(preferences.year, month, today) })) };
}
