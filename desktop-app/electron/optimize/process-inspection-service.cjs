const DEFAULT_PROTECTED_NAMES = new Set(['system', 'registry', 'smss', 'csrss', 'wininit', 'services', 'lsass', 'svchost', 'winlogon', 'dwm', 'explorer', 'fontdrvhost', 'sihost', 'taskhostw']);

function createOptimizeProcessService({ runPowerShellJson, inspectScript, execFile, normalWinPath, currentPid = process.pid, currentExecPath = process.execPath, nowMs = () => Date.now(), protectedNames = DEFAULT_PROTECTED_NAMES }) {
  if (typeof runPowerShellJson !== 'function' || typeof execFile !== 'function' || typeof normalWinPath !== 'function') throw new TypeError('createOptimizeProcessService requires inspection, process and path dependencies.');
  const snapshot = new Map();

  async function inspectGaming() {
    const payload = await runPowerShellJson(inspectScript);
    if (!payload) return { ok: false, error: 'Windows performance details are unavailable.' };
    snapshot.clear();
    const processes = (Array.isArray(payload.processes) ? payload.processes : payload.processes ? [payload.processes] : []).map(entry => {
      const pid = Number(entry.pid);
      const name = String(entry.name || 'Unknown');
      const protectedEntry = pid <= 4 || pid === currentPid || protectedNames.has(name.toLowerCase()) || normalWinPath(entry.path) === normalWinPath(currentExecPath);
      const record = { pid, name, path: String(entry.path || ''), protected: protectedEntry, capturedAt: nowMs() };
      if (pid > 0) snapshot.set(pid, record);
      return { ...record, cpuPercent: Number(entry.cpuPercent || 0), memoryBytes: Number(entry.memoryBytes || 0) };
    });
    const gpu = (Array.isArray(payload.gpu) ? payload.gpu : payload.gpu ? [payload.gpu] : []).map(entry => ({ pid: Number(entry.pid), name: String(entry.name || 'Unknown'), percent: Number(entry.percent || 0) }));
    return { ok: true, processes, gpu, gpuAvailable: !!payload.gpuAvailable, os: payload.os || {}, settings: payload.settings || {}, inspectedAt: nowMs() };
  }

  async function closeProcess({ pid, name } = {}) {
    const numericPid = Number(pid);
    const record = snapshot.get(numericPid);
    if (!record || nowMs() - record.capturedAt > 2 * 60 * 1000) return { ok: false, error: 'The process list is stale. Refresh it first.' };
    if (record.protected || record.name !== String(name || '')) return { ok: false, error: 'NEO-LIB will not close this protected or changed process.' };
    return new Promise(resolve => {
      execFile('taskkill.exe', ['/PID', String(numericPid)], { windowsHide: true, timeout: 8000 }, error => {
        if (error) return resolve({ ok: false, error: 'Windows refused the normal close request. NEO-LIB will not force-kill it.' });
        snapshot.delete(numericPid);
        resolve({ ok: true, name: record.name });
      });
    });
  }

  return Object.freeze({ inspectGaming, closeProcess });
}

module.exports = { createOptimizeProcessService };
