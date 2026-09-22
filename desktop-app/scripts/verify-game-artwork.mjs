import assert from 'node:assert/strict';
import { artworkBackdrop, officialSteamPortrait, portraitArtwork } from '../src/lib/game-artwork-model.mjs';

assert.equal(officialSteamPortrait(620), 'https://cdn.cloudflare.steamstatic.com/steam/apps/620/library_600x900.jpg');
assert.equal(officialSteamPortrait('not-an-id'), '');
assert.equal(portraitArtwork({ source: 'steam', appid: 620 }), officialSteamPortrait(620));
assert.equal(portraitArtwork({ source: 'steam-import', launcher: 'steam', appid: 892970 }), officialSteamPortrait(892970));
assert.equal(portraitArtwork({ source: 'gog', launcher: 'steam', appid: 620 }), officialSteamPortrait(620));
assert.equal(portraitArtwork({ appid: 1342330 }), officialSteamPortrait(1342330));
assert.equal(portraitArtwork({ source: 'gog', portraitImage: 'https://images.example/cover.webp' }), 'https://images.example/cover.webp');
assert.equal(portraitArtwork({ source: 'gog', coverUrl: 'https://images.example/wide.webp' }), '');
assert.equal(portraitArtwork({ manualOverride: true, coverUrl: 'file:///C:/Art/cover.png' }), 'file:///C:/Art/cover.png');
assert.equal(artworkBackdrop({ headerImage: 'hero.jpg', coverUrl: 'cover.jpg' }), 'hero.jpg');
assert.equal(artworkBackdrop({}), '');

console.log('Portrait artwork prefers official or player-selected covers and never treats a wide fallback as a portrait cover.');
