import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { appendArtworkRevision, artworkSnapshot, normalizeArtworkLocks } from '../src/lib/artwork-revision-model.mjs';
import { normalizeLaunchRoutes, primaryLaunchRoute } from '../src/lib/game-launch-routes-model.mjs';
import { JOURNEY_STATUSES, journeyStatusAfterFirstLaunch, normalizeJourneyStatus } from '../src/lib/game-journey-model.mjs';
import { gameSignals, GAME_SIGNAL_DEFINITIONS } from '../src/lib/game-signals-model.mjs';
import { moveWallColumn, normalizeWallColumns, visibleWallColumns, WALL_COLUMN_DEFINITIONS } from '../src/components/library/wall-columns-model.mjs';
import { clampSidebarWidth } from '../src/components/library/sidebar-resize-model.mjs';
import { collectionCategoryAssignment, collectionExternalRootAssignment, collectionReviewPlan, createCollectionReviewWorkflow } from '../src/services/collection-mode.mjs';
import { mergeRetroImport } from '../src/state/retro-import-state.mjs';
import { externalRootForGame, normalizeExternalLibraryRoots } from '../src/lib/externalLibraryRoots.mjs';

const roots = normalizeExternalLibraryRoots([
  { id: 'drive', name: 'External', kind: 'removable', location: 'D:\\Games', private: true },
  { id: 'nested', name: 'Favorites', kind: 'network', location: 'D:\\Games\\Favorites', private: false },
  { id: 'duplicate', name: 'Duplicate', kind: 'removable', location: 'd:\\games\\' },
  { id: 'cloud', name: 'Catalogue', kind: 'cloud', location: 'https://example.com/library' },
  { id: 'nas', name: 'NAS', kind: 'network', location: '\\\\server\\share\\Games' },
  { id: 'relative', name: 'Unsafe', kind: 'local', location: '..\\Games' },
  { id: 'traversal', name: 'Traversal', kind: 'local', location: 'D:\\Games\\..\\Windows' },
  { id: 'credential-link', name: 'Unsafe link', kind: 'cloud', location: 'https://user:secret@example.com/library' },
]);
assert.equal(roots.length, 4);
assert.equal(roots[0].private, true);
assert.equal(externalRootForGame({ exePath: 'D:\\Games\\Favorites\\game.exe' }, roots)?.id, 'nested');
assert.equal(externalRootForGame({ exePath: 'D:\\Games2\\game.exe' }, roots), null);
assert.equal(externalRootForGame({ exePath: '\\\\server\\share\\Games\\game.exe' }, roots)?.id, 'nas');
assert.equal(externalRootForGame({ exePath: 'https://example.com/library/game' }, roots), null);

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
assert.equal(columns[0].label, 'Game');
assert.equal(columns[0].minWidth, 220);
assert.equal(columns.find(({ id }) => id === 'rating').width, 70);
assert.equal(visibleWallColumns([{ id: 'mainGenre', visible: false }]).some(({ id }) => id === 'mainGenre'), false);
assert.equal(WALL_COLUMN_DEFINITIONS.some(({ id }) => id === 'journeyStatus'), true);
assert.deepEqual(moveWallColumn(columns, 'mainGenre', -1).map(({ id }) => id).slice(0, 3), ['game', 'mainGenre', 'rating']);
assert.equal(moveWallColumn(columns, 'game', 1)[0].id, 'game', 'Game column cannot be moved away from first');
assert.equal(clampSidebarWidth(100, 1920), 220);
assert.equal(clampSidebarWidth(800, 900), 580, 'narrow windows must retain room for Preview');
assert.equal(clampSidebarWidth(500, 1920), 500);

