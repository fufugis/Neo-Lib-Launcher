import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { pathToFileURL } from 'node:url';

export function createAdminServer({ origin = process.env.NEOLIB_USAGE_ORIGIN || '', token = process.env.NEOLIB_USAGE_ADMIN_TOKEN || '', fetchImpl = fetch } = {}) {
  const nonce = randomBytes(24).toString('hex');
  return http.createServer(async (request, response) => {
    const host = request.headers.host || '';
    const localHost = /^(127\.0\.0\.1|localhost):\d+$/.test(host);
    const base = `http://${host}`;
    const site = request.headers['sec-fetch-site'];
    const allowed = localHost && (!site || site === 'same-origin' || site === 'none') && (!request.headers.origin || request.headers.origin === base);
    const send = (status, body, type = 'application/json') => { response.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'", 'Referrer-Policy': 'no-referrer' }); response.end(body); };
    if (!allowed || request.method !== 'GET') return send(403, JSON.stringify({ error: 'Local admin access only' }));
    const pathname = new URL(request.url, base).pathname;
    if (pathname === '/api/metrics') {
      if (request.headers['x-local-session'] !== nonce) return send(403, JSON.stringify({ error: 'Open the dashboard first' }));
      let remote;
      try { remote = new URL(origin); if (remote.protocol !== 'https:' || remote.username || remote.password || remote.search || remote.hash || token.length < 32) throw new Error(); remote.pathname = '/admin/summary'; }
      catch { return send(503, JSON.stringify({ error: 'Not connected yet. Configure NEOLIB_USAGE_ORIGIN and NEOLIB_USAGE_ADMIN_TOKEN on this computer. No sample counts are shown.' })); }
      try {
        const result = await fetchImpl(remote.href, { headers: { Authorization: `Bearer ${token}` }, redirect: 'error', signal: AbortSignal.timeout(8000) });
        if (!result.ok) return send(502, JSON.stringify({ error: `Analytics service returned ${result.status}. Check deployment and admin credentials.` }));
        const data = await result.text(); if (Buffer.byteLength(data) > 65536) throw new Error();
        JSON.parse(data); return send(200, data);
      } catch { return send(502, JSON.stringify({ error: 'Could not reach the analytics service. Counts are unavailable, not zero.' })); }
    }
    const file = { '/': 'index.html', '/dashboard.js': 'dashboard.js', '/dashboard.css': 'dashboard.css' }[pathname];
    if (!file) return send(404, 'Not found', 'text/plain');
    try { let content = await readFile(new URL(file, import.meta.url), 'utf8'); if (file === 'index.html') content = content.replace('__LOCAL_SESSION__', nonce); send(200, content, file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html'); }
    catch { send(500, 'Dashboard unavailable', 'text/plain'); }
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = createAdminServer();
  server.listen(4784, '127.0.0.1', () => console.log('NEO-LIB private usage dashboard: http://127.0.0.1:4784 (local computer only)'));
}
