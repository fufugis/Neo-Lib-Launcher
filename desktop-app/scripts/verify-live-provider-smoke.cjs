// Explicit manual acceptance check. Unlike the default regression gate, this
// command performs bounded public GET requests and never reads or writes user data.
const assert = require('node:assert/strict');
const http = require('node:http');
const https = require('node:https');
const { createStoreProviderService } = require('../electron/providers/store-provider-service.cjs');
const { createPublicWebProviderService } = require('../electron/providers/public-web-provider-service.cjs');
const { createSpecialistMetadataProviderService } = require('../electron/providers/specialist-metadata-provider-service.cjs');
const { createSteamNewsProviderService } = require('../electron/providers/steam-news-provider-service.cjs');
const { createDealsProviderService } = require('../electron/providers/deals-provider-service.cjs');

function getText(url, timeoutMs = 6_000, redirects = 0) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const transport = parsed.protocol === 'http:' ? http : https;
    const request = transport.get(parsed, {
      headers: { 'User-Agent': 'NEO-LIB/1.7.5 provider acceptance (read-only)', Accept: 'text/html,application/json;q=0.9,*/*;q=0.8' },
    }, response => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location && redirects < 3) {
        response.resume();
        return resolve(getText(new URL(response.headers.location, parsed).toString(), timeoutMs, redirects + 1));
      }
      if (response.statusCode < 200 || response.statusCode >= 300) {
        response.resume();
        return reject(new Error(`${parsed.hostname} returned HTTP ${response.statusCode}`));
      }
      const chunks = [];
      let size = 0;
      response.on('data', chunk => {
        size += chunk.length;
        if (size > 4 * 1024 * 1024) request.destroy(new Error('Live response exceeded 4 MiB'));
        else chunks.push(chunk);
      });
      response.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
    request.setTimeout(timeoutMs, () => request.destroy(new Error(`${parsed.hostname} timed out`)));
    request.on('error', reject);
  });
}

async function getJson(url, timeoutMs = 6_000) {
  return JSON.parse(await getText(url, timeoutMs));
}

function stripHtml(value) { return String(value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }

(async () => {
  const results = [];
  const run = async (name, work) => {
    const started = Date.now();
    const detail = await work();
    results.push({ name, ms: Date.now() - started, detail });
  };

  const store = createStoreProviderService({
    httpGetJson: getJson,
    cleanSearchTerm: value => String(value || '').trim(),
    stripHtml,
    steamGenreEvidence: async (_appid, data) => (data.genres || []).map(entry => entry.description),
  });
  await run('Steam store', async () => {
    const items = await store.searchSteam('Portal 2');
    assert(items.length > 0 && items.some(item => /portal/i.test(item.name)), 'Steam returned no Portal candidate');
    return `${items.length} candidates`;
  });
  await run('GOG catalog', async () => {
    const items = await store.searchGog('Cyberpunk 2077');
    assert(items.length > 0, 'GOG returned no candidate');
    return `${items.length} candidates`;
  });

  const web = createPublicWebProviderService({
    httpGetText: getText,
    cleanSearchTerm: value => String(value || '').trim(),
    cleanTitle: value => stripHtml(value),
    publicSearchUrl: value => value,
  });
  await run('Public search', async () => {
    const items = await web.searchDuckDuckGo('Portal 2 official game');
    assert(Array.isArray(items), 'public search response was not normalized');
    return `${items.length} normalized results`;
  });

  const specialist = createSpecialistMetadataProviderService({ httpGetText: getText, httpPostJson: async () => ({}), cleanTitle: value => stripHtml(value) });
  await run('itch.io', async () => {
    const items = await specialist.itchSearch('Celeste');
    assert(Array.isArray(items), 'itch.io response was not normalized');
    return `${items.length} normalized results`;
  });

  const steamNews = createSteamNewsProviderService({ httpGetJson: getJson, isLikelyEnglish: () => true, now: Date.now });
  await run('Steam News', async () => {
    const result = await steamNews.fetch({ games: [{ id: 'portal2', appid: 620, name: 'Portal 2' }], days: 3650, force: true });
    assert(result?.ok === true && Array.isArray(result.items), 'Steam News response was not normalized');
    return `${result.items.length} normalized articles`;
  });

  const deals = createDealsProviderService({ httpGetJson: getJson, httpGetText: getText, now: Date.now });
  await run('Deals aggregation', async () => {
    const items = await deals.fetch();
    assert(Array.isArray(items), 'Deals response was not normalized');
    assert(items.length > 0, 'all public deal sources were empty or unavailable');
    return `${items.length} deals across ${new Set(items.map(item => item.platform)).size} sources`;
  });

  for (const result of results) console.log(`PASS: ${result.name} — ${result.detail} (${result.ms} ms)`);
  console.log('PASS: live Stage 4 provider smoke completed with bounded public GET requests only; no login, user data, file write, launch or metadata apply.');
})().catch(error => { console.error(`FAIL: live Stage 4 provider smoke — ${error.message}`); process.exitCode = 1; });
