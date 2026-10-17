const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
const reply = (status, data) => new Response(JSON.stringify(data), { status, headers });
const dayAt = timestamp => new Date(timestamp).toISOString().slice(0, 10);
export function validateEvent(value, now = Date.now()) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).sort().join(',') !== 'appVersion,consentVersion,day,installationId,kind,schemaVersion') return null;
  if (value.schemaVersion !== 1 || value.consentVersion !== 2 || !['first_open', 'setup_complete', 'active_day'].includes(value.kind)) return null;
  if (!/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(value.installationId) || !/^\d+\.\d+\.\d+$/.test(value.appVersion) || value.appVersion.length > 32 || !/^\d{4}-\d{2}-\d{2}$/.test(value.day)) return null;
  const at = Date.parse(`${value.day}T00:00:00Z`);
  if (!Number.isFinite(at) || dayAt(at) !== value.day || value.day > dayAt(now) || at < now - 8 * 86400000) return null;
  return { ...value };
}
export async function digest(value) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))].map(byte => byte.toString(16).padStart(2, '0')).join('');
}
export async function authorizedAdmin(request, secret) {
  if (typeof secret !== 'string' || secret.length < 32) return false;
  const token = request.headers.get('Authorization') || '';
  if (token.length > 512) return false;
  const expected = await digest(`Bearer ${secret}`); const actual = await digest(token);
  let difference = 0; for (let index = 0; index < expected.length; index++) difference |= expected.charCodeAt(index) ^ actual.charCodeAt(index);
  return difference === 0;
}
async function readBounded(request) {
  if (!request.body || !request.headers.get('Content-Type')?.startsWith('application/json')) throw new Error('body');
  const reader = request.body.getReader(); let bytes = 0; const parts = [];
  try { while (true) { const { done, value } = await reader.read(); if (done) break; bytes += value.byteLength; if (bytes > 2048) { await reader.cancel(); throw new Error('body'); } parts.push(value); } }
  finally { reader.releaseLock(); }
  const data = new Uint8Array(bytes); let offset = 0; for (const part of parts) { data.set(part, offset); offset += part.length; }
  return JSON.parse(new TextDecoder().decode(data));
}
export async function collectEvent(db, value, salt) {
  const id = await digest(`${salt}:installation:${value.installationId.toLowerCase()}`);
  const commands = [db.prepare('INSERT OR IGNORE INTO installs (id,first_day,first_version,consent_version) SELECT ?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM withdrawals WHERE id=?)').bind(id, value.day, value.appVersion, value.consentVersion, id)];
  if (value.kind === 'setup_complete') commands.push(db.prepare('UPDATE installs SET setup_day=COALESCE(setup_day,?) WHERE id=?').bind(value.day, id));
  if (value.kind === 'active_day') commands.push(db.prepare('INSERT OR IGNORE INTO active_days (id,day,version) SELECT ?,?,? WHERE EXISTS (SELECT 1 FROM installs WHERE id=?) AND NOT EXISTS (SELECT 1 FROM withdrawals WHERE id=?)').bind(id, value.day, value.appVersion, id, id));
  await db.batch(commands);
}
export async function usageSummary(db, now = Date.now()) {
  const today = dayAt(now), since = dayAt(now - 29 * 86400000), week = dayAt(now - 6 * 86400000), eligible = dayAt(now - 7 * 86400000);
  const [totals, activeToday, activeWeek, activeMonth, days, starts, versions, returning] = await Promise.all([
    db.prepare('SELECT COUNT(*) AS firstOpens, COUNT(setup_day) AS setups FROM installs').first(),
    db.prepare('SELECT COUNT(DISTINCT id) AS value FROM active_days WHERE day=?').bind(today).first(),
    db.prepare('SELECT COUNT(DISTINCT id) AS value FROM active_days WHERE day>=?').bind(week).first(),
    db.prepare('SELECT COUNT(DISTINCT id) AS value FROM active_days WHERE day>=?').bind(since).first(),
    db.prepare('SELECT day,COUNT(*) AS active FROM active_days WHERE day>=? GROUP BY day ORDER BY day').bind(since).all(),
    db.prepare('SELECT first_day AS day,COUNT(*) AS opens FROM installs WHERE first_day>=? GROUP BY first_day ORDER BY first_day').bind(since).all(),
    db.prepare('SELECT first_version AS version,COUNT(*) AS opens FROM installs GROUP BY first_version ORDER BY opens DESC LIMIT 20').all(),
    db.prepare("SELECT COUNT(*) AS eligible, COALESCE(SUM(EXISTS(SELECT 1 FROM active_days a WHERE a.id=i.id AND a.day=date(i.first_day,'+7 days'))),0) AS returned FROM installs i WHERE first_day<=? AND first_day>=?").bind(eligible, since).first(),
  ]);
  return { asOf: new Date(now).toISOString(), totals, active: { today: activeToday?.value || 0, week: activeWeek?.value || 0, month: activeMonth?.value || 0 }, days: days.results || [], starts: starts.results || [], versions: versions.results || [], returning };
}
export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if ((path === '/events' || path === '/withdraw') && request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (path !== '/events' && path !== '/withdraw' && path !== '/admin/summary' && path !== '/admin/privacy') return reply(404, { error: 'Not found' });
    if (!env.USAGE_DB || !env.RATE_LIMIT || typeof env.PRIVACY_SALT !== 'string' || env.PRIVACY_SALT.length < 32) return reply(503, { error: 'Service not configured' });
    if (path === '/admin/summary' || path === '/admin/privacy') {
      if (request.method !== (path === '/admin/summary' ? 'GET' : 'POST')) return reply(405, { error: 'Method not allowed' });
      if (!await authorizedAdmin(request, env.ADMIN_TOKEN)) return reply(401, { error: 'Unauthorized' });
      if (path === '/admin/privacy') {
        try {
          const body = await readBounded(request);
          if (!body || Object.keys(body).join(',') !== 'installationId' || typeof body.installationId !== 'string' || !/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(body.installationId)) return reply(400, { error: 'Invalid request' });
          const id = await digest(`${env.PRIVACY_SALT}:installation:${body.installationId.toLowerCase()}`);
          const [installation, activity, withdrawal] = await Promise.all([
            env.USAGE_DB.prepare('SELECT first_day,first_version,setup_day,consent_version FROM installs WHERE id=?').bind(id).first(),
            env.USAGE_DB.prepare('SELECT day,version FROM active_days WHERE id=? ORDER BY day').bind(id).all(),
            env.USAGE_DB.prepare('SELECT expires_day FROM withdrawals WHERE id=?').bind(id).first(),
          ]);
          return reply(200, { installation, activity: activity.results || [], withdrawal });
        } catch { return reply(400, { error: 'Privacy lookup unavailable' }); }
      }
      try { return reply(200, await usageSummary(env.USAGE_DB)); } catch { return reply(503, { error: 'Metrics unavailable' }); }
    }
    if (request.method !== 'POST') return reply(405, { error: 'Method not allowed' });
    const address = request.headers.get('CF-Connecting-IP') || 'unknown';
    const bucket = await digest(`${env.PRIVACY_SALT}:rate:${address}:${Math.floor(Date.now() / 3600000)}`);
    try {
      const count = Number(await env.RATE_LIMIT.get(bucket)) || 0;
      if (count >= 120) return reply(429, { error: 'Rate limited' });
      await env.RATE_LIMIT.put(bucket, String(count + 1), { expirationTtl: 3600 });
      const body = await readBounded(request);
      if (path === '/withdraw') {
        if (!body || Object.keys(body).join(',') !== 'installationId' || typeof body.installationId !== 'string' || !/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(body.installationId)) return reply(400, { error: 'Invalid request' });
        const id = await digest(`${env.PRIVACY_SALT}:installation:${body.installationId.toLowerCase()}`);
        await env.USAGE_DB.batch([
          env.USAGE_DB.prepare("INSERT OR REPLACE INTO withdrawals (id,expires_day) VALUES (?,date('now','+35 days'))").bind(id),
          env.USAGE_DB.prepare('DELETE FROM active_days WHERE id=?').bind(id),
          env.USAGE_DB.prepare('DELETE FROM installs WHERE id=?').bind(id),
        ]);
        return reply(200, { erased: true });
      }
      const value = validateEvent(body);
      if (!value) return reply(400, { error: 'Invalid event' });
      await collectEvent(env.USAGE_DB, value, env.PRIVACY_SALT); return reply(200, { ok: true });
    } catch { return reply(400, { error: 'Event not accepted' }); }
  },
  async scheduled(_event, env) {
    await env.USAGE_DB.batch([
      env.USAGE_DB.prepare("DELETE FROM active_days WHERE day<date('now','-90 days')"),
      env.USAGE_DB.prepare("DELETE FROM active_days WHERE id IN (SELECT id FROM installs WHERE first_day<date('now','-365 days'))"),
      env.USAGE_DB.prepare("DELETE FROM installs WHERE first_day<date('now','-365 days')"),
      env.USAGE_DB.prepare("DELETE FROM withdrawals WHERE expires_day<date('now')"),
    ]);
  },
};
