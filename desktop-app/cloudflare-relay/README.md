# NEO-LIB Feedback Relay (Cloudflare Worker)

Why this exists: the app used to POST feedback straight to a Discord webhook
baked into the source. Scanner bots found that URL twice and spammed the
channel. This Worker sits in between — the app only ever knows the Worker's
URL + a shared signing key. The real Discord webhook lives ONLY as a
Cloudflare secret, never in the repo, never in the shipped `.exe`.

## One-time setup (your own free Cloudflare account)

1. `npm install -g wrangler`
2. `wrangler login`
3. From this folder (`desktop-app/cloudflare-relay/`):
   ```
   wrangler kv namespace create RATE_LIMIT_KV
   ```
   Copy the `id` it prints into `wrangler.toml` → `kv_namespaces[0].id`.
4. Set the two secrets (never committed anywhere):
   ```
   wrangler secret put DISCORD_WEBHOOK_URL
   # paste your real Discord webhook URL when prompted

   wrangler secret put RELAY_SHARED_KEY
   # paste a random 32+ char string, e.g. output of: openssl rand -hex 32
   ```
5. Deploy:
   ```
   wrangler deploy
   ```
   You'll get a URL like `https://neo-lib-feedback-relay.<your-subdomain>.workers.dev`.

## Wiring it into the app

Add to `desktop-app/.env` (local dev) — full path INCLUDING `/feedback`:
```
VITE_FEEDBACK_RELAY_URL=https://neo-lib-feedback-relay.<your-subdomain>.workers.dev/feedback
VITE_FEEDBACK_RELAY_KEY=<the same random string you used for RELAY_SHARED_KEY>
```

For CI-built `.exe` releases, add two GitHub Actions repo secrets with the
same values:
- `NEOLIB_FEEDBACK_RELAY_URL`
- `NEOLIB_FEEDBACK_RELAY_KEY`

`.github/workflows/build-windows.yml` writes them into `desktop-app/.env`
right before the Vite renderer build step, so every CI-built binary gets a
working (but never-exposed) feedback endpoint.

## Rotating after abuse

If the relay itself ever gets spammed (someone extracted the relay URL +
key from a shipped .exe):
1. `wrangler secret put RELAY_SHARED_KEY` again with a new random value.
2. Update `VITE_FEEDBACK_RELAY_KEY` in your local `.env` and the
   `NEOLIB_FEEDBACK_RELAY_KEY` GitHub secret to match.
3. Ship a new build. The Discord webhook itself never has to change.

## Built-in protections

- HMAC-SHA256 request signing (5-minute replay window).
- Rate limit: 8 requests/hour per source IP (Workers KV).
- Server-side payload reshaping — capped field lengths, fixed username,
  exactly one embed — so even a validly-signed request can't abuse Discord's
  formatting or flood a message with junk fields.
