const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { builtinModules } = require('module');

const appRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(appRoot, '..');
const read = relative => fs.readFileSync(path.join(appRoot, relative), 'utf8');
const windowsWorkflow = fs.readFileSync(path.join(repoRoot, '.github', 'workflows', 'build-windows.yml'), 'utf8');
const releaseNotes = fs.readFileSync(path.join(repoRoot, 'RELEASE_NOTES_v1.7.9.md'), 'utf8');
const windowsAcceptance = fs.readFileSync(path.join(repoRoot, 'WINDOWS_ACCEPTANCE_V1.7.9.md'), 'utf8');
const releaseHardening = fs.readFileSync(path.join(repoRoot, 'RELEASE_HARDENING.md'), 'utf8');
const releaseConfigBuilder = read('scripts/prepare-release-config.cjs');
const localReleaseBuilder = read('scripts/build-release.ps1');
const generatedBuildModules = new Map([
  ['./discord-config.generated', 'electron/discord-config.generated.js'],
]);

function filesBelow(relative, extensions) {
  const output = [];
  const walk = current => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) walk(absolute);
      else if (extensions.some(extension => entry.name.endsWith(extension))) output.push(absolute);
    }
  };
  walk(path.join(appRoot, relative));
  return output;
}

function declarationConflicts(source) {
  const declarations = new Map();
  const expression = /^(?:export\s+)?(?:(?:async\s+)?function|class|const|let|var)\s+([A-Za-z_$][\w$]*)/gm;
  for (const match of source.matchAll(expression)) {
    const line = source.slice(0, match.index).split('\n').length;
    const existing = declarations.get(match[1]) || [];
    declarations.set(match[1], [...existing, line]);
  }
  return [...declarations.entries()].filter(([, lines]) => lines.length > 1);
}

