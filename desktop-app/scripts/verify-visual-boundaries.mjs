import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { getChronicle, getLibraryHealth, getRecommendations, maskHomeNews, maskHomeUpdates, normaliseGameUpdates } from '../src/components/home/home-model.mjs';
import { LIBRARY_FONT_OPTIONS, libraryFontFamily } from '../src/components/library/library-visual-model.mjs';
import { splitLibrarySections } from '../src/components/library/library-tree-model.mjs';
import { appendMascotNotice, libraryCommandFor, messageFor, noticeCooldownMs, voiceForNotice } from '../src/components/mascot/fungist-model.mjs';
import { previewIdentityGroups, previewMedia, previewStoryParagraphs } from '../src/components/preview/preview-information-model.mjs';
import { manifestPresentation, newsAgeLabel, updatePresentation } from '../src/components/preview/preview-status-model.mjs';
import { createDemoLibrary } from '../src/state/demo-library.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const components = path.join(root, 'src', 'components');
const parserPackage = fs.readdirSync(path.join(root, 'node_modules', '.pnpm')).find((name) => name.startsWith('@babel+parser@'));
assert.ok(parserPackage, 'The renderer verification needs the Babel parser already bundled with Vite React');
const parser = await import(pathToFileURL(path.join(root, 'node_modules', '.pnpm', parserPackage, 'node_modules', '@babel', 'parser', 'lib', 'index.js')).href);
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const lines = (relative) => read(relative).split(/\r?\n/).length;

function filesBelow(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? filesBelow(path.join(directory, entry.name)) : [path.join(directory, entry.name)]);
}

for (const filename of filesBelow(components).filter((value) => /\.(?:jsx|js|mjs)$/.test(value))) {
  parser.parse(fs.readFileSync(filename, 'utf8'), { sourceType: 'module', plugins: ['jsx', 'importMeta'] });
}

const appSource = read('src/App.jsx');
const appModalSource = read('src/components/app/AppModalLayer.jsx');
const metadataWorkflowSource = read('src/services/metadata-workflow.mjs');
const categoryPrivacyWorkflowSource = read('src/services/category-privacy-workflow.mjs');
assert.ok(lines('src/App.jsx') < 1800, 'Dialog, metadata and category/privacy workflows must remain outside the App root');
assert.ok(lines('src/components/app/AppModalLayer.jsx') < 600, 'The app modal layer must remain presentation-only and bounded');
assert.match(appSource, /components\/app\/AppModalLayer/);
assert.match(appSource, /state\/demo-library\.mjs/);
assert.match(appSource, /services\/metadata-workflow\.mjs/);
assert.match(appSource, /services\/category-privacy-workflow\.mjs/);
assert.doesNotMatch(appSource, /const refetchGame =|const applyAcceptedMetadata =|const beginMetadataRepairQueue =|const requestMetadataRefresh =/);
assert.doesNotMatch(appSource, /const createCategory =|const requestDeleteCategory =|const moveGameToCategory =|const requestUnlock =|const handleCategoryAction =|const panicLockPrivateLibrary =/);
assert.doesNotMatch(appSource, /<(?:AddGameModal|WizardModal|SettingsModal|ControllerCenterModal|CategoryModal|FetchSourcePicker|TidyUpModal|PostPlayRatingModal|FeedbackModal|PlaytimeImportModal|RefreshCandidatesModal|TroubleshootModal|TutorialModal|AutoSortModal|LauncherDetectModal)\b/);
for (const component of ['AddGameModal', 'WizardModal', 'SettingsModal', 'ControllerCenterModal', 'CategoryModal', 'FetchSourcePicker', 'TidyUpModal', 'PostPlayRatingModal', 'FeedbackModal', 'PlaytimeImportModal', 'RefreshCandidatesModal', 'TroubleshootModal', 'TutorialModal', 'AutoSortModal', 'LauncherDetectModal']) {
  assert.match(appModalSource, new RegExp(`<${component}\\b`), `App modal layer lost ${component}`);
}
for (const testId of ['drop-overlay', 'toast']) {
  assert.match(appModalSource, new RegExp(testId), `App modal layer lost ${testId}`);
}
const demoLibrary = createDemoLibrary((pin) => `hashed:${pin}`, Date.UTC(2026, 8, 17));
assert.equal(demoLibrary.games.length, 3);
assert.equal(demoLibrary.categories.find((category) => category.private)?.pinHash, 'hashed:1234');
assert.equal(demoLibrary.tools.length, 3);
assert.equal(demoLibrary.toolCategories[0]?.id, 'tcat-hw');
for (const workflowMember of ['refetchGame', 'applyAcceptedMetadata', 'beginMetadataRepairQueue', 'advanceMetadataRepairQueue', 'stopMetadataRepairQueue', 'requestMetadataRefresh', 'refetchAll']) {
  assert.match(metadataWorkflowSource, new RegExp(workflowMember), `Metadata workflow lost ${workflowMember}`);
}
assert.match(metadataWorkflowSource, /lockedAppid/);
assert.match(metadataWorkflowSource, /authoritativeBattleNet/);
for (const workflowMember of ['createCategory', 'updateCategory', 'requestDeleteCategory', 'clearRegularCategories', 'reorderCategory', 'moveGameToCategory', 'reorderGameInCategory', 'toggleGameInCategory', 'requestUnlock', 'handleCategoryAction', 'panicLockPrivateLibrary']) {
  assert.match(categoryPrivacyWorkflowSource, new RegExp(workflowMember), `Category/privacy workflow lost ${workflowMember}`);
}
assert.match(categoryPrivacyWorkflowSource, /Wrong PIN\./);
assert.match(categoryPrivacyWorkflowSource, /Safe Preview selected/);

