/*
 * NEO-LIB Genre Intelligence
 *
 * `genres` from stores are intentionally left untouched as source evidence.
 * This module creates a compact, predictable profile alongside them:
 *   core genres → specific subgenres → traits (mechanics/modes/themes/view).
 *
 * Matching is exact-alias based, never a loose substring search through a
 * description. That is deliberate: a game mentioning "shoot" must not become
 * a Shooter, and "RPG elements" must not silently become the game's identity.
 */

export const GENRE_TAXONOMY_VERSION = 1;

export const CORE_GENRES = [
  ['action', 'Action'], ['adventure', 'Adventure'], ['rpg', 'RPG'],
  ['shooter', 'Shooter'], ['strategy', 'Strategy'], ['simulation', 'Simulation'],
  ['racing', 'Racing'], ['sports', 'Sports'], ['fighting', 'Fighting'],
  ['platformer', 'Platformer'], ['puzzle', 'Puzzle'], ['horror', 'Horror'],
  ['survival', 'Survival'], ['roguelike', 'Roguelike'],
  ['visual-novel', 'Visual Novel & Interactive Fiction'],
  ['management-building', 'Management & Building'],
  ['sandbox-exploration', 'Sandbox & Exploration'],
  ['card-board', 'Card & Board'], ['rhythm-music', 'Rhythm & Music'],
  ['casual-party', 'Casual & Party'],
].map(([id, label]) => ({ id, label }));

const definition = (id, label, core, aliases) => ({ id, label, core, aliases: [label, ...aliases] });

// Specific gameplay identities. These are intentionally not a flat list of
// sidebar folders; they are metadata shown and filtered under their core genre.
export const SUBGENRES = [
  definition('action-rpg', 'Action RPG', ['rpg', 'action'], ['arpg']),
  definition('soulslike', 'Soulslike', ['rpg', 'action'], ['souls-like']),
  definition('jrpg', 'JRPG', ['rpg'], ['japanese rpg']),
  definition('crpg', 'CRPG', ['rpg'], ['computer rpg']),
  definition('tactical-rpg', 'Tactical RPG', ['rpg', 'strategy'], ['strategy rpg']),
  definition('mmorpg', 'MMORPG', ['rpg'], ['massively multiplayer rpg']),
  definition('dungeon-crawler', 'Dungeon Crawler', ['rpg'], []),
  definition('looter-shooter', 'Looter Shooter', ['shooter', 'rpg'], ['loot shooter']),
  definition('hero-shooter', 'Hero Shooter', ['shooter'], []),
  definition('tactical-shooter', 'Tactical Shooter', ['shooter'], []),
  definition('arena-shooter', 'Arena Shooter', ['shooter'], []),
  definition('battle-royale', 'Battle Royale', ['shooter', 'action'], []),
  definition('fps', 'First-Person Shooter', ['shooter'], ['fps']),
  definition('third-person-shooter', 'Third-Person Shooter', ['shooter'], ['tps']),
  definition('top-down-shooter', 'Top-Down Shooter', ['shooter'], []),
  definition('twin-stick-shooter', 'Twin-Stick Shooter', ['shooter'], ['twin stick shooter']),
  definition('roguelite', 'Roguelite', ['roguelike'], ['rogue-lite']),
  definition('action-roguelike', 'Action Roguelike', ['roguelike', 'action'], ['action rogue-like']),
  definition('traditional-roguelike', 'Traditional Roguelike', ['roguelike'], ['traditional rogue-like']),
  definition('roguevania', 'Roguevania', ['roguelike', 'platformer'], []),
  definition('metroidvania', 'Metroidvania', ['platformer', 'adventure'], []),
  definition('precision-platformer', 'Precision Platformer', ['platformer'], []),
  definition('open-world-survival-craft', 'Open-World Survival Craft', ['survival', 'sandbox-exploration'], ['survival crafting', 'survival craft']),
  definition('survival-horror', 'Survival Horror', ['survival', 'horror'], []),
  definition('extraction-shooter', 'Extraction Shooter', ['shooter', 'survival'], ['extraction']),
  definition('immersive-sim', 'Immersive Sim', ['adventure', 'action'], ['immersive simulation']),
  definition('stealth', 'Stealth', ['action', 'adventure'], []),
  definition('hack-and-slash', 'Hack and Slash', ['action'], ['hack & slash']),
  definition('beat-em-up', "Beat 'em up", ['action', 'fighting'], ['beat em up', 'brawler']),
  definition('character-action', 'Character Action', ['action'], ['character action game']),
  definition('turn-based-strategy', 'Turn-Based Strategy', ['strategy'], []),
  definition('turn-based-tactics', 'Turn-Based Tactics', ['strategy'], []),
  definition('real-time-strategy', 'Real-Time Strategy', ['strategy'], ['rts']),
  definition('real-time-tactics', 'Real-Time Tactics', ['strategy'], []),
  definition('4x', '4X', ['strategy'], []),
  definition('tower-defense', 'Tower Defense', ['strategy'], []),
  definition('moba', 'MOBA', ['strategy'], []),
  definition('city-builder', 'City Builder', ['management-building', 'simulation'], ['city building']),
  definition('base-building', 'Base Building', ['management-building', 'simulation'], ['base builder']),
  definition('colony-sim', 'Colony Sim', ['management-building', 'simulation'], ['colony simulation']),
  definition('farming-sim', 'Farming Sim', ['simulation'], ['farm sim', 'farming simulation']),
  definition('life-sim', 'Life Sim', ['simulation'], ['life simulation']),
  definition('vehicle-sim', 'Vehicle Sim', ['simulation', 'racing'], ['vehicle simulation']),
  definition('dating-sim', 'Dating Sim', ['visual-novel', 'simulation'], ['dating simulation']),
  definition('walking-sim', 'Walking Sim', ['adventure'], ['walking simulator']),
  definition('point-and-click', 'Point & Click', ['adventure'], ['point and click']),
  definition('interactive-fiction', 'Interactive Fiction', ['visual-novel'], []),
  definition('choose-your-own-adventure', 'Choose Your Own Adventure', ['visual-novel'], []),
  definition('deckbuilder', 'Deckbuilder', ['card-board', 'strategy'], ['deck building']),
  definition('card-battler', 'Card Battler', ['card-board', 'strategy'], []),
  definition('collectible-card-game', 'Collectible Card Game', ['card-board'], ['ccg', 'trading card game']),
  definition('board-game', 'Board Game', ['card-board'], []),
  definition('combat-racing', 'Combat Racing', ['racing', 'action'], []),
  definition('arcade-racing', 'Arcade Racing', ['racing'], []),
  definition('sim-racing', 'Sim Racing', ['racing', 'simulation'], ['racing sim']),
  definition('rhythm', 'Rhythm', ['rhythm-music'], []),
  definition('music-game', 'Music Game', ['rhythm-music'], []),
  definition('party-game', 'Party Game', ['casual-party'], []),
  definition('hidden-object', 'Hidden Object', ['puzzle'], []),
  definition('match-3', 'Match 3', ['puzzle'], ['match-three']),
  definition('sokoban', 'Sokoban', ['puzzle'], []),
  definition('psychological-horror', 'Psychological Horror', ['horror'], []),
];

