import assert from 'node:assert/strict';
import { buildGitHubIssueUrl } from '../src/services/feedback-fallback.mjs';

const baseUrl = 'https://github.com/fufugis/Neo-Lib-Launcher/issues/new';
const short = buildGitHubIssueUrl({ baseUrl, title: 'A report', body: 'Short body' });
assert(short.startsWith(`${baseUrl}?title=`));
assert.equal(new URL(short).searchParams.get('body'), 'Short body');

for (const body of ['x'.repeat(20_000), '🎮'.repeat(5_000), 'private path C:\\Users\\Fixture\n'.repeat(800)]) {
  const url = buildGitHubIssueUrl({ baseUrl, title: 'Long report', body, maxUrlLength: 7000 });
  assert(url.length <= 7000, `fallback URL exceeded its bound: ${url.length}`);
  assert.match(new URL(url).searchParams.get('body'), /Report shortened to fit the browser link/);
}

const tiny = buildGitHubIssueUrl({ baseUrl, title: 'Tiny', body: 'x'.repeat(1000), maxUrlLength: 300 });
assert(tiny.length <= 300);
assert.doesNotThrow(() => new URL(tiny));
assert.doesNotThrow(() => buildGitHubIssueUrl({ baseUrl, title: `broken-\uD800`, body: `broken-\uDC00` }));
console.log('PASS: GitHub feedback fallback preserves short reports and safely bounds long ASCII, Unicode and diagnostic-heavy browser links.');
