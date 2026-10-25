import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { sendChangelogReaction } from './FeedbackModal';
import { UPCOMING_CHANGELOG } from './changelog/upcoming-changelog.mjs';
import { recentReleaseNotes, releaseVersion } from './changelog/release-history-model.mjs';
import ChangelogReleaseNotes from './changelog/ChangelogReleaseNotes';
export { CHANGELOG } from './changelog/changelog-content.mjs';

// Browsing does not acknowledge an update; only the caller's close action does.
export default function ChangelogModal({ open, currentVersion, onClose, theme }) {
  const releases = React.useMemo(() => recentReleaseNotes(currentVersion), [currentVersion]);
  const [selectedVersion, setSelectedVersion] = React.useState(null);
  const dialog = React.useRef(null), body = React.useRef(null), close = React.useRef(onClose);
  const titleId = React.useId(), panelId = React.useId();
  React.useLayoutEffect(() => { close.current = onClose; });
  React.useLayoutEffect(() => {
    if (open) setSelectedVersion(releases[0]?.version || 'upcoming');
  }, [open, releases]);
  const entry = selectedVersion === 'upcoming' ? UPCOMING_CHANGELOG
    : releases.find(item => item.version === selectedVersion) || releases[0];
  React.useLayoutEffect(() => { if (body.current) body.current.scrollTop = 0; }, [entry?.version, open]);
  React.useEffect(() => {
    if (!open) return;
    const opener = document.activeElement;
    dialog.current?.querySelector('[aria-selected="true"]')?.focus();
    const keyboard = event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close.current?.(); }
      if (event.key !== 'Tab') return;
      const controls = [...(dialog.current?.querySelectorAll('button:not([disabled]):not([tabindex="-1"]), [tabindex="0"]') || [])];
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', keyboard);
    return () => { document.removeEventListener('keydown', keyboard); if (opener?.isConnected) opener.focus(); };
  }, [open]);
  const navigate = (event, index) => {
    const offset = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
    if (!offset && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? releases.length - 1
      : (index + offset + releases.length) % releases.length;
    setSelectedVersion(releases[next].version);
    dialog.current?.querySelectorAll('[role="tab"]')[next]?.focus();
  };
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[230] grid place-items-center bg-black/60 backdrop-blur-sm"
          onMouseDown={event => { if (event.target === event.currentTarget) onClose?.(); }} data-testid="changelog-overlay">
          <motion.div ref={dialog} role="dialog" aria-modal="true" aria-labelledby={titleId}
            initial={{ y: 16, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 10, opacity: 0 }} transition={{ duration: 0.22, ease: 'easeOut' }}
            onMouseDown={event => event.stopPropagation()}
            className="patch-history rounded-xl hairline glass shadow-2xl" data-testid="changelog-modal">
            <header className="flex items-center justify-between gap-2 px-5 py-3 border-b border-[rgb(var(--border))]/60">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[rgb(var(--accent))]" />
                <h3 id={titleId} className="font-display font-bold tracking-widest text-sm uppercase">Patch notes</h3>
                <span className="text-xs text-muted">v{currentVersion}</span>
              </div>
              <button aria-label="Close patch notes" data-testid="changelog-close" onClick={onClose}
                className="grid h-8 w-8 place-items-center rounded hover:bg-panel"><X size={16} /></button>
            </header>
            <div className="patch-history-body">
              <nav className="patch-history-nav" aria-label="Patch note history">
                <p className="text-[10px] uppercase tracking-widest text-muted mb-2">Recent releases</p>
                <div role="tablist" aria-label="Latest five releases" className="patch-history-choices">
                  {releases.map((release, index) => (
                    <button key={release.version} role="tab" aria-selected={entry?.version === release.version}
                      aria-controls={panelId} tabIndex={entry?.version === release.version ? 0 : -1}
                      onKeyDown={event => navigate(event, index)} onClick={() => setSelectedVersion(release.version)}
                      className="patch-history-choice" data-testid={`changelog-select-${release.version}`}>
                      <span className="flex items-center justify-between gap-2 font-bold">v{release.version}
                        {release.version === releaseVersion(currentVersion) && <small>Current</small>}</span>
                      <span className="text-xs opacity-80">{release.title}</span>
                    </button>
                  ))}
                </div>
                <button className="patch-history-choice patch-history-upcoming" aria-pressed={entry?.unreleased === true}
                  onClick={() => setSelectedVersion('upcoming')} data-testid="changelog-upcoming">
                  <span className="font-bold">Upcoming</span><span className="text-xs opacity-80">Not released yet</span>
                </button>
              </nav>
              <div ref={body} id={panelId} role={entry?.unreleased ? 'region' : 'tabpanel'}
                aria-label={entry?.unreleased ? 'Upcoming additions' : `Version ${entry?.version} notes`}
                tabIndex={0} className="patch-history-notes" data-testid="changelog-notes">
                {entry ? <ChangelogReleaseNotes entry={entry} /> : <p>No release notes are bundled yet.</p>}
              </div>
            </div>
            <footer className="patch-history-footer border-t border-[rgb(var(--border))]/60 bg-panel/70 px-5 py-3">
              {entry && !entry.unreleased ? <RateThisUpdate key={entry.version} version={entry.version} theme={theme} />
                : <span className="text-xs text-muted">A preview of future additions</span>}
              <button data-testid="changelog-got-it" onClick={onClose}
                className="neon rounded-full bg-[rgb(var(--accent))] px-5 py-2 text-xs font-bold text-[rgb(var(--surface))]">Got it</button>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function RateThisUpdate({ version, theme }) {
  const [picked, setPicked] = React.useState(null);
  const [sending, setSending] = React.useState(false);
  const fire = async (reaction) => {
    if (sending || picked) return;
    setSending(true);
    setPicked(reaction);
    try { await sendChangelogReaction({ version, reaction, theme }); } catch { /* ignore */ }
    setSending(false);
  };
  if (picked) {
    return (
      <span className="text-[11px] text-muted inline-flex items-center gap-1.5" data-testid="rate-thanks">
        <span className="text-[14px]">{picked}</span> Thanks — noted!
      </span>
    );
  }
  return (
    <div className="flex items-center gap-2" data-testid="rate-this-update">
      <span className="text-[10.5px] uppercase tracking-wider text-muted">Rate this update</span>
      {['😍', '😐', '😕'].map((e) => (
        <button
          key={e}
          onClick={() => fire(e)}
          data-testid={`rate-${e}`}
          className="grid h-7 w-7 place-items-center rounded-full hairline text-[14px] transition-transform hover:scale-125 hover:border-[rgb(var(--accent)/0.6)] hover:bg-[rgb(var(--accent)/0.10)]"
          title={`Rate: ${e}`}
        >
          {e}
        </button>
      ))}
    </div>
  );
}
