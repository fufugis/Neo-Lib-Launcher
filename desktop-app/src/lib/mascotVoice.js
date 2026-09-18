// Fungist voice clips are deliberately streamed only when an event needs one.
// There is no loop, resident decoder, or background timer: Rest Mode simply
// never calls this module. A shared cooldown keeps the companion helpful rather
// than chatty when several launcher events land together.
const voiceAsset = (mascotId, filename) => `${import.meta.env.BASE_URL}mascot/${mascotId === 'fifi' ? 'voice-packs/fifi-future' : 'voice'}/${filename}`;

export const FUNGIST_VOICE_LINES = [
  { id: 'welcome', label: 'Welcome to NEO-LIB', speech: 'Welcome to NEO-LIB!', mood: 'happy', file: 'welcome.mp3', use: 'One post-intro welcome, or a tutorial replay.' },
  { id: 'attention', label: 'Listen to me', speech: 'Listen to me!', mood: 'urgent', file: 'attention.mp3', use: 'Major PC-attention alert.' },
  { id: 'thinking', label: 'Hmmm', speech: 'Hmmm…', mood: 'thinking', file: 'thinking.mp3', use: 'A chat answer takes a moment to arrive.' },
  { id: 'what-is-this', label: 'What is this?', speech: 'What is this?', mood: 'thinking', file: 'what-is-this.mp3', use: 'A future metadata or launch mismatch needs review.' },
  { id: 'introduce', label: "I'm Fungist", speech: "I'm Fungist, by the way!", mood: 'happy', file: 'introduce.mp3', use: 'Tutorial introduction / companion introduction.' },
  { id: 'take-a-look', label: 'Take a look', speech: 'Take a look!', mood: 'happy', file: 'take-a-look.mp3', use: 'Favourite-game update or a reviewable result.' },
  { id: 'play-time', label: 'Time to play a game', speech: 'Time to play a game!', mood: 'celebrate', file: 'play-time.mp3', use: 'A deliberate successful game launch.' },
  { id: 'news', label: 'Got some news for you', speech: 'Got some news for you!', mood: 'happy', file: 'news.mp3', use: 'Fresh news for a favourite game.' },
  { id: 'chat-open', label: 'How can I help you?', speech: 'How can I help you?', mood: 'happy', file: 'chat-open.mp3', use: 'Opening an empty chat conversation.' },
  { id: 'lets-do-this', label: "Let's do this", speech: "Let's do this!", mood: 'celebrate', file: 'lets-do-this.mp3', use: 'A player starts a repair or guided action.' },
  { id: 'ouff', label: 'Ouff', speech: 'Ouff.', mood: 'concerned', file: 'ouff.mp3', use: 'A recoverable warning or reported chat problem.' },
  { id: 'more-drama', label: 'More drama!', speech: 'More drama!', mood: 'concerned', file: 'more-drama.mp3', use: 'A future repeated Launch Doctor / metadata issue.' },
  { id: 'ack-i-see', label: 'I see', speech: 'I see.', mood: 'thinking', file: 'ack-i-see.mp3', use: 'Chat acknowledgement of a longer report.' },
  { id: 'neolib-update', label: 'New NEO-LIB update', speech: 'Looks like there is a new update for NEO-LIB, yeah!', mood: 'happy', file: 'neolib-update.mp3', use: 'A new NEO-LIB version is found.' },
  { id: 'ack-mhm', label: 'Mhm', speech: 'Mhm.', mood: 'thinking', file: 'ack-mhm.mp3', use: 'A rare neutral chat acknowledgement.' },
  { id: 'ack-alright-then', label: 'Alright then', speech: 'Alright then.', mood: 'happy', file: 'ack-alright-then.mp3', use: 'A chat confirmation or thanks.' },
  { id: 'ack-ill-help', label: "I'll help", speech: "I'll help!", mood: 'happy', file: 'ack-ill-help.mp3', use: 'A direct help question in chat.' },
  { id: 'ack-yup-yup', label: 'Yup yup', speech: 'Yup yup!', mood: 'happy', file: 'ack-yup-yup.mp3', use: 'A short yes / confirmation in chat.' },
  { id: 'sure-yeah', label: 'Sure, yeah', speech: 'Sure, yeah.', mood: 'happy', file: 'sure-yeah.mp3', use: 'A warm, brief chat agreement.' },
  { id: 'why-not', label: 'Why not', speech: 'Why not?', mood: 'happy', file: 'why-not.mp3', use: 'A playful response to a casual chat suggestion.' },
  { id: 'easy', label: 'Easy!', speech: 'Easy!', mood: 'celebrate', file: 'easy.mp3', use: 'A small repair or simple action succeeds.' },
  { id: 'nice-good-job', label: 'Nice, good job', speech: 'Nice! Good job.', mood: 'celebrate', file: 'nice-good-job.mp3', use: 'A normal NEO-LIB task completes.' },
  { id: 'all-finished', label: 'All finished', speech: 'All finished!', mood: 'celebrate', file: 'all-finished.mp3', use: 'A larger library-wide task completes.' },
  { id: 'check-this', label: 'You should check this', speech: 'You should check this.', mood: 'concerned', file: 'check-this.mp3', use: 'A game update or important review is ready.' },
  { id: 'dont-mute', label: "Please don't mute me", speech: "Please don't mute me.", mood: 'concerned', file: 'dont-mute.mp3', use: 'Available as a playful manual preview in Mascot settings.' },
  { id: 'donate', label: 'Donate / buy me a coffee', speech: 'Please, if you could, donate to NEO-LIB or buy me a coffee.', mood: 'happy', file: 'donate.mp3', use: 'The user opens NEO-LIB’s support window.' },
  { id: 'be-my-guest', label: 'Be my guest', speech: 'Be my guest…', mood: 'happy', file: 'be-my-guest.mp3', use: 'Available as a manual preview for future external-link hand-offs.' },
];

