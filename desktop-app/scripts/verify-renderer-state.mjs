import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import {
  EMPTY_LIBRARY, hydrateLibrary, selectWorkspace, filterByLauncher, deleteWorkspaceCategory,
  clearRegularGameCategories, reorderWorkspaceCategory, moveWorkspaceItem, reorderWorkspaceItem, applyGameSession,
} from '../src/state/library-state.mjs';
import { lockedCategoryIds, gameLockedCategoryMap, redactLockedHomeGames, visibleUnlockedGames, panicLockResult, privacyAuditPayload } from '../src/state/privacy-state.mjs';
import { hydrateNavigation, navigationTransition, preferredLibraryGame, preferredTool, selectionSettingsPatch } from '../src/state/navigation-state.mjs';
import { DEFAULT_SETTINGS, hydrateSettings, mergeSettings, visualState } from '../src/state/settings-state.mjs';
import { EMPTY_REFRESH_QUEUE, metadataRefreshTargets, startRefreshQueue, advanceRefreshQueue, stopRefreshQueue } from '../src/state/metadata-refresh-state.mjs';
import { sessionResult, applyPlaytimeImport } from '../src/state/playtime-state.mjs';
import { getRendererApi, hasRendererApi, callRendererApi } from '../src/services/renderer-api.mjs';
import { withGpuSetupTools } from '../src/state/tool-bootstrap-state.mjs';
import { mascotLibraryContext } from '../src/services/mascot-library-context.mjs';
import { LAUNCHER_CATEGORIES, LAUNCHER_LABELS, assignLauncherCategory, ensureLauncherCategory, launcherCategory } from '../src/state/launcher-category-state.mjs';
import { mergeUpdateStatusLedger } from '../src/state/update-ledger-state.mjs';

const now = 2_000_000_000_000;
const raw = {
  games: [
    { id: 'safe', name: 'Safe', launcher: 'steam', categoryIds: ['regular'], playtime: 60, lastPlayedAt: 20, genres: ['Action'] },
    { id: 'secret', name: 'Secret Name', launcher: 'itch', exePath: 'C:/secret.exe', coverUrl: 'secret.jpg', website: 'https://secret.test', categoryIds: ['private'], playtime: 120, lastPlayedAt: 10, rating: 5 },
    { id: 'other', name: 'Other', launcher: 'custom', categoryIds: [], lastPlayedAt: 30 },
  ],
  categories: [{ id: 'regular', name: 'Regular' }, { id: 'private', name: 'Private Games', private: true }],
  gameOrderByCategory: { regular: ['safe'], private: ['secret'] },
  tools: [{ id: 'tool', name: 'GPU-Z' }], toolCategories: [{ id: 'utilities', name: 'Utilities' }], toolOrderByCategory: {},
};

const hydrated = hydrateLibrary(raw, {
  now, resetRatings: true, taxonomyVersion: 4,
  normalizeGenres: ({ rawTags }) => ({ taxonomyVersion: 4, core: rawTags }),
});
assert.equal(hydrated.games[0].addedAt, now);
assert.equal(hydrated.games[0].librarySeenAt, now);
assert.deepEqual(hydrated.games[0].genreProfile.core, ['Action']);
assert.equal('rating' in hydrated.games[1], false);
assert.deepEqual(selectWorkspace(hydrated, 'tools').items.map(item => item.id), ['tool']);
assert.deepEqual(filterByLauncher(hydrated.games, 'steam').map(item => item.id), ['safe']);
assert.deepEqual(filterByLauncher(hydrated.games, 'other').map(item => item.id), ['other']);

