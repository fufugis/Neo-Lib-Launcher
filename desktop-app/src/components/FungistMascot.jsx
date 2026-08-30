import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Archive, BellRing, Bot, ChevronRight, Send, Settings2, X } from 'lucide-react';
import { playFungistCue } from '../lib/sound';

const ASSETS = {
  stand: '/mascot/fungist-stand.png',
  blink: '/mascot/fungist-blink.png',
  fly: '/mascot/fungist-fly.png',
  complete: '/mascot/fungist-complete.png',
  smile: '/mascot/fungist-smile.png',
  shocked: '/mascot/fungist-shocked.png',
  sleep: '/mascot/fungist-sleep.png',
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
  onOpenNews,
  onOpenGame,
  onOpenAppUpdate,
  onDismissNews,
  onAskAi,
  onOpenSettings,
  inbox = [],
  onRecordNotice,
  onClearInbox,
  onUpdatePreferences,
  soundsEnabled = true,
  completion = null,
}) {
  const [notice, setNotice] = React.useState(null);
  const [chatOpen, setChatOpen] = React.useState(false);
  const [question, setQuestion] = React.useState('');
  const [answer, setAnswer] = React.useState('');
  const [asking, setAsking] = React.useState(false);
  const [blinking, setBlinking] = React.useState(false);
  const [arrived, setArrived] = React.useState(false);
  const [completing, setCompleting] = React.useState(false);
  const [smiling, setSmiling] = React.useState(false);
  const [sleeping, setSleeping] = React.useState(false);
  const [showWhy, setShowWhy] = React.useState(false);
  const [contextOpen, setContextOpen] = React.useState(false);
  const [contextTab, setContextTab] = React.useState('inbox');
  const [completionMessage, setCompletionMessage] = React.useState('');
  const [viewport, setViewport] = React.useState(() => ({ width: typeof window === 'undefined' ? 1280 : window.innerWidth, height: typeof window === 'undefined' ? 800 : window.innerHeight }));
  const lastNoticeAt = React.useRef(new Map());
  const smileTimer = React.useRef(null);

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

  // One short, real pose swap every ~30 seconds gives Fungist life without a
  // continuous animation. It stops immediately in Rest Mode or when disabled.
  React.useEffect(() => {
    if (!enabled || resting || sleeping) return undefined;
    let blinkTimer;
    let reopenTimer;
    const blink = () => {
      setBlinking(true);
      reopenTimer = window.setTimeout(() => { setBlinking(false); blinkTimer = window.setTimeout(blink, 28_000 + Math.round(Math.random() * 12_000)); }, 150);
    };
    blinkTimer = window.setTimeout(blink, 18_000 + Math.round(Math.random() * 10_000));
    return () => { window.clearTimeout(blinkTimer); window.clearTimeout(reopenTimer); };
  }, [enabled, resting, sleeping]);

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
    if (soundsEnabled) playFungistCue('completed-ding');
    const timer = window.setTimeout(() => { setCompleting(false); setCompletionMessage(''); }, 1_850);
    return () => window.clearTimeout(timer);
  }, [completion?.key, completion?.label, enabled, resting, soundsEnabled, notificationSettings?.completion]);

  React.useEffect(() => () => window.clearTimeout(smileTimer.current), []);

  const soundedNotice = React.useRef('');
  React.useEffect(() => {
    if (!notice || !soundsEnabled || soundedNotice.current === notice.key) return;
    soundedNotice.current = notice.key;
    playFungistCue(notice.level === 'major' ? 'warning' : notice.kind === 'health' ? 'attention' : 'hey');
  }, [notice?.key, notice?.kind, notice?.level, soundsEnabled]);

  if (!enabled || resting) return null;
  const major = notice?.level === 'major';
  const medium = Boolean(notice && !major);
  const healthGlow = major ? 'rgba(255, 74, 92, .92)' : notice?.kind === 'health' || healthState === 'check' ? 'rgba(250, 204, 21, .92)' : notice ? 'rgba(74, 222, 128, .88)' : 'rgb(var(--accent) / .75)';
  // The dock is 18px from the right and 60px from the bottom. Moving by this
  // exact viewport-relative delta gives a genuine fly-to-centre / fly-home
  // motion without a video, timer, or continuously running animation.
  const flyX = Math.round(61 - viewport.width / 2);
  const flyY = Math.round(26 - viewport.height / 2);
  const displayPose = major ? (!arrived ? 'fly' : 'shocked') : completing ? 'complete' : smiling ? 'smile' : sleeping ? 'sleep' : blinking ? 'blink' : 'stand';
  const displayAsset = ASSETS[displayPose];

  const act = () => {
    if (!notice) { setChatOpen(true); return; }
    if (notice.kind === 'health') onOpenHealth?.();
    if (notice.kind === 'news') { onOpenNews?.(newsAlert); onDismissNews?.(); }
    if (notice.kind === 'game-update') onOpenGame?.(favouriteUpdate?.id);
    if (notice.kind === 'app-update') onOpenAppUpdate?.();
    if (soundsEnabled) playFungistCue('good-ding');
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
  const updateQuickNotifications = (patch) => onUpdatePreferences?.({ fungistNotifications: { ...notificationSettings, ...patch } });
  const submit = async (event) => {
    event.preventDefault();
    const text = question.trim();
    if (!text || asking) return;
    setAsking(true); setAnswer('');
    try {
      const result = await onAskAi?.(text);
      if (result?.ok) setAnswer(result.text || 'I’m here, but I did not receive a reply.');
      else setAnswer(result?.error || 'Connect an AI key in Settings before asking me something.');
    } catch { setAnswer('I could not reach the AI service right now.'); }
    finally { setAsking(false); }
  };

  return (
    <>
      <motion.div
        className="pointer-events-none fixed z-[85]"
        initial={false}
        animate={major ? { x: flyX, y: flyY, scale: 1.24 } : { x: 0, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 210, damping: 22, mass: 0.72 }}
        data-testid="fungist-mascot"
        style={{ right: 18, bottom: 60 }}
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
                <div className="flex items-center justify-between gap-2 border-t border-[rgb(var(--border)/0.7)] px-3.5 py-2.5"><div className="flex items-center gap-2"><button type="button" onClick={() => { setChatOpen(true); dismiss(); }} className="text-[10px] font-bold text-muted hover:text-ink">Talk to Fungist</button><button type="button" onClick={() => setShowWhy((value) => !value)} className="text-[9px] font-bold text-[rgb(var(--accent-2))] hover:underline">{showWhy ? 'Hide reason' : 'Why am I seeing this?'}</button></div><button type="button" onClick={act} className="inline-flex items-center gap-1.5 rounded-lg bg-[rgb(var(--accent))] px-3 py-1.5 text-[10px] font-black text-[rgb(var(--surface))] shadow-lg"><span>{notice.action}</span><ChevronRight size={13} /></button></div>
              </motion.section>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {completing && !notice && <motion.div initial={{ opacity: 0, y: 6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.97 }} className="mb-1 max-w-[260px] rounded-xl border border-emerald-300/35 bg-[rgb(var(--panel)/0.92)] px-3 py-2 text-right shadow-xl backdrop-blur-lg"><p className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-300">Nice work</p><p className="mt-0.5 text-[10.5px] font-bold text-ink">{completionMessage}</p></motion.div>}
          </AnimatePresence>

          <motion.button
            type="button"
            onClick={() => { setSleeping(false); setChatOpen((open) => !open); }}
            onContextMenu={(event) => { event.preventDefault(); setSleeping(false); setChatOpen(false); setContextTab('inbox'); setContextOpen(true); }}
            aria-label="Talk to Fungist"
            title={notice ? 'Fungist has something to tell you · right-click for Inbox and quick settings' : 'Talk to Fungist · right-click for Inbox and quick settings'}
            animate={notice?.level === 'minor'
              ? { scale: [1, 1.08, 0.95, 1], y: [0, -2, 0] }
              : major || sleeping ? { scale: 1, y: 0, rotate: 0 } : { scale: 1, y: [0, -2, 0], rotate: [0, 0.45, -0.25, 0] }}
            transition={notice?.level === 'minor'
              ? { duration: 0.52, repeat: 3, repeatDelay: 0.1 }
              : major || sleeping ? { duration: 0.18 } : { duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
            className="relative grid h-[86px] w-[86px] place-items-center rounded-full border bg-[rgb(var(--surface)/0.8)] p-1.5 shadow-2xl backdrop-blur-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-2))]"
            style={{ borderColor: healthGlow, boxShadow: `0 14px 36px -14px rgba(0,0,0,.95), 0 0 30px -9px ${healthGlow}` }}
          >
            {medium && <span aria-hidden="true" className="pointer-events-none absolute -inset-7 z-0">
              {SPARKLES.map((sparkle) => <motion.i key={`${notice.key}-${sparkle.left}-${sparkle.top}`} className="absolute block h-1.5 w-1.5 rounded-full" style={{ left: sparkle.left, top: sparkle.top, background: healthGlow, boxShadow: `0 0 9px 2px ${healthGlow}` }} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: [0, 1, 0], scale: [0.25, 1.3, 0.25], rotate: [0, 90, 180] }} transition={{ duration: 1.15, delay: sparkle.delay, repeat: 2, repeatDelay: 0.65 }} />)}
            </span>}
            {major && <span aria-hidden="true" className="pointer-events-none absolute -inset-20 z-0">
              {FIREWORKS.map((burst) => <motion.i key={`${notice.key}-${burst.x}-${burst.y}`} className="absolute left-1/2 top-1/2 block h-2 w-2 rounded-full" style={{ background: healthGlow, boxShadow: `0 0 14px 3px ${healthGlow}` }} initial={{ x: 0, y: 0, opacity: 0, scale: 0.25 }} animate={{ x: [0, burst.x], y: [0, burst.y], opacity: [0, 1, 0], scale: [0.25, 1.15, 0.2] }} transition={{ duration: 0.92, delay: burst.delay, repeat: 2, repeatDelay: 0.75, ease: 'easeOut' }} />)}
            </span>}
            {major && !arrived && <motion.span aria-hidden="true" className="pointer-events-none absolute -inset-9 -z-10 rounded-full" style={{ background: `radial-gradient(circle, ${healthGlow} 0%, transparent 67%)` }} initial={{ opacity: 0.1, scale: 0.45 }} animate={{ opacity: [0.08, 0.62, 0], scale: [0.45, 1.45, 1.95] }} transition={{ duration: 0.72, repeat: 2, ease: 'easeOut' }} />}
            {notice?.level === 'minor' && <span className="absolute -left-1 -top-1 grid h-6 min-w-6 place-items-center rounded-full border border-white/30 bg-[rgb(var(--accent-2))] px-1 text-[9px] font-black text-[rgb(var(--surface))] shadow-lg">HEY</span>}
            <motion.img key={displayPose} initial={{ opacity: 0.55, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.11 }} src={displayAsset} alt="Fungist, the NEO-LIB mascot" className="relative z-10 h-full w-full object-contain" draggable="false" />
          </motion.button>
        </div>
      </motion.div>

      <AnimatePresence>
        {contextOpen && (
          <motion.aside initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }} transition={{ duration: 0.17 }} className="fixed bottom-5 right-5 z-[87] w-[min(350px,calc(100vw-28px))] overflow-hidden rounded-2xl border border-[rgb(var(--accent)/0.58)] bg-[rgb(var(--panel)/0.97)] shadow-2xl backdrop-blur-xl" style={{ boxShadow: '0 25px 85px -25px rgba(0,0,0,.95), 0 0 38px -16px rgb(var(--accent)/.75)' }} data-testid="fungist-context">
            <header className="flex items-center gap-2 border-b border-[rgb(var(--border)/0.72)] bg-[rgb(var(--accent)/0.08)] px-3.5 py-2.5"><img src={ASSETS.stand} alt="" className="h-8 w-8 object-contain" /><div className="min-w-0 flex-1"><h2 className="text-[12px] font-black">Fungist</h2><p className="text-[9.5px] text-muted">Inbox and quick settings</p></div><button type="button" onClick={() => setContextOpen(false)} className="grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-white/10 hover:text-ink" aria-label="Close Fungist menu"><X size={14} /></button></header>
            <div className="flex gap-1 border-b border-[rgb(var(--border)/0.72)] px-2.5 py-2"><button type="button" onClick={() => setContextTab('inbox')} className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[10px] font-bold ${contextTab === 'inbox' ? 'bg-[rgb(var(--accent)/0.14)] text-ink' : 'text-muted hover:text-ink'}`}><Archive size={12} />Inbox {inbox.length ? `(${inbox.length})` : ''}</button><button type="button" onClick={() => setContextTab('quick')} className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[10px] font-bold ${contextTab === 'quick' ? 'bg-[rgb(var(--accent)/0.14)] text-ink' : 'text-muted hover:text-ink'}`}><Settings2 size={12} />Quick settings</button></div>
            {contextTab === 'inbox' ? <div className="max-h-[330px] overflow-y-auto p-2.5">{inbox.length ? <><div className="mb-2 flex items-center justify-between gap-2"><p className="text-[9.5px] text-muted">Recent Fungist notices. Newer events stay at the top.</p><button type="button" onClick={onClearInbox} className="shrink-0 text-[9px] font-bold text-[rgb(var(--accent-2))] hover:underline">Clear</button></div><div className="space-y-1.5">{inbox.slice(0, 30).map((item, index) => <article key={`${item.key}-${item.createdAt}-${index}`} className="rounded-xl border border-[rgb(var(--border)/0.68)] bg-[rgb(var(--surface)/0.42)] px-2.5 py-2"><div className="flex items-start gap-2"><BellRing size={12} className="mt-0.5 shrink-0 text-[rgb(var(--accent-2))]" /><div className="min-w-0 flex-1"><p className="text-[10px] font-bold text-ink">{item.title}</p><p className="mt-0.5 text-[9.5px] leading-relaxed text-muted">{item.body}</p><p className="mt-1 text-[8.5px] font-medium uppercase tracking-wide text-muted/75">{shortTime(item.createdAt)}</p></div></div></article>)}</div></> : <div className="grid min-h-36 place-items-center rounded-xl border border-dashed border-[rgb(var(--border)/0.75)] px-5 text-center"><div><Archive size={18} className="mx-auto text-[rgb(var(--accent-2))]" /><p className="mt-2 text-[11px] font-bold text-ink">Nothing missed</p><p className="mt-1 text-[9.5px] leading-relaxed text-muted">Fungist will keep a short history of the notices he shows you.</p></div></div>}</div> : <div className="space-y-2.5 p-2.5"><QuickSetting label="Show Fungist" value={enabled} onChange={(value) => onUpdatePreferences?.({ fungistEnabled: value })} /><QuickSetting label="PC alerts" value={notificationEnabled(notificationSettings, 'pcHigh') || notificationEnabled(notificationSettings, 'pcCheck')} onChange={(value) => updateQuickNotifications({ pcHigh: value, pcCheck: value })} /><QuickSetting label="News and updates" value={notificationEnabled(notificationSettings, 'favouriteNews') || notificationEnabled(notificationSettings, 'favouriteUpdates') || notificationEnabled(notificationSettings, 'appUpdates')} onChange={(value) => updateQuickNotifications({ favouriteNews: value, favouriteUpdates: value, appUpdates: value })} /><QuickSetting label="Completion celebrations" value={notificationEnabled(notificationSettings, 'completion')} onChange={(value) => updateQuickNotifications({ completion: value })} /><button type="button" onClick={() => { setContextOpen(false); onOpenSettings?.(); }} className="mt-1 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-[rgb(var(--accent)/0.42)] bg-[rgb(var(--accent)/0.08)] px-3 py-2 text-[10px] font-black text-[rgb(var(--accent))] hover:bg-[rgb(var(--accent)/0.15)]"><Settings2 size={12} />Open full Fungist settings</button></div>}
          </motion.aside>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {chatOpen && (
          <motion.aside initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }} transition={{ duration: 0.18 }} className="fixed bottom-5 right-5 z-[86] w-[min(380px,calc(100vw-28px))] overflow-hidden rounded-2xl border border-[rgb(var(--accent)/0.62)] bg-[rgb(var(--panel)/0.96)] shadow-2xl backdrop-blur-xl" style={{ boxShadow: '0 25px 85px -25px rgba(0,0,0,.95), 0 0 38px -16px rgb(var(--accent)/.75)' }} data-testid="fungist-chat">
            <header className="flex items-center gap-2 border-b border-[rgb(var(--border)/0.72)] bg-[rgb(var(--accent)/0.08)] px-3.5 py-2.5"><img src={ASSETS.stand} alt="" className="h-9 w-9 object-contain" /><div className="min-w-0 flex-1"><h2 className="text-[12px] font-black">Fungist</h2><p className="text-[9.5px] text-muted">Your NEO-LIB companion · asks AI only when you send</p></div><button type="button" onClick={() => setChatOpen(false)} className="grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-white/10 hover:text-ink" aria-label="Close Fungist chat"><X size={14} /></button></header>
            <div className="max-h-52 overflow-y-auto px-3.5 py-3"><div className="rounded-xl border border-[rgb(var(--border)/0.72)] bg-[rgb(var(--surface)/0.45)] p-2.5 text-[11px] leading-relaxed text-muted">Hey! Ask me about your library, what to play, a game you are unsure about, or something you want NEO-LIB to help with.</div>{answer && <div className="mt-2.5 rounded-xl border border-[rgb(var(--accent)/0.24)] bg-[rgb(var(--accent)/0.07)] p-2.5 text-[11px] leading-relaxed text-ink whitespace-pre-wrap">{answer}</div>}</div>
            <form onSubmit={submit} className="border-t border-[rgb(var(--border)/0.72)] p-2.5"><div className="flex gap-2"><input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask Fungist anything…" maxLength={1800} className="min-w-0 flex-1 rounded-lg border border-[rgb(var(--border)/0.85)] bg-[rgb(var(--surface)/0.68)] px-3 py-2 text-[11px] text-ink outline-none placeholder:text-muted focus:border-[rgb(var(--accent)/0.72)]" /><button type="submit" disabled={!question.trim() || asking} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[rgb(var(--accent))] text-[rgb(var(--surface))] disabled:opacity-45" title="Send to AI">{asking ? <Bot size={14} className="animate-pulse" /> : <Send size={14} />}</button></div><div className="mt-2 flex items-center justify-between gap-2"><span className="text-[9px] text-muted">Your message is sent only after you press Send.</span><button type="button" onClick={onOpenSettings} className="inline-flex items-center gap-1 text-[9px] font-bold text-[rgb(var(--accent-2))] hover:underline"><Settings2 size={10} />AI settings</button></div></form>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
