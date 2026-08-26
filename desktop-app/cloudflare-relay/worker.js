/**
 * NEO-LIB Feedback Relay — Cloudflare Worker.
 *
 * Forwards signed feedback/bug/suggestion/rate-reaction payloads from the
 * NEO-LIB app to a FIXED Discord webhook, without the app ever holding that
 * webhook URL. Even if someone decompiles the shipped .exe, the worst they
 * get is this relay's URL + a shared signing key — not a direct posting
 * credential to the Discord channel, and this Worker rate-limits + reshapes
 * every payload before it ever reaches Discord.
 *
 * Required secrets (set via `wrangler secret put <name>`):
 *   DISCORD_WEBHOOK_URL  — the real Discord webhook URL (never in the repo).
 *   RELAY_SHARED_KEY     — random string, shared with the app's
 *                          VITE_FEEDBACK_RELAY_KEY build-time env var.
 * Required binding (see wrangler.toml): RATE_LIMIT_KV (a KV namespace).
 */

const MAX_BODY_BYTES = 8000;
const REPLAY_WINDOW_SEC = 300; // signed requests older/newer than this are rejected
const RATE_LIMIT_PER_HOUR = 8; // per source IP

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }
    const url = new URL(request.url);
    if (url.pathname !== '/feedback') {
      return new Response('Not found', { status: 404 });
    }

    const rawBody = await request.text();
    if (rawBody.length > MAX_BODY_BYTES) {
      return new Response('Payload too large', { status: 413 });
    }

    const signature = request.headers.get('X-Relay-Signature') || '';
    const timestamp = request.headers.get('X-Relay-Timestamp') || '';
    if (!signature || !timestamp) {
      return new Response('Missing signature', { status: 401 });
    }

    const now = Math.floor(Date.now() / 1000);
    const ts = parseInt(timestamp, 10);
    if (!Number.isFinite(ts) || Math.abs(now - ts) > REPLAY_WINDOW_SEC) {
      return new Response('Stale or invalid timestamp', { status: 401 });
    }

    const validSig = await verifySignature(env.RELAY_SHARED_KEY, timestamp, rawBody, signature);
    if (!validSig) {
      return new Response('Bad signature', { status: 401 });
    }

    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const allowed = await checkRateLimit(env, ip);
    if (!allowed) {
      return new Response('Rate limit exceeded, try again later.', { status: 429 });
    }

    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new Response('Invalid JSON', { status: 400 });
    }

    // Re-shape server-side — a validly-signed-but-malicious client can only
    // ever produce ONE capped embed forwarded to OUR fixed webhook.
    const embed = (payload.embeds && payload.embeds[0]) || {};
    const safePayload = {
      username: 'NEO-LIB in-app',
      embeds: [
        {
          title: String(embed.title || '').slice(0, 250),
          description: String(embed.description || '').slice(0, 3500),
          color: Number.isInteger(embed.color) ? embed.color : 0xff2a8a,
          fields: Array.isArray(embed.fields)
            ? embed.fields.slice(0, 5).map((f) => ({
                name: String(f?.name || '').slice(0, 60),
                value: String(f?.value || '').slice(0, 200),
                inline: !!f?.inline,
              }))
            : [],
          footer: embed.footer ? { text: String(embed.footer.text || '').slice(0, 200) } : undefined,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const discordRes = await fetch(env.DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(safePayload),
    });

    return new Response(null, { status: discordRes.status === 204 ? 204 : discordRes.status });
  },
};

async function verifySignature(secret, timestamp, rawBody, signature) {
  if (!secret) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`${timestamp}.${rawBody}`));
  const expectedHex = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return timingSafeEqualHex(expectedHex, signature);
}

function timingSafeEqualHex(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function checkRateLimit(env, ip) {
  const key = `rl:${ip}`;
  const current = await env.RATE_LIMIT_KV.get(key);
  const count = current ? parseInt(current, 10) : 0;
  if (count >= RATE_LIMIT_PER_HOUR) return false;
  await env.RATE_LIMIT_KV.put(key, String(count + 1), { expirationTtl: 3600 });
  return true;
}
