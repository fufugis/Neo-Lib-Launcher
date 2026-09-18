const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { cleanupReleaseConfig, prepareReleaseConfig, validateDiscordAppId, validateFeedbackConfig } = require('./prepare-release-config.cjs');

assert.throws(() => validateFeedbackConfig('', 'x'.repeat(32)), /URL is missing/);
assert.throws(() => validateFeedbackConfig('http://relay.test/feedback', 'x'.repeat(32)), /must use HTTPS/);
assert.throws(() => validateFeedbackConfig('https://relay.test/submit', 'x'.repeat(32)), /end in \/feedback/);
assert.throws(() => validateFeedbackConfig('https://user:pass@relay.test/feedback', 'x'.repeat(32)), /must not contain credentials/);
assert.throws(() => validateFeedbackConfig('https://relay.test/feedback?target=other', 'x'.repeat(32)), /must not contain credentials/);
assert.throws(() => validateFeedbackConfig('https://relay.test/feedback#fragment', 'x'.repeat(32)), /must not contain credentials/);
assert.throws(() => validateFeedbackConfig('https://relay.test/feedback', 'short'), /32-256 URL-safe/);
assert.throws(() => validateFeedbackConfig('https://relay.test/feedback', `${'x'.repeat(32)}\nINJECTED=yes`), /32-256 URL-safe/);
assert.throws(() => validateDiscordAppId("123'; throw new Error('injected')"), /numeric Discord/);

const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'neolib-release-config-'));
try {
  fs.mkdirSync(path.join(sandbox, 'electron'), { recursive: true });
  const relayUrl = 'https://relay.example.test/feedback';
  const relayKey = 'A_secure-url-safe_fixture_key_123456789';
  const discordAppId = '123456789012345678';
  const prepared = prepareReleaseConfig({
    appRoot: sandbox,
    env: {
      NEOLIB_FEEDBACK_RELAY_URL: relayUrl,
      NEOLIB_FEEDBACK_RELAY_KEY: relayKey,
      NEOLIB_DISCORD_APP_ID: discordAppId,
    },
  });
  assert.equal(prepared.feedbackRelayConfigured, true);
  assert.equal(prepared.discordRichPresenceConfigured, true);
  assert.equal(
    fs.readFileSync(path.join(sandbox, '.env'), 'utf8'),
    `VITE_FEEDBACK_RELAY_URL=${relayUrl}\nVITE_FEEDBACK_RELAY_KEY=${relayKey}\n`,
  );
  assert.equal(
    fs.readFileSync(path.join(sandbox, 'electron', 'discord-config.generated.js'), 'utf8'),
    `module.exports = { DISCORD_APP_ID: ${JSON.stringify(discordAppId)} };\n`,
  );
  const cleaned = cleanupReleaseConfig({ appRoot: sandbox });
  assert.equal(cleaned.removed, true);
  assert(!fs.existsSync(path.join(sandbox, '.env')), 'temporary renderer environment must be deleted after compilation');

  const withoutDiscord = prepareReleaseConfig({
    appRoot: sandbox,
    env: { NEOLIB_FEEDBACK_RELAY_URL: relayUrl, NEOLIB_FEEDBACK_RELAY_KEY: relayKey },
  });
  assert.equal(withoutDiscord.discordRichPresenceConfigured, false);
  assert(!fs.existsSync(path.join(sandbox, 'electron', 'discord-config.generated.js')), 'stale generated Discord config must be removed when disabled');
  console.log('PASS: release configuration rejects missing, malformed and injectable settings; writes exact feedback input and safely creates/removes optional Discord configuration. Temporary files only.');
} finally {
  fs.rmSync(sandbox, { recursive: true, force: true });
}
