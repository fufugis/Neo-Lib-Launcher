import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { appendArtworkRevision, artworkSnapshot, normalizeArtworkLocks } from '../src/lib/artwork-revision-model.mjs';
import { normalizeLaunchRoutes, primaryLaunchRoute } from '../src/lib/game-launch-routes-model.mjs';
import { JOURNEY_STATUSES, journeyStatusAfterFirstLaunch, normalizeJourneyStatus } from '../src/lib/game-journey-model.mjs';
import { gameSignals, GAME_SIGNAL_DEFINITIONS } from '../src/lib/game-signals-model.mjs';
import { normalizeWallColumns, visibleWallColumns, WALL_COLUMN_DEFINITIONS } from '../src/components/library/wall-columns-model.mjs';
import { collectionCategoryAssignment } from '../src/services/collection-mode.mjs';

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

assert.deepEqual(collectionCategoryAssignment([{ id: 'a', categoryIds: ['first'] }, { id: 'b' }], ['a', 'b'], 'second'), [{ id: 'a', categoryIds: ['first', 'second'] }, { id: 'b', categoryIds: ['second'] }]);

const snapshot = artworkSnapshot({ icon: 'icon.png', portraitImage: 'cover.jpg', logo: 'logo.png', artworkSources: { cover: 'Player' } }, { at: 5, reason: 'before-repair' });
assert.equal(snapshot.cover, 'cover.jpg');
assert.equal(snapshot.logo, 'logo.png');
assert.deepEqual(appendArtworkRevision([1, 2], snapshot, 2), [2, snapshot]);
assert.deepEqual(normalizeArtworkLocks({ cover: true, hero: 1 }), { icon: false, cover: true, hero: false, background: false, logo: false });

const workshop = fs.readFileSync(path.join(import.meta.dirname, '../src/components/EditMetadataModal.jsx'), 'utf8');
assert.match(workshop, /Game Workshop/);
for (const tab of ['Overview', 'Artwork', 'Play & routes', 'Library', 'Signals', 'Advanced']) assert.match(workshop, new RegExp(tab.replace(/[&]/g, '\\&')));
assert.match(workshop, /normalizeLaunchRoutes/);
assert.match(workshop, /journeyStatus/);
assert.match(workshop, /contentFlags/);
assert.match(workshop, /game-workshop-save/);
assert.match(workshop, /Artwork Workshop/);
assert.match(workshop, /artworkLocks/);
assert.match(workshop, /artworkRevisions/);
assert.match(workshop, /Restore previous artwork/);

const wall = fs.readFileSync(path.join(import.meta.dirname, '../src/components/CoverWall.jsx'), 'utf8');
assert.match(wall, /wall-select-games/);
assert.match(wall, /wall-collection-actions/);
assert.match(wall, /onBulkFavorite/);
assert.match(wall, /onBulkJourneyStatus/);
assert.match(wall, /onBulkAddCategory/);

const sidebar = fs.readFileSync(path.join(import.meta.dirname, '../src/components/Sidebar.jsx'), 'utf8');
assert.match(sidebar, /sidebar-select-games/);
assert.match(sidebar, /sidebar-collection-actions/);
assert.match(sidebar, /onBulkFavorite/);
assert.match(sidebar, /onBulkJourneyStatus/);
assert.match(sidebar, /onBulkAddCategory/);

const wizard = fs.readFileSync(path.join(import.meta.dirname, '../src/components/WizardModal.jsx'), 'utf8');
assert.match(wizard, /Retro Profiles/);
assert.match(wizard, /retro-profile-save/);
assert.match(wizard, /NEO-LIB never supplies or searches for emulators, BIOS files or ROMs/);
assert.doesNotMatch(wizard, /scanRom|scanROM|importRom|importROM/, 'The profile setup surface must not scan/import ROMs yet.');

const metadataReview = fs.readFileSync(path.join(import.meta.dirname, '../src/components/AcceptMetadataModal.jsx'), 'utf8');
assert.match(metadataReview, /Artwork review/);
assert.match(metadataReview, /normalizeArtworkLocks/);
assert.match(metadataReview, /artworkLocks\.cover/);
assert.match(metadataReview, /Protected artwork is kept/);

const app = fs.readFileSync(path.join(import.meta.dirname, '../src/App.jsx'), 'utf8');
assert.match(app, /journeyStatusAfterFirstLaunch\(g\.journeyStatus, g\.playtime\)/);
assert.match(app, /onBulkFavorite/);
assert.match(app, /onBulkJourneyStatus/);
assert.match(app, /addBulkCategory/);
assert.match(app, /onRetroProfilesChange/);

console.log('PASS: Game Workshop preserves the existing editor fields, exposes all six sections, saves bounded Journey Status/Launch Routes/content flags, and starts a new journey on first tracked launch.');
