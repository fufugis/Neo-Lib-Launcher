const { execFile } = require('node:child_process');

// Presence only. Windows PnP can identify a connected device even when
// Chromium cannot read its buttons. Never enumerate in the background.
const SCAN_SCRIPT = `$ErrorActionPreference = 'Stop'
$devices = @(Get-PnpDevice -PresentOnly | Where-Object { $_.FriendlyName -match '(?i)8bitdo|controller|gamepad|joystick|dualshock|dualsense|joy-con|switch pro' } | Select-Object -First 80 FriendlyName, Class, Status, InstanceId)
ConvertTo-Json -InputObject $devices -Compress -Depth 3`;
const CONTROLLER_NAME = /8bitdo|controller|gamepad|joystick|dualshock|dualsense|joy-con|switch pro/i;
const NOT_CONTROLLER = /adapter|enumerator|virtual|bus driver|host controller|usb controller|audio|headset/i;

function normalizeDevices(value) {
  const rows = Array.isArray(value) ? value : value ? [value] : [];
  const seen = new Set();
  return rows.slice(0, 80).flatMap(row => {
    const name = String(row?.FriendlyName || '').trim().replace(/\s+/g, ' ').slice(0, 100);
    if (!CONTROLLER_NAME.test(name) || NOT_CONTROLLER.test(name) || String(row?.Status || '').toUpperCase() !== 'OK') return [];
    const id = String(row?.InstanceId || '');
    const kind = /^(BTH|BTHLE)/i.test(id) ? 'Bluetooth' : /^(USB|HID)/i.test(id) ? 'USB / HID' : 'Windows device';
    const key = `${name.toLowerCase()}|${kind}`;
    if (seen.has(key)) return [];
    seen.add(key);
    return [{ name, kind }];
  });
}

function createWindowsControllerScan({ platform = process.platform, run = execFile } = {}) {
  return async function scan() {
    if (platform !== 'win32') return { ok: false, devices: [], error: 'Windows device scanning is available on Windows only.' };
    try {
      const stdout = await new Promise((resolve, reject) => {
        run('powershell.exe', ['-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(SCAN_SCRIPT, 'utf16le').toString('base64')],
          { windowsHide: true, timeout: 7000, maxBuffer: 128 * 1024, encoding: 'utf8' },
          (error, output) => error ? reject(error) : resolve(output));
      });
      return { ok: true, devices: normalizeDevices(JSON.parse(stdout || '[]')) };
    } catch (error) {
      return { ok: false, devices: [], error: error?.killed ? 'Windows device scan timed out.' : 'Windows did not allow NEO-LIB to read its connected controller list.' };
    }
  };
}

module.exports = { createWindowsControllerScan, normalizeDevices };