assert.ok(lines('src/components/ChangelogModal.jsx') < 220, 'Changelog behavior must stay separate from release content');
assert.ok(lines('src/components/SettingsModal.jsx') < 520, 'Settings screen should use shared control components');
assert.match(read('src/components/SettingsModal.jsx'), /settings\/SettingsControls/);
assert.match(read('src/components/HomeHub.jsx'), /home\/home-model\.mjs/);
assert.match(read('src/components/FungistMascot.jsx'), /mascot\/fungist-model\.mjs/);

const sidebarSource = read('src/components/Sidebar.jsx');
const globalStylesSource = read('src/styles.css');
const libraryVisualsSource = read('src/components/library/LibraryVisualsPopover.jsx');
const libraryTreeSource = read('src/components/library/LibraryTree.jsx');
const libraryToolbarSource = read('src/components/library/LibraryToolbarControls.jsx');
const controlMenuSource = read('src/components/library/AppControlMenu.jsx');
const changelogModalSource = read('src/components/ChangelogModal.jsx');
const hoverTipsSource = read('src/components/HoverTips.jsx');
const stylesSource = read('src/styles.css');
assert.ok(lines('src/components/Sidebar.jsx') < 850, 'Library Visuals, live tree and reusable toolbar controls must remain outside the Sidebar composition root');
assert.ok(lines('src/components/library/LibraryVisualsPopover.jsx') < 520, 'Library Visuals should remain a focused presentation boundary');
assert.match(sidebarSource, /library\/LibraryVisualsPopover/);
assert.match(sidebarSource, /library\/LibraryTree/);
assert.match(sidebarSource, /library\/LibraryToolbarControls/);
assert.doesNotMatch(sidebarSource, /function LibrarySettingsPopover|function BgTexturePicker|function EffectsPopSlider|const BG_TEXTURES/);
assert.doesNotMatch(sidebarSource, /function TwoColumnSections|function SectionWrap|function LibrarySection|function LibraryGameRow|function GameRow|function PinnedStrip|function CategoryContextMenu/);
assert.doesNotMatch(sidebarSource, /function SideBtn|function TabPill|function LauncherDropdown|function LauncherPill/);
assert.match(libraryVisualsSource, /renderForegroundPortal/);
assert.doesNotMatch(libraryVisualsSource, /createPortal/);
assert.doesNotMatch(libraryVisualsSource, /New category|onCreateCategory/, 'Visual Tweaks must not contain library-management actions.');
for (const testId of [
  'library-settings-popover', 'pop-row-size', 'pop-row-gap', 'pop-cat-gap', 'pop-cat-top-gap',
  'pop-icon-position', 'pop-two-row-', 'pop-name-text-size', 'pop-library-font',
  'pop-library-font-fat', 'pop-library-font-cursive', 'pop-cat-text-size', 'pop-category-marker',
  'pop-toggle-subcat-strip', 'pop-cat-glow', 'pop-effects-level', 'visual-motion-cadence',
  'pop-bg-texture', 'pop-bg-tex-opacity', 'visual-cursor-picker', 'visuals-feedback-bug', 'visuals-feedback-suggestion',
  'visuals-feedback-general',
]) {
  assert.match(libraryVisualsSource, new RegExp(testId), `Library Visuals lost ${testId}`);
}
assert.match(libraryVisualsSource, /CURSOR_OPTIONS/);
for (const cursorName of ['windows', 'neon', 'petal', 'pixel']) assert.match(libraryVisualsSource, new RegExp(`id: '${cursorName}'`));
assert.equal(LIBRARY_FONT_OPTIONS.length, 5);
assert.equal(libraryFontFamily('georgia'), 'Georgia, "Times New Roman", serif');
assert.equal(libraryFontFamily('unknown'), LIBRARY_FONT_OPTIONS[0].family);
assert.ok(lines('src/components/library/LibraryTree.jsx') < 900, 'Library tree should remain a focused category and game-row owner');
assert.match(libraryTreeSource, /renderForegroundPortal/);
for (const testId of ['sidebar-twocol', 'section-', 'section-menu-btn-', 'game-row-', 'game-new-badge-', 'game-row-menu-', 'category-context-menu', 'pinned-strip', 'pinned-tile-']) {
  assert.match(libraryTreeSource, new RegExp(testId), `Library tree lost ${testId}`);
}
const splitFixture = [
  { id: 'one', games: [{}, {}, {}] },
  { id: 'two', games: [{}] },
  { id: 'three', games: [{}, {}] },
];
const [leftSections, rightSections] = splitLibrarySections(splitFixture, { rowHeight: 40, categoryTextSize: 11, rowGap: 2, categoryGap: 8 });
assert.deepEqual([...leftSections, ...rightSections].map((section) => section.id), ['one', 'two', 'three']);
assert.equal(new Set([...leftSections, ...rightSections]).size, splitFixture.length, 'Two-column layout must never split or duplicate a category');
assert.deepEqual(splitLibrarySections([], {}), [[], []]);
assert.match(libraryToolbarSource, /NavButtonArtwork/);
for (const testId of ['tab-news-badge', 'launcher-dropdown-toggle', 'launcher-dropdown-menu', 'lp-']) {
  assert.match(libraryToolbarSource, new RegExp(testId), `Library toolbar controls lost ${testId}`);
}
assert.doesNotMatch(libraryToolbarSource, /function LauncherPill/, 'Retired launcher-pill renderer must not return');
assert.match(sidebarSource, /data-testid="sidebar-rest-toggle"/, 'Library toolbar must retain the player-controlled Rest Mode toggle.');
assert.match(sidebarSource, /Rest Zzz/);
assert.match(sidebarSource, /Wake up/);
assert.match(sidebarSource, /manualResting/);
assert.match(appSource, /onWindowVisibility/, 'Tray/background Rest Mode needs the native visibility bridge.');
assert.match(appSource, /manualRestActive/);
assert.match(appSource, /trayRestActive/);
assert.match(appSource, /data-testid="rest-wake-overlay"/, 'Tray wake needs a visible confirmation transition.');
assert.match(appSource, /cursorTheme/, 'The cursor theme needs to be persisted at the app shell.');
assert.match(read('src/components/HomeHub.jsx'), /data-testid="home-game-update-list"/, 'Game updates need their own compact scrolling region.');
assert.match(read('electron/preload.js'), /onWindowVisibility/);
assert.match(read('electron/main.js'), /window:visibility/);
assert.match(globalStylesSource, /\.font-black \{ font-weight: 700; \}/, 'Ordinary heavy text must keep the calmer application-wide weight.');
assert.match(globalStylesSource, /\.font-display\.font-black,/);
assert.match(globalStylesSource, /\.text-4xl\.font-black,/);
assert.match(globalStylesSource, /\[data-testid='mascot-center-modal'\] input\[type='range'\]/, 'Every Mascot Center range control must use the corrected themed slider treatment.');
assert.match(controlMenuSource, /data-testid="app-control-menu-toggle"/);
assert.match(controlMenuSource, /pointer-events-auto/);
assert.match(controlMenuSource, /h-9 w-9/, 'Control Center gear must match the standard navigation-button height.');
assert.match(controlMenuSource, /onMouseDown=\{\(event\) => event\.stopPropagation\(\)\}/);
assert.match(controlMenuSource, /onPointerDown=\{\(event\) => event\.stopPropagation\(\)\}/);
assert.match(controlMenuSource, /open && renderForegroundPortal\(/, 'Control Center must portal its actual menu directly, not pass a portal through an animation wrapper.');
assert.doesNotMatch(controlMenuSource, /<AnimatePresence>/, 'Control Center must not pass a portal object through AnimatePresence.');
assert.match(changelogModalSource, /return unseen\.length \? unseen : CHANGELOG\.slice\(0, 1\)/, 'Manual Patch notes must fall back to the current entry after the player has acknowledged it.');
assert.doesNotMatch(changelogModalSource, /You&apos;re fully caught up/, 'Patch notes must not open as an empty caught-up screen.');
assert.match(hoverTipsSource, /React\.useLayoutEffect/);
assert.match(hoverTipsSource, /anchorTop/);
assert.match(hoverTipsSource, /window\.innerWidth - edge - rect\.width \/ 2/);
assert.match(hoverTipsSource, /belowFits/);
assert.match(stylesSource, /\.neolib-hover-tip[\s\S]*max-height: calc\(100vh - 24px\)/);

const gameDetailSource = read('src/components/GameDetail.jsx');
const previewInformationSource = read('src/components/preview/PreviewInformationPanels.jsx');
const previewHeroSource = read('src/components/preview/PreviewHeroTitle.jsx');
const previewActionSource = read('src/components/preview/PreviewActionBar.jsx');
const previewStatusSource = read('src/components/preview/PreviewStatusCards.jsx');
assert.ok(lines('src/components/GameDetail.jsx') < 260, 'Preview information, hero, actions and status presentation must remain outside GameDetail composition');
assert.match(gameDetailSource, /preview\/PreviewInformationPanels/);
assert.match(gameDetailSource, /preview\/PreviewHeroTitle/);
assert.match(gameDetailSource, /preview\/PreviewActionBar/);
assert.match(gameDetailSource, /preview\/PreviewStatusCards/);
assert.doesNotMatch(gameDetailSource, /function GameStory|function GameMediaGallery|function DetailList|function GenreProfile|function HeroTitle|function StarRating|function ActionBar|function ManagedToolMenu|function SteamManifestLine|function LatestNewsPill|function ManagedToolSetup|function UpdateAvailablePill/);
assert.doesNotMatch(gameDetailSource, /function GalleryBox|function MetaStrip|function ScreenshotStrip/, 'Retired Preview renderers must not return');
for (const testId of ['game-story-panel', 'game-genre-profile', 'game-media-gallery', 'game-detail-list']) {
  assert.match(previewInformationSource, new RegExp(testId), `Preview information lost ${testId}`);
}
assert.deepEqual(previewStoryParagraphs({ about: 'First paragraph.\n\nSecond paragraph.' }), ['First paragraph.', 'Second paragraph.']);
const mediaFixture = Array.from({ length: 10 }, (_, index) => `image-${index}`);
assert.deepEqual(previewMedia({ headerImage: 'image-0', screenshots: mediaFixture }), mediaFixture.slice(0, 8));
assert.deepEqual(previewMedia({ screenshots: null }), []);
assert.deepEqual(previewIdentityGroups([], ['RPG']), [['Source genres', [{ id: 'RPG', label: 'RPG' }]]]);
assert.deepEqual(previewIdentityGroups([], []), []);
for (const testId of ['detail-title', 'game-star-rating', 'star-']) {
  assert.match(previewHeroSource, new RegExp(testId), `Preview hero lost ${testId}`);
}
assert.match(previewHeroSource, /onUpdateGame\?\.\(game\.id, \{ rating: value \}\)/);
for (const testId of ['detail-launch-btn', 'detail-youtube-btn', 'detail-patchnotes-btn', 'detail-mods-btn', 'detail-customize-btn', 'detail-refetch-btn', 'detail-reveal-btn', 'detail-save-manager-btn', 'detail-category-btn']) {
  assert.match(previewActionSource, new RegExp(testId), `Preview actions lost ${testId}`);
}
assert.match(previewActionSource, /renderForegroundPortal/);
assert.match(previewActionSource, /data-neolib-launch="true"/);
for (const testId of ['steam-manifest-line', 'latest-news-pill', 'latest-news-open', 'managed-tool-setup', 'game-update-available']) {
  assert.match(previewStatusSource, new RegExp(testId), `Preview status lost ${testId}`);
}
for (const nativeCall of ['getSteamManifest', 'latestNewsForGame', 'scanGameUpdates', 'openLauncherDownloads']) {
  assert.match(previewStatusSource, new RegExp(nativeCall), `Preview status lost ${nativeCall}`);
}
assert.match(previewStatusSource, /UpdateHistoryModal/);
const statusNow = Date.UTC(2026, 8, 17, 12);
assert.deepEqual(manifestPresentation({ lastUpdated: statusNow - 86400000, sizeOnDisk: 1.5 * 1024 ** 3 }, statusNow), { updated: 'yesterday', size: '1.5 GB' });
assert.deepEqual(manifestPresentation({ sizeOnDisk: 512 * 1024 ** 2 }, statusNow), { updated: null, size: '512 MB' });
assert.equal(newsAgeLabel(statusNow - 2 * 86400000, statusNow), '2d ago');
assert.deepEqual(updatePresentation({ sourceKind: 'watch-page', status: 'attention', currentVersion: '1.0', latestVersion: '1.2' }), { watchPage: true, needsVersionCheck: true, remaining: '1.0 → 1.2' });
assert.deepEqual(updatePresentation({ remainingBytes: 2.25 * 1024 ** 3 }), { watchPage: false, needsVersionCheck: false, remaining: '2.3 GB' });

const componentFiles = filesBelow(components).filter((value) => /\.(?:jsx|js|mjs)$/.test(value));
const rawPortalUsers = componentFiles.filter((filename) => filename !== path.join(components, 'ui', 'VisualBoundary.jsx') && /createPortal/.test(fs.readFileSync(filename, 'utf8')));
assert.deepEqual(rawPortalUsers, [], `Only VisualBoundary may own createPortal: ${rawPortalUsers.join(', ')}`);
assert.match(read('src/components/ui/VisualBoundary.jsx'), /pointer-events-none/);
assert.match(read('src/components/NavButtonArtwork.jsx'), /DecorationLayer/);
assert.doesNotMatch(read('src/components/NavButtonArtwork.jsx'), /onClick=/);

const lockedNews = maskHomeNews({ gameId: 'secret', gameName: 'Real title', title: 'Spoiler', url: 'https://example.com' }, { secret: 'Private' });
assert.equal(lockedNews.gameName, 'Locked game');
assert.equal(lockedNews.url, '');
const lockedUpdates = maskHomeUpdates({ items: [{ id: 'secret', name: 'Real title' }] }, { secret: 'Private' });
assert.equal(lockedUpdates.items[0].name, 'Locked game');
assert.deepEqual(normaliseGameUpdates(null).items, []);

const health = getLibraryHealth([{ id: 'hidden', homeLocked: true }, { id: 'visible', name: 'Visible', coverUrl: 'cover', description: 'Ready', exePath: 'game.exe', genreProfile: { rawTags: ['Action'] } }]);
assert.equal(health.score, 100, 'Private placeholders must not reduce health');
const now = Date.UTC(2026, 8, 16);
const games = [{ id: 'forza', name: 'Forza Horizon 5', genres: ['Racing'], exePath: 'forza.exe', playtime: 600, lastPlayedAt: now - 30 * 86400000, rating: 4.8, addedAt: now - 40 * 86400000 }];
assert.equal(libraryCommandFor('Launch Forza 5', games)?.game?.id, 'forza');
assert.equal(libraryCommandFor('Launch a random racing game', games, () => 0)?.game?.id, 'forza');
assert.equal(getRecommendations(games, [], now)[0]?.game?.id, 'forza');
assert.equal(getChronicle(games, []).length, 2);
assert.equal(messageFor({ healthState: 'high', notificationSettings: {} })?.level, 'major');
assert.equal(messageFor({ activity: { key: 'privacy-test', preferenceKey: 'categoryPrivacy', title: 'Private category protected' }, notificationSettings: {} })?.kind, 'activity');
assert.equal(messageFor({ activity: { key: 'privacy-muted', preferenceKey: 'categoryPrivacy', title: 'Private category protected' }, notificationSettings: { categoryPrivacy: false } }), null);
assert.equal(messageFor({ activity: { key: 'privacy-old', preferenceKey: 'categoryPrivacy', expiresAt: Date.now() - 1, title: 'Private category protected' }, notificationSettings: {} }), null);
assert.equal(noticeCooldownMs({ kind: 'health', level: 'major' }), 300000);
assert.equal(noticeCooldownMs({ kind: 'activity' }), 90000);
assert.equal(voiceForNotice({ kind: 'welcome' }), '');
assert.equal(voiceForNotice({ kind: 'activity', voice: 'take-a-look' }), 'take-a-look');
const noticeInbox = appendMascotNotice([{ key: 'old', createdAt: 1 }], { key: 'new', title: 'News' }, 100, 2);
assert.deepEqual(noticeInbox.map((notice) => notice.key), ['new', 'old']);
assert.equal(noticeInbox[0].createdAt, 100);
assert.equal(appendMascotNotice(noticeInbox, null), noticeInbox);

console.log('Visual/component boundary verification passed.');
