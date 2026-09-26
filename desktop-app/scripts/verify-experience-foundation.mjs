import assert from 'node:assert/strict';
import { experienceProfile, selectExperience } from '../src/state/experience-mode-state.mjs';
import { CONTROLLER_ACTIONS, STANDARD_BUTTON_ACTIONS, WINDOWS_CONTROLLER_SETTINGS, controllerChanges, controllerFingerprint, controllerInputState, controllerInventory } from '../src/input/controller-model.mjs';
import { createControllerInput } from '../src/services/controller-input.mjs';
import { NAVIGATION_COMMANDS, advanceControllerNavigation, controllerCommands, createControllerNavigationState, isControllerActivationTarget, isControllerNavigationTarget } from '../src/input/controller-navigation.mjs';
import { createControllerNavigator } from '../src/services/controller-navigation-service.mjs';
import { canControllerActivate, controllerFocusSurface, controllerFocusTargets, nextControllerFocus } from '../src/input/controller-focus.mjs';
import { hydrateSettings } from '../src/state/settings-state.mjs';
import fs from 'node:fs';
import path from 'node:path';

assert.deepEqual(experienceProfile({}), { interfaceMode: 'default', presentationMode: 'desktop', minimalistic: false, fullscreen: false, informationDensity: 'rich', navigation: 'pointer-first' });
assert.deepEqual(experienceProfile({ interfaceMode: 'minimalistic', presentationMode: 'lounge' }), { interfaceMode: 'minimalistic', presentationMode: 'lounge', minimalistic: true, fullscreen: true, informationDensity: 'calm', navigation: 'controller-first' });
assert.equal(selectExperience({ theme: 'anime' }, { interfaceMode: 'bad', presentationMode: 'bad' }).theme, 'anime');
assert.equal(WINDOWS_CONTROLLER_SETTINGS, 'ms-settings:bluetooth');
assert.equal(STANDARD_BUTTON_ACTIONS[0], CONTROLLER_ACTIONS.CONFIRM);
assert.equal(new Set(Object.values(STANDARD_BUTTON_ACTIONS)).size, Object.values(STANDARD_BUTTON_ACTIONS).length);

