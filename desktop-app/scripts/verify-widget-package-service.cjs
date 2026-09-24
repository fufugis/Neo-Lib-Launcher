const assert = require('node:assert/strict');
const os = require('node:os');
const fs = require('node:fs/promises');
const path = require('node:path');
const { createWidgetPackageService, normalizeManifest } = require('../electron/widgets/widget-package-service.cjs');

async function main() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'neolib-widget-test-'));
  const source = path.join(root, 'source'); const installed = path.join(root, 'installed');
  await fs.mkdir(path.join(source, 'assets'), { recursive: true });
  const manifest = {
    formatVersion: 1, apiVersion: 1, id: 'author.play-log', name: 'Play Log', description: 'Recent sessions at a glance.',
    author: { name: 'Widget Author', url: 'https://example.test' }, version: '1.0.0', entry: 'index.html',
    layout: { minCols: 4, minRows: 2, defaultCols: 6, defaultRows: 3 }, permissions: ['storage'],
  };
  await fs.writeFile(path.join(source, 'widget.json'), JSON.stringify(manifest));
  await fs.writeFile(path.join(source, 'index.html'), '<main>isolated widget</main><script src="assets/widget.js"></script><link rel="stylesheet" href="assets/widget.css"><img src="assets/logo.png">');
  await fs.writeFile(path.join(source, 'assets', 'widget.js'), 'document.body.dataset.loaded = "yes";');
  await fs.writeFile(path.join(source, 'assets', 'widget.css'), 'main { color: red; }');
  await fs.writeFile(path.join(source, 'assets', 'logo.png'), Buffer.from([137, 80, 78, 71]));
  let clock = 40;
  const service = createWidgetPackageService({ fsp: fs, path, widgetsDir: () => installed, now: () => ++clock });
  assert.equal(normalizeManifest({ ...manifest, id: '../escape' }), null);
  assert.equal(normalizeManifest({ ...manifest, version: 'rolling' }), null);
  assert.equal(normalizeManifest({ ...manifest, author: { name: '' } }), null);
  assert.equal((await service.install(path.join(source, 'widget.json'))).widget.status, 'ready-disabled');
  const runtime = await service.runtime(manifest.id);
  assert(runtime.html.includes('<script>document.body.dataset.loaded = "yes";</script>'));
  assert(runtime.html.includes('<style>main { color: red; }</style>'));
  assert(runtime.html.includes('data:image/png;base64,'));
  assert(!runtime.html.includes('src="assets/'));
  assert.deepEqual((await service.list()).widgets.map(widget => widget.id), ['author.play-log']);

  await fs.writeFile(path.join(source, 'widget.json'), JSON.stringify({ ...manifest, version: '1.1.0', permissions: ['storage', 'library.read'] }));
  const review = await service.install(path.join(source, 'widget.json'));
  assert.equal(review.code, 'UPDATE_REVIEW_REQUIRED');
  assert.equal(review.currentVersion, '1.0.0');
  const updated = await service.update(path.join(source, 'widget.json'));
  assert.equal(updated.replacedVersion, '1.0.0');
  assert.equal(updated.widget.version, '1.1.0');

  await fs.writeFile(path.join(source, 'helper.exe'), 'blocked');
  await fs.writeFile(path.join(source, 'widget.json'), JSON.stringify({ ...manifest, id: 'author.blocked' }));
  const blocked = await service.install(path.join(source, 'widget.json'));
  assert.match(blocked.error, /cannot contain \.exe/i);
  await fs.rm(path.join(source, 'helper.exe'));

  const removed = await service.remove(manifest.id);
  assert.equal(removed.recoverable, true);
  let listed = await service.list();
  assert.equal(listed.widgets.length, 0);
  assert.equal(listed.recoverable[0].id, manifest.id);
  assert.equal((await service.restore(manifest.id)).ok, true);
  listed = await service.list();
  assert.equal(listed.widgets[0].version, '1.1.0');
  assert.equal((await service.runtime('../escape')).ok, false);

  await fs.rm(root, { recursive: true, force: true });
  console.log('PASS: community widgets validate compatibility and package safety, remain disabled by default, require explicit update replacement, load bounded HTML, and support recoverable uninstall. Temporary fixtures only; no widget code executed.');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
