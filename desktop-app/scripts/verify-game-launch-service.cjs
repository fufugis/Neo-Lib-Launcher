const assert = require('node:assert/strict');
const path = require('node:path');
const { createGameLaunchService } = require('../electron/game/game-launch-service.cjs');

(async () => {
  let clock = 1000;
  let shared = {};
  const safetyEvents = [];
  const sharedWrites = [];
  const spawnCalls = [];
  const discord = [];
  const exited = [];
  const childHandlers = {};
  let tokenIndex = 0;
  const service = createGameLaunchService({
    path: path.win32, platform: 'win32', appStartedAt: 0, nowMs: () => clock,
    shell: { async openExternal(target) { safetyEvents.push(['uri', target]); }, async openPath() { return ''; } },
    crypto: { randomBytes() { tokenIndex += 1; return { toString: () => `token-${tokenIndex}` }; } },
    spawn(exe, args, options) {
      spawnCalls.push({ exe, args, options });
      return { on(event, handler) { childHandlers[event] = handler; }, unref() { spawnCalls.at(-1).unref = true; } };
    },
    recordSafety: (event, details) => safetyEvents.push([event, details]),
    readSharedSafety: () => shared,
    writeSharedSafety(value) { shared = value; sharedWrites.push(value); },
    setDiscordActivity: value => discord.push(['set', value]),
    clearDiscordActivity: () => discord.push(['clear']),
    sendExited: payload => exited.push(payload),
  });
  const event = { sender: { id: 7 } };
  assert.equal(service.arm(event).ok, false, 'startup quarantine must block arming');
  assert.deepEqual(await service.launch(event, { exePath: 'ms-settings:gaming-gamemode' }), { ok: true, target: 'uri' });
  clock = 20000;
  assert.deepEqual(service.arm(event), { ok: true, token: 'token-1' });
  assert.match((await service.launch(event, { exePath: 'C:\\Games\\One\\game.exe', gameId: 'one', name: 'Game', launchToken: 'wrong' })).error, /Launch button/);
  assert.deepEqual(service.arm(event), { ok: true, token: 'token-2' });
  assert.deepEqual(await service.launch(event, { exePath: 'C:\\Games\\One\\game.exe', launchArgs: '--safe windowed', gameId: 'one', name: 'Game', launchToken: 'token-2' }), { ok: true });
  assert.deepEqual(spawnCalls[0], { exe: 'C:\\Games\\One\\game.exe', args: ['--safe', 'windowed'], options: { detached: true, stdio: 'ignore', cwd: 'C:\\Games\\One' }, unref: true });
  assert.deepEqual([...service.runningKeys()], ['one']);
  clock += 2000;
  childHandlers.exit();
  assert.deepEqual(exited, [{ gameId: 'one', exePath: 'C:\\Games\\One\\game.exe', seconds: 2 }]);
  assert.deepEqual([...service.runningKeys()], []);
  assert.equal(discord.filter(entry => entry[0] === 'clear').length, 1);
  assert.deepEqual(sharedWrites[0], { lastAt: 20000, lockedUntil: 0 });

  assert.deepEqual(service.arm(event), { ok: true, token: 'token-3' });
  assert.match((await service.launch(event, { exePath: 'C:\\Games\\Two.exe', gameId: 'two', launchToken: 'token-3' })).error, /rapid repeated/);
  clock += 11000;
  assert.deepEqual(service.arm(event), { ok: true, token: 'token-4' });
  clock += 1300;
  assert.match((await service.launch(event, { exePath: 'C:\\Games\\Expired.exe', launchToken: 'token-4' })).error, /Launch button/);
  assert(safetyEvents.some(([name]) => name === 'blocked-missing-launch-authorization'));
  assert(safetyEvents.some(([name]) => name === 'blocked-local-rapid-repeat'));
  assert.equal(spawnCalls.length, 1, 'only one authorized non-cooled-down launch may spawn');
  clock += 12000;
  assert.deepEqual(service.arm(event), { ok: true, token: 'token-5' });
  assert.deepEqual(await service.launch(event, { exePath: 'C:\\Emulators\\RetroArch.exe', launchArgs: '--fullscreen "D:\\ROM Library\\Mario World.sfc"', gameId: 'rom-1', name: 'Super Mario World', launchToken: 'token-5' }), { ok: true });
  assert.deepEqual(spawnCalls.at(-1).args, ['--fullscreen', 'D:\\ROM Library\\Mario World.sfc'], 'Quoted ROM paths must remain one spawn argument.');
  console.log('PASS: extracted launch service enforces startup quarantine, one-use expiry, local/shared cooldown state, exact spawn arguments, running-game lifecycle and exit reporting. URI settings remain explicit. No process launched.');
})().catch(error => { console.error(error); process.exitCode = 1; });
