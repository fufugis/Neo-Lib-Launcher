import assert from 'node:assert/strict';
import fs from 'node:fs';
import { genreDisplayGroups, normalizeGenreProfile } from '../src/lib/genreTaxonomy.js';

const wizard = fs.readFileSync(new URL('../src/components/WizardModal.jsx', import.meta.url), 'utf8');
const groups = genreDisplayGroups(normalizeGenreProfile({ rawTags: ['Action', 'Action Roguelike', 'Online Co-op'], source: 'steam' }));
assert(groups.length > 0);
for (const [label, entries] of groups) {
  assert.equal(typeof label, 'string'); assert(Array.isArray(entries));
  assert(entries.every(entry => typeof entry.label === 'string' && entry.id));
}
assert.throws(() => groups.map(group => group.items.map(item => item)), /reading 'map'/, 'reproduce released tuple/object contract mismatch');
assert.match(wizard, /detectedGenreGroups\.map\(\(\[label, entries\]\)/);
assert.match(wizard, /entries\.map\(\(entry\)/);
assert(wizard.includes('{entry.label}') && !wizard.includes('group.items.map'));
assert.deepEqual(genreDisplayGroups(null), []);
assert.deepEqual(genreDisplayGroups(normalizeGenreProfile({ rawTags: [], source: 'steam' })), []);
console.log('PASS: Wizard uses the actual canonical genre tuple/entry contract, labels and empty-state behavior; old undefined-map access is reproduced and rejected.');
