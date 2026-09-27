const assert = require('node:assert/strict');
const { createWindowsControllerScan, normalizeDevices } = require('../electron/controller/windows-controller-scan.cjs');

const rows = [
  { FriendlyName: '8BitDo Ultimate 2 Wireless', Class: 'Bluetooth', Status: 'OK', InstanceId: 'BTHENUM\\DEV_123' },
  { FriendlyName: '8BitDo Ultimate 2 Wireless', Class: 'Bluetooth', Status: 'OK', InstanceId: 'BTHENUM\\DEV_123' },
  { FriendlyName: 'HID-compliant game controller', Class: 'HIDClass', Status: 'OK', InstanceId: 'HID\\VID_123' },
  { FriendlyName: 'Xbox Wireless Adapter', Class: 'USB', Status: 'OK', InstanceId: 'USB\\VID_123' },
  { FriendlyName: 'Disconnected Controller', Class: 'HIDClass', Status: 'Error', InstanceId: 'HID\\VID_234' },
];
assert.deepEqual(normalizeDevices(rows), [
  { name: '8BitDo Ultimate 2 Wireless', kind: 'Bluetooth' },
  { name: 'HID-compliant game controller', kind: 'USB / HID' },
]);
(async () => {
  let calls = 0;
  const scan = createWindowsControllerScan({ platform: 'win32', run: (_exe, args, options, callback) => {
    calls += 1;
    assert.equal(args[0], '-NoProfile');
    assert.equal(options.windowsHide, true);
    callback(null, JSON.stringify(rows));
  } });
  assert.deepEqual(await scan(), { ok: true, devices: normalizeDevices(rows) });
  assert.equal(calls, 1, 'one explicit scan invokes Windows once');
  assert.equal((await createWindowsControllerScan({ platform: 'linux' })()).ok, false);
  const denied = await createWindowsControllerScan({ platform: 'win32', run: (_exe, _args, _options, callback) => callback(new Error('Access denied')) })();
  assert.equal(denied.ok, false);
  assert.deepEqual(denied.devices, []);
  console.log('PASS: Windows controller inventory is on-demand, bounded, read-only and distinguishes device presence from live input.');
})().catch(error => { console.error(error); process.exitCode = 1; });
