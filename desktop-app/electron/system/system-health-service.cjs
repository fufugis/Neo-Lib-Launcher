const CPU_SAMPLE_WINDOW_MS = 1000;

function createSystemHealthService({ os, delay = (ms) => new Promise(resolve => setTimeout(resolve, ms)) }) {
  if (typeof os?.cpus !== 'function' || typeof os?.totalmem !== 'function' || typeof os?.freemem !== 'function') {
    throw new TypeError('createSystemHealthService requires the Node os API.');
  }
  if (typeof delay !== 'function') throw new TypeError('delay must be a function.');

  function cpuSample() {
    return os.cpus().reduce((total, cpu) => {
      const times = cpu.times || {};
      total.idle += times.idle || 0;
      total.total += Object.values(times).reduce((sum, value) => sum + value, 0);
      return total;
    }, { idle: 0, total: 0 });
  }

  async function read() {
    // Always measure a fresh, short interval. Reusing the previous 15-second
    // polling snapshot made NEO-LIB describe a much older average than Windows
    // Task Manager's current view, so both could be valid but look contradictory.
    const previous = cpuSample();
    await delay(CPU_SAMPLE_WINDOW_MS);
    const next = cpuSample();
    const totalDelta = next.total - previous.total;
    const idleDelta = next.idle - previous.idle;
    const cpuPercent = totalDelta > 0
      ? Math.max(0, Math.min(100, Math.round((1 - (idleDelta / totalDelta)) * 100)))
      : null;
    const totalBytes = os.totalmem();
    const freeBytes = os.freemem();
    const usedBytes = Math.max(0, totalBytes - freeBytes);
    const toGb = value => Math.round((value / (1024 ** 3)) * 10) / 10;
    return {
      cpuPercent,
      ramPercent: totalBytes ? Math.round((usedBytes / totalBytes) * 100) : null,
      memoryUsedGb: toGb(usedBytes),
      memoryFreeGb: toGb(freeBytes),
      memoryTotalGb: toGb(totalBytes),
    };
  }

  return Object.freeze({ read });
}

module.exports = { CPU_SAMPLE_WINDOW_MS, createSystemHealthService };
