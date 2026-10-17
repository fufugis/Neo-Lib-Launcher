// Owner-only deployment helper. No credential is printed, passed in argv or written to Git.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createCredential } from './credential-store.mjs';

const secrets = { ADMIN_TOKEN: createCredential('analytics-admin'), PRIVACY_SALT: createCredential('analytics-salt') };
const child = spawn('npx.cmd', ['--yes', 'wrangler@4', 'secret', 'bulk'], {
  cwd: fileURLToPath(new URL('../../desktop-app/cloudflare-relay/usage/', import.meta.url)),
  shell: true, windowsHide: true, stdio: ['pipe', 'inherit', 'inherit'],
});
child.stdin.end(JSON.stringify(secrets));
child.on('error', () => { console.error('Cloudflare secret configuration could not start. Credentials remain in Windows Credential Manager.'); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code || 0; });
