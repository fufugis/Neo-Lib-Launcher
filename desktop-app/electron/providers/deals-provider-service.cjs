const ONE_HOUR = 60 * 60 * 1000;

function createDealsProviderService({ httpGetJson, httpGetText, now = Date.now }) {
  if (typeof httpGetJson !== 'function' || typeof httpGetText !== 'function') {
    throw new TypeError('createDealsProviderService requires JSON and text HTTP clients.');
  }

  let cache = { ts: 0, items: [] };

  async function fetch() {
    if (now() - cache.ts < ONE_HOUR && cache.items.length) return cache.items;
    const items = [];

    try {
      const epic = await httpGetJson('https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=en-US&country=US&allowCountries=US');
      const games = epic?.data?.Catalog?.searchStore?.elements || [];
      for (const game of games) {
        const promo = game?.promotions?.promotionalOffers?.[0]?.promotionalOffers?.[0];
        if (!promo) continue;
        const discount = promo.discountSetting?.discountPercentage;
        const isFree = discount === 0 || promo.discountSetting?.discountType === 'PERCENTAGE';
        if (!isFree) continue;
        const slug = game.productSlug || game.urlSlug || game.catalogNs?.mappings?.[0]?.pageSlug || '';
        if (!slug) continue;
        const image = (game.keyImages || []).find(entry => entry.type === 'OfferImageWide' || entry.type === 'DieselStoreFrontWide')?.url
          || (game.keyImages || [])[0]?.url;
        items.push({
          id: `epic-${game.id}`, platform: 'epic', title: game.title,
          subtitle: 'Free this week · Epic Games', priceText: 'FREE',
          originalPrice: game.price?.totalPrice?.fmtPrice?.originalPrice || '', image,
          url: `https://store.epicgames.com/en-US/p/${slug}`, endsAt: promo.endDate,
        });
      }
    } catch { /* One failed source must not suppress the others. */ }

    try {
      const steam = await httpGetJson('https://store.steampowered.com/api/featuredcategories?cc=us&l=en');
      for (const special of (steam?.specials?.items || []).slice(0, 15)) {
        if (!special.discount_percent || special.discount_percent < 20) continue;
        items.push({
          id: `steam-${special.id}`, platform: 'steam', appid: special.id, title: special.name,
          subtitle: `-${special.discount_percent}% · Steam`, priceText: `$${(special.final_price / 100).toFixed(2)}`,
          originalPrice: `$${(special.original_price / 100).toFixed(2)}`,
          image: special.large_capsule_image || special.header_image,
          url: `https://store.steampowered.com/app/${special.id}`, discount: special.discount_percent,
        });
      }
    } catch { /* One failed source must not suppress the others. */ }

    try {
      const html = await httpGetText('https://www.instant-gaming.com/en/?type=hotdeal&sort=hot');
      const itemPattern = /<a[^>]*class="[^"]*cover[^"]*"[^>]*href="(\/en\/[^"]+)"[\s\S]*?<picture[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"[\s\S]*?<\/a>[\s\S]*?<div[^>]*class="[^"]*name[^"]*"[^>]*>([^<]+)<[\s\S]*?<div[^>]*class="[^"]*price[^"]*"[^>]*>([^<]+)<[\s\S]*?<div[^>]*class="[^"]*discount[^"]*"[^>]*>([^<]+)</g;
      let match;
      let count = 0;
      const seenUrls = new Set();
      while ((match = itemPattern.exec(html)) !== null && count < 12) {
        const [, hrefPath, image, title, price, discount] = match;
        if (!hrefPath || !title || seenUrls.has(hrefPath)) continue;
        seenUrls.add(hrefPath);
        items.push({
          id: `ig-${count}-${hrefPath.replace(/\W+/g, '').slice(0, 24)}`,
          platform: 'instant-gaming', title: title.trim(),
          subtitle: `${(discount || '').trim()} · Instant Gaming`, priceText: (price || '').trim() || '—',
          originalPrice: '', image: image.startsWith('http') ? image : `https:${image}`,
          url: `https://www.instant-gaming.com${hrefPath}`,
          discount: parseInt(String(discount || '').replace(/[^0-9-]/g, ''), 10) || 0,
        });
        count += 1;
      }
    } catch { /* One failed source must not suppress the others. */ }

    try {
      const data = await httpGetJson('https://catalog.gog.com/v1/catalog?limit=15&order=desc:discount&price=discounted:eq:true&productType=in:game,pack', 8000);
      for (const product of (data?.products || []).slice(0, 12)) {
        const discount = parseInt(String(product?.price?.discount || '').replace(/[^0-9]/g, ''), 10) || 0;
        if (discount < 40) continue;
        items.push({
          id: `gog-${product.id}`, platform: 'gog', title: product.title,
          subtitle: `-${discount}% · GOG`, priceText: product?.price?.final || '',
          originalPrice: product?.price?.base || '',
          image: (product.coverHorizontal || product.image || '').replace(/^\/\//, 'https://'),
          url: `https://www.gog.com${product.storeLink || ''}`, discount,
        });
      }
    } catch { /* One failed source must not suppress the others. */ }

    try {
      const fanatical = await httpGetJson('https://www.fanatical.com/api/all/en', 8000);
      const deal = fanatical?.stardeal;
      if (deal && deal.slug && deal.discount_percent > 20) {
        const cover = deal.cover ? `https://fanatical.imgix.net/product/original/${deal.cover}?auto=compress,format&w=400` : '';
        items.push({
          id: `fan-star-${deal.slug}`, platform: 'fanatical', title: deal.name,
          subtitle: `-${deal.discount_percent}% · Fanatical star deal`,
          priceText: deal?.price?.USD != null ? `$${Number(deal.price.USD).toFixed(2)}` : '',
          originalPrice: deal?.fullPrice?.USD != null ? `$${Number(deal.fullPrice.USD).toFixed(2)}` : '',
          image: cover, url: `https://www.fanatical.com/en/game/${deal.slug}`, discount: deal.discount_percent,
        });
      }
    } catch { /* One failed source must not suppress the others. */ }

    try {
      const html = await httpGetText('https://store.ubisoft.com/us/deals');
      const cardPattern = /data-itemid="([^"]{8,40})"[\s\S]{0,4000}?href="(\/us\/[^"]+?\.html\?lang=en_US)"[\s\S]{0,3500}?data-src="([^"]+?\.(?:jpg|jpeg|png|webp))[^"]*"[\s\S]{0,500}?title="Go to product: ([^"]+)"/g;
      let match;
      let count = 0;
      const seenIds = new Set();
      while ((match = cardPattern.exec(html)) !== null && count < 8) {
        const [, itemId, hrefPath, image, rawTitle] = match;
        if (seenIds.has(itemId)) continue;
        seenIds.add(itemId);
        const title = String(rawTitle)
          .replace(/&ndash;/g, '–').replace(/&mdash;/g, '—')
          .replace(/&rsquo;/g, '\u2019').replace(/&lsquo;/g, '\u2018')
          .replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
        items.push({
          id: `ubi-${itemId}`, platform: 'ubisoft', title,
          subtitle: 'On sale · Ubisoft Store', priceText: '', originalPrice: '',
          image: image.startsWith('http') ? image : `https://store.ubisoft.com${image}`,
          url: `https://store.ubisoft.com${hrefPath}`,
        });
        count += 1;
      }
    } catch { /* One failed source must not suppress the others. */ }

    cache = { ts: now(), items };
    return items;
  }

  return Object.freeze({ fetch });
}

module.exports = { createDealsProviderService };
