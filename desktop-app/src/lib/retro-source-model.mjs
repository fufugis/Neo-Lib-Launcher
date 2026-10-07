import { appendArtworkRevision, artworkSnapshot } from './artwork-revision-model.mjs';
import { romLibraryEntry, romExtensions } from './emulation-library-model.mjs';

const ART = { portraitImage: 'cover', logoImage: 'logo', headerImage: 'hero', background: 'background', screenshots: 'background' };
const FIELDS = ['about', 'developers', 'publishers', 'genres', 'releaseDate', 'portraitImage', 'logoImage', 'headerImage', 'background', 'screenshots'];
const empty = value => value === undefined || value === null || value === '' || Array.isArray(value) && !value.length;
// Never accepts launch paths, ratings, progress, categories or credentials from a source.
export function reviewedRetroPatch(game, metadata, { replace = false } = {}) {
  const patch = {};
  for (const field of FIELDS) {
    const slot = ART[field];
    const occupied = field === 'portraitImage' ? game.portraitImage || game.coverUrl : game[field];
    if (!empty(metadata[field]) && (!slot || game.artworkLocks?.[slot] !== true) && (replace || empty(occupied))) patch[field] = metadata[field];
  }
  if (Object.keys(patch).length) {
    patch.metadataSource = metadata.metadataSource || 'skraper-export';
    patch.retroMetadataReviewed = true;
    patch.metadataFetchedAt = Date.now();
    const changedArt = Object.keys(patch).filter(field => ART[field]);
    if (changedArt.length) {
      patch.artworkSources = { ...game.artworkSources };
      for (const field of changedArt) patch.artworkSources[ART[field]] = patch.metadataSource;
      patch.artworkRevisions = appendArtworkRevision(game.artworkRevisions, artworkSnapshot(game, { reason: 'before-reviewed-retro-import' }));
    }
  }
  return patch;
}
export function retroEntryFromSource(profile, item, metadata = {}) {
  if (!profile?.emulatorPath || !profile.platform || profile.platform === 'generic') throw Error('Save an emulator profile with a specific platform first.');
  const extension = String(item.romPath || '').match(/\.[^.\\/]+$/)?.[0].toLowerCase();
  if (!romExtensions(profile.platform).includes(extension)) throw Error('This ROM format does not match the selected emulator profile. Extract archives manually when needed, then scan your ROM folder.');
  const base = romLibraryEntry({ profile, romPath: item.romPath, sizeBytes: item.sizeBytes });
  return { ...base, name: String(metadata.name || item.name || base.name).slice(0, 300), ...reviewedRetroPatch(base, metadata), retroMetadataReviewed: true };
}
