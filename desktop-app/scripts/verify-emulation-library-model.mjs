import assert from 'node:assert/strict';
import { emulatorCategory, quoteLaunchArgument, romDisplayName, romExtensions, romLibraryEntry } from '../src/lib/emulation-library-model.mjs';

assert.deepEqual(romExtensions('snes'), ['.sfc', '.smc']);
assert(romExtensions('unknown').includes('.nes'));
assert.deepEqual(emulatorCategory({ id: 'retro arch', name: 'RetroArch' }), { id: 'emulator-retro-arch', name: 'RetroArch', color: '#7c5cff', emulation: true });
assert.equal(quoteLaunchArgument('D:\\ROM Library\\Mario World.sfc'), '"D:\\ROM Library\\Mario World.sfc"');
assert.equal(romDisplayName('D:\\ROM Library\\Mario_World.sfc'), 'Mario World');
const entry = romLibraryEntry({ profile: { id: 'retroarch', name: 'RetroArch', emulatorPath: 'C:\\Emulators\\retroarch.exe', argumentPrefix: '--fullscreen' }, romPath: 'D:\\ROM Library\\Mario World.sfc', sizeBytes: 1024, now: 5 });
assert.equal(entry.exePath, 'C:\\Emulators\\retroarch.exe');
assert.equal(entry.launchArgs, '--fullscreen "D:\\ROM Library\\Mario World.sfc"');
assert.deepEqual(entry.categoryIds, ['emulator-retroarch']);
assert.equal(entry.source, 'emulation');
assert.equal(romLibraryEntry({ profile: {}, romPath: 'D:\\x.nes' }), null);
console.log('Emulation library profile, category, ROM naming and quoted launch-entry contracts verified.');
