import assert from 'node:assert/strict';
import fs from 'node:fs';
import { railFlyoutPosition, railFlyoutFocusIndex } from '../src/components/library/rail-flyout-model.mjs';

const sidebar = fs.readFileSync(new URL('../src/components/Sidebar.jsx', import.meta.url), 'utf8');
const flyout = fs.readFileSync(new URL('../src/components/library/RailActionFlyout.jsx', import.meta.url), 'utf8');
const addons = fs.readFileSync(new URL('../src/components/addons/AddonMenu.jsx', import.meta.url), 'utf8');
const controlMenu = fs.readFileSync(new URL('../src/components/library/AppControlMenu.jsx', import.meta.url), 'utf8');
const styles = fs.readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const toolbar = fs.readFileSync(new URL('../src/components/library/LibraryToolbarControls.jsx', import.meta.url), 'utf8');
const visuals = sidebar.match(/<RailActionFlyout[^\n]+label="Visuals"[\s\S]*?\]\} \/>/)?.[0];
const settings = sidebar.match(/<RailActionFlyout[^\n]+label="Settings"[\s\S]*?\]\} \/>/)?.[0];
assert(visuals && settings);
assert.equal((visuals.match(/action:/g) || []).length, 2);
assert.equal((settings.match(/action:/g) || []).length, 6);
for (const [source, pairs] of [[visuals, [['Theme', 'onOpenThemes'], ['Visual tweaks', 'onOpenVisuals']]], [settings, [['Settings', 'onOpenSettings'], ['Manage Addons', 'onManageAddons'], ['Help', 'onOpenFeedback'], ['Updates', 'onCheckForUpdates'], ['Mascot', 'onOpenMascot'], ['Controllers', 'onOpenControllers']]]]) {
  for (const [label, handler] of pairs) assert(source.includes(`label: '${label}'`) && source.includes(`action: ${handler}`), `${label} retains its original action`);
}
assert.doesNotMatch(sidebar, /<RailNavigationButton[^\n]+label="(?:Theme|Visual tweaks|Controllers|Mascot|Settings|Updates|Help)"/, 'Grouped actions are not duplicated on the rail');
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
