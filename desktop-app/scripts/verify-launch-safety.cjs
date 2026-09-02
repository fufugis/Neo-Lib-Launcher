const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const main = fs.readFileSync(path.join(root, 'electron', 'main.js'), 'utf8');
const preload = fs.readFileSync(path.join(root, 'electron', 'preload.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'src', 'App.jsx'), 'utf8');
const detail = fs.readFileSync(path.join(root, 'src', 'components', 'GameDetail.jsx'), 'utf8');

const checks = [
  ['Executable version reader uses a fixed encoded PowerShell command', main.includes("'-EncodedCommand', encodedScript")],
  ['Executable path is bound as process data', main.includes('NEOLIB_VERSION_TARGET: exePath') && main.includes('Get-Item -LiteralPath $target')],
  ['No executable path follows a PowerShell command script', !/execFile\(['"]powershell\.exe['"][\s\S]{0,300}['"]-Command['"][\s\S]{0,300}(?:script\s*,\s*exePath|exePath\s*\])/m.test(main)],
  ['Native launch requires a one-time authorization', main.includes("ipcMain.handle('game:armLaunch'") && main.includes('blocked-missing-launch-authorization')],
  ['Preload arms only after a trusted event on the visible Launch control', preload.includes("event.isTrusted") && preload.includes("[data-neolib-launch]") && preload.includes('launchIntentExpiresAt = 0')],
  ['Renderer carries the native launch token into game:launch', app.includes("const launchGame = async (g, launchToken = '')") && app.includes('name: g.name, launchToken,')],
  ['Only the visible Launch control requests authorization', detail.includes('window.api?.armGameLaunch') && detail.includes('data-neolib-launch="true"')],
];

const failed = checks.filter(([, passed]) => !passed);
if (failed.length) {
  console.error('NEO-LIB launch-safety verification failed:');
  failed.forEach(([label]) => console.error(`- ${label}`));
  process.exit(1);
}

console.log(`NEO-LIB launch-safety verification passed (${checks.length} checks).`);
