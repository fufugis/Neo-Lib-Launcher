import { controllerInventory } from '../input/controller-model.mjs';
import { advanceControllerNavigation, createControllerNavigationState } from '../input/controller-navigation.mjs';

// Explicit-lifecycle adapter for a future opt-in controller-navigation hook.
// Importing it performs no polling and captures no input. The caller owns
// start/stop and decides how semantic commands move focus inside one surface.
export function createControllerNavigator({
  navigatorRef = globalThis.navigator,
  windowRef = globalThis.window,
  now = () => Date.now(),
  onCommand = () => {},
  getContext = () => ({}),
  getPreferredFingerprint = () => '',
} = {}) {
  let running = false;
  let frameId = null;
  let navigationState = createControllerNavigationState();

  const frame = () => {
    if (!running) return;
    const gamepads = Array.from(navigatorRef?.getGamepads?.() || []);
    const inventory = controllerInventory(gamepads, getPreferredFingerprint());
    const selected = inventory.selectedIndex == null ? null : gamepads.find((pad) => pad?.index === inventory.selectedIndex);
    const currentContext = getContext() || {};
    const context = { ...currentContext, textEntry: Boolean(currentContext.textEntry) };
    const result = advanceControllerNavigation(navigationState, selected, context, now());
    navigationState = result.state;
    for (const command of result.commands) onCommand(command, { controllerIndex: inventory.selectedIndex });
    frameId = windowRef?.requestAnimationFrame?.(frame) ?? null;
  };

  const start = () => {
    if (running || typeof windowRef?.requestAnimationFrame !== 'function') return false;
    running = true;
    navigationState = createControllerNavigationState(now());
    frameId = windowRef.requestAnimationFrame(frame);
    return true;
  };

  const stop = () => {
    if (!running) return false;
    running = false;
    if (frameId != null) windowRef?.cancelAnimationFrame?.(frameId);
    frameId = null;
    navigationState = createControllerNavigationState(now());
    return true;
  };

  return Object.freeze({ start, stop, isRunning: () => running });
}