const navigationPad = { connected: true, mapping: 'standard', buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })), axes: [0, 0] };
navigationPad.buttons[0] = { pressed: true, value: 1 };
assert.deepEqual(controllerCommands(navigationPad), [CONTROLLER_ACTIONS.CONFIRM]);
assert.deepEqual(controllerCommands(navigationPad, { textEntry: true }), []);
navigationPad.buttons[1] = { pressed: true, value: 1 };
assert.deepEqual(controllerCommands(navigationPad, { textEntry: true }), [CONTROLLER_ACTIONS.BACK], 'B must leave text entry without activating its content');
navigationPad.buttons[1] = { pressed: false, value: 0 };
let activation = advanceControllerNavigation(createControllerNavigationState(), navigationPad, {}, 100);
assert.deepEqual(activation.commands, [CONTROLLER_ACTIONS.CONFIRM]);
activation = advanceControllerNavigation(activation.state, navigationPad, {}, 1000);
assert.deepEqual(activation.commands, [], 'held activation must never auto-repeat');
navigationPad.buttons[16] = { pressed: true, value: 1 };
assert(!controllerCommands(navigationPad, { modalOpen: true }).includes(CONTROLLER_ACTIONS.HOME));
navigationPad.buttons[0] = { pressed: false, value: 0 };
navigationPad.buttons[16] = { pressed: false, value: 0 };
navigationPad.axes = [0.8, 0];
assert.deepEqual(controllerCommands(navigationPad), [NAVIGATION_COMMANDS.RIGHT]);
let navigation = advanceControllerNavigation(createControllerNavigationState(), navigationPad, {}, 1000);
assert.deepEqual(navigation.commands, [NAVIGATION_COMMANDS.RIGHT]);
navigation = advanceControllerNavigation(navigation.state, navigationPad, {}, 1100);
assert.deepEqual(navigation.commands, [], 'held direction must wait before repeating');
navigation = advanceControllerNavigation(navigation.state, navigationPad, {}, 1420);
assert.deepEqual(navigation.commands, [NAVIGATION_COMMANDS.RIGHT]);
navigationPad.axes = [0, 0];
navigation = advanceControllerNavigation(navigation.state, navigationPad, {}, 1500);
assert.deepEqual(navigation.commands, []);
navigationPad.buttons[5] = { pressed: true, value: 1 };
let shoulder = advanceControllerNavigation(createControllerNavigationState(), navigationPad, {}, 2000);
assert.deepEqual(shoulder.commands, [CONTROLLER_ACTIONS.NEXT_SECTION]);
shoulder = advanceControllerNavigation(shoulder.state, navigationPad, {}, 3000);
assert.deepEqual(shoulder.commands, [], 'holding a shoulder must not race across Lounge views');
navigationPad.buttons[5] = { pressed: false, value: 0 };
const fakeButton = { disabled: false, getAttribute: () => null, matches: selector => selector.includes('button') };
const fakeInput = { disabled: false, getAttribute: () => null, matches: selector => selector.includes('input') };
const fakeLaunch = { disabled: false, getAttribute: () => null, matches: selector => selector.includes('button') || selector === '[data-neolib-launch]' };
assert.equal(isControllerNavigationTarget(fakeButton), true);
assert.equal(isControllerNavigationTarget(fakeInput), false);
assert.equal(isControllerActivationTarget(fakeButton), true);
assert.equal(isControllerActivationTarget(fakeLaunch), false);
assert.equal(hydrateSettings({}).controllerNavigationEnabled, false, 'controller navigation must be opt-in');
assert.equal(hydrateSettings({ controllerNavigationEnabled: 'true' }).controllerNavigationEnabled, false);
assert.equal(hydrateSettings({ controllerNavigationEnabled: true }).controllerNavigationEnabled, true);
assert.equal(hydrateSettings({ interfaceMode: 'unexpected' }).interfaceMode, 'default');
assert.equal(hydrateSettings({ interfaceMode: 'minimalistic' }).interfaceMode, 'minimalistic');
const focusDoc = { defaultView: { getComputedStyle: (element) => ({ zIndex: element.z || 'auto', display: 'block', visibility: 'visible', pointerEvents: 'auto' }) } };
const focusTarget = (left, top, label = 'Open') => ({
  isConnected: true, ownerDocument: focusDoc, disabled: false, textContent: label,
  closest: () => null, getAttribute: () => null, getClientRects: () => [1],
  getBoundingClientRect: () => ({ left, top, width: 20, height: 20 }),
  matches: (selector) => selector.includes('button'),
});
const firstFocus = focusTarget(0, 0);
const rightFocus = focusTarget(100, 0);
const lowerFocus = focusTarget(0, 100);
assert.equal(nextControllerFocus([firstFocus, rightFocus, lowerFocus], firstFocus, 'right'), rightFocus);
assert.equal(nextControllerFocus([firstFocus, rightFocus, lowerFocus], firstFocus, 'down'), lowerFocus);
assert.equal(canControllerActivate(focusTarget(0, 0, 'Launch game')), false);
assert.equal(canControllerActivate(firstFocus), true);
const modalSurface = { ...focusTarget(0, 0), z: '100', querySelectorAll: () => [rightFocus] };
focusDoc.body = { querySelectorAll: () => [firstFocus] };
focusDoc.querySelectorAll = () => [modalSurface];
assert.equal(controllerFocusSurface(focusDoc), modalSurface, 'open modal must own controller focus');
assert.deepEqual(controllerFocusTargets(controllerFocusSurface(focusDoc)), [rightFocus]);

const raw = [null, { index: 2, id: '  Wireless   Controller  ', connected: true, mapping: 'standard', buttons: Array(17), axes: Array(4), timestamp: 20 }, { index: 0, id: 'Pad', connected: true, mapping: '', buttons: Array(12), axes: Array(2) }];
const inventory = controllerInventory(raw, 2);
assert.deepEqual(inventory.controllers.map((pad) => pad.index), [0, 2]);
assert.equal(inventory.controllers[1].id, 'Wireless Controller');
assert.equal(inventory.selectedIndex, 2);
assert.equal(inventory.controllers[0].mapping, 'unknown');
assert.match(inventory.controllers[1].fingerprint, /^[a-f0-9]{8}$/);
assert.equal(controllerFingerprint(raw[1]), inventory.controllers[1].fingerprint);
assert.deepEqual(controllerInputState({ connected: true, buttons: [{ pressed: true, value: 1 }, { pressed: false, value: 0 }], axes: [0.04, -0.75] }), { pressed: [{ index: 0, value: 1 }], axes: [0, -0.75] });
assert.deepEqual(controllerChanges(inventory.controllers, [inventory.controllers[1]]), { connected: [], disconnected: [inventory.controllers[0]] });
const duplicateInventory = controllerInventory([
  { index: 0, id: 'Same Pad', connected: true, mapping: 'standard', buttons: Array(17), axes: Array(4) },
  { index: 1, id: 'Same Pad', connected: true, mapping: 'standard', buttons: Array(17), axes: Array(4) },
]);
assert.equal(new Set(duplicateInventory.controllers.map((pad) => pad.fingerprint)).size, 2, 'identical connected pads still need distinct picker choices');

