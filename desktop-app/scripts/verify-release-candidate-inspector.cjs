const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createRequire } = require('node:module');
const { sourceFingerprint } = require('./build-provenance.cjs');
const { checksumManifest, inspectReleaseCandidate } = require('./release-candidate-inspector.cjs');

const workflow = fs.readFileSync(path.resolve(__dirname, '..', '..', '.github', 'workflows', 'build-windows.yml'), 'utf8');
assert(workflow.includes('yarn inspect:release'), 'GitHub Windows build must inspect the packaged candidate');
assert(workflow.includes('yarn package:portable'), 'GitHub and local builds must share the portable packaging owner');
assert(workflow.includes('release-candidate-v*.json'), 'GitHub artifacts must retain candidate evidence');
assert(workflow.includes('SHA256SUMS-v*.txt'), 'GitHub artifacts must retain public installer/portable checksums');
assert(workflow.includes('fail_on_unmatched_files: true'), 'GitHub Release publication must fail if any declared asset is missing');
assert(workflow.includes('NEOLIB_EXPECT_FEEDBACK_RELAY_URL: ${{ secrets.NEOLIB_FEEDBACK_RELAY_URL }}'), 'candidate inspection must verify the configured feedback URL');
assert(workflow.includes('NEOLIB_EXPECT_FEEDBACK_RELAY_KEY: ${{ secrets.NEOLIB_FEEDBACK_RELAY_KEY }}'), 'candidate inspection must verify the configured feedback key');
assert(workflow.includes('NEOLIB_EXPECT_DISCORD_APP_ID: ${{ secrets.NEOLIB_DISCORD_APP_ID }}'), 'candidate inspection must verify the optional Discord App ID');

const builderRequire = createRequire(require.resolve('electron-builder'));
const asar = builderRequire('@electron/asar');

