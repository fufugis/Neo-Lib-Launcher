import assert from 'node:assert/strict';
import { experienceProfile, selectExperience } from '../src/state/experience-mode-state.mjs';
import { CONTROLLER_ACTIONS, STANDARD_BUTTON_ACTIONS, WINDOWS_CONTROLLER_SETTINGS, controllerChanges, controllerFingerprint, controllerInputState, controllerInventory } from '../src/input/controller-model.mjs';
import { createControllerInput } from '../src/services/controller-input.mjs';
import { NAVIGATION_COMMANDS, advanceControllerNavigation, controllerCommands, createControllerNavigationState, isControllerActivationTarget, isControllerNavigationTarget } from '../src/input/controller-navigation.mjs';
import { createControllerNavigator } from '../src/services/controller-navigation-service.mjs';
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
const fakeButton = { disabled: false, getAttribute: () => null, matches: selector => selector.includes('button') };
const fakeInput = { disabled: false, getAttribute: () => null, matches: selector => selector.includes('input') };
const fakeLaunch = { disabled: false, getAttribute: () => null, matches: selector => selector.includes('button') || selector === '[data-neolib-launch]' };
assert.equal(isControllerNavigationTarget(fakeButton), true);
assert.equal(isControllerNavigationTarget(fakeInput), false);
assert.equal(isControllerActivationTarget(fakeButton), true);
assert.equal(isControllerActivationTarget(fakeLaunch), false);

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
assert.deepEqual(emittedCommands, [NAVIGATION_COMMANDS.UP]);
clock += 100;
frameQueue.shift()();
assert.deepEqual(emittedCommands, [NAVIGATION_COMMANDS.UP], 'held direction must obey the repeat delay in the service too');
assert.equal(navigatorService.stop(), true);
assert.equal(navigatorService.stop(), false);

const prototype = fs.readFileSync(path.resolve(import.meta.dirname, '../src/components/controller/ControllerCenterPrototype.jsx'), 'utf8');
const modal = fs.readFileSync(path.resolve(import.meta.dirname, '../src/components/controller/ControllerCenterModal.jsx'), 'utf8');
const settings = fs.readFileSync(path.resolve(import.meta.dirname, '../src/components/SettingsModal.jsx'), 'utf8');
const controlMenu = fs.readFileSync(path.resolve(import.meta.dirname, '../src/components/library/AppControlMenu.jsx'), 'utf8');
const themeStudio = fs.readFileSync(path.resolve(import.meta.dirname, '../src/components/ThemeStudioModal.jsx'), 'utf8');
const app = fs.readFileSync(path.resolve(import.meta.dirname, '../src/App.jsx'), 'utf8');
const appModalLayer = fs.readFileSync(path.resolve(import.meta.dirname, '../src/components/app/AppModalLayer.jsx'), 'utf8');
assert.match(prototype, /Manage in Windows/);
assert.match(prototype, /Pairing, removal and device security remain in Windows/);
assert.match(prototype, /Live input test/);
assert.match(prototype, /never input history/);
assert.doesNotMatch(prototype, /navigator|getGamepads|ms-settings:/, 'the view must not own detection or native routing');
assert.match(modal, /if \(!open\) return undefined/);
assert.match(modal, /setInterval\(refresh, 250\)/);
assert.match(modal, /clearInterval/);
assert.match(modal, /onInventoryChange/);
assert.doesNotMatch(settings, /open-controller-center/);
assert.doesNotMatch(settings, /theme-picker-columns/);
assert.match(controlMenu, /app-menu-controllers/);
assert.match(controlMenu, /app-menu-tv-mode/);
assert.match(controlMenu, /app-menu-themes/);
assert.match(controlMenu, /app-menu-visuals/);
assert.match(controlMenu, /app-menu-quit/);
assert.match(themeStudio, /theme-picker-columns/);
assert.match(themeStudio, /special-decoration-control/);
assert.match(app, /components\/app\/AppModalLayer/);
assert.match(appModalLayer, /preferredControllerFingerprint/);
assert.match(appModalLayer, /WINDOWS_CONTROLLER_SETTINGS/);

console.log('PASS: the left-side NEO-LIB menu owns controller, theme, visual and app actions; TV Mode remains intentionally staged, while Controller Center stays privacy-bounded and hands device management to Windows.');
