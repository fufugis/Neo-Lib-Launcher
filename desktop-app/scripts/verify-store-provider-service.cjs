const assert = require('node:assert/strict');
const { createStoreProviderService } = require('../electron/providers/store-provider-service.cjs');

(async () => {
  const requests = [];
  let fail = false;
  const service = createStoreProviderService({
    cleanSearchTerm: value => String(value || '').replace(/[_-]+/g, ' ').trim(),
    stripHtml: value => String(value).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&'),
    async steamGenreEvidence(appid, details) { assert.equal(appid, '620'); assert.equal(details.name, 'Portal 2'); return ['Puzzle', 'Co-op']; },
    async httpGetJson(url) {
      requests.push(url);
      if (fail) throw new Error('offline');
      if (url.includes('storesearch')) return { items: [{ id: 620, name: 'Portal 2', tiny_image: 'tiny.jpg', price: { final: 999 } }, { id: 400, name: 'Portal', tiny_image: 'one.jpg' }] };
      if (url.includes('appdetails')) return { 620: { success: true, data: { name: 'Portal 2', type: 'game', short_description: 'Test', about_the_game: '<p>Science &amp; portals</p>', header_image: 'header.jpg', capsule_image: 'capsule.jpg', background: 'background.jpg', screenshots: Array.from({ length: 8 }, (_, index) => ({ path_full: `shot-${index}.jpg` })), genres: [{ description: 'Puzzle' }], categories: [{ description: 'Single-player' }, { description: 'Co-op' }, { description: 'Full controller support' }, { description: 'Steam Achievements' }, { description: 'Steam Cloud' }], achievements: { total: 51 }, developers: ['Valve'], publishers: ['Valve'], release_date: { date: '19 Apr, 2011' }, metacritic: { score: 95 }, website: 'https://example.test' } } };
      if (url.includes('catalog.gog.com')) return { products: [{ id: 'g1', slug: 'game', title: 'Game', genres: [{ name: 'RPG' }, 'Indie'], developers: ['Dev'], publishers: ['Pub'], releaseDate: '2026-09-16T00:00:00Z', coverHorizontal: 'wide.jpg', coverVertical: 'tall.jpg', screenshots: [{ url: 'https://cdn/{formatter}/one.{ext}' }, 'https://cdn/{formatter}/two.{ext}'], storeLink: '/game/game' }] };
      throw new Error(`unexpected URL ${url}`);
    },
  });
  assert.deepEqual(await service.searchSteam('Portal_2'), [
    { appid: 620, name: 'Portal 2', tinyImage: 'tiny.jpg', price: 999 },
    { appid: 400, name: 'Portal', tinyImage: 'one.jpg', price: null },
  ]);
  assert.match(requests[0], /term=Portal%202&l=en&cc=us$/);
  const details = await service.getSteamDetails('620');
  assert.equal(details.aboutTheGame, 'Science & portals');
  assert.equal(details.screenshots.length, 6);
  assert.deepEqual(details.genreTags, ['Puzzle', 'Co-op']);
  assert.deepEqual(details.capabilities.map((item) => item.id), ['single-player', 'co-op', 'controller-full', 'achievements', 'cloud-saves']);
  assert.deepEqual(details.achievementSummary, { source: 'steam', supported: true, total: 51, syncState: 'not-linked' });
  const gog = await service.searchGog('Game');
  assert.equal(gog[0].releaseDate, '2026-09-16');
  assert.deepEqual(gog[0].genres, ['RPG', 'Indie']);
  assert.deepEqual(gog[0].screenshots, ['https://cdn/product_card_v2_logo_710x355/one.webp', 'https://cdn/product_card_v2_logo_710x355/two.webp']);
  assert.equal(gog[0].url, 'https://www.gog.com/game/game');
  assert.deepEqual(await service.searchSteam(''), []);
  fail = true;
  assert.deepEqual(await service.searchSteam('Portal'), []);
  assert.equal(await service.getSteamDetails('620'), null);
  assert.deepEqual(await service.searchGog('Game'), []);
  console.log('PASS: extracted Steam/GOG provider preserves query URLs, result mapping, source-declared capabilities, achievement availability, taxonomy enrichment, HTML cleanup, media limits and empty/offline fallbacks. Injected HTTP only; no network request ran.');
})().catch(error => { console.error(error); process.exitCode = 1; });
