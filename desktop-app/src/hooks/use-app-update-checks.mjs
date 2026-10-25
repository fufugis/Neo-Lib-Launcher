import { useEffect } from 'react';
import { checkForUpdates } from '../lib/updateChecker';

// A cheap hourly release check continues during game/rest mode.
export function useAppUpdateChecks(version, onResult) {
  useEffect(() => {
    let cancelled = false, busy = false;
    const check = async () => {
      if (busy) return;
      busy = true;
      try {
        const info = await checkForUpdates(version);
        if (!cancelled && !info.error) onResult(info);
      } catch { /* Keep the last known release during a temporary failure. */ }
      finally { busy = false; }
    };
    void check();
    const timer = window.setInterval(check, 60 * 60 * 1000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [version, onResult]);
}
