import assert from 'node:assert/strict';
import fs from 'node:fs';
import { railFlyoutPosition, railFlyoutFocusIndex } from '../src/components/library/rail-flyout-model.mjs';

const sidebar = fs.readFileSync(new URL('../src/components/Sidebar.jsx', import.meta.url), 'utf8');
const flyout = fs.readFileSync(new URL('../src/components/library/RailActionFlyout.jsx', import.meta.url), 'utf8');
const addons = fs.readFileSync(new URL('../src/components/addons/AddonMenu.jsx', import.meta.url), 'utf8');
const controlMenu = fs.readFileSync(new URL('../src/components/library/AppControlMenu.jsx', import.meta.url), 'utf8');
for (const file of ['Sidebar.jsx', 'library/AppControlMenu.jsx', 'library/LibraryVisualsPopover.jsx', 'ThemeStudioModal.jsx', 'tutorial-steps.mjs']) {
  const source = fs.readFileSync(new URL('../src/components/' + file, import.meta.url), 'utf8');
  assert(source.includes('Library tweaks'), `${file} uses the renamed destination`);
  assert.doesNotMatch(source, /Visual tweaks/i, `${file} has no retired user-facing name`);
}
const styles = fs.readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const toolbar = fs.readFileSync(new URL('../src/components/library/LibraryToolbarControls.jsx', import.meta.url), 'utf8');
const sortOptions = sidebar.slice(sidebar.indexOf('{sortMenuOpen && ('), sidebar.indexOf('<div ref={categoriesMenuRef}'));
assert.equal((sidebar.match(/<LauncherDropdown\b/g) || []).length, 1, 'one launcher picker, not a second toolbar control');
assert(sortOptions.includes('data-testid="sidebar-sort-launcher-filter"') && sortOptions.includes('<LauncherDropdown value={launcherFilter'), 'launcher picker lives inside Sort');
assert(sortOptions.includes('onSetLauncherFilter?.(value)} embedded'), 'same parent filtering callback with an in-flow picker');
assert(sortOptions.includes('overflow-y-auto overscroll-contain'), 'expanded launcher list remains scroll bounded inside Sort');
assert(sidebar.includes("librarySortMode !== 'manual' || launcherFilter !== 'all'"), 'Sort shows an active filter even with custom ordering');
assert(toolbar.includes("embedded ? 'library-toolbar-popover--embedded relative w-full'"), 'embedded choices explicitly override shared absolute popup positioning');
assert.match(styles, /\.library-toolbar-popover--embedded \{\s*position: relative;\s*z-index: auto !important;/, 'embedded list remains in flow below the picker');
assert.match(styles, /\[data-testid='sidebar-sort-options'\], \[data-testid='launcher-dropdown-menu'\] \{\s*background: rgb\(var\(--surface\)\) !important;\s*opacity: 1;/, 'Sort and launcher menus are fully opaque');
const launcherComponent = toolbar.slice(toolbar.indexOf('export function LauncherDropdown'));
assert(!launcherComponent.includes('opacity: 0'), 'launcher entry/exit never reveal rows through a transparency fade');
assert(!sortOptions.includes('opacity: 0'), 'Sort entry/exit never reveal rows through a transparency fade');
const railSource = sidebar.slice(sidebar.indexOf('export function SideNavigationRail'));
const loungePosition = railSource.indexOf('testid="sidebar-rail-lounge-btn"');
const addPosition = railSource.indexOf('testid="sidebar-rail-wizard-btn"');
const browsePosition = railSource.indexOf('testid="side-navigation-lounge-divider"');
assert(loungePosition >= 0 && addPosition > loungePosition && browsePosition > addPosition, 'Lounge stays first, Add games is next, before Browse');
assert.equal((railSource.match(/testid="sidebar-rail-wizard-btn"/g) || []).length, 1, 'no duplicate Add games entry under Actions');
assert.match(railSource, /<RailNavigationButton icon=\{<Plus size=\{23\} \/>\} label="Add games" hint="Wizard"[^\n]+prominent onClick=\{onOpenWizard\} testid="sidebar-rail-wizard-btn"/, 'clear Add games name and plus icon retain the real Wizard action');
assert.match(railSource, /data-testid="sidebar-add-games-area" className="my-2 border-y[^\n]+py-2"/, 'Add games has its own separated area');
assert.match(styles, /\.neo-rail-button--primary \{[^}]+border-color:[^}]+background:/, 'primary action stays highlighted without requiring hover');
assert.match(railSource, /title=\{expanded \? undefined : label\}[\s\S]*?aria-label=\{label\}/, 'compact Add games retains a tooltip and accessible name');
const exitPosition = sidebar.indexOf('testid="side-navigation-exit-divider"');
const restPosition = sidebar.indexOf('testid="sidebar-rail-rest-toggle"');
const quitPosition = sidebar.indexOf('testid="sidebar-rail-quit-btn"');
assert(exitPosition >= 0 && restPosition > exitPosition && quitPosition > restPosition, 'Rest/Wake sits in Exit, immediately above Quit');
assert.equal((sidebar.match(/testid="sidebar-rail-rest-toggle"/g) || []).length, 1, 'Rest is not duplicated in Actions');
assert.match(sidebar, /active=\{manualResting\} onClick=\{onToggleManualRest\} testid="sidebar-rail-rest-toggle"/, 'Rest keeps its existing state and action');
const visuals = sidebar.match(/<RailActionFlyout[^\n]+label="Visuals"[\s\S]*?\]\} \/>/)?.[0];
const settings = sidebar.match(/<RailActionFlyout[^\n]+label="Settings"[\s\S]*?\]\} \/>/)?.[0];
assert(visuals && settings);
assert.equal((visuals.match(/action:/g) || []).length, 3);
assert(visuals.includes("label: 'Sidebar tweaks'") && visuals.includes('setTweaksOpen(true)'), 'Visuals opens the dedicated Sidebar tweaks panel');
assert.equal((settings.match(/action:/g) || []).length, 6);
for (const [source, pairs] of [[visuals, [['Theme', 'onOpenThemes'], ['Library tweaks', 'onOpenVisuals']]], [settings, [['Settings', 'onOpenSettings'], ['Manage Addons', 'onManageAddons'], ['Help', 'onOpenFeedback'], ['Updates', 'onCheckForUpdates'], ['Mascot', 'onOpenMascot'], ['Controllers', 'onOpenControllers']]]]) {
  for (const [label, handler] of pairs) assert(source.includes(`label: '${label}'`) && source.includes(`action: ${handler}`), `${label} retains its original action`);
}
assert.doesNotMatch(sidebar, /<RailNavigationButton[^\n]+label="(?:Theme|Library tweaks|Controllers|Mascot|Settings|Updates|Help)"/, 'Grouped actions are not duplicated on the rail');
assert.doesNotMatch(sidebar, /<RailNavigationButton[^\n]+label="Manage Addons"/, 'Addon management lives only in the Settings flyout, not its own rail button');
assert.match(sidebar, /addonsEnabled && addons.length > 0 && <>/, 'Do not leave an empty Addons heading');
assert.match(sidebar, /onClick=\{\(\) => onOpenAddon\(addon.id\)\}/, 'Enabled addon pages retain their direct navigation');
assert.match(flyout, /open && renderForegroundPortal/);
assert.match(flyout, /data-controller-surface="popover"/);
assert.match(flyout, /data-controller-close aria-label=/, 'Controller Back can dismiss the foreground menu');
assert.match(flyout, /aria-haspopup="menu" aria-expanded=\{open\}/);
assert.match(flyout, /close\(true\); item.action\?\.\(\)/, 'Close and return focus before opening an existing destination');
for (const event of ['pointerdown', 'focusin', 'keydown']) {
  assert(flyout.includes(`addEventListener('${event}'`) && flyout.includes(`removeEventListener('${event}'`));
}
assert.match(sidebar, /const \[openMenu, setOpenMenu\] = React.useState\(null\)/, 'Only one group can be open');
assert.deepEqual(railFlyoutPosition({right: 148, top: 380}, {width: 240, height: 220}, {width: 3440, height: 1440}), {left: 156, top: 380});
for (const [width, height] of [[3440, 1440], [1280, 720], [320, 300]]) {
  const box = {width: Math.min(240, width - 16), height: Math.min(270, height - 16)};
  const position = railFlyoutPosition({right: 148, top: height - 24}, box, {width, height});
  assert(position.left >= 8 && position.top >= 8);
  assert(position.left + box.width <= width - 8 && position.top + box.height <= height - 8);
}
assert.equal(railFlyoutFocusIndex('ArrowDown', 4, 5), 0);
assert.equal(railFlyoutFocusIndex('ArrowUp', 0, 5), 4);
assert.equal(railFlyoutFocusIndex('Home', 3, 5), 0);
assert.equal(railFlyoutFocusIndex('End', 0, 5), 4);
assert.equal(railFlyoutFocusIndex('ArrowDown', 0, 0), -1);
assert.doesNotMatch(sidebar, /testid="tab-modules"/, 'Modules no longer consumes top navigation width');
assert.match(sidebar, /onOpenModules=\{onOpenModules\}/);
assert.match(controlMenu, /label="Modules"[^\n]+choose\(onOpenModules\)[^\n]+testid="app-menu-modules"/, 'Left Menu retains module management');
assert.match(sidebar, /sidebarWidth >= \(addonsEnabled \? 560 : 460\)/, 'Labels use the full navigation budget, not generic action-button threshold');
assert.match(styles, /@container \(max-width: 559px\)[\s\S]*?data-has-addons='true'[\s\S]*?library-nav-label \{ display: none/);
assert.match(styles, /@container \(max-width: 459px\)[\s\S]*?top-toolbar[\s\S]*?library-nav-label \{ display: none/);
assert.match(addons, /<TabPill label="Addons"/, 'Addons shares navigation button layout');
assert.doesNotMatch(addons, /<details|<summary/, 'No unmatched native details marker');
assert.match(addons, /open && renderForegroundPortal/);
assert.match(addons, /data-controller-close aria-label="Close Addons menu"/);
assert.match(addons, /role="menuitem"[^\n]+onOpen\?\.\(addon.id\)/);
assert.match(addons, /role="menuitem"[^\n]+onManage\?\.\(\)/);
assert.match(toolbar, /ref=\{buttonRef\}/, 'Shared nav button supports anchored menu focus');
assert.match(toolbar, /aria-haspopup=\{menuId \? 'menu' : undefined\}/);
console.log('PASS: compact rail groups retain all eight actions, addon management in Settings, unclipped bounded placement and keyboard navigation; live desktop acceptance remains required.');
