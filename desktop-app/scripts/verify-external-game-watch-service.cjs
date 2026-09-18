const assert = require('node:assert/strict');
const path = require('node:path');
const { createExternalGameWatchService } = require('../electron/game/external-game-watch-service.cjs');

(async () => {
  let processPaths = ['C:\\Games\\Overwatch\\Overwatch.exe'];
  const locallyLaunched = new Set();
  const events = [];
  const timers = [];
  const cleared = [];
  const execCalls = [];
  const service = createExternalGameWatchService({
    path: path.win32, platform: 'win32',
    normalWinPath: value => String(value || '').replace(/^"|"$/g, '').replace(/\//g, '\\').toLowerCase(),
    isLikelyGameExe: name => name.toLowerCase().endsWith('.exe') && !/(helper|assistant|launcher)/i.test(name),
    getRunningGameKeys: () => locallyLaunched.values(),
    sendExternalState: payload => events.push(payload),
    setTimer(callback, delay) { const timer = { callback, delay }; timers.push(timer); return timer; },
    clearTimer(timer) { cleared.push(timer); },
    execFile(file, args, options, callback) {
      execCalls.push({ file, args, options });
      callback(null, JSON.stringify(processPaths.map((ExecutablePath, index) => ({ ProcessId: index + 1, ExecutablePath }))));
    },
  });
  const games = [
    { id: 'ow', name: 'Overwatch', exePath: 'C:\\Games\\Overwatch\\Overwatch.exe' },
    { id: 'helper', name: 'Helper', exePath: 'C:\\Games\\Helper.exe' },
    { id: 'relative', name: 'Relative', exePath: 'game.exe' },
  ];
  assert.deepEqual(await service.watch({ games }), { ok: true, watching: 1, ignored: 2 });
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(events, [{ active: true, gameId: 'ow', name: 'Overwatch' }]);
  assert.equal(timers.at(-1).delay, 8000);
  assert.equal(execCalls[0].file, 'powershell.exe');
  assert(execCalls[0].args.includes('-Command'));

  processPaths = [];
  assert.deepEqual(await service.scanNow(), { ok: true, active: false, gameId: null, name: '' });
  assert.deepEqual(events.at(-1), { active: false, gameId: null, name: '' });
  assert.equal(timers.at(-1).delay, 30000);

  // Battle.net can save a bootstrapper while the actual game runs as a child
  // executable inside the same owned install folder. This must be detected
  // without treating an idle Battle.net client elsewhere on disk as a game.
  processPaths = ['C:\\Games\\Overwatch\\retail\\Overwatch.exe'];
  locallyLaunched.clear();
  assert.deepEqual(await service.watch({ games: [{ id: 'ow-child', name: 'Overwatch', exePath: 'C:\\Games\\Overwatch\\OverwatchLauncher.exe', installDir: 'C:\\Games\\Overwatch' }] }), { ok: true, watching: 1, ignored: 0 });
  await service.scanNow();
  assert.deepEqual(events.at(-1), { active: true, gameId: 'ow-child', name: 'Overwatch' });
  processPaths = ['C:\\Program Files (x86)\\Battle.net\\Battle.net.exe'];
  assert.deepEqual(await service.scanNow(), { ok: true, active: false, gameId: null, name: '' });

  processPaths = ['C:\\Games\\Overwatch\\Overwatch.exe'];
  locallyLaunched.add('ow-child');
  assert.deepEqual(await service.scanNow(), { ok: true, active: false, gameId: null, name: '' });
  assert.equal(events.length, 4, 'the child-game transition and its local-launch exclusion must each be visible once');
  assert.deepEqual(await service.watch({ games: [] }), { ok: true, watching: 0, ignored: 0 });
  assert(cleared.length > 0, 'disabling the watch must clear the scheduled timer');
  assert.deepEqual(await service.scanNow(), { ok: false, busy: true });
  console.log('PASS: external-game watch filters helper/relative targets, detects exact executable paths, ignores games launched by NEO-LIB, emits only state changes and uses 8s active/30s idle scheduling. No real process query ran.');
})().catch(error => { console.error(error); process.exitCode = 1; });
