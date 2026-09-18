import { controllerInventory } from '../input/controller-model.mjs';

// Browser adapter only. It does not poll in the background: callers choose when
// Controller Center or NEO Lounge is active and request a snapshot themselves.
export function createControllerInput({ navigatorRef = globalThis.navigator, windowRef = globalThis.window } = {}) {
  const snapshot = (preferredFingerprint = '') => controllerInventory(navigatorRef?.getGamepads?.() || [], preferredFingerprint);
  const subscribe = (listener) => {
    if (!windowRef?.addEventListener || typeof listener !== 'function') return () => {};
    const changed = () => listener(snapshot());
    windowRef.addEventListener('gamepadconnected', changed);
    windowRef.addEventListener('gamepaddisconnected', changed);
    return () => {
      windowRef.removeEventListener('gamepadconnected', changed);
      windowRef.removeEventListener('gamepaddisconnected', changed);
    };
  };
  return Object.freeze({ snapshot, subscribe });
}
