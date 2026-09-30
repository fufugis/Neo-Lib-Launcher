import assert from 'node:assert/strict';
import { clearLibraryGamesPreservingHome } from '../src/state/library-management-state.mjs';
import { hydrateLibrary } from '../src/state/library-state.mjs';

const categories = [{ id: 'private', name: 'Private', private: true, pinHash: 'hash' }];
const tools = [{ id: 'tool', name: 'Tool' }];
const library = {
  games: [{ id: 'g1', name: 'Fetched Title', coverUrl: 'file:///covers/a.png', description: 'Fetched description', playtime: 77, lastPlayedAt: 123, rating: 4.5, journeyStatus: 'started', addedAt: 55 }],
  categories,
  gameOrderByCategory: { private: ['g1'] },
  tools,
  toolCategories: [],
  toolOrderByCategory: {},
};
const cleared = clearLibraryGamesPreservingHome(library);
assert.deepEqual(cleared.games, [], 'reset removes every visible game record and its fetched data');
assert.deepEqual(cleared.gameOrderByCategory, {}, 'reset clears game ordering without changing category definitions');
assert.equal(cleared.categories, categories, 'reset preserves categories and their PIN hashes');
assert.equal(cleared.tools, tools, 'reset leaves the separate Tools workspace alone');
assert.deepEqual(cleared.homeGameDataArchive.g1, {
  id: 'g1', playtime: 77, lastPlayedAt: 123, rating: 4.5, journeyStatus: 'started', addedAt: 55,
}, 'playtime, rating and journey fields survive without retaining fetched title/art/description');
assert.deepEqual(hydrateLibrary(cleared).homeGameDataArchive, cleared.homeGameDataArchive, 'Home data archive persists through library hydration/restart');
console.log('Library reset preservation passed (empty game list; Home metrics, categories and Tools retained).');
