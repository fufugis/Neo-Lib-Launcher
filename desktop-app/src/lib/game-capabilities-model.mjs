// Capability badges are deliberately evidence-led.  We only surface a badge
// when the selected provider supplied the capability directly, or when an
// exact provider tag already stored on the game maps to one of these labels.
// Descriptions and AI summaries are never mined for capabilities.
const DEFINITIONS = Object.freeze([
  ['single-player', 'Single-player', ['single-player', 'single player']],
  ['online-multiplayer', 'Online multiplayer', ['multiplayer', 'online multiplayer', 'massively multiplayer']],
  ['local-multiplayer', 'Local multiplayer', ['local multiplayer', 'local co-op', 'local coop']],
  ['co-op', 'Co-op', ['co-op', 'coop', 'co op', 'online co-op', 'online coop']],
  ['pvp', 'PvP', ['pvp', 'online pvp', 'online competitive']],
  ['controller-full', 'Full controller support', ['full controller support']],
  ['controller-partial', 'Partial controller support', ['partial controller support']],
  ['achievements', 'Achievements', ['steam achievements', 'achievements']],
  ['cloud-saves', 'Cloud saves', ['steam cloud', 'cloud saves']],
  ['workshop', 'Workshop', ['steam workshop', 'workshop']],
  ['remote-play', 'Remote play', ['remote play on phone', 'remote play on tablet', 'remote play on tv', 'remote play together']],
]);

const normalize = (value) => String(value || '').toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9+]+/g, ' ').trim();
const SOURCE_LABELS = Object.freeze({ steam: 'Steam', epic: 'Epic Games', ea: 'EA app', gog: 'GOG', ubisoft: 'Ubisoft Connect', battlenet: 'Battle.net', riot: 'Riot Client', xbox: 'Xbox', rockstar: 'Rockstar', itch: 'itch.io', manual: 'Player' });

function definitionFor(value) {
  const key = normalize(value);
  return DEFINITIONS.find(([id, , aliases]) => normalize(id) === key || aliases.includes(key)) || null;
}

export function capabilitySourceLabel(source) {
  const key = normalize(source).replace(/ /g, '');
  return SOURCE_LABELS[key] || String(source || 'Metadata').trim() || 'Metadata';
}

export function gameCapabilities(game = {}) {
  const output = [];
  const seen = new Set();
  const add = (value, source = game.source, detail = '') => {
    const definition = definitionFor(typeof value === 'object' ? (value.id || value.label) : value);
    if (!definition || seen.has(definition[0])) return;
    seen.add(definition[0]);
    output.push(Object.freeze({ id: definition[0], label: definition[1], source: capabilitySourceLabel(value?.source || source), detail: String(value?.detail || detail || '').trim() }));
  };

  // Persisted provider capabilities always take precedence.
  (game.capabilities || []).forEach((entry) => add(entry, game.source));
  // Older entries do not yet have the dedicated field. Their direct provider
  // tags remain valid evidence, so recover only exact known feature labels.
  (game.genreTags || []).forEach((tag) => add(tag, game.source));
  return Object.freeze(output);
}

export function achievementAvailability(game = {}) {
  const record = game.achievementSummary;
  if (!record?.supported) return null;
  const linked = record.syncState === 'linked' && record.source === 'steam' && Boolean(record.appid) && String(record.appid) === String(game.appid || '');
  const total = record.total == null ? Number.NaN : Number(record.total);
  return Object.freeze({
    source: capabilitySourceLabel(record.source || game.source),
    total: Number.isFinite(total) && total >= 0 ? total : null,
    syncState: linked ? 'linked' : 'not-linked',
    earned: linked && Number.isSafeInteger(record.earned) && record.earned >= 0 ? record.earned : null,
    syncedAt: linked && Number.isSafeInteger(record.syncedAt) ? record.syncedAt : null,
  });
}
