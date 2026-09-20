import {
  advanceRefreshQueue,
  metadataRefreshTargets as selectMetadataRefreshTargets,
  startRefreshQueue,
  stopRefreshQueue,
} from '../state/metadata-refresh-state.mjs';
import { recordOperationDiagnostic } from './operation-journal.mjs';
import { cleanDescriptionText } from '../lib/descriptionFormatting.mjs';
import { portraitArtwork } from '../lib/game-artwork-model.mjs';

export function createMetadataWorkflow({
  isElectron,
  notify,
  setRefreshReview,
  setFetching,
  nativeApi,
  settings,
  setAcceptPreview,
  setTroubleshoot,
  updateGame,
  libraryRef,
  setMetadataRepairQueue,
  setTidyOpen,
  setSelectedId,
  setMode,
  setFetchPickerGame,
  metadataRepairQueue,
  currentItems,
  setConfirmCfg,
  guessNameFromPath,
  now = () => Date.now(),
}) {
  const refetchGame = async (g, opts = {}) => {
    if (!isElectron) { notify('Re-fetch only works in the installed app.'); return null; }
    if (!opts.silent && !opts.autoApply && !opts.forceSearch) {
      setRefreshReview({ games: [g], index: 0, field: 'all-locked', options: opts });
      return null;
    }
    setFetching(true);
    const query = opts.query || g.name || guessNameFromPath(g.exePath);
    const skip = [];
    if (opts.skipCurrentSource && g.source) skip.push(g.source);
    // SAFETY: if game already has a Steam appid, lock to that appid so refetch can NEVER
    // accidentally replace this game's data with another game's. User must explicitly
    // request a "Re-search" (different query) to escape the lock.
    // Battle.net owns its own product identity. An old/cross-store appid must
    // never bypass Blizzard's exact catalogue route during Re-fetch info.
    const lockedAppid = (!opts.forceSearch && g.appid && String(g.launcher || '').toLowerCase() !== 'battlenet') ? g.appid : null;
  
    // An imported launcher record can have a technical or shortened display
    // name. If the first automatic lookup comes up empty, quietly retry with
    // bounded clues from the selected executable, game folder, parent folder,
    // and nearby title/readme fields. This is the same evidence shown in the
    // manual picker, now used before asking the player to rescue a failed
    // import. Exact Steam app IDs remain locked and never fuzzy-researched.
    const queries = [query];
    if (!lockedAppid && g.exePath && nativeApi?.deriveMetadataHints) {
      try {
        const hints = await nativeApi.deriveMetadataHints({ exePath: g.exePath, currentName: g.name || query });
        for (const hint of (hints?.hints || []).slice(0, 8)) {
          const candidate = String(hint?.query || '').trim();
          if (candidate && !queries.some((existing) => existing.toLowerCase() === candidate.toLowerCase())) queries.push(candidate);
        }
      } catch { /* local hints are best effort; normal lookup still proceeds */ }
    }
  
    let result = null;
    let resolvedQuery = query;
    for (const candidate of queries) {
      result = await nativeApi.fetchMetadata({
        query: candidate,
        skipSources: skip,
        geminiKey: settings.geminiKey || '',
        aiModel: settings.aiModel || 'gemini-2.5-flash',
        lockedAppid,
        launcher: g.launcher || '',
        launcherProductId: g.launcherProductId || '',
        force: !opts.silent,
      });
      if (result) {
        resolvedQuery = candidate;
        break;
      }
    }
    // Accept-before-add: when called interactively (not silent), open the Accept
    // modal so the user can compare current vs proposed metadata before it's
    // applied. The modal will call onAccept(patch) to commit, or onTryAgain()
    // to re-search with a different name.
    // Battle.net's maintained product catalogue is an exact local-product
    // match, not a fuzzy store candidate.  Re-fetch should therefore do what
    // the button promises for existing WoW/Warcraft III imports: apply the
    // known Blizzard record directly instead of opening a generic accept
    // screen that makes the refresh appear to have done nothing.
    const authoritativeBattleNet = String(g.launcher || '').toLowerCase() === 'battlenet'
      && result?.source === 'battlenet'
      && !opts.forceSearch;
    if (!opts.silent && !opts.autoApply && !authoritativeBattleNet) {
      setFetching(false);
      setAcceptPreview({ open: true, game: g, proposed: result, busy: false });
      return result;
    }
    if (!result) {
      setFetching(false);
      if (!opts.silent && !opts.quiet) {
        notify(`No match for "${resolvedQuery}" — opening Troubleshoot…`);
        setTroubleshoot({ open: true, game: g });
      }
      return null;
    }
    const portrait = portraitArtwork(result);
    let coverUrl = portrait || result.capsuleImage || result.headerImage || null;
    if (coverUrl && coverUrl.startsWith('http')) {
      coverUrl = (await nativeApi.cacheImage(coverUrl, result.name)) || coverUrl;
    }
    updateGame(g.id, {
      name: result.name || g.name,
      appid: result.appid || g.appid,
      source: result.source,
      coverUrl: coverUrl || g.coverUrl,
      icon: g.icon || coverUrl || result.capsuleImage || result.headerImage || null,
      portraitImage: portrait || g.portraitImage || '',
      headerImage: result.headerImage || g.headerImage,
      background: result.background || g.background,
      shortDescription: result.shortDescription ? cleanDescriptionText(result.shortDescription) : g.shortDescription,
      about: result.about ? cleanDescriptionText(result.about) : g.about,
      genres: result.genres?.length ? result.genres : g.genres || [],
      genreTags: result.genreTags?.length ? result.genreTags : g.genreTags || [],
      developers: result.developers?.length ? result.developers : g.developers || [],
      publishers: result.publishers?.length ? result.publishers : g.publishers || [],
      releaseDate: result.releaseDate || g.releaseDate || '',
      metacritic: result.metacritic ?? g.metacritic,
      screenshots: result.screenshots?.length ? result.screenshots : g.screenshots || [],
      website: result.website || g.website || '',
      capabilities: result.capabilities?.length ? result.capabilities : g.capabilities || [],
      achievementSummary: result.achievementSummary?.supported ? result.achievementSummary : g.achievementSummary || null,
      metadataFetchedAt: Date.now(),
    });
    setFetching(false);
    if (!opts.quiet) notify(`Updated · ${result.name || g.name} (via ${result.source})`);
    return result;
  };
  
  // Apply a previewed metadata patch (called from AcceptMetadataModal).
  const applyAcceptedMetadata = async (g, patch) => {
    const portrait = portraitArtwork(patch);
    let coverUrl = portrait || patch.capsuleImage || patch.headerImage || patch.coverUrl || null;
    if (coverUrl && coverUrl.startsWith('http')) {
      coverUrl = (await nativeApi.cacheImage(coverUrl, patch.name)) || coverUrl;
    }
    updateGame(g.id, {
      ...patch,
      ...(patch.shortDescription != null ? { shortDescription: cleanDescriptionText(patch.shortDescription) } : {}),
      ...(patch.about != null ? { about: cleanDescriptionText(patch.about) } : {}),
      coverUrl: coverUrl || g.coverUrl,
      icon: g.icon || coverUrl || patch.headerImage || null,
      portraitImage: portrait || g.portraitImage || '',
    });
    notify(`Updated · ${patch.name || g.name} (via ${patch.source || 'manual'})`);
  };
  
  const beginMetadataRepairQueue = (queueGames) => {
    const queue = startRefreshQueue(queueGames || []);
    if (!queue.active) { notify('No unidentified games to review.'); return; }
    const first = (libraryRef.current.games || []).find((game) => game.id === queue.ids[0]);
    setMetadataRepairQueue(queue);
    setTidyOpen(false);
    if (first) {
      setSelectedId(first.id);
      setMode('library');
      setFetchPickerGame(first);
    }
  };
  
  const advanceMetadataRepairQueue = (outcome = 'skipped') => {
    if (!metadataRepairQueue.active) return;
    const currentGames = libraryRef.current.games || [];
    const result = advanceRefreshQueue(metadataRepairQueue, outcome, currentGames.map((game) => game.id));
    setAcceptPreview({ open: false, game: null, proposed: null, busy: false });
    setFetchPickerGame(null);
    if (result.complete) {
      recordOperationDiagnostic(result.operation);
      setMetadataRepairQueue(result.queue);
      notify(`Identity review complete · ${result.repaired} repaired · ${result.skipped} skipped`);
      return;
    }
    const nextGame = currentGames.find((game) => game.id === result.nextId);
    setMetadataRepairQueue(result.queue);
    if (nextGame) {
      setSelectedId(nextGame.id);
      setFetchPickerGame(nextGame);
    }
  };
  
  const stopMetadataRepairQueue = () => {
    const result = stopRefreshQueue(metadataRepairQueue);
    recordOperationDiagnostic(result.operation);
    setMetadataRepairQueue(result.queue);
    setFetchPickerGame(null);
    setAcceptPreview({ open: false, game: null, proposed: null, busy: false });
    notify(`Identity review stopped · ${result.repaired} repaired · ${result.skipped} skipped`);
  };
  
  const metadataRefreshTargets = (mode = 'missing') => {
    return selectMetadataRefreshTargets(currentItems, mode, now());
  };
  
  const requestMetadataRefresh = (mode = 'missing') => {
    const targets = metadataRefreshTargets(mode);
    const manual = currentItems.filter((g) => g.manualOverride).length;
    if (!targets.length) {
      notify(mode === 'full'
        ? 'No non-manual games are available for a full refresh.'
        : 'No incomplete or stale non-manual metadata needs a refresh.');
      return;
    }
    const isFull = mode === 'full';
    setConfirmCfg({
      open: true,
      title: isFull ? 'Full metadata refresh?' : 'Refresh missing metadata?',
      message: isFull
        ? `This will re-check metadata for ${targets.length} game${targets.length === 1 ? '' : 's'} and may take a while. Manual metadata is protected${manual ? `; ${manual} manual entr${manual === 1 ? 'y is' : 'ies are'} skipped.` : '.'}`
        : `This will refresh ${targets.length} game${targets.length === 1 ? '' : 's'} with missing identity, artwork, description, or older stored metadata. Manual metadata is protected${manual ? `; ${manual} manual entr${manual === 1 ? 'y is' : 'ies are'} skipped.` : '.'}`,
      confirmLabel: isFull ? `Refresh all ${targets.length}` : `Refresh ${targets.length}`,
      cancelLabel: 'Not now',
      onConfirm: () => refetchAll(mode),
    });
  };
  
  const refetchAll = async (mode = 'missing') => {
    if (currentItems.length === 0) return;
    const targets = metadataRefreshTargets(mode);
    const skipped = currentItems.length - targets.length;
    if (!targets.length) {
      notify(mode === 'full' ? 'No non-manual games are available for a full refresh.' : 'No incomplete or stale non-manual metadata needs a refresh.');
      return;
    }
    if (!isElectron) { notify('Re-fetch only works in the installed app.'); return; }
    setRefreshReview({ games: targets, index: 0, field: 'all-locked' });
    notify(`Review ${targets.length} games individually. Nothing is replaced without your selection.${skipped ? ` ${skipped} entries left untouched.` : ''}`);
  };

  return {
    refetchGame,
    applyAcceptedMetadata,
    beginMetadataRepairQueue,
    advanceMetadataRepairQueue,
    stopMetadataRepairQueue,
    metadataRefreshTargets,
    requestMetadataRefresh,
    refetchAll,
  };
}