(async () => {
  const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'neolib-candidate-'));
  try {
    for (const directory of [
      'electron', 'src', 'public/mascot/fifi', 'public/mascot/voice-packs/fifi',
      'build', 'package-input/electron', 'package-input/dist-renderer/assets',
      'package-input/dist-renderer/mascot/fifi', 'package-input/dist-renderer/mascot/voice-packs/fifi',
      'package-input/build', 'dist/win-unpacked/resources',
    ]) fs.mkdirSync(path.join(sandbox, directory), { recursive: true });

    const packageJson = { name: 'neo-lib-fixture', version: '1.7.7', main: 'electron/main.js' };
    fs.writeFileSync(path.join(sandbox, 'package.json'), JSON.stringify(packageJson));
    fs.writeFileSync(path.join(sandbox, 'vite.config.js'), 'export default {};');
    fs.writeFileSync(path.join(sandbox, 'electron/main.js'), 'module.exports = "fixture-main";');
    fs.writeFileSync(path.join(sandbox, 'electron/preload.js'), 'module.exports = "fixture-preload";');
    fs.writeFileSync(path.join(sandbox, 'electron/discord-config.js'), "module.exports = { DISCORD_APP_ID: '' };");
    const discordAppId = '123456789012345678';
    fs.writeFileSync(path.join(sandbox, 'electron/discord-config.generated.js'), `module.exports = { DISCORD_APP_ID: '${discordAppId}' };`);
    fs.writeFileSync(path.join(sandbox, 'src/App.jsx'), 'export default function App(){ return null; }');
    fs.writeFileSync(path.join(sandbox, 'public/mascot/fifi/body.png'), 'fifi');
    fs.writeFileSync(path.join(sandbox, 'public/mascot/voice-packs/fifi/hello.mp3'), 'voice');
    for (const icon of ['icon.ico', 'icon.png', 'tray-icon.png']) fs.writeFileSync(path.join(sandbox, 'build', icon), icon);

    const input = path.join(sandbox, 'package-input');
    fs.writeFileSync(path.join(input, 'package.json'), JSON.stringify(packageJson));
    fs.copyFileSync(path.join(sandbox, 'electron/main.js'), path.join(input, 'electron/main.js'));
    fs.copyFileSync(path.join(sandbox, 'electron/preload.js'), path.join(input, 'electron/preload.js'));
    fs.copyFileSync(path.join(sandbox, 'electron/discord-config.js'), path.join(input, 'electron/discord-config.js'));
    fs.copyFileSync(path.join(sandbox, 'electron/discord-config.generated.js'), path.join(input, 'electron/discord-config.generated.js'));
    fs.writeFileSync(path.join(input, 'dist-renderer/index.html'), '<main>fixture</main>');
    fs.copyFileSync(path.join(sandbox, 'public/mascot/fifi/body.png'), path.join(input, 'dist-renderer/mascot/fifi/body.png'));
    fs.copyFileSync(path.join(sandbox, 'public/mascot/voice-packs/fifi/hello.mp3'), path.join(input, 'dist-renderer/mascot/voice-packs/fifi/hello.mp3'));
    for (const icon of ['icon.ico', 'icon.png', 'tray-icon.png']) fs.copyFileSync(path.join(sandbox, 'build', icon), path.join(input, 'build', icon));
    const feedbackUrl = 'https://feedback.example.test/feedback';
    const feedbackKey = 'fixture-shared-feedback-key-32-chars-minimum';
    fs.writeFileSync(path.join(input, 'dist-renderer/assets/app.js'), `window.BUILD=${JSON.stringify(sourceFingerprint(sandbox))}; window.ARCH='Stage 9B source-frozen'; window.FEEDBACK_URL=${JSON.stringify(feedbackUrl)}; window.FEEDBACK_KEY=${JSON.stringify(feedbackKey)};`);
    await asar.createPackage(input, path.join(sandbox, 'dist/win-unpacked/resources/app.asar'));
    const fixtureEntries = asar.listPackage(path.join(sandbox, 'dist/win-unpacked/resources/app.asar'));
    assert(fixtureEntries.some(entry => /app\.js$/i.test(entry)), `fixture archive must contain renderer script: ${fixtureEntries.join(', ')}`);
    fs.writeFileSync(path.join(sandbox, 'dist/NEO-LIB-Setup-1.7.7.exe'), 'fixture-installer');
    fs.writeFileSync(path.join(sandbox, 'dist/NEO-LIB-windows-portable.zip'), 'fixture-portable');

    const accepted = inspectReleaseCandidate({
      appRoot: sandbox,
      minimumInstallerBytes: 1,
      minimumArchiveBytes: 1,
      minimumPortableBytes: 1,
      expectedFeedbackRelayUrl: feedbackUrl,
      expectedFeedbackRelayKey: feedbackKey,
      expectedDiscordAppId: discordAppId,
    });
    assert.equal(accepted.version, '1.7.7');
    assert.equal(accepted.expectedTag, 'v1.7.7');
    assert.equal(accepted.architecture, 'Stage 9B source-frozen');
    assert.equal(accepted.mascotAssets, 2);
    assert.equal(accepted.feedbackRelayConfigured, true);
    assert.equal(accepted.discordRichPresenceConfigured, true);
    assert.equal(accepted.installer.path, 'dist/NEO-LIB-Setup-1.7.7.exe');
    assert.equal(accepted.portable.path, 'dist/NEO-LIB-windows-portable.zip');
    assert.equal(accepted.archive.path, 'dist/win-unpacked/resources/app.asar');
    assert(!JSON.stringify(accepted).includes(sandbox), 'candidate evidence must not expose the local build path');
    const checksumText = checksumManifest(accepted);
    assert(checksumText.includes('NEO-LIB-Setup-1.7.7.exe'));
    assert(checksumText.includes('NEO-LIB-windows-portable.zip'));
    assert(!checksumText.includes('app.asar'), 'public checksums should list only released download artifacts');
    assert.throws(
      () => inspectReleaseCandidate({
        appRoot: sandbox,
        minimumInstallerBytes: 1,
        minimumArchiveBytes: 1,
        minimumPortableBytes: 1,
        expectedFeedbackRelayUrl: feedbackUrl,
        expectedFeedbackRelayKey: 'wrong-feedback-key-that-is-long-enough',
      }),
      /missing the configured feedback relay key/,
      'candidate inspection must reject a renderer built with the wrong feedback key',
    );

    fs.writeFileSync(path.join(sandbox, 'electron/main.js'), 'module.exports = "changed-after-package";');
    assert.throws(
      () => inspectReleaseCandidate({ appRoot: sandbox, minimumInstallerBytes: 1, minimumArchiveBytes: 1, minimumPortableBytes: 1 }),
      /packaged electron\/main\.js differs|packaged renderer is stale/,
      'source changes after packaging must reject the candidate',
    );
    console.log('PASS: release inspector accepts one coherent v1.7.7 fixture and rejects source/package drift. Temporary files only.');
  } finally {
    fs.rmSync(sandbox, { recursive: true, force: true });
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
