export const NEWS_FEED_URL = 'https://raw.githubusercontent.com/fufugis/Neo-Lib-Launcher/main/announcements.json';
export const NEWS_STORAGE_KEY = 'neolib:news-inbox:v1';
export const NEWS_CHECK_MS = 60 * 60 * 1000;
export const NEWS_STARTUP_DELAY_MS = 60 * 1000;
export const MAX_FEED_BYTES = 256 * 1024;
const MAX_INBOX = 1000;
const MAX_SEEN = 10000;
const validId = value => typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,95}$/.test(value);

export function newsVoiceOptions(settings = {}) {
  const configuredVolume = Number(settings.fungistVoiceVolume ?? 72);
  const volume = Number.isFinite(configuredVolume) ? Math.max(0, Math.min(100, configuredVolume)) : 72;
  return {
    mascotId: settings.mascotId === 'fifi' ? 'fifi' : 'fungist', volume, cooldownMs: 7000,
    enabled: settings.fungistEnabled !== false && settings.soundsEnabled !== false
      && settings.fungistVoiceEnabled !== false && settings.soundPack !== 'none' && volume > 0,
  };
}

export function safeNewsLink(value) {
  if (!value) return '';
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && String(value).length <= 2048 ? url.href : '';
  } catch { return ''; }
}

function normalizeMessage(raw) {
  if (!raw || !validId(raw.id) || typeof raw.title !== 'string' || !raw.title.trim() || raw.title.length > 160
    || typeof raw.body !== 'string' || !raw.body.trim() || raw.body.length > 8000) throw new Error('Invalid news message');
  for (const key of ['publishedAt', 'expiresAt']) {
    if (raw[key] != null && raw[key] !== '' && (typeof raw[key] !== 'string' || !Number.isFinite(Date.parse(raw[key])))) throw new Error('Invalid news date');
  }
  if (raw.link && !safeNewsLink(raw.link)) throw new Error('Unsafe news link');
  return { id: raw.id, title: raw.title.trim(), body: raw.body.trim(), link: safeNewsLink(raw.link),
    publishedAt: raw.publishedAt || '', expiresAt: raw.expiresAt || '' };
}

export function normalizeNewsFeed(raw, now = Date.now()) {
  if (!raw || raw.schemaVersion !== 1 || !Array.isArray(raw.messages) || raw.messages.length > 100) throw new Error('Invalid news feed');
  const messages = raw.messages.map(normalizeMessage);
  if (new Set(messages.map(message => message.id)).size !== messages.length) throw new Error('Duplicate news ID');
  return messages.filter(message => (!message.publishedAt || Date.parse(message.publishedAt) <= now)
    && (!message.expiresAt || Date.parse(message.expiresAt) > now));
}

export function normalizeNewsInbox(raw) {
  const seenIds = [...new Set((Array.isArray(raw?.seenIds) ? raw.seenIds : []).filter(validId))].slice(0, MAX_SEEN);
  const ids = new Set();
  const messages = [];
  for (const entry of (Array.isArray(raw?.messages) ? raw.messages : []).slice(0, MAX_INBOX)) {
    try {
      const message = normalizeMessage(entry);
      if (ids.has(message.id)) continue;
      ids.add(message.id);
      messages.push({ ...message, read: entry.read === true, notified: entry.notified === true });
      if (!seenIds.includes(message.id) && seenIds.length < MAX_SEEN) seenIds.push(message.id);
    } catch { /* Corrupt stored entries never become executable or block startup. */ }
  }
  const timestamp = Number(raw?.lastCheckedAt);
  return { messages, seenIds, lastCheckedAt: Number.isFinite(timestamp) && timestamp > 0 ? timestamp : 0 };
}

export function mergeNewsFeed(inbox, feed, now = Date.now()) {
  const next = normalizeNewsInbox(inbox);
  const seen = new Set(next.seenIds);
  for (const message of feed) {
    if (seen.has(message.id) || next.messages.length >= MAX_INBOX || seen.size >= MAX_SEEN) continue;
    next.messages.unshift({ ...message, read: false, notified: false });
    seen.add(message.id);
  }
  return { ...next, seenIds: [...seen], lastCheckedAt: now };
}

export function updateNewsMessage(inbox, id, action) {
  const next = normalizeNewsInbox(inbox);
  if (action === 'delete') return { ...next, messages: next.messages.filter(message => message.id !== id) };
  return { ...next, messages: next.messages.map(message => message.id === id
    ? { ...message, ...(action === 'read' ? { read: true, notified: true } : action === 'notify' ? { notified: true } : {}) } : message) };
}

export function newsCheckDue(inbox, now = Date.now()) {
  return !inbox.lastCheckedAt || now < inbox.lastCheckedAt || now - inbox.lastCheckedAt >= NEWS_CHECK_MS;
}

export async function fetchNewsFeed({ fetchImpl = fetch, signal, now = Date.now() } = {}) {
  const response = await fetchImpl(NEWS_FEED_URL, { signal, cache: 'no-cache', credentials: 'omit', referrerPolicy: 'no-referrer', redirect: 'error' });
  if (!response.ok) throw new Error('News unavailable');
  const length = Number(response.headers?.get('content-length'));
  if (length > MAX_FEED_BYTES) throw new Error('News feed too large');
  // Bound streaming reads, not just an untrusted Content-Length header.
  const reader = response.body?.getReader?.();
  if (!reader) throw new Error('News stream unavailable');
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_FEED_BYTES) throw new Error('News feed too large');
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    if (signal?.aborted) throw new Error('News cancelled');
    return normalizeNewsFeed(JSON.parse(text), now);
  } finally { await reader.cancel().catch(() => {}); }
}
