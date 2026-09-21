import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  isLegacyCompatibleReleaseTag,
  isNewerVersion,
  normalizeVersion,
  releaseTagForVersion,
} from '../src/lib/update-version.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(scriptDir, '..');
const repoRoot = path.resolve(appRoot, '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(appRoot, 'package.json'), 'utf8'));
const workflow = fs.readFileSync(path.join(repoRoot, '.github', 'workflows', 'build-windows.yml'), 'utf8');
const checker = fs.readFileSync(path.join(appRoot, 'src', 'lib', 'updateChecker.js'), 'utf8');

assert.equal(normalizeVersion('v1.7.9'), '1.7.9');
assert.equal(normalizeVersion('v.1.7.5'), '1.7.5', 'current installs must tolerate the historical dotted tag');
assert.equal(isNewerVersion('v1.7.9', '1.7.3'), true);
assert.equal(isNewerVersion('v.1.7.5', '1.7.3'), true);
assert.equal(isNewerVersion('v1.7.9', '1.7.9'), false);
assert.equal(isNewerVersion('v1.7.8', '1.7.9'), false);

const releaseTag = releaseTagForVersion(packageJson.version);
assert.equal(releaseTag, 'v1.7.9', 'this release must use the clean legacy-compatible tag');
assert.equal(isLegacyCompatibleReleaseTag(releaseTag, packageJson.version), true);

// v1.7.3 used the simple parser below. A clean v1.7.9 tag is deliberately
// proven against that exact old behavior because installed copies cannot be patched.
const legacyParse = value => String(value || '').replace(/^v/i, '').split('.').map(part => Number.parseInt(part, 10) || 0);
const legacyIsNewer = (latest, current) => {
  const left = legacyParse(latest);
  const right = legacyParse(current);
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    if ((left[index] || 0) > (right[index] || 0)) return true;
    if ((left[index] || 0) < (right[index] || 0)) return false;
  }
  return false;
};
assert.equal(legacyIsNewer(releaseTag, '1.7.3'), true, 'v1.7.3 must recognize the new release');
assert.equal(legacyIsNewer('v.1.7.5', '1.7.3'), false, 'fixture must reproduce the historical dotted-tag bug');

assert(checker.includes('https://api.github.com/repos/${REPO}/releases/latest'), 'app must check GitHub latest release');
assert(workflow.includes('Validate release tag and package version'), 'release workflow must guard tag compatibility');
assert(workflow.includes('refs/tags/v'), 'release workflow must remain tag-driven');

console.log(`PASS: update discovery normalizes historical tags and clean ${releaseTag} is detected by the legacy v1.7.3 comparison.`);
