const assert = require('node:assert/strict');
const { createOptimizeProcessService } = require('../electron/optimize/process-inspection-service.cjs');

(async () => {
  let clock = 1000;
  let payload = {
    processes: [
      { pid: 2, name: 'System', path: '', cpuPercent: 2, memoryBytes: 3 },
      { pid: 50, name: 'explorer', path: 'C:\\Windows\\explorer.exe', cpuPercent: 1, memoryBytes: 4 },
      { pid: 77, name: 'NEO-LIB', path: 'C:\\Neo\\neo-lib.exe', cpuPercent: 5, memoryBytes: 6 },
      { pid: 88, name: 'Helper', path: 'C:\\Tools\\helper.exe', cpuPercent: 9, memoryBytes: 10 },
    ],
    gpu: { pid: 88, name: 'Helper', percent: 4.5 }, gpuAvailable: true,
    os: { family: 'Windows 11' }, settings: { gameMode: 'on' },
  };
  const calls = [];
  let closeError = null;
  const service = createOptimizeProcessService({
    inspectScript: 'script', currentPid: 77, currentExecPath: 'C:\\Neo\\neo-lib.exe', nowMs: () => clock,
    normalWinPath: value => String(value || '').replace(/\//g, '\\').toLowerCase(),
    async runPowerShellJson(script) { assert.equal(script, 'script'); return payload; },
    execFile(file, args, options, callback) { calls.push({ file, args, options }); callback(closeError); },
  });
  const inspected = await service.inspectGaming();
  assert.equal(inspected.ok, true);
  assert.deepEqual(inspected.processes.map(item => item.protected), [true, true, true, false]);
  assert.deepEqual(inspected.gpu, [{ pid: 88, name: 'Helper', percent: 4.5 }]);
  assert.deepEqual(await service.closeProcess({ pid: 2, name: 'System' }), { ok: false, error: 'NEO-LIB will not close this protected or changed process.' });
  assert.deepEqual(await service.closeProcess({ pid: 88, name: 'Changed' }), { ok: false, error: 'NEO-LIB will not close this protected or changed process.' });
  assert.deepEqual(await service.closeProcess({ pid: 88, name: 'Helper' }), { ok: true, name: 'Helper' });
  assert.deepEqual(calls[0], { file: 'taskkill.exe', args: ['/PID', '88'], options: { windowsHide: true, timeout: 8000 } });
  assert(!calls[0].args.includes('/F'), 'process close must never force-kill');
  assert.match((await service.closeProcess({ pid: 88, name: 'Helper' })).error, /stale/);

  payload = { processes: { pid: 99, name: 'Other', path: 'C:\\Other.exe' }, gpu: [], gpuAvailable: false };
  await service.inspectGaming();
  closeError = new Error('refused');
  assert.match((await service.closeProcess({ pid: 99, name: 'Other' })).error, /will not force-kill/);
  closeError = null;
  clock += 121000;
  assert.match((await service.closeProcess({ pid: 99, name: 'Other' })).error, /stale/);
  payload = null;
  assert.deepEqual(await service.inspectGaming(), { ok: false, error: 'Windows performance details are unavailable.' });
  console.log('PASS: extracted Optimize process service normalizes inspection, protects Windows/NEO-LIB processes, requires fresh name-matched snapshots and sends only non-force taskkill requests. No process started or stopped.');
})().catch(error => { console.error(error); process.exitCode = 1; });
