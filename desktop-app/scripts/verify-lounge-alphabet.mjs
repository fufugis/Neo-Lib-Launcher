import assert from 'node:assert/strict';
import { filterLoungeLetter, loungeAlphabetCounts, loungeGameLetter } from '../src/components/lounge/lounge-alphabet-model.mjs';

const games = [{ id: 1, name: 'Age of Wonders' }, { id: 2, name: 'anno 1800' }, { id: 3, name: 'Élan' }, { id: 4, name: '3DMark' }, { id: 5, name: '' }];
assert.equal(loungeGameLetter(games[2]), 'E');
assert.equal(loungeGameLetter(games[3]), '#');
assert.equal(loungeAlphabetCounts(games).get('A'), 2);
assert.equal(loungeAlphabetCounts(games).get('#'), 2);
assert.deepEqual(filterLoungeLetter(games, 'A').map(game => game.id), [1, 2]);
assert.deepEqual(filterLoungeLetter(games, '#').map(game => game.id), [4, 5]);
assert.deepEqual(filterLoungeLetter(games).map(game => game.id), [1, 2, 3, 4, 5]);
assert.equal(loungeAlphabetCounts(null).size, 0);
console.log('PASS: Lounge A–Z jump groups visible game names without changing the source list.');
