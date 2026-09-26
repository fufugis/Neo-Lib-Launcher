import { controllerInventory } from '../input/controller-model.mjs';

// Browser adapter only. It does not poll in the background: callers choose when
// Controller Center or NEO Lounge is active and request a snapshot themselves.
export function createControllerInput({ navigatorRef = globalThis.navigator, windowRef = globalThis.window } = {}) {
  const eventPads = new Map();
  const snapshot = (preferredFingerprint = '') => {
    let browserPads = [];
    let access = 'ready';
    if (typeof navigatorRef?.getGamepads !== 'function') access = 'unavailable';
    else {
      try { browserPads = Array.from(navigatorRef.getGamepads() || []); }
      catch { access = 'blocked'; }
    }
    const eventOnlyIndexes = [];
    for (const [index, pad] of eventPads) {
      if (pad.connected === false) { eventPads.delete(index); continue; }
      if (!browserPads.some((candidate) => candidate?.index === index && candidate.connected !== false)) {
        browserPads[index] = pad;
        eventOnlyIndexes.push(index);
      }
    }
    return Object.freeze({ ...controllerInventory(browserPads, preferredFingerprint), access, eventOnlyIndexes });
  };
  const subscribe = (listener) => {
    if (!windowRef?.addEventListener || typeof listener !== 'function') return () => {};
    const connected = (event) => {
      if (Number.isInteger(event?.gamepad?.index)) eventPads.set(event.gamepad.index, event.gamepad);
      listener(snapshot());
    };
    const disconnected = (event) => {
      if (Number.isInteger(event?.gamepad?.index)) eventPads.delete(event.gamepad.index);
      listener(snapshot());
    };
    windowRef.addEventListener('gamepadconnected', connected);
    windowRef.addEventListener('gamepaddisconnected', disconnected);
    return () => {
      windowRef.removeEventListener('gamepadconnected', connected);
      windowRef.removeEventListener('gamepaddisconnected', disconnected);
      eventPads.clear();
    };
  };
  return Object.freeze({ snapshot, subscribe });
}
