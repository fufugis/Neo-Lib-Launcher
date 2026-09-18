const assert = require('node:assert/strict');
const { createPlaytimeHistoryService, localDayKey } = require('../electron/playtime/playtime-history-service.cjs');

const localAfterMidnight = new Date(2026, 0, 2, 0, 30, 0);
assert.equal(localDayKey(localAfterMidnight), '2026-01-02', 'positive UTC offsets must retain the local calendar day');

(async () => {
  const documents = { loadPlaytimeHistory: async () => ({
    byAppid: { 10: { '2026-01-01': 100, '2026-01-02': 145, '2026-01-08': 175 } },
    lastSnapshotAt: 123,
  }) };
  const service = createPlaytimeHistoryService({ documents, now: () => new Date(2026, 0, 8, 12, 0, 0) });
  assert.deepEqual(await service.read({ days: 6 }), { ok: true, deltas: { 10: 30 }, lastSnapshotAt: 123 });
  console.log('PASS: playtime history snapshots and range cutoffs use local calendar days, including positive UTC-offset midnight boundaries.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
