const assert = require('node:assert/strict');
const { createIndependentUpdateAssessmentService } = require('../electron/providers/independent-update-assessment-service.cjs');
const { createUpdatePageVersionService } = require('../electron/providers/update-page-version-service.cjs');

const confidence = { official: 92, search: 48 };
const evaluator = createUpdatePageVersionService({ confidenceFor: kind => confidence[kind] || 35 });

(async () => {
  let clock = 10_000;
  const fetches = [];
  const derives = [];
  let inspectedTextLength = 0;
  const pageVersions = {
    compare: evaluator.compare,
    selectLatest(results) {
      inspectedTextLength = Math.max(0, ...results.filter(Boolean).map(result => result.text.length));
      return evaluator.selectLatest(results);
    },
  };
  const service = createIndependentUpdateAssessmentService({
    now: () => clock,
    stripHtml: value => String(value).replace(/<[^>]+>/g, ' '),
    discoverSources: async game => game.noSources ? [] : [{ url: `https://${game.id}.test/updates`, kind: game.kind || 'official' }],
    deriveInstalledVersion: async game => { derives.push(game.id); return game.localVersion || null; },
    pageVersions,
    async fetchText(url, timeout) {
      fetches.push([url, timeout]);
      if (url.includes('offline')) throw new Error('offline');
      if (url.includes('huge')) return `${'x'.repeat(600_000)} Version 2.0.0`;
      if (url.includes('noversion')) return '<p>Patch notes without an explicit build.</p>';
      if (url.includes('current')) return '<p>Version 1.5.0</p>';
      return '<p>Version 2.0.0</p>';
    },
  });

  const noSource = await service.assess({ id: 'none', name: 'No Source', noSources: true, localVersion: { version: '1.0', evidence: 'fixture' } });
  assert.equal(noSource.checked, false);
  assert.equal(noSource.need.missing, 'a trustworthy update source');
  assert.equal(noSource.ledger.status, 'needs-evidence');

  const availableGame = { id: 'available', name: 'Available', installedVersion: '1.0' };
  const available = await service.assess(availableGame);
  assert.equal(available.checked, true);
  assert.equal(available.item.status, 'available');
  assert.equal(available.item.currentVersion, '1.0');
  assert.equal(available.item.latestVersion, '2.0.0');
  assert.equal(available.item.actionUrl, 'https://available.test/updates');
  assert.equal(available.ledger.status, 'available');
  assert.equal(derives.includes('available'), false, 'saved installed versions bypass local derivation');
  assert.deepEqual(fetches[0], ['https://available.test/updates', 9_000]);

  const fetchCount = fetches.length;
  const cached = await service.assess(availableGame);
  assert.equal(cached.item.status, 'available');
  assert.equal(cached.ledger.source, 'Independent source');
  assert.equal(fetches.length, fetchCount, 'assessment evidence is cached for fifteen minutes');
  clock += 15 * 60 * 1000;
  await service.assess(availableGame);
  assert.equal(fetches.length, fetchCount + 1, 'cache expires at exactly fifteen minutes');

  const current = await service.assess({ id: 'current', name: 'Current', installedVersion: '2.0' });
  assert.equal(current.item, null);
  assert.equal(current.need, null);
  assert.equal(current.ledger.status, 'current');
  assert.equal(current.ledger.latestVersion, '1.5.0');

  const unknown = await service.assess({ id: 'unknown', name: 'Unknown' });
  assert.equal(unknown.item.status, 'attention');
  assert.equal(unknown.item.currentVersion, 'Unknown');
  assert.equal(unknown.ledger.missing, 'installed version');

  const weak = await service.assess({ id: 'weak', name: 'Weak', localVersion: { version: '1.0', evidence: 'resource', confidence: 'weak' } });
  assert.equal(weak.item.status, 'attention');
  assert.equal(weak.ledger.missing, 'a stronger installed-version signal');

  const noVersionGame = { id: 'noversion', name: 'No Version', installedVersion: '1.0' };
  const noVersion = await service.assess(noVersionGame);
  assert.equal(noVersion.need.missing, 'an explicit latest version');
  assert.equal(noVersion.ledger.status, 'needs-evidence');
  const cachedNoVersion = await service.assess(noVersionGame);
  assert.equal(cachedNoVersion.ledger.status, 'needs-evidence', 'cached missing evidence must never become a false current result');
  assert.equal(cachedNoVersion.need.missing, 'an explicit latest version');

  const offline = await service.assess({ id: 'offline', name: 'Offline', installedVersion: '1.0' });
  assert.equal(offline.need.missing, 'an explicit latest version');
  assert.equal(offline.ledger.status, 'needs-evidence');

  await service.assess({ id: 'huge', name: 'Huge', installedVersion: '1.0' });
  assert(inspectedTextLength <= 500_000, `page text must be bounded, saw ${inspectedTextLength}`);

  const failedEvaluator = createIndependentUpdateAssessmentService({
    now: () => clock,
    fetchText: async () => 'Version 2.0', stripHtml: value => value,
    discoverSources: async () => [{ url: 'https://failure.test', kind: 'official' }],
    deriveInstalledVersion: async () => ({ version: '1.0', evidence: 'fixture' }),
    pageVersions: { compare: evaluator.compare, selectLatest() { throw new Error('bad evidence'); } },
  });
  const failure = await failedEvaluator.assess({ id: 'failure', name: 'Failure' });
  assert.equal(failure.need.missing, 'a reachable current-version source');
  assert.equal(failure.ledger.status, 'needs-evidence');

  console.log('PASS: independent-update assessment preserves saved/local evidence, 9s bounded page fetches, 15-minute cache, current/update/attention results and honest missing/offline states. Cached missing evidence cannot become false-current. Injected fixtures only.');
})().catch(error => { console.error(error); process.exitCode = 1; });