function resolvesRelative(fromFile, request) {
  const base = path.resolve(path.dirname(fromFile), request);
  const candidates = [
    base,
    ...['.js', '.jsx', '.cjs', '.mjs', '.json', '.css'].map(extension => base + extension),
    ...['index.js', 'index.jsx', 'index.cjs', 'index.mjs'].map(file => path.join(base, file)),
  ];
  return candidates.some(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
}

const nativeRuntimeFiles = filesBelow('electron', ['.js', '.cjs', '.mjs']);
const runtimeFiles = [
  ...nativeRuntimeFiles,
  ...filesBelow('src', ['.js', '.jsx', '.mjs']),
];

const duplicateFailures = [];
const importFailures = [];
for (const file of runtimeFiles) {
  const source = fs.readFileSync(file, 'utf8');
  for (const [name, lines] of declarationConflicts(source)) {
    duplicateFailures.push(`${path.relative(appRoot, file)}: ${name} at lines ${lines.join(', ')}`);
  }
  const requests = [
    ...source.matchAll(/require\(\s*['"](\.[^'"]+)['"]\s*\)/g),
    ...source.matchAll(/\bfrom\s+['"](\.[^'"]+)['"]/g),
    ...source.matchAll(/\bimport\s+['"](\.[^'"]+)['"]/g),
  ].map(match => match[1]);
  for (const request of new Set(requests)) {
    if (!resolvesRelative(file, request)) {
      const generatedPath = generatedBuildModules.get(request);
      if (
        generatedPath
        && windowsWorkflow.includes('node scripts/prepare-release-config.cjs')
        && releaseConfigBuilder.includes(path.basename(generatedPath))
      ) continue;
      importFailures.push(`${path.relative(appRoot, file)} -> ${request}`);
    }
  }
}
assert.deepEqual(duplicateFailures, [], `duplicate top-level declarations:\n${duplicateFailures.join('\n')}`);
assert.deepEqual(importFailures, [], `unresolved relative modules:\n${importFailures.join('\n')}`);

const packageJson = JSON.parse(read('package.json'));
const productionDependencies = new Set(Object.keys(packageJson.dependencies || {}));
const allowedNativeModules = new Set(['electron', ...builtinModules, ...builtinModules.map(name => `node:${name}`)]);
const undeclaredNativeImports = [];
const usedProductionDependencies = new Set();
for (const file of nativeRuntimeFiles) {
  const source = fs.readFileSync(file, 'utf8');
  const requests = [...source.matchAll(/require\(\s*['"]([^'"]+)['"]\s*\)/g)]
    .map(match => match[1])
    .filter(request => !request.startsWith('.'));
  for (const request of new Set(requests)) {
    const packageName = request.startsWith('@') ? request.split('/').slice(0, 2).join('/') : request.split('/')[0];
    if (productionDependencies.has(packageName)) usedProductionDependencies.add(packageName);
    else if (!allowedNativeModules.has(request)) undeclaredNativeImports.push(`${path.relative(appRoot, file)} -> ${request}`);
  }
}
assert.deepEqual(undeclaredNativeImports, [], `native runtime imports undeclared packages:\n${undeclaredNativeImports.join('\n')}`);
assert.deepEqual([...productionDependencies].filter(name => !usedProductionDependencies.has(name)), [], 'package.json contains unused production dependencies');
assert(packageJson.scripts?.['build:release']?.includes('scripts/build-release.ps1'), 'local release command must use the guarded Windows release driver');
assert(
  localReleaseBuilder.indexOf('scripts/prepare-release-config.cjs') < localReleaseBuilder.indexOf("@('run', 'build:renderer')"),
  'local release command must validate and prepare integration configuration before rendering',
);
assert(
  localReleaseBuilder.indexOf('finally {') < localReleaseBuilder.indexOf('scripts/cleanup-release-config.cjs'),
  'local release command must clean the temporary renderer environment in a finally path',
);
assert(
  localReleaseBuilder.indexOf('scripts/cleanup-release-config.cjs') < localReleaseBuilder.indexOf("'electron-builder'"),
  'local release command must remove the temporary renderer environment before packaging',
);
assert(localReleaseBuilder.includes("@('run', 'package:portable')"), 'local release command must use the shared portable packager');
assert(localReleaseBuilder.includes("@('run', 'inspect:release')"), 'local release command must finish with candidate inspection');
assert(windowsWorkflow.includes('body_path: RELEASE_NOTES_v1.7.9.md'), 'GitHub release must use the reviewed v1.7.9 release notes');
for (const heading of ['One Library Wizard', 'Full-workspace Wall', 'Two Wall views', 'Readable Wall polish', 'Release status']) {
  assert(releaseNotes.includes(heading), `v1.7.9 release notes are missing ${heading}`);
}
for (const requiredAcceptanceStep of [
  '89 native commands have one registration and request/response contracts.',
  'Control Center gear opens on the first click',
  'Delayed hover text remains entirely inside every screen edge',
  'known fully updated installed Steam game',
  'genuine queued or active Steam download',
  'Open downloads',
]) {
  assert(windowsAcceptance.includes(requiredAcceptanceStep), `Windows acceptance record is missing ${requiredAcceptanceStep}`);
}
for (const [label, source] of [
  ['release notes', releaseNotes],
  ['Windows acceptance record', windowsAcceptance],
  ['release hardening checklist', releaseHardening],
]) {
  assert(!/\b(?:83|84) native commands\b/.test(source), `${label} contains a stale native-command count`);
}
const portablePackager = read('scripts/package-portable.ps1');
assert(portablePackager.includes('[System.IO.Compression.ZipFile]::CreateFromDirectory'), 'portable packager must preserve the win-unpacked directory tree');
assert(portablePackager.includes("throw 'Portable ZIP destination must stay outside its source folder.'"), 'portable packager must reject a destination inside its source');
assert(fs.existsSync(path.join(appRoot, packageJson.main)), 'package main entry must exist');
assert(fs.existsSync(path.join(appRoot, 'electron/preload.js')), 'preload entry must exist');
for (const asset of ['build/icon.ico', 'build/icon.png', 'build/tray-icon.png', 'build/installer.nsh']) {
  assert(fs.existsSync(path.join(appRoot, asset)), `release asset missing: ${asset}`);
}
for (const required of ['electron/**/*', 'dist-renderer/**/*', 'package.json']) {
  assert(packageJson.build?.files?.includes(required), `package file allow-list missing ${required}`);
}

const appSource = read('src/App.jsx');
const changelogSource = read('src/components/changelog/changelog-content.mjs');
const currentChangelogSource = read('src/components/changelog/v179-changelog.mjs');
const appVersion = appSource.match(/const APP_VERSION = ['"]([^'"]+)['"]/i)?.[1];
const changelogVersion = currentChangelogSource.match(/version:\s*['"]([^'"]+)['"]/i)?.[1];
assert.equal(appVersion, packageJson.version, 'renderer and package versions must match');
assert.equal(changelogVersion, packageJson.version, 'newest changelog and package versions must match');
assert(changelogSource.includes("import { V179_CHANGELOG } from './v179-changelog.mjs'"), 'displayed changelog must use the curated current release entry');
assert(changelogSource.includes('V179_CHANGELOG,'), 'archived draft entry must not duplicate the displayed current release');

const mainSource = read('electron/main.js');
assert(!mainSource.includes('ipcMain.handle('), 'native commands must use the duplicate-safe IPC registry');
for (const obsolete of [
  'pickBestMatch', 'normalizeGeminiMetadata', 'requestGeminiAssistant',
  'newsTokens', 'searchNewsDate', 'gameSiteHost', 'publicNewsCacheKey', 'isGameNewsResult',
]) {
  assert(!new RegExp(`(?:function|const|let|var)\\s+${obsolete}\\b`).test(mainSource), `obsolete main-process helper returned: ${obsolete}`);
}

const ownership = fs.readFileSync(path.join(repoRoot, 'ARCHITECTURE_OWNERSHIP.md'), 'utf8');
for (const required of [
  'electron/ipc/', 'electron/providers/', 'electron/storage/', 'electron/game/',
  'src/state/', 'src/services/', 'src/components/', 'electron/main.js',
  'prepare-release-config.cjs', 'build-release.ps1', 'build-provenance.cjs', 'package-portable.ps1', 'release-candidate-inspector.cjs',
]) {
  assert(ownership.includes(required), `ownership map is missing ${required}`);
}

console.log(`PASS: release hardening checked ${runtimeFiles.length} runtime files, unique top-level ownership, resolved relative modules, package entry/assets, v${packageJson.version} alignment, IPC registry use, retired paths and the architecture ownership map.`);
