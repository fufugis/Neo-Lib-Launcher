const assert = require('node:assert/strict');
const { createOwnedNewsProviderService } = require('../electron/providers/owned-news-provider-service.cjs');
const stripHtml = value => String(value || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
let offline = false; const requests = [];
const service = createOwnedNewsProviderService({ stripHtml, async httpGetText(url) { requests.push(url); if (offline) throw new Error('offline'); return `<item><title><![CDATA[Devlog &amp; Patch]]></title><link>https://dev.itch.io/game/devlog/1</link><pubDate>Tue, 15 Sep 2026 10:00:00 GMT</pubDate><description><![CDATA[<b>Notes</b>]]></description><media:content url="https://img.test/itch.jpg"/></item><item><title>Old</title><pubDate>Tue, 01 Jan 2020 10:00:00 GMT</pubDate></item>`; }, async httpGetJson(url, timeout) { requests.push(url); assert.equal(timeout, 8000); if (offline) throw new Error('offline'); return { changelog: '<h4>2026-09-15</h4><p>New fixes</p><h4>1 January 2020</h4><p>Old</p>' }; } });
(async () => {
  const cutoff = Date.parse('2026-09-01');
  const itch = await service.fetchItch({ id: 'i1', name: 'Indie', website: 'https://dev.itch.io/game/' }, cutoff);
  assert.equal(itch.length, 1); assert.equal(itch[0].title, 'Devlog & Patch'); assert.equal(itch[0].image, 'https://img.test/itch.jpg'); assert.match(requests[0], /\/devlog\.rss$/);
  assert.deepEqual(await service.fetchItch({ website: 'https://example.test' }, cutoff), []);
  const gog = await service.fetchGog({ id: 'g1', name: 'GOG Game', gogId: '42' }, cutoff);
  assert.equal(gog.length, 1); assert.equal(gog[0].title, 'Patch notes · 2026-09-15'); assert.equal(gog[0].snippet, 'New fixes');
  offline = true; assert.deepEqual(await service.fetchItch({ website: 'https://dev.itch.io/game' }, cutoff), []); assert.deepEqual(await service.fetchGog({ gogId: '42' }, cutoff), []);
  console.log('PASS: owned-news provider preserves itch RSS and GOG changelog URLs, HTML cleanup, image/date filtering, item mapping and per-source offline isolation. Injected HTTP only.');
})().catch(error => { console.error(error); process.exitCode = 1; });
