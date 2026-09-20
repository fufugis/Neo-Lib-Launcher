const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createOptimizeProcessService } = require('../electron/optimize/process-inspection-service.cjs');

(async () => {
  let clock = 1000;
  let health = { cpuPercent: 19, ramPercent: 44, memoryUsedGb: 14.1, memoryFreeGb: 17.9, memoryTotalGb: 32 };
  let reads = 0;
  const service = createOptimizeProcessService({
    async readSystemHealth() { reads += 1; return health; },
    os: { release: () => '10.0.26100' },
    taskManagerPath: 'C:\\Windows\\System32\\Taskmgr.exe',
    nowMs: () => clock,
  });

  const inspected = await service.inspectGaming();
  assert.equal(reads, 1);
  assert.equal(inspected.ok, true);
  assert.equal(inspected.inspectionMode, 'aggregate-only');
  assert.deepEqual(inspected.processes, []);
  assert.deepEqual(inspected.gpu, []);
  assert.equal(inspected.gpuAvailable, false);
  assert.deepEqual(inspected.health, health);
  assert.equal(inspected.os.family, 'Windows 11');
  assert.equal(inspected.os.build, 26100);
  assert.equal(inspected.taskManagerPath, 'C:\\Windows\\System32\\Taskmgr.exe');
  assert.match((await service.closeProcess({ pid: 88, name: 'Helper' })).error, /no longer inspects or closes/i);

  health = null;
  assert.deepEqual(await service.inspectGaming(), { ok: false, error: 'Windows performance details are unavailable.' });

  const main = fs.readFileSync(path.join(__dirname, '..', 'electron', 'main.js'), 'utf8');
  const view = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'OptimizeCenter.jsx'), 'utf8');
  assert(!main.includes('GAMING_INSPECT_SCRIPT'), 'Optimize must not restore the encoded PowerShell process probe');
  assert(!main.includes("Get-Counter '\\GPU Engine(*)\\Utilization Percentage'"), 'Optimize must not enumerate GPU process counters');
  assert(!view.includes('closeOptimizableProcess'), 'Optimize UI must not expose process termination');
  assert(view.includes('Open Task Manager'), 'per-process details must be delegated to Windows Task Manager');
  console.log('PASS: Optimize reads aggregate CPU/RAM only, runs no PowerShell/process/GPU probe, closes no program and delegates per-process detail to Task Manager. No process or external tool ran.');
})().catch(error => { console.error(error); process.exitCode = 1; });
