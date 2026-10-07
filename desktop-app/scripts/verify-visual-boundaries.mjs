import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { getChronicle, getLibraryHealth, getRecommendations, maskHomeNews, maskHomeUpdates, normaliseGameUpdates } from '../src/components/home/home-model.mjs';
import { libraryArtworkAudit } from '../src/components/home/library-artwork-audit.mjs';
import { LIBRARY_FONT_OPTIONS, libraryFontFamily } from '../src/components/library/library-visual-model.mjs';
import { splitLibrarySections } from '../src/components/library/library-tree-model.mjs';
import { appendMascotNotice, libraryCommandFor, messageFor, noticeCooldownMs, voiceForNotice } from '../src/components/mascot/fungist-model.mjs';
import { previewIdentityGroups, previewMedia, previewStoryBlocks, previewStoryParagraphs } from '../src/components/preview/preview-information-model.mjs';
import { cleanDescriptionText, formatDescription } from '../src/lib/descriptionFormatting.mjs';
import { DEFAULT_HERO_FILTER, heroImageFilter } from '../src/components/preview/hero-treatment-model.mjs';
import { libraryHeroCandidates, libraryHeroWidth } from '../src/components/preview/library-hero-artwork.mjs';
import { manifestPresentation, newsAgeLabel, updatePresentation } from '../src/components/preview/preview-status-model.mjs';
import { createDemoLibrary } from '../src/state/demo-library.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const components = path.join(root, 'src', 'components');
// Yarn/npm hoist Babel to node_modules, while pnpm keeps it in its content store.
// Accept both layouts so the same verification runs locally and in GitHub Actions.
const flatParser = path.join(root, 'node_modules', '@babel', 'parser', 'lib', 'index.js');
const pnpmStore = path.join(root, 'node_modules', '.pnpm');
const pnpmParserPackage = fs.existsSync(pnpmStore)
  ? fs.readdirSync(pnpmStore).find((name) => name.startsWith('@babel+parser@'))
  : '';
const parserPath = fs.existsSync(flatParser)
  ? flatParser
  : pnpmParserPackage
    ? path.join(pnpmStore, pnpmParserPackage, 'node_modules', '@babel', 'parser', 'lib', 'index.js')
    : '';
assert.ok(parserPath && fs.existsSync(parserPath), 'The renderer verification needs the Babel parser bundled with Vite React');
const parser = await import(pathToFileURL(parserPath).href);
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
assert.ok(lines('src/App.jsx') < 1840, 'Dialog, metadata and category/privacy workflows must remain outside the App root');
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
assert.match(read('src/components/SettingsModal.jsx'), /log in to SteamGridDB → Preferences → API/);
assert.match(read('src/components/SettingsModal.jsx'), /data-testid="settings-steamgriddb-status" role="status"/);
assert.match(read('src/components/SettingsModal.jsx'), /entering it alone does not verify the connection/);
assert.match(read('src/components/HomeHub.jsx'), /home\/home-model\.mjs/);
assert.match(read('src/components/FungistMascot.jsx'), /mascot\/fungist-model\.mjs/);

