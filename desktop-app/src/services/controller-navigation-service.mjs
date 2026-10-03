import { controllerInventory } from '../input/controller-model.mjs';
import { advanceControllerNavigation, controllerCommands, createControllerNavigationState } from '../input/controller-navigation.mjs';

// Explicit-lifecycle adapter for a future opt-in controller-navigation hook.
// Importing it performs no polling and captures no input. The caller owns
// start/stop and decides how semantic commands move focus inside one surface.
export function createControllerNavigator({
  navigatorRef = globalThis.navigator,
  windowRef = globalThis.window,
  now = () => Date.now(),
  onCommand = () => {},
  onButtonPress = () => false,
  getContext = () => ({}),
  getPreferredFingerprint = () => '',
  strictPreferred = false,
} = {}) {
  let running = false;
  let frameId = null;
  let navigationState = createControllerNavigationState();
  let selectedDevice = '';
  let waitForNeutral = true;
  let buttonsWereDown = false;

  const frame = () => {
    if (!running) return;
    const gamepads = Array.from(navigatorRef?.getGamepads?.() || []);
    const preferredFingerprint = getPreferredFingerprint();
    const inventory = controllerInventory(gamepads, preferredFingerprint);
    const preferred = inventory.controllers.find((pad) => pad.fingerprint === preferredFingerprint && pad.mapping === 'standard');
    const fallback = strictPreferred && preferredFingerprint ? null : inventory.controllers.find((pad) => pad.mapping === 'standard');
    const selectedIndex = (preferred || fallback)?.index;
    const selected = selectedIndex == null ? null : gamepads.find((pad) => pad?.index === selectedIndex);
    const device = selected ? `${selectedIndex}:${selected.id}:${selected.mapping}` : '';
    if (device !== selectedDevice) {
      selectedDevice = device;
      waitForNeutral = true;
      navigationState = createControllerNavigationState(now());
      buttonsWereDown = true;
    }
    const buttonsDown = Boolean(selected?.buttons?.some(button => button?.pressed || button?.value > 0.5));
    const freshButtonPress = buttonsDown && !buttonsWereDown;
    buttonsWereDown = buttonsDown;
    if (!waitForNeutral && freshButtonPress && onButtonPress() === true) {
      waitForNeutral = true;
      frameId = windowRef?.requestAnimationFrame?.(frame) ?? null;
      return;
    }
    if (waitForNeutral) {
      if (selected && !buttonsDown && controllerCommands(selected).length === 0) waitForNeutral = false;
      frameId = windowRef?.requestAnimationFrame?.(frame) ?? null;
      return;
    }
    // Poll cheap gamepad state every frame, not the DOM. Reading modal geometry
    // while the pad is neutral forces layout during unrelated mouse animation.
    if (controllerCommands(selected).length === 0) {
      navigationState = createControllerNavigationState(now());
      frameId = windowRef?.requestAnimationFrame?.(frame) ?? null;
      return;
    }
    const currentContext = getContext() || {};
    const context = { ...currentContext, textEntry: Boolean(currentContext.textEntry) };
    const result = advanceControllerNavigation(navigationState, selected, context, now());
    navigationState = result.state;
    for (const command of result.commands) {
      if (onCommand(command, { controllerIndex: selectedIndex }) === true) {
        // A dismiss-only input must be released before touching the panel below.
        waitForNeutral = true;
        break;
      }
    }
    frameId = windowRef?.requestAnimationFrame?.(frame) ?? null;
  };

  const start = () => {
    if (running || typeof windowRef?.requestAnimationFrame !== 'function') return false;
    running = true;
    navigationState = createControllerNavigationState(now());
    selectedDevice = '';
    waitForNeutral = true;
    frameId = windowRef.requestAnimationFrame(frame);
    return true;
  };

  const stop = () => {
    if (!running) return false;
    running = false;
    if (frameId != null) windowRef?.cancelAnimationFrame?.(frameId);
    frameId = null;
    navigationState = createControllerNavigationState(now());
    selectedDevice = '';
    waitForNeutral = true;
    return true;
  };

  return Object.freeze({ start, stop, isRunning: () => running });
}
