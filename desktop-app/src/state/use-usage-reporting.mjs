import React from 'react';
import { createUsageReporter, withdrawStoredUsage, USAGE_WITHDRAWAL_KEY } from '../services/usage-reporting.mjs';
import { USAGE_PRIVACY_READY } from '../services/usage-privacy.mjs';

export function useUsageReporting({ ready, enabled, endpoint, version, setupComplete, blocked }) {
  enabled = enabled === true && USAGE_PRIVACY_READY;
  const reporter = React.useRef(null);
  React.useEffect(() => {
    if (!ready) return undefined;
    let alive = true; let starting = false;
    const start = async () => {
      if (starting || !alive) return;
      starting = true;
      try {
        if (!enabled || localStorage.getItem(USAGE_WITHDRAWAL_KEY)) {
          if (!await withdrawStoredUsage({ endpoint, storage: localStorage })) return;
        }
        if (!alive || !enabled) return;
        if (reporter.current) { void reporter.current.flush(); return; }
        const client = createUsageReporter({ endpoint, version, storage: localStorage });
        reporter.current = client; client.record('first_open');
        if (setupComplete) client.record('setup_complete');
      } catch { /* Storage unavailable: fail closed, never bypass consent. */ }
      finally { starting = false; window.dispatchEvent(new Event('neolib:usage-privacy-state')); }
    };
    void start();
    const online = () => { void start(); };
    window.addEventListener('online', online);
    window.addEventListener('neolib:usage-delete-retry', online);
    return () => { alive = false; reporter.current?.stop(); reporter.current = null; window.removeEventListener('online', online); window.removeEventListener('neolib:usage-delete-retry', online); };
  }, [ready, enabled, endpoint, version, setupComplete]);
  React.useEffect(() => { if (enabled && setupComplete) reporter.current?.record('setup_complete'); }, [enabled, setupComplete]);
  React.useEffect(() => {
    if (!ready || !enabled || blocked || !setupComplete) return undefined;
    let lastInput = 0; let activeSeconds = 0; let lastSample = Date.now(); let day = new Date().toISOString().slice(0, 10);
    const input = event => { if (event.isTrusted || event.type === 'neolib:controller-activity') { const now = Date.now(); if (!lastInput || now - lastInput >= 5 * 60 * 1000) lastSample = now; lastInput = now; } };
    const resetSample = () => { lastSample = Date.now(); };
    const events = ['pointerdown', 'keydown', 'wheel', 'neolib:controller-activity'];
    for (const name of events) window.addEventListener(name, input, { capture: true, passive: true });
    window.addEventListener('focus', resetSample); window.addEventListener('blur', resetSample); document.addEventListener('visibilitychange', resetSample);
    const timer = window.setInterval(() => {
      const today = new Date().toISOString().slice(0, 10);
      if (today !== day) { day = today; activeSeconds = 0; }
      const now = Date.now(); const elapsed = Math.max(0, Math.min(30, (now - lastSample) / 1000)); lastSample = now;
      if (document.visibilityState === 'visible' && document.hasFocus() && lastInput && now - lastInput < 5 * 60 * 1000) activeSeconds += elapsed;
      if (activeSeconds >= 120) { reporter.current?.record('active_day'); activeSeconds = 0; }
    }, 30000);
    return () => { window.clearInterval(timer); for (const name of events) window.removeEventListener(name, input, true); window.removeEventListener('focus', resetSample); window.removeEventListener('blur', resetSample); document.removeEventListener('visibilitychange', resetSample); };
  }, [ready, enabled, blocked, setupComplete]);
}
