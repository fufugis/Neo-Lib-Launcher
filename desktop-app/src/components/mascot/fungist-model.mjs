export function notificationEnabled(settings, key) {
  return settings?.[key] !== false;
}

export function noticeCooldownMs(notice) {
  if (notice?.kind === 'health' && notice.level === 'major') return 5 * 60_000;
  if (notice?.kind === 'health') return 15 * 60_000;
  // Activity notices only come from an intentional NEO-LIB action or an open
  // Controller Center. Keep a short safety gap anyway so a batch operation
  // never turns the companion into a running commentary track.
  if (notice?.kind === 'activity') return 90_000;
  return 6 * 60 * 60_000;
}

export function whyFor(notice) {
  if (notice?.kind === 'health' && notice.level === 'major') return 'Your Game Ready monitor saw sustained high CPU or RAM use. This major alert is limited to once every five minutes.';
  if (notice?.kind === 'health') return 'Your Game Ready monitor saw elevated CPU or RAM use. This reminder is limited to once every fifteen minutes.';
  if (notice?.kind === 'news') return 'A newly detected article belongs to a game you marked as a favourite.';
  if (notice?.kind === 'game-update') return 'A checked update source confirmed a newer version for one of your favourited games.';
  if (notice?.kind === 'app-update') return 'NEO-LIB found a release newer than the version you are running.';
  if (notice?.kind === 'activity') return 'This came from an action you just took in NEO-LIB. It is optional, stored only in the local mascot inbox, and remains quiet during Rest Mode.';
  return 'This was triggered by one of your enabled Fungist reactions.';
}

export function shortTime(value) {
  try { return new Date(value).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return ''; }
}

export function shortMemory(bytes) {
  const value = Number(bytes || 0);
  if (value >= 1024 ** 3) return `${(value / 1024 ** 3).toFixed(value >= 10 * 1024 ** 3 ? 0 : 1)} GB`;
  if (value >= 1024 ** 2) return `${Math.round(value / 1024 ** 2)} MB`;
  return '0 MB';
}

const GAME_PROCESS_HINTS = /(?:overwatch|warcraft|worldofwarcraft|diablo|hearthstone|starcraft|valorant|leagueoflegends|leagueclient|fortnite|apex|minecraft|eldenring|cyberpunk|forza|game-win64-shipping)/i;

export function isLikelyGameProcess(process) {
  return GAME_PROCESS_HINTS.test(`${process?.name || ''} ${process?.path || ''}`);
}

export function commandKey(value = '') {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function gameWords(game) {
  return [game?.name, ...(game?.genres || []), ...(game?.genreTags || []), ...(game?.genreProfile?.tags || []), ...(game?.genreProfile?.core || [])].filter(Boolean).join(' ');
}

export function closestLibraryGames(games, query) {
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

export function libraryCommandFor(text, games, chooseIndex = (length) => Math.floor(Math.random() * length)) {
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
    const chosen = candidates.length ? candidates[Math.max(0, Math.min(candidates.length - 1, chooseIndex(candidates.length)))] : null;
    return chosen ? { game: chosen, text: `I chose ${chosen.name} from your visible library. Ready when you are.`, actionLabel: `Launch ${chosen.name}` } : { text: 'Your visible library is empty right now, so I have nothing safe to choose.' };
  }
  const chosen = closestLibraryGames(games, request)[0];
  return chosen
    ? { game: chosen, text: `${chosen.name} is ready. I will wait for your confirmation.`, actionLabel: `Launch ${chosen.name}` }
    : { text: `I could not match “${request}” in your visible library. Try the game name exactly, or ask me to help you find something similar.` };
}

export function messageFor({ healthState, newsAlert, favouriteUpdate, appUpdate, activity, notificationSettings }) {
  if (healthState === 'high' && notificationEnabled(notificationSettings, 'pcHigh')) return { key: 'pc-high', level: 'major', title: 'Hey — your PC needs attention', body: 'CPU or RAM use is staying very high. Let’s check what is competing with your game before you launch.', action: 'Show performance', kind: 'health' };
  if (newsAlert && notificationEnabled(notificationSettings, 'favouriteNews')) return { key: `news-${newsAlert.id}`, level: 'minor', title: `News for ${newsAlert.gameName || 'a favourite'}`, body: newsAlert.title || 'Something new just landed.', action: 'Read news', kind: 'news' };
  if (favouriteUpdate && notificationEnabled(notificationSettings, 'favouriteUpdates')) return { key: `game-update-${favouriteUpdate.id}`, level: 'minor', title: `${favouriteUpdate.name} has an update`, body: 'A favourited game has a verified newer version ready to check out.', action: 'View game', kind: 'game-update' };
  if (appUpdate && notificationEnabled(notificationSettings, 'appUpdates')) return { key: `neolib-${appUpdate.latestVersion || 'available'}`, level: 'minor', title: 'A NEO-LIB update is ready', body: appUpdate.latestVersion ? `Version ${appUpdate.latestVersion} is available.` : 'A newer NEO-LIB release is available.', action: 'See update', kind: 'app-update' };
  if (healthState === 'check' && notificationEnabled(notificationSettings, 'pcCheck')) return { key: 'pc-check', level: 'minor', title: 'Quick PC check', body: 'Your CPU or RAM use is elevated. I can show you what to check before gaming.', action: 'Show performance', kind: 'health' };
  // A switched-off observation must not surface an old event later just
  // because the player enables that switch again. Activity is a short-lived
  // acknowledgement, not a permanent alert source.
  if (activity?.key && (!activity.expiresAt || activity.expiresAt > Date.now()) && notificationEnabled(notificationSettings, activity.preferenceKey || 'activity')) return { ...activity, kind: 'activity', level: activity.level || 'minor', action: activity.action || 'Okay' };
  return null;
}

export function voiceForNotice(notice) {
  if (notice?.voice) return notice.voice;
  if (notice?.kind === 'welcome') return '';
  if (notice?.kind === 'news') return 'news';
  if (notice?.kind === 'game-update') return 'check-this';
  if (notice?.kind === 'app-update') return 'neolib-update';
  if (notice?.kind === 'health' && notice.level === 'major') return 'attention';
  if (notice?.kind === 'health') return 'ouff';
  return '';
}

export function appendMascotNotice(inbox = [], entry, now = Date.now(), limit = 60) {
  if (!entry?.key) return Array.isArray(inbox) ? inbox : [];
  const safeInbox = Array.isArray(inbox) ? inbox : [];
  const boundedLimit = Math.max(1, Math.min(200, Number(limit) || 60));
  return [{ ...entry, createdAt: now }, ...safeInbox].slice(0, boundedLimit);
}
