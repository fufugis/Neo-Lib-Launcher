import assert from 'node:assert/strict';
import fs from 'node:fs';
import { V188_CHANGELOG } from '../src/components/changelog/v188-changelog.mjs';
import { V187_CHANGELOG } from '../src/components/changelog/v187-changelog.mjs';
import { UPCOMING_CHANGELOG } from '../src/components/changelog/upcoming-changelog.mjs';
import { CHANGELOG, getChangesSince } from '../src/components/changelog/changelog-content.mjs';
import { V186_CHANGELOG } from '../src/components/changelog/v186-changelog.mjs';

assert.equal(V188_CHANGELOG.version, '1.8.8');
assert.equal(V188_CHANGELOG.items.length, 5);
assert(V188_CHANGELOG.items.every(item => typeof item === 'string' && item.length < 120));
assert.equal(CHANGELOG[0], V188_CHANGELOG);
assert.deepEqual(getChangesSince('1.8.7'), [V188_CHANGELOG], '1.8.7 upgrades receive only the new hotfix notes');
assert.equal(UPCOMING_CHANGELOG.unreleased, true);
assert.equal(UPCOMING_CHANGELOG.major.length, 0);
assert.equal(UPCOMING_CHANGELOG.fixes.length, 0, 'Hotfix notes must not also remain Upcoming');
assert.equal(V187_CHANGELOG.major.length, 10, 'Previous feature highlights are preserved');
assert.equal(V186_CHANGELOG.major.length, 0, 'Recovery notes must not relabel features as new');
assert(V186_CHANGELOG.fixes.length > 0, 'Recovery history is preserved');

const read = file => fs.readFileSync(new URL(file, import.meta.url), 'utf8');
const modal = read('../src/components/ChangelogModal.jsx');
assert(modal.includes('showHistory ? CHANGELOG : entries.slice(0, 1)'));
assert(modal.includes('Older release highlights'));
assert(modal.includes('items: entry.items || []'), 'Concise hotfix items are rendered, not filtered out like empty feature lists');
assert(!modal.includes('Fixes, adjustments & polish'));
assert(modal.includes('if (!open) setShowHistory(false)'));

const news = read('../../NEWS_CHANGELOG.md'), release = read('../../RELEASE_NOTES_v1.8.8.md');
for (const body of [news, release]) {
  assert(body.includes('NEO-LIB v1.8.8'));
  assert.equal(body.split(/\r?\n/).filter(line => line.startsWith('- ')).length, 5);
  for (const item of V188_CHANGELOG.items) assert(body.includes('- ' + item), 'GitHub and in-app hotfix notes match');
}
const previous = read('../../RELEASE_NOTES_v1.8.7.md');
for (const item of V187_CHANGELOG.major) assert(previous.includes('**' + item.title + ':** ' + item.body));
console.log('PASS: five concise matching v1.8.8 hotfix notes, visible modal items, 1.8.7 upgrade selection and preserved release history.');
