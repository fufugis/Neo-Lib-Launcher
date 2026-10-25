const record = value => value && typeof value === 'object' && !Array.isArray(value);
const identifier = value => typeof value === 'string' && value.length > 0 && value.length <= 500 || typeof value === 'number' && Number.isFinite(value);
const labels = value => (Array.isArray(value) ? value : typeof value === 'string' ? [value] : []).flatMap(item => {
  const text = typeof item === 'string' ? item : record(item) ? item.description || item.name || item.label : null;
  return typeof text === 'string' ? [text] : [];
});
export function safeGameRecord(value = {}) {
  if (!record(value)) return {};
  const next = { ...value }, repaired = {};
  const set = (key, replacement) => {
    if (JSON.stringify(value[key]) === JSON.stringify(replacement)) return;
    repaired[key] = value[key]; next[key] = replacement;
  };
  for (const key of ['developers','publishers','genres','genreTags','screenshots']) if (value[key] != null) set(key, labels(value[key]));
  for (const key of ['categoryIds','libraryCategoryIds']) if (value[key] != null) {
    const members = (Array.isArray(value[key]) ? value[key] : identifier(value[key]) ? [value[key]] : []).filter(identifier);
    if (!identifier(value[key]) && (!Array.isArray(value[key]) || members.length !== value[key].length)) { next.homeLocked = true; next.recordQuarantined = true; }
    set(key, members);
  }
  for (const key of ['name','exePath','installDir','installdir','source','launcher','about','shortDescription','website','headerImage','portraitImage','coverUrl','background','icon','logo','logoImage','hero','heroArtworkOverride','heroArtworkOverrideSource','playerNotes','installedVersion','updateWatchUrl','launchArgs','workingDirectory']) {
    if (value[key] != null && typeof value[key] !== 'string') set(key, key === 'name' && typeof value[key] === 'number' ? String(value[key]) : '');
  }
  if (value.releaseDate != null && typeof value.releaseDate !== 'string') set('releaseDate', typeof value.releaseDate?.date === 'string' ? value.releaseDate.date : '');
  for (const key of ['artworkRevisions','launchRoutes']) if (value[key] != null && !Array.isArray(value[key])) set(key, []);
  if (Array.isArray(value.artworkRevisions)) set('artworkRevisions', value.artworkRevisions.filter(item => record(item) && Number.isFinite(item.at)).map(item => ({ ...item, ...(item.sources != null ? { sources: Object.fromEntries(Object.entries(record(item.sources) ? item.sources : {}).filter(([, source]) => typeof source === 'string')) } : {}), reason: typeof item.reason === 'string' ? item.reason : '', ...Object.fromEntries(['icon','cover','hero','background','logo'].filter(key => item[key] != null && typeof item[key] !== 'string').map(key => [key,''])) })));
  if (value.artworkSources != null) set('artworkSources', Object.fromEntries(Object.entries(record(value.artworkSources) ? value.artworkSources : {}).filter(([, source]) => typeof source === 'string')));
  if (value.capabilities != null) set('capabilities', (Array.isArray(value.capabilities) ? value.capabilities : typeof value.capabilities === 'string' ? [value.capabilities] : []).filter(item => typeof item === 'string' || record(item) && (typeof item.id === 'string' || typeof item.label === 'string')));
  const profile = value.genreProfile;
  const entries = values => Array.isArray(values) && values.every(entry => record(entry) && typeof entry.id === 'string' && typeof entry.label === 'string');
  if (profile != null && (!record(profile)
    || ['core','subgenres'].some(key => profile[key] != null && !entries(profile[key]))
    || profile.rawTags != null && (!Array.isArray(profile.rawTags) || profile.rawTags.some(tag => typeof tag !== 'string'))
    || profile.traits != null && (!record(profile.traits) || Object.values(profile.traits).some(values => !entries(values))))) set('genreProfile', null);
  // Retain exact original fields locally rather than silently erasing them.
  if (Object.keys(repaired).length) next.recordRecovery = { ...(record(value.recordRecovery) ? value.recordRecovery : {}), ...repaired };
  return next;
}

export function safeLibraryRecords(raw) {
  raw = record(raw) ? raw : {};
  const next = { ...raw }, quarantined = [];
  for (const key of ['games','tools','categories','toolCategories']) {
    const seen = new Set();
    next[key] = (Array.isArray(raw[key]) ? raw[key] : []).flatMap((item, index) => {
      if (!record(item) || !identifier(item.id) || seen.has(String(item.id))) {
        quarantined.push({ collection: key, index, value: item }); return [];
      }
      const clean = safeGameRecord(item);
      if (clean.recordQuarantined) { quarantined.push({ collection: key, index, value: item }); return []; }
      seen.add(String(item.id));
      return [clean];
    });
    if (key.endsWith('ategories')) {
      const privateIds = new Set((Array.isArray(raw[key]) ? raw[key] : []).filter(original => original?.private).map(original => String(original.id)));
      for (const item of next[key]) if (privateIds.has(String(item.id))) item.private = true;
    }
    next[key] = next[key].map(item => typeof item.name === 'string' ? item : { ...item, name: 'Recovered entry', recordRecovery: { ...item.recordRecovery, name: item.name ?? null } });
  }
  for (const key of ['gameOrderByCategory','toolOrderByCategory']) {
    next[key] = Object.fromEntries(Object.entries(record(raw[key]) ? raw[key] : {}).map(([id, values]) => [id, (Array.isArray(values) ? values : []).filter(identifier)]));
    if (raw[key] != null && JSON.stringify(next[key]) !== JSON.stringify(raw[key])) next.libraryFieldRecovery = { ...(record(next.libraryFieldRecovery) ? next.libraryFieldRecovery : {}), [key]: raw[key] };
  }
  if (quarantined.length) next.libraryRecovery = [...(Array.isArray(raw.libraryRecovery) ? raw.libraryRecovery : []), ...quarantined];
  return next;
}
