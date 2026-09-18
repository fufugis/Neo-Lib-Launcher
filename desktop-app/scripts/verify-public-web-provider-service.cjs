const assert = require('node:assert/strict');
const { createPublicWebProviderService } = require('../electron/providers/public-web-provider-service.cjs');

(async () => {
  const requests = [];
  let mode = 'duck';
  const service = createPublicWebProviderService({
    cleanSearchTerm: value => String(value || '').trim(),
    cleanTitle: value => String(value || '').replace(/\s+-\s+Wikipedia$/i, '').trim(),
    publicSearchUrl: value => String(value || '').replace(/^\/url\?q=([^&]+).*$/, '$1'),
    async httpGetText(url) {
      requests.push(url);
      if (mode === 'offline') throw new Error('offline');
      if (url.includes('duckduckgo.com')) {
        if (mode === 'google') return '<html>no results</html>';
        return '<a class="result__a" href="https%3A%2F%2Fexample.test%2Fgame">Portal 2 - Wikipedia</a><span>gap</span><a class="result__snippet">A 2011 action puzzle game with co-op.</a>';
      }
      if (url.includes('google.com')) return '<a href="/url?q=https://fallback.test/game&x=1"><h3>Fallback Game</h3><div class="VwiC3b">A 2024 indie adventure.</div>';
      throw new Error(`unexpected URL ${url}`);
    },
  });

  const duck = await service.searchDuckDuckGo('Portal 2');
  assert.deepEqual(duck, [{ url: 'https://example.test/game', title: 'Portal 2 - Wikipedia', snippet: 'A 2011 action puzzle game with co-op.' }]);
  assert.match(requests[0], /duckduckgo\.com\/html\/\?q=Portal%202$/);
  await service.searchGameDuckDuckGo('Portal 2');
  assert.match(requests[1], /q=Portal%202%20video%20game%20wiki$/);
  const synthesized = await service.searchWeb('Portal 2');
  assert.equal(synthesized.synthesized.name, 'Portal 2');
  assert.equal(synthesized.synthesized.releaseDate, '2011');
  assert.deepEqual(synthesized.synthesized.genres, ['Action', 'Puzzle']);
  assert.equal(synthesized.synthesized.source, 'web');

  mode = 'google';
  const fallback = await service.searchWeb('Fallback');
  assert.equal(fallback.results[0].url, 'https://fallback.test/game');
  assert.equal(fallback.synthesized.releaseDate, '2024');
  assert.match(requests.at(-2), /duckduckgo\.com/);
  assert.match(requests.at(-1), /google\.com\/search\?q=Fallback%20video%20game&hl=en$/);

  assert.deepEqual(await service.searchWeb(''), { results: [], synthesized: null });
  mode = 'offline';
  assert.deepEqual(await service.searchDuckDuckGo('Anything'), []);
  assert.deepEqual(await service.searchGoogle('Anything'), []);
  assert.deepEqual(await service.searchWeb('Anything'), { results: [], synthesized: null });
  console.log('PASS: extracted public-web provider preserves DuckDuckGo-first game queries, Google fallback, parsing, synthesis and empty/offline results. Injected HTTP only; no network request ran.');
})().catch(error => { console.error(error); process.exitCode = 1; });
