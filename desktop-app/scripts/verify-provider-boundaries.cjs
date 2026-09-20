const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const providerDir = path.join(root, 'electron', 'providers');
const main = fs.readFileSync(path.join(root, 'electron', 'main.js'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const refreshTest = fs.readFileSync(path.join(root, 'scripts', 'verify-refresh-candidates.mjs'), 'utf8');

const providers = [
  'store-provider-service.cjs', 'public-web-provider-service.cjs',
  'specialist-metadata-provider-service.cjs', 'metadata-candidate-service.cjs',
  'gemini-provider-service.cjs', 'news-normalization-service.cjs',
  'public-news-provider-service.cjs', 'weekly-release-provider-service.cjs',
  'steam-news-provider-service.cjs', 'owned-news-provider-service.cjs',
  'update-history-provider-service.cjs', 'deals-provider-service.cjs',
  'update-scan-coordinator-service.cjs', 'update-source-discovery-service.cjs',
  'installed-version-evidence-service.cjs', 'update-page-version-service.cjs',
  'independent-update-assessment-service.cjs',
];

assert.deepEqual(fs.readdirSync(providerDir).filter(name => name.endsWith('.cjs')).sort(), [...providers].sort(), 'Stage 4 provider inventory changed without updating its completion contract');
for (const name of providers) {
  const source = fs.readFileSync(path.join(providerDir, name), 'utf8');
  assert.match(source, /module\.exports\s*=\s*\{\s*create[A-Za-z]+Service\s*\}/, `${name} exports an injectable factory`);
  assert(!/require\(['"](?:https?|electron|child_process)['"]\)/.test(source), `${name} must not own hidden network, Electron or process dependencies`);
  assert(main.includes(`require('./providers/${name}')`), `${name} is wired into the native composition root`);
}

const removedLegacy = [
  'DEALS_CACHE', 'updateScanInFlight', 'recentUpdateScan', 'UPDATE_SOURCE_DISCOVERY_CACHE',
  'INDEPENDENT_UPDATE_CACHE', 'function discoverUpdateSources',
  'function readWindowsExecutableVersion', 'function deriveInstalledVersionFromLocalGame',
  'const trustedMatches', 'const compareVersions',
];
for (const name of removedLegacy) assert(!main.includes(name), `main.js still owns legacy provider state: ${name}`);
assert.equal((main.match(/remainingIpcServices\["deals:fetch"\]/g) || []).length, 1);
assert.equal((main.match(/remainingIpcServices\["releases:weekly"\]/g) || []).length, 1);
assert.equal((main.match(/remainingIpcServices\["updates:scan"\]/g) || []).length, 1);
assert(main.includes('independentUpdateAssessment.assess(game)'), 'independent update scans delegate per-game assessment');
assert(refreshTest.includes("!bulk.includes('autoApply: true')"), 'bulk refresh must retain the no-auto-apply guard');
assert(main.includes('publicWebProvider.searchGameMetadata(term)'), 'automatic metadata must retain exact-title public recovery');
assert(main.indexOf('const exactResults = await publicWebProvider.searchGameMetadata(term)') < main.indexOf('// 5. Gemini'), 'exact public-title recovery must run before optional AI');
assert.match(main, /if \(\/\^https\?:\\\/\\\/\[\^\/\]\*\\\.itch\\\.io/, 'reviewed delisted itch pages must expand through their surviving official page');

const providerCommand = pkg.scripts['test:providers'] || '';
for (const verifier of [
  'verify-store-provider-service.cjs', 'verify-public-web-provider-service.cjs',
  'verify-specialist-metadata-provider-service.cjs', 'verify-metadata-candidate-service.cjs',
  'verify-gemini-provider-service.cjs', 'verify-news-normalization-service.cjs',
  'verify-public-news-provider-service.cjs', 'verify-weekly-release-provider-service.cjs',
  'verify-steam-news-provider-service.cjs', 'verify-owned-news-provider-service.cjs',
  'verify-update-history-provider-service.cjs', 'verify-deals-provider-service.cjs',
  'verify-update-scan-coordinator-service.cjs', 'verify-update-source-discovery-service.cjs',
  'verify-installed-version-evidence-service.cjs', 'verify-update-page-version-service.cjs',
  'verify-independent-update-assessment-service.cjs',
]) assert(providerCommand.includes(verifier), `${verifier} must remain in the provider gate`);

console.log('PASS: Stage 4 inventory has 17 injected provider/evidence services, no hidden direct I/O dependencies or legacy main-process caches, one IPC route per feed, per-game assessment delegation and guarded user-reviewed refresh.');
