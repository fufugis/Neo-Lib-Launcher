const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { ARCHITECTURE_LABEL, sourceFingerprint, createBuildInfo, assertRendererFresh } = require('./build-provenance.cjs');

const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'neolib-build-proof-'));
try {
  for (const directory of ['electron', 'src', 'public', 'dist-renderer/assets']) fs.mkdirSync(path.join(sandbox, directory), { recursive: true });
  fs.writeFileSync(path.join(sandbox, 'electron/main.js'), 'module.exports = 1;');
  fs.writeFileSync(path.join(sandbox, 'src/App.jsx'), 'export default 1;');
  fs.writeFileSync(path.join(sandbox, 'public/asset.txt'), 'asset');
  fs.writeFileSync(path.join(sandbox, 'package.json'), '{"version":"1.0.0"}');
  fs.writeFileSync(path.join(sandbox, 'vite.config.js'), 'export default {};');

  const first = sourceFingerprint(sandbox);
  assert.equal(first, sourceFingerprint(sandbox), 'same source must keep the same fingerprint');
  const info = createBuildInfo(sandbox, new Date('2026-09-17T00:00:00.000Z'));
  assert.equal(info.id, first.slice(0, 12));
  assert.equal(info.builtAt, '2026-09-17T00:00:00.000Z');
  assert.equal(info.architecture, 'Stage 9B source-frozen');
  assert.equal(ARCHITECTURE_LABEL, 'Stage 9B source-frozen');
  assert.throws(() => assertRendererFresh(sandbox), /missing|stale/i, 'missing or unmarked output must be refused');
  fs.writeFileSync(path.join(sandbox, 'dist-renderer/assets/index.js'), `window.BUILD='${first}'`);
  assert.equal(assertRendererFresh(sandbox), first, 'matching output may package');
  fs.writeFileSync(path.join(sandbox, 'src/App.jsx'), 'export default 2;');
  assert.notEqual(sourceFingerprint(sandbox), first, 'a runtime source edit must change the fingerprint');
  assert.throws(() => assertRendererFresh(sandbox), /stale/i, 'source changes must invalidate old renderer output');

  const vite = fs.readFileSync(path.join(__dirname, '..', 'vite.config.js'), 'utf8');
  const settings = fs.readFileSync(path.join(__dirname, '..', 'src/components/SettingsModal.jsx'), 'utf8');
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  assert(vite.includes('__NEOLIB_BUILD_INFO__'), 'Vite must inject build information');
  assert(settings.includes('BUILD_INFO'), 'Settings must show build information');
  assert.equal(packageJson.build.beforePack, 'scripts/before-pack.cjs', 'Electron Builder must enforce freshness');
  console.log('PASS: build fingerprint is deterministic, changes with runtime source, appears in Settings and blocks missing or stale renderer packages. Temporary fixtures only.');
} finally {
  fs.rmSync(sandbox, { recursive: true, force: true });
}
