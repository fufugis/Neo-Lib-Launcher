// Suppress only repeated launcher wording; keep meaningful custom names.
export function categoryHeaderLabel(category) {
  const normalize = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const aliases = { epicgames: 'epic', goggalaxy: 'gog', eaapp: 'ea', ubisoftconnect: 'ubi', ubisoft: 'ubi', battlenet: 'bnet', riotclient: 'riot', xboxgamepass: 'xbox', rockstargames: 'r', rockstar: 'r', itchio: 'itch' };
  const key = value => aliases[normalize(value)] || normalize(value);
  return category.logoLabel && key(category.name) === key(category.logoLabel) ? '' : category.name;
}