const sidebarSource = read('src/components/Sidebar.jsx');
const wizardSource = read('src/components/WizardModal.jsx');
const globalStylesSource = read('src/styles.css');
const libraryVisualsSource = read('src/components/library/LibraryVisualsPopover.jsx');
const globalVisualsSource = read('src/components/library/GlobalVisualsPanel.jsx');
const libraryTreeSource = read('src/components/library/LibraryTree.jsx');
const libraryIconGridSource = read('src/components/library/LibraryIconGrid.jsx');
const libraryToolbarSource = read('src/components/library/LibraryToolbarControls.jsx');
const controlMenuSource = read('src/components/library/AppControlMenu.jsx');
const changelogModalSource = read('src/components/ChangelogModal.jsx');
const hoverTipsSource = read('src/components/HoverTips.jsx');
const titleBarSource = read('src/components/TitleBar.jsx');
const stylesSource = read('src/styles.css');
const themeCatalogSource = read('src/lib/utils.js');
assert.equal((themeCatalogSource.match(/tone: 'bright'/g) || []).length, 4, 'Theme Studio must expose four bright themes.');
assert.match(themeCatalogSource, /id: 'monochrome',[^\n]+label: 'Monochrome',[^\n]+tone: 'bright'/);
assert.match(stylesSource, /\[data-theme='monochrome'\]/, 'Monochrome needs its own complete palette.');
assert.match(stylesSource, /\.amb-monochrome/, 'Monochrome needs a dedicated grayscale ambience.');
assert.match(stylesSource, /\.particles--monochrome/, 'Monochrome needs theme-owned particle language.');
assert.match(read('src/components/ThemeVisuals.jsx'), /monochrome: 'amb-monochrome'/);
assert.equal(JSON.parse(read('src/themes/stock/monochrome/theme.json')).layers.sidebar.asset, 'assets/generic-gray-atmosphere.png', 'Monochrome must carry its grayscale atmosphere into the Library.');
assert.ok(lines('src/components/Sidebar.jsx') < 850, 'Library Visuals, live tree and reusable toolbar controls must remain outside the Sidebar composition root');
assert.ok(lines('src/components/library/LibraryVisualsPopover.jsx') < 525, 'Library Visuals should remain a focused presentation boundary');
assert.match(globalVisualsSource, /import LibraryVisualsPopover from '.\/LibraryVisualsPopover'/, 'Visual Tweaks must have an app-level host.');
assert.match(appSource, /visualsOpen && <GlobalVisualsPanel/, 'Visual Tweaks must stay mounted across app views.');
assert.doesNotMatch(sidebarSource, /libSettingsOpen|<LibraryVisualsPopover/, 'Sidebar must not own global Visual Tweaks state.');
assert.match(libraryVisualsSource, /data-testid="visuals-close"/, 'Global Visual Tweaks needs an explicit close button.');
assert.match(libraryVisualsSource, /data-testid="tab-home"[\s\S]*data-testid="wall-open-library"/, 'Primary navigation must not count as an outside click on Visual Tweaks.');
assert.match(sidebarSource, /library\/LibraryIconGrid/);
assert.match(sidebarSource, /library\/LibraryTree/);
assert.match(sidebarSource, /library\/LibraryToolbarControls/);
assert.match(sidebarSource, /data-testid="side-navigation-rail"/, 'Sidebar navigation mode needs a dedicated icon rail.');
assert.match(sidebarSource, /label="Lounge" hint="Couch mode" tone=\{RAIL_GROUP_TONES\.lounge\} expanded=\{expanded\} onClick=\{onEnterLounge\} testid="sidebar-rail-lounge-btn"/, 'Sidebar rail keeps its direct Lounge shortcut');
const railGroups = {
  lounge: ['sidebar-rail-lounge-btn'],
  browse: ['tab-home', 'tab-library', 'tab-cover-wall'],
  tools: ['tab-tools', 'sidebar-rail-wizard-btn', 'sidebar-rail-rest-toggle'],
  personalise: ['sidebar-rail-sidebar-toggle'],
  app: ['sidebar-rail-changelog-btn'],
  exit: ['sidebar-rail-quit-btn'],
};
for (const [group, testids] of Object.entries(railGroups)) {
  assert.match(sidebarSource, new RegExp(`<RailSectionHeader label="[^"]+" tone=\\{RAIL_GROUP_TONES\\.${group}\\}`), `${group} has a visible rail section heading`);
  for (const testid of testids) assert.match(sidebarSource, new RegExp(`<RailNavigationButton[^\\n]+tone=\\{RAIL_GROUP_TONES\\.${group}\\}[^\\n]+testid="${testid}"`), `${testid} uses its section accent`);
}
assert.match(sidebarSource, /<RailActionFlyout[^\n]+label="Visuals"[^\n]+tone=\{RAIL_GROUP_TONES.personalise\}/, 'Visuals groups the two presentation actions');
assert.match(sidebarSource, /<RailActionFlyout[^\n]+label="Settings"[^\n]+tone=\{RAIL_GROUP_TONES.app\}/, 'Settings groups app configuration/help actions');
assert.match(sidebarSource, /className="neo-rail-section"/, 'section headings retain a labelled rule in the expanded rail');
assert.match(sidebarSource, /manualResting \? 'Wake up' : 'Rest Zzz'/, 'Rest and Wake remain distinguishable by text and active state');
for (const hint of ['Your dashboard', 'Browse games', 'Cover view', 'Utilities', 'Couch mode', 'Add games', 'Pause background', 'Resume activity']) {
  assert.ok(sidebarSource.includes(hint), `Expanded navigation needs a concise explanation: ${hint}`);
}
assert.match(controlMenuSource, /App controls<\/span>/, 'Expanded Menu needs a concise explanation.');
assert.match(sidebarSource, /expanded \? 'max-w-\[104px\][^']*opacity-100' : 'max-w-0[^']*opacity-0'/, 'Navigation helper text must disappear in the collapsed rail.');
assert.match(sidebarSource, /<Home size=\{21\}[\s\S]*?<LibIcon size=\{21\}[\s\S]*?<Columns size=\{21\}[\s\S]*?<Boxes size=\{21\}/, 'Sidebar navigation icons must use one larger size.');
assert.match(sidebarSource, /expanded \? 'justify-start gap-2\.5 px-2' : 'justify-center gap-0 px-0'/, 'Collapsed sidebar icons must remain centered.');
assert.match(controlMenuSource, /sidebarMode \? <span className="neo-rail-button__icon grid h-6 w-6 shrink-0 place-items-center"><Settings2 size=\{21\}/, 'Collapsed sidebar menu icon must not shrink away.');
assert.match(sidebarSource, /style=\{\{ width: expanded \? 148 : 48 \}\}/, 'The navigation rail must expand on hover without permanently consuming Library width.');
assert.match(appSource, /settings\.navigationLayout === 'sidebar' && <SideNavigationRail[\s\S]*?!wallActive && <Sidebar/, 'The rail must be a workspace sibling before Library and remain available on Wall.');
assert.match(sidebarSource, /data-testid="side-navigation-slot"/, 'The rail must reserve its own fixed-width workspace strip.');
assert.doesNotMatch(sidebarSource, /paddingLeft: sideNavigation/, 'Sidebar mode must not indent Library content to make room for navigation.');
assert.match(sidebarSource, /!sideNavigation && \(\(\) =>/, 'The default top tabs must be replaced rather than duplicated in Sidebar mode.');
assert.match(libraryVisualsSource, /data-testid="pop-navigation-layout"/, 'Visual Tweaks must expose Default top and Sidebar navigation choices.');
assert.match(controlMenuSource, /data-testid=\{testid\} role="switch"/, 'Control Center must provide a real accessible navigation-layout switch.');
assert.match(controlMenuSource, /testid="app-menu-sidebar-toggle"/, 'The Sidebar switch must live under Control Center Personalise.');
assert.match(sidebarSource, /testid="sidebar-wizard-btn"/, 'Library must retain Wizard as its single game-add entry point.');
assert.match(sidebarSource, /\(!sideNavigation \|\| isTools\) && \(\(\) =>/, 'Sidebar layout must remove the redundant Library action row.');
assert.match(sidebarSource, /!isTools && !sideNavigation && <button type="button" data-testid="sidebar-select-games"/, 'Default layout must keep Select in the Library action row.');
assert.match(sidebarSource, /sideNavigation && <button type="button" data-testid="sidebar-select-games"/, 'Sidebar layout must move Select beside Library filters.');
assert.match(sidebarSource, /testid="side-navigation-primary-divider"[\s\S]*?testid="sidebar-rail-wizard-btn"[\s\S]*?testid="sidebar-rail-rest-toggle"/, 'Sidebar actions sit below their labelled section break.');
assert.match(appSource, /onOpenWizard=\{\(\) => setShowWizard\(true\)\} manualResting=\{manualRestActive\} onToggleManualRest=\{toggleManualRest\}/, 'The rail must receive the real Wizard and Rest handlers.');
assert.doesNotMatch(sidebarSource, /testid="sidebar-add-btn"|data-testid="add-menu-game"/, 'Library must not restore a duplicate Add-game control outside Wizard.');
assert.match(wizardSource, /data-testid="wizard-manual-add-section"/, 'Wizard must visibly own the manual add route.');
assert.match(wizardSource, /data-testid="wizard-add-manual-start-btn"/, 'Wizard manual add needs a direct action.');
assert.match(wizardSource, /data-testid="wizard-library-care-section"/, 'Wizard must visibly own Library-wide refresh and tidy actions.');
for (const testId of ['wizard-refresh-missing-btn', 'wizard-refresh-full-btn', 'wizard-tidy-library-btn']) {
  assert.match(wizardSource, new RegExp(testId), `Wizard lost ${testId}`);
}
assert.doesNotMatch(sidebarSource, /sidebar-refresh-menu-btn|refresh-menu-refresh|refresh-menu-full|refresh-menu-tidy/, 'Library Refresh must not be duplicated outside Wizard.');
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
  'pop-library-view-mode', 'pop-icon-mode-controls', 'pop-library-icon-size',
  'pop-library-icon-spacing', 'pop-library-icon-rows', 'pop-standard-library-controls',
  'pop-text-category-controls',
]) {
  assert.match(libraryVisualsSource, new RegExp(testId), `Library Visuals lost ${testId}`);
}
assert.match(libraryVisualsSource, /libraryRight \+ 12/, 'Visual Tweaks should prefer opening beside the Library and the navigation strip.');
assert.match(libraryVisualsSource, /fieldset disabled=\{libraryIconMode\}/, 'Icon mode must disable incompatible standard Library controls.');
assert.match(libraryVisualsSource, /fieldset disabled=\{!libraryIconMode\}/, 'Icon-only controls must stay inactive in standard mode.');
assert.match(sidebarSource, /libraryIconMode \? \(/, 'Icon mode must replace category and pinned presentation, not layer over it.');
assert.match(sidebarSource, /const labelsVisible = !libraryIconMode && sidebarWidth >= 300/, 'Narrow or icon-only Library must not show squeezed toolbar labels.');
assert.match(sidebarSource, /const compactFilters = libraryIconMode \|\| sidebarWidth < 390/, 'Narrow Library filter controls must switch to icon-only buttons.');
assert.match(sidebarSource, /compact=\{compactFilters\}/, 'Launcher filter must follow the same compact state.');
assert.match(read('src/components/library/LibraryToolbarControls.jsx'), /<Filter size=\{14\}/, 'Launcher filter needs its own recognizable compact icon.');
assert.match(stylesSource, /@container \(max-width: 389px\)[\s\S]*?\.library-filter-text \{ display: none !important; \}/, 'Library filters must collapse during a live sidebar resize.');
assert.match(libraryIconGridSource, /data-testid="library-icon-grid"/);
assert.match(libraryIconGridSource, /gridTemplateColumns: `repeat\(\$\{safeRows\}/, 'Icon rows must control the compact Library lanes.');
assert.match(libraryIconGridSource, /iconOnly/);
assert.match(libraryTreeSource, /!iconOnly && <div className="flex min-w-0 flex-1 flex-col/, 'Icon-only rows must omit game-name and metadata text.');
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
const homeHubSource = read('src/components/HomeHub.jsx');
assert.match(homeHubSource, /max-h-\[320px\][^\n]*overflow-y-auto[^\n]*data-testid="home-game-update-list"/, 'The complete Home update body must stay inside one compact scrolling region.');
assert.match(homeHubSource, /Recent Game Releases/, 'Home must label the longer major-title window honestly.');
assert.match(homeHubSource, /Major launches stay for 14 days; smaller verified releases expire after 5/, 'The release card must explain its retention policy.');
assert.match(homeHubSource, /function ReleaseArtwork/, 'Official publisher releases need a readable fallback when they do not provide Steam-style artwork.');
const mascotSource = read('src/components/FungistMascot.jsx');
assert.match(mascotSource, /data-testid="mascot-quick-toggle"[^\n]*overflow-hidden/, 'Mascot quick-setting switches must clip their thumb inside the track.');
assert.match(mascotSource, /absolute left-0 top-\[3px\][^\n]*translate-x-5/, 'Mascot quick-setting switch thumbs need an explicit left anchor.');
assert.match(mascotSource, /data-testid="mascot-scaled-body"/, 'Mascot resizing needs a dedicated artwork-only boundary.');
assert.doesNotMatch(mascotSource, /flex flex-col items-end" style=\{\{ transform: `scale\(\$\{mascotScale\}\)`/, 'Mascot resizing must not scale speech, notices or other interface text.');
const majorMascotNoticeSource = read('src/components/MajorMascotNotice.jsx');
assert.match(majorMascotNoticeSource, /data-testid="major-mascot-notice"/, 'Major mascot events need a dedicated readable centre-screen notice.');
assert.match(majorMascotNoticeSource, /text-\[14px\]/, 'Major mascot event text must remain readable.');
assert.match(appSource, /onExternalGameState[\s\S]{0,900}setExternalRestOverride\(true\)[\s\S]{0,900}showMajorMascotNotice/, 'A detected external library game must automatically enter Rest Mode and explain the transition.');
assert.match(mascotSource, /candidate\.level === 'major'[\s\S]{0,260}onMajorNotice\(candidate\)/, 'Major mascot events must use the dedicated centre-screen surface.');
const coverWallSource = read('src/components/CoverWall.jsx');
assert.match(coverWallSource, /Math\.min\(14, Number\(density\)/, 'Wall density must allow fourteen covers across.');
assert.match(coverWallSource, /max="14"/, 'The Wall density slider must reach fourteen.');
assert.match(coverWallSource, /function personalRating/, 'Cover Wall rating tags need a bounded personal-rating formatter.');
assert.match(coverWallSource, /portraitArtwork/, 'Cover Wall must prefer a true portrait cover over landscape banner art.');
assert.match(coverWallSource, /aspect-\[2\/3\]/, 'Cover Wall must present games as portrait covers.');
assert.match(coverWallSource, /Portrait cover needed/, 'A missing portrait must use an honest designed placeholder, not stretch wide art into the cover slot.');
assert.match(coverWallSource, /function fallbackCoverStyle/, 'A game with no usable portrait must receive a colorful deterministic fallback cover.');
assert.match(coverWallSource, /data-testid="wall-compact-toolbar"[^\n]*px-3 py-2/, 'Wall view controls must remain a slim toolbar instead of a tall introduction card.');
assert.match(coverWallSource, /data-testid=\{`cover-wall-rating-\$\{game\.id\}`\}/, 'Rated Cover Wall games need a visible personal-rating tag.');
assert.match(coverWallSource, /absolute right-1\.5 top-1\.5 z-10[^\n]*min-w-12[^\n]*bg-amber-300[^\n]*text-\[11px\][^\n]*style=\{\{ textShadow: 'none' \}\}/, 'Cover Wall rating tags must remain a clean shadow-free yellow upper-right badge at every density.');
assert.match(coverWallSource, /data-testid="cover-wall-title"[^\n]*text-\[12px\]/, 'Cover titles must retain a readable fixed size at every Wall density.');
assert.doesNotMatch(coverWallSource, /titleSize|tiles >= 10 \? 8/, 'Cover titles must truncate rather than shrinking below readable size in dense Wall layouts.');
assert.match(appSource, /const wallActive = settings\.mode === 'library' && libraryViewMode === 'wall'/, 'Wall must have an explicit full-workspace state.');
assert.match(appSource, /onSelect=\{\(id\) => \{ setCurrentSelectedId\(id\); if \(id && settings\.mode === 'home'\) updateSetting\(\{ mode: 'library', libraryViewMode: 'preview' \}\); \}\}/, 'Selecting a Library game from Home must switch to its Preview even after Wall was last used.');
assert.match(appSource, /<HomeHub[^\n]*onSelect=\{\(id\) => \{[^\n]*setSelectedId\(id\); updateSetting\(\{ mode: 'library', libraryViewMode: 'preview' \}\); \}\}/, 'Selecting a Home game must switch to its Preview even after Wall was last used.');
assert.match(appSource, /\{!wallActive && <Sidebar/, 'Wall must hide the Library sidebar while it is active.');
assert.match(coverWallSource, /data-testid="wall-view-covers"/, 'Wall must offer the large side-by-side cover view choice.');
assert.match(coverWallSource, /data-testid="wall-view-details"/, 'Wall must offer the large detailed-list choice.');
assert.match(coverWallSource, /data-testid="wall-quick-filters"/, 'Wall must expose its simple quick-filter strip.');
assert.match(coverWallSource, /data-testid=\{`wall-filter-\$\{filter\.id\}`\}/, 'Every Wall quick-filter choice needs a stable UI binding.');
assert.match(appSource, /favoriteIds=\{settings\.pinnedGameIds \|\| \[\]\}/, 'Wall Favorites must use the player\'s saved favorite game IDs.');
assert.match(coverWallSource, /data-testid="wall-details-list"/, 'Wall detailed mode must have its own factual list surface.');
assert.match(coverWallSource, /normalizeWallColumns/, 'Wall detailed list must consume the shared configurable column contract.');
assert.match(coverWallSource, /data-testid="wall-columns-toggle"/, 'Wall detailed list must expose its column controls.');
assert.match(coverWallSource, /data-testid="wall-columns-menu"/, 'Wall detailed list must expose visible-column and width controls.');
assert.match(coverWallSource, /data-testid="wall-open-home"/, 'Wall must provide a direct Home return action.');
assert.match(coverWallSource, /data-testid="wall-open-library"/, 'Wall must provide a direct Library return action.');
assert.match(coverWallSource, /!sideNavigation && <div className="flex shrink-0 items-center gap-1\.5" aria-label="Wall navigation"/, 'Wall navigation belongs at the toolbar start and is omitted beside the rail');
assert.match(appSource, /sideNavigation=\{settings\.navigationLayout === 'sidebar'\}/, 'Wall receives the active vertical navigation layout');
assert.match(coverWallSource, /data-testid="wall-peek-backdrop"/, 'Wall selection must open a dismissible Peek backdrop instead of navigating away immediately.');
assert.match(coverWallSource, /data-testid="wall-peek"/, 'Wall Peek needs a dedicated overlay surface.');
assert.match(coverWallSource, /data-testid="wall-peek-close"/, 'Wall Peek needs an explicit close control.');
assert.match(coverWallSource, /event\.key === 'Escape'/, 'Wall Peek must close with Escape.');
assert.match(coverWallSource, /data-testid="wall-peek-open-preview"/, 'Wall Peek must offer the full Preview as an explicit action.');
assert.match(coverWallSource, /data-testid="wall-peek-play"/, 'Wall Peek must retain guarded Play access.');
assert.match(coverWallSource, /gameSignals\(game\)/, 'Wall Peek must use the shared evidence-led Game Signals registry.');
assert.match(coverWallSource, /signals\.map\(\(signal\) => <Signal/, 'Wall Peek keeps every recorded game signal.');
assert.match(coverWallSource, /line-clamp-2 text-\[10px\] font-semibold leading-tight text-ink">\{signal\.label\}/, 'Wall Peek signal labels must be visible without hover.');
assert.match(coverWallSource, /const selectedScreenshot = screenshots\[selectedIndex\]/, 'Wall Peek has one selected screenshot.');
assert.match(coverWallSource, /onClick=\{\(\) => setActiveScreenshot\(index\)\}/, 'Wall Peek thumbnails must switch the large screenshot.');
assert.match(coverWallSource, /\.slice\(0, 4\)/, 'Wall Peek may show one large screenshot and up to three alternatives.');
assert.match(appSource, /onOpenPreview=\{\(id\) => \{ setSelectedId\(id\); updateSetting\(\{ mode: 'library', libraryViewMode: 'preview' \}\); \}\}/, 'Only Wall Peek Full Preview may leave the Wall workspace.');
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
assert.match(titleBarSource, /data-testid="titlebar-discord-btn"[\s\S]{0,900}data-testid="titlebar-reddit-btn"/, 'Reddit must sit beside the Discord title-bar action.');
assert.match(titleBarSource, /https:\/\/www\.reddit\.com\/r\/NeoLibLauncher\//, 'The title-bar Reddit action must use the official NEO-LIB community URL.');
assert.match(changelogModalSource, /return unseen\.length \? unseen : CHANGELOG\.slice\(0, 1\)/, 'Manual Patch notes must fall back to the current entry after the player has acknowledged it.');
assert.doesNotMatch(changelogModalSource, /You&apos;re fully caught up/, 'Patch notes must not open as an empty caught-up screen.');
assert.match(hoverTipsSource, /React\.useLayoutEffect/);
assert.match(hoverTipsSource, /anchorTop/);
assert.match(hoverTipsSource, /window\.innerWidth - edge - rect\.width \/ 2/);
assert.match(hoverTipsSource, /belowFits/);
assert.match(stylesSource, /\.neolib-hover-tip[\s\S]*max-height: calc\(100vh - 24px\)/);

const gameDetailSource = read('src/components/GameDetail.jsx');
const previewInformationSource = read('src/components/preview/PreviewInformationPanels.jsx');
assert.match(previewInformationSource, /<Building2 size=\{17\}/, 'Game Details identity icons are visibly larger than the old 13px set.');
assert.match(previewInformationSource, /border-sky-400\/25[\s\S]*border-violet-400\/25[\s\S]*border-teal-400\/25/, 'Game Details gives each fact a restrained icon color.');
const previewHeroSource = read('src/components/preview/PreviewHeroTitle.jsx');
const previewActionSource = read('src/components/preview/PreviewActionBar.jsx');
const previewStatusSource = read('src/components/preview/PreviewStatusCards.jsx');
assert.ok(lines('src/components/GameDetail.jsx') < 320, 'Preview information, hero, artwork inspector, actions and status presentation must remain split into focused components');
assert.match(gameDetailSource, /preview\/PreviewInformationPanels/);
assert.match(gameDetailSource, /preview\/PreviewHeroTitle/);
assert.match(gameDetailSource, /preview\/PreviewActionBar/);
assert.match(gameDetailSource, /preview\/PreviewStatusCards/);
assert.deepEqual(libraryHeroCandidates({ hero: 'custom.jpg', background: 'large.jpg', headerImage: 'small.jpg' }), ['custom.jpg', 'large.jpg', 'small.jpg'], 'A player-selected hero must outrank larger scenery and a small header.');
assert.equal(libraryHeroWidth(460, 1946), 575, 'Small store headers must not stretch across an ultrawide hero.');
assert.match(gameDetailSource, /saturationSum/, 'Hero analysis must measure colour as well as brightness.');
assert.match(gameDetailSource, /opacity-\[0\.12\]/, 'Hero scanlines must remain subtle enough to preserve artwork.');
assert.equal(heroImageFilter({ luminance: 60, saturation: 0.1 }), 'brightness(1.38) contrast(1.12) saturate(1.58)');
assert.equal(heroImageFilter({ luminance: 130, saturation: 0.6 }), 'brightness(1.04) contrast(1.06) saturate(1.14)');
assert.equal(heroImageFilter({ luminance: 220, saturation: 0.5 }), 'brightness(0.98) contrast(1.06) saturate(1.08)');
assert.equal(heroImageFilter({}), DEFAULT_HERO_FILTER);
assert.ok(gameDetailSource.indexOf('<DetailList game={game} />') < gameDetailSource.indexOf('<GameStory game={game}'), 'Game Details must be the first information row above About this game.');
assert.doesNotMatch(gameDetailSource, /function GameStory|function GameMediaGallery|function DetailList|function GenreProfile|function HeroTitle|function StarRating|function ActionBar|function ManagedToolMenu|function SteamManifestLine|function LatestNewsPill|function ManagedToolSetup|function UpdateAvailablePill/);
assert.doesNotMatch(gameDetailSource, /function GalleryBox|function MetaStrip|function ScreenshotStrip/, 'Retired Preview renderers must not return');
for (const testId of ['game-story-panel', 'game-genre-profile', 'game-media-gallery', 'game-detail-list']) {
  assert.match(previewInformationSource, new RegExp(testId), `Preview information lost ${testId}`);
}
assert.match(previewInformationSource, /xl:grid-cols-4/, 'Game Details must use one compact responsive row on wide windows.');
assert.deepEqual(previewStoryParagraphs({ about: 'First paragraph.\n\nSecond paragraph.' }), ['First paragraph.', 'Second paragraph.']);
const messyDescription = '<h2>EXPLORE THE TENTH WORLD</h2><p>Explore a world shrouded in mystery.</p><h2>BUILD MIGHTY HALLS</h2><p>Raise longhouses &amp; defend your base.</p><p>Play together across dangerous lands. This unfinished source fragment that</p>';
assert.equal(cleanDescriptionText(messyDescription).endsWith('lands.'), true, 'An obviously truncated provider tail must not leak into Preview.');
assert.deepEqual(formatDescription(messyDescription), [
  { type: 'heading', text: 'Explore the Tenth World' },
  { type: 'paragraph', text: 'Explore a world shrouded in mystery.' },
  { type: 'heading', text: 'Build Mighty Halls' },
  { type: 'paragraph', text: 'Raise longhouses & defend your base.' },
  { type: 'paragraph', text: 'Play together across dangerous lands.' },
]);
assert.deepEqual(previewStoryBlocks({ about: 'KEY FEATURES: Build freely. Explore together.' }).slice(0, 2), [
  { type: 'heading', text: 'Key Features' },
  { type: 'paragraph', text: 'Build freely. Explore together.' },
]);
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

const health = getLibraryHealth([{ id: 'hidden', homeLocked: true }, { id: 'visible', name: 'Visible', coverUrl: 'cover', description: 'Ready', developers: ['Studio'], releaseDate: '2024', exePath: 'game.exe', genreProfile: { rawTags: ['Action'] } }]);
assert.equal(health.score, 100, 'Private placeholders must not reduce health');
const incompleteHealth = getLibraryHealth([{ id: 'thin', name: 'Thin metadata', headerImage: 'banner_1200x400.jpg', shortDescription: '', exePath: 'thin.exe' }]);
assert.ok(incompleteHealth.score < 100, 'A banner must not count as portrait cover art, and missing metadata must reduce library health');
assert.equal(incompleteHealth.missingArt, 1);
const artworkAudit = libraryArtworkAudit([
  { id: 'wide', name: 'Wide Banner', coverUrl: 'https://cdn.test/banner_1200x400.jpg' },
  { id: 'missing', name: 'Missing Cover', about: 'Details', exePath: 'missing.exe' },
  { id: 'reuse-a', name: 'First Game', coverUrl: 'https://cdn.test/shared_600x900.jpg' },
  { id: 'reuse-b', name: 'Second Game', coverUrl: 'https://cdn.test/shared_600x900.jpg' },
]);
assert.ok(artworkAudit.find((row) => row.game.id === 'wide')?.reasons.includes('Not portrait artwork'));
assert.ok(artworkAudit.find((row) => row.game.id === 'missing')?.reasons.includes('Missing cover'));
assert.ok(artworkAudit.find((row) => row.game.id === 'reuse-a')?.reasons.includes('Same cover used by multiple games'));
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
