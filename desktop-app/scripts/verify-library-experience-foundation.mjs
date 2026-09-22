import assert from 'node:assert/strict';
import { appendArtworkRevision, artworkSnapshot, normalizeArtworkLocks } from '../src/lib/artwork-revision-model.mjs';
import { normalizeLaunchRoutes, primaryLaunchRoute } from '../src/lib/game-launch-routes-model.mjs';
import { JOURNEY_STATUSES, journeyStatusAfterFirstLaunch, normalizeJourneyStatus } from '../src/lib/game-journey-model.mjs';
import { gameSignals, GAME_SIGNAL_DEFINITIONS } from '../src/lib/game-signals-model.mjs';
import { normalizeWallColumns, visibleWallColumns, WALL_COLUMN_DEFINITIONS } from '../src/components/library/wall-columns-model.mjs';

assert.deepEqual(JOURNEY_STATUSES.map(({ id }) => id), ['not-started', 'backlog', 'in-progress', 'on-hold', 'finished', 'mastered', 'dropped']);
assert.equal(normalizeJourneyStatus('unknown'), 'not-started');
assert.equal(journeyStatusAfterFirstLaunch('backlog', 0), 'in-progress');
assert.equal(journeyStatusAfterFirstLaunch('finished', 0), 'finished');
assert.equal(journeyStatusAfterFirstLaunch('not-started', 30), 'not-started');

const routes = normalizeLaunchRoutes([
  { id: 'dx12', label: 'Play DX12', kind: 'play', target: 'D:\\Game\\game.exe', arguments: '-dx12', primary: true },
  { id: 'config', label: 'Configuration', kind: 'configuration', target: 'D:\\Game\\config.exe' },
  { id: 'dx12', label: 'Duplicate', kind: 'play', target: 'bad.exe' },
]);
assert.equal(routes.length, 2);
assert.equal(primaryLaunchRoute(routes)?.id, 'dx12');
assert.equal(Object.isFrozen(routes), true);

const signals = gameSignals({ exePath: 'D:\\Game\\game.exe', capabilities: [{ id: 'controller-full', source: 'Steam' }], contentFlags: [{ id: 'adult-content', source: 'Player' }], about: 'horror nudity multiplayer' }, { favorite: true });
assert.deepEqual(signals.map(({ id }) => id), ['controller-full', 'adult-content', 'installed', 'favorite']);
assert.equal(signals.some(({ id }) => id === 'horror'), false, 'Game Signals must never infer sensitive or feature flags from prose.');
assert.equal(GAME_SIGNAL_DEFINITIONS.some(({ id }) => id === 'private'), true);

const columns = normalizeWallColumns([{ id: 'rating', visible: true, width: 20 }, { id: 'game', visible: false, width: 260 }, { id: 'unknown' }]);
assert.equal(columns[0].id, 'game');
assert.equal(columns[0].visible, true);
assert.equal(columns.find(({ id }) => id === 'rating').width, 70);
assert.equal(visibleWallColumns([{ id: 'mainGenre', visible: false }]).some(({ id }) => id === 'mainGenre'), false);
assert.equal(WALL_COLUMN_DEFINITIONS.some(({ id }) => id === 'journeyStatus'), true);

const snapshot = artworkSnapshot({ icon: 'icon.png', portraitImage: 'cover.jpg', artworkSources: { cover: 'Player' } }, { at: 5, reason: 'before-repair' });
assert.equal(snapshot.cover, 'cover.jpg');
assert.deepEqual(appendArtworkRevision([1, 2], snapshot, 2), [2, snapshot]);
assert.deepEqual(normalizeArtworkLocks({ cover: true, hero: 1 }), { icon: false, cover: true, hero: false, background: false, logo: false });

console.log('PASS: Journey Status, Launch Routes, Game Signals, configurable Wall columns and Artwork Workshop revision contracts are stable and bounded.');
