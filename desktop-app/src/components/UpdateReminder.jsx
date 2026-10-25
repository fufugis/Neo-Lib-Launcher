import React from 'react';
import { DownloadCloud, X } from 'lucide-react';
import { renderForegroundPortal } from './ui/VisualBoundary';
import { playNewsChime } from '../lib/sound';
import { notificationSurfaceBlocked } from './news/notification-surface.mjs';
import { UPDATE_REMINDER_KEY, normalizeUpdateReminder, updateReminderDue, dismissUpdateReminder } from '../lib/update-reminder.mjs';

// One small durable reminder, not a modal and never a game-focus request.
export default function UpdateReminder({ info, paused = false, settings = {}, onDownload }) {
  const current = React.useRef(null);
  const preferences = React.useRef(settings); preferences.current = settings;
  const [pending, setPending] = React.useState(false);
  const [position, setPosition] = React.useState({ top: 52, right: 16 });
  const [error, setError] = React.useState('');
  const enabled = Boolean(info?.available && !info.error && info.latestVersion);
  const version = info?.latestVersion;
  const commit = React.useCallback(state => {
    current.current = state;
    try { localStorage.setItem(UPDATE_REMINDER_KEY, JSON.stringify(state)); } catch { /* Session reminder still works. */ }
    setPending(state.pending);
  }, []);
  React.useEffect(() => {
    if (!enabled) { setPending(false); return undefined; }
    let saved;
    try { saved = JSON.parse(localStorage.getItem(UPDATE_REMINDER_KEY) || 'null'); } catch { /* Recover locally. */ }
    commit(normalizeUpdateReminder(current.current || saved, version));
    const check = () => {
      if (paused || !updateReminderDue(current.current)) return;
      // Let onboarding/patch notes and existing modal announcements finish first.
      if (notificationSurfaceBlocked(document)) return;
      commit({ ...current.current, pending: true });
      playNewsChime({ enabled: preferences.current.soundsEnabled !== false && preferences.current.soundPack !== 'none' });
    };
    check();
    const timer = window.setInterval(check, 15000);
    window.addEventListener('focus', check); document.addEventListener('visibilitychange', check);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', check); document.removeEventListener('visibilitychange', check); };
  }, [enabled, version, paused, commit]);
  React.useLayoutEffect(() => {
    if (!enabled || !pending || paused) return undefined;
    const pill = document.querySelector('[data-testid="titlebar-update-pill"]');
    if (pill) pill.dataset.reminder = 'true';
    const place = () => {
      const rect = pill?.getBoundingClientRect();
      const width = Math.min(330, window.innerWidth - 24);
      setPosition({ top: rect?.height ? Math.max(12, Math.min(window.innerHeight - 180, rect.bottom + 12)) : 52,
        left: Math.max(12, Math.min(window.innerWidth - width - 12, rect?.width ? rect.right - width : window.innerWidth - width - 16)), width });
    };
    place(); window.addEventListener('resize', place);
    return () => { if (pill) delete pill.dataset.reminder; window.removeEventListener('resize', place); };
  }, [enabled, pending, paused, version]);
  if (!enabled || !pending || paused) return null;
  return renderForegroundPortal(<aside role="status" aria-label="Update reminder" data-testid="update-reminder" className="update-reminder titlebar-nodrag" style={position}>
    <header><strong><DownloadCloud size={18} /> Update available</strong><button type="button" aria-label="Close update reminder" onClick={() => { setError(''); commit(dismissUpdateReminder(current.current)); }}><X size={20} /></button></header>
    <p>NEO-LIB v{version} is waiting for you.</p>
    <button type="button" className="update-reminder-download" onClick={async () => { try { const result = await onDownload?.(info.downloadUrl || info.releaseUrl); if (result?.ok === false) throw new Error(); } catch { setError('Could not open the download. Please try again.'); } }}>Download update</button>
    {error && <p role="alert">{error}</p>}
    <small>Close with X · we’ll remind you again in an hour. Nothing installs automatically.</small>
  </aside>);
}