const deleted = deleteWorkspaceCategory(hydrated, 'library', 'regular');
assert.equal(deleted.categories.some(category => category.id === 'regular'), false);
assert.deepEqual(deleted.games.find(game => game.id === 'safe').categoryIds, []);
assert.equal('regular' in deleted.gameOrderByCategory, false);
const privateOnly = clearRegularGameCategories(hydrated);
assert.deepEqual(privateOnly.categories.map(category => category.id), ['private']);
assert.deepEqual(privateOnly.games.find(game => game.id === 'safe').categoryIds, []);
const reorderedCats = reorderWorkspaceCategory(hydrated, 'library', 'private', 'regular');
assert.deepEqual(reorderedCats.categories.map(category => category.id), ['private', 'regular']);
const moved = moveWorkspaceItem(hydrated, 'library', 'safe', 'regular', 'private');
assert.deepEqual(moved.games.find(game => game.id === 'safe').categoryIds, ['private']);
assert.deepEqual(moved.gameOrderByCategory.private, ['secret', 'safe']);
const reorderedItems = reorderWorkspaceItem({ ...hydrated, gameOrderByCategory: { regular: ['safe', 'other'] } }, 'library', 'regular', 'other', 'safe');
assert.deepEqual(reorderedItems.gameOrderByCategory.regular, ['other', 'safe']);
assert.equal(applyGameSession(hydrated, 'safe', 120, now).games[0].playtime, 62);

assert.deepEqual([...lockedCategoryIds(hydrated.categories, [])], ['private']);
assert.equal(gameLockedCategoryMap(hydrated.games, hydrated.categories, []).secret, 'Private Games');
const redacted = redactLockedHomeGames(hydrated.games, hydrated.categories, []);
const protectedGame = redacted.find(game => game.id === 'secret');
assert.equal(protectedGame.name, 'Locked game');
for (const forbidden of ['exePath', 'coverUrl', 'website', 'source', 'appid']) assert.equal(forbidden in protectedGame, false, `${forbidden} leaked from a locked game`);
assert.deepEqual(visibleUnlockedGames(hydrated.games, hydrated.categories, []).map(game => game.id), ['safe', 'other']);
assert.deepEqual(visibleUnlockedGames(hydrated.games, hydrated.categories, ['private']).map(game => game.id), ['safe', 'secret', 'other']);
assert.deepEqual(panicLockResult(hydrated.games, hydrated.categories, () => 0), { unlockedCategories: [], selectedGameId: 'safe', hasPrivate: true });
assert.deepEqual(privacyAuditPayload(protectedGame), protectedGame);

const nav = hydrateNavigation({ mode: 'library', lastGameId: 'secret', lastToolId: 'tool' }, hydrated);
assert.deepEqual(nav, { mode: 'home', selectedGameId: 'secret', selectedToolId: 'tool' }, 'Home remains startup while remembered selections survive restart');
assert.equal(preferredLibraryGame(hydrated.games, 'safe').id, 'safe');
assert.equal(preferredLibraryGame(hydrated.games, 'missing').id, 'other');
assert.equal(preferredTool(hydrated.tools, 'tool').id, 'tool');
const home = navigationTransition(nav, { type: 'OPEN_HOME' }, hydrated);
const wall = navigationTransition(home, { type: 'OPEN_WALL' }, hydrated);
const back = navigationTransition(wall, { type: 'OPEN_LIBRARY' }, hydrated);
assert.equal(back.selectedGameId, 'secret');
assert.deepEqual(selectionSettingsPatch(back), { lastGameId: 'secret', lastToolId: 'tool' });

const settings = hydrateSettings({ theme: 'anime', mode: 'wall', collapsed: { x: true } }, { resetRatings: true });
assert.equal(settings.mode, 'home'); assert.deepEqual(settings.collapsed, {}); assert.equal(settings.ratingSystemVersion, 2);
assert.equal(mergeSettings(settings, { theme: 'pro' }).theme, 'pro');
assert.deepEqual(DEFAULT_SETTINGS.collapsed, {});
assert.equal(DEFAULT_SETTINGS.libraryIconMode, false);
assert.equal(DEFAULT_SETTINGS.libraryIconSize, 48);
assert.equal(DEFAULT_SETTINGS.libraryIconSpacing, 8);
assert.equal(DEFAULT_SETTINGS.libraryIconRows, 3);
const visuals = visualState({ theme: 'anime', specialDecorationOpacity: 50, effectsLevel: 2, motionCadence: 'calm' });
assert.equal(visuals.decorationOpacity, 0.425); assert.equal(visuals.navigationDecorationOpacity, 0.5); assert.equal(visuals.motionCadence, 'calm');
assert.equal(visualState({ theme: 'anime' }, true).decorationOpacity, 0);

