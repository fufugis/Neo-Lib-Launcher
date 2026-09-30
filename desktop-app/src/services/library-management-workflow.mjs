import { deleteWorkspaceCategory, hydrateLibrary } from '../state/library-state.mjs';
import { clearLibraryGamesPreservingHome } from '../state/library-management-state.mjs';
import { normalizeGenreProfile, GENRE_TAXONOMY_VERSION } from '../lib/genreTaxonomy';

export function createLibraryManagementWorkflow({ library, setLibrary, setUnlockedCategories, setSelectedId, setSelectedToolId, nativeApi, askConfirm, notify }) {
  const exportLibraryBackup = async () => {
    if (!nativeApi?.exportLibraryBackup) return notify('Library backup is available in the installed NEO-LIB app.');
    const result = await nativeApi.exportLibraryBackup(library);
    if (result?.canceled) return;
    if (!result?.ok) return notify(result?.error || 'Could not save the library backup.');
    notify(`Saved ${result.gameCount} games and all library metadata to your backup file.`);
  };

  const importLibraryBackup = async () => {
    if (!nativeApi?.importLibraryBackup) return notify('Library restore is available in the installed NEO-LIB app.');
    const result = await nativeApi.importLibraryBackup();
    if (result?.canceled) return;
    if (!result?.ok || !result.library) return notify(result?.error || 'This library backup could not be imported.');
    const confirmed = await askConfirm({
      title: 'Replace current Library?',
      message: `This will replace the current library with ${result.gameCount} games from the selected backup, including its categories, Tools and metadata. Settings, Home layout and playtime history stay as they are. Type IMPORT to continue.`,
      confirmLabel: 'Import backup', cancelLabel: 'Keep current library', destructive: true, typedConfirm: 'IMPORT',
    });
    if (!confirmed) return;
    const restored = hydrateLibrary(result.library, { normalizeGenres: normalizeGenreProfile, taxonomyVersion: GENRE_TAXONOMY_VERSION });
    setLibrary(restored);
    setUnlockedCategories([]);
    setSelectedId(restored.games[0]?.id || null);
    setSelectedToolId(restored.tools[0]?.id || null);
    notify(`Imported ${restored.games.length} games and their library metadata. Settings and Home layout were not changed.`);
  };

  const confirmCategoryRemoval = (count) => askConfirm({
    title: `Remove all ${count} categories?`,
    message: 'Games and their playtime stay in your library. Each PIN-protected category will ask for its PIN; skipping or failing a PIN keeps that category protected. Type REMOVE to continue.',
    confirmLabel: 'Continue', cancelLabel: 'Keep categories', destructive: true, typedConfirm: 'REMOVE',
  });

  const removeCategoriesById = async (ids = []) => {
    const removal = new Set(ids);
    if (!removal.size) return;
    setLibrary((previous) => [...removal].reduce((next, id) => deleteWorkspaceCategory(next, 'library', id), previous));
    setUnlockedCategories((previous) => previous.filter((id) => !removal.has(id)));
    notify(`Removed ${removal.size} categories. Their games and playtime remain.`);
  };

  const resetLibraryGames = async () => {
    const firstConfirmed = await askConfirm({
      title: 'Reset the entire game library?',
      message: 'This clears every game entry, its fetched details and cached artwork. Playtime, ratings and journey data are retained in a Home-data archive; Home layout/settings and playtime history are not changed. Categories and Tools are left alone. Save a backup first if you may want the game entries back.',
      confirmLabel: 'Continue to final confirmation', cancelLabel: 'Cancel', destructive: true, typedConfirm: 'RESET',
    });
    if (!firstConfirmed) return;
    const secondConfirmed = await askConfirm({
      title: 'Final confirmation · Clear all game entries?',
      message: 'The game list and cached artwork will be removed now. This cannot be undone from Settings. Type CLEAR LIBRARY to confirm.',
      confirmLabel: 'Clear game library', cancelLabel: 'Keep my games', destructive: true, typedConfirm: 'CLEAR LIBRARY',
    });
    if (!secondConfirmed) return;
    if (!nativeApi?.clearLibraryArtwork) return notify('The installed app is required to safely clear its cached artwork. No library data was changed.');
    const artworkResult = await nativeApi.clearLibraryArtwork();
    if (!artworkResult?.ok) return notify(artworkResult?.error || 'Cached artwork could not be cleared. No game entries were removed.');
    setLibrary((previous) => clearLibraryGamesPreservingHome(previous));
    setSelectedId(null);
    setUnlockedCategories([]);
    notify(`Cleared all game entries and ${artworkResult.removed} cached artwork files. Home/playtime data, categories and Tools were retained.`);
  };

  return { exportLibraryBackup, importLibraryBackup, confirmCategoryRemoval, removeCategoriesById, resetLibraryGames };
}
