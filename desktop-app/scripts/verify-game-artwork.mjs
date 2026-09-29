import assert from 'node:assert/strict';
import { artworkBackdrop, hasPortraitDimensions, officialSteamPortrait, portraitArtwork, portraitArtworkCandidates } from '../src/lib/game-artwork-model.mjs';
import { libraryHeroCandidates, libraryHeroWidth } from '../src/components/preview/library-hero-artwork.mjs';

assert.deepEqual(libraryHeroCandidates({ hero: 'chosen.jpg', background: 'large.jpg', screenshots: ['scene.jpg'], headerImage: 'small.jpg' }), ['chosen.jpg', 'large.jpg', 'scene.jpg', 'small.jpg']);
assert.deepEqual(libraryHeroCandidates({ background: 'large.jpg', screenshots: ['large.jpg'], headerImage: 'small.jpg' }), ['large.jpg', 'small.jpg']);
assert.equal(libraryHeroWidth(460, 1946), 575, 'a small header must not stretch over a wide display');
assert.equal(libraryHeroWidth(1920, 1946), null, 'a full-size background can fill the hero');

assert.equal(officialSteamPortrait(620), 'https://cdn.cloudflare.steamstatic.com/steam/apps/620/library_600x900.jpg');
assert.equal(officialSteamPortrait('not-an-id'), '');
assert.equal(portraitArtwork({ source: 'steam', appid: 620 }), officialSteamPortrait(620));
assert.equal(portraitArtwork({ source: 'steam-import', launcher: 'steam', appid: 892970 }), officialSteamPortrait(892970));
assert.equal(portraitArtwork({ source: 'gog', launcher: 'steam', appid: 620 }), officialSteamPortrait(620));
assert.equal(portraitArtwork({ appid: 1342330 }), officialSteamPortrait(1342330));
assert.equal(portraitArtwork({ steamAppId: 620 }), officialSteamPortrait(620), 'historical Steam entries with only the dedicated Steam ID still find official portrait art');
assert.equal(portraitArtwork({ source: 'gog', portraitImage: 'https://images.example/cover.webp' }), 'https://images.example/cover.webp');
assert.equal(portraitArtwork({ source: 'gog', coverUrl: 'https://images.example/wide.webp' }), '');
assert.equal(portraitArtwork({ manualOverride: true, coverUrl: 'file:///C:/Art/cover.png' }), 'file:///C:/Art/cover.png');
assert.equal(portraitArtwork({ manualOverride: true, coverUrl: 'chosen.jpg', portraitImage: 'old.jpg', appid: 620 }), 'chosen.jpg', 'player cover wins even for Steam games');
assert.deepEqual(portraitArtworkCandidates({ manualOverride: true, coverUrl: 'custom.jpg', portraitImage: 'portrait.jpg', appid: 620, capsuleImage: 'capsule.jpg' }), ['custom.jpg', 'portrait.jpg', officialSteamPortrait(620), 'capsule.jpg']);
assert.deepEqual(portraitArtworkCandidates({ headerImage: 'hero.jpg', coverUrl: 'unmeasured.jpg' }), ['unmeasured.jpg'], 'saved covers are checked by dimensions, not guessed from a URL');
assert.deepEqual(portraitArtworkCandidates({ coverUrl: 'file:///cached.jpg', portraitImage: 'https://official.jpg', appid: 620 }), ['file:///cached.jpg', 'https://official.jpg', officialSteamPortrait(620)], 'a cached cover is tried before another network fetch');
assert.equal(hasPortraitDimensions(600, 900), true);
assert.equal(hasPortraitDimensions(342, 482), true);
assert.equal(hasPortraitDimensions(460, 215), false);
assert.equal(hasPortraitDimensions(512, 512), false);
assert.equal(artworkBackdrop({ headerImage: 'hero.jpg', coverUrl: 'cover.jpg' }), 'hero.jpg');
assert.equal(artworkBackdrop({}), '');

console.log('Portrait artwork prefers official or player-selected covers and never treats a wide fallback as a portrait cover.');
