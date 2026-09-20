function windowsIdentity(os) {
  const release = String(os?.release?.() || '');
  const build = Number(release.split('.')[2] || 0);
  const family = build >= 22000 ? 'Windows 11' : process.platform === 'win32' ? 'Windows 10' : 'Windows';
  return {
    family,
    caption: family,
    build,
    release,
    supportsHags: build >= 19041,
  };
}

function createOptimizeProcessService({ readSystemHealth, os, taskManagerPath = '', nowMs = () => Date.now() }) {
  if (typeof readSystemHealth !== 'function' || typeof os?.release !== 'function') {
    throw new TypeError('createOptimizeProcessService requires aggregate system-health and OS dependencies.');
  }

  async function inspectGaming() {
    const health = await readSystemHealth();
    if (!health || !Number.isFinite(health.memoryTotalGb)) {
      return { ok: false, error: 'Windows performance details are unavailable.' };
    }
    return {
      ok: true,
      inspectionMode: 'aggregate-only',
      processes: [],
      gpu: [],
      gpuAvailable: false,
      health,
      taskManagerPath: String(taskManagerPath || ''),
      os: windowsIdentity(os),
      settings: {
        gameMode: 'check in Windows',
        hags: 'check in Windows',
        backgroundCapture: 'check in Windows',
        powerPlan: 'check in Windows',
        pendingRestart: false,
      },
      inspectedAt: nowMs(),
    };
  }

  async function closeProcess() {
    return { ok: false, error: 'NEO-LIB no longer inspects or closes other programs. Use Windows Task Manager for per-process control.' };
  }

  return Object.freeze({ inspectGaming, closeProcess });
}

module.exports = { createOptimizeProcessService, windowsIdentity };
