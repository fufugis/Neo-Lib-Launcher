const normalizedPath = value => String(value || '').trim().replace(/\//g, '\\').replace(/\\+$/, '').toLowerCase();

export function mergeRetroImport(library = {}, entries = [], createId = () => `${Date.now()}`, now = Date.now()) {
  const games = Array.isArray(library.games) ? library.games : [];
  const categories = Array.isArray(library.categories) ? library.categories : [];
  const knownPaths = new Set(games.map(game => normalizedPath(game.romPath)).filter(Boolean));
  const imported = [];
  const categoryById = new Map(categories.map(category => [category.id, category]));
  for (const source of Array.isArray(entries) ? entries : []) {
    const romPath = normalizedPath(source?.romPath);
    if (!romPath || knownPaths.has(romPath) || !source?.exePath) continue;
    knownPaths.add(romPath);
    const categoryId = source.categoryIds?.[0] || `retro-${source.retroPlatform || 'generic'}`;
    if (!categoryById.has(categoryId)) categoryById.set(categoryId, { id: categoryId, name: source.platform || 'Retro games', color: '#7c5cff', emulation: true, platform: source.retroPlatform || 'generic' });
    imported.push({ id: createId(), librarySeenAt: null, addedAt: Number(source.addedAt) || now, ...source, categoryIds: [categoryId] });
  }
  return { library: { ...library, categories: [...categoryById.values()], games: [...imported, ...games] }, imported };
}
