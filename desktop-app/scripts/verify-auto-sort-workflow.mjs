import assert from 'node:assert/strict';
import { createAutoSortWorkflow } from '../src/services/auto-sort-workflow.mjs';

let library = {
  categories: [{ id: 'existing-rpg', name: 'RPG', colorId: 'blue', private: false }],
  games: [
    { id: 'a', name: 'A', categoryIds: ['manual'] },
    { id: 'b', name: 'B', categoryIds: [] },
  ],
};
let undo = null;
let nextId = 0;
const notices = [];
const celebrations = [];
const setLibrary = update => { library = update(library); };
const common = {
  setLibrary,
  sliceK: { items: 'games', cats: 'categories' },
  setAutoSortUndo: value => { undo = value; },
  notify: value => notices.push(value),
  fireConfetti: value => celebrations.push(value),
  uid: () => `created-${++nextId}`,
};

createAutoSortWorkflow({
  ...common,
  currentCats: library.categories,
  currentItems: library.games,
  autoSortUndo: undo,
}).applyAutoSort(
  [{ name: 'RPG', colorId: 'blue' }, { name: 'Adventure', colorId: 'green' }],
  [{ id: 'a', cats: ['RPG', 'Adventure'] }, { id: 'b', cats: [] }],
);

assert.deepEqual(library.categories.map(category => category.name), ['RPG', 'Adventure'], 'existing category names are reused');
assert.deepEqual(library.games[0].categoryIds, ['manual', 'existing-rpg', 'created-1'], 'assignments preserve manual categories and avoid duplicates');
assert.deepEqual(library.games[1].categoryIds, [], 'unassigned games remain unchanged');
assert.deepEqual(undo, { before: [{ id: 'a', categoryIds: ['manual'] }], addedCategoryIds: ['created-1'] });
assert.equal(notices[0], 'Auto-sort applied · 2 reviewed collections');
assert.equal(celebrations[0], 'Auto-sort complete');

createAutoSortWorkflow({
  ...common,
  currentCats: library.categories,
  currentItems: library.games,
  autoSortUndo: undo,
}).undoAutoSort();

assert.deepEqual(library.categories.map(category => category.name), ['RPG'], 'empty categories created by the last sort are removed');
assert.deepEqual(library.games[0].categoryIds, ['manual'], 'undo restores the exact previous assignment');
assert.equal(undo, null);
assert.equal(notices.at(-1), 'Last Auto-sort assignment restored.');

console.log('PASS: Auto-sort reuses categories, preserves manual assignments, creates only missing categories and restores its exact last change.');
