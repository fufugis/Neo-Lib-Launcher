const assert = require('node:assert/strict');
const { createSteamAchievementService } = require('../electron/providers/steam-achievement-service.cjs');

async function main() {
  const calls = [];
  const service = createSteamAchievementService({ fetchImpl: async (url, options) => {
    calls.push({ url, options });
    return { ok: true, headers: { get: () => null }, text: async () => JSON.stringify({ playerstats: {
      steamID: '76561197960278073', success: true, achievements: [
        { apiname: 'A', achieved: 1 }, { apiname: 'B', achieved: 0 },
      ],
    } }) };
  } });
  const request = { apiKey: 'a'.repeat(32), appid: '620', steamid3: '12345' };
  const result = await service.sync(request);
  assert.equal(result.ok, true);
  assert.equal(result.earned, 1);
  assert.equal(result.total, 2);
  assert.equal(result.steamid64, '76561197960278073');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url.hostname, 'partner.steam-api.com');
  assert.equal(calls[0].url.searchParams.has('key'), false, 'key must not appear in URL');
  assert.equal(calls[0].options.headers['x-webapi-key'], request.apiKey);
  assert.equal((await service.sync({ ...request, steamid3: 'bad' })).ok, false);
  assert.equal(calls.length, 1, 'invalid identity must not reach network');
  const wrongAccount = createSteamAchievementService({ fetchImpl: async () => ({ ok: true, headers: { get: () => null }, text: async () => JSON.stringify({ playerstats: { steamID: 'other', success: true, achievements: [] } }) }) });
  assert.equal((await wrongAccount.sync(request)).ok, false, 'another account must not produce progress');
  const privateAccount = createSteamAchievementService({ fetchImpl: async () => ({ ok: false, status: 403 }) });
  assert.equal((await privateAccount.sync(request)).ok, false);
  console.log('PASS: opt-in Steam achievements require player identity, preserve key privacy, and reject unrelated or inaccessible progress. Fixtures only.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
