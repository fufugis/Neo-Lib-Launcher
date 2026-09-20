import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const hero = read('src/components/preview/PreviewHeroTitle.jsx');
const detail = read('src/components/GameDetail.jsx');

assert.match(hero, /data-testid="preview-game-facts"/, 'Preview must expose a stable facts strip.');
assert.match(hero, />Time played</, 'Preview facts must label tracked playtime.');
assert.match(hero, />Install size</, 'Preview facts must label install size.');
assert.match(hero, /!hasSize && game\.exePath/, 'Size scans must only be offered for a validated local game target.');
assert.match(hero, /onClick=\{onMeasureSize\}/, 'The scan control must call the bounded measurement handler.');
assert.match(hero, /Not measured/, 'Unknown size must be stated rather than guessed.');
assert.match(detail, /window\.api\.scanGameStorage\(/, 'Measurement must use the established bounded storage scanner.');
assert.match(detail, /force: true/, 'A player-requested size scan must refresh its cached measurement.');
assert.match(detail, /installSizeBytes: next\.bytes/, 'Measured bytes must persist on the game entry.');
assert.match(detail, /installSizeMeasuredAt: Date\.now\(\)/, 'Measurement time must persist on the game entry.');
assert.match(detail, /installSizePartial: next\.truncated/, 'Partial scan status must persist on the game entry.');

console.log('Preview playtime and install-size facts verified.');
