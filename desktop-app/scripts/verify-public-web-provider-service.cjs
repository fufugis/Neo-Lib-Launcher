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
        if (mode === 'google' || mode === 'monolith' || mode === 'heading-only' || mode === 'bing') return '<html>no results</html>';
        return '<a class="result__a" href="https%3A%2F%2Fexample.test%2Fgame">Portal 2 - Wikipedia</a><span>gap</span><a class="result__snippet">A 2011 action puzzle game with co-op.</a>';
      }
      if (url.includes('bing.com')) {
        return mode === 'bing'
          ? '<rss><channel><item><title>Windrose on Steam</title><link>https://store.steampowered.com/app/3041230/Windrose/</link><description>Windrose is a survival adventure set in the Age of Piracy.</description></item></channel></rss>'
          : '<rss><channel></channel></rss>';
      }
      if (url.includes('google.com')) {
        if (mode === 'monolith') return '<a href="https://team-monolith.itch.io/monolith-bay"><span><h3>Monolith Bay by Team Monolith</h3></span></a><div>Monolith Bay is an adult open-world dating adventure for Windows.</div>';
        if (mode === 'heading-only') return '<a class="result" href="https://rare.example.test/game"><h3><span>Rare &amp; Wonderful</span> Game</h3></a>';
        if (mode === 'bing') return '<html><title>Google Search</title></html>';
        return '<a href="/url?q=https://fallback.test/game&x=1"><h3>Fallback Game</h3><div class="VwiC3b">A 2024 indie adventure.</div>';
      }
      throw new Error(`unexpected URL ${url}`);
    },
  });

  const duck = await service.searchDuckDuckGo('Portal 2');
  assert.deepEqual(duck, [{ url: 'https://example.test/game', title: 'Portal 2 - Wikipedia', snippet: 'A 2011 action puzzle game with co-op.' }]);
  assert.match(requests[0], /duckduckgo\.com\/html\/\?q=Portal%202&kp=-2$/);
  await service.searchGameDuckDuckGo('Portal 2');
  assert.match(requests[1], /q=Portal%202%20video%20game%20wiki&kp=-2$/);
  const synthesized = await service.searchWeb('Portal 2');
  assert.equal(synthesized.synthesized.name, 'Portal 2');
  assert.equal(synthesized.synthesized.releaseDate, '2011');
  assert.deepEqual(synthesized.synthesized.genres, ['Action', 'Puzzle']);
  assert.equal(synthesized.synthesized.source, 'web');

  mode = 'google';
  const fallback = await service.searchWeb('Fallback');
  assert.equal(fallback.results[0].url, 'https://fallback.test/game');
  assert.equal(fallback.synthesized.releaseDate, '2024');
  assert.match(requests.at(-2), /google\.com\/search\?q=%22Fallback%22&hl=en&safe=off$/);
  assert.match(requests.at(-1), /bing\.com\/search\?format=rss&q=%22Fallback%22$/);

  assert.deepEqual(service.gameTitleVariants('MonolithBay'), ['MonolithBay', 'Monolith Bay']);
  mode = 'monolith';
  const difficult = await service.searchGameMetadata('MonolithBay');
  assert.equal(difficult[0].url, 'https://team-monolith.itch.io/monolith-bay');
  assert.equal(difficult[0].title, 'Monolith Bay by Team Monolith');
  assert.match(difficult[0].snippet, /adult open-world dating adventure/i);
  assert.ok(requests.some(url => /google\.com\/search\?q=%22MonolithBay%22&hl=en&safe=off/.test(url)), 'Hard-title recovery must try the exact uncensored Google query first.');
  assert.equal((await service.searchGameCandidates('MonolithBay'))[0].url, 'https://team-monolith.itch.io/monolith-bay');
  mode = 'heading-only';
  assert.deepEqual(await service.searchGoogle('Rare Wonderful'), [{ url: 'https://rare.example.test/game', title: 'Rare & Wonderful Game', snippet: '' }], 'Google results survive missing snippets and nested headings');
  mode = 'bing';
  const liveStyleFallback = await service.searchGameMetadata('Windrose');
  assert.equal(liveStyleFallback[0].url, 'https://store.steampowered.com/app/3041230/Windrose/', 'RSS result remains usable when Google serves a result-free shell and DDG has no response');

  assert.deepEqual(await service.searchWeb(''), { results: [], synthesized: null });
  mode = 'offline';
  assert.deepEqual(await service.searchDuckDuckGo('Anything'), []);
  assert.deepEqual(await service.searchGoogle('Anything'), []);
  assert.deepEqual(await service.searchWeb('Anything'), { results: [], synthesized: null });
  console.log('PASS: public-web provider preserves generic lookup, disables safe-search filtering for reviewed metadata, expands joined titles, parses changing Google result layouts, ranks exact matches and contains offline failure. Injected HTTP only; no network request ran.');
})().catch(error => { console.error(error); process.exitCode = 1; });