const trait = (id, label, group, aliases = []) => ({ id, label, group, aliases: [label, ...aliases] });
export const TRAITS = [
  trait('single-player', 'Single-player', 'modes', ['singleplayer']),
  trait('local-multiplayer', 'Local Multiplayer', 'modes', ['local co-op', 'local coop']),
  trait('online-multiplayer', 'Online Multiplayer', 'modes', ['multiplayer', 'massively multiplayer']),
  trait('co-op', 'Co-op', 'modes', ['coop', 'co op', 'online co-op', 'online coop']),
  trait('pvp', 'PvP', 'modes', ['player versus player']),
  trait('pve', 'PvE', 'modes', ['player versus environment']),
  trait('first-person', 'First-person', 'perspectives', ['first person']),
  trait('third-person', 'Third-person', 'perspectives', ['third person']),
  trait('top-down', 'Top-down', 'perspectives', ['top down']),
  trait('isometric', 'Isometric', 'perspectives'),
  trait('side-scroller', 'Side-scroller', 'perspectives', ['side scroller']),
  trait('2d', '2D', 'perspectives'), trait('2-5d', '2.5D', 'perspectives'), trait('3d', '3D', 'perspectives'),
  trait('open-world', 'Open world', 'mechanics', ['open-world']),
  trait('procedural-generation', 'Procedural generation', 'mechanics', ['procedural']),
  trait('crafting', 'Crafting', 'mechanics'), trait('resource-management', 'Resource management', 'mechanics'),
  trait('turn-based-combat', 'Turn-based combat', 'mechanics'), trait('choices-matter', 'Choices matter', 'mechanics'),
  trait('sci-fi', 'Sci-fi', 'themes', ['science fiction']), trait('fantasy', 'Fantasy', 'themes'),
  trait('space', 'Space', 'themes'), trait('zombies', 'Zombies', 'themes'), trait('medieval', 'Medieval', 'themes'),
  trait('anime', 'Anime', 'themes'), trait('dark-fantasy', 'Dark fantasy', 'themes'),
  trait('relaxing', 'Relaxing', 'themes'), trait('atmospheric', 'Atmospheric', 'themes'),
];