const FIFI_FILES = {
  welcome: 'teto-2026-09-06-00-21-[sad]-Welcome-to-Neo-Lib.mp3', attention: 'teto-2026-09-06-00-22-[sad]-Look-here!.mp3',
  thinking: 'teto-2026-09-06-00-23-[soft]-[emphasis]-hmm.-[short-pause].mp3', 'what-is-this': 'teto-2026-09-06-00-23-[emphasis]-What-is-this-[short-pause].mp3',
  introduce: 'teto-2026-09-06-00-24-[emphasis]-I-am-Fifi-[short-pause].mp3', 'take-a-look': 'teto-2026-09-06-00-25-[emphasis]-Take-a-look-at-this-[short-pause].mp3',
  'play-time': 'teto-2026-09-06-00-25-[emphasis]-Wanna-play-a-game-ye-[short-pause].mp3', news: 'teto-2026-09-06-00-25-[emphasis]-Got-news-for-you-[short-pause].mp3',
  'chat-open': 'teto-2026-09-06-00-26-[emphasis]-Can-i-help-you-with-something-[short.mp3', 'lets-do-this': 'teto-2026-09-06-00-26-[emphasis]-Lets-do-it!-[short-pause].mp3',
  ouff: 'teto-2026-09-06-00-27-[emphasis]-ouff[short-pause].mp3', 'more-drama': 'teto-2026-09-06-00-28-[emphasis]-More-trouble[short-pause][angry]-[sad.mp3',
  'ack-i-see': 'teto-2026-09-06-00-28-[emphasis]-aha[angry].mp3', 'neolib-update': 'teto-2026-09-06-00-28-[emphasis]-Oh-my-GOD,-Neo-Lib-has-a-new-update!!.mp3',
  'ack-mhm': 'teto-2026-09-06-00-29-[emphasis]-mhm[angry].mp3', 'ack-alright-then': 'teto-2026-09-06-00-29-[emphasis]-Okiedokie[angry].mp3',
  'ack-ill-help': "teto-2026-09-06-00-29-[emphasis]-I'll-help-here[angry].mp3", 'ack-yup-yup': 'teto-2026-09-06-00-30-[emphasis]-yes-yes[angry].mp3',
  'sure-yeah': 'teto-2026-09-06-00-30-[emphasis]-Sure,-fine[angry].mp3', 'why-not': 'teto-2026-09-06-00-30-[emphasis]-why-not[angry].mp3',
  easy: 'teto-2026-09-06-00-31-[emphasis]-Easy-task[angry].mp3', 'nice-good-job': 'teto-2026-09-06-00-31-[emphasis]-Well-done![angry].mp3',
  'all-finished': 'teto-2026-09-06-00-31-[emphasis]-Okay,-its-finished![angry].mp3', 'check-this': 'teto-2026-09-06-00-32-[emphasis]-You-should-check-this-out[angry].mp3',
  'dont-mute': 'teto-2026-09-06-00-32-[emphasis]-Sorry,-but-dont-mute-me[angry].mp3', donate: 'teto-2026-09-06-00-33-[emphasis]-Please,-hit-the-donate-button,-pretty.mp3',
  'be-my-guest': 'teto-2026-09-06-00-34-[emphasis]-Be-my-guest[emphasis]-[excited].mp3',
};

const FIFI_REACTIONS = {
  welcome: ['greeting', 'hello', 'present'], attention: ['alert', 'beacon', 'present'], thinking: ['thinking', 'scan', 'bow'],
  'what-is-this': ['curious', 'scan', 'present'], introduce: ['greeting', 'glint', 'present'], 'take-a-look': ['curious', 'glint', 'present'],
  'play-time': ['celebrate', 'trail', 'double-nod'], news: ['happy', 'glint', 'present'], 'chat-open': ['listening', 'soft', 'present'],
  'lets-do-this': ['celebrate', 'burst', 'double-nod'], ouff: ['concern', 'soft', 'bow'], 'more-drama': ['alert', 'beacon', 'double-nod'],
  'ack-i-see': ['thinking', 'scan', 'nod'], 'neolib-update': ['celebrate', 'burst', 'double-nod'], 'ack-mhm': ['listening', 'soft', 'nod'],
  'ack-alright-then': ['happy', 'glint', 'nod'], 'ack-ill-help': ['happy', 'scan', 'present'], 'ack-yup-yup': ['happy', 'glint', 'double-nod'],
  'sure-yeah': ['happy', 'soft', 'nod'], 'why-not': ['curious', 'glint', 'bow'], easy: ['happy', 'glint', 'double-nod'],
  'nice-good-job': ['happy', 'burst', 'double-nod'], 'all-finished': ['celebrate', 'burst', 'bow'], 'check-this': ['alert', 'beacon', 'present'],
  'dont-mute': ['concern', 'soft', 'bow'], donate: ['happy', 'gratitude', 'present'], 'be-my-guest': ['happy', 'invite', 'present'],
};

