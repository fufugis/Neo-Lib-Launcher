import assert from 'node:assert/strict';

let oscillatorCount = 0;
const parameter = () => ({ value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} });
const node = () => ({ connect() { return this; } });
class AudioContextMock {
  currentTime = 1;
  state = 'running';
  destination = node();
  createDynamicsCompressor() { return { ...node(), threshold: parameter(), knee: parameter(), ratio: parameter(), attack: parameter(), release: parameter() }; }
  createGain() { return { ...node(), gain: parameter() }; }
  createOscillator() { oscillatorCount += 1; return { ...node(), frequency: parameter(), start() {}, stop() {} }; }
}
globalThis.window = { AudioContext: AudioContextMock };
const { playLoungeBrowse, playLoungeCue, setSoundPack } = await import('../src/lib/sound.js');

setSoundPack('none');
assert.equal(playLoungeBrowse(25), false, 'app-wide mute prevents Lounge audio');
setSoundPack('synthwave');
assert.equal(playLoungeBrowse(0), false, 'zero Lounge volume prevents audio');
assert.equal(playLoungeBrowse(25), true, 'a selected-game change creates one short cue');
assert.equal(playLoungeBrowse(25), false, 'rapid selection changes are throttled');
assert.equal(playLoungeCue('confirm', 25, 'pulse'), true);
assert.equal(playLoungeCue('back', 25, 'orbit'), true);
assert.equal(playLoungeCue('unknown', 25), false);
assert.equal(oscillatorCount, 3);
console.log('PASS: Lounge move/OK/Back styles obey mute, volume and rapid-change throttle.');