const canonicalKey = (value) => String(value || '').toLowerCase()
  .replace(/[’']/g, '')
  .replace(/[^a-z0-9+]+/g, ' ')
  .trim();

const makeAliasIndex = (definitions) => {
  const result = new Map();
  definitions.forEach((item) => item.aliases.forEach((alias) => result.set(canonicalKey(alias), item)));
  return result;
};

const coreIndex = makeAliasIndex(CORE_GENRES.map((item) => ({ ...item, aliases: [item.label] })));
// Common provider spelling variants that belong to a core genre rather than a
// different subgenre. Keep this explicit so matching remains deterministic.
const addCoreAliases = (id, aliases) => {
  const item = CORE_GENRES.find((genre) => genre.id === id);
  aliases.forEach((alias) => coreIndex.set(canonicalKey(alias), item));
};
coreIndex.set(canonicalKey('Rogue-like'), CORE_GENRES.find((item) => item.id === 'roguelike'));
coreIndex.set(canonicalKey('Rogue like'), CORE_GENRES.find((item) => item.id === 'roguelike'));
addCoreAliases('rpg', ['Role-playing', 'Role Playing']);
addCoreAliases('visual-novel', ['Visual Novel', 'Interactive Fiction']);
addCoreAliases('management-building', ['Management', 'Building']);
addCoreAliases('sandbox-exploration', ['Sandbox', 'Exploration']);
addCoreAliases('card-board', ['Card Game', 'Tabletop']);
addCoreAliases('rhythm-music', ['Music']);
addCoreAliases('casual-party', ['Casual']);
const subgenreIndex = makeAliasIndex(SUBGENRES);
const traitIndex = makeAliasIndex(TRAITS);
const sourceWeight = { steam: 0.98, gog: 0.94, vndb: 0.94, itch: 0.84, dlsite: 0.82, ai: 0.58, web: 0.42, manual: 1 };

const addUnique = (list, item) => list.some((entry) => entry.id === item.id) ? list : [...list, item];

/**
 * Converts provider tags into a stable profile. `rawTags` must be direct
 * source evidence—not words extracted from a description. User-supplied
 * profiles can be merged later with source: "manual" and always win.
 */
export function normalizeGenreProfile({ rawTags = [], source = 'web', existing = null } = {}) {
  // Launcher imports use values such as "steam-import" for provenance. The
  // genre evidence itself is still Steam evidence, so retain that confidence.
  const profileSource = String(source || 'web').toLowerCase().replace(/-import$/, '');
  let core = []; let subgenres = []; let traits = { mechanics: [], modes: [], perspectives: [], themes: [] }; const unresolved = []; const sourceTags = [];
  const seenRaw = new Set();
  for (const raw of rawTags) {
    const label = String(raw || '').trim(); const key = canonicalKey(label);
    if (!key || seenRaw.has(key)) continue;
    seenRaw.add(key);
    sourceTags.push(label);
    const subgenre = subgenreIndex.get(key);
    const directCore = coreIndex.get(key);
    const traitMatch = traitIndex.get(key);
    if (subgenre) { subgenres = addUnique(subgenres, subgenre); subgenre.core.forEach((id) => { const item = CORE_GENRES.find((genre) => genre.id === id); if (item) core = addUnique(core, item); }); continue; }
    if (directCore) { core = addUnique(core, directCore); continue; }
    if (traitMatch) { traits = { ...traits, [traitMatch.group]: addUnique(traits[traitMatch.group], traitMatch) }; continue; }
    unresolved.push(label);
  }
  const inherited = existing?.source === 'manual' ? existing : null;
  if (inherited) return { ...inherited, rawTags: Array.from(new Set([...(inherited.rawTags || []), ...rawTags])), source: 'manual', taxonomyVersion: GENRE_TAXONOMY_VERSION };
  const matched = core.length + subgenres.length + Object.values(traits).flat().length;
  return {
    taxonomyVersion: GENRE_TAXONOMY_VERSION,
    source: profileSource,
    confidence: matched ? Number((sourceWeight[profileSource] || 0.5).toFixed(2)) : 0,
    rawTags: sourceTags,
    core: core.map(({ id, label }) => ({ id, label })),
    subgenres: subgenres.map(({ id, label }) => ({ id, label })),
    traits: Object.fromEntries(
      Object.entries(traits).map(([group, values]) => [
        group,
        values.map(({ id, label }) => ({ id, label })),
      ]),
    ),
    unresolved,
  };
}

export function genreDisplayGroups(profile) {
  if (!profile) return [];
  const groups = [
    ['Core genre', profile.core], ['Subgenres', profile.subgenres],
    ['Playstyle', [...(profile.traits?.mechanics || []), ...(profile.traits?.modes || [])]],
    ['Perspective', profile.traits?.perspectives || []], ['Themes', profile.traits?.themes || []],
  ];
  return groups.filter(([, values]) => values?.length);
}
