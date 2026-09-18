export function createAutoSortWorkflow({
  currentCats,
  currentItems,
  setLibrary,
  sliceK,
  setAutoSortUndo,
  notify,
  fireConfetti,
  autoSortUndo,
  uid,
}) {
  const applyAutoSort = (defaultCats, assignments) => {
    const nameToCategory = {};
    for (const category of currentCats) nameToCategory[category.name.toLowerCase()] = category;
    const addedCategories = [];
    for (const definition of defaultCats) {
      if (nameToCategory[definition.name.toLowerCase()]) continue;
      const category = { id: uid(), name: definition.name, colorId: definition.colorId, private: false };
      nameToCategory[definition.name.toLowerCase()] = category;
      addedCategories.push(category);
    }
    const before = currentItems
      .filter(game => assignments.some(assignment => assignment.id === game.id && assignment.cats.length))
      .map(game => ({ id: game.id, categoryIds: [...(game.categoryIds || [])] }));
    setLibrary(previous => {
      const items = (previous[sliceK.items] || []).map(game => {
        const assignment = assignments.find(candidate => candidate.id === game.id);
        if (!assignment || assignment.cats.length === 0) return game;
        const categoryIds = new Set(game.categoryIds || []);
        for (const categoryName of assignment.cats) {
          const category = nameToCategory[categoryName.toLowerCase()];
          if (category) categoryIds.add(category.id);
        }
        return { ...game, categoryIds: [...categoryIds] };
      });
      return {
        ...previous,
        [sliceK.cats]: [...(previous[sliceK.cats] || []), ...addedCategories],
        [sliceK.items]: items,
      };
    });
    setAutoSortUndo({ before, addedCategoryIds: addedCategories.map(category => category.id) });
    notify(`Auto-sort applied · ${defaultCats.length} reviewed collection${defaultCats.length === 1 ? '' : 's'}`);
    fireConfetti('Auto-sort complete');
  };

  const undoAutoSort = () => {
    if (!autoSortUndo) return;
    setLibrary(previous => {
      const beforeById = new Map(autoSortUndo.before.map(entry => [entry.id, entry.categoryIds]));
      const items = (previous[sliceK.items] || []).map(game => beforeById.has(game.id)
        ? { ...game, categoryIds: beforeById.get(game.id) }
        : game);
      const createdIds = new Set(autoSortUndo.addedCategoryIds || []);
      const categories = (previous[sliceK.cats] || []).filter(category => {
        if (!createdIds.has(category.id)) return true;
        return items.some(game => (game.categoryIds || []).includes(category.id));
      });
      return { ...previous, [sliceK.cats]: categories, [sliceK.items]: items };
    });
    setAutoSortUndo(null);
    notify('Last Auto-sort assignment restored.');
  };

  return { applyAutoSort, undoAutoSort };
}
