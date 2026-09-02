// Fungist voice clips are deliberately streamed only when an event needs one.
// There is no loop, resident decoder, or background timer: Rest Mode simply
// never calls this module. A shared cooldown keeps the companion helpful rather
// than chatty when several launcher events land together.
const voiceAsset = (filename) => `${import.meta.env.BASE_URL}mascot/voice/${filename}`;

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

const lineById = Object.fromEntries(FUNGIST_VOICE_LINES.map((line) => [line.id, line]));
let activeVoice = null;
let lastVoiceAt = 0;
const lastCueAt = new Map();

export function stopFungistVoice() {
  if (!activeVoice) return;
  activeVoice.pause();
  activeVoice.currentTime = 0;
  activeVoice = null;
}

export function getFungistVoiceLine(id) {
  return lineById[id] || null;
}

function announceFungistSpeech(line) {
  if (typeof window === 'undefined' || !line) return;
  // Keep the bubble present long enough to comfortably read, even for the
  // longer support/update recordings. Consumers use this one event so a voice
  // can never become an unexplained background sound.
  const durationMs = Math.max(2_800, Math.min(8_000, 1_600 + String(line.speech || line.label).length * 58));
  window.dispatchEvent(new CustomEvent('neolib-fungist-speaking', { detail: { ...line, durationMs } }));
}

export function playFungistVoice(id, { enabled = true, volume = 72, cooldownMs = 7_000, priority = false } = {}) {
  if (!enabled || typeof Audio === 'undefined') return false;
  const line = lineById[id];
  if (!line) return false;
  const now = Date.now();
  const lastForCue = lastCueAt.get(id) || 0;
  // Minor acknowledgements wait a little longer than focused alerts. Priority
  // alerts can replace a short acknowledgement, but never create two voices.
  if (now - lastForCue < cooldownMs || (!priority && now - lastVoiceAt < 2_500)) return false;
  stopFungistVoice();
  const audio = new Audio(voiceAsset(line.file));
  audio.preload = 'metadata';
  audio.volume = Math.max(0, Math.min(100, Number(volume) || 72)) / 100;
  activeVoice = audio;
  lastVoiceAt = now;
  lastCueAt.set(id, now);
  audio.addEventListener('ended', () => { if (activeVoice === audio) activeVoice = null; }, { once: true });
  audio.addEventListener('error', () => { if (activeVoice === audio) activeVoice = null; }, { once: true });
  audio.play().then(() => announceFungistSpeech(line)).catch(() => { if (activeVoice === audio) activeVoice = null; });
  return true;
}

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
