const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { webcrypto } = require('node:crypto');

if (!globalThis.crypto) Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });

async function loadWorker() {
  const source = fs.readFileSync(path.resolve(__dirname, '..', 'cloudflare-relay', 'worker.js'), 'utf8');
  const url = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
  return (await import(url)).default;
}

async function signature(secret, timestamp, body) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const bytes = await crypto.subtle.sign('HMAC', key, encoder.encode(`${timestamp}.${body}`));
  return [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function fakeKv() {
  const values = new Map();
  return {
    async get(key) { return values.get(key) || null; },
    async put(key, value) { values.set(key, value); },
  };
}

function requestFor(body, timestamp, signed, ip = '203.0.113.10') {
  return new Request('https://relay.example.test/feedback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'CF-Connecting-IP': ip,
      'X-Relay-Timestamp': timestamp,
      'X-Relay-Signature': signed,
    },
    body,
  });
}

(async () => {
  const worker = await loadWorker();
  const originalFetch = global.fetch;
  const forwarded = [];
  const fakeDiscordFetch = async (url, options) => {
    forwarded.push({ url, options, payload: JSON.parse(options.body) });
    return new Response(null, { status: 204 });
  };
  global.fetch = fakeDiscordFetch;
  try {
    const secret = 'fixture-worker-shared-key-32-characters';
    const env = { RELAY_SHARED_KEY: secret, DISCORD_WEBHOOK_URL: 'https://discord.invalid/webhook', RATE_LIMIT_KV: fakeKv() };
    const preflight = await worker.fetch(new Request('https://relay.example.test/feedback', { method: 'OPTIONS' }), env);
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get('Access-Control-Allow-Origin'), '*');

    const wrongMethod = await worker.fetch(new Request('https://relay.example.test/feedback'), env);
    assert.equal(wrongMethod.status, 405);
    const wrongPath = await worker.fetch(new Request('https://relay.example.test/other', { method: 'POST', body: '{}' }), env);
    assert.equal(wrongPath.status, 404);
    const unavailable = await worker.fetch(new Request('https://relay.example.test/feedback', { method: 'POST', body: '{}' }), {});
    assert.equal(unavailable.status, 503);
    assert.equal(unavailable.headers.get('Access-Control-Allow-Origin'), '*');

    const timestamp = String(Math.floor(Date.now() / 1000));
    const body = JSON.stringify({
      username: 'attacker-controlled',
      embeds: [{
        title: 'T'.repeat(400),
        description: 'D'.repeat(4000),
        color: 123,
        fields: Array.from({ length: 8 }, (_, index) => ({ name: `field-${index}`, value: 'V'.repeat(300), inline: true })),
        footer: { text: 'F'.repeat(300) },
      }],
    });
    const signed = await signature(secret, timestamp, body);
    const accepted = await worker.fetch(requestFor(body, timestamp, signed), env);
    assert.equal(accepted.status, 204);
    assert.equal(forwarded.length, 1);
    assert.equal(forwarded[0].url, env.DISCORD_WEBHOOK_URL);
    assert.equal(forwarded[0].payload.username, 'NEO-LIB in-app');
    assert.deepEqual(forwarded[0].payload.allowed_mentions, { parse: [] });
    assert.equal(forwarded[0].payload.embeds.length, 1);
    assert.equal(forwarded[0].payload.embeds[0].title.length, 250);
    assert.equal(forwarded[0].payload.embeds[0].description.length, 3500);
    assert.equal(forwarded[0].payload.embeds[0].fields.length, 5);
    assert.equal(forwarded[0].payload.embeds[0].fields[0].value.length, 200);

    const badSignature = await worker.fetch(requestFor('{}', timestamp, '00'.repeat(32), '203.0.113.11'), env);
    assert.equal(badSignature.status, 401);
    const staleTimestamp = String(Number(timestamp) - 301);
    const stale = await worker.fetch(requestFor('{}', staleTimestamp, await signature(secret, staleTimestamp, '{}'), '203.0.113.12'), env);
    assert.equal(stale.status, 401);
    const oversizedBody = 'x'.repeat(8001);
    const oversized = await worker.fetch(requestFor(oversizedBody, timestamp, await signature(secret, timestamp, oversizedBody), '203.0.113.13'), env);
    assert.equal(oversized.status, 413);
    const oversizedUnicodeBody = '🎮'.repeat(3000);
    const oversizedUnicode = await worker.fetch(requestFor(oversizedUnicodeBody, timestamp, await signature(secret, timestamp, oversizedUnicodeBody), '203.0.113.14'), env);
    assert.equal(oversizedUnicode.status, 413, 'body limit must count UTF-8 bytes rather than JavaScript characters');

    const brokenKvEnv = { ...env, RATE_LIMIT_KV: { async get() { throw new Error('fixture KV failure'); } } };
    const kvUnavailable = await worker.fetch(requestFor('{}', timestamp, await signature(secret, timestamp, '{}'), '203.0.113.15'), brokenKvEnv);
    assert.equal(kvUnavailable.status, 503);
    global.fetch = async () => { throw new Error('fixture Discord failure'); };
    const forwardingUnavailable = await worker.fetch(requestFor('{}', timestamp, await signature(secret, timestamp, '{}'), '203.0.113.16'), { ...env, RATE_LIMIT_KV: fakeKv() });
    assert.equal(forwardingUnavailable.status, 502);
    global.fetch = fakeDiscordFetch;

    const rateEnv = { ...env, RATE_LIMIT_KV: fakeKv() };
    const smallBody = JSON.stringify({ embeds: [{ title: 'rate', description: 'fixture' }] });
    const smallSignature = await signature(secret, timestamp, smallBody);
    for (let index = 0; index < 8; index += 1) {
      const response = await worker.fetch(requestFor(smallBody, timestamp, smallSignature, '203.0.113.20'), rateEnv);
      assert.equal(response.status, 204, `rate-limit request ${index + 1} should be accepted`);
    }
    const limited = await worker.fetch(requestFor(smallBody, timestamp, smallSignature, '203.0.113.20'), rateEnv);
    assert.equal(limited.status, 429);
    assert.equal(forwarded.length, 9, 'only accepted requests may reach Discord');
    console.log('PASS: feedback relay handles CORS, HMAC, replay/body limits, per-IP rate limiting and fixed capped Discord payloads. Fake Worker bindings and fetch only; no network request ran.');
  } finally {
    global.fetch = originalFetch;
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
