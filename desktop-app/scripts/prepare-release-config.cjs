const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function validateFeedbackConfig(relayUrlValue, relayKeyValue) {
  const relayUrl = String(relayUrlValue || '').trim();
  const relayKey = String(relayKeyValue || '').trim();
  assert(relayUrl, 'Required release setting NEOLIB_FEEDBACK_RELAY_URL is missing');
  assert(relayKey, 'Required release setting NEOLIB_FEEDBACK_RELAY_KEY is missing');
  let parsed;
  try {
    parsed = new URL(relayUrl);
  } catch {
    throw new Error('NEOLIB_FEEDBACK_RELAY_URL must be an absolute HTTPS URL ending in /feedback');
  }
  assert.equal(parsed.protocol, 'https:', 'NEOLIB_FEEDBACK_RELAY_URL must use HTTPS');
  assert(/\/feedback\/?$/.test(parsed.pathname), 'NEOLIB_FEEDBACK_RELAY_URL must end in /feedback');
  assert(!parsed.username && !parsed.password && !parsed.search && !parsed.hash, 'NEOLIB_FEEDBACK_RELAY_URL must not contain credentials, a query or a fragment');
  assert(/^[A-Za-z0-9_-]{32,256}$/.test(relayKey), 'NEOLIB_FEEDBACK_RELAY_KEY must be 32-256 URL-safe characters');
  return { relayUrl, relayKey };
}

function validateDiscordAppId(value) {
  const discordAppId = String(value || '').trim();
  if (!discordAppId) return '';
  assert(/^\d{10,30}$/.test(discordAppId), 'NEOLIB_DISCORD_APP_ID must contain only the numeric Discord application ID');
  return discordAppId;
}

function cleanupReleaseConfig({ appRoot } = {}) {
  assert(appRoot, 'appRoot is required');
  const envPath = path.join(appRoot, '.env');
  if (fs.existsSync(envPath)) fs.rmSync(envPath, { force: true });
  return Object.freeze({ envPath, removed: !fs.existsSync(envPath) });
}

function prepareReleaseConfig({ appRoot, env = process.env } = {}) {
  assert(appRoot, 'appRoot is required');
  const { relayUrl, relayKey } = validateFeedbackConfig(env.NEOLIB_FEEDBACK_RELAY_URL, env.NEOLIB_FEEDBACK_RELAY_KEY);
  const discordAppId = validateDiscordAppId(env.NEOLIB_DISCORD_APP_ID);
  const envPath = path.join(appRoot, '.env');
  const generatedDiscordPath = path.join(appRoot, 'electron', 'discord-config.generated.js');

  fs.writeFileSync(envPath, `VITE_FEEDBACK_RELAY_URL=${relayUrl}\nVITE_FEEDBACK_RELAY_KEY=${relayKey}\n`, 'utf8');
  if (discordAppId) {
    fs.writeFileSync(generatedDiscordPath, `module.exports = { DISCORD_APP_ID: ${JSON.stringify(discordAppId)} };\n`, 'utf8');
  } else if (fs.existsSync(generatedDiscordPath)) {
    fs.rmSync(generatedDiscordPath, { force: true });
  }

  return Object.freeze({
    envPath,
    generatedDiscordPath: discordAppId ? generatedDiscordPath : '',
    feedbackRelayConfigured: true,
    discordRichPresenceConfigured: Boolean(discordAppId),
  });
}

if (require.main === module) {
  try {
    const result = prepareReleaseConfig({ appRoot: path.resolve(__dirname, '..') });
    console.log(`Release configuration prepared: feedback=yes, Discord=${result.discordRichPresenceConfigured ? 'yes' : 'no'}.`);
  } catch (error) {
    console.error(`RELEASE CONFIGURATION REJECTED: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { cleanupReleaseConfig, prepareReleaseConfig, validateDiscordAppId, validateFeedbackConfig };
