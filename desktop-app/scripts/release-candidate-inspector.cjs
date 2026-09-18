const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const { ARCHITECTURE_LABEL, sourceFingerprint } = require('./build-provenance.cjs');

const builderRequire = createRequire(require.resolve('electron-builder'));
const asar = builderRequire('@electron/asar');

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').toUpperCase();
}

function reportPath(appRoot, file) {
  return path.relative(appRoot, file).replace(/\\/g, '/');
}

function checksumManifest(result) {
  return [result.installer, result.portable]
    .map(artifact => `${artifact.sha256}  ${path.posix.basename(artifact.path)}`)
    .join('\n') + '\n';
}

function normalizedEntries(archive) {
  return asar.listPackage(archive).map(entry => entry.replace(/^[/\\]+/, '').replace(/\\/g, '/'));
}

function readArchiveText(archive, entry) {
  return asar.extractFile(archive, entry.replace(/\//g, path.sep)).toString('utf8');
}

function collectRequiredMascotAssets(appRoot) {
  const publicRoot = path.join(appRoot, 'public');
  const mascotRoot = path.join(publicRoot, 'mascot');
  if (!fs.existsSync(mascotRoot)) return [];
  const required = [];
  const walk = current => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) walk(absolute);
      else if (entry.isFile() && /(?:\.mp3|\.png|\.webp|\.json)$/i.test(entry.name)) {
        required.push(`dist-renderer/${path.relative(publicRoot, absolute).replace(/\\/g, '/')}`);
      }
    }
  };
  walk(mascotRoot);
  return required.sort();
}

