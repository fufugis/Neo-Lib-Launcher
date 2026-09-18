import { CONTROLLER_ACTIONS, STANDARD_BUTTON_ACTIONS } from './controller-model.mjs';

export const NAVIGATION_COMMANDS = Object.freeze({
  UP: 'up', DOWN: 'down', LEFT: 'left', RIGHT: 'right',
  ...CONTROLLER_ACTIONS,
});

const DPAD_COMMANDS = Object.freeze({ 12: NAVIGATION_COMMANDS.UP, 13: NAVIGATION_COMMANDS.DOWN, 14: NAVIGATION_COMMANDS.LEFT, 15: NAVIGATION_COMMANDS.RIGHT });
const DEFAULT_TIMING = Object.freeze({ initialDelayMs: 420, repeatEveryMs: 120, deadzone: 0.55 });
const REPEATABLE_COMMANDS = new Set([
  NAVIGATION_COMMANDS.UP, NAVIGATION_COMMANDS.DOWN, NAVIGATION_COMMANDS.LEFT, NAVIGATION_COMMANDS.RIGHT,
  CONTROLLER_ACTIONS.PREVIOUS_SECTION, CONTROLLER_ACTIONS.NEXT_SECTION,
]);

function pressed(button) {
  return Boolean(button?.pressed || Number(button?.value) >= 0.55);
}

function directionalCommands(gamepad, deadzone) {
  const commands = [];
  const horizontal = Number(gamepad?.axes?.[0]) || 0;
  const vertical = Number(gamepad?.axes?.[1]) || 0;
  if (vertical <= -deadzone) commands.push(NAVIGATION_COMMANDS.UP);
  if (vertical >= deadzone) commands.push(NAVIGATION_COMMANDS.DOWN);
  if (horizontal <= -deadzone) commands.push(NAVIGATION_COMMANDS.LEFT);
  if (horizontal >= deadzone) commands.push(NAVIGATION_COMMANDS.RIGHT);
  for (const [button, command] of Object.entries(DPAD_COMMANDS)) {
    if (pressed(gamepad?.buttons?.[Number(button)])) commands.push(command);
  }
  return [...new Set(commands)];
}

export function controllerCommands(gamepad, { textEntry = false, modalOpen = false, deadzone = DEFAULT_TIMING.deadzone } = {}) {
  if (!gamepad || gamepad.connected === false || gamepad.mapping !== 'standard') return [];
  if (textEntry) return [];
  const commands = directionalCommands(gamepad, Math.max(0.25, Math.min(0.9, Number(deadzone) || DEFAULT_TIMING.deadzone)));
  for (const [button, command] of Object.entries(STANDARD_BUTTON_ACTIONS)) {
    if (!pressed(gamepad.buttons?.[Number(button)])) continue;
    // HOME must never escape a modal. BACK remains available so the active
    // layer can close itself without moving focus behind the overlay.
    if (modalOpen && command === CONTROLLER_ACTIONS.HOME) continue;
    commands.push(command);
  }
  return [...new Set(commands)];
}

export function createControllerNavigationState(now = 0) {
  return Object.freeze({ held: Object.freeze({}), updatedAt: Math.max(0, Number(now) || 0) });
}

export function advanceControllerNavigation(previous, gamepad, context = {}, now = Date.now(), timing = DEFAULT_TIMING) {
  const time = Math.max(0, Number(now) || 0);
  const before = previous?.held && typeof previous.held === 'object' ? previous.held : {};
  const active = controllerCommands(gamepad, context);
  const activeSet = new Set(active);
  const nextHeld = {};
  const emitted = [];
  const initialDelayMs = Math.max(200, Number(timing.initialDelayMs) || DEFAULT_TIMING.initialDelayMs);
  const repeatEveryMs = Math.max(80, Number(timing.repeatEveryMs) || DEFAULT_TIMING.repeatEveryMs);

  for (const command of active) {
    const prior = before[command];
    if (!prior) {
      emitted.push(command);
      nextHeld[command] = { startedAt: time, repeatedAt: time };
      continue;
    }
    const heldFor = time - prior.startedAt;
    const sinceRepeat = time - prior.repeatedAt;
    if (REPEATABLE_COMMANDS.has(command) && heldFor >= initialDelayMs && sinceRepeat >= repeatEveryMs) {
      emitted.push(command);
      nextHeld[command] = { ...prior, repeatedAt: time };
    } else {
      nextHeld[command] = prior;
    }
  }

  // Releasing a command removes it entirely, so the next press emits at once.
  for (const command of Object.keys(before)) {
    if (!activeSet.has(command)) delete nextHeld[command];
  }

  return Object.freeze({
    commands: Object.freeze(emitted),
    state: Object.freeze({ held: Object.freeze(nextHeld), updatedAt: time }),
  });
}

export function isControllerNavigationTarget(element) {
  if (!element || typeof element !== 'object') return false;
  if (element.disabled || element.getAttribute?.('aria-disabled') === 'true') return false;
  if (element.matches?.('input, textarea, select, [contenteditable="true"]')) return false;
  return Boolean(element.matches?.('button, a[href], [role="button"], [role="tab"], [data-controller-target]'));
}

export function isControllerActivationTarget(element) {
  if (!isControllerNavigationTarget(element)) return false;
  // The native launch path accepts trusted pointer/keyboard intent. Controller
  // activation must not bypass it before a dedicated hold-to-launch flow has
  // been designed and checked in a rebuilt Windows app.
  return !element.matches?.('[data-neolib-launch]');
}