export const FIFI_VOICE_LINES = FUNGIST_VOICE_LINES.map((line) => {
  const [mood, particles, gesture] = FIFI_REACTIONS[line.id] || ['idle', 'soft', 'nod'];
  return { ...line, label: line.id === 'introduce' ? "I'm FiFi" : line.label, speech: line.id === 'introduce' ? "I'm FiFi!" : line.speech, file: FIFI_FILES[line.id], mood, particles, gesture, mascotId: 'fifi' };
});

const voiceLines = { fungist: FUNGIST_VOICE_LINES, fifi: FIFI_VOICE_LINES };
const linesByMascot = Object.fromEntries(Object.entries(voiceLines).map(([id, lines]) => [id, Object.fromEntries(lines.map((line) => [line.id, { ...line, mascotId: id }]))]));
let activeVoice = null;
let lastVoiceAt = 0;
const lastCueAt = new Map();

export function stopMascotVoice() {
  if (!activeVoice) return;
  activeVoice.pause();
  activeVoice.currentTime = 0;
  activeVoice = null;
}

export function getFungistVoiceLine(id) {
  return linesByMascot.fungist[id] || null;
}

export function getMascotVoiceLines(mascotId = 'fungist') { return voiceLines[mascotId] || voiceLines.fungist; }

function announceMascotSpeech(line) {
  if (typeof window === 'undefined' || !line) return;
  // Keep the bubble present long enough to comfortably read, even for the
  // longer support/update recordings. Consumers use this one event so a voice
  // can never become an unexplained background sound.
  const durationMs = Math.max(2_800, Math.min(8_000, 1_600 + String(line.speech || line.label).length * 58));
  const detail = { ...line, durationMs };
  window.dispatchEvent(new CustomEvent('neolib-mascot-speaking', { detail }));
  window.dispatchEvent(new CustomEvent('neolib-fungist-speaking', { detail }));
}

export function playMascotVoice(id, { mascotId = 'fungist', enabled = true, volume = 72, cooldownMs = 7_000, priority = false } = {}) {
  if (!enabled || typeof Audio === 'undefined') return false;
  const selectedMascot = mascotId === 'fifi' ? 'fifi' : 'fungist';
  const line = linesByMascot[selectedMascot][id];
  if (!line) return false;
  const now = Date.now();
  const lastForCue = lastCueAt.get(id) || 0;
  // Minor acknowledgements wait a little longer than focused alerts. Priority
  // alerts can replace a short acknowledgement, but never create two voices.
  if (now - lastForCue < cooldownMs || (!priority && now - lastVoiceAt < 2_500)) return false;
  stopMascotVoice();
  const audio = new Audio(voiceAsset(selectedMascot, line.file));
  audio.preload = 'metadata';
  audio.volume = Math.max(0, Math.min(100, Number(volume) || 72)) / 100;
  activeVoice = audio;
  lastVoiceAt = now;
  lastCueAt.set(id, now);
  audio.addEventListener('ended', () => { if (activeVoice === audio) activeVoice = null; }, { once: true });
  audio.addEventListener('error', () => { if (activeVoice === audio) activeVoice = null; }, { once: true });
  audio.play().then(() => announceMascotSpeech(line)).catch(() => { if (activeVoice === audio) activeVoice = null; });
  return true;
}

export function playFungistVoice(id, options = {}) { return playMascotVoice(id, { ...options, mascotId: 'fungist' }); }
export function stopFungistVoice() { stopMascotVoice(); }

export function fungistChatVoiceFor(text = '') {
  const value = String(text).toLowerCase().trim();
  if (/\bwhy not\b/.test(value)) return 'why-not';
  if (/^(sure|yeah|yes)\b/.test(value)) return 'sure-yeah';
  if (/^(yep|yup|ok|okay|do it|go)\b/.test(value)) return 'ack-yup-yup';
  if (/\b(thanks|thank you|thx|got it|alright)\b/.test(value)) return 'ack-alright-then';
  if (/\b(error|broken|bug|fail|crash|not work|doesn.t work|issue)\b/.test(value)) return 'ouff';
  if (/\b(help|how do i|how can i|can you|what should)\b/.test(value)) return 'ack-ill-help';
  if (value.split(/\s+/).length > 12) return 'ack-i-see';
  return 'ack-mhm';
}
