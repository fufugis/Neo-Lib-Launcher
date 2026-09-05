import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, Archive, BellRing, Bot, ChevronRight, Send, Settings2, X } from 'lucide-react';
import { playFungistCue } from '../lib/sound';
import { fungistChatVoiceFor, playFungistVoice, stopFungistVoice } from '../lib/mascotVoice';

// Vite's production base is relative (`./`) so these work in both the browser
// and Electron's file:// renderer. Root paths such as `/mascot/...` resolve to
// the wrong place in a packaged EXE and show only an image's fallback text.
const mascotAsset = (filename) => `${import.meta.env.BASE_URL}mascot/${filename}`;
const ASSETS = {
  // The normal dock uses the new 3D render pair. A small separate blink
  // sprite gives the idle loop a real eye-close moment without video/GIF
  // decoding, a canvas, or a continuously-running render surface.
  stand: mascotAsset('fungist-3d-idle.png'),
  blink: mascotAsset('fungist-3d-blink.png'),
  fly: mascotAsset('fungist-3d-fly.png'),
  complete: mascotAsset('fungist-3d-complete.png'),
  smile: mascotAsset('fungist-3d-idle.png'),
  // The flight pose stays on-screen for the important alert, while the
  // surrounding warning glow/fireworks carry the alarm state. This avoids a
  // jarring visual jump back to the older flat shocked artwork after arrival.
  shocked: mascotAsset('fungist-3d-fly.png'),
  sleep: mascotAsset('fungist-3d-sleep.png'),
};

const SPARKLES = [
  { left: '8%', top: '24%', delay: 0 }, { left: '82%', top: '14%', delay: 0.18 },
  { left: '91%', top: '62%', delay: 0.36 }, { left: '15%', top: '82%', delay: 0.52 },
  { left: '52%', top: '4%', delay: 0.68 },
];

const FIREWORKS = [
  { x: -56, y: -42, delay: 0 }, { x: 58, y: -33, delay: 0.18 },
  { x: 67, y: 43, delay: 0.36 }, { x: -63, y: 50, delay: 0.54 },
];

function notificationEnabled(settings, key) {
  return settings?.[key] !== false;
}

function noticeCooldownMs(notice) {
  if (notice?.kind === 'health' && notice.level === 'major') return 5 * 60_000;
  if (notice?.kind === 'health') return 15 * 60_000;
  return 6 * 60 * 60_000;
}

function whyFor(notice) {
  if (notice?.kind === 'health' && notice.level === 'major') return 'Your Game Ready monitor saw sustained high CPU or RAM use. This major alert is limited to once every five minutes.';
  if (notice?.kind === 'health') return 'Your Game Ready monitor saw elevated CPU or RAM use. This reminder is limited to once every fifteen minutes.';
  if (notice?.kind === 'news') return 'A newly detected article belongs to a game you marked as a favourite.';
  if (notice?.kind === 'game-update') return 'A checked update source confirmed a newer version for one of your favourited games.';
  if (notice?.kind === 'app-update') return 'NEO-LIB found a release newer than the version you are running.';
  return 'This was triggered by one of your enabled Fungist reactions.';
}

function shortTime(value) {
  try { return new Date(value).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return ''; }
}

function shortMemory(bytes) {
  const value = Number(bytes || 0);
  if (value >= 1024 ** 3) return `${(value / 1024 ** 3).toFixed(value >= 10 * 1024 ** 3 ? 0 : 1)} GB`;
  if (value >= 1024 ** 2) return `${Math.round(value / 1024 ** 2)} MB`;
  return '0 MB';
}

// This deliberately recognises only clear game/client process names. The
// snapshot is still useful when there is no match: the player sees the actual
// top CPU/RAM apps rather than NEO-LIB inventing a game name.
const GAME_PROCESS_HINTS = /(?:overwatch|warcraft|worldofwarcraft|diablo|hearthstone|starcraft|valorant|leagueoflegends|leagueclient|fortnite|apex|minecraft|eldenring|cyberpunk|forza|game-win64-shipping)/i;

function isLikelyGameProcess(process) {
  return GAME_PROCESS_HINTS.test(`${process?.name || ''} ${process?.path || ''}`);
}

