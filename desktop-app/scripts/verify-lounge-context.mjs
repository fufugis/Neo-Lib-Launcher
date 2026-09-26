import assert from 'node:assert/strict';
import { loungeGuide, loungeSessionContext } from '../src/components/lounge/lounge-context.mjs';

const game = { id: 'one', name: 'Private title', playtime: 135, lastPlayedAt: Date.UTC(2024, 0, 2), journeyStatus: 'on-hold' };
const context = loungeSessionContext(game, { one: { status: 'available' } });
assert.equal(context.playtime, '2h 15m');
assert.equal(context.journey, 'On hold');
assert.match(context.lastPlayed, /2024/);
assert.equal(context.updateFlagged, true);
assert.match(context.updateNote, /possible update/);
assert.doesNotMatch(JSON.stringify(context), /Private title/);
assert.doesNotMatch(loungeGuide('all', context), /Private title/);
assert.match(loungeGuide('recent', null), /tracked sessions/);
assert.match(loungeGuide('favorites', null), /favorites/);
assert.equal(loungeSessionContext(null), null);
assert.equal(loungeSessionContext({ id: 'two', playtime: -4, lastPlayedAt: 'bad' }).lastPlayed, 'Not tracked yet');
assert.equal(loungeSessionContext({ id: 'two', playtime: 0 }, { two: { status: 'pending' } }).updateFlagged, false);

console.log('PASS: Lounge context uses tracked facts, cautious update wording and title-free static mascot guidance.');
