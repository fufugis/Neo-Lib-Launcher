import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_LOUNGE_SAMPLES, LOUNGE_SAMPLE_GROUPS, LOUNGE_SAMPLE_ROLES, loungeSampleAttenuation, loungeSampleStart, normalizeLoungeSamples } from '../src/components/lounge/lounge-sample-model.mjs';

const directory = path.resolve(import.meta.dirname, '../src/assets/lounge/sounds');
const expected = Object.values(LOUNGE_SAMPLE_GROUPS).flat().map(id => `${id}.mp3`).sort();
const actual = fs.readdirSync(directory).filter(name => name.toLowerCase().endsWith('.mp3')).sort();
assert.deepEqual(actual, expected, 'all supplied Lounge clips must be bundled and selectable');
assert.equal(expected.length, 44);
for (const id of ['ClickF', 'ClickG', 'ClickH', 'ClickI', 'ClickJ', 'ClickK', 'ClickL']) {
  assert(LOUNGE_SAMPLE_GROUPS.Clicks.includes(id));
  for (const role of Object.keys(LOUNGE_SAMPLE_ROLES)) assert.equal(normalizeLoungeSamples({ [role]: id })[role], id, 'new clicks can be saved for every sound role');
}
for (const filename of actual) {
  const bytes = fs.readFileSync(path.join(directory, filename));
  assert.ok(bytes.length > 1000 && bytes.subarray(0, 3).toString() === 'ID3', `${filename} must be a nonempty MP3`);
}
assert.deepEqual(Object.keys(DEFAULT_LOUNGE_SAMPLES), Object.keys(LOUNGE_SAMPLE_ROLES));
assert.deepEqual(normalizeLoungeSamples(null), DEFAULT_LOUNGE_SAMPLES);
assert.equal(normalizeLoungeSamples({ move: 'off', back: 'neg2' }).move, 'off');
assert.equal(normalizeLoungeSamples({ move: 'off', back: 'neg2' }).back, 'neg2');
assert.equal(normalizeLoungeSamples({ move: '../../bad.mp3' }).move, DEFAULT_LOUNGE_SAMPLES.move);
const buffer = values => ({ numberOfChannels: 1, getChannelData: () => Float32Array.from(values) });
assert.equal(loungeSampleAttenuation(buffer([0, 0.1, -0.1])), 1, 'quiet clips must not be boosted');
assert.ok(loungeSampleAttenuation(buffer([1, 1, 1, 1])) < 1, 'loud sustained clips need selective attenuation');
assert.equal(loungeSampleAttenuation(null), 1);
assert.equal(loungeSampleStart({ numberOfChannels: 1, sampleRate: 10, getChannelData: () => Float32Array.from([0, 0, 0.8, 0.1]) }), 0.2, 'frequent Move samples skip leading silence before their short fade');
const player = fs.readFileSync(path.resolve(import.meta.dirname, '../src/components/lounge/lounge-sample-player.js'), 'utf8');
assert.match(player, /async function loadSample/, 'samples must decode on demand');
assert.match(player, /session !== generation/, 'a pause must prevent a pending clip from starting');
assert.match(player, /stopLoungeSamples/, 'Rest and unmount must stop active clips');
assert.match(player, /export function previewLoungeSample\(role, id, volume\)/, 'picker previews an explicit clip without changing saved assignments');
assert.match(player, /previewLoungeSample[\s\S]*stopLoungeSamples\(\)/, 'rapid auditions stop the previous clip');
const controls = fs.readFileSync(path.resolve(import.meta.dirname, '../src/components/lounge/LoungeSoundControls.jsx'), 'utf8');
const picker = fs.readFileSync(path.resolve(import.meta.dirname, '../src/components/lounge/LoungeSamplePicker.jsx'), 'utf8');
assert.match(controls, /setPickerRole\(role\)/, 'choosing a sound opens a picker instead of applying immediately');
assert.match(controls, /const useSample = id => \{[\s\S]*loungeSamples: \{ \.\.\.preferences\.loungeSamples, \[pickerRole\]: id \}/, 'only Use commits a new role assignment');
assert.doesNotMatch(controls, /<select id=\{`lounge-sample-/, 'immediate-apply sample dropdowns are removed');
assert.match(picker, /onClick=\{\(\) => audition\(id\)\}/, 'clicking a clip auditions it');
assert.match(picker, /onClick=\{\(\) => onUse\(id\)\}/, 'Use is a separate action per clip');
assert.match(picker, /event\.key === 'Escape'[\s\S]*onClose\(\)/, 'Escape closes without applying');
console.log('PASS: 44 Lounge-only samples including ClickF–ClickL, per-role choices, on-demand decoding and selective attenuation.');
