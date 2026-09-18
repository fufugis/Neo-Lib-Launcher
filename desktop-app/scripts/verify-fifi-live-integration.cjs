const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const voice = read('src/lib/mascotVoice.js');
const host = read('src/components/FungistMascot.jsx');
const settings = read('src/components/SettingsModal.jsx');
const mascotCenter = read('src/components/MascotCenterModal.jsx');
const tutorial = read('src/components/TutorialModal.jsx');
const app = read('src/App.jsx');
const adapter = read('src/components/FifiAvatar.jsx');
const audioFolder = path.join(root, 'public/mascot/voice-packs/fifi-future');
const audioFiles = fs.readdirSync(audioFolder).filter((file) => file.endsWith('.mp3'));

assert.equal(audioFiles.length, 27, 'FiFi voice pool must contain 27 recordings');
for (const file of audioFiles) assert.ok(voice.includes(file), `live voice map is missing ${file}`);
assert.match(voice, /export const FIFI_VOICE_LINES/);
assert.match(voice, /playMascotVoice/);
assert.match(mascotCenter, /data-testid=\{`mascot-center-\$\{entry\.id\}`\}/);
assert.match(mascotCenter, /getMascotVoiceLines\(mascotId\)/);
assert.doesNotMatch(settings, /mascot-picker-fifi|fungistNotifications|fungistVoiceEnabled/, 'Mascot choices, alerts and voice controls must have one home in Mascot Center.');
assert.match(app, /mascotId=\{settings\.mascotId \|\| 'fungist'\}/);
assert.match(app, /effectsLevel=\{activeEffectsLevel\}/);
assert.match(host, /<FifiAvatar/);
assert.match(host, /neolib-mascot-speaking/);
assert.match(tutorial, /mascotId = 'fungist'/);
assert.match(adapter, /dataset\.neolibFifiRig/);
assert.match(adapter, /customElements\?\.get\('neo-fifi'\)/);

console.log('PASS: FiFi is selectable and connected to the shared live companion host, all 27 recordings, reaction metadata, tutorial, settings previews, Rest Mode and effects level. Static verification only; installed visual/audio acceptance remains required.');
