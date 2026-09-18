const assert = require('node:assert/strict');
const { createUpdateScanCoordinatorService } = require('../electron/providers/update-scan-coordinator-service.cjs');

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

(async () => {
  let clock = 50_000;
  const scans = [];
  const waits = [];
  const service = createUpdateScanCoordinatorService({
    now: () => clock,
    scan(games) {
      scans.push(games);
      const wait = deferred();
      waits.push(wait);
      return wait.promise;
    },
  });
  const alpha = { id: 'a', appid: '10', launcher: 'steam', steamOwned: true, installedVersion: '1', updateWatchUrl: 'https://a.test', website: 'https://site.test', exePath: 'C:\\A.exe' };
  const beta = { id: 'b', launcher: 'gog', installedVersion: '2' };
  assert.equal(service.keyOf([alpha, beta]), service.keyOf([beta, alpha]), 'library order does not alter the exact-input key');
  assert.notEqual(service.keyOf([alpha]), service.keyOf([{ ...alpha, installedVersion: '2' }]), 'update evidence fields alter the key');
  assert.equal(service.keyOf(null), '');

  const first = service.run({ games: [alpha] });
  const same = service.run({ games: [{ ...alpha }] });
  assert.equal(scans.length, 1, 'same-key overlap reuses the active scan');
  waits[0].resolve({ ok: true, checked: 1, items: [] });
  assert.deepEqual(await first, { ok: true, checked: 1, items: [] });
  assert.deepEqual(await same, { ok: true, checked: 1, items: [] });

  const cached = await service.run({ games: [alpha] });
  assert.deepEqual(cached, { ok: true, checked: 1, items: [], cached: true });
  assert.equal(scans.length, 1);

  const forced = service.run({ games: [alpha], force: true });
  assert.equal(scans.length, 2, 'force bypasses the recent-result cache');
  const queuedOther = service.run({ games: [beta] });
  assert.equal(scans.length, 2, 'a different key waits for the current scan');
  waits[1].resolve({ ok: true, checked: 2, items: ['forced'] });
  await forced;
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(scans.length, 3, 'different-key work starts after the active scan settles');
  waits[2].resolve({ ok: true, checked: 1, items: ['beta'] });
  assert.deepEqual(await queuedOther, { ok: true, checked: 1, items: ['beta'] });

  clock += 15_000;
  const expired = service.run({ games: [beta] });
  assert.equal(scans.length, 4, 'cache expires at exactly fifteen seconds');
  waits[3].resolve({ ok: true, checked: 1, items: ['fresh'] });
  await expired;

  let attempts = 0;
  const recovery = createUpdateScanCoordinatorService({
    scan() {
      attempts += 1;
      return attempts === 1 ? Promise.reject(new Error('scan failed')) : Promise.resolve({ ok: true, checked: 0, items: [] });
    },
  });
  await assert.rejects(recovery.run({ games: [alpha] }), /scan failed/);
  assert.deepEqual(await recovery.run({ games: [alpha] }), { ok: true, checked: 0, items: [] });
  assert.equal(attempts, 2, 'a failed in-flight scan is cleared for retry');

  console.log('PASS: update-scan coordinator preserves exact order-insensitive keys, same-key coalescing, different-key serialization, 15-second cache, force bypass, expiry and rejection recovery. Deferred fake scans only.');
})().catch(error => { console.error(error); process.exitCode = 1; });