const listeners = new Map();
const adapter = createControllerInput({
  navigatorRef: { getGamepads: () => raw },
  windowRef: { addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: (name) => listeners.delete(name) },
});
assert.equal(adapter.snapshot(2).connectedCount, 2);
let notified = 0;
const unsubscribe = adapter.subscribe((state) => { notified = state.connectedCount; });
listeners.get('gamepadconnected')();
assert.equal(notified, 2);
unsubscribe();
assert.equal(listeners.size, 0);

const frameQueue = [];
const emittedCommands = [];
let clock = 2000;
const navigatedPad = { index: 0, id: 'Navigation Pad', connected: true, mapping: 'standard', buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })), axes: [0, -1] };
const navigatorService = createControllerNavigator({
  navigatorRef: { getGamepads: () => [navigatedPad] },
  windowRef: { requestAnimationFrame: callback => { frameQueue.push(callback); return frameQueue.length; }, cancelAnimationFrame: () => {} },
  now: () => clock,
  onCommand: command => emittedCommands.push(command),
});
assert.equal(navigatorService.isRunning(), false);
assert.equal(navigatorService.start(), true);
assert.equal(navigatorService.start(), false, 'navigation loop must not start twice');
frameQueue.shift()();
assert.deepEqual(emittedCommands, [], 'starting while a control is held must not activate it');
navigatedPad.axes = [0, 0];
frameQueue.shift()();
navigatedPad.axes = [0, -1];
frameQueue.shift()();
assert.deepEqual(emittedCommands, [NAVIGATION_COMMANDS.UP]);
clock += 100;
frameQueue.shift()();
assert.deepEqual(emittedCommands, [NAVIGATION_COMMANDS.UP], 'held direction must obey the repeat delay in the service too');
assert.equal(navigatorService.stop(), true);
assert.equal(navigatorService.stop(), false);
const strictFrames = [];
const strictCommands = [];
let connectedPads = [];
const strictNavigator = createControllerNavigator({
  navigatorRef: { getGamepads: () => connectedPads },
  windowRef: { requestAnimationFrame: callback => { strictFrames.push(callback); return strictFrames.length; }, cancelAnimationFrame: () => {} },
  getPreferredFingerprint: () => controllerFingerprint(navigatedPad),
  strictPreferred: true,
  onCommand: command => strictCommands.push(command),
});
strictNavigator.start();
strictFrames.shift()();
assert.deepEqual(strictCommands, [], 'missing preferred controller cannot hand control to another pad');
connectedPads = [navigatedPad];
strictFrames.shift()();
assert.deepEqual(strictCommands, [], 'reconnection with a held control must wait for release');
navigatedPad.axes = [0, 0];
strictFrames.shift()();
navigatedPad.axes = [0, -1];
strictFrames.shift()();
assert.deepEqual(strictCommands, [NAVIGATION_COMMANDS.UP], 'preferred controller resumes after reconnect');
strictNavigator.stop();

