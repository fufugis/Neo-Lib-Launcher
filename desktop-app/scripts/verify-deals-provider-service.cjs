const assert = require('node:assert/strict');
const { createDealsProviderService } = require('../electron/providers/deals-provider-service.cjs');

const urls = {
  epic: 'https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=en-US&country=US&allowCountries=US',
  steam: 'https://store.steampowered.com/api/featuredcategories?cc=us&l=en',
  instant: 'https://www.instant-gaming.com/en/?type=hotdeal&sort=hot',
  gog: 'https://catalog.gog.com/v1/catalog?limit=15&order=desc:discount&price=discounted:eq:true&productType=in:game,pack',
  fanatical: 'https://www.fanatical.com/api/all/en',
  ubisoft: 'https://store.ubisoft.com/us/deals',
};

function instantCard(path, title, discount = '-55%') {
  return `<a class="cover" href="${path}"><picture><img src="//img.test/game.jpg"></a><div class="name">${title}</div><div class="price">$9.99</div><div class="discount">${discount}</div>`;
}

function ubisoftCard(id, title) {
  return `data-itemid="${id}" href="/us/game.html?lang=en_US" data-src="/images/game.webp" title="Go to product: ${title}"`;
}

(async () => {
  let clock = 10_000_000;
  const calls = [];
  const json = {
    [urls.epic]: { data: { Catalog: { searchStore: { elements: [
      { id: 'free', title: 'Epic Free', productSlug: 'epic-free', keyImages: [{ type: 'OfferImageWide', url: 'wide.jpg' }], price: { totalPrice: { fmtPrice: { originalPrice: '$19.99' } } }, promotions: { promotionalOffers: [{ promotionalOffers: [{ discountSetting: { discountPercentage: 0 }, endDate: '2026-09-20' }] }] } },
      { id: 'no-promo', title: 'Not Free', productSlug: 'not-free' },
      { id: 'no-slug', title: 'No Slug', promotions: { promotionalOffers: [{ promotionalOffers: [{ discountSetting: { discountType: 'PERCENTAGE' } }] }] } },
    ] } } } },
    [urls.steam]: { specials: { items: [
      { id: 10, name: 'Steam Deal', discount_percent: 20, final_price: 499, original_price: 999, large_capsule_image: 'steam.jpg' },
      { id: 11, name: 'Too Small', discount_percent: 19, final_price: 499, original_price: 999 },
    ] } },
    [urls.gog]: { products: [
      { id: 'g1', title: 'GOG Deal', price: { discount: '40%', final: '$5', base: '$10' }, coverHorizontal: '//gog.jpg', storeLink: '/game/gog-deal' },
      { id: 'g2', title: 'Too Small', price: { discount: '39%' } },
    ] },
    [urls.fanatical]: { stardeal: { slug: 'fan-deal', name: 'Fan Deal', discount_percent: 21, price: { USD: 3.5 }, fullPrice: { USD: 10 }, cover: 'fan.jpg' } },
  };
  const text = {
    [urls.instant]: instantCard('/en/123-game.html', 'IG Deal') + instantCard('/en/123-game.html', 'Duplicate'),
    [urls.ubisoft]: ubisoftCard('12345678', 'Tom &amp; Clancy&#39;s Game'),
  };
  const service = createDealsProviderService({
    now: () => clock,
    async httpGetJson(url, timeout) { calls.push(['json', url, timeout]); return json[url]; },
    async httpGetText(url) { calls.push(['text', url]); return text[url] || ''; },
  });

  const first = await service.fetch();
  assert.deepEqual(first.map(item => item.platform), ['epic', 'steam', 'instant-gaming', 'gog', 'fanatical', 'ubisoft']);
  assert.deepEqual(first[0], { id: 'epic-free', platform: 'epic', title: 'Epic Free', subtitle: 'Free this week · Epic Games', priceText: 'FREE', originalPrice: '$19.99', image: 'wide.jpg', url: 'https://store.epicgames.com/en-US/p/epic-free', endsAt: '2026-09-20' });
  assert.equal(first[1].priceText, '$4.99');
  assert.equal(first[2].discount, -55);
  assert.equal(first[2].image, 'https://img.test/game.jpg');
  assert.equal(first[3].image, 'https://gog.jpg');
  assert.equal(first[4].priceText, '$3.50');
  assert.equal(first[5].title, "Tom & Clancy's Game");
  assert.equal(calls.find(call => call[1] === urls.gog)[2], 8000);
  assert.equal(calls.find(call => call[1] === urls.fanatical)[2], 8000);

  const callCount = calls.length;
  assert.strictEqual(await service.fetch(), first, 'a populated result is reused inside the one-hour cache');
  assert.equal(calls.length, callCount);
  clock += 60 * 60 * 1000;
  assert.notStrictEqual(await service.fetch(), first, 'cache expires at exactly one hour');
  assert.equal(calls.length, callCount * 2);

  const isolated = createDealsProviderService({
    async httpGetJson(url) {
      if (url === urls.epic) throw new Error('Epic offline');
      if (url === urls.steam) return { specials: { items: [{ id: 20, name: 'Still Works', discount_percent: 50, final_price: 100, original_price: 200 }] } };
      return {};
    },
    async httpGetText() { return ''; },
  });
  assert.deepEqual((await isolated.fetch()).map(item => item.title), ['Still Works'], 'one failed source does not suppress later sources');

  let emptyCalls = 0;
  const empty = createDealsProviderService({
    async httpGetJson() { emptyCalls += 1; return {}; },
    async httpGetText() { emptyCalls += 1; return ''; },
  });
  await empty.fetch();
  await empty.fetch();
  assert.equal(emptyCalls, 12, 'empty results retain the original no-cache behavior');

  console.log('PASS: deals provider preserves six-source mapping/filtering, item deduplication, timeout arguments, populated-only one-hour cache, expiry and per-source failure isolation. Injected fixtures only; no network requests.');
})().catch(error => { console.error(error); process.exitCode = 1; });
