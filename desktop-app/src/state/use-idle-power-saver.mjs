import React from 'react';
import { shouldSaveIdlePower, IDLE_POWER_CHECK_MS } from './idle-power-model.mjs';

// Only aggregate idle seconds and one transient activity timestamp are used.
// No key names, mouse positions, input history or persistent activity storage.
export function useIdlePowerSaver({ nativeApi, enabled = true, gameRunning = false, blocked = false }) {
  const [saving, setSaving] = React.useState(false);
  const savingRef = React.useRef(false);
  React.useEffect(() => {
    const update = value => { if (savingRef.current !== value) { savingRef.current = value; setSaving(value); } };
    update(false);
    if (!enabled || gameRunning || blocked) return undefined;
    const startedAt = Date.now();
    let lastActivityAt = 0;
    let alive = true;
    let busy = false;
    const activity = event => {
      if (event.type !== 'neolib:controller-activity' && !event.isTrusted) return;
      lastActivityAt = Date.now();
      update(false);
    };
    const check = async () => {
      if (busy) return;
      busy = true;
      let systemIdleSeconds = null;
      try { systemIdleSeconds = await nativeApi?.readSystemIdleSeconds?.(); } catch { /* Local quiet timer still works without native idle data. */ }
      finally { busy = false; }
      if (alive) update(shouldSaveIdlePower({ now: Date.now(), startedAt, lastActivityAt, systemIdleSeconds }));
    };
    const events = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart', 'neolib:controller-activity'];
    for (const name of events) window.addEventListener(name, activity, { capture: true, passive: true });
    window.addEventListener('focus', activity);
    void check();
    const timer = window.setInterval(check, IDLE_POWER_CHECK_MS);
    return () => {
      alive = false; window.clearInterval(timer);
      for (const name of events) window.removeEventListener(name, activity, true);
      window.removeEventListener('focus', activity);
    };
  }, [nativeApi, enabled, gameRunning, blocked]);
  return saving;
}
