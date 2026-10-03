// Development-only, bounded local evidence. No telemetry or production overlay.
export function collectStartupPerformance(target = window) {
  if (!target.PerformanceObserver) return;
  const report = { lcp: null, cls: 0, shifts: [], longTasks: [], interactions: [], resources: [] };
  const label = node => node ? `${node.tagName?.toLowerCase() || ''}${node.id ? `#${node.id}` : ''}${typeof node.className === 'string' ? `.${node.className.trim().split(/\s+/).slice(0, 3).join('.')}` : ''}` : '';
  target.__NEOLIB_STARTUP_PERFORMANCE__ = report;
  const observers = [];
  let shiftWindowStart = 0, lastShift = 0, shiftWindowValue = 0;
  const keep = (list, value) => { list.push(value); if (list.length > 80) list.shift(); };
  for (const type of ['largest-contentful-paint', 'layout-shift', 'longtask', 'event', 'resource']) {
    if (!target.PerformanceObserver.supportedEntryTypes.includes(type)) continue;
    const observer = new target.PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (type === 'largest-contentful-paint') report.lcp = { time: entry.startTime, loadTime: entry.loadTime, renderTime: entry.renderTime, element: label(entry.element), url: entry.url };
        if (type === 'layout-shift' && !entry.hadRecentInput) {
          if (entry.startTime - lastShift > 1000 || entry.startTime - shiftWindowStart > 5000) {
            shiftWindowStart = entry.startTime; shiftWindowValue = 0;
          }
          lastShift = entry.startTime;
          shiftWindowValue += entry.value;
          report.cls = Math.max(report.cls, shiftWindowValue);
          keep(report.shifts, { time: entry.startTime, value: entry.value, elements: (entry.sources || []).map(source => ({ element: label(source.node), before: source.previousRect, after: source.currentRect })) });
        }
        if (type === 'longtask') keep(report.longTasks, { time: entry.startTime, duration: entry.duration });
        if (type === 'event' && entry.interactionId) keep(report.interactions, { name: entry.name, id: entry.interactionId, duration: entry.duration, inputDelay: entry.processingStart - entry.startTime, processing: entry.processingEnd - entry.processingStart });
        if (type === 'resource' && ['img', 'css', 'link'].includes(entry.initiatorType)) keep(report.resources, { name: entry.name, duration: entry.duration, bytes: entry.transferSize });
      }
    });
    observer.observe({ type, buffered: true, ...(type === 'event' ? { durationThreshold: 16 } : {}) });
    observers.push(observer);
  }
  return () => observers.forEach(observer => observer.disconnect());
}
