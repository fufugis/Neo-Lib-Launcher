import { deleteWorkspaceCategory, hydrateLibrary } from '../state/library-state.mjs';
import { clearLibraryGamesPreservingHome } from '../state/library-management-state.mjs';
import { normalizeGenreProfile, GENRE_TAXONOMY_VERSION } from '../lib/genreTaxonomy.js';
import { gamePathTarget, sameGamePath, removeGameEntries, relocatedGame } from '../state/missing-games-model.mjs';

export function createLibraryManagementWorkflow({ library, getLibrary = () => library, saveLibrary, resetPending = {current:false}, setLibrary, setUnlockedCategories, setSelectedId, setSelectedToolId, nativeApi, askConfirm, notify }) {
  const removeMissingGames = async rows => {
    if(!rows.length||!nativeApi?.auditGamePaths)return [];
    if(!await askConfirm({title:'Remove missing game entries?',message:`Remove ${rows.length} selected entries from Neo-Lib only? No installed files are deleted. Locations will be checked again before removal.`,confirmLabel:'Remove entries',cancelLabel:'Keep games',destructive:true}))return [];
    const current=getLibrary(),targets=rows.filter(row=>(current.games||[]).some(game=>game.id===row.id&&sameGamePath(game,row)));
    const checked=[];
    for(let index=0;index<targets.length;index+=100){
      const batch=targets.slice(index,index+100);
      const result=await nativeApi.auditGamePaths(batch.map(row=>({id:row.id,filePath:row.filePath,folderPath:row.folderPath})));
      if(!Array.isArray(result)||result.length!==batch.length)return [];
      checked.push(...result);
    }
    const ids=checked.filter(row=>row.status==='missing'&&targets.some(target=>target.id===row.id&&target.filePath===row.filePath&&target.folderPath===row.folderPath)).map(row=>row.id);
    const finalIds=ids.filter(id=>{const game=(getLibrary().games||[]).find(item=>item.id===id);return game&&sameGamePath(game,targets.find(row=>row.id===id));});
    setLibrary(previous=>removeGameEntries(previous,finalIds.filter(id=>sameGamePath((previous.games||[]).find(game=>game.id===id)||{},targets.find(row=>row.id===id)))));
    if(finalIds.length)setSelectedId(null);
    return finalIds;
  };
  const relocateMissingGame = async (target, patch) => {
    const game=(getLibrary().games||[]).find(item=>item.id===target.id);
    if(!game||!sameGamePath(game,target)){notify('This entry changed. Scan again before updating its location.');return false;}
    setLibrary(previous=>({...previous,games:(previous.games||[]).map(item=>item.id===target.id&&sameGamePath(item,target)?relocatedGame(item,patch):item)}));
    return true;
  };
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
    if(resetPending.current)return;
    resetPending.current=true;
    try{
    const firstConfirmed = await askConfirm({
      title: 'Reset the entire game library?',
      message: 'This removes all games, Tools and categories (including private categories) from Neo-Lib. It never deletes installed games or folders. Home layout/settings and playtime history stay; game ratings and progress are archived. Save a backup first if you may want entries back.',
      confirmLabel: 'Continue to final confirmation', cancelLabel: 'Cancel', destructive: true, typedConfirm: 'RESET',
    });
    if (!firstConfirmed) return;
    const secondConfirmed = await askConfirm({
      title: 'Final confirmation · Clear all game entries?',
      message: 'All Library entries, Tools and categories will be cleared. This cannot be undone from Settings. Installed files are not touched. Type CLEAR LIBRARY to confirm.',
      confirmLabel: 'Clear game library', cancelLabel: 'Keep my games', destructive: true, typedConfirm: 'CLEAR LIBRARY',
    });
    if (!secondConfirmed) return;
    const next=clearLibraryGamesPreservingHome(getLibrary());
    let saved=false;
    try{saved=await (saveLibrary?saveLibrary(next):nativeApi?.saveLibrary?.(next))===true;}catch{/* Keep the current Library if persistence fails. */}
    if(!saved){const error='The Library could not be saved, so nothing was cleared. Check storage access and try again, or export a backup first.';notify(error);return {ok:false,error};}
    setLibrary((previous) => clearLibraryGamesPreservingHome(previous));
    setSelectedId(null);
    setSelectedToolId(null);
    setUnlockedCategories([]);
    let artworkResult;
    try{artworkResult=await nativeApi?.clearLibraryArtwork?.();}catch{/* Optional cache cleanup must not prevent an already saved reset. */}
    notify(artworkResult?.ok?'Library cleared and saved: all games, Tools and categories removed. Home/settings/history and installed files were kept.':'Library cleared and saved. Some cached artwork could not be cleaned up; installed files and Home/settings/history were kept.');
    return {ok:true};
    }finally{resetPending.current=false;}
  };

  return { exportLibraryBackup, importLibraryBackup, confirmCategoryRemoval, removeCategoriesById, resetLibraryGames, removeMissingGames, relocateMissingGame };
}