assert.deepEqual(collectionCategoryAssignment([{ id: 'a', categoryIds: ['first'] }, { id: 'b' }], ['a', 'b'], 'second'), [{ id: 'a', categoryIds: ['first', 'second'] }, { id: 'b', categoryIds: ['second'] }]);
assert.deepEqual(collectionReviewPlan([{ id: 'a', manualOverride: true }, { id: 'b' }], ['a', 'b'], 'metadata'), { kind: 'metadata', selected: [{ id: 'a', manualOverride: true }, { id: 'b' }], targets: [{ id: 'b' }], skipped: 1, field: 'all-locked' });
assert.deepEqual(collectionExternalRootAssignment([{ id: 'a' }, { id: 'b' }], ['a'], 'nas', [{ id: 'nas', enabled: true }]), [{ id: 'a', externalLibraryRootId: 'nas' }, { id: 'b' }]);
assert.deepEqual(collectionExternalRootAssignment([{ id: 'a' }], ['a'], 'missing', []), [{ id: 'a' }], 'unknown roots cannot write arbitrary paths');
let confirm = null, review = null, protectedLibrary = null;
const collectionWorkflow = createCollectionReviewWorkflow({ games: [{ id: 'a' }, { id: 'b' }], categories: [{ id: 'secret', name: 'Secret', private: true }], unlockedCategoryIds: ['secret'], setConfirmCfg: (value) => { confirm = value; }, setRefreshReview: (value) => { review = value; }, setLibrary: (apply) => { protectedLibrary = apply({ games: [{ id: 'a' }, { id: 'b' }] }); } });
collectionWorkflow.reviewArtwork(['a', 'b']); confirm.onConfirm();
assert.equal(review.field, 'artwork'); assert.equal(review.games.length, 2);
collectionWorkflow.protect(['a'], 'secret'); confirm.onConfirm();
assert.deepEqual(protectedLibrary.games[0].categoryIds, ['secret']);
const retroImport = mergeRetroImport({ games: [{ id: 'old', romPath: 'D:\\ROMs\\Old.sfc' }], categories: [] }, [{ name: 'Old duplicate', exePath: 'C:\\emu.exe', romPath: 'd:/roms/old.sfc', retroPlatform: 'snes', platform: 'Super Nintendo', categoryIds: ['retro-snes'] }, { name: 'New', exePath: 'C:\\emu.exe', romPath: 'D:\\ROMs\\New.sfc', retroPlatform: 'snes', platform: 'Super Nintendo', categoryIds: ['retro-snes'] }], () => 'new-id', 10);
assert.equal(retroImport.imported.length, 1);
assert.equal(retroImport.library.categories[0].id, 'retro-snes');
const appSource = fs.readFileSync(path.join(import.meta.dirname, '../src/App.jsx'), 'utf8');
const retroImportFlow = appSource.slice(appSource.indexOf('const importRetroGames ='), appSource.indexOf('const addTool =', appSource.indexOf('const importRetroGames =')));
assert.match(retroImportFlow, /setShowWizard\(false\)/, 'Retro import closes Wizard before metadata review');
assert.match(retroImportFlow, /setRefreshReview\(\{ games: result\.imported, index: 0, field: 'all-locked' \}\)/, 'Only newly imported ROMs enter one-by-one metadata review');

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
assert.match(workshop, /SteamGridDbGallery/);
assert.match(workshop, /steamGridDbArtwork/);
assert.match(workshop, /Use this/);
assert.match(workshop, /asset\.width && asset\.height/);

const wall = fs.readFileSync(path.join(import.meta.dirname, '../src/components/CoverWall.jsx'), 'utf8');
assert.match(wall, /wall-select-games/);
assert.match(wall, /wall-collection-actions/);
assert.match(wall, /onBulkFavorite/);
assert.match(wall, /onBulkJourneyStatus/);
assert.match(wall, /onBulkAddCategory/);
assert.match(wall, /onBulkReviewMetadata/);
assert.match(wall, /onBulkReviewArtwork/);
assert.match(wall, /onBulkProtect/);
assert.match(wall, /wall-cover-shape/);
assert.match(wall, /coverShape === 'square' \? 'aspect-square' : 'aspect-\[2\/3\]'/);
assert.match(wall, /moveWallColumn\(columns, column\.id/);
assert.match(wall, /Reset columns/);
assert.match(wall, /data-wall-column-resize=\{column\.id\}/);
assert.match(wall, /list\.style\.setProperty\('--wall-columns'/, 'column dragging must preview every platform section');
assert.match(wall, /if \(width !== column\.width\) onResize\?\.\(column\.id, width\)/, 'column dragging saves once on release');

const sidebar = fs.readFileSync(path.join(import.meta.dirname, '../src/components/Sidebar.jsx'), 'utf8');
assert.match(sidebar, /sidebar-select-games/);
assert.match(sidebar, /sidebar-collection-actions/);
assert.match(sidebar, /onBulkFavorite/);
assert.match(sidebar, /onBulkJourneyStatus/);
assert.match(sidebar, /onBulkAddCategory/);
assert.match(sidebar, /onBulkReviewMetadata/);
assert.match(sidebar, /onBulkReviewArtwork/);
assert.match(sidebar, /onBulkProtect/);
assert.match(sidebar, /SidebarResizeHandle width=\{sidebarWidth\} onCommit=\{onResizeSidebar\}/);
const resizeHandle = fs.readFileSync(path.join(import.meta.dirname, '../src/components/library/SidebarResizeHandle.jsx'), 'utf8');
assert.match(resizeHandle, /role="separator" tabIndex=\{0\}/);
assert.match(resizeHandle, /setPointerCapture/);
assert.match(resizeHandle, /onPointerUp/);
assert.match(resizeHandle, /onKeyDown/);
assert.match(resizeHandle, /if \(next !== width\) onCommit\?\.\(next\)/, 'dragged width is saved once on release');

const wizard = fs.readFileSync(path.join(import.meta.dirname, '../src/components/WizardModal.jsx'), 'utf8');
assert.match(wizard, /Retro Library/);
assert.match(wizard, /onImportRoms/);
const retroPanel = fs.readFileSync(path.join(import.meta.dirname, '../src/components/wizard/RetroProfilesPanel.jsx'), 'utf8');
assert.match(retroPanel, /scanRoms/);
assert.match(retroPanel, /retro-rom-review/);
assert.match(retroPanel, /retro-profile-save/);
assert.match(retroPanel, /NEO-LIB never supplies emulators, BIOS files or ROMs/);
assert.match(wall, /wall-platform-sections/);

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
assert.match(app, /onCoverShapeChange=\{\(coverWallShape\) => updateSetting\(\{ coverWallShape \}\)\}/);

console.log('PASS: Game Workshop preserves the existing editor fields, exposes all six sections, saves bounded Journey Status/Launch Routes/content flags, and starts a new journey on first tracked launch.');
