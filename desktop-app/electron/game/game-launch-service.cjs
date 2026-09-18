function createGameLaunchService({
  shell, spawn, path, crypto, platform = process.platform, appStartedAt,
  recordSafety, readSharedSafety, writeSharedSafety, setDiscordActivity,
  clearDiscordActivity, sendExited, nowMs = () => Date.now(),
}) {
  if (!shell || typeof spawn !== 'function' || !path || !crypto || typeof recordSafety !== 'function') {
    throw new TypeError('createGameLaunchService requires shell, process, path, crypto and safety dependencies.');
  }
  const runningGames = new Map();
  const authorizations = new Map();
  const safety = { lastAt: 0, lockedUntil: 0 };
  const cooldownMs = 3500;
  const lockMs = 10000;
  const quarantineMs = 15000;

  function arm(event) {
    const now = nowMs();
    const senderId = event?.sender?.id;
    if (now - appStartedAt < quarantineMs) {
      recordSafety('blocked-arm-during-startup-quarantine', { senderId });
      return { ok: false, error: 'NEO-LIB is still settling after startup. Please wait a moment before launching a game.' };
    }
    const token = crypto.randomBytes(24).toString('hex');
    authorizations.set(senderId, { token, expiresAt: now + 1200 });
    recordSafety('armed-by-trusted-launch-control', { senderId });
    return { ok: true, token };
  }

  async function launch(event, { exePath, launchArgs, gameId, name, launchToken } = {}) {
    if (!exePath || typeof exePath !== 'string') return { ok: false, error: 'No exePath provided' };
    try {
      if (/^(?:ms-settings:|shell:)/i.test(exePath)) {
        await shell.openExternal(exePath);
        return { ok: true, target: 'uri' };
      }
      const now = nowMs();
      const senderId = event?.sender?.id;
      const safeName = String(name || path.basename(exePath) || 'unknown').slice(0, 120);
      const authorization = authorizations.get(senderId);
      authorizations.delete(senderId);
      if (!authorization || authorization.token !== launchToken || now > authorization.expiresAt) {
        recordSafety('blocked-missing-launch-authorization', { gameId, name: safeName, senderId });
        return { ok: false, error: 'Launch safety blocked a request that did not come from the Launch button.' };
      }
      if (now - appStartedAt < quarantineMs) {
        recordSafety('blocked-startup-quarantine', { gameId, name: safeName, sinceStartMs: now - appStartedAt });
        return { ok: false, error: 'NEO-LIB is still settling after startup. Please wait a moment before launching a game.' };
      }
      if (now < safety.lockedUntil) {
        recordSafety('blocked-local-lock', { gameId, name: safeName });
        return { ok: false, error: 'Launch safety lock is active. Please wait a moment before starting another game.' };
      }
      if (now - safety.lastAt < cooldownMs) {
        safety.lockedUntil = now + lockMs;
        recordSafety('blocked-local-rapid-repeat', { gameId, name: safeName });
        return { ok: false, error: 'Launch safety blocked rapid repeated game starts. Please wait a moment and try again.' };
      }
      const shared = readSharedSafety();
      if (now < Number(shared.lockedUntil || 0)) {
        recordSafety('blocked-shared-lock', { gameId, name: safeName });
        return { ok: false, error: 'Launch safety lock is active in another NEO-LIB process. Please wait a moment.' };
      }
      if (now - Number(shared.lastAt || 0) < cooldownMs) {
        const lockedUntil = now + lockMs;
        writeSharedSafety({ lastAt: shared.lastAt || now, lockedUntil });
        recordSafety('blocked-shared-rapid-repeat', { gameId, name: safeName });
        return { ok: false, error: 'Launch safety blocked rapid repeated starts across NEO-LIB windows.' };
      }
      safety.lastAt = now;
      writeSharedSafety({ lastAt: now, lockedUntil: 0 });
      recordSafety('accepted', { gameId, name: safeName });
      const argv = (launchArgs || '').trim() ? (launchArgs || '').trim().split(/\s+/) : [];
      if (platform === 'win32') {
        const child = spawn(exePath, argv, { detached: true, stdio: 'ignore', cwd: path.dirname(exePath) });
        const startedAt = nowMs();
        const key = gameId || exePath;
        runningGames.set(key, { startedAt });
        setDiscordActivity({ name, startedAt });
        child.on('exit', () => {
          const seconds = Math.max(1, Math.round((nowMs() - startedAt) / 1000));
          runningGames.delete(key);
          clearDiscordActivity();
          sendExited({ gameId, exePath, seconds });
        });
        child.on('error', () => { runningGames.delete(key); clearDiscordActivity(); });
        child.unref();
        return { ok: true };
      }
      const error = await shell.openPath(exePath);
      return { ok: !error, error: error || undefined };
    } catch (error) {
      return { ok: false, error: String(error) };
    }
  }

  return Object.freeze({ arm, launch, runningKeys: () => runningGames.keys() });
}

module.exports = { createGameLaunchService };
