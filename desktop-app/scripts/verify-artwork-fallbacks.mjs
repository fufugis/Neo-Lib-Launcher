import assert from 'node:assert/strict';
import { gameArtworkCandidates, generatedGameArtwork } from '../src/lib/artwork-fallbacks.mjs';

const roles = ['cover', 'icon', 'logo', 'hero', 'background'];
const game = Object.freeze({ id: 'fallback-test', name: 'A <game> & "friends"', coverUrl: 'https://test/cover', icon: 'https://test/icon', logo: 'https://test/logo', headerImage: 'https://test/header', background: 'https://test/background' });
for (const role of roles) {
  const expected = { cover: game.coverUrl, icon: game.icon, logo: game.logo, hero: game.headerImage, background: game.background }[role];
  const urls = gameArtworkCandidates(game, role);
  assert.equal(urls[0], expected);
  assert.equal(urls.at(-1), generatedGameArtwork(game, role));
  assert.equal(new Set(urls).size, urls.length);
  assert.equal(gameArtworkCandidates({}, role).length, 1);
  for (const field of ['headerImage', 'logo', 'icon', 'background', 'coverUrl']) {
    assert.equal(gameArtworkCandidates({ [field]: 'https://test/only' }, role)[0], 'https://test/only');
  }
  assert.equal(gameArtworkCandidates({ screenshots: ['https://test/shot'] }, role)[0], 'https://test/shot');
}
assert.deepEqual(gameArtworkCandidates({ coverUrl: 'javascript:alert(1)' }, 'cover', { includeGenerated: false }), []);
assert.deepEqual(gameArtworkCandidates({ coverUrl: ' https://test/image ', headerImage: 'https://test/image' }, 'cover', { includeGenerated: false }), ['https://test/image']);
assert.equal(gameArtworkCandidates({ screenshots: Array.from({ length: 100 }, (_, i) => `https://test/${i}`) }, 'cover', { includeGenerated: false }).length, 24);
const svg = decodeURIComponent(generatedGameArtwork(game).split(',')[1]);
assert.match(svg, /&lt;game&gt; &amp; &quot;friends&quot;/);
assert.doesNotMatch(svg, /<game>/);
assert.equal(generatedGameArtwork(game), generatedGameArtwork(game));
assert.equal(game.coverUrl, 'https://test/cover', 'Fallback lookup must never overwrite a saved choice.');
console.log('PASS: all five artwork roles prefer assigned images, recover from any same-game shape, deduplicate safely and end at deterministic escaped local artwork without changing saved assets.');
