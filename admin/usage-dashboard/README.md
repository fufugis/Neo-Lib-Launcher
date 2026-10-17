# NEO-LIB owner-only usage dashboard

This is a separate local admin tool, **not part of the customer installer**. It binds only to `127.0.0.1:4784`. The remote summary requires a private bearer credential; customers receive only the public events URL. Host/origin/session guards stop cross-site dashboard reads. Anyone already controlling your computer or running processes under your account is outside this local protection boundary.

The service is deployed at `https://neolib-optional-usage.kennethnordsveen.workers.dev`. On this Windows account, the admin credential and stable privacy salt are stored in Windows Credential Manager under **NEO-LIB optional usage**, not in this repository. From the repository root, start the connected interface with:

```powershell
node .\admin\usage-dashboard\start.mjs
```

Open `http://127.0.0.1:4784`. This owner-only launcher loads the token server-side; it is never placed in the page. The global `@napi-rs/keyring` dependency was installed for secure Cloudflare login and is reused here. Another Windows user/computer will need its own approved credential setup; credentials are not portable through Git.

For a disconnected UI preview without stored credentials, run `node .\admin\usage-dashboard\server.mjs`. It deliberately says **not connected**, not invented zero/sample counts.

## Deployment acceptance — 2026-10-12

- Separate Worker, D1 database and KV namespace deployed in the approved existing account, leaving the Discord feedback Worker unchanged. Daily retention cron enabled; ADMIN_TOKEN and PRIVACY_SALT are Worker secrets.
- Live synthetic first-open/setup/active-day events accepted and deduplicated; missing admin authentication rejected, consent-off rejected and CORS preflight verified. Only the synthetic identity's rows were deleted; baseline zero counts restored. No customer data sent.
- Local developer `.env.local` and future Windows workflow carry only the public events URL. Existing published installers are unchanged; future clients still require explicit opt-in. Do not mistake a deployed backend for a published app update.
- `verify-live.mjs` is an explicit owner-only live test with precise synthetic cleanup, **not** part of normal client builds/source tests. Never run it against a different/unapproved account. `verify-dashboard.mjs` checks a running dashboard's local guards and protected live proxy without recording events.

## Connect real data

1. Deploy the separate `desktop-app/cloudflare-relay/usage` Worker after signing into the intended Cloudflare account. Do not change the existing Discord feedback Worker.
2. For a new deployment, create a D1 database and KV namespace and apply schema.sql. The current wrangler.toml already contains the approved account/resource IDs; do not replace these with another account without review.
3. Set `ADMIN_TOKEN` and `PRIVACY_SALT` as **Worker secrets**, each independently generated with at least 32 random characters. Never put them in Git, `VITE_*`, client settings or the installer. Keep the salt stable: changing it changes reporting identities.
4. Configure `VITE_USAGE_ENDPOINT=https://YOUR-WORKER.workers.dev/events` in the renderer build environment. This URL is public, contains no token and is disabled when absent. Users must install a build containing this reader and explicitly opt in before any reports are sent.
5. On this computer, use start.mjs to read Windows Credential Manager. Manual server.mjs configuration can instead use private process environment values NEOLIB_USAGE_ORIGIN and NEOLIB_USAGE_ADMIN_TOKEN. The browser never receives the remote token. configure-worker-secrets.mjs creates missing Windows credentials and installs them as Worker secrets without printing them; it never rotates an existing salt.

For a hidden token prompt in PowerShell, instead of putting the secret in command history:

```powershell
$env:NEOLIB_USAGE_ORIGIN = Read-Host 'Usage Worker HTTPS origin'
$usageAdminSecure = Read-Host 'Admin token' -AsSecureString
$usageAdminPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($usageAdminSecure)
try {
  $env:NEOLIB_USAGE_ADMIN_TOKEN = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($usageAdminPointer)
  node .\admin\usage-dashboard\server.mjs
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($usageAdminPointer)
  Remove-Item Env:\NEOLIB_USAGE_ADMIN_TOKEN -ErrorAction SilentlyContinue
}
```

## What it measures

- First observed opt-in report per random installation ID, not installer completion or a unique person. Portable copies and reinstalls/settings resets can affect identities.
- Welcome/setup milestones and meaningful active days: at least two minutes of foreground time with recent click/key/wheel/controller interaction. Background-only uptime does not qualify.
- Daily/7-day/30-day unique reporting IDs, app versions, exact day-7 return for eligible recent cohorts, daily first-open/active trends, and a downloadable aggregate snapshot.
- Only opted-in online clients report. The collector cannot certify humans or attribute reports to ad campaigns. Public requests can be forged; deduplication and best-effort KV rate limits are cost/noise controls, not strong client authentication.

No game names, library data, username, hardware identifiers, input contents or admin credentials are sent. Server storage hashes the random installation ID with a private salt; it is pseudonymous, **not anonymous**. Connections expose source IPs to the infrastructure; the Worker stores only a salted hourly rate-limit bucket with one-hour TTL, not a raw IP field. Provider infrastructure logging is separate and must be reviewed before production collection.

Daily cleanup removes activity older than 90 days and installation/cohort rows older than 365 days. Version-2 opt-in is off by default and affirms age 16+. Turning it off stops uploads, clears usage events and requests exact-ID server deletion; offline erasure retains only the UUID until retry succeeds. A 35-day hashed anti-replay marker prevents late uploads resurrecting rows. D1 recovery expiry (up to 30 days, seven on Free) is disclosed; never restore deleted records into analytics. Persisted Worker logs are explicitly disabled; provider security metadata remains subject to its policies. The owner confirmed the controller name/contact and Cloudflare terms. See docs/USAGE_PROCESSING_RECORD.md and docs/USAGE_PRIVACY_OPERATOR.md for provider/transfer screening and request/incident procedures. Actual packaged UI acceptance remains open. Never quietly enable reporting for existing users.

Owner-only requests: from repository root run node admin/usage-dashboard/privacy-request.mjs export or erase. Exports require the stored admin credential and go to ignored private/ files; deletion prompts for explicit confirmation and uses only the supplied UUID. Do not commit or distribute request data.

Tests: `npm.cmd run test:first-run-usage` from desktop-app uses a temporary localhost server and actual in-memory SQLite, never a real collector or customer data. Deployment, account authorization, packaged Windows installation and live first-run acceptance remain separate.
