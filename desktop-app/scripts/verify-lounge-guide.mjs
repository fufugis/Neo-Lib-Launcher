import assert from 'node:assert/strict';
import { continueLoungeGames, inProgressLoungeGames, loungeGuideSnapshot, recentlyActiveLoungeGames, recentlyAddedLoungeGames, sortLoungeBrowseGames } from '../src/components/lounge/lounge-guide-model.mjs';

const now = Date.UTC(2026, 8, 27, 12);
const games = [
  { id: 'older', name: 'Older', lastPlayedAt: now - 10 * 86400000, playtime: 120, journeyStatus: 'finished' },
  { id: 'recent', name: 'Recent', lastPlayedAt: now - 86400000, playtime: 95, journeyStatus: 'in-progress' },
  { id: 'newest', name: 'Newest', lastPlayedAt: now - 3600000, playtime: 20 },
  { id: 'planned', name: 'Planned', playtime: 0, journeyStatus: 'in-progress' },
  { id: 'invalid', name: 'Invalid', lastPlayedAt: 'not a date', playtime: Infinity },
  { id: 'backlog-other', name: 'Other backlog', journeyStatus: 'backlog', addedAt: now - 2 * 86400000 },
  { id: 'backlog-favorite', name: 'Favorite backlog', journeyStatus: 'backlog', addedAt: now - 20 * 86400000 },
  { id: 'unplayed', name: 'Unplayed', journeyStatus: 'not-started', addedAt: now - 86400000 },
];
const guide = loungeGuideSnapshot(games, now, ['backlog-favorite']);
assert.equal(sortLoungeBrowseGames(games, 'library'), games, 'default Lounge order preserves the existing library sequence');
assert.deepEqual(sortLoungeBrowseGames([{ id: 1, name: 'Game 10' }, { id: 2, name: 'Game 2' }], 'name').map(game => game.id), [2, 1], 'name sort uses natural number ordering');
assert.deepEqual(sortLoungeBrowseGames([{ id: 1 }, { id: 2, lastPlayedAt: now - 1000 }], 'last-played').map(game => game.id), [2, 1], 'undated games come last in played-date order');
assert.deepEqual(sortLoungeBrowseGames([{ id: 1 }, { id: 2, addedAt: now - 1000 }], 'recently-added').map(game => game.id), [2, 1], 'undated games come last in added-date order');
assert.deepEqual(sortLoungeBrowseGames([{ id: 'future', lastPlayedAt: now + 1000 }, { id: 'real', lastPlayedAt: now - 1000 }], 'last-played', now).map(game => game.id), ['real', 'future'], 'future play dates do not rank ahead of recorded sessions');
assert.deepEqual(sortLoungeBrowseGames([{ id: 'future', addedAt: now + 1000 }, { id: 'real', addedAt: now - 1000 }], 'recently-added', now).map(game => game.id), ['real', 'future'], 'future library dates do not rank ahead of recorded additions');
assert.deepEqual(guide.recentlyAddedGames.map(game => game.id), ['unplayed', 'backlog-other', 'backlog-favorite'], 'recorded additions sort newest first');
assert.deepEqual(recentlyAddedLoungeGames(games, now).map(game => game.id), ['unplayed', 'backlog-other', 'backlog-favorite'], 'browse view shares the Home date ordering');
assert.equal(recentlyAddedLoungeGames(Array.from({ length: 20 }, (_, id) => ({ id, addedAt: now - id * 1000 })), now).length, 20, 'browse view is not capped to the Home preview');
assert.deepEqual(recentlyAddedLoungeGames([{ id: 'future', addedAt: now + 1000 }, { id: 'bad', addedAt: 'invalid' }], now), [], 'browse view excludes missing, invalid and future additions');
assert.deepEqual(loungeGuideSnapshot([{ id: 'bad', addedAt: 'not-a-date' }, { id: 'good', addedAt: String(now) }], now).recentlyAddedGames.map(game => game.id), ['good'], 'invalid addition dates never enter the shelf');
assert.deepEqual(loungeGuideSnapshot([{ id: 'future', addedAt: now + 86400000 }, { id: 'today', addedAt: now }], now).recentlyAddedGames.map(game => game.id), ['today'], 'future addition dates are not presented as recent facts');
assert.deepEqual(continueLoungeGames(games).map(game => game.id), ['newest', 'recent', 'planned'], 'the browse view includes every resumable game, not only Home’s featured four');
assert.deepEqual(continueLoungeGames([...games, { id: 'paused', lastPlayedAt: now - 1000, journeyStatus: 'on-hold' }]).map(game => game.id), ['newest', 'recent', 'planned'], 'paused games do not appear in Continue playing');
const manyResumable = [...games, { id: 'extra-one', lastPlayedAt: now - 2 * 86400000 }, { id: 'extra-two', lastPlayedAt: now - 3 * 86400000 }];
assert.equal(continueLoungeGames(manyResumable).length, 5, 'the browse view is not capped to the four Home preview games');
assert.equal(loungeGuideSnapshot(manyResumable, now).continueGames.length, 4, 'Home preview remains compact');
assert.deepEqual(continueLoungeGames(null), []);
assert.deepEqual(guide.continueGames.map(game => game.id), ['newest', 'recent', 'planned']);
assert.equal(guide.recentlyActiveCount, 2, 'weekly activity counts distinct games with recent last-played evidence, not invented hours');
assert.equal(guide.inProgressCount, 2);
assert.deepEqual(recentlyActiveLoungeGames(games, now).map(game => game.id), ['newest', 'recent'], 'weekly browse view matches the activity count and sorts latest first');
assert.deepEqual(inProgressLoungeGames(games).map(game => game.id), ['recent', 'planned'], 'in-progress browse view matches Journey Status, including games without a play date');
assert.deepEqual(recentlyActiveLoungeGames([{ id: 'future', lastPlayedAt: now + 1000 }, { id: 'old', lastPlayedAt: now - 8 * 86400000 }], now), [], 'weekly browse view excludes future and older dates');
assert.equal(guide.latestPlayedAt, now - 3600000);
assert.equal(guide.trackedTime, '3h 55m');
assert.deepEqual(guide.nextUpGames.map(game => game.id), ['backlog-favorite', 'backlog-other', 'unplayed']);
assert.equal(guide.featuredKind, 'continue');
assert.equal(guide.featuredGame.id, 'newest');
assert.deepEqual(guide.nextUpShelfGames.map(game => game.id), ['backlog-favorite', 'backlog-other', 'unplayed']);
const newLibrary = loungeGuideSnapshot(games.filter(game => ['backlog-favorite', 'backlog-other', 'unplayed'].includes(game.id)), now, ['backlog-favorite']);
assert.equal(newLibrary.featuredKind, 'next-up');
assert.equal(newLibrary.featuredGame.id, 'backlog-favorite');
assert.deepEqual(newLibrary.nextUpShelfGames.map(game => game.id), ['backlog-other', 'unplayed'], 'featured backlog game is not duplicated on its shelf');
const finishedOnly = loungeGuideSnapshot([{ id: 'finished', name: 'Finished', journeyStatus: 'finished', playtime: 0 }], now);
assert.equal(finishedOnly.featuredKind, 'library');
assert.equal(finishedOnly.featuredGame.id, 'finished');
assert.equal(loungeGuideSnapshot([], now).featuredKind, 'empty');
assert.equal(loungeGuideSnapshot([], now).featuredGame, null);
assert.deepEqual(loungeGuideSnapshot([], now).recentlyAddedGames, []);
assert.equal(loungeGuideSnapshot([], now).trackedTime, 'Not tracked yet');
assert.equal(loungeGuideSnapshot(null, now).recentlyActiveCount, 0);
console.log('PASS: Lounge Guide uses visible games and honest tracked-time/last-played evidence.');
