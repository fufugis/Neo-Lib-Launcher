import assert from 'node:assert/strict';
import { achievementAvailability, gameCapabilities } from '../src/lib/game-capabilities-model.mjs';

const steamGame = {
  source: 'steam',
  capabilities: [
    { id: 'controller-full', label: 'Full controller support', source: 'steam' },
    { id: 'achievements', label: 'Achievements', source: 'steam' },
    { id: 'cloud-saves', label: 'Cloud saves', source: 'steam' },
  ],
  genreTags: ['Multiplayer'],
  achievementSummary: { source: 'steam', supported: true, total: 47, syncState: 'not-linked' },
};
assert.deepEqual(gameCapabilities(steamGame).map((item) => item.id), ['controller-full', 'achievements', 'cloud-saves', 'online-multiplayer']);
assert.equal(gameCapabilities(steamGame)[0].source, 'Steam');
assert.deepEqual(achievementAvailability(steamGame), { source: 'Steam', total: 47, syncState: 'not-linked' });

assert.deepEqual(gameCapabilities({ source: 'battlenet', genreTags: ['MMORPG', 'Multiplayer', 'Co-op'] }).map((item) => item.id), ['online-multiplayer', 'co-op']);
assert.equal(achievementAvailability({ achievementSummary: { supported: false } }), null);
assert.deepEqual(gameCapabilities({ source: 'web', genreTags: [] }), []);

console.log('Game capabilities preserve only exact source-declared feature evidence and never invent achievement progress.');
