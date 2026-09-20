const assert = require('node:assert/strict');
const { createWeeklyReleaseProviderService } = require('../electron/providers/weekly-release-provider-service.cjs');

const DAY_MS = 86_400_000;
let now = Date.parse('2026-09-20T12:00:00Z');
let httpCalls = 0;
let searchCalls = 0;
let offline = false;

const steamApps = {
  10: { name: 'Major Steam Game', date: 'Sep 8, 2026', recommendations: 1400 },
  20: { name: 'Stale Small Steam Game', date: 'Sep 14, 2026', recommendations: 0 },
  30: { name: 'Fresh Small Steam Game', date: 'Sep 18, 2026', recommendations: 0 },
};

const service = createWeeklyReleaseProviderService({
  now: () => now,
  async httpGetJson(url) {
    httpCalls += 1;
    if (offline) throw new Error('offline');
    if (url.includes('steamspy')) return { 10: { appid: 10, name: steamApps[10].name, ccu: 620, positive: 1600, owners: '100,000 .. 200,000' } };
    if (url.includes('featuredcategories')) return { new_releases: { items: [
      { id: 20, name: steamApps[20].name, large_capsule_image: 'stale.jpg' },
      { id: 30, name: steamApps[30].name, large_capsule_image: 'fresh.jpg' },
    ] } };
    const appid = Number(new URL(url).searchParams.get('appids'));
    const app = steamApps[appid];
    return { [appid]: { success: true, data: {
      type: 'game', name: app.name, header_image: `${appid}.jpg`,
      release_date: { date: app.date, coming_soon: false },
      recommendations: { total: app.recommendations }, genres: [{ description: 'Action' }],
    } } };
  },
  async searchDuckDuckGo(query) {
    searchCalls += 1;
    if (offline) throw new Error('offline');
    if (query.includes('news.blizzard.com')) return [
      { title: 'World of Warcraft: Midnight is now live - Blizzard', snippet: 'September 10, 2026. Begin a new journey today.', url: 'https://news.blizzard.com/en-us/world-of-warcraft/major-launch' },
    ];
    if (query.includes('site:ea.com')) return [
      { title: 'Tiny EA Original is now available - Electronic Arts', snippet: 'September 18, 2026. Play the full game today.', url: 'https://www.ea.com/news/tiny-original-release' },
      { title: 'Old EA Original is now available - Electronic Arts', snippet: 'September 13, 2026. Play the full game today.', url: 'https://www.ea.com/news/old-original-release' },
      { title: 'The Sims 5 is coming soon - Electronic Arts', snippet: 'September 20, 2026. Pre-order today.', url: 'https://www.ea.com/news/sims-preview' },
    ];
    if (query.includes('site:itch.io')) return [
      { title: 'Handmade Adventure is now available', snippet: 'September 19, 2026. The full game is out now.', url: 'https://small-studio.itch.io/handmade-adventure' },
    ];
    return [];
  },
  async searchGoogle() { return []; },
});

(async () => {
  assert.equal(service.parseDate('Sep 15, 2026'), Date.parse('Sep 15, 2026'));
  assert.equal(service.parseDate('2 days ago'), now - 2 * DAY_MS);
  assert.equal(service.ownerFloor('20,000 .. 50,000'), 20000);
  assert.equal(service.retention.major, 14 * DAY_MS);
  assert.equal(service.retention.small, 5 * DAY_MS);
  assert.deepEqual(service.officialSources.map(source => source.platform).sort(), ['Battle.net', 'EA', 'Epic Games', 'GOG', 'Riot', 'Rockstar', 'Ubisoft', 'Xbox', 'itch.io'].sort());

  const result = await service.fetch();
  assert.equal(result.ok, true);
  assert.equal(result.tier, 'major');
  assert.equal(result.items[0].title, 'World of Warcraft: Midnight');
  assert.equal(result.items[0].platform, 'Battle.net');
  assert.equal(result.items[0].sourceKind, 'official-publisher');
  assert.equal(result.items[0].tier, 'major');
  assert.ok(result.items.some(item => item.title === 'Major Steam Game'), 'A 12-day-old major Steam game should remain');
  assert.ok(result.items.some(item => item.title === 'Tiny EA Original'), 'A fresh smaller official release should remain');
  assert.ok(result.items.some(item => item.title === 'Fresh Small Steam Game'), 'A fresh smaller Steam release should remain');
  assert.ok(result.items.some(item => item.title === 'Handmade Adventure'), 'A fresh itch.io release should remain');
  assert.ok(!result.items.some(item => item.title === 'Stale Small Steam Game'), 'A six-day-old smaller Steam release should expire');
  assert.ok(!result.items.some(item => item.title === 'Old EA Original'), 'A seven-day-old smaller official release should expire');
  assert.ok(!result.items.some(item => /Sims 5/i.test(item.title)), 'Coming-soon and pre-order news must not be treated as a release');
  assert.match(result.criteria, /14 days/i);
  assert.match(result.criteria, /5 days/i);
  assert.ok(result.items.slice(0, 2).every(item => item.tier === 'major'), 'Major releases must rank before smaller titles');

  const httpCount = httpCalls;
  const searchCount = searchCalls;
  assert.equal((await service.fetch()).cached, true);
  assert.equal(httpCalls, httpCount);
  assert.equal(searchCalls, searchCount);

  offline = true;
  now += 21_600_001;
  const failed = await service.fetch({ force: true });
  assert.equal(failed.ok, false);
  assert.deepEqual(failed.items, []);

  console.log('PASS: recent-release discovery ranks official all-launcher majors above Steam volume, retains majors for 14 days, expires smaller titles after 5 days, rejects previews, caches for six hours and reports full-source outages. Injected network only.');
})().catch(error => { console.error(error); process.exitCode = 1; });
