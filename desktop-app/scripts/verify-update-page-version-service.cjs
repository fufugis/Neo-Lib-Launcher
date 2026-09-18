const assert = require('node:assert/strict');
const { createUpdatePageVersionService } = require('../electron/providers/update-page-version-service.cjs');

const confidence = {
  'saved source': 100,
  'game website': 92,
  'Steam public patch notes': 88,
  'automatic web discovery': 48,
};
const service = createUpdatePageVersionService({ confidenceFor: kind => confidence[kind] || 35 });

assert.deepEqual(service.parts('v1.10.2b'), [1, 10, 2]);
assert(service.compare('1.10.0', '1.2.9') > 0);
assert(service.compare('2.0', '2.0.0') === 0);
assert(service.compare('1.0', '1.0.1') < 0);

const saved = { kind: 'saved source', url: 'https://official.test', text: 'Version: 1.9.0 then build 1.10.0.' };
const web = { kind: 'automatic web discovery', url: 'https://search.test', text: 'Version 99.0.0' };
const latest = service.selectLatest([saved, null, web]);
assert.equal(latest.version, '1.10.0', 'trusted evidence outranks a numerically higher search-only result');
assert.strictEqual(latest.source, saved);
assert.equal(latest.confidence, 100);

const steam = { kind: 'Steam public patch notes', url: 'https://steam.test', text: 'v2.5.0' };
const website = { kind: 'game website', url: 'https://game.test', text: 'Build to v2.6.0' };
assert.equal(service.selectLatest([steam, website]).version, '2.6.0');

const weakOlder = { kind: 'unknown', url: 'https://one.test', text: 'Version 3.0.0' };
const weakNewer = { kind: 'automatic web discovery', url: 'https://two.test', text: 'Release v4.0.0' };
assert.equal(service.selectLatest([weakOlder, weakNewer]).version, '4.0.0', 'search evidence is usable when no trusted source exists');

const eightyPlus = Array.from({ length: 100 }, (_, index) => `Version 1.${index}.0`).join(' ');
const bounded = service.collect([{ kind: 'saved source', text: eightyPlus }]);
assert.equal(bounded.length, 80, 'page evidence is capped at eighty matches');
assert.equal(service.selectLatest([]), null);
assert.deepEqual(service.collect(null), []);

console.log('PASS: update-page version evaluation preserves numeric ordering, version/build/v discovery, 80-match cap, trusted-source preference, confidence and search-only fallback. Pure text fixtures only.');