const prototype = fs.readFileSync(path.resolve(import.meta.dirname, '../src/components/controller/ControllerCenterPrototype.jsx'), 'utf8');
const modal = fs.readFileSync(path.resolve(import.meta.dirname, '../src/components/controller/ControllerCenterModal.jsx'), 'utf8');
const bridge = fs.readFileSync(path.resolve(import.meta.dirname, '../src/components/controller/ControllerNavigationBridge.jsx'), 'utf8');
const previewActions = fs.readFileSync(path.resolve(import.meta.dirname, '../src/components/preview/PreviewActionBar.jsx'), 'utf8');
const settings = fs.readFileSync(path.resolve(import.meta.dirname, '../src/components/SettingsModal.jsx'), 'utf8');
const controlMenu = fs.readFileSync(path.resolve(import.meta.dirname, '../src/components/library/AppControlMenu.jsx'), 'utf8');
const themeStudio = fs.readFileSync(path.resolve(import.meta.dirname, '../src/components/ThemeStudioModal.jsx'), 'utf8');
const app = fs.readFileSync(path.resolve(import.meta.dirname, '../src/App.jsx'), 'utf8');
const lounge = fs.readFileSync(path.resolve(import.meta.dirname, '../src/components/lounge/NeoLounge.jsx'), 'utf8');
const loungeHook = fs.readFileSync(path.resolve(import.meta.dirname, '../src/components/lounge/useNeoLounge.js'), 'utf8');
const loungeDetails = fs.readFileSync(path.resolve(import.meta.dirname, '../src/components/lounge/LoungeDetails.jsx'), 'utf8');
const loungeHints = fs.readFileSync(path.resolve(import.meta.dirname, '../src/components/lounge/LoungeControlHints.jsx'), 'utf8');
const loungeCover = fs.readFileSync(path.resolve(import.meta.dirname, '../src/components/lounge/LoungeCover.jsx'), 'utf8');
const appModalLayer = fs.readFileSync(path.resolve(import.meta.dirname, '../src/components/app/AppModalLayer.jsx'), 'utf8');
const homeHub = fs.readFileSync(path.resolve(import.meta.dirname, '../src/components/HomeHub.jsx'), 'utf8');
const sidebar = fs.readFileSync(path.resolve(import.meta.dirname, '../src/components/Sidebar.jsx'), 'utf8');
const wall = fs.readFileSync(path.resolve(import.meta.dirname, '../src/components/CoverWall.jsx'), 'utf8');
const toolDetail = fs.readFileSync(path.resolve(import.meta.dirname, '../src/components/ToolDetail.jsx'), 'utf8');
const styles = fs.readFileSync(path.resolve(import.meta.dirname, '../src/styles.css'), 'utf8');
assert.match(prototype, /Manage in Windows/);
assert.match(prototype, /Pairing, removal and device security remain in Windows/);
assert.match(prototype, /Live input test/);
assert.match(prototype, /never input history/);
assert.doesNotMatch(prototype, /navigator|getGamepads|ms-settings:/, 'the view must not own detection or native routing');
assert.match(modal, /if \(!open\) return undefined/);
assert.match(modal, /setInterval\(refresh, 250\)/);
assert.match(modal, /clearInterval/);
assert.match(modal, /onInventoryChange/);
assert.match(bridge, /navigator\.stop\(\)/);
assert.match(bridge, /canControllerActivate/);
assert.match(bridge, /strictPreferred: true/);
assert.match(bridge, /privacyEpoch/);
assert.match(bridge, /visibilitychange/);
assert.match(bridge, /wall-open-home/, 'HOME must work while the Library sidebar is hidden by Wall');
assert.match(bridge, /app-control-menu-toggle/, 'Start opens the existing app menu');
assert.match(bridge, /blockedLaunchRef\.current/, 'blocked Launch has visible feedback');
assert.match(previewActions, /key=\{route\.id\} data-neolib-launch="true"/, 'alternate launch routes need the same native intent marker');
assert.match(app, /ControllerNavigationBridge enabled=/);
assert.doesNotMatch(settings, /open-controller-center/);
assert.doesNotMatch(settings, /theme-picker-columns/);
assert.match(controlMenu, /app-menu-controllers/);
assert.match(controlMenu, /app-menu-minimalistic-toggle/);
assert.match(homeHub, /home-minimalistic-customize/);
assert.match(homeHub, /!minimalistic \|\| customizeOpen \|\| layoutUnlocked/, 'editing controls remain visible while Home is unlocked');
assert.match(sidebar, /sidebar-minimalistic-filters/);
assert.match(sidebar, /!minimalistic \|\| libraryFiltersOpen/, 'advanced Library filters remain one click away');
assert.match(wall, /wall-minimalistic-options/);
assert.match(wall, /!minimalistic \|\| extraOpen \|\| selectionMode \|\| columnMenuOpen/, 'Wall selection and column editing cannot disappear mid-task');
assert.match(toolDetail, /tool-minimalistic-more/);
assert.match(toolDetail, /tool-minimalistic-details/);
assert.match(toolDetail, /!minimalistic \|\| moreOpen \|\| tool\.availability === 'missing'/, 'missing-tool recovery actions remain visible');
assert.match(app, /data-interface-mode=/);
assert.match(styles, /data-interface-mode="minimalistic"/);
assert.match(controlMenu, /app-menu-tv-mode/);
assert.match(controlMenu, /choose\(onEnterLounge\)/);
assert.match(app, /NeoLounge games=\{visibleUnlockedGames\(library\.games \|\| \[\], library\.categories \|\| \[\], unlockedCategories\)\}/, 'Lounge must receive only unlocked games regardless of the active desktop page');
assert.match(app, /inert=\{lounge\.active \? '' : undefined\}/, 'desktop controls must not receive focus behind Lounge');
assert.match(loungeHook, /React\.useState\(false\)/, 'Lounge must never enter at startup');
assert.match(lounge, /data-controller-close/);
assert.match(lounge, /event\.key === 'Escape'/);
assert.match(lounge, /Recently played/);
assert.match(lounge, /Update flagged/);
assert.match(lounge, /Could not leave fullscreen/);
assert.match(lounge, /exitRef\.current\?\.focus\(\)/, 'failed fullscreen exit must restore the retry focus');
assert.match(lounge, /aria-busy=\{transitionBusy\}/);
assert.match(lounge, /transitionLock\.current/, 'repeat presses must not overlap native fullscreen transitions');
assert.match(loungeHook, /onWindowVisibility/, 'hiding to tray must leave Lounge');
assert.match(loungeDetails, /loungeSessionContext/);
assert.match(loungeDetails, /mascotEnabled &&/, 'mascot guidance respects the existing visibility choice');
assert.equal(STANDARD_BUTTON_ACTIONS[1], CONTROLLER_ACTIONS.BACK);
assert.match(loungeHints, /Stick \/ D-pad/);
assert.match(loungeHints, /<Key>South<\/Key> Activate/);
assert.match(loungeHints, /<Key>East<\/Key> Back/);
assert.match(loungeHints, /<Key>Shoulders<\/Key> Change view/);
assert.match(loungeHints, /never launches a game directly/);
assert.match(lounge, /aria-describedby="lounge-control-help"/);
assert.match(lounge, /aria-label=\{`Open preview for /);
assert.match(lounge, /onClick=\{\(\) => requestPreview\(game\.id\)\}/, 'confirming a cover opens Preview, not a game launch');
assert.match(lounge, /possible update flagged/, 'assistive labels must expose a possible update without overstating it');
assert.match(loungeCover, /loading="lazy" decoding="async"/, 'offscreen covers should avoid eager decoding');
assert.match(loungeCover, /onError=\{\(\) => setFailedPortraitUrl\(portrait\)\}/, 'failed portraits must reach a fallback');
assert.match(loungeCover, /onError=\{\(\) => setFailedBackdropUrl\(backdrop\)\}/, 'failed backdrops must leave a readable title card');
assert.match(lounge, /data-lounge-filter/);
assert.match(lounge, /focusAfterViewChange\.current = true/, 'changing Lounge views must schedule a focus handoff');
assert.match(lounge, /\[data-lounge-selected="true"\], \[data-lounge-filter\]\[aria-pressed="true"\]/, 'an empty Lounge view must keep focus on its selected filter');
assert.match(lounge, /shownGames\.some\(\(game\) => game\.id === focusedGameId\.current\)/, 'a removed Lounge cover must be recognized before restoring focus');
assert.match(lounge, /document\.hasFocus\(\) && !surfaceRef\.current\?\.contains\(document\.activeElement\)/, 'Lounge must not steal focus from another visible control or an unfocused window');
assert.match(lounge, /querySelector\('\[data-lounge-game\]:focus'\)/, 'mouse hover cannot silently replace a keyboard- or pad-focused game');
assert.match(lounge, /clamp\(170px, 18vw, 320px\)/, 'Lounge cover width must scale for couch browsing and remain bounded');
assert.match(bridge, /data-controller-surface'\) === 'lounge'/);
assert.match(bridge, /targets\.includes\(document\.activeElement\) && document\.activeElement !== focused/, 'pad navigation must follow focus moved by Lounge or keyboard');
assert.match(bridge, /if \(canControllerActivate\(target\)\) target\.click\(\)/, 'shoulders use only the existing safe view buttons');
assert.match(loungeDetails, /max-h-\[40vh\]/, 'Lounge facts must not consume a narrow screen');
assert.doesNotMatch(lounge, /data-neolib-launch|armGameLaunch/, 'Lounge cannot gain a controller game-launch path');
assert.match(controlMenu, /app-menu-themes/);
assert.match(controlMenu, /app-menu-visuals/);
assert.match(controlMenu, /app-menu-quit/);
assert.match(themeStudio, /theme-picker-columns/);
assert.match(themeStudio, /special-decoration-control/);
assert.match(app, /components\/app\/AppModalLayer/);
assert.match(appModalLayer, /preferredControllerFingerprint/);
assert.match(appModalLayer, /WINDOWS_CONTROLLER_SETTINGS/);

console.log('PASS: the Control Center opens an explicit, session-only NEO Lounge; desktop controls are inert behind it and only unlocked games are passed through.');
