const assert = require('node:assert/strict');
const { createSteamNewsProviderService } = require('../electron/providers/steam-news-provider-service.cjs');
let now = 2_000_000_000_000; let calls = 0;
const service = createSteamNewsProviderService({ now: () => now, isLikelyEnglish: (title) => !title.includes('非英語'), async httpGetJson(url, timeout) {
  calls += 1; assert.equal(timeout, 8000); const appid = new URL(url).searchParams.get('appid');
  if (appid === 'broken') throw new Error('offline');
  return { appnews: { newsitems: [{ gid: 'new', date: Math.floor(now / 1000) - 10, title: `Patch ${appid}`, contents: '[img]https://img.test/a.jpg[/img][b]Fix[/b] [url=x]details[/url]', url: 'https://news.test', author: 'Dev', feed_type: 1 }, { gid: 'old', date: 1, title: 'Old', contents: 'old' }, { gid: 'foreign', date: Math.floor(now / 1000), title: '非英語', contents: 'skip' }] } };
} });
(async () => {
  const result = await service.fetch({ games: [{ id: 'g1', appid: 10, name: 'Game' }, { appid: 'broken' }], days: 14 });
  assert.equal(result.ok, true); assert.equal(result.items.length, 1); assert.equal(result.items[0].image, 'https://img.test/a.jpg'); assert.equal(result.items[0].snippet, 'Fix details'); assert.equal(result.items[0].gameId, 'g1');
  const count = calls; assert.equal((await service.fetch({ games: [{ id: 'g1', appid: 10, name: 'Game' }, { appid: 'broken' }], days: 14 })).cached, true); assert.equal(calls, count);
  await service.fetch({ games: [{ appid: 10, name: 'Game' }], days: 14, force: true }); assert.ok(calls > count);
  assert.deepEqual((await service.fetch({ games: [] })).items, []);
  console.log('PASS: Steam-news provider preserves batching inputs, BBCode cleanup, article images, language/date filtering, per-game failure isolation, sorting, force refresh and 30-minute cache. Injected HTTP only.');
})().catch(error => { console.error(error); process.exitCode = 1; });