function commandKey(value = '') {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function gameWords(game) {
  return [game?.name, ...(game?.genres || []), ...(game?.genreTags || []), ...(game?.genreProfile?.tags || []), ...(game?.genreProfile?.core || [])]
    .filter(Boolean).join(' ');
}

function closestLibraryGames(games, query) {
  const needle = commandKey(query);
  if (!needle) return [];
  return (games || []).map((game) => {
    const name = commandKey(game.name);
    const words = commandKey(gameWords(game));
    const requestedWords = needle.split(' ').filter(Boolean);
    let score = 0;
    if (name === needle) score += 100;
    if (name.includes(needle)) score += 80;
    if (needle.includes(name)) score += 55;
    if (requestedWords.length > 1 && requestedWords.every((word) => name.split(' ').includes(word))) score += 70;
    score += needle.split(' ').filter((word) => word.length > 1 && words.includes(word)).length * 8;
    return { game, score };
  }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score).map((item) => item.game);
}

// Typed commands resolve locally from the visible library. They never cause a
// background launch: the player must still click the named, guarded Launch
// confirmation that appears in chat.
function libraryCommandFor(text, games) {
  const raw = String(text || '').trim();
  const match = raw.match(/^(?:please\s+)?launch\s+(.+?)\s*[.!?]*$/i);
  if (!match) return null;
  const request = match[1].replace(/\b(?:a|the)\s+/i, '').replace(/\bgame\b/i, '').trim();
  const words = commandKey(request);
  let candidates = [];
  if (/\brandom\b/.test(words)) {
    const genreWords = words.replace(/\brandom\b|\bgame\b/g, '').trim().split(' ').filter(Boolean);
    candidates = (games || []).filter((game) => genreWords.every((word) => commandKey(gameWords(game)).includes(word)));
    if (!candidates.length) candidates = games || [];
    const chosen = candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : null;
    return chosen ? { game: chosen, text: `I chose ${chosen.name} from your visible library. Ready when you are.`, actionLabel: `Launch ${chosen.name}` } : { text: 'Your visible library is empty right now, so I have nothing safe to choose.' };
  }
  candidates = closestLibraryGames(games, request);
  const chosen = candidates[0];
  return chosen
    ? { game: chosen, text: `${chosen.name} is ready. I will wait for your confirmation.`, actionLabel: `Launch ${chosen.name}` }
    : { text: `I could not match “${request}” in your visible library. Try the game name exactly, or ask me to help you find something similar.` };
}

function QuickSetting({ label, value, onChange }) {
  return <div className="flex items-center gap-2 rounded-xl border border-[rgb(var(--border)/0.68)] bg-[rgb(var(--surface)/0.42)] px-2.5 py-2"><span className="min-w-0 flex-1 text-[10px] font-bold text-ink">{label}</span><button type="button" role="switch" aria-label={label} aria-checked={value} onClick={() => onChange?.(!value)} className={`relative h-5 w-9 rounded-full transition-colors ${value ? 'bg-[rgb(var(--accent))]' : 'bg-[rgb(var(--border)/0.8)]'}`}><span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-4' : 'translate-x-0.5'}`} /></button></div>;
}

function messageFor({ healthState, newsAlert, favouriteUpdate, appUpdate, notificationSettings }) {
  if (healthState === 'high' && notificationEnabled(notificationSettings, 'pcHigh')) return {
    key: 'pc-high', level: 'major', title: 'Hey — your PC needs attention',
    body: 'CPU or RAM use is staying very high. Let’s check what is competing with your game before you launch.',
    action: 'Show performance', kind: 'health',
  };
  if (newsAlert && notificationEnabled(notificationSettings, 'favouriteNews')) return {
    key: `news-${newsAlert.id}`, level: 'minor', title: `News for ${newsAlert.gameName || 'a favourite'}`,
    body: newsAlert.title || 'Something new just landed.', action: 'Read news', kind: 'news',
  };
  if (favouriteUpdate && notificationEnabled(notificationSettings, 'favouriteUpdates')) return {
    key: `game-update-${favouriteUpdate.id}`, level: 'minor', title: `${favouriteUpdate.name} has an update`,
    body: 'A favourited game has a verified newer version ready to check out.', action: 'View game', kind: 'game-update',
  };
  if (appUpdate && notificationEnabled(notificationSettings, 'appUpdates')) return {
    key: `neolib-${appUpdate.latestVersion || 'available'}`, level: 'minor', title: 'A NEO-LIB update is ready',
    body: appUpdate.latestVersion ? `Version ${appUpdate.latestVersion} is available.` : 'A newer NEO-LIB release is available.',
    action: 'See update', kind: 'app-update',
  };
  if (healthState === 'check' && notificationEnabled(notificationSettings, 'pcCheck')) return {
    key: 'pc-check', level: 'minor', title: 'Quick PC check',
    body: 'Your CPU or RAM use is elevated. I can show you what to check before gaming.', action: 'Show performance', kind: 'health',
  };
  return null;
}

function voiceForNotice(notice) {
  // Welcome is never a general notice voice. It is reserved for the one
  // post-intro greeting below, otherwise a harmless re-render or re-shown
  // notice can make it sound as if NEO-LIB has just started again.
  if (notice?.kind === 'welcome') return '';
  if (notice?.kind === 'news') return 'news';
  if (notice?.kind === 'game-update') return 'check-this';
  if (notice?.kind === 'app-update') return 'neolib-update';
  if (notice?.kind === 'health' && notice.level === 'major') return 'attention';
  if (notice?.kind === 'health') return 'ouff';
  return '';
}

/**
 * Fungist uses compact transparent pose assets rather than video/GIF playback.
 * His docked motion is a deliberately slow transform and sparse pose swaps;
 * all of it stops because the whole companion is removed in Rest Mode.
 */
export default function FungistMascot({
  enabled = true,
  resting = false,
  healthState = 'checking',
  newsAlert = null,
  favouriteUpdate = null,
  appUpdate = null,
  notificationSettings = {},
  onOpenHealth,
  externalRunningGame = null,
  onScanRunningGame,
  onEnableExternalRest,
  onOpenNews,
  onOpenGame,
  onOpenAppUpdate,
  onDismissNews,
  onAskAi,
  onOpenSettings,
  inbox = [],
  chatHistory = [],
  onSaveChatHistory,
  onClearChatHistory,
  onRecordNotice,
  onClearInbox,
  onUpdatePreferences,
  aiReady = false,
  aiModel = 'Gemini 2.5 Flash',
  soundsEnabled = true,
  voiceEnabled = true,
  voiceVolume = 72,
  completion = null,
  launchCelebration = null,
  welcomeKey = 0,
  dockPosition = null,
  onOpenHome,
  libraryGames = [],
  onLaunchRequested,
  onReportBug,
}) {
  const [notice, setNotice] = React.useState(null);
  const [chatOpen, setChatOpen] = React.useState(false);
  const [question, setQuestion] = React.useState('');
  const [asking, setAsking] = React.useState(false);
  const [blinking, setBlinking] = React.useState(false);
  const [arrived, setArrived] = React.useState(false);
  const [completing, setCompleting] = React.useState(false);
  const [smiling, setSmiling] = React.useState(false);
  const [idlePulse, setIdlePulse] = React.useState(false);
  const [idleMoment, setIdleMoment] = React.useState('');
  const [sleeping, setSleeping] = React.useState(false);
  const [spokenLine, setSpokenLine] = React.useState(null);
  const [hovering, setHovering] = React.useState(false);
  const [welcoming, setWelcoming] = React.useState(false);
  const [showWhy, setShowWhy] = React.useState(false);
  const [contextOpen, setContextOpen] = React.useState(false);
  const [contextTab, setContextTab] = React.useState('inbox');
  const [completionMessage, setCompletionMessage] = React.useState('');
  const [runningGameScan, setRunningGameScan] = React.useState({ state: 'idle', message: '' });
  const [backgroundCheck, setBackgroundCheck] = React.useState({ state: 'idle', message: '', cpu: [], memory: [], likelyGame: null });
  const [viewport, setViewport] = React.useState(() => ({ width: typeof window === 'undefined' ? 1280 : window.innerWidth, height: typeof window === 'undefined' ? 800 : window.innerHeight }));
  // Fungist has one user-owned "home perch" within the lower-right dock. All
  // dramatic flight targets are temporary offsets from this saved position.
  const clampDockPosition = React.useCallback((value) => {
    // Keep Fungist—and his hover text—inside even a compact resized window.
    // The ordinary dock sits 18px from the right and 116px from the bottom;
    // reserve his own footprint plus a little speech-bubble breathing room.
    const maxLeft = Math.min(360, Math.max(0, viewport.width - 194));
    const maxUp = Math.min(360, Math.max(0, viewport.height - 332));
    return {
      x: Math.max(-maxLeft, Math.min(0, Math.round(Number(value?.x) || 0))),
      y: Math.max(-maxUp, Math.min(0, Math.round(Number(value?.y) || 0))),
    };
  }, [viewport.height, viewport.width]);
  const [dock, setDock] = React.useState(() => clampDockPosition(dockPosition));
  const lastNoticeAt = React.useRef(new Map());
  const smileTimer = React.useRef(null);
  const chatScrollRef = React.useRef(null);
  const chatThinkingTimer = React.useRef(null);
  const spokenLineTimer = React.useRef(null);
  const startupWelcomePlayed = React.useRef(false);
  const dockDrag = React.useRef(null);
  const dockDragCleanup = React.useRef(null);
  const suppressDockClick = React.useRef(false);

  React.useEffect(() => {
    if (!dockDrag.current) setDock(clampDockPosition(dockPosition));
  }, [dockPosition?.x, dockPosition?.y, clampDockPosition]);

  React.useEffect(() => () => dockDragCleanup.current?.(), []);

  const beginDockDrag = React.useCallback((event) => {
    // Dragging is a quiet docking adjustment, not an alternative interaction
    // while Fungist is deliberately flying to an alert/chat/launch target.
    if (event.button !== 0 || launchCelebration?.key || chatOpen || notice?.level === 'major') return;
    dockDragCleanup.current?.();
    dockDrag.current = { pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY, start: dock, moved: false };
    const move = (moveEvent) => {
      const drag = dockDrag.current;
      if (!drag || moveEvent.pointerId !== drag.pointerId) return;
      const next = clampDockPosition({ x: drag.start.x + moveEvent.clientX - drag.clientX, y: drag.start.y + moveEvent.clientY - drag.clientY });
      if (Math.abs(next.x - drag.start.x) > 4 || Math.abs(next.y - drag.start.y) > 4) drag.moved = true;
      setDock(next);
    };
    let cleanup = () => {};
    const finish = (upEvent) => {
      const drag = dockDrag.current;
      if (!drag || upEvent.pointerId !== drag.pointerId) return;
      dockDrag.current = null;
      cleanup();
      if (drag.moved) {
        suppressDockClick.current = true;
        setDock((current) => {
          const saved = clampDockPosition(current);
          onUpdatePreferences?.({ fungistDockPosition: saved });
          return saved;
        });
      }
    };
    cleanup = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
      if (dockDragCleanup.current === cleanup) dockDragCleanup.current = null;
    };
    dockDragCleanup.current = cleanup;
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
  }, [chatOpen, clampDockPosition, dock, launchCelebration?.key, notice?.level, onUpdatePreferences]);

  React.useEffect(() => {
    const resize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const candidate = messageFor({ healthState, newsAlert, favouriteUpdate, appUpdate, notificationSettings });
  React.useEffect(() => {
    if (resting || !enabled) { setNotice(null); setChatOpen(false); setContextOpen(false); return; }
    if (!candidate) { setNotice(null); return; }
    const now = Date.now();
    const lastShown = lastNoticeAt.current.get(candidate.key) || 0;
    if (now - lastShown < noticeCooldownMs(candidate)) return;
    lastNoticeAt.current.set(candidate.key, now);
    setShowWhy(false);
    setNotice(candidate);
    onRecordNotice?.({ ...candidate, createdAt: now });
  }, [candidate?.key, enabled, resting]);

  // The greeting is deliberately renderer-only. It runs after the intro has
  // finished and never calls launch, scan, external-link, or launcher APIs.
  // A real health/news alert still takes priority over a friendly hello.
  React.useEffect(() => {
    if (!welcomeKey || !enabled || resting || candidate) return undefined;
    setSleeping(false);
    setWelcoming(true);
    setNotice({ key: `welcome-${welcomeKey}`, level: 'minor', kind: 'welcome', title: 'Welcome back to NEO-LIB', body: 'Your library is ready whenever you are. I will keep an eye on the small things.', action: 'Open Home' });
    const timer = window.setTimeout(() => {
      setNotice((current) => current?.key === `welcome-${welcomeKey}` ? null : current);
      setWelcoming(false);
    }, 6_000);
    return () => window.clearTimeout(timer);
  }, [welcomeKey, enabled, resting, candidate?.key]);

  // The actual greeting has a stricter lifetime than a normal notice: once
  // per application window. sessionStorage survives a renderer repaint or
  // hot reload but is cleared when the desktop window is closed.
  React.useEffect(() => {
    if (!welcomeKey || !enabled || resting || startupWelcomePlayed.current || !soundsEnabled || !voiceEnabled) return;
    const storageKey = 'neolib-fungist-startup-welcome-played';
    try {
      if (window.sessionStorage.getItem(storageKey) === '1') {
        startupWelcomePlayed.current = true;
        return;
      }
      window.sessionStorage.setItem(storageKey, '1');
    } catch {
      // The in-memory guard still protects environments where session storage
      // is unavailable.
    }
    startupWelcomePlayed.current = true;
    playFungistVoice('welcome', { volume: voiceVolume, cooldownMs: 0, priority: true });
  }, [welcomeKey, enabled, resting, soundsEnabled, voiceEnabled, voiceVolume]);

  React.useEffect(() => {
    if (!contextOpen) return undefined;
    const closeIfOutside = (event) => {
      if (event.target.closest?.('[data-testid="fungist-context"]') || event.target.closest?.('[data-testid="fungist-mascot"]')) return;
      setContextOpen(false);
    };
    document.addEventListener('pointerdown', closeIfOutside);
    return () => document.removeEventListener('pointerdown', closeIfOutside);
  }, [contextOpen]);

  // When nothing needs attention for a while, Fungist takes a small nap. Any
  // alert, chat, or click wakes him immediately; Rest Mode still removes him.
  React.useEffect(() => {
    if (!enabled || resting || notice || chatOpen || !notificationEnabled(notificationSettings, 'idleNap')) { setSleeping(false); return undefined; }
    const timer = window.setTimeout(() => setSleeping(true), 150_000);
    return () => window.clearTimeout(timer);
  }, [enabled, resting, notice?.key, chatOpen, notificationSettings?.idleNap]);

  // Short, irregular blink swaps plus varied little moments make the
  // docked companion feel alive without turning him into a costly video/GIF.
  // All timers stop immediately in Rest Mode or when the mascot is hidden.
  React.useEffect(() => {
    if (!enabled || resting || sleeping) return undefined;
    let blinkTimer;
    let reopenTimer;
    const blink = () => {
      setBlinking(true);
      reopenTimer = window.setTimeout(() => { setBlinking(false); blinkTimer = window.setTimeout(blink, 4_200 + Math.round(Math.random() * 3_300)); }, 150);
    };
    blinkTimer = window.setTimeout(blink, 2_700 + Math.round(Math.random() * 2_800));
    return () => { window.clearTimeout(blinkTimer); window.clearTimeout(reopenTimer); };
  }, [enabled, resting, sleeping]);

  // Voice clips may be started by the companion itself, the launch flow, the
  // support action, Settings previews, or the tutorial. They all publish the
  // same small event, so Fungist always shows the exact line he is delivering
  // instead of becoming a disembodied background voice.
  React.useEffect(() => {
    const showSpeech = (event) => {
      const line = event.detail;
      if (!line?.speech || !enabled || (resting && !launchCelebration?.key)) return;
      window.clearTimeout(spokenLineTimer.current);
      setSleeping(false);
      setSpokenLine(line);
      spokenLineTimer.current = window.setTimeout(() => setSpokenLine(null), Number(line.durationMs) || 3_800);
    };
    window.addEventListener('neolib-fungist-speaking', showSpeech);
    return () => {
      window.removeEventListener('neolib-fungist-speaking', showSpeech);
      window.clearTimeout(spokenLineTimer.current);
    };
  }, [enabled, resting, launchCelebration?.key]);

  React.useEffect(() => {
    if (!enabled || resting || sleeping || notice || chatOpen) { setIdlePulse(false); setIdleMoment(''); return undefined; }
    let beginTimer;
    let endTimer;
    const playIdleMoment = () => {
      const moment = ['smile', 'curious', 'stretch', 'sparkle', 'greet'][Math.floor(Math.random() * 5)];
      setIdlePulse(true);
      setIdleMoment(moment);
      setSmiling(moment === 'smile');
      endTimer = window.setTimeout(() => { setIdlePulse(false); setIdleMoment(''); setSmiling(false); beginTimer = window.setTimeout(playIdleMoment, 4_800 + Math.round(Math.random() * 3_600)); }, moment === 'sparkle' ? 1_650 : moment === 'greet' ? 1_450 : 1_250);
    };
    beginTimer = window.setTimeout(playIdleMoment, 3_900 + Math.round(Math.random() * 2_800));
    return () => { window.clearTimeout(beginTimer); window.clearTimeout(endTimer); };
  }, [enabled, resting, sleeping, notice?.key, chatOpen]);

  // A minor alert gets three quick true-blink swaps, then returns to stillness.
  React.useEffect(() => {
    if (notice?.level !== 'minor') return undefined;
    const timers = [0, 125, 260, 395, 530, 665].map((delay, index) => window.setTimeout(() => setBlinking(index % 2 === 0), delay));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [notice?.key, notice?.level]);

  React.useEffect(() => {
    if (notice?.level !== 'major') { setArrived(false); return undefined; }
    const timer = window.setTimeout(() => setArrived(true), 620);
    return () => window.clearTimeout(timer);
  }, [notice?.key, notice?.level]);

  React.useEffect(() => {
    const completionKey = completion?.key || 0;
    if (!completionKey || resting || !enabled || !notificationEnabled(notificationSettings, 'completion')) { setCompleting(false); return undefined; }
    setCompleting(true);
    setCompletionMessage(String(completion?.label || 'Action completed'));
    if (soundsEnabled && voiceEnabled) {
      const label = String(completion?.label || '').toLowerCase();
      playFungistVoice(/all|every|library-wide|bulk/.test(label) ? 'all-finished' : /easy|quick|simple/.test(label) ? 'easy' : 'nice-good-job', { volume: voiceVolume, cooldownMs: 10_000 });
    } else if (soundsEnabled) playFungistCue('completed-ding');
    const timer = window.setTimeout(() => { setCompleting(false); setCompletionMessage(''); }, 1_850);
    return () => window.clearTimeout(timer);
  }, [completion?.key, completion?.label, enabled, resting, soundsEnabled, voiceEnabled, voiceVolume, notificationSettings?.completion]);

  React.useEffect(() => () => {
    window.clearTimeout(smileTimer.current);
    window.clearTimeout(chatThinkingTimer.current);
    window.clearTimeout(spokenLineTimer.current);
    stopFungistVoice();
  }, []);

  React.useEffect(() => {
    if (!chatOpen) return undefined;
    const frame = window.requestAnimationFrame(() => {
      if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [chatOpen, chatHistory.length, asking]);

  const soundedNotice = React.useRef('');
  React.useEffect(() => {
    if (!notice || !soundsEnabled || soundedNotice.current === notice.key) return;
    soundedNotice.current = notice.key;
    // The post-intro greeting above owns welcome audio. Do not replace it
    // with another voice or a generic cue through the alert pipeline.
    if (notice.kind === 'welcome') return;
    const voice = voiceForNotice(notice);
    if (voice && voiceEnabled) playFungistVoice(voice, { volume: voiceVolume, priority: notice.level === 'major' || notice.kind === 'app-update' });
    else playFungistCue(notice.level === 'major' ? 'warning' : notice.kind === 'health' ? 'attention' : 'hey');
  }, [notice?.key, notice?.kind, notice?.level, soundsEnabled, voiceEnabled, voiceVolume]);

  // A successful launch gets one short cheer even though the library enters
  // Rest Mode immediately afterwards. It is a finite transform-only moment;
  // no background FX, scan, or companion timer restarts for it.
  if (!enabled || (resting && !launchCelebration?.key)) return null;
  const major = notice?.level === 'major';
  const medium = Boolean(notice && !major);
  const launching = Boolean(launchCelebration?.key);
  const healthGlow = major ? 'rgba(255, 74, 92, .92)' : notice?.kind === 'health' || healthState === 'check' ? 'rgba(250, 204, 21, .92)' : notice ? 'rgba(74, 222, 128, .88)' : 'rgb(var(--accent) / .75)';
  // The dock is 18px from the right and 116px from the bottom. Moving by this
  // exact viewport-relative delta gives a genuine fly-to-centre / fly-home
  // motion without a video, timer, or continuously running animation.
  const flyX = Math.round(71 - viewport.width / 2 - dock.x);
  const flyY = Math.round(44 - viewport.height / 2 - dock.y);
  // The mascot is normally docked at (right: 18, bottom: 108). These deltas
  // put him just above the chat header rather than behind the chat panel.
  const chatFlyX = Math.round(18 - Math.min(150, Math.max(82, viewport.width * 0.105)) - dock.x);
  const chatFlyY = Math.round(-Math.min(430, Math.max(330, viewport.height * 0.48)) - dock.y);
  const launchOrigin = launchCelebration?.origin;
  const launchFlyX = Number.isFinite(launchOrigin?.x) ? Math.round(launchOrigin.x - (viewport.width - 77) - dock.x) : -190;
  const launchFlyY = Number.isFinite(launchOrigin?.y) ? Math.round(launchOrigin.y - (viewport.height - 175) - dock.y) : -210;
  const speaking = Boolean(spokenLine);
  const displayPose = major ? (!arrived ? 'fly' : 'shocked') : launching || spokenLine?.mood === 'celebrate' ? 'complete' : spokenLine?.mood === 'urgent' || spokenLine?.mood === 'concerned' ? 'shocked' : completing ? 'complete' : chatOpen || speaking ? 'smile' : smiling || idlePulse ? 'smile' : sleeping ? 'sleep' : blinking ? 'blink' : 'stand';
  const displayAsset = ASSETS[displayPose];

  const act = () => {
    if (!notice) {
      setChatOpen(true);
      if (soundsEnabled && voiceEnabled && !chatHistory.length) playFungistVoice('chat-open', { volume: voiceVolume, cooldownMs: 12_000 });
      return;
    }
    if (notice.kind === 'health') onOpenHealth?.();
    if (notice.kind === 'news') { onOpenNews?.(newsAlert); onDismissNews?.(); }
    if (notice.kind === 'game-update') onOpenGame?.(favouriteUpdate?.id);
    if (notice.kind === 'app-update') onOpenAppUpdate?.();
    if (notice.kind === 'welcome') onOpenHome?.();
    if (soundsEnabled && voiceEnabled) playFungistVoice('lets-do-this', { volume: voiceVolume, cooldownMs: 9_000 });
    else if (soundsEnabled) playFungistCue('good-ding');
    setSmiling(true);
    window.clearTimeout(smileTimer.current);
    smileTimer.current = window.setTimeout(() => setSmiling(false), 1_350);
    setNotice(null);
  };

  const dismiss = () => {
    if (notice?.kind === 'news') onDismissNews?.();
    setShowWhy(false);
    setNotice(null);
  };
  const toggleWhy = () => {
    setShowWhy((value) => {
      const next = !value;
      if (next && soundsEnabled && voiceEnabled) playFungistVoice('what-is-this', { volume: voiceVolume, cooldownMs: 10_000 });
      return next;
    });
  };
  const updateQuickNotifications = (patch) => onUpdatePreferences?.({ fungistNotifications: { ...notificationSettings, ...patch } });
  const scanRunningGame = async () => {
    if (!onScanRunningGame || runningGameScan.state === 'checking') return;
    setRunningGameScan({ state: 'checking', message: 'Checking your local library games…' });
    const result = await onScanRunningGame();
    if (result?.active && result?.game) {
      setRunningGameScan({ state: 'found', message: `${result.game.name} is running from another launcher. I can put NEO-LIB into low-usage Rest Mode until it closes.`, game: result.game });
      return;
    }
    setRunningGameScan({ state: result?.ok ? 'empty' : 'error', message: result?.message || 'I could not check running games right now.' });
  };
  const enableLowUsage = () => {
    const game = runningGameScan.game || externalRunningGame;
    const result = onEnableExternalRest?.(game);
    if (!result?.ok) setRunningGameScan({ state: 'error', message: result?.message || 'I could not enable Rest Mode for that game.' });
  };
  const inspectBackgroundApps = async () => {
    if (backgroundCheck.state === 'checking') return;
    if (!window.api?.inspectGamingPerformance) {
      setBackgroundCheck({ state: 'error', message: 'This Windows performance check is only available in the NEO-LIB desktop app.', cpu: [], memory: [], likelyGame: null });
      return;
    }
    setBackgroundCheck({ state: 'checking', message: 'Reading the heaviest Windows apps…', cpu: [], memory: [], likelyGame: null });
    try {
      const result = await window.api.inspectGamingPerformance();
      if (!result?.ok) throw new Error(result?.error || 'Windows performance details are unavailable.');
      const usable = (Array.isArray(result.processes) ? result.processes : []).filter((item) => !item?.protected && String(item?.name || '').toLowerCase() !== 'neolib');
      const cpu = [...usable].sort((a, b) => Number(b.cpuPercent || 0) - Number(a.cpuPercent || 0)).slice(0, 3);
      const memory = [...usable].sort((a, b) => Number(b.memoryBytes || 0) - Number(a.memoryBytes || 0)).slice(0, 3);
      const likelyGame = [...usable].filter(isLikelyGameProcess).sort((a, b) => (Number(b.memoryBytes || 0) + Number(b.cpuPercent || 0) * 1024 ** 3) - (Number(a.memoryBytes || 0) + Number(a.cpuPercent || 0) * 1024 ** 3))[0] || null;
      setBackgroundCheck({
        state: 'done', cpu, memory, likelyGame,
        message: likelyGame ? `${likelyGame.name} looks like the active game or game client.` : 'Here are the heaviest apps Windows can see right now.',
      });
    } catch (error) {
      setBackgroundCheck({ state: 'error', message: error?.message || 'I could not read Windows performance details right now.', cpu: [], memory: [], likelyGame: null });
    }
  };
  const submit = async (event) => {
    event.preventDefault();
    const text = question.trim();
    if (!text || asking) return;
    const sentAt = Date.now();
    const userMessage = { id: `user-${sentAt}`, role: 'user', text, createdAt: sentAt };
    const nextHistory = [...chatHistory, userMessage].slice(-80);
    onSaveChatHistory?.(nextHistory);
    setQuestion('');
    const command = libraryCommandFor(text, libraryGames);
    if (command) {
      const commandReply = { id: `fungist-${Date.now()}`, role: 'assistant', text: command.text, action: command.game ? { type: 'launch', gameId: command.game.id, label: command.actionLabel } : null, createdAt: Date.now() };
      onSaveChatHistory?.([...nextHistory, commandReply].slice(-80));
      if (soundsEnabled && voiceEnabled) playFungistVoice(command.game ? 'sure-yeah' : 'ouff', { volume: voiceVolume, cooldownMs: 8_000 });
      return;
    }
    setAsking(true);
    if (soundsEnabled && voiceEnabled) playFungistVoice(fungistChatVoiceFor(text), { volume: voiceVolume, cooldownMs: 8_000 });
    chatThinkingTimer.current = window.setTimeout(() => {
      if (soundsEnabled && voiceEnabled) playFungistVoice('thinking', { volume: voiceVolume, cooldownMs: 10_000 });
    }, 850);
    try {
      const result = await onAskAi?.(text, chatHistory, libraryGames);
      const failed = !result?.ok;
      const reply = result?.ok
        ? (result.text || 'The oracle heard you, but no answer arrived.')
        : `${result?.error || 'My signal is cloudy right now.'} If this keeps happening, please use the Feedback button at the top of NEO-LIB to send a bug report.`;
      onSaveChatHistory?.([...nextHistory, {
        id: `fungist-${Date.now()}`,
        role: 'assistant',
        text: reply,
        action: failed ? { type: 'feedback', label: 'Report a bug' } : null,
        createdAt: Date.now(),
      }].slice(-80));
    } catch {
      if (soundsEnabled && voiceEnabled) playFungistVoice('more-drama', { volume: voiceVolume, priority: true, cooldownMs: 8_000 });
      onSaveChatHistory?.([...nextHistory, {
        id: `fungist-${Date.now()}`,
        role: 'assistant',
        text: 'The signal is cloudy right now. If it keeps happening, please send a bug report with the Feedback button at the top of NEO-LIB.',
        action: { type: 'feedback', label: 'Report a bug' },
        createdAt: Date.now(),
      }].slice(-80));
    }
    finally { window.clearTimeout(chatThinkingTimer.current); setAsking(false); }
  };

  const launchFromChat = async (message, event) => {
    const game = (libraryGames || []).find((item) => item.id === message?.action?.gameId);
    if (!game || !onLaunchRequested) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const origin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    if (!window.api?.armGameLaunch) { onLaunchRequested(game, '', origin); return; }
    const armed = await window.api.armGameLaunch();
    if (!armed?.ok) {
      onSaveChatHistory?.([...chatHistory, { id: `fungist-${Date.now()}`, role: 'assistant', text: armed?.error || 'I could not confirm that launch. Please press the button again.', createdAt: Date.now() }].slice(-80));
      return;
    }
    onLaunchRequested(game, armed.token, origin);
  };

  return (
    <>
      <motion.div
        className={`pointer-events-none fixed ${chatOpen || launching ? 'z-[88]' : 'z-[85]'}`}
        initial={false}
        animate={major ? { x: dock.x + flyX, y: dock.y + flyY, scale: 1.24 } : launching ? { x: dock.x + launchFlyX, y: dock.y + launchFlyY, scale: 1.18, rotate: [0, -8, 7, 0] } : chatOpen ? { x: dock.x + chatFlyX, y: dock.y + chatFlyY, scale: 1.08 } : { x: dock.x, y: dock.y, scale: 1 }}
        transition={{ type: 'spring', stiffness: 210, damping: 22, mass: 0.72 }}
        data-testid="fungist-mascot"
        // Keep the companion clear of the permanent Friends / sponsored rail.
        style={{ right: 18, bottom: 116 }}
      >
        <div className="pointer-events-auto relative flex flex-col items-end">
          <AnimatePresence>
            {notice && (
              <motion.section
                initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.97 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className={`mb-1 w-[min(330px,calc(100vw-32px))] overflow-hidden rounded-2xl border shadow-2xl ${major ? 'bg-[rgb(var(--panel)/0.97)]' : 'bg-[rgb(var(--panel)/0.91)] backdrop-blur-xl'}`}
                style={{ borderColor: major ? 'rgb(251 75 92 / 0.85)' : 'rgb(var(--accent) / 0.62)', boxShadow: major ? '0 25px 90px -18px rgba(0,0,0,.9), 0 0 48px -14px rgba(251,75,92,.85)' : '0 18px 55px -20px rgba(0,0,0,.85), 0 0 26px -10px rgb(var(--accent)/.8)' }}
              >
                <div className="flex items-start gap-2 px-3.5 pb-2 pt-3">
                  <div className="min-w-0 flex-1"><p className="text-[9px] font-black uppercase tracking-[0.2em] text-[rgb(var(--accent-2))]">{major ? 'Fungist needs you' : 'Fungist says hey'}</p><h2 className="mt-1 text-[13px] font-black leading-snug text-ink">{notice.title}</h2><p className="mt-1 text-[11px] leading-relaxed text-muted">{notice.body}</p>{showWhy && <p className="mt-2 rounded-lg border border-[rgb(var(--accent)/0.2)] bg-[rgb(var(--accent)/0.06)] px-2 py-1.5 text-[9.5px] leading-relaxed text-muted">{whyFor(notice)}</p>}</div>
                  <button type="button" onClick={dismiss} className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted hover:bg-white/10 hover:text-ink" aria-label="Dismiss Fungist"><X size={14} /></button>
                </div>
                {notice.kind === 'health' && (
                  <div className="border-t border-[rgb(var(--border)/0.56)] px-3.5 py-2.5">
                    {runningGameScan.state === 'found' || externalRunningGame ? (
                      <div className="rounded-xl border border-emerald-300/35 bg-emerald-300/[0.08] px-2.5 py-2">
                        <p className="text-[10px] font-bold leading-relaxed text-ink">{runningGameScan.state === 'found' ? runningGameScan.message : `${externalRunningGame.name} is running from another launcher.`}</p>
                        <button type="button" onClick={enableLowUsage} className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-emerald-400 px-2.5 py-1.5 text-[9.5px] font-black text-emerald-950 shadow-lg">Enable low usage until it closes <ChevronRight size={12} /></button>
                      </div>
                    ) : (
                      <button type="button" onClick={scanRunningGame} disabled={runningGameScan.state === 'checking'} className="inline-flex items-center gap-1.5 rounded-lg border border-[rgb(var(--accent)/0.42)] bg-[rgb(var(--accent)/0.09)] px-2.5 py-1.5 text-[9.5px] font-black text-[rgb(var(--accent-2))] disabled:opacity-55"><Bot size={12} className={runningGameScan.state === 'checking' ? 'animate-pulse' : ''} />{runningGameScan.state === 'checking' ? 'Scanning local games…' : 'Is a game running?'}</button>
                    )}
                    {(runningGameScan.state === 'empty' || runningGameScan.state === 'error') && <p className="mt-1.5 text-[9px] leading-relaxed text-muted">{runningGameScan.message}</p>}
                    <div className="mt-2 border-t border-[rgb(var(--border)/0.45)] pt-2">
                      <button type="button" onClick={inspectBackgroundApps} disabled={backgroundCheck.state === 'checking'} className="inline-flex items-center gap-1.5 rounded-lg border border-[rgb(var(--accent)/0.42)] bg-[rgb(var(--accent)/0.09)] px-2.5 py-1.5 text-[9.5px] font-black text-[rgb(var(--accent-2))] disabled:opacity-55"><Activity size={12} className={backgroundCheck.state === 'checking' ? 'animate-pulse' : ''} />{backgroundCheck.state === 'checking' ? 'Checking background apps…' : 'Check background apps'}</button>
                      {backgroundCheck.state === 'done' && (
                        <div className="mt-2 rounded-xl border border-[rgb(var(--border)/0.66)] bg-[rgb(var(--surface)/0.42)] px-2.5 py-2">
                          <p className="text-[9.5px] font-bold leading-relaxed text-ink">{backgroundCheck.message}</p>
                          {backgroundCheck.likelyGame && <p className="mt-1 text-[9px] text-emerald-300"><span className="font-black">Likely game/client:</span> {backgroundCheck.likelyGame.name} · {shortMemory(backgroundCheck.likelyGame.memoryBytes)} RAM · {Math.round(Number(backgroundCheck.likelyGame.cpuPercent || 0))}% CPU</p>}
                          <div className="mt-1.5 grid grid-cols-2 gap-1.5 text-[8.5px] leading-relaxed text-muted">
                            <div><span className="font-black uppercase tracking-wide text-[rgb(var(--accent-2))]">CPU</span><p className="truncate" title={backgroundCheck.cpu[0]?.name}>{backgroundCheck.cpu[0] ? `${backgroundCheck.cpu[0].name} · ${Math.round(Number(backgroundCheck.cpu[0].cpuPercent || 0))}%` : 'Nothing notable'}</p></div>
                            <div><span className="font-black uppercase tracking-wide text-[rgb(var(--accent-2))]">RAM</span><p className="truncate" title={backgroundCheck.memory[0]?.name}>{backgroundCheck.memory[0] ? `${backgroundCheck.memory[0].name} · ${shortMemory(backgroundCheck.memory[0].memoryBytes)}` : 'Nothing notable'}</p></div>
                          </div>
                          <p className="mt-1.5 text-[8.5px] leading-relaxed text-muted/85">Read-only Windows process snapshot. It works even when a game was never added to NEO-LIB.</p>
                        </div>
                      )}
                      {backgroundCheck.state === 'error' && <p className="mt-1.5 text-[9px] leading-relaxed text-rose-300">{backgroundCheck.message}</p>}
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between gap-2 border-t border-[rgb(var(--border)/0.7)] px-3.5 py-2.5"><div className="flex items-center gap-2"><button type="button" onClick={() => { setChatOpen(true); dismiss(); }} className="text-[10px] font-bold text-muted hover:text-ink">Talk to Fungist</button><button type="button" onClick={toggleWhy} className="text-[9px] font-bold text-[rgb(var(--accent-2))] hover:underline">{showWhy ? 'Hide reason' : 'Why am I seeing this?'}</button></div><button type="button" onClick={act} className="inline-flex items-center gap-1.5 rounded-lg bg-[rgb(var(--accent))] px-3 py-1.5 text-[10px] font-black text-[rgb(var(--surface))] shadow-lg"><span>{notice.action}</span><ChevronRight size={13} /></button></div>
              </motion.section>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {hovering && !notice && !spokenLine && !chatOpen && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 3, scale: 0.98 }}
                transition={{ duration: 0.14, ease: 'easeOut' }}
                className="relative mb-1 max-w-[min(190px,calc(100vw-28px))] rounded-lg border border-[rgb(var(--accent)/0.35)] bg-[rgb(var(--panel)/0.92)] px-2.5 py-1.5 text-right text-[10px] font-medium text-ink shadow-md backdrop-blur-md"
                data-testid="fungist-hover-tip"
              >
                Talk to Fungist
                <span aria-hidden="true" className="absolute -bottom-1 right-6 h-2 w-2 rotate-45 border-b border-r border-[rgb(var(--accent)/0.35)] bg-[rgb(var(--panel))]" />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {spokenLine && !notice && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.97 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="relative mb-1 w-fit max-w-[230px] rounded-xl border border-[rgb(var(--accent)/0.42)] bg-[rgb(var(--panel)/0.90)] px-3 py-1.5 text-right shadow-md backdrop-blur-md"
                style={{ boxShadow: '0 8px 20px -14px rgba(0,0,0,.82)' }}
                data-testid="fungist-speech"
              >
                <p className="text-[11px] font-medium leading-snug text-ink">{spokenLine.speech}</p>
                <span aria-hidden="true" className="absolute -bottom-1 right-6 h-2 w-2 rotate-45 border-b border-r border-[rgb(var(--accent)/0.42)] bg-[rgb(var(--panel))]" />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {completing && !notice && <motion.div initial={{ opacity: 0, y: 6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.97 }} className="mb-1 max-w-[260px] rounded-xl border border-emerald-300/35 bg-[rgb(var(--panel)/0.92)] px-3 py-2 text-right shadow-xl backdrop-blur-lg"><p className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-300">Nice work</p><p className="mt-0.5 text-[10.5px] font-bold text-ink">{completionMessage}</p></motion.div>}
          </AnimatePresence>

          <AnimatePresence>
            {launching && <motion.div initial={{ opacity: 0, y: 8, scale: 0.85 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.9 }} className="mb-1 max-w-[220px] rounded-xl border border-emerald-300/40 bg-[rgb(var(--panel)/0.94)] px-3 py-2 text-right shadow-xl backdrop-blur-lg"><p className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-300">Time to play!</p><p className="mt-0.5 text-[10px] font-bold text-ink">{launchCelebration?.gameName || 'Your game'} is launching</p></motion.div>}
          </AnimatePresence>

          <motion.button
            type="button"
            onPointerDown={beginDockDrag}
            onClick={(event) => {
              if (suppressDockClick.current) { suppressDockClick.current = false; event.preventDefault(); return; }
              setSleeping(false);
              setChatOpen((open) => !open);
            }}
            onMouseEnter={() => { setSleeping(false); setHovering(true); }}
            onMouseLeave={() => setHovering(false)}
            onContextMenu={(event) => { event.preventDefault(); setSleeping(false); setChatOpen(false); setContextTab('inbox'); setContextOpen(true); }}
            aria-label="Talk to Fungist"
            animate={launching || spokenLine?.mood === 'celebrate' ? { scale: [1, 1.14, 1.02, 1.12, 1], y: [0, -12, -3, -11, 0], rotate: [0, -6, 5, -4, 0] }
              : spokenLine?.mood === 'urgent' || spokenLine?.mood === 'concerned' ? { scale: [1, 1.08, 0.98, 1.06, 1], x: [0, -2, 2, -1, 0], rotate: [0, -2, 2, -1, 0] }
              : speaking ? { scale: [1, 1.065, 1.02, 1.06, 1], y: [0, -4, -1, -4, 0], rotate: [0, -1.2, 1.1, -0.8, 0] }
              : chatOpen ? { scale: [1, 1.075, 1.03, 1.075, 1], y: [0, -5, -2, -5, 0], rotate: [0, -1.5, 1.2, -1, 0] }
              : notice?.level === 'minor'
              ? welcoming ? { scale: [1, 1.2, 1.05, 1], y: [0, -8, -2, 0], rotate: [0, -2.2, 1.5, 0] } : { scale: [1, 1.08, 0.95, 1], y: [0, -2, 0] }
              : major ? { scale: 1, y: 0, rotate: 0 }
                : sleeping ? { scale: [1, 1.028, 1], y: [0, -2.5, 0], rotate: [0, 0.3, 0] }
                  : idleMoment === 'curious' ? { scale: [1, 1.04, 1], y: [0, -4, 0], rotate: [0, 2.1, -1.5, 0] }
                    : idleMoment === 'stretch' ? { scaleX: [1, 1.105, 0.96, 1], scaleY: [1, 0.93, 1.06, 1], y: [0, -3, 0], rotate: [0, -0.5, 0.5, 0] }
                      : idleMoment === 'greet' ? { scale: [1, 1.075, 1.025, 1], y: [0, -7, -2, 0], rotate: [0, -2.8, 2.1, -1.2, 0] }
                      : idleMoment === 'sparkle' ? { scale: [1, 1.06, 1], y: [0, -6, 0], rotate: [0, 0.85, -0.85, 0] }
                        : { scale: idlePulse ? [1, 1.075, 1.01, 1] : [1, 1.032, 1], y: idlePulse ? [0, -5, -1, 0] : [0, -3.5, 0], rotate: idlePulse ? [0, 1.1, -0.75, 0] : [0, 0.85, -0.55, 0] }}
            transition={launching || spokenLine?.mood === 'celebrate' ? { duration: 1.12, repeat: Infinity, ease: 'easeInOut' }
              : spokenLine?.mood === 'urgent' || spokenLine?.mood === 'concerned' ? { duration: 0.52, repeat: Infinity, ease: 'easeInOut' }
              : speaking ? { duration: 0.78, repeat: Infinity, ease: 'easeInOut' }
              : chatOpen ? { duration: 1.7, repeat: Infinity, ease: 'easeInOut' }
              : notice?.level === 'minor'
              ? { duration: welcoming ? 1.15 : 0.52, repeat: welcoming ? 0 : 3, repeatDelay: 0.1 }
              : major ? { duration: 0.18 }
                : sleeping ? { duration: 3.8, repeat: Infinity, ease: 'easeInOut' }
                  : { duration: idlePulse ? 1.25 : 2.55, repeat: idlePulse ? 0 : Infinity, ease: 'easeInOut' }}
            className="relative grid h-[172px] w-[160px] cursor-grab place-items-end bg-transparent p-0 focus:outline-none active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-2))]"
            style={{ filter: `drop-shadow(0 14px 20px rgba(0,0,0,.36)) drop-shadow(0 0 18px ${healthGlow})` }}
          >
            {!major && <span aria-hidden="true" className="pointer-events-none absolute bottom-0 left-1/2 h-5 w-28 -translate-x-1/2"><motion.span className="absolute inset-0 rounded-[50%] border border-[rgb(var(--accent)/0.42)] bg-[rgb(var(--accent)/0.08)]" style={{ boxShadow: `0 0 18px 2px ${healthGlow}, inset 0 0 12px rgb(var(--accent)/.28)` }} animate={sleeping ? { opacity: [0.2, 0.45, 0.2], scaleX: [0.88, 1.04, 0.88] } : { opacity: [0.34, 0.82, 0.34], scaleX: [0.86, 1.12, 0.86] }} transition={{ duration: sleeping ? 3.8 : 2.55, repeat: Infinity, ease: 'easeInOut' }} /></span>}
            <span aria-hidden="true" className="pointer-events-none absolute bottom-1 left-1/2 h-1.5 w-20 -translate-x-1/2"><motion.span className="absolute inset-0 rounded-full" style={{ background: healthGlow, boxShadow: `0 0 14px 3px ${healthGlow}` }} animate={{ opacity: [0.32, 1, 0.32], scaleX: [0.72, 1.16, 0.72] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }} /></span>
            {(chatOpen || launching) && <span aria-hidden="true" className="pointer-events-none absolute -inset-6 z-0">{SPARKLES.map((sparkle) => <motion.i key={`ready-${sparkle.left}-${sparkle.top}`} className="absolute block h-1.5 w-1.5 rounded-full" style={{ left: sparkle.left, top: sparkle.top, background: launching ? '#6ee7b7' : healthGlow, boxShadow: `0 0 9px 2px ${launching ? '#6ee7b7' : healthGlow}` }} initial={{ opacity: 0, scale: 0.25 }} animate={{ opacity: [0, 1, 0], scale: [0.25, 1.2, 0.25], y: [5, -9, -15] }} transition={{ duration: launching ? 0.9 : 1.35, delay: sparkle.delay, repeat: Infinity, repeatDelay: 0.3 }} />)}</span>}
            {hovering && !notice && <span aria-hidden="true" className="pointer-events-none absolute -inset-5 z-0">{SPARKLES.map((sparkle) => <motion.i key={`hover-${sparkle.left}-${sparkle.top}`} className="absolute block h-1.5 w-1.5 rounded-full" style={{ left: sparkle.left, top: sparkle.top, background: healthGlow, boxShadow: `0 0 10px 2px ${healthGlow}` }} initial={{ opacity: 0, scale: 0.2 }} animate={{ opacity: [0, 1, 0], scale: [0.2, 1.1, 0.2], y: [6, -8, -18] }} transition={{ duration: 1.05, delay: sparkle.delay, repeat: Infinity, ease: 'easeOut' }} />)}</span>}
            {sleeping && <span aria-hidden="true" className="pointer-events-none absolute -right-3 -top-3 z-20 text-[10px] font-black tracking-[0.08em] text-[rgb(var(--accent-2))] drop-shadow-[0_1px_2px_rgba(0,0,0,.85)]"><motion.i className="not-italic" animate={{ opacity: [0, 0.9, 0], y: [5, -6, -12], x: [0, 2, 5], scale: [0.72, 1, 1.08] }} transition={{ duration: 3.8, repeat: Infinity, ease: 'easeOut' }}>zZz</motion.i></span>}
            {idleMoment === 'sparkle' && !notice && <span aria-hidden="true" className="pointer-events-none absolute -inset-5 z-0">{SPARKLES.slice(0, 3).map((sparkle) => <motion.i key={`idle-${sparkle.left}-${sparkle.top}`} className="absolute block h-1.5 w-1.5 rounded-full" style={{ left: sparkle.left, top: sparkle.top, background: healthGlow, boxShadow: `0 0 8px 2px ${healthGlow}` }} initial={{ opacity: 0, scale: 0.3 }} animate={{ opacity: [0, 1, 0], scale: [0.3, 1.25, 0.2], y: [3, -6, -12] }} transition={{ duration: 1.1, delay: sparkle.delay, ease: 'easeOut' }} />)}</span>}
            {medium && <span aria-hidden="true" className="pointer-events-none absolute -inset-7 z-0">
              {SPARKLES.map((sparkle) => <motion.i key={`${notice.key}-${sparkle.left}-${sparkle.top}`} className="absolute block h-1.5 w-1.5 rounded-full" style={{ left: sparkle.left, top: sparkle.top, background: healthGlow, boxShadow: `0 0 9px 2px ${healthGlow}` }} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: [0, 1, 0], scale: [0.25, 1.3, 0.25], rotate: [0, 90, 180] }} transition={{ duration: 1.15, delay: sparkle.delay, repeat: 2, repeatDelay: 0.65 }} />)}
            </span>}
            {major && <span aria-hidden="true" className="pointer-events-none absolute -inset-20 z-0">
              {FIREWORKS.map((burst) => <motion.i key={`${notice.key}-${burst.x}-${burst.y}`} className="absolute left-1/2 top-1/2 block h-2 w-2 rounded-full" style={{ background: healthGlow, boxShadow: `0 0 14px 3px ${healthGlow}` }} initial={{ x: 0, y: 0, opacity: 0, scale: 0.25 }} animate={{ x: [0, burst.x], y: [0, burst.y], opacity: [0, 1, 0], scale: [0.25, 1.15, 0.2] }} transition={{ duration: 0.92, delay: burst.delay, repeat: 2, repeatDelay: 0.75, ease: 'easeOut' }} />)}
            </span>}
            {major && !arrived && <motion.span aria-hidden="true" className="pointer-events-none absolute -inset-9 -z-10 rounded-full" style={{ background: `radial-gradient(circle, ${healthGlow} 0%, transparent 67%)` }} initial={{ opacity: 0.1, scale: 0.45 }} animate={{ opacity: [0.08, 0.62, 0], scale: [0.45, 1.45, 1.95] }} transition={{ duration: 0.72, repeat: 2, ease: 'easeOut' }} />}
            {notice?.level === 'minor' && <span className="absolute -left-1 -top-1 grid h-6 min-w-6 place-items-center rounded-full border border-white/30 bg-[rgb(var(--accent-2))] px-1 text-[9px] font-black text-[rgb(var(--surface))] shadow-lg">HEY</span>}
            {chatOpen && <span className="absolute -right-1 -top-1 rounded-full border border-white/30 bg-[rgb(var(--accent-2))] px-1.5 py-0.5 text-[8px] font-black tracking-[0.08em] text-[rgb(var(--surface))] shadow-lg">READY</span>}
            <motion.img
              // Pose changes are visual swaps, not entrances. Keeping the
              // image fully opaque prevents a blink/smile/speech change from
              // making Fungist flash transparent every few seconds.
              initial={false}
              animate={sleeping ? { opacity: 1, scale: [1, 1.012, 1], y: [0, 0.5, 0] } : major ? { opacity: 1, scale: 1 } : { opacity: 1, scale: [1, 1.008, 1], y: [0, -0.7, 0], rotate: [0, 0.25, -0.18, 0] }}
              transition={sleeping ? { duration: 3.8, repeat: Infinity, ease: 'easeInOut' } : major ? { duration: 0.11 } : { duration: 2.55, repeat: Infinity, ease: 'easeInOut' }}
              src={displayAsset}
              alt="Fungist, the NEO-LIB mascot"
              className="relative z-10 h-[166px] w-[160px] object-contain"
              style={{ transformOrigin: '50% 83%', filter: 'drop-shadow(0 3px 5px rgb(0 0 0 / 0.32))' }}
              draggable="false"
            />
          </motion.button>
        </div>
      </motion.div>

      <AnimatePresence>
        {contextOpen && (
          <motion.aside initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }} transition={{ duration: 0.17 }} className="fixed bottom-5 right-5 z-[87] w-[min(350px,calc(100vw-28px))] overflow-hidden rounded-2xl border border-[rgb(var(--accent)/0.58)] bg-[rgb(var(--panel)/0.97)] shadow-2xl backdrop-blur-xl" style={{ boxShadow: '0 25px 85px -25px rgba(0,0,0,.95), 0 0 38px -16px rgb(var(--accent)/.75)' }} data-testid="fungist-context">
            <header className="flex items-center gap-2 border-b border-[rgb(var(--border)/0.72)] bg-[rgb(var(--accent)/0.08)] px-3.5 py-2.5"><img src={ASSETS.stand} alt="" className="h-8 w-8 object-contain" /><div className="min-w-0 flex-1"><h2 className="text-[12px] font-black">Fungist</h2><p className="text-[9.5px] text-muted">Inbox and quick settings</p></div><button type="button" onClick={() => setContextOpen(false)} className="grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-white/10 hover:text-ink" aria-label="Close Fungist menu"><X size={14} /></button></header>
            <div className="flex gap-1 border-b border-[rgb(var(--border)/0.72)] px-2.5 py-2"><button type="button" onClick={() => setContextTab('inbox')} className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[10px] font-bold ${contextTab === 'inbox' ? 'bg-[rgb(var(--accent)/0.14)] text-ink' : 'text-muted hover:text-ink'}`}><Archive size={12} />Inbox {inbox.length ? `(${inbox.length})` : ''}</button><button type="button" onClick={() => setContextTab('quick')} className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[10px] font-bold ${contextTab === 'quick' ? 'bg-[rgb(var(--accent)/0.14)] text-ink' : 'text-muted hover:text-ink'}`}><Settings2 size={12} />Quick settings</button></div>
            {contextTab === 'inbox' ? <div className="max-h-[330px] overflow-y-auto p-2.5">{inbox.length ? <><div className="mb-2 flex items-center justify-between gap-2"><p className="text-[9.5px] text-muted">Recent Fungist notices. Newer events stay at the top.</p><button type="button" onClick={onClearInbox} className="shrink-0 text-[9px] font-bold text-[rgb(var(--accent-2))] hover:underline">Clear</button></div><div className="space-y-1.5">{inbox.slice(0, 30).map((item, index) => <article key={`${item.key}-${item.createdAt}-${index}`} className="rounded-xl border border-[rgb(var(--border)/0.68)] bg-[rgb(var(--surface)/0.42)] px-2.5 py-2"><div className="flex items-start gap-2"><BellRing size={12} className="mt-0.5 shrink-0 text-[rgb(var(--accent-2))]" /><div className="min-w-0 flex-1"><p className="text-[10px] font-bold text-ink">{item.title}</p><p className="mt-0.5 text-[9.5px] leading-relaxed text-muted">{item.body}</p><p className="mt-1 text-[8.5px] font-medium uppercase tracking-wide text-muted/75">{shortTime(item.createdAt)}</p></div></div></article>)}</div></> : <div className="grid min-h-36 place-items-center rounded-xl border border-dashed border-[rgb(var(--border)/0.75)] px-5 text-center"><div><Archive size={18} className="mx-auto text-[rgb(var(--accent-2))]" /><p className="mt-2 text-[11px] font-bold text-ink">Nothing missed</p><p className="mt-1 text-[9.5px] leading-relaxed text-muted">Fungist will keep a short history of the notices he shows you.</p></div></div>}</div> : <div className="space-y-2.5 p-2.5"><QuickSetting label="Show Fungist" value={enabled} onChange={(value) => onUpdatePreferences?.({ fungistEnabled: value })} /><QuickSetting label="PC alerts" value={notificationEnabled(notificationSettings, 'pcHigh') || notificationEnabled(notificationSettings, 'pcCheck')} onChange={(value) => updateQuickNotifications({ pcHigh: value, pcCheck: value })} /><QuickSetting label="News and updates" value={notificationEnabled(notificationSettings, 'favouriteNews') || notificationEnabled(notificationSettings, 'favouriteUpdates') || notificationEnabled(notificationSettings, 'appUpdates')} onChange={(value) => updateQuickNotifications({ favouriteNews: value, favouriteUpdates: value, appUpdates: value })} /><QuickSetting label="Completion celebrations" value={notificationEnabled(notificationSettings, 'completion')} onChange={(value) => updateQuickNotifications({ completion: value })} /><button type="button" onClick={() => { onUpdatePreferences?.({ fungistEnabled: true }); setContextOpen(false); onOpenSettings?.(); }} className="mt-1 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-[rgb(var(--accent)/0.42)] bg-[rgb(var(--accent)/0.08)] px-3 py-2 text-[10px] font-black text-[rgb(var(--accent))] hover:bg-[rgb(var(--accent)/0.15)]"><Settings2 size={12} />Open full NEO-LIB Mascot settings</button></div>}
          </motion.aside>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {chatOpen && (
          <motion.aside initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }} transition={{ duration: 0.18 }} className="fixed bottom-5 right-5 z-[86] w-[min(380px,calc(100vw-28px))] overflow-hidden rounded-2xl border border-[rgb(var(--accent)/0.62)] bg-[rgb(var(--panel)/0.96)] shadow-2xl backdrop-blur-xl" style={{ boxShadow: '0 25px 85px -25px rgba(0,0,0,.95), 0 0 38px -16px rgb(var(--accent)/.75)' }} data-testid="fungist-chat">
            <header className="flex items-center gap-2 border-b border-[rgb(var(--border)/0.72)] bg-[rgb(var(--accent)/0.08)] px-3.5 py-2.5"><img src={ASSETS.stand} alt="" className="h-9 w-9 object-contain" /><div className="min-w-0 flex-1"><h2 className="text-[12px] font-black">Fungist, Oracle of NEO-LIB</h2><p className="text-[9.5px] text-muted">{aiModel} · {aiReady ? `${libraryGames.length} visible games known` : 'needs your API key'}</p></div>{chatHistory.length > 0 && <button type="button" onClick={onClearChatHistory} className="rounded-md px-1.5 py-1 text-[9px] font-bold text-muted hover:bg-white/10 hover:text-ink" title="Clear local Fungist chat history">Clear</button>}<button type="button" onClick={() => setChatOpen(false)} className="grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-white/10 hover:text-ink" aria-label="Close Fungist chat"><X size={14} /></button></header>
            <div ref={chatScrollRef} className="max-h-[340px] min-h-48 space-y-2.5 overflow-y-auto px-3.5 py-3" data-testid="fungist-chat-history">
              {!chatHistory.length && <div className="rounded-xl border border-[rgb(var(--border)/0.72)] bg-[rgb(var(--surface)/0.45)] p-2.5 text-[11px] leading-relaxed text-muted"><p className="font-bold text-ink">The Oracle is awake.</p><p className="mt-1">Ask about a game, what to play, or something you want NEO-LIB to help with. I keep it short unless you ask for the deeper reading.</p></div>}
              {chatHistory.map((message) => <div key={message.id || `${message.role}-${message.createdAt}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[88%] rounded-2xl border px-3 py-2 text-[11px] leading-relaxed whitespace-pre-wrap ${message.role === 'user' ? 'border-[rgb(var(--accent)/0.42)] bg-[rgb(var(--accent)/0.14)] text-ink' : 'border-[rgb(var(--border)/0.72)] bg-[rgb(var(--surface)/0.48)] text-muted'}`}><p className={`mb-0.5 text-[8px] font-black uppercase tracking-[0.16em] ${message.role === 'user' ? 'text-[rgb(var(--accent-2))]' : 'text-[rgb(var(--accent))]'}`}>{message.role === 'user' ? 'You' : 'Fungist'}</p>{message.text}{message.action?.type === 'launch' && <button type="button" data-neolib-launch="true" onClick={(event) => launchFromChat(message, event)} className="mt-2 inline-flex items-center rounded-lg bg-[rgb(var(--accent))] px-2.5 py-1.5 text-[10px] font-black text-[rgb(var(--surface))] shadow-lg">{message.action.label || 'Launch game'}</button>}{message.action?.type === 'feedback' && <button type="button" onClick={() => { setChatOpen(false); onReportBug?.(); }} className="mt-2 inline-flex items-center rounded-lg border border-[rgb(var(--accent)/0.55)] bg-[rgb(var(--accent)/0.13)] px-2.5 py-1.5 text-[10px] font-black text-[rgb(var(--accent))] shadow-lg hover:bg-[rgb(var(--accent)/0.22)]">{message.action.label || 'Report a bug'}</button>}</div></div>)}
              {asking && <div className="flex justify-start"><div className="rounded-2xl border border-[rgb(var(--border)/0.72)] bg-[rgb(var(--surface)/0.48)] px-3 py-2 text-[10px] font-bold text-muted"><Bot size={12} className="mr-1 inline animate-pulse text-[rgb(var(--accent))]" />Reading the threads…</div></div>}
              {!aiReady && <div className="flex items-center justify-between gap-2 rounded-xl border border-amber-300/35 bg-amber-300/[0.08] p-2.5 text-[10px] leading-relaxed text-muted"><span>Add and test your Gemini API key before chatting.</span><button type="button" onClick={onOpenSettings} className="shrink-0 font-bold text-[rgb(var(--accent-2))] hover:underline">Open settings</button></div>}
            </div>
            <form onSubmit={submit} className="border-t border-[rgb(var(--border)/0.72)] p-2.5"><div className="flex items-end gap-2"><textarea value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder={aiReady ? 'Ask the Oracle about your library…' : 'Try “Launch Forza 5”, or add your Gemini API key'} maxLength={1800} rows={2} disabled={asking} className="min-h-[42px] min-w-0 flex-1 resize-none rounded-lg border border-[rgb(var(--border)/0.85)] bg-[rgb(var(--surface)/0.68)] px-3 py-2 text-[11px] text-ink outline-none placeholder:text-muted focus:border-[rgb(var(--accent)/0.72)] disabled:cursor-not-allowed disabled:opacity-55" /><button type="submit" disabled={!question.trim() || asking} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[rgb(var(--accent))] text-[rgb(var(--surface))] disabled:opacity-45" title="Send to Fungist">{asking ? <Bot size={14} className="animate-pulse" /> : <Send size={14} />}</button></div><div className="mt-2 flex items-center justify-between gap-2"><span className="text-[9px] text-muted">Local launch commands work without AI. AI questions share visible game names/tags/ratings/playtime only after you press Send.</span><button type="button" onClick={onOpenSettings} className="inline-flex shrink-0 items-center gap-1 text-[9px] font-bold text-[rgb(var(--accent-2))] hover:underline"><Settings2 size={10} />AI settings</button></div></form>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