function inspectReleaseCandidate({
  appRoot,
  distDir = path.join(appRoot, 'dist'),
  minimumInstallerBytes = 1_000_000,
  minimumArchiveBytes = 1_000_000,
  minimumPortableBytes = 1_000_000,
  expectedFeedbackRelayUrl = '',
  expectedFeedbackRelayKey = '',
  expectedDiscordAppId = '',
} = {}) {
  assert(appRoot, 'appRoot is required');
  const packageJson = JSON.parse(fs.readFileSync(path.join(appRoot, 'package.json'), 'utf8'));
  const version = packageJson.version;
  const expectedTag = `v${version}`;
  assert(/^v\d+\.\d+\.\d+$/.test(expectedTag), `release version must produce a clean legacy-compatible tag: ${expectedTag}`);

  const installer = path.join(distDir, `NEO-LIB-Setup-${version}.exe`);
  const portable = path.join(distDir, 'NEO-LIB-windows-portable.zip');
  const archive = path.join(distDir, 'win-unpacked', 'resources', 'app.asar');
  assert(fs.existsSync(installer), `missing v${version} installer: ${installer}`);
  assert(fs.statSync(installer).size >= minimumInstallerBytes, 'installer is unexpectedly small');
  assert(fs.existsSync(portable), `missing portable package: ${portable}`);
  assert(fs.statSync(portable).size >= minimumPortableBytes, 'portable package is unexpectedly small');
  assert(fs.existsSync(archive), `missing packaged app.asar: ${archive}`);
  assert(fs.statSync(archive).size >= minimumArchiveBytes, 'app.asar is unexpectedly small');

  // Tests and build wrappers can inspect an archive in the same Node process
  // that created it. Drop @electron/asar's header cache before reading.
  asar.uncache(archive);
  const entries = normalizedEntries(archive);
  const entrySet = new Set(entries);
  for (const required of [
    'package.json', 'electron/main.js', 'electron/preload.js', 'electron/discord-config.js',
    'dist-renderer/index.html', 'build/icon.ico', 'build/icon.png', 'build/tray-icon.png',
  ]) assert(entrySet.has(required), `packaged archive is missing ${required}`);

  const packagedPackage = JSON.parse(readArchiveText(archive, 'package.json'));
  assert.equal(packagedPackage.version, version, 'packaged version differs from source package');
  assert.equal(packagedPackage.main, packageJson.main, 'packaged main entry differs from source package');
  assert.equal(
    crypto.createHash('sha256').update(readArchiveText(archive, 'electron/main.js')).digest('hex').toUpperCase(),
    sha256(path.join(appRoot, 'electron', 'main.js')),
    'packaged electron/main.js differs from current source',
  );

  const fingerprint = sourceFingerprint(appRoot);
  const rendererScripts = entries.filter(entry => entry.startsWith('dist-renderer/') && entry.endsWith('.js'));
  assert(rendererScripts.length, 'packaged renderer JavaScript is missing');
  const rendererText = rendererScripts.map(entry => readArchiveText(archive, entry));
  assert(rendererText.some(text => text.includes(fingerprint)), `packaged renderer is stale for ${fingerprint.slice(0, 12)}`);
  assert(rendererText.some(text => text.includes(ARCHITECTURE_LABEL)), `packaged renderer is missing architecture label ${ARCHITECTURE_LABEL}`);
  const combinedRenderer = rendererText.join('\n');
  const packagedCredentialSignatures = [
    new RegExp(['discord', '(?:app)?', '\\.com/api/', 'webhooks/', '\\d+/', '[A-Za-z0-9_-]{20,}'].join(''), 'i'),
    new RegExp(['AI', 'za', '[0-9A-Za-z_-]{30,}'].join('')),
    new RegExp(['github_', 'pat_', '[0-9A-Za-z_]{20,}|gh', '[pousr]_', '[0-9A-Za-z]{20,}'].join('')),
    new RegExp(['sk', '-', '(?:proj-)?', '[0-9A-Za-z_-]{20,}'].join('')),
    new RegExp(['BEGIN ', '(?:RSA |EC |OPENSSH )?', 'PRIVATE KEY'].join('')),
  ];
  assert(!packagedCredentialSignatures.some(expression => expression.test(combinedRenderer)), 'packaged renderer contains a credential-like signature');
  if (expectedFeedbackRelayUrl || expectedFeedbackRelayKey) {
    assert(expectedFeedbackRelayUrl && expectedFeedbackRelayKey, 'feedback verification requires both relay URL and relay key');
    const relayUrl = new URL(expectedFeedbackRelayUrl);
    assert.equal(relayUrl.protocol, 'https:', 'configured feedback relay must use HTTPS');
    assert(/\/feedback\/?$/.test(relayUrl.pathname), 'configured feedback relay URL must end in /feedback');
    assert(!relayUrl.username && !relayUrl.password && !relayUrl.search && !relayUrl.hash, 'configured feedback relay URL must not contain credentials, a query or a fragment');
    assert(expectedFeedbackRelayKey.length >= 32, 'configured feedback relay key must contain at least 32 characters');
    assert(combinedRenderer.includes(expectedFeedbackRelayUrl), 'packaged renderer is missing the configured feedback relay URL');
    assert(combinedRenderer.includes(expectedFeedbackRelayKey), 'packaged renderer is missing the configured feedback relay key');
  }
  const generatedDiscordEntry = 'electron/discord-config.generated.js';
  const sourceGeneratedDiscordPath = path.join(appRoot, 'electron', 'discord-config.generated.js');
  const sourceHasGeneratedDiscord = fs.existsSync(sourceGeneratedDiscordPath);
  assert.equal(entrySet.has(generatedDiscordEntry), sourceHasGeneratedDiscord, 'packaged generated Discord configuration must match current source presence');
  let packagedDiscordAppId = '';
  if (entrySet.has(generatedDiscordEntry)) {
    const packagedDiscordSource = readArchiveText(archive, generatedDiscordEntry);
    packagedDiscordAppId = packagedDiscordSource.match(/DISCORD_APP_ID:\s*['"](\d{10,30})['"]/)?.[1] || '';
    assert(packagedDiscordAppId, 'packaged generated Discord configuration must contain one numeric App ID');
    assert.equal(packagedDiscordSource, fs.readFileSync(sourceGeneratedDiscordPath, 'utf8'), 'packaged generated Discord configuration differs from current source');
  }
  if (expectedDiscordAppId) {
    assert(/^\d{10,30}$/.test(expectedDiscordAppId), 'configured Discord App ID must be numeric');
    assert.equal(packagedDiscordAppId, expectedDiscordAppId, 'packaged Discord configuration does not match the configured App ID');
  }

  const missingMascotAssets = collectRequiredMascotAssets(appRoot).filter(entry => !entrySet.has(entry));
  assert.deepEqual(missingMascotAssets, [], `packaged mascot/voice assets are missing:\n${missingMascotAssets.join('\n')}`);
  assert(!entries.some(entry => /(?:^|\/)\.env(?:\.|$)/i.test(entry)), 'packaged archive must not contain .env files');

  return Object.freeze({
    ok: true,
    version,
    expectedTag,
    fingerprint,
    buildId: fingerprint.slice(0, 12),
    architecture: ARCHITECTURE_LABEL,
    installer: { path: reportPath(appRoot, installer), bytes: fs.statSync(installer).size, sha256: sha256(installer) },
    portable: { path: reportPath(appRoot, portable), bytes: fs.statSync(portable).size, sha256: sha256(portable) },
    archive: { path: reportPath(appRoot, archive), bytes: fs.statSync(archive).size, sha256: sha256(archive), entries: entries.length },
    mascotAssets: collectRequiredMascotAssets(appRoot).length,
    feedbackRelayConfigured: Boolean(expectedFeedbackRelayUrl && expectedFeedbackRelayKey),
    discordRichPresenceConfigured: Boolean(packagedDiscordAppId),
  });
}

if (require.main === module) {
  const appRoot = path.resolve(__dirname, '..');
  try {
    const result = inspectReleaseCandidate({
      appRoot,
      expectedFeedbackRelayUrl: process.env.NEOLIB_EXPECT_FEEDBACK_RELAY_URL || process.env.NEOLIB_FEEDBACK_RELAY_URL || '',
      expectedFeedbackRelayKey: process.env.NEOLIB_EXPECT_FEEDBACK_RELAY_KEY || process.env.NEOLIB_FEEDBACK_RELAY_KEY || '',
      expectedDiscordAppId: process.env.NEOLIB_EXPECT_DISCORD_APP_ID || process.env.NEOLIB_DISCORD_APP_ID || '',
    });
    const reportPath = path.join(appRoot, 'dist', `release-candidate-v${result.version}.json`);
    const checksumPath = path.join(appRoot, 'dist', `SHA256SUMS-v${result.version}.txt`);
    fs.writeFileSync(reportPath, JSON.stringify(result, null, 2) + '\n');
    fs.writeFileSync(checksumPath, checksumManifest(result), 'utf8');
    console.log(`PASS: v${result.version} candidate ${result.buildId}, ${result.archive.entries} archive entries, ${result.mascotAssets} mascot/voice assets.`);
    console.log(`Evidence: ${reportPath}`);
    console.log(`Checksums: ${checksumPath}`);
  } catch (error) {
    console.error(`RELEASE CANDIDATE REJECTED: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { checksumManifest, collectRequiredMascotAssets, inspectReleaseCandidate, normalizedEntries, sha256 };
