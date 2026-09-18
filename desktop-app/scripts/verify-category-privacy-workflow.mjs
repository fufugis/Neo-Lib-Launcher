import assert from 'node:assert/strict';
import { createCategoryPrivacyWorkflow } from '../src/services/category-privacy-workflow.mjs';

const keys = { items: 'games', cats: 'categories', order: 'gameOrderByCategory' };

function harness(overrides = {}) {
  let library = overrides.library || {
    games: [
      { id: 'safe', name: 'Safe Game', categoryIds: ['regular'] },
      { id: 'secret', name: 'Secret Game', categoryIds: ['private'] },
    ],
    categories: [
      { id: 'regular', name: 'Regular', private: false },
      { id: 'private', name: 'Private', private: true, pinHash: 'hashed:1234' },
    ],
    gameOrderByCategory: {},
  };
  let pinThen = null;
  let pinModal = { open: false };
  const events = { notices: [], mascot: [], catModal: [], selected: [], selectedTools: [], settings: [], unlocked: [], prompts: [], confirms: [] };
  const setLibrary = (value) => { library = typeof value === 'function' ? value(library) : value; };
  const setPinThen = (value) => { pinThen = typeof value === 'function' ? value(pinThen) : value; };
  const setPinModal = (value) => { pinModal = typeof value === 'function' ? value(pinModal) : value; };
  const setUnlockedCategories = (value) => {
    const previous = events.unlocked.at(-1) || overrides.unlockedCategories || [];
    events.unlocked.push(typeof value === 'function' ? value(previous) : value);
  };
  const updateGame = (id, patch) => setLibrary((current) => ({
    ...current,
    games: current.games.map((game) => game.id === id ? { ...game, ...patch } : game),
  }));
  const workflow = createCategoryPrivacyWorkflow({
    setLibrary,
    sliceK: keys,
    setCatModal: (value) => events.catModal.push(value),
    notify: (message) => events.notices.push(message),
    settings: { mode: 'library' },
    unlockedCategories: overrides.unlockedCategories || [],
    setPinThen,
    setPinModal,
    askPrompt: async (config) => { events.prompts.push(config); return overrides.promptResult ?? null; },
    library,
    askConfirm: async (config) => { events.confirms.push(config); return overrides.confirmResult ?? false; },
    updateGame,
    catCtx: overrides.catCtx || { category: null },
    setCatCtx: () => {},
    setUnlockedCategories,
    setSelectedToolId: (value) => events.selectedTools.push(value),
    setSelectedId: (value) => events.selected.push(value),
    updateSetting: (patch) => events.settings.push(patch),
    uid: () => 'new-category',
    hashPin: (pin) => `hashed:${pin}`,
    onMascotActivity: (entry) => events.mascot.push(entry),
  });
  return { workflow, events, getLibrary: () => library, getPinThen: () => pinThen, getPinModal: () => pinModal };
}

{
  const { workflow, getLibrary, events } = harness();
  workflow.createCategory({ name: 'New category', colorId: 'cyan' });
  assert.equal(getLibrary().categories.at(-1).id, 'new-category');
  assert.equal(getLibrary().categories.at(-1).private, false);
  assert.match(events.notices.at(-1), /created/);
}

{
  const { workflow, getLibrary, getPinThen, getPinModal } = harness();
  await workflow.requestDeleteCategory(getLibrary().categories.find((category) => category.id === 'private'));
  assert.equal(getPinModal().mode, 'remove');
  getPinThen()('wrong');
  assert.equal(getPinModal().error, 'Wrong PIN.');
  getPinThen()('1234');
  assert.equal(getLibrary().categories.some((category) => category.id === 'private'), false);
  assert.equal(getLibrary().games.find((game) => game.id === 'secret').categoryIds.includes('private'), false);
}

{
  const { workflow, events, getLibrary, getPinThen } = harness();
  workflow.requestUnlock(getLibrary().categories.find((category) => category.id === 'private'));
  getPinThen()('1234');
  assert.deepEqual(events.unlocked.at(-1), ['private']);
  assert.equal(events.mascot.at(-1)?.preferenceKey, 'categoryPrivacy');
  assert.doesNotMatch(events.mascot.at(-1)?.body || '', /Secret Game/);
}

{
  const { workflow, events } = harness();
  workflow.panicLockPrivateLibrary();
  assert.deepEqual(events.unlocked.at(-1), []);
  assert.equal(events.selectedTools.at(-1), null);
  assert.equal(events.selected.at(-1), 'safe');
  assert.deepEqual(events.settings.at(-1), { mode: 'library', libraryViewMode: 'preview' });
  assert.match(events.notices.at(-1), /Safe Preview selected/);
  assert.match(events.mascot.at(-1)?.title || '', /Private Library locked/);
}

{
  const { workflow, getLibrary } = harness({ confirmResult: true });
  await workflow.clearRegularCategories();
  assert.deepEqual(getLibrary().categories.map((category) => category.id), ['private']);
  assert.deepEqual(getLibrary().games.find((game) => game.id === 'safe').categoryIds, []);
  assert.deepEqual(getLibrary().games.find((game) => game.id === 'secret').categoryIds, ['private']);
}

{
  const { workflow, getLibrary } = harness();
  workflow.moveGameToCategory('safe', 'regular', 'private');
  assert.deepEqual(getLibrary().games.find((game) => game.id === 'safe').categoryIds, ['private']);
}

console.log('PASS: category/privacy workflow preserves creation, assignment-only deletion, PIN checks, unlocking, panic locking, protected bulk removal and drag moves. Pure in-memory fixtures only.');
