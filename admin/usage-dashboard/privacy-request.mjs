// Owner-only helper. Never included in renderer/installer resources.
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { readCredential } from './credential-store.mjs';
import { USAGE_ORIGIN } from './service-config.mjs';

const prompt = createInterface({ input: stdin, output: stdout });
try {
  const action = process.argv[2];
  if (!['export', 'erase'].includes(action)) throw Error('Choose export or erase.');
  const installationId = (await prompt.question('Reporting ID supplied by the requester (not their email): ')).trim();
  if (!/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(installationId)) throw Error('Invalid reporting ID.');
  if (action === 'erase' && (await prompt.question('Delete only this reporting identity? Type DELETE: ')) !== 'DELETE') throw Error('Cancelled.');
  const response = await fetch(`${USAGE_ORIGIN}/${action === 'export' ? 'admin/privacy' : 'withdraw'}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(action === 'export' ? { Authorization: `Bearer ${readCredential('analytics-admin')}` } : {}) },
    body: JSON.stringify({ installationId }), signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw Error('The privacy request failed; no success is assumed.');
  const data = await response.json();
  if (action === 'erase') {
    if (data.erased !== true) throw Error('Deletion was not confirmed.');
    console.log('Live usage records deleted; temporary anti-replay marker and provider backup expiry still apply.');
  } else {
    const directory = new URL('./private/', import.meta.url);
    await mkdir(directory, { recursive: true });
    const file = new URL(`privacy-export-${randomUUID()}.json`, directory);
    await writeFile(file, JSON.stringify({ exportedAt: new Date().toISOString(), ...data }, null, 2), { flag: 'wx', mode: 0o600 });
    console.log('Scoped export saved in admin/usage-dashboard/private. It contains no other installation records. Remove after securely fulfilling the request.');
  }
} finally { prompt.close(); }
