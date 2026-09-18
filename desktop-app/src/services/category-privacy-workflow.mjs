import {
  clearRegularGameCategories,
  deleteWorkspaceCategory,
  moveWorkspaceItem,
  reorderWorkspaceCategory,
  reorderWorkspaceItem,
} from '../state/library-state.mjs';
import { panicLockResult } from '../state/privacy-state.mjs';

export function createCategoryPrivacyWorkflow({
  setLibrary,
  sliceK,
  setCatModal,
  notify,
  settings,
  unlockedCategories,
  setPinThen,
  setPinModal,
  askPrompt,
  library,
  askConfirm,
  updateGame,
  catCtx,
  setCatCtx,
  setUnlockedCategories,
  setSelectedToolId,
  setSelectedId,
  updateSetting,
  uid,
  hashPin,
  onMascotActivity,
}) {
  const mascotActivity = (patch) => onMascotActivity?.({
    key: `privacy-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    expiresAt: Date.now() + 20_000,
    preferenceKey: 'categoryPrivacy',
    level: 'minor',
    ...patch,
  });
  const createCategory = (data) => {
    const c = { id: uid(), private: false, ...data };
    setLibrary((prev) => ({ ...prev, [sliceK.cats]: [...(prev[sliceK.cats] || []), c] }));
    setCatModal({ open: false, initial: null });
    notify(`Category "${c.name}" created`);
  };
  const updateCategory = (id, patch) => {
    setLibrary((prev) => ({
      ...prev,
      [sliceK.cats]: (prev[sliceK.cats] || []).map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  };
  const deleteCategory = (id) => {
    setLibrary((prev) => deleteWorkspaceCategory(prev, settings.mode, id));
    notify('Category deleted');
  };
  
  // Category removal is deliberately assignment-only: records, artwork,
  // playtime and the game itself always remain in the library.
  const requestDeleteCategory = async (category) => {
    if (!category) return;
    if (category.private && !unlockedCategories.includes(category.id)) {
      setPinThen(() => (pin) => {
        if (hashPin(pin) === category.pinHash) {
          deleteCategory(category.id);
          setPinModal({ open: false, mode: 'remove', category: null, error: '' });
        } else setPinModal((p) => ({ ...p, error: 'Wrong PIN.' }));
      });
      setPinModal({ open: true, mode: 'remove', category, error: '' });
      return;
    }
    const typed = await askPrompt({
      title: `Remove "${category.name}"?`,
      label: 'Type the category name to confirm. Its games move to Uncategorized and stay in NEO-LIB:',
      defaultValue: '',
      placeholder: category.name,
      confirmLabel: 'Remove category',
    });
    if (typed && typed.trim() === category.name) deleteCategory(category.id);
    else if (typed !== null) notify('Name did not match — removal cancelled.');
  };
  
  const clearRegularCategories = async () => {
    const count = (library.categories || []).filter((category) => !category.private).length;
    if (!count) return;
    const confirmed = await askConfirm({
      title: `Remove ${count} regular ${count === 1 ? 'category' : 'categories'}?`,
      message: 'Every game will remain in NEO-LIB and return to Uncategorized. Private categories stay protected, so hidden games cannot accidentally appear in your normal library.',
      confirmLabel: 'Remove regular categories',
      cancelLabel: 'Keep categories',
      destructive: true,
      typedConfirm: 'REMOVE',
    });
    if (!confirmed) return;
    setLibrary((prev) => clearRegularGameCategories(prev));
    notify(`${count} ${count === 1 ? 'category' : 'categories'} removed · games are now Uncategorized`);
  };
  
  const reorderCategory = (fromId, beforeId) => {
    setLibrary((prev) => reorderWorkspaceCategory(prev, settings.mode, fromId, beforeId));
  };
  
  /* --- Drag & drop --- */
  const moveGameToCategory = (gameId, fromCatId, toCatId, opts = {}) => {
    setLibrary((prev) => moveWorkspaceItem(prev, settings.mode, gameId, fromCatId, toCatId, {
      copy: opts.copy, beforeItemId: opts.beforeGameId,
    }));
  };
  
  const reorderGameInCategory = (catId, fromId, beforeId) => {
    setLibrary((prev) => reorderWorkspaceItem(prev, settings.mode, catId, fromId, beforeId));
  };
  
  const toggleGameInCategory = (game, categoryId) => {
    const has = (game.categoryIds || []).includes(categoryId);
    updateGame(game.id, {
      categoryIds: has
        ? (game.categoryIds || []).filter((c) => c !== categoryId)
        : [...(game.categoryIds || []), categoryId],
    });
  };
  
  /* --- Ghost categories --- */
  const requestUnlock = (category) => {
    setPinThen(() => (pin) => {
      if (hashPin(pin) === category.pinHash) {
        setUnlockedCategories((u) => [...new Set([...u, category.id])]);
        setPinModal({ open: false, mode: 'unlock', category: null, error: '' });
        mascotActivity({ title: 'Private category unlocked', body: 'Its games and their private Home information are visible again for this session.', voice: 'ack-alright-then' });
      } else {
        setPinModal((p) => ({ ...p, error: 'Wrong PIN.' }));
      }
    });
    setPinModal({ open: true, mode: 'unlock', category, error: '' });
  };
  
  const handleCategoryAction = async (action) => {
    const c = catCtx.category;
    setCatCtx({ open: false, category: null, anchor: null });
    if (!c) return;
    if (action === 'edit' || action === 'recolor') {
      setCatModal({ open: true, initial: c });
    } else if (action === 'delete') {
      await requestDeleteCategory(c);
    } else if (action === 'up' || action === 'down') {
      setLibrary((prev) => {
        const list = [...(prev[sliceK.cats] || [])];
        const i = list.findIndex((x) => x.id === c.id);
        const j = i + (action === 'up' ? -1 : 1);
        if (i < 0 || j < 0 || j >= list.length) return prev;
        [list[i], list[j]] = [list[j], list[i]];
        return { ...prev, [sliceK.cats]: list };
      });
    } else if (action === 'set-private') {
      setPinThen(() => (pin) => {
        updateCategory(c.id, { private: true, pinHash: hashPin(pin) });
        setPinModal({ open: false, mode: 'set', category: null, error: '' });
        notify(`"${c.name}" is now a Ghost category`);
        mascotActivity({ title: 'Private category protected', body: 'Its games are now hidden across Home, Wall, Preview and news until you unlock it.', voice: 'nice-good-job' });
      });
      setPinModal({ open: true, mode: 'set', category: c, error: '' });
    } else if (action === 'remove-private') {
      setPinThen(() => (pin) => {
        if (hashPin(pin) === c.pinHash) {
          updateCategory(c.id, { private: false, pinHash: null });
          setPinModal({ open: false, mode: 'remove', category: null, error: '' });
          notify('Privacy removed.');
          mascotActivity({ title: 'Private category unlocked permanently', body: 'That category no longer needs a PIN and can appear normally in your library.', voice: 'ack-alright-then' });
        } else setPinModal((p) => ({ ...p, error: 'Wrong PIN.' }));
      });
      setPinModal({ open: true, mode: 'remove', category: c, error: '' });
    }
  };

  const panicLockPrivateLibrary = () => {
    const result = panicLockResult(library.games || [], library.categories || []);
    if (!result.hasPrivate) return;
    setUnlockedCategories([]);
    setSelectedToolId(null);
    setSelectedId(result.selectedGameId);
    updateSetting({ mode: 'library', libraryViewMode: 'preview' });
    notify(result.selectedGameId ? 'Private categories veiled. Safe Preview selected.' : 'Private categories veiled. No non-private game is available for Preview.');
    mascotActivity({ title: 'Private Library locked', body: 'All PIN-protected categories are veiled again and NEO-LIB returned Preview to a safe game.', voice: 'take-a-look' });
  };

  return {
    createCategory,
    updateCategory,
    deleteCategory,
    requestDeleteCategory,
    clearRegularCategories,
    reorderCategory,
    moveGameToCategory,
    reorderGameInCategory,
    toggleGameInCategory,
    requestUnlock,
    handleCategoryAction,
    panicLockPrivateLibrary,
  };
}
