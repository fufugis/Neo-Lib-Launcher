import assert from 'node:assert/strict';
import { applyWallFilter, WALL_FILTERS } from '../src/components/library/wall-filter-model.mjs';

const games = [
  { id: 'quiet', name: 'Quiet', playtime: 0, lastPlayedAt: 0 },
  { id: 'recent', name: 'Recent', playtime: 20, lastPlayedAt: 300 },
  { id: 'favorite', name: 'Favorite', playtime: 90, lastPlayedAt: 100 },
  { id: 'middle', name: 'Middle', playtime: 40, lastPlayedAt: 200 },
];

assert.deepEqual(WALL_FILTERS.map(({ id }) => id), ['all', 'favorites', 'most-played', 'recently-played']);
assert.deepEqual(applyWallFilter(games, 'all', ['favorite']).map(({ id }) => id), ['quiet', 'recent', 'favorite', 'middle']);
assert.deepEqual(applyWallFilter(games, 'favorites', ['favorite']).map(({ id }) => id), ['favorite']);
assert.deepEqual(applyWallFilter(games, 'most-played').map(({ id }) => id), ['favorite', 'middle', 'recent']);
assert.deepEqual(applyWallFilter(games, 'recently-played').map(({ id }) => id), ['recent', 'middle', 'favorite']);
assert.deepEqual(applyWallFilter(null, 'favorites', null), []);

console.log('PASS: Wall quick filters preserve All order and correctly select favorites, most-played and recently-played games.');
