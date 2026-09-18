import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check, X } from 'lucide-react';
import { sendChangelogReaction } from './FeedbackModal';
import { CHANGELOG, getChangesSince } from './changelog/changelog-content.mjs';
export { CHANGELOG } from './changelog/changelog-content.mjs';

/**
 * Changelog / "What's new" modal.
 *
 * Shown automatically once after each app update — compares
 * settings.lastSeenVersion vs the current bundled APP_VERSION.
 *
 * Entries are pinned per-version so the user sees only what landed since they
 * last opened the app. First-run (no prior version) skips this modal — the
 * Tutorial handles that case.
 */

export default function ChangelogModal({ open, currentVersion, lastSeenVersion, onClose, theme }) {
  const entries = React.useMemo(
    () => {
      // Automatic opening only happens for an unseen version. A deliberate
      // menu click, however, must always be a useful "read What's New again"
      // action instead of an empty caught-up notice.
      const unseen = getChangesSince(lastSeenVersion);
      return unseen.length ? unseen : CHANGELOG.slice(0, 1);
    },
    [lastSeenVersion, currentVersion]
  );
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[230] grid place-items-center bg-black/60 backdrop-blur-sm"
          onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.(); }}
          data-testid="changelog-overlay"
        >
          <motion.div
            initial={{ y: 16, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 10, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="relative w-[min(620px,94vw)] max-h-[85vh] overflow-hidden rounded-xl hairline glass shadow-2xl"
            data-testid="changelog-modal"
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-[rgb(var(--border))]/60">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-[rgb(var(--accent))]" />
                <h3 className="font-display font-bold tracking-[0.18em] text-sm uppercase">
                  What&apos;s new
                </h3>
                <span className="rounded-full px-2 py-0.5 text-[10px] hairline text-[rgb(var(--accent-2))] bg-[rgb(var(--accent-2)/0.08)]">
                  v{currentVersion}
                </span>
              </div>
              <button
                data-testid="changelog-close"
                onClick={onClose}
                className="grid h-7 w-7 place-items-center rounded text-muted hover:text-ink hover:bg-panel"
                title="Close"
              >
                <X size={14} />
              </button>
            </div>

            <div className="max-h-[60vh] space-y-5 overflow-y-auto px-5 py-4">
              {entries.map((entry) => (
                <section key={entry.version} data-testid={`changelog-entry-${entry.version}`}>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="font-display text-base font-bold text-ink">
                      v{entry.version}
                    </span>
                    <span className="text-[11px] text-muted">{entry.title}</span>
                  </div>
                  {(() => {
                    const sections = entry.major || entry.fixes
                      ? [
                          { title: 'Major changes & new features', items: entry.major || [] },
                          { title: 'Fixes, adjustments & polish', items: entry.fixes || [] },
                        ].filter((section) => section.items.length > 0)
                      : [{ title: null, items: entry.items || [] }];

                    return sections.map((section) => (
                      <div key={section.title || 'changes'} className="mb-4 last:mb-0">
                        {section.title && (
                          <h4 className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[rgb(var(--accent-2))]">
                            {section.title}
                          </h4>
                        )}
                        <ul className="space-y-2">
                          {section.items.map((item, i) => {
                            const structured = typeof item === 'object';
                            return (
                              <li key={i} className="flex items-start gap-2 text-[12.5px] leading-relaxed text-ink/90">
                                <Check size={12} className="mt-1 shrink-0 text-[rgb(var(--accent))]" />
                                {structured ? (
                                  <span><strong className="text-ink">{item.title}</strong> — {item.body}</span>
                                ) : <span>{item}</span>}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ));
                  })()}
                </section>
              ))}
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-[rgb(var(--border))]/60 bg-panel/70 backdrop-blur px-5 py-3">
              {/* v1.5.0 — Rate this update: three emoji reactions fire to Discord */}
              <RateThisUpdate version={currentVersion} theme={theme} />
              <button
                data-testid="changelog-got-it"
                onClick={onClose}
                className="neon inline-flex items-center gap-1.5 rounded-full bg-[rgb(var(--accent))] px-5 py-1.5 text-xs font-bold text-[rgb(var(--surface))] hover:brightness-110"
              >
                Got it
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* v1.5.0 — 3-emoji reaction to fire from a changelog view. Once picked,
   swaps to a thank-you row. Never asks again for the same version. */
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
