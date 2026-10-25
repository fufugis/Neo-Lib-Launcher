const fields = ['developers','publishers','genres','genreTags','screenshots'];
function normalizeMetadata(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const next = { ...value };
  if (value.capabilities != null) next.capabilities = (Array.isArray(value.capabilities) ? value.capabilities : typeof value.capabilities === 'string' ? [value.capabilities] : []).filter(item => typeof item === 'string' || item && typeof item === 'object' && (typeof item.id === 'string' || typeof item.label === 'string'));
  for (const key of fields) if (value[key] != null) {
    next[key] = (Array.isArray(value[key]) ? value[key] : typeof value[key] === 'string' ? [value[key]] : []).flatMap(item => {
      const label = typeof item === 'string' ? item : item && typeof item === 'object' ? item.description || item.name || item.label : null;
      return typeof label === 'string' ? [label] : [];
    });
  }
  for (const key of ['shortDescription','about','aboutTheGame','website','headerImage','portraitImage','capsuleImage','background','icon','logo','logoImage','hero']) if (value[key] != null && typeof value[key] !== 'string') next[key] = '';
  if (value.releaseDate != null && typeof value.releaseDate !== 'string') next.releaseDate = typeof value.releaseDate?.date === 'string' ? value.releaseDate.date : '';
  return next;
}
module.exports = { normalizeMetadata };
