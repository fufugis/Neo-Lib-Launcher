const assert = require('node:assert/strict');
const { createPublicNewsProviderService } = require('../electron/providers/public-news-provider-service.cjs');
let now = 1_000_000;
const calls = [];
const normalization = {
  siteHost: game => game.website ? 'official.test' : '',
  result: (_game, result) => result.valid ? { ...result.item } : null,
};
const official = { valid: true, item: { title: 'Patch', date: 900, platform: 'official-web' } };
const duplicate = { valid: true, item: { title: 'Patch', date: 900, platform: 'web' } };
const older = { valid: true, item: { title: 'News', date: 800, platform: 'web' } };
const third = { valid: true, item: { title: 'Roadmap', date: 700, platform: 'web' } };
let duckResults = [duplicate, official, older, third];
const service = createPublicNewsProviderService({
  normalization, now: () => now, cacheMs: 100,
  async searchDuckDuckGo(query) { calls.push(['duck', query]); return duckResults; },
  async searchGoogle(query) { calls.push(['google', query]); return []; },
});
(async () => {
  const game = { id: 'g1', name: 'Test Game', website: 'https://official.test' };
  const first = await service.fetch(game, 0);
  assert.equal(first.length, 2);
  assert.equal(first[0].platform, 'official-web');
  assert.equal(calls.length, 1);
  assert.match(calls[0][1], /^site:official\.test/);
  assert.equal(service.inspectCache(game, 0).fresh, true);
  assert.deepEqual(await service.fetch(game, 0), first);
  assert.equal(calls.length, 1);
  now += 101;
  duckResults = [];
  await service.fetch(game, 0);
  assert.equal(calls.at(-1)[0], 'google');
  await service.fetch(game, 0, true);
  assert.equal(service.inspectCache(game, 0).fresh, true);
  console.log('PASS: public-news provider preserves official-first queries, DuckDuckGo/Google fallback, deduplication, two-item limit, force refresh and owned cache expiry. Injected search only.');
})().catch(error => { console.error(error); process.exitCode = 1; });
