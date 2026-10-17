// Explicit owner deployment acceptance: synthetic reports only; remove precisely
// this test identity afterward. Never use this against unapproved accounts.
import assert from 'node:assert/strict';
import { randomUUID, createHash } from 'node:crypto';
import { mkdtemp, writeFile, unlink, rmdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readCredential } from './credential-store.mjs';
import { USAGE_ORIGIN } from './service-config.mjs';

const token = readCredential('analytics-admin'), salt = readCredential('analytics-salt');
const id = randomUUID(), hash = createHash('sha256').update(`${salt}:installation:${id.toLowerCase()}`).digest('hex');
assert(/^[a-f0-9]{64}$/.test(hash));
const get = async authenticated => {
  const response = await fetch(`${USAGE_ORIGIN}/admin/summary`, { headers: authenticated ? { Authorization: `Bearer ${token}` } : {}, signal: AbortSignal.timeout(15000) });
  return { status: response.status, data: await response.json() };
};
const post = async value => fetch(`${USAGE_ORIGIN}/events`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value), signal: AbortSignal.timeout(15000) });
const initial = await get(true); assert.equal(initial.status, 200); assert.equal((await get(false)).status, 401);
const fixture = { schemaVersion: 1, consentVersion: 2, installationId: id, appVersion: '0.0.0', kind: 'first_open', day: new Date().toISOString().slice(0, 10) };
assert.equal((await post({ ...fixture, consentVersion: 0 })).status, 400);
assert.equal((await fetch(`${USAGE_ORIGIN}/events`, { method: 'OPTIONS' })).status, 204);
let outcome;
try {
  for (const kind of ['first_open', 'first_open', 'setup_complete', 'active_day', 'active_day']) assert.equal((await post({ ...fixture, kind })).status, 200);
  const after = await get(true); assert.equal(after.status, 200);
  assert.equal(after.data.totals.firstOpens, initial.data.totals.firstOpens + 1);
  assert.equal(after.data.totals.setups, initial.data.totals.setups + 1);
  assert.equal(after.data.active.today, initial.data.active.today + 1);
  assert(!JSON.stringify(after.data).includes(id)); assert(!JSON.stringify(after.data).includes(hash));
  const lookup = async authorized => fetch(`${USAGE_ORIGIN}/admin/privacy`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(authorized ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ installationId: id }), signal: AbortSignal.timeout(15000) });
  assert.equal((await lookup(false)).status, 401);
  const records = await (await lookup(true)).json();
  assert.equal(records.installation.consent_version, 2); assert.equal(records.activity.length, 1);
  const erase = await fetch(`${USAGE_ORIGIN}/withdraw`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ installationId: id }), signal: AbortSignal.timeout(15000) });
  assert.equal(erase.status, 200); assert.equal((await erase.json()).erased, true);
  assert.equal((await post({ ...fixture, kind: 'active_day' })).status, 200);
  const deleted = await (await lookup(true)).json();
  assert.equal(deleted.installation, null); assert.deepEqual(deleted.activity, []); assert(deleted.withdrawal?.expires_day);
  const erasedCounts = await get(true);
  assert.equal(erasedCounts.data.totals.firstOpens, initial.data.totals.firstOpens);
  assert.equal(erasedCounts.data.active.today, initial.data.active.today);
  outcome = 'PASS: deployed auth, consent v2 evidence, scoped private export, live withdrawal deletion, late-upload rejection and aggregate-only summaries.';
} finally {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'neolib-usage-live-'));
  const sqlFile = path.join(temporary, 'remove-synthetic-test.sql');
  await writeFile(sqlFile, `DELETE FROM active_days WHERE id='${hash}';\nDELETE FROM installs WHERE id='${hash}';\nDELETE FROM withdrawals WHERE id='${hash}';\n`, 'utf8');
  const command = `npx.cmd --yes wrangler@4 d1 execute neolib-optional-usage --remote --file '${sqlFile.replace(/'/g, "''")}'; exit $LASTEXITCODE`;
  const exitCode = await new Promise((resolve, reject) => {
    const child = spawn('powershell.exe', ['-NoProfile', '-Command', command], { cwd: fileURLToPath(new URL('../../desktop-app/cloudflare-relay/usage/', import.meta.url)), windowsHide: true, stdio: 'inherit' });
    child.on('error', reject); child.on('exit', resolve);
  });
  assert.equal(exitCode, 0, 'synthetic identity cleanup must succeed');
  await unlink(sqlFile); await rmdir(temporary);
}
const clean = await get(true);
assert.equal(clean.data.totals.firstOpens, initial.data.totals.firstOpens);
assert.equal(clean.data.totals.setups, initial.data.totals.setups);
assert.equal(clean.data.active.today, initial.data.active.today);
console.log(outcome); console.log('PASS: only synthetic test rows removed; baseline counts restored. No real client report sent.');
