const assert = require('node:assert/strict');
const os = require('node:os');
const fs = require('node:fs/promises');
const path = require('node:path');
const { createWidgetPackageService, normalizeManifest } = require('../electron/widgets/widget-package-service.cjs');

async function main() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'neolib-widget-test-'));
  const source = path.join(root, 'source');
  const installed = path.join(root, 'installed');
  await fs.mkdir(path.join(source, 'assets'), { recursive: true });
  const manifest = {
    formatVersion: 1, id: 'author.play-log', name: 'Play Log', description: 'Recent sessions at a glance.',
    author: { name: 'Widget Author', url: 'https://example.test' }, version: '1.0.0', entry: 'index.html',
    layout: { minCols: 4, minRows: 2, defaultCols: 6, defaultRows: 3 }, permissions: ['storage'],
  };
  await fs.writeFile(path.join(source, 'widget.json'), JSON.stringify(manifest));
  await fs.writeFile(path.join(source, 'index.html'), '<main>not executed</main>');
  await fs.writeFile(path.join(source, 'assets', 'logo.txt'), 'asset');
  const service = createWidgetPackageService({ fsp: fs, path, widgetsDir: () => installed, now: () => 42 });
  assert.equal(normalizeManifest({ ...manifest, id: '../escape' }), null);
  assert.equal(normalizeManifest({ ...manifest, author: { name: '' } }), null);
  const result = await service.install(path.join(source, 'widget.json'));
  assert.equal(result.ok, true);
  assert.equal(result.widget.id, 'author.play-log');
  assert.equal(result.widget.status, 'installed-awaiting-host');
  assert.equal(await fs.readFile(path.join(installed, 'author.play-log', 'index.html'), 'utf8'), '<main>not executed</main>');
  assert.deepEqual((await service.list()).map(widget => ({ id: widget.id, author: widget.author.name, status: widget.status })), [{ id: 'author.play-log', author: 'Widget Author', status: 'installed-awaiting-host' }]);
  const duplicate = await service.install(path.join(source, 'widget.json'));
  assert.deepEqual(duplicate, { ok: false, code: 'ALREADY_INSTALLED', error: 'This widget is already installed. Remove it before importing this version.' });
  await fs.rm(root, { recursive: true, force: true });
  console.log('PASS: widget packages require a valid manifest, are copied as inert local data, and reject duplicate IDs. Pure temporary fixtures only.');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
