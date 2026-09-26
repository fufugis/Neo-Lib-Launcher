import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { detectRomPlatform, emulatorCategory, quoteLaunchArgument, retroPlatform, romDisplayName, romExtensions, romLibraryEntry } from '../src/lib/emulation-library-model.mjs';

const require = createRequire(import.meta.url);
const { createRomScanService } = require('../electron/emulation/rom-scan-service.cjs');

assert.deepEqual(romExtensions('snes'), ['.sfc', '.smc']);
assert(romExtensions('unknown').includes('.nes'));
assert.deepEqual(romExtensions('3ds'), ['.3ds', '.cia', '.cci']);
assert.deepEqual(romExtensions('atari2600'), ['.a26']);
assert.deepEqual(romExtensions('c64'), ['.d64', '.t64', '.prg', '.crt']);
assert.deepEqual(romExtensions('wiiu'), ['.wua', '.wud', '.wux', '.rpx']);
assert.deepEqual(romExtensions('switch'), ['.nsp', '.xci']);
assert.equal(detectRomPlatform('D:\\ROMs\\Pitfall.a26'), 'atari2600');
assert.equal(detectRomPlatform('D:\\ROMs\\Impossible Mission.d64'), 'c64');
assert.equal(detectRomPlatform('D:\\ROMs\\Mario Kart 8.wua'), 'wiiu');
assert.equal(detectRomPlatform('D:\\ROMs\\Mario Odyssey.xci'), 'switch');
assert.equal(retroPlatform('switch2').id, 'generic', 'Switch 2 has no verified import format yet');
assert.equal(detectRomPlatform('D:\\ROMs\\Zelda.gba'), 'gba');
assert.equal(detectRomPlatform('D:\\ROMs\\disc.iso'), 'generic');
assert.equal(detectRomPlatform('D:\\ROMs\\disc.iso', 'gamecube'), 'gamecube');
assert.equal(retroPlatform('gba').label, 'Game Boy Advance');
assert.deepEqual(emulatorCategory({ id: 'retro arch', name: 'RetroArch', platform: 'snes' }), { id: 'retro-snes', name: 'Super Nintendo', color: '#7c5cff', emulation: true, platform: 'snes' });
assert.equal(quoteLaunchArgument('D:\\ROM Library\\Mario World.sfc'), '"D:\\ROM Library\\Mario World.sfc"');
assert.equal(romDisplayName('D:\\ROM Library\\Mario_World.sfc'), 'Mario World');
const entry = romLibraryEntry({ profile: { id: 'retroarch', name: 'RetroArch', platform: 'snes', emulatorPath: 'C:\\Emulators\\retroarch.exe', argumentPrefix: '--fullscreen', workingDirectory: 'C:\\Emulators' }, romPath: 'D:\\ROM Library\\Mario World.sfc', sizeBytes: 1024, now: 5 });
assert.equal(entry.exePath, 'C:\\Emulators\\retroarch.exe');
assert.equal(entry.launchArgs, '--fullscreen "D:\\ROM Library\\Mario World.sfc"');
assert.deepEqual(entry.categoryIds, ['retro-snes']);
assert.equal(entry.source, 'emulation');
assert.equal(entry.retroPlatform, 'snes');
assert.equal(entry.metadataQuery, 'Mario World SNES');
assert.equal(entry.installSizeBytes, 1024);
assert.equal(romLibraryEntry({ profile: {}, romPath: 'D:\\x.nes' }), null);
const sandbox = await fs.mkdtemp(path.join(os.tmpdir(), 'neolib-rom-scan-'));
try {
  await fs.mkdir(path.join(sandbox, 'nested'));
  await fs.writeFile(path.join(sandbox, 'Mario.sfc'), Buffer.alloc(7));
  await fs.writeFile(path.join(sandbox, 'ignore.txt'), 'not a ROM');
  await fs.writeFile(path.join(sandbox, 'nested', 'Zelda.smc'), Buffer.alloc(11));
  const scan = await createRomScanService({ fsp: fs, path }).scan({ root: sandbox, extensions: ['.sfc', '.smc'] });
  assert.equal(scan.ok, true);
  assert.deepEqual(scan.items.map(item => [path.basename(item.path), item.sizeBytes]), [['Mario.sfc', 7], ['Zelda.smc', 11]]);
  assert.equal(scan.truncated, false);
} finally {
  await fs.rm(sandbox, { recursive: true, force: true });
}
console.log('Emulation library profile, category, ROM naming and quoted launch-entry contracts verified.');
