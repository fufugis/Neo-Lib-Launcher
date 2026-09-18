const assert = require('node:assert/strict');
const { createUpdateHistoryProviderService } = require('../electron/providers/update-history-provider-service.cjs');
const service = createUpdateHistoryProviderService({ now: () => 12345, stripHtml: value => String(value).replace(/<[^>]+>/g, ' '), async httpGetText(url) { assert.equal(url, 'https://game.test/updates'); return '<p>September 15, 2026 Version 1.10.0 adds things.</p><p>Build 1.2.0 old.</p><p>Version 1.10.0 duplicate.</p>'; } });
(async () => {
  assert.ok(service.compare('1.10.0', '1.2.0') > 0);
  const result = await service.fetch({ url: 'https://game.test/updates', currentVersion: '1.3.0' });
  assert.equal(result.ok, true); assert.equal(result.entries.length, 2); assert.equal(result.entries[0].version, '1.10.0'); assert.equal(result.entries[0].newerThanInstalled, true); assert.equal(result.entries[1].newerThanInstalled, false); assert.equal(result.entries[0].date, 'September 15, 2026'); assert.equal(result.fetchedAt, 12345);
  assert.equal((await service.fetch({ url: 'file:///secret' })).error, 'Only public HTTP/HTTPS update pages are supported.');
  assert.equal((await service.fetch({ url: 'not a url' })).error, 'Invalid update page URL.');
  const offline = createUpdateHistoryProviderService({ stripHtml: value => value, async httpGetText() { throw new Error('offline'); } });
  assert.equal((await offline.fetch({ url: 'https://game.test' })).error, 'offline');
  console.log('PASS: update-history provider preserves public-URL restriction, version discovery/deduplication/sorting, dates, 20-item output cap, installed comparison and offline errors. Injected HTTP only.');
})().catch(error => { console.error(error); process.exitCode = 1; });
