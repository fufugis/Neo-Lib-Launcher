const assert = require('node:assert/strict');
const { createSteamGridDbArtworkService } = require('../electron/providers/steamgriddb-artwork-service.cjs');

(async () => {
  const calls = [];
  const service = createSteamGridDbArtworkService({
    async httpGetJson(url, timeout, headers) {
      calls.push({ url, timeout, headers });
      if (url.includes('/search/')) return { success: true, data: [{ id: 10, name: 'Game Name', verified: true, types: ['steam'] }] };
      return { success: true, data: [{ id: 20, url: 'https://cdn.test/art.png', thumb: 'https://cdn.test/thumb.png', width: 600, height: 900, style: 'alternate', score: 4, author: { name: 'Artist' }, nsfw: false, humor: false }] };
    },
  });
  assert.deepEqual(await service.request({ action: 'search', query: 'Game Name' }), { ok: false, error: 'Add your SteamGridDB API key in Settings first.' });
  const games = await service.request({ apiKey: 'player-key', action: 'search', query: 'Game Name' });
  assert.deepEqual(games.games, [{ id: '10', name: 'Game Name', verified: true, types: ['steam'] }]);
  assert(calls[0].url.endsWith('/search/autocomplete/Game%20Name'));
  assert.equal(calls[0].headers.Authorization, 'Bearer player-key');
  const assets = await service.request({ apiKey: 'player-key', action: 'assets', gameId: '10', kind: 'cover' });
  assert.equal(assets.assets[0].width, 600); assert.equal(assets.assets[0].author, 'Artist');
  assert(calls[1].url.includes('/grids/game/10?dimensions=600x900'));
  assert.deepEqual(await service.request({ apiKey: 'player-key', action: 'assets', gameId: '../bad', kind: 'cover' }), { ok: false, error: 'Choose a valid SteamGridDB game and artwork type.' });
  const offline = createSteamGridDbArtworkService({ httpGetJson: async () => { throw new Error('secret response'); } });
  assert.deepEqual(await offline.request({ apiKey: 'private', action: 'search', query: 'Game' }), { ok: false, error: 'SteamGridDB could not be reached. Check the API key and try again.' });
  console.log('PASS: SteamGridDB artwork uses player-owned Bearer authorization, exact title review, bounded static assets and safe failures. Injected HTTP only; no network request ran.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
