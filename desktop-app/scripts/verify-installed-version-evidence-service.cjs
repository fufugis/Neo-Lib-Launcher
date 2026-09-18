const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createInstalledVersionEvidenceService } = require('../electron/providers/installed-version-evidence-service.cjs');

const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'neolib-version-evidence-'));
const makeFile = (file, value = '') => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, value); };
const makeService = overrides => createInstalledVersionEvidenceService({
  fs, path, platform: 'win32', processEnv: { TEST_MARKER: 'safe' }, now: () => 60_000,
  appStartedAt: 0, execFile: (_command, _args, _options, callback) => callback(new Error('no resource fixture')),
  ...overrides,
});

(async () => {
  try {
    const service = makeService();
    assert.equal(await service.derive({}), null);
    assert.equal(await service.derive({ exePath: 'relative.exe' }), null);

    const blizzardRoot = path.join(sandbox, 'blizzard');
    const blizzardExe = path.join(blizzardRoot, 'retail', 'wow.exe');
    makeFile(blizzardExe);
    makeFile(path.join(blizzardRoot, '.build.info'), 'Product!STRING:0|Version!STRING:0|BuildId!DEC:1\nwow|11.2.5.63906|63906\n');
    assert.deepEqual(await service.derive({ exePath: blizzardExe }), { version: '11.2.5.63906', evidence: '.build.info' });

    const jsonRoot = path.join(sandbox, 'json');
    const jsonExe = path.join(jsonRoot, 'bin', 'hero.exe');
    makeFile(jsonExe);
    makeFile(path.join(jsonRoot, 'bin', 'version.json'), '{"gameVersion":"v2.8.1beta2"}');
    assert.deepEqual(await service.derive({ exePath: jsonExe }), { version: '2.8.1beta2', evidence: 'version.json' });

    const unityRoot = path.join(sandbox, 'unity');
    const unityExe = path.join(unityRoot, 'Aloft.exe');
    makeFile(unityExe);
    makeFile(path.join(unityRoot, 'Aloft_Data', 'globalgamemanagers'), 'binary-prefix\0Game Version: v3.4.5rc1\0binary-suffix');
    assert.deepEqual(await service.derive({ exePath: unityExe }), { version: '3.4.5rc1', evidence: 'globalgamemanagers' });

    const alphaRoot = path.join(sandbox, 'alpha');
    const alphaExe = path.join(alphaRoot, 'Runner_4.2.0-alpha3.exe');
    makeFile(alphaExe);
    assert.deepEqual(await service.derive({ exePath: alphaExe }), { version: '4.2.0-alpha3', evidence: 'Runner_4.2.0-alpha3.exe' });

    const betaRoot = path.join(sandbox, 'beta');
    const betaExe = path.join(betaRoot, 'game.exe');
    makeFile(betaExe);
    makeFile(path.join(betaRoot, 'version.txt'), 'Game Version: 7.1.0 beta12');
    assert.deepEqual(await service.derive({ exePath: betaExe }), { version: '7.1.0beta12', evidence: 'version.txt' });

    const filenameExe = path.join(sandbox, 'filename', 'Runner_1.7.3.exe');
    makeFile(filenameExe);
    assert.deepEqual(await service.derive({ exePath: filenameExe }), { version: '1.7.3', evidence: 'Runner_1.7.3.exe' });

    const resourceExe = path.join(sandbox, 'resource', 'plain.exe');
    makeFile(resourceExe);
    const execCalls = [];
    const resourceService = makeService({
      execFile(command, args, options, callback) {
        execCalls.push({ command, args, options });
        callback(null, 'Product Version 5,6,7 rc2');
      },
    });
    assert.deepEqual(await resourceService.derive({ exePath: resourceExe }), {
      version: '5.6.7rc2', evidence: 'Windows executable version resource', confidence: 'weak',
    });
    assert.equal(execCalls.length, 1);
    assert.equal(execCalls[0].command, 'powershell.exe');
    assert.deepEqual(execCalls[0].args.slice(0, 4), ['-NoLogo', '-NoProfile', '-NonInteractive', '-EncodedCommand']);
    assert.equal(execCalls[0].args.includes(resourceExe), false, 'the executable path never becomes a command argument');
    assert.equal(execCalls[0].options.windowsHide, true);
    assert.equal(execCalls[0].options.timeout, 4_500);
    assert.equal(execCalls[0].options.maxBuffer, 32 * 1024);
    assert.equal(execCalls[0].options.env.NEOLIB_VERSION_TARGET, resourceExe);
    assert.equal(execCalls[0].options.env.TEST_MARKER, 'safe');
    const script = Buffer.from(execCalls[0].args[4], 'base64').toString('utf16le');
    assert.match(script, /Get-Item -LiteralPath \$target/);
    assert.equal(script.includes(resourceExe), false);

    let quarantinedCalls = 0;
    const quarantined = makeService({ now: () => 29_999, execFile() { quarantinedCalls += 1; } });
    assert.equal(await quarantined.derive({ exePath: resourceExe }), null);
    assert.equal(quarantinedCalls, 0, 'PE-resource inspection stays asleep during the first 30 seconds');
    const nonWindows = makeService({ platform: 'linux', execFile() { quarantinedCalls += 1; } });
    assert.equal(await nonWindows.derive({ exePath: resourceExe }), null);
    assert.equal(quarantinedCalls, 0);

    const boundedRoot = path.join(sandbox, 'bounded');
    const boundedExe = path.join(boundedRoot, 'bin', 'plain.exe');
    makeFile(boundedExe);
    for (let index = 0; index < 35; index += 1) makeFile(path.join(boundedRoot, 'bin', `version-${String(index).padStart(2, '0')}.txt`), 'no labelled version here');
    let reads = 0;
    const countedFs = { ...fs, readFileSync(...args) { reads += 1; return fs.readFileSync(...args); } };
    const bounded = makeService({ fs: countedFs });
    assert.equal(await bounded.derive({ exePath: boundedExe }), null);
    assert(reads <= 24, `candidate file reads must remain bounded, saw ${reads}`);

    console.log('PASS: installed-version evidence preserves absolute-path refusal, 24-file bound, Blizzard .build.info, full alpha/beta/rc suffixes, labelled JSON/Unity data, filename fallback, 30-second quarantine and inert encoded PowerShell resource lookup. Temporary fixtures and fake exec only.');
  } finally {
    fs.rmSync(sandbox, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
