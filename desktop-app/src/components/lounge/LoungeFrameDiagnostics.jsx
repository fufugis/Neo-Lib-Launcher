import React from 'react';

// Development-only measurement: never mounts in a packaged renderer.
// RAF cadence is UI scheduling, not a claim about GPU-presented frames.
export default function LoungeFrameDiagnostics({ browserRef }) {
  const label = React.useRef(null);
  const testing = React.useRef(false);
  React.useEffect(() => {
    // Session-only isolation. Never change saved preferences or packaged UI.
    const modes = [
      ['all effects', ''],
      ['lighting bypass', '.lounge-living-backdrop__fx,.lounge-living-backdrop__specular,.lounge-living-backdrop__edge{visibility:hidden!important}'],
      ['CSS fallback grading bypass', '.lounge-art-pixels{filter:none!important}'],
      ['card FX bypass', '.lounge-browser-card{box-shadow:none!important}.lounge-browser-card::before,.lounge-browser-card::after,.lounge-card-frame{visibility:hidden!important}.lounge-browser-card>span:first-child{filter:none!important}'],
      ['foreground blur bypass', '*{backdrop-filter:none!important}'],
    ];
    let isolation = 0;
    const isolationStyle = document.createElement('style');
    document.head.appendChild(isolationStyle);
    let frame = 0, previous = 0, started = 0, samples = [], timer = 0, testSamples = [], result = '', events = 0;
    let blockedMs = 0, longTasks = 0;
    const observer = typeof PerformanceObserver === 'function' && PerformanceObserver.supportedEntryTypes?.includes('longtask') ? new PerformanceObserver(list => {
      for (const entry of list.getEntries()) { blockedMs += entry.duration; longTasks++; }
    }) : null;
    observer?.observe({ type: 'longtask' });
    const tick = now => {
      if (!started) started = now;
      if (previous && document.visibilityState === 'visible') {
        samples.push(now - previous);
        if (testing.current) testSamples.push(now - previous);
      }
      previous = now;
      if (now - started >= 1000 && samples.length) {
        const sorted = [...samples].sort((a, b) => a - b);
        const fps = samples.length * 1000 / samples.reduce((sum, ms) => sum + ms, 0);
        const p95 = sorted[Math.floor((sorted.length - 1) * 0.95)];
        if (label.current) label.current.textContent = `UI cadence ${fps.toFixed(0)}/s · p95 ${p95.toFixed(1)}ms · >50ms ${samples.filter(ms => ms > 50).length} · ${observer ? `main-thread stalls ${longTasks}/${blockedMs.toFixed(0)}ms` : 'stall measurement unavailable'} · ${document.querySelector('[data-testid="neo-lounge"] [data-gpu-art-ready="true"]') ? 'GPU art' : 'CSS art'} · ${testing.current ? 'FAST SCROLL' : result || 'F8: 8s scroll test'}`;
        if (label.current) label.current.textContent += ` · ${modes[isolation][0]} (F9)`;
        samples = []; started = now; blockedMs = 0; longTasks = 0;
      }
      frame = window.requestAnimationFrame(tick);
    };
    const key = event => {
      if (event.key === 'F9' && !testing.current) {
        event.preventDefault(); isolation = (isolation + 1) % modes.length;
        isolationStyle.textContent = modes[isolation][1].replace(/([^{}]+)\{/g, (_, selectors) => selectors.split(',').map(selector => `[data-testid="neo-lounge"] ${selector}`).join(',') + '{');
        result = ''; return;
      }
      if (event.key !== 'F8' || testing.current || !browserRef.current) return;
      event.preventDefault();
      testing.current = true;
      testSamples = []; events = 0; result = '';
      const start = performance.now();
      timer = window.setInterval(() => {
        const elapsed = performance.now() - start;
        if (elapsed >= 8000 || !browserRef.current) {
          window.clearInterval(timer); testing.current = false;
          const sorted = [...testSamples].sort((a, b) => a - b);
          const cadence = testSamples.length * 1000 / testSamples.reduce((sum, ms) => sum + ms, 0);
          const p95 = sorted[Math.floor((sorted.length - 1) * 0.95)] || 0;
          result = `8s test: ${events} wheel events, ${cadence.toFixed(0)}/s, p95 ${p95.toFixed(1)}ms, >50ms ${testSamples.filter(ms => ms > 50).length}`;
          return;
        }
        events++;
        browserRef.current.dispatchEvent(new WheelEvent('wheel', { deltaY: elapsed < 4000 ? 120 : -120, bubbles: true, cancelable: true }));
      }, 60);
    };
    frame = window.requestAnimationFrame(tick);
    window.addEventListener('keydown', key);
    return () => { isolationStyle.remove(); observer?.disconnect(); window.cancelAnimationFrame(frame); window.clearInterval(timer); window.removeEventListener('keydown', key); testing.current = false; };
  }, [browserRef]);
  return <div ref={label} data-testid="lounge-frame-diagnostics" className="pointer-events-none fixed right-8 top-[140px] z-[80] rounded bg-black/70 px-2 py-1 text-xs font-mono text-white">Measuring UI frame cadence…</div>;
}
