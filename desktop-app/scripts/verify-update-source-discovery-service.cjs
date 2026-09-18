const assert = require('node:assert/strict');
const { createUpdateSourceDiscoveryService } = require('../electron/providers/update-source-discovery-service.cjs');

(async () => {
  let clock = 1_000_000;
  const queries = [];
  const service = createUpdateSourceDiscoveryService({
    now: () => clock,
    battleNetProducts: [{ match: /world of warcraft/i, url: 'https://worldofwarcraft.blizzard.com/' }],
    async search(query) {
      queries.push(query);
      return [
        { title: 'Another Product update', snippet: 'version 9', url: 'https://wrong.test/' },
        { title: 'Bright Moon community', snippet: 'general discussion', url: 'https://no-update.test/' },
        { title: 'Bright Moon patch', snippet: 'version 2.0 release', url: 'https://duckduckgo.com/l/?uddg=https%3A%2F%2Fofficial.test%2Fpatches' },
        { title: 'Bright Moon devlog', snippet: 'latest changelog', url: 'https://mirror.test/devlog' },
        { title: 'Bright Moon update', snippet: 'extra result beyond cap', url: 'https://extra.test/' },
      ];
    },
  });

  assert.deepEqual(service.titleTokens('The Bright Moon Game'), ['bright', 'moon']);
  assert.equal(service.resultUrl('https://duckduckgo.com/l/?uddg=https%3A%2F%2Fgame.test%2Fnews'), 'https://game.test/news');
  assert.equal(service.resultUrl('not a url'), 'not a url');
  assert.equal(service.confidenceFor('saved source'), 100);
  assert.equal(service.confidenceFor('unknown'), 35);

  const discovered = await service.discover({ id: 'bright', name: 'Bright Moon' });
  assert.deepEqual(discovered, [
    { url: 'https://official.test/patches', kind: 'automatic web discovery' },
    { url: 'https://mirror.test/devlog', kind: 'automatic web discovery' },
    { url: 'https://extra.test/', kind: 'automatic web discovery' },
  ]);
  assert.deepEqual(queries, ['Bright Moon latest version patch notes']);
  assert.strictEqual(await service.discover({ id: 'bright', name: 'Bright Moon' }), discovered, 'six-hour cache reuses its source list');
  assert.equal(queries.length, 1);
  clock += 6 * 60 * 60 * 1000;
  await service.discover({ id: 'bright', name: 'Bright Moon' });
  assert.equal(queries.length, 2, 'cache expires at exactly six hours');

  const exact = await service.discover({
    id: 'owned', name: 'Owned Game', updateWatchUrl: 'https://updates.test',
    website: 'https://updates.test/', appid: 123,
  });
  assert.deepEqual(exact, [
    { url: 'https://updates.test/', kind: 'saved source' },
    { url: 'https://steamcommunity.com/app/123/allnews/?l=english', kind: 'Steam public patch notes' },
  ], 'invalid/duplicate candidates collapse and numeric Steam metadata adds public notes');

  const wow = await service.discover({ id: 'wow', name: 'World of Warcraft', launcher: 'battlenet' });
  assert.deepEqual(wow[0], { url: 'https://worldofwarcraft.blizzard.com/', kind: 'Battle.net product page' });

  let failureCalls = 0;
  const fallback = createUpdateSourceDiscoveryService({
    async search() { failureCalls += 1; throw new Error('offline'); },
  });
  assert.deepEqual(await fallback.discover({ id: 'offline', name: 'Offline Hero', website: 'https://offline.test' }), [
    { url: 'https://offline.test/', kind: 'game website' },
  ]);
  assert.equal(failureCalls, 1, 'search failure preserves stronger known candidates');

  console.log('PASS: update-source discovery preserves official/saved/Steam/Battle.net candidates, URL deduplication, title/update confidence, three-source cap, DuckDuckGo redirect cleanup, six-hour cache and best-effort search failure. Injected search only.');
})().catch(error => { console.error(error); process.exitCode = 1; });
