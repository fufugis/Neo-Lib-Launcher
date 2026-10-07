import { platformOf } from './home-model.mjs';
import { JOURNEY_STATUSES, normalizeJourneyStatus } from '../../lib/game-journey-model.mjs';

export const PIE_COLORS = Object.freeze(['#60a5fa', '#a78bfa', '#34d399', '#fbbf24', '#f472b6', '#22d3ee', '#fb923c', '#818cf8', '#a3e635', '#e879f9', '#2dd4bf', '#f87171', '#38bdf8', '#c084fc', '#facc15', '#94a3b8']);
export function normalizePlaytimePieFilters(input = {}) {
  input = input && typeof input === 'object' ? input : {};
  const hours = value => Number.isFinite(Number(value)) ? Math.max(0, Math.min(1000000, Number(value))) : 0;
  const minHours = hours(input.minHours);
  const maxHours = hours(input.maxHours);
  return {
    search: String(input.search || '').slice(0, 160),
    platform: typeof input.platform === 'string' ? input.platform.slice(0, 40) : 'all',
    journey: JOURNEY_STATUSES.some(status => status.id === input.journey) ? input.journey : 'all',
    favoritesOnly: input.favoritesOnly === true,
    minHours, maxHours: maxHours > 0 ? Math.max(minHours, maxHours) : 0,
    recentDays: [7, 30, 365].includes(Number(input.recentDays)) ? Number(input.recentDays) : 0,
    limit: [5, 10, 15].includes(Number(input.limit)) ? Number(input.limit) : 10,
  };
}

export function playtimePie(games = [], input = {}, favoriteIds = [], now = Date.now()) {
  const filters = normalizePlaytimePieFilters(input);
  const favorites = new Set(Array.isArray(favoriteIds) ? favoriteIds : []);
  const seen = new Set();
  const entries = (Array.isArray(games) ? games : []).filter(game => {
    if (!game || game.homeLocked || game.id == null || seen.has(game.id)) return false;
    seen.add(game.id);
    const minutes = Number(game.playtime);
    const last = Number(game.lastPlayedAt);
    return Number.isFinite(minutes) && minutes > 0 && minutes >= filters.minHours * 60
      && (!filters.maxHours || minutes <= filters.maxHours * 60)
      && (filters.platform === 'all' || platformOf(game) === filters.platform)
      && (filters.journey === 'all' || normalizeJourneyStatus(game.journeyStatus) === filters.journey)
      && (!filters.favoritesOnly || favorites.has(game.id))
      && (!filters.recentDays || Number.isFinite(last) && last <= now && last >= now - filters.recentDays * 86400000)
      && String(game.name || '').toLowerCase().includes(filters.search.trim().toLowerCase());
  }).map(game => ({ id: game.id, label: game.name || 'Untitled game', minutes: Number(game.playtime) }))
    .sort((a, b) => b.minutes - a.minutes || String(a.id).localeCompare(String(b.id)));
  const total = entries.reduce((sum, item) => sum + item.minutes, 0);
  const slices = entries.slice(0, filters.limit);
  const remainder = entries.slice(filters.limit).reduce((sum, item) => sum + item.minutes, 0);
  if (remainder > 0) slices.push({ id: null, label: `Other (${entries.length - filters.limit} games)`, minutes: remainder });
  let cursor = 0;
  const stops = slices.map((slice, index) => {
    slice.percent = slice.minutes / total * 100;
    slice.color = PIE_COLORS[index];
    const start = cursor;
    cursor += slice.percent;
    return `${slice.color} ${start.toFixed(6)}% ${cursor.toFixed(6)}%`;
  });
  return { slices, total, gameCount: entries.length, gradient: stops.length ? `conic-gradient(${stops.join(', ')})` : 'none' };
}
