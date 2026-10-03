import assert from 'node:assert/strict';
import fs from 'node:fs';
import { normalizeLoungePreferences } from '../src/components/lounge/lounge-layout-model.mjs';
import { carouselCrossAxisClearance } from '../src/components/lounge/lounge-carousel-centering.mjs';
const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');
assert.equal(normalizeLoungePreferences({}).carouselShowTitles, true);
assert.equal(normalizeLoungePreferences({ carouselShowTitles: false }).carouselShowTitles, false);
assert.equal(normalizeLoungePreferences(JSON.parse(JSON.stringify(normalizeLoungePreferences({ carouselShowTitles: false })))).carouselShowTitles, false);
const lounge = read('../src/components/lounge/NeoLounge.jsx');
assert(lounge.includes("data-lounge-carousel-titles={preferences.carouselShowTitles ? 'true' : 'false'}"));
assert.equal((lounge.match(/preferences.coverAspect, preferences.carouselShowTitles,/g) || []).length, 2, 'both centering and geometry invalidation include title visibility');
assert(lounge.includes("aria-label={`Open Lounge details for ${game.name"), 'art-only cards retain accessible game names');
const styles = read('../src/styles.css');
assert(styles.includes("[data-lounge-carousel-titles='false'] .lounge-browser-card > .lounge-card-caption { display: none; }"));
assert(styles.includes('{ align-items: flex-end; }'));
assert(styles.includes('{ transform-origin: center bottom; }'));
const builder = read('../src/components/lounge/LoungeVisualBuilder.jsx');
assert(builder.includes('(preferences.carouselShowTitles ? 1 : 0.74)'), 'mini cards reclaim caption height');
const settings = read('../src/components/lounge/LoungeSettingsPanel.jsx');
assert(settings.includes('label="Carousel game titles"'));
assert(settings.includes("'selectedGameScale', 'carouselShowTitles',"), 'reset layout restores titles');
for (const scale of [1, 1.2, 1.45, 2]) {
  const artwork = 184 * 1.5;
  const withTitles = carouselCrossAxisClearance(artwork + 40, scale, true, 72);
  const withoutTitles = carouselCrossAxisClearance(artwork, scale, true, 72);
  assert.equal(withTitles.after, withoutTitles.after, 'bottom glow clearance does not change with caption height');
  assert(withTitles.before >= withoutTitles.before, 'extra scaled title clearance is reserved above, not below');
}
console.log('PASS: saved carousel title toggle, reclaimed caption space, bottom anchoring and geometry invalidation.');
