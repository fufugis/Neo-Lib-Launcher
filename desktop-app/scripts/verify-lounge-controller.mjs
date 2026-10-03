import assert from 'node:assert/strict';
import { loungeControllerRoute } from '../src/components/lounge/lounge-controller-route.mjs';
import { isControllerNavigationTarget } from '../src/input/controller-navigation.mjs';

const make = (kind, top = false) => ({
  matches: selector => selector.includes(kind),
  closest: selector => top && selector.includes('.lounge-browse-dock') ? {} : null,
});
const first = make('[data-lounge-game]');
const last = make('[data-lounge-game]');
const console = make('[data-lounge-console]');
const filter = make('[data-lounge-filter][aria-pressed="true"]', true);
const left = {}, right = {}, collapse = {};
const queries = {
  '[data-lounge-console-step="left"]': left,
  '[data-lounge-console-step="right"]': right,
  '[data-lounge-game][data-lounge-selected="true"]': first,
  '[data-lounge-console][aria-pressed="true"]': console,
  '[data-lounge-collapse-games]': collapse,
};
const surface = {
  getAttribute: key => key === 'data-controller-surface' ? 'lounge' : 'emulator',
  querySelector: selector => queries[selector] || null,
};
const targets = [filter, console, first, last];
const route = (current, command) => loungeControllerRoute(surface, current, command, targets);
assert.equal(route(first, 'left').focus, first, 'first card cannot escape left');
assert.equal(route(last, 'right').focus, last, 'last card cannot escape right');
assert.equal(route(first, 'right').focus, last);
assert.equal(route(last, 'left').focus, first);
assert.equal(route(first, 'up').focus, filter);
assert.equal(route(console, 'up').focus, filter, 'Up never activates a console');
assert.equal(route(console, 'left').click, left);
assert.equal(route(console, 'right').click, right);
assert.equal(route(console, 'down').focus, console);
assert.equal(route(first, 'down').click, collapse);
assert.equal(route(filter, 'down').focus, first, 'Down from filters enters selected game, not collapse');
assert.equal(route(console, 'confirm'), null, 'only normal confirmation activates console');
assert.equal(route(first, 'back').click, collapse);
assert.equal(route(console, 'previous-section').click, left, 'shoulders browse without opening');
assert.equal(route(console, 'next-section').click, right);
delete queries['[data-lounge-game][data-lounge-selected="true"]'];
assert.equal(route(filter, 'down').focus, console, 'collapsed emulator lane remains reachable');
assert.equal(loungeControllerRoute({ getAttribute: () => 'dialog' }, first, 'left', targets), null, 'modal navigation wins');
assert.equal(isControllerNavigationTarget({ matches: selector => selector === 'input[type="range"]' }), true);
assert.equal(isControllerNavigationTarget({ disabled: true, matches: () => true }), false);
globalThis.console.log('PASS: locked carousel lanes, upward controls, explicit console activation, modal precedence and slider reachability.');