const stale = { id: 'safe', metadataFetchedAt: now - 91 * 86400000, coverUrl: 'x', about: 'x', genres: ['x'] };
const manual = { id: 'manual', manualOverride: true };
assert.deepEqual(metadataRefreshTargets([stale, manual], 'missing', now).map(item => item.id), ['safe']);
assert.deepEqual(metadataRefreshTargets([stale, manual], 'full', now).map(item => item.id), ['safe']);
const queue = startRefreshQueue([{ id: 'safe' }, { id: 'gone' }, { id: 'secret' }]);
const advanced = advanceRefreshQueue(queue, 'repaired', ['safe', 'secret']);
assert.equal(advanced.nextId, 'secret'); assert.equal(advanced.queue.repaired, 1);
const complete = advanceRefreshQueue(advanced.queue, 'skipped', ['safe', 'secret']);
assert.equal(complete.complete, true); assert.equal(complete.repaired, 1); assert.equal(complete.skipped, 1);
const stoppedQueue = stopRefreshQueue({ ...queue, repaired: 2, skipped: 3 });
assert.deepEqual(stoppedQueue.queue, { ...EMPTY_REFRESH_QUEUE });
assert.equal(stoppedQueue.repaired, 2);
assert.equal(stoppedQueue.skipped, 3);
assert.equal(stoppedQueue.operation.status, 'cancelled');

const session = sessionResult({ playtime: 5 }, 15 * 60, now);
assert.equal(session.patch.playtime, 20); assert.equal(session.shouldPromptRating, true);
assert.equal(sessionResult({ rating: 4 }, 15 * 60, now).shouldPromptRating, false);
assert.equal(applyPlaytimeImport([{ id: 'safe', playtime: 1 }], [{ id: 'safe', playtime: 22, lastPlayedAt: 9 }], now)[0].playtimeImportedAt, now);

const fakeApi = { async ping(value) { return { value }; }, async fail() { throw new Error('no'); } };
const gateway = getRendererApi({ api: fakeApi });
assert.notEqual(gateway, fakeApi); assert.equal(getRendererApi({ api: fakeApi }), gateway, 'one bridge gets one stable gateway');
assert.equal(hasRendererApi({ api: fakeApi }), true); assert.equal(hasRendererApi({}), false);
assert.deepEqual(await gateway.ping(7), { value: 7 });
assert.deepEqual(await callRendererApi(gateway, 'ping', 7), { value: 7 }); assert.equal(await callRendererApi(gateway, 'fail', null, 'safe'), 'safe');

