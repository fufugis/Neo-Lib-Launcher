const PROCESS_PATH_SCRIPT = 'Get-CimInstance -ClassName Win32_Process | Where-Object { $_.ExecutablePath } | Select-Object ProcessId,ExecutablePath | ConvertTo-Json -Compress';

function createExternalGameWatchService({
  execFile, path, platform = process.platform, normalWinPath, isLikelyGameExe,
  getRunningGameKeys, sendExternalState, setTimer = setTimeout, clearTimer = clearTimeout,
}) {
  if (typeof execFile !== 'function' || !path || typeof normalWinPath !== 'function' || typeof isLikelyGameExe !== 'function') {
    throw new TypeError('createExternalGameWatchService requires process, path and game-filter dependencies.');
  }
  const state = { games: [], timer: null, checking: false, activeId: null };

  function runningProcesses() {
    return new Promise(resolve => {
      if (platform !== 'win32') return resolve([]);
      execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', PROCESS_PATH_SCRIPT], { windowsHide: true, timeout: 8000, maxBuffer: 8 * 1024 * 1024 }, (error, stdout) => {
        if (error || !stdout) return resolve([]);
        try {
          const parsed = JSON.parse(stdout);
          const records = Array.isArray(parsed) ? parsed : [parsed];
          resolve(records.map(entry => ({ path: normalWinPath(entry?.ExecutablePath), name: path.basename(normalWinPath(entry?.ExecutablePath)) })).filter(entry => entry.path));
        } catch { resolve([]); }
      });
    });
  }

  function schedule(delayMs) {
    if (state.timer) clearTimer(state.timer);
    state.timer = null;
    if (!state.games.length) return;
    state.timer = setTimer(() => {
      state.timer = null;
      check();
    }, delayMs);
  }

  async function check() {
    if (state.checking || !state.games.length) return { ok: false, busy: true };
    state.checking = true;
    try {
      const processes = await runningProcesses();
      const launchedHere = new Set([...getRunningGameKeys()].map(String));
      const active = state.games.find((game) => !launchedHere.has(String(game.id)) && processes.some((process) => {
        if (process.path === game.exePath) return true;
        // Exact file matching is preferred. The install-root fallback is only
        // for launchers that spawn a child EXE (Battle.net's Overwatch retail
        // process is the important example). It never scans arbitrary folders,
        // matches launchers/helpers, or treats an idle client as a game.
        if (!game.installDir || !isLikelyGameExe(process.name)) return false;
        const root = `${String(game.installDir).replace(/[\\/]+$/, '')}\\`;
        return process.path.startsWith(root);
      })) || null;
      const nextId = active?.id || null;
      if (nextId !== state.activeId) {
        state.activeId = nextId;
        sendExternalState({ active: !!active, gameId: active?.id || null, name: active?.name || '' });
      }
      return { ok: true, active: !!active, gameId: active?.id || null, name: active?.name || '' };
    } finally {
      state.checking = false;
      schedule(state.activeId ? 8000 : 30000);
    }
  }

  async function watch({ games = [] } = {}) {
    const candidates = (games || []).map((game) => {
      const exePath = normalWinPath(game?.exePath);
      const suppliedInstallDir = normalWinPath(game?.installDir);
      const installDir = suppliedInstallDir || (path.isAbsolute(exePath) ? path.dirname(exePath) : '');
      return { id: game?.id, name: String(game?.name || 'Game'), exePath, installDir, hasInstallDir: !!suppliedInstallDir };
    });
    state.games = candidates.filter(game => game.id && game.exePath && path.isAbsolute(game.exePath) && (isLikelyGameExe(path.basename(game.exePath)) || game.hasInstallDir));
    const ignored = candidates.length - state.games.length;
    if (!state.games.length) {
      state.activeId = null;
      if (state.timer) { clearTimer(state.timer); state.timer = null; }
      return { ok: true, watching: 0, ignored };
    }
    if (!state.timer) check();
    return { ok: true, watching: state.games.length, ignored };
  }

  return Object.freeze({ watch, scanNow: check });
}

module.exports = { createExternalGameWatchService };
