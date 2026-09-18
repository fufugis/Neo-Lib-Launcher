const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const main = fs.readFileSync(path.join(root, 'electron', 'main.js'), 'utf8');
const launchService = fs.readFileSync(path.join(root, 'electron', 'game', 'game-launch-service.cjs'), 'utf8');
const versionEvidence = fs.readFileSync(path.join(root, 'electron', 'providers', 'installed-version-evidence-service.cjs'), 'utf8');
const gameIpc = fs.readFileSync(path.join(root, 'electron', 'ipc', 'game-ipc.cjs'), 'utf8');
const preload = fs.readFileSync(path.join(root, 'electron', 'preload.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'src', 'App.jsx'), 'utf8');
const rendererEntry = fs.readFileSync(path.join(root, 'src', 'main.jsx'), 'utf8');
const mascot = fs.readFileSync(path.join(root, 'src', 'components', 'FungistMascot.jsx'), 'utf8');
const detail = fs.readFileSync(path.join(root, 'src', 'components', 'GameDetail.jsx'), 'utf8');
const previewActionBar = fs.readFileSync(path.join(root, 'src', 'components', 'preview', 'PreviewActionBar.jsx'), 'utf8');

const checks = [
  ['Executable version reader uses a fixed encoded PowerShell command', versionEvidence.includes("'-EncodedCommand', encodedScript")],
  ['Executable path is bound as process data', versionEvidence.includes('NEOLIB_VERSION_TARGET: exePath') && versionEvidence.includes('Get-Item -LiteralPath $target')],
  ['No executable path follows a PowerShell command script', !/execFile\(['"]powershell\.exe['"][\s\S]{0,300}['"]-Command['"][\s\S]{0,300}(?:script\s*,\s*exePath|exePath\s*\])/m.test(`${main}\n${versionEvidence}`)],
  ['Native launch requires a one-time authorization', main.includes('remainingIpcServices["game:armLaunch"]') && gameIpc.includes('registerIpc("game:armLaunch"') && launchService.includes('blocked-missing-launch-authorization')],
  ['Preload arms only after a trusted event on the visible Launch control', preload.includes("event.isTrusted") && preload.includes("[data-neolib-launch]") && preload.includes('launchIntentExpiresAt = 0')],
  ['Renderer carries the native launch token into game:launch', app.includes("const launchGame = async (g, launchToken = '')") && app.includes('name: g.name, launchToken,')],
  ['Only the visible Launch control requests authorization', !detail.includes('window.api?.armGameLaunch') && previewActionBar.includes('window.api?.armGameLaunch') && previewActionBar.includes('data-neolib-launch="true"')],
  ['Mascot imports its extracted notification preference helper', /import\s*\{[^}]*notificationEnabled[^}]*\}\s*from\s*['"]\.\/mascot\/fungist-model\.mjs['"]/.test(mascot)],
  ['Renderer shows a local recovery screen when startup fails', rendererEntry.includes("import('./App.jsx')") && rendererEntry.includes('class StartupBoundary') && rendererEntry.includes('<StartupFailure error={error} />')],
  ['Main process records renderer load and crash diagnostics', main.includes("'renderer-console'") && main.includes("'renderer-process-gone'") && main.includes("'renderer-load-failed'") && main.includes("'renderer-load-finished'" )],
  ['Steam update handoff uses the documented Downloads route', main.includes("shell.openExternal('steam://open/downloads')") && !main.includes("shell.openExternal('steam://downloads/')")],
  ['Steam pending updates require both remaining bytes and an active Steam update state', main.includes('const steamUpdateStateMask =') && main.includes('const updateActive = (stateFlags & steamUpdateStateMask) !== 0;') && main.includes('if (remainingBytes <= 0 || !updateActive)')],
];

const failed = checks.filter(([, passed]) => !passed);
if (failed.length) {
  console.error('NEO-LIB launch-safety verification failed:');
  failed.forEach(([label]) => console.error(`- ${label}`));
  process.exit(1);
}

console.log(`NEO-LIB launch-safety verification passed (${checks.length} checks).`);
