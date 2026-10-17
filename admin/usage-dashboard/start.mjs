import { createAdminServer } from './server.mjs';
import { readCredential } from './credential-store.mjs';
import { USAGE_ORIGIN } from './service-config.mjs';

try {
  const server = createAdminServer({ origin: USAGE_ORIGIN, token: readCredential('analytics-admin') });
  server.on('error', () => { console.error('Dashboard could not start. Port 4784 may already be in use.'); process.exitCode = 1; });
  server.listen(4784, '127.0.0.1', () => console.log('NEO-LIB owner dashboard connected: http://127.0.0.1:4784 — localhost only; credential remains private.'));
} catch { console.error('Dashboard credential unavailable. Use the Windows account that configured the analytics service.'); process.exitCode = 1; }
