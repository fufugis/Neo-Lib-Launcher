const selectedIds = (ids) => new Set(Array.isArray(ids) ? ids : []);

export function collectionFavoriteIds(currentIds = [], ids = [], favorite) {
  const picked = selectedIds(ids);
  if (!picked.size) return currentIds;
  return favorite ? [...new Set([...currentIds, ...picked])] : currentIds.filter((id) => !picked.has(id));
}

export function collectionJourneyStatus(games = [], ids = [], journeyStatus = '') {
  const picked = selectedIds(ids);
  if (!picked.size || !journeyStatus) return games;
  return games.map((game) => picked.has(game.id) ? { ...game, journeyStatus } : game);
}

export function collectionCategoryAssignment(games = [], ids = [], categoryId = '') {
  const picked = selectedIds(ids);
  if (!picked.size || !categoryId) return games;
  return games.map((game) => picked.has(game.id) ? { ...game, categoryIds: [...new Set([...(game.categoryIds || []), categoryId])] } : game);
}

export function collectionReviewPlan(games = [], ids = [], kind = 'metadata') {
  const picked = selectedIds(ids);
  const selected = games.filter((game) => picked.has(game.id));
  const targets = kind === 'metadata' ? selected.filter((game) => !game.manualOverride) : selected;
  return Object.freeze({ kind, selected, targets, skipped: selected.length - targets.length, field: kind === 'artwork' ? 'artwork' : 'all-locked' });
}

// Inert until the separate external-library-root feature supplies a reviewed
// root catalogue. Collection Mode never accepts an arbitrary path or scans it.
export function collectionExternalRootAssignment(games = [], ids = [], rootId = '', roots = []) {
  const picked = selectedIds(ids);
  const root = roots.find((item) => item.id === rootId && item.enabled !== false);
  if (!picked.size || !root) return games;
  return games.map((game) => picked.has(game.id) ? { ...game, externalLibraryRootId: root.id } : game);
}

export function createCollectionReviewWorkflow({ games = [], categories = [], unlockedCategoryIds = [], setConfirmCfg, setRefreshReview, setLibrary, sliceKey = 'games', notify }) {
  const requestReview = (ids, kind = 'metadata') => {
    const plan = collectionReviewPlan(games, ids, kind);
    if (!plan.selected.length) return;
    if (!plan.targets.length) { notify?.('The selected games use protected manual metadata, so nothing was queued.'); return; }
    const label = kind === 'artwork' ? 'artwork' : 'metadata';
    setConfirmCfg?.({
      open: true,
      title: `Review ${label} for ${plan.targets.length} game${plan.targets.length === 1 ? '' : 's'}?`,
      message: `NEO-LIB will open each selected game one at a time. Nothing changes until you choose and apply a result.${kind === 'artwork' ? ' Protected artwork slots stay untouched and the previous artwork remains restorable.' : ''}${plan.skipped ? `\n\n${plan.skipped} manual entr${plan.skipped === 1 ? 'y is' : 'ies are'} excluded.` : ''}`,
      confirmLabel: `Start ${label} review`,
      cancelLabel: 'Not now',
      onConfirm: () => setRefreshReview?.({ games: plan.targets, index: 0, field: plan.field, collectionReview: true }),
    });
  };
  const protect = (ids, categoryId) => {
    const picked = selectedIds(ids);
    const unlocked = new Set(unlockedCategoryIds);
    const category = categories.find((item) => item.id === categoryId && item.private && unlocked.has(item.id));
    const targets = games.filter((game) => picked.has(game.id));
    if (!category || !targets.length) return;
    setConfirmCfg?.({
      open: true,
      title: `Protect ${targets.length} game${targets.length === 1 ? '' : 's'} in ${category.name}?`,
      message: `The selected games will be added to the private category “${category.name}”. When private categories are locked, their titles, artwork and activity disappear across NEO-LIB. Existing normal category assignments are preserved.`,
      confirmLabel: `Protect ${targets.length}`,
      cancelLabel: 'Not now',
      onConfirm: () => { setLibrary?.((previous) => ({ ...previous, [sliceKey]: collectionCategoryAssignment(previous[sliceKey] || [], [...picked], category.id) })); notify?.(`Protected ${targets.length} game${targets.length === 1 ? '' : 's'} in ${category.name}.`); },
    });
  };
  return Object.freeze({ reviewMetadata: (ids) => requestReview(ids, 'metadata'), reviewArtwork: (ids) => requestReview(ids, 'artwork'), protect });
}
