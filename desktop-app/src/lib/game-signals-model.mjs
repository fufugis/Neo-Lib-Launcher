import { gameCapabilities } from './game-capabilities-model.mjs';

export const GAME_SIGNAL_DEFINITIONS = Object.freeze([
  ['single-player', 'Single-player', 'feature'],
  ['online-multiplayer', 'Online multiplayer', 'feature'],
  ['local-multiplayer', 'Local multiplayer', 'feature'],
  ['co-op', 'Co-op', 'feature'],
  ['pvp', 'PvP', 'feature'],
  ['controller-full', 'Full controller support', 'feature'],
  ['controller-partial', 'Partial controller support', 'feature'],
  ['achievements', 'Achievements', 'feature'],
  ['cloud-saves', 'Cloud saves', 'feature'],
  ['workshop', 'Workshop', 'feature'],
  ['remote-play', 'Remote play', 'feature'],
  ['adult-content', 'Adult / NSFW', 'content'],
  ['sexual-content', 'Sexual content', 'content'],
  ['graphic-violence', 'Graphic violence', 'content'],
  ['horror', 'Horror', 'content'],
  ['installed', 'Installed locally', 'library'],
  ['emulated', 'Emulated game', 'library'],
  ['favorite', 'Favorite', 'library'],
  ['private', 'Private library', 'library'],
].map(([id, label, group]) => Object.freeze({ id, label, group })));

const DEFINITION_BY_ID = new Map(GAME_SIGNAL_DEFINITIONS.map((definition) => [definition.id, definition]));
const text = (value) => String(value || '').trim();

export function gameSignals(game = {}, { favorite = false, privateGame = false } = {}) {
  const output = [];
  const seen = new Set();
  const add = (id, source, detail = '') => {
    const definition = DEFINITION_BY_ID.get(id);
    if (!definition || seen.has(id)) return;
    seen.add(id);
    output.push(Object.freeze({ ...definition, source: text(source) || 'Library', detail: text(detail) }));
  };

  gameCapabilities(game).forEach((signal) => add(signal.id, signal.source, signal.detail));
  // Content signals require a deliberately stored exact flag. Never inspect a
  // title, description, artwork, folder name or AI summary to create one.
  for (const flag of Array.isArray(game.contentFlags) ? game.contentFlags : []) {
    const id = typeof flag === 'string' ? flag : flag?.id;
    if (DEFINITION_BY_ID.get(id)?.group === 'content') add(id, flag?.source || 'Player', flag?.detail);
  }
  if (game.installed === true || text(game.exePath)) add('installed', 'Local library');
  if (game.source === 'emulation' || text(game.emulatorProfileId)) add('emulated', 'Retro Profile');
  if (favorite) add('favorite', 'Player');
  if (privateGame) add('private', 'Player');
  return Object.freeze(output);
}
