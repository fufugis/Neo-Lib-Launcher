import { LOUNGE_SAMPLE_GROUPS, LOUNGE_SAMPLE_ROLES, loungeSampleAttenuation, loungeSampleStart, normalizeLoungeSamples } from './lounge-sample-model.mjs';

const files = import.meta.glob('../../assets/lounge/sounds/*.mp3', { eager: true, query: '?url', import: 'default' });
const urls = Object.fromEntries(Object.entries(files).map(([path, url]) => [path.split('/').at(-1).replace(/\.mp3$/i, ''), url]));
const decoded = new Map();
const activeSources = new Set();
const lastPlayed = Object.create(null);
let context = null;
let generation = 0;

function audioContext() {
  if (typeof window === 'undefined') return null;
  try { return context ||= new (window.AudioContext || window.webkitAudioContext)(); }
  catch { return null; }
}

async function loadSample(id, audio) {
  if (!urls[id]) return null;
  if (!decoded.has(id)) decoded.set(id, fetch(urls[id]).then(response => {
    if (!response.ok) throw new Error('Sample unavailable');
    return response.arrayBuffer();
  }).then(bytes => audio.decodeAudioData(bytes)).then(buffer => ({ buffer, attenuation: loungeSampleAttenuation(buffer), start: loungeSampleStart(buffer) })).catch(() => {
    decoded.delete(id);
    return null;
  }));
  return decoded.get(id);
}

export function stopLoungeSamples() {
  generation += 1;
  for (const source of activeSources) { try { source.stop(); } catch { /* already finished */ } }
  activeSources.clear();
}

async function playSample(role, volume, selections, preview = false) {
  if (!Object.hasOwn(LOUNGE_SAMPLE_ROLES, role)) return false;
  const level = Number(volume);
  if (!Number.isFinite(level) || level <= 0) return false;
  const id = normalizeLoungeSamples(selections)[role];
  if (id === 'off') return false;
  const now = Date.now();
  if (!preview && now - (lastPlayed[role] || 0) < (role === 'move' ? 140 : 90)) return false;
  const audio = audioContext();
  if (!audio) return false;
  lastPlayed[role] = now;
  const session = generation;
  try {
    if (audio.state === 'suspended') await audio.resume();
    const sample = await loadSample(id, audio);
    if (!sample || session !== generation) return false;
    const source = audio.createBufferSource();
    const gain = audio.createGain();
    source.buffer = sample.buffer;
    const peak = Math.min(100, Math.max(0, level)) / 100 * 0.25 * (role === 'move' && !preview ? 0.65 : 1) * sample.attenuation;
    const offset = role === 'move' && !preview ? sample.start : 0;
    const duration = role === 'move' && !preview ? Math.min(0.65, Math.max(0, sample.buffer.duration - offset)) : sample.buffer.duration;
    if (duration <= 0) return false;
    for (const previous of activeSources) { try { previous.stop(); } catch { /* already finished */ } }
    activeSources.clear();
    gain.gain.setValueAtTime(peak, audio.currentTime);
    if (role === 'move' && !preview && duration > 0.08) gain.gain.linearRampToValueAtTime(0, audio.currentTime + duration);
    source.connect(gain).connect(audio.destination);
    source.onended = () => activeSources.delete(source);
    activeSources.add(source);
    source.start(audio.currentTime, offset);
    if (role === 'move' && !preview) source.stop(audio.currentTime + duration);
    return true;
  } catch { return false; }
}

export function playLoungeSample(role, volume, selections) {
  return playSample(role, volume, selections);
}

export function previewLoungeSample(role, id, volume) {
  if (!Object.hasOwn(LOUNGE_SAMPLE_ROLES, role) || !Object.values(LOUNGE_SAMPLE_GROUPS).some(group => group.includes(id))) return Promise.resolve(false);
  stopLoungeSamples();
  return playSample(role, volume, { [role]: id }, true);
}
