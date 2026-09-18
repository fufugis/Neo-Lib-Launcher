const assert = require('node:assert/strict');
const { createWeeklyReleaseProviderService } = require('../electron/providers/weekly-release-provider-service.cjs');
let now = Date.parse('2026-09-16T12:00:00Z');
let calls = 0;
let mode = 'major';
const service = createWeeklyReleaseProviderService({ now: () => now, async httpGetJson(url) {
  calls += 1;
  if (mode === 'offline') throw new Error('offline');
  if (url.includes('steamspy')) return mode === 'major' ? { 10: { appid: 10, name: 'Major', ccu: 600, positive: 1200, owners: '100,000 .. 200,000' } } : {};
  if (url.includes('featuredcategories')) return { new_releases: { items: [{ id: mode === 'major' ? 10 : 20, name: mode === 'major' ? 'Major' : 'Popular', large_capsule_image: 'featured.jpg' }] } };
  const appid = Number(new URL(url).searchParams.get('appids'));
  return { [appid]: { success: true, data: { type: 'game', name: appid === 10 ? 'Major' : 'Popular', header_image: 'header.jpg', release_date: { date: 'Sep 15, 2026', coming_soon: false }, recommendations: { total: appid === 10 ? 1200 : 0 }, genres: [{ description: 'Action' }] } } };
} });
(async () => {
  assert.equal(service.parseDate('Sep 15, 2026'), Date.parse('Sep 15, 2026'));
  assert.equal(service.ownerFloor('20,000 .. 50,000'), 20000);
  const major = await service.fetch();
  assert.equal(major.ok, true); assert.equal(major.tier, 'major'); assert.equal(major.items[0].why, 'High current player interest');
  const callCount = calls;
  assert.equal((await service.fetch()).cached, true); assert.equal(calls, callCount);
  mode = 'popular'; now += 21600001;
  const popular = await service.fetch();
  assert.equal(popular.tier, 'popular'); assert.equal(popular.items[0].title, 'Popular');
  mode = 'offline'; now += 21600001;
  const failed = await service.fetch({ force: true });
  assert.equal(failed.ok, false); assert.deepEqual(failed.items, []);
  console.log('PASS: weekly-release provider preserves source merge, seven-day verification, major/popular tier fallback, six-hour cache, force refresh and offline failure. Injected HTTP only.');
})().catch(error => { console.error(error); process.exitCode = 1; });
