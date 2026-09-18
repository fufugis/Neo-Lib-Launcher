const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createDiagnosticRecorder } = require('../electron/diagnostics/diagnostic-recorder.cjs');

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'neolib-diagnostics-'));
let tick = 0;
try {
  const recorder = createDiagnosticRecorder({
    fs,
    path,
    directory: () => root,
    appVersion: '1.7.5',
    platform: 'win32',
    release: '10.0.26100',
    arch: 'x64',
    now: () => new Date(1_780_000_000_000 + tick++),
    maxBytes: 360,
    keepFiles: 3,
  });

  recorder.record('renderer-console', {
    level: 3,
    message: 'ReferenceError: Secret Game is not defined at C:\\Private\\Games\\Secret Game.exe https://example.test/?key=super-secret',
    source: 'file:///C:/Program Files/NEO-LIB/assets/index-AbCd123.js',
    line: 42,
    gameName: 'Secret Game',
    exePath: 'C:\\Private\\Games\\Secret Game.exe',
    apiKey: 'super-secret',
    query: 'private search',
  });
  recorder.record('ipc-failure', {
    channel: 'launcher:scan-epic', domain: 'launcher', kind: 'service-rejection',
    error: new Error('EPERM C:\\Users\\Private\\Library'),
  });
  const initialReport = recorder.getReport();
  assert.match(initialReport.report, /REFERENCE_ERROR|PERMISSION_ERROR/);
  for (const privateText of ['Secret Game', 'Private', 'example.test', 'super-secret', 'private search', 'exePath', 'apiKey', 'query', '"message":']) {
    assert(!initialReport.report.includes(privateText), `report leaked forbidden text: ${privateText}`);
  }
  for (let index = 0; index < 10; index += 1) {
    recorder.record('operation-finished', { status: 'completed', durationMs: index * 10, checked: index });
  }

  const files = fs.readdirSync(root).sort();
  assert(files.includes('neolib-diagnostics.jsonl'));
  assert(files.some(name => name === 'neolib-diagnostics.jsonl.1'), 'bounded rotation should retain an older file');
  assert(files.length <= 3, 'rotation must retain no more than the configured file count');

  const report = recorder.getReport();
  assert.equal(report.ok, true);
  assert(report.count > 0 && report.count <= 120);
  for (const privateText of ['Secret Game', 'Private', 'example.test', 'super-secret', 'private search', 'exePath', 'apiKey', 'query', '"message":']) {
    assert(!report.report.includes(privateText), `report leaked forbidden text: ${privateText}`);
  }
  assert.doesNotMatch(report.report, /[A-Z]:\\/i);
  assert.doesNotMatch(report.report, /https?:\/\//i);
  console.log('Privacy-bounded rotating diagnostic recorder verification passed.');
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
