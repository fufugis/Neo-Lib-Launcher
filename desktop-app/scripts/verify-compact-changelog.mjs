import { V1811_CHANGELOG } from '../src/components/changelog/v1811-changelog.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { V188_CHANGELOG } from '../src/components/changelog/v188-changelog.mjs';
import { V189_CHANGELOG } from '../src/components/changelog/v189-changelog.mjs';
import { V1810_CHANGELOG } from '../src/components/changelog/v1810-changelog.mjs';
import { V187_CHANGELOG } from '../src/components/changelog/v187-changelog.mjs';
import { UPCOMING_CHANGELOG } from '../src/components/changelog/upcoming-changelog.mjs';
import { CHANGELOG, getChangesSince } from '../src/components/changelog/changelog-content.mjs';
import { V186_CHANGELOG } from '../src/components/changelog/v186-changelog.mjs';

assert.equal(V188_CHANGELOG.version, '1.8.8');
assert.equal(V188_CHANGELOG.items.length, 5);
assert(V188_CHANGELOG.items.every(item => typeof item === 'string' && item.length < 120));
assert.equal(CHANGELOG[0], V1811_CHANGELOG);
assert(V1811_CHANGELOG.major.every(item => item.title && item.body && item.body.length < 180));
assert.equal(V1811_CHANGELOG.major.length, 15);
assert.equal(V1810_CHANGELOG.items.length, 1);
assert.deepEqual(getChangesSince('1.8.10'), [V1811_CHANGELOG]);
assert.deepEqual(getChangesSince('1.8.9'), [V1811_CHANGELOG, V1810_CHANGELOG]);
assert.equal(V189_CHANGELOG.items.length, 1);
assert.deepEqual(getChangesSince('1.8.8'), [V1811_CHANGELOG, V1810_CHANGELOG, V189_CHANGELOG], 'previous crash fix remains accessible');
assert.deepEqual(getChangesSince('1.8.7'), [V1811_CHANGELOG, V1810_CHANGELOG, V189_CHANGELOG, V188_CHANGELOG], 'previous hotfix remains accessible');
assert.equal(UPCOMING_CHANGELOG.unreleased, true);
assert(UPCOMING_CHANGELOG.major.every(item => item.title && item.body && item.body.length < 180), 'Upcoming features remain concise');
assert.equal(UPCOMING_CHANGELOG.fixes.length, 0, 'Hotfix notes must not also remain Upcoming');
assert.equal(V187_CHANGELOG.major.length, 10, 'Previous feature highlights are preserved');
assert.equal(V186_CHANGELOG.major.length, 0, 'Recovery notes must not relabel features as new');
assert(V186_CHANGELOG.fixes.length > 0, 'Recovery history is preserved');

const read = file => fs.readFileSync(new URL(file, import.meta.url), 'utf8');
const modal = read('../src/components/ChangelogModal.jsx');
assert(modal.includes('recentReleaseNotes(currentVersion)'));
assert(modal.includes("if (open) setSelectedVersion(releases[0]?.version || 'upcoming')"));
assert(modal.includes('Latest five releases'));
assert(modal.includes('<ChangelogReleaseNotes entry={entry} />'));
assert(!modal.includes('Fixes, adjustments & polish'));
const { recentReleaseNotes, releaseSections } = await import('../src/components/changelog/release-history-model.mjs');
assert.deepEqual(recentReleaseNotes('1.8.10').map(e => e.version), ['1.8.10','1.8.9','1.8.8','1.8.7','1.8.6']);
assert.deepEqual(recentReleaseNotes('v1.8.8').map(e => e.version), ['1.8.8','1.8.7','1.8.6','1.8.5','1.8.4']);
assert(releaseSections(V186_CHANGELOG).some(s => s.title === 'Fixes' && s.items.length));
assert.equal(recentReleaseNotes('1.8.10', [V188_CHANGELOG,V188_CHANGELOG,UPCOMING_CHANGELOG]).length, 1);

const news = read('../../NEWS_CHANGELOG.md'), release = read('../../RELEASE_NOTES_v1.8.11.md');
for (const body of [news, release]) {
  assert(body.includes('NEO-LIB v1.8.11'));
  for (const item of V1811_CHANGELOG.major) assert(body.includes('**' + item.title + ':** ' + item.body), 'Published and in-app features match');
}
const previous = read('../../RELEASE_NOTES_v1.8.7.md');
for (const item of UPCOMING_CHANGELOG.major) assert(news.includes('**' + item.title + ':** ' + item.body), 'Upcoming GitHub/in-app highlights match');
for (const item of V187_CHANGELOG.major) assert(previous.includes('**' + item.title + ':** ' + item.body));
console.log('PASS: concise matching v1.8.11 feature notes, upgrade selection and preserved hotfix history.');
