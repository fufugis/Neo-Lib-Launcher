import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { normalizePlaytimePieFilters, playtimePie, playtimePieSliceAtPoint, pieTooltipPosition } from '../src/components/home/playtime-pie-model.mjs';
import { normalizeLoungePreferences } from '../src/components/lounge/lounge-layout-model.mjs';
import { homeWidget } from '../src/components/home/home-widget-registry.mjs';

const now = 1800000000000;
const games = [
  { id: 'a', name: 'Alpha', launcher: 'steam', playtime: 600, journeyStatus: 'in-progress', lastPlayedAt: now - 86400000 },
  { id: 'b', name: 'Beta', launcher: 'epic', playtime: 120, journeyStatus: 'finished', lastPlayedAt: now - 90 * 86400000 },
  { id: 'private', name: 'SECRET', playtime: 99999, homeLocked: true },
  { id: 'zero', playtime: 0 }, { id: 'nan', playtime: 'bad' }, { id: 'inf', playtime: Infinity }, { id: 'negative', playtime: -1 },
];
const chart = playtimePie(games, {}, ['a'], now);
assert.equal(chart.total, 720);
assert.equal(chart.gameCount, 2);
assert(Math.abs(chart.slices.reduce((sum, slice) => sum + slice.percent, 0) - 100) < 1e-10);
assert(!chart.gradient.includes('NaN'));
assert.deepEqual(playtimePie(games, { platform: 'steam' }).slices.map(slice => slice.id), ['a']);
assert.deepEqual(playtimePie(games, { journey: 'finished' }).slices.map(slice => slice.id), ['b']);
assert.equal(playtimePie(games, { minHours: 3 }).total, 600);
assert.equal(playtimePie(games, { maxHours: 3 }).total, 120);
assert.equal(playtimePie(games, { search: 'BETA' }).total, 120);
assert.equal(playtimePie(games, { favoritesOnly: true }, ['b']).total, 120);
assert.equal(playtimePie(games, { favoritesOnly: true }, []).total, 0);
assert.equal(playtimePie(games, { recentDays: 7 }, [], now).total, 600, 'recent activity chooses games but never invents period minutes');
assert.equal(playtimePie([{ ...games[0], lastPlayedAt: now + 1 }], { recentDays: 7 }, [], now).total, 0);
assert.equal(playtimePie([games[0], games[0]]).total, 600, 'duplicate games cannot double-count');
assert.equal(playtimePie([]).gradient, 'none');
assert.equal(playtimePie([games[0]]).slices[0].percent, 100);
const many = playtimePie(Array.from({ length: 20 }, (_, index) => ({ id: index, name: `Game ${index}`, playtime: index + 1 })), { limit: 5 });
assert.equal(many.slices.length, 6);
assert.equal(many.slices.at(-1).id, null);
assert.equal(many.slices.reduce((sum, slice) => sum + slice.minutes, 0), many.total, 'Other retains every matching minute');
const quarters = playtimePie(Array.from({ length: 4 }, (_, index) => ({ id: index, name: `Quarter ${index}`, playtime: 60 })));
const rect = { left: 10, top: 20, width: 200, height: 200 };
assert.equal(playtimePieSliceAtPoint(quarters, rect, 110, 30).id, 0, 'gradient starts at twelve oclock');
assert.equal(playtimePieSliceAtPoint(quarters, rect, 160, 70).id, 0);
assert.equal(playtimePieSliceAtPoint(quarters, rect, 160, 170).id, 1);
assert.equal(playtimePieSliceAtPoint(quarters, rect, 60, 170).id, 2);
assert.equal(playtimePieSliceAtPoint(quarters, rect, 60, 70).id, 3, 'clockwise slice geometry');
assert.equal(playtimePieSliceAtPoint(quarters, rect, 10, 20), null, 'square corner is outside the circle');
assert.equal(playtimePieSliceAtPoint(quarters, rect, 110, 120), null, 'centre has no unique slice');
assert.equal(playtimePieSliceAtPoint(quarters, { ...rect, width: 0 }, 110, 120), null);
assert.equal(playtimePieSliceAtPoint(playtimePie([]), rect, 110, 30), null);
assert.equal(playtimePieSliceAtPoint(quarters, rect, NaN, 30), null);
assert.equal(playtimePieSliceAtPoint(quarters, { left: 500, top: 100, width: 400, height: 600 }, 800, 250).id, 0, 'client-space hit test accounts for zoom/scaling');
assert.equal(playtimePieSliceAtPoint(many, rect, 75, 45).id, null, 'Other slice can be hovered without pretending to name a game');
for (const [x, y] of [[0, 0], [400, 300], [399, 299], [200, 150]]) {
  const position = pieTooltipPosition(x, y, 160, 70, 400, 300);
  assert(position.left >= 12 && position.top >= 12 && position.left + 160 <= 388 && position.top + 70 <= 288, 'tooltip stays inside viewport');
}
assert.equal(normalizePlaytimePieFilters({ minHours: 8, maxHours: 2 }).maxHours, 8);
assert.equal(normalizePlaytimePieFilters(null).limit, 10);
assert.equal(normalizePlaytimePieFilters({ recentDays: '7', limit: '5', minHours: -2 }).recentDays, 7);
assert(homeWidget('playtime-pie'));
const preferences = normalizeLoungePreferences({ widgetIds: ['playtime-pie'], playtimePieFilters: { minHours: 2, favoritesOnly: true } });
assert.deepEqual(normalizeLoungePreferences(JSON.parse(JSON.stringify(preferences))).playtimePieFilters, preferences.playtimePieFilters);
assert(preferences.widgetIds.includes('playtime-pie'));
const read = file => fs.readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8');
const home = read('components/HomeHub.jsx'), lounge = read('components/lounge/LoungeWidgetArea.jsx');
assert(home.includes('games={visibleTrackableGames} favoriteIds={favoriteIds} filters={homeLayout.playtimePieFilters}'));
assert(home.includes('updateLayout({ playtimePieFilters })'));
assert(lounge.includes('filters={preferences.playtimePieFilters}'));
assert(read('App.jsx').includes('<HomeHub favoriteIds={settings.pinnedGameIds || []}'));
assert(read('components/lounge/NeoLounge.jsx').includes('onPlaytimePieFiltersChange={changePlaytimePieFilters}'));
const widget = read('components/home/PlaytimePieWidget.jsx');
const pieChart = read('components/home/PlaytimePieChart.jsx');
assert(widget.includes('<PlaytimePieChart chart={chart} />') && widget.includes('aria-expanded={expanded}'));
assert(pieChart.includes('role="img"') && pieChart.includes('role="tooltip"'));
for (const required of ['onPointerMove={move}', 'onPointerLeave=', 'onPointerCancel=', 'getBoundingClientRect()', 'renderForegroundPortal', 'hover?.chart === chart', 'active.slice.label', 'active.slice.percent.toFixed(1)', 'formatPlaytime(active.slice.minutes)', "'resize'", "'scroll'", "'blur'", "event.pointerType === 'touch'"]) assert(pieChart.includes(required), `Hover wiring missing ${required}`);
assert(!/setInterval|requestAnimationFrame|window\.api|localStorage/.test(pieChart), 'hover has no polling, frame loop or native requests');
assert(!/window\.api|setInterval|requestAnimationFrame|localStorage/.test(widget), 'widget has no native I/O, animation loop or independent persistence');
const require = createRequire(import.meta.url);
const babel = createRequire(require.resolve('@vitejs/plugin-react'))('@babel/core');
babel.parseSync(widget, { configFile: false, babelrc: false, parserOpts: { plugins: ['jsx'] } });
babel.parseSync(pieChart, { configFile: false, babelrc: false, parserOpts: { plugins: ['jsx'] } });
console.log('PASS: recorded playtime pie totals/percentages/Other, privacy, every filter, invalid input, Home and Lounge registration, favorite wiring and saved Lounge filters. Live appearance/controller acceptance pending.');