const bootstrappedTools = withGpuSetupTools({
  tools: [{ id: 'mine', name: 'GPU Z', exePath: 'D:/Tools/gpuz.exe', custom: 'preserved', addedAt: 5 }],
  toolCategories: [],
}, {
  utilities: { gpuz: { exePath: 'C:/Detected/gpuz.exe' } },
  controlCenter: { name: 'Windows Graphics', target: 'ms-settings:display-advancedgraphics', source: 'windows-fallback' },
}, 1234);
assert.equal(bootstrappedTools.tools.find(tool => tool.id === 'mine').exePath, 'D:/Tools/gpuz.exe', 'a player tool path must win over a detected default');
assert.equal(bootstrappedTools.tools.find(tool => tool.id === 'mine').custom, 'preserved');
assert.equal(bootstrappedTools.tools.some(tool => tool.id === 'managed-cpuz'), true);
assert.equal(bootstrappedTools.tools.some(tool => tool.id === 'managed-gpu-control-center'), true);
assert.deepEqual(bootstrappedTools.toolCategories.map(category => category.id), ['__hardware_tools__']);
assert.equal(withGpuSetupTools(bootstrappedTools, {}, 1234).tools.filter(tool => tool.managedTool === 'gpuz').length, 1, 'hardware bootstrap must be idempotent');
const mascotContext = mascotLibraryContext([{ name: 'Visible', source: 'steam', genres: ['Action'], myRating: 4.5, playtime: 120, exePath: 'C:/private/path.exe' }]);
assert.match(mascotContext, /Visible \[steam\].*Action.*4\.5\/5.*2h played/);
assert(!mascotContext.includes('private/path'), 'mascot context must not serialize paths');
assert(mascotLibraryContext(Array.from({ length: 500 }, (_, index) => ({ name: `Game ${index}` }))).length <= 24_000);
assert.equal(Object.keys(LAUNCHER_CATEGORIES).length, 10);
assert.equal(Object.keys(LAUNCHER_LABELS).length, 10);
assert.equal(launcherCategory('BattleNet').id, '__launcher_battlenet__');
assert.equal(launcherCategory('unknown'), null);
assert.deepEqual(assignLauncherCategory(['favourite', '__launcher_steam__'], 'steam'), ['favourite', '__launcher_steam__']);
const categorized = ensureLauncherCategory([{ id: 'favourite' }], 'epic');
assert.deepEqual(categorized.map(category => category.id), ['favourite', '__launcher_epic__']);
assert.equal(ensureLauncherCategory(categorized, 'epic'), categorized, 'existing launcher category must retain array identity');
const ledgerSettings = { theme: 'anime', updateStatusLedger: { old: { id: 'old', status: 'current', checkedAt: 1 } } };
assert.equal(mergeUpdateStatusLedger(ledgerSettings, { ledger: [] }), ledgerSettings, 'empty scans must not rewrite settings');
const mergedLedger = mergeUpdateStatusLedger(ledgerSettings, { ledger: [{ id: 'new', status: 'available', checkedAt: 3 }, { id: '', status: 'invalid' }] }, 1);
assert.equal(mergedLedger.theme, 'anime');
assert.deepEqual(Object.keys(mergedLedger.updateStatusLedger), ['new']);

const here = path.dirname(fileURLToPath(import.meta.url));
const appSource = fs.readFileSync(path.join(here, '..', 'src', 'App.jsx'), 'utf8');
const visualsSource = fs.readFileSync(path.join(here, '..', 'src', 'components', 'ThemeVisuals.jsx'), 'utf8');
const storeSource = fs.readFileSync(path.join(here, '..', 'src', 'state', 'use-renderer-store.mjs'), 'utf8');
const require = createRequire(import.meta.url);
const babel = createRequire(require.resolve('@vitejs/plugin-react'))('@babel/core');
babel.parseSync(appSource, { configFile: false, babelrc: false, parserOpts: { plugins: ['jsx'], sourceType: 'module' } });
babel.parseSync(visualsSource, { configFile: false, babelrc: false, parserOpts: { plugins: ['jsx'], sourceType: 'module' } });
babel.parseSync(storeSource, { configFile: false, babelrc: false, parserOpts: { sourceType: 'module' } });
for (const moduleName of ['library-state.mjs', 'privacy-state.mjs', 'navigation-state.mjs', 'settings-state.mjs', 'metadata-refresh-state.mjs', 'playtime-state.mjs', 'tool-bootstrap-state.mjs', 'launcher-category-state.mjs', 'update-ledger-state.mjs', 'renderer-api.mjs', 'mascot-library-context.mjs', 'use-renderer-store.mjs']) {
  assert(appSource.includes(moduleName), `App.jsx must consume ${moduleName}`);
}
assert(!appSource.includes('window.api.'), 'App.jsx must use the renderer API boundary instead of direct native calls');
assert(appSource.includes('redactLockedHomeGames('), 'global Home privacy redaction must use its tested selector');
assert(appSource.includes('visibleUnlockedGames('), 'Wall/preview privacy must use its tested selector');
assert(appSource.includes("from './components/ThemeVisuals'"), 'theme rendering must not remain embedded in App.jsx');
assert(!appSource.includes('function ThemeArtwork('), 'theme artwork implementation belongs to the visual boundary');
assert(storeSource.includes('nativeApi?.saveLibrary?.(library)') && storeSource.includes('nativeApi?.saveSettings?.(next)'), 'renderer store owns library/settings persistence');

console.log('PASS: renderer state domains cover library/category transitions, restart-safe navigation, global private-game redaction, panic locking, metadata queues, playtime, settings/visual state and a single native API boundary. Pure fixtures only.');
