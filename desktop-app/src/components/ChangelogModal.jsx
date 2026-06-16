import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check, X } from 'lucide-react';

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

export const CHANGELOG = [
  {
    version: '1.1.4',
    title: 'Tray mode + Featured banner',
    items: [
      'Close-to-tray — toggle in Settings → App behaviour. The X button hides NEO-LIB to the system tray (next to the clock) instead of quitting. Right-click the tray icon to fully quit.',
      'Featured deal banner — a slim sponsored card above the deals bar that rotates through Instant Gaming hot deals. Dismissible separately; re-enable in Settings → Deals.',
      'Steam-deal supply expanded earlier (15 entries, ≥20% off) carried over.',
    ],
  },
  {
    version: '1.1.3',
    title: 'More deals, still subtle',
    items: [
      'Instant Gaming hot deals now appear in the rotation — routes through your affiliate code (the paying source).',
      'Steam specials expanded from 8 to 15 entries, threshold lowered to 20% off.',
      'New "All N" pill in the deals bar — opens a tidy popover with every current deal at a glance. Hidden until you click it.',
    ],
  },
  {
    version: '1.1.2',
    title: 'What\u2019s new toast + small polish',
    items: [
      'New: this very modal — pops once after each update so you actually see what changed.',
      'Updated About copy and version badges across the app.',
    ],
  },
  {
    version: '1.1.1',
    title: 'Polish & QoL',
    items: [
      'Wizard Deep Scan toggle (Fast 5-deep / Deep 10-deep) — finds nested games Fast Scan missed.',
      'Selective metadata accept — pick exactly which fields (image, description, genres\u2026) replace existing ones.',
      'Drop a folder onto the window \u2192 Wizard auto-runs the scan, no extra click.',
      'Per-game ambient backdrop toggle (Settings \u2192 Visual effects).',
      'New bright "Mint Garden" theme; themes grouped Dark/Bright in Settings.',
      'Modal backdrop close is now double-click \u2014 no more accidental dismissals.',
      'UI sound effects are volume-normalized via a dynamics compressor.',
    ],
  },
  {
    version: '1.1.0',
    title: 'Major release',
    items: [
      'Accept-before-add metadata preview modal.',
      'Manual Edit Metadata form with local image pickers.',
      'Drag-drop .exe / .lnk / folders onto the app to add games.',
      'GitHub Releases auto-update pill in the title bar.',
      'Affiliate-tagged deals strip (Instant Gaming, Awin Humble/Fanatical/Superbox).',
    ],
  },
];

function getChangesSince(lastSeen) {
  // Return entries strictly newer than lastSeen. If lastSeen is empty/falsy
  // we return only the newest entry so the modal stays bite-sized.
  if (!lastSeen) return CHANGELOG.slice(0, 1);
  const idx = CHANGELOG.findIndex((c) => c.version === String(lastSeen).replace(/^v/i, ''));
  if (idx === -1) return CHANGELOG.slice(0, 1);
  return CHANGELOG.slice(0, idx);
}

export default function ChangelogModal({ open, currentVersion, lastSeenVersion, onClose }) {
  const entries = React.useMemo(
    () => getChangesSince(lastSeenVersion),
    [lastSeenVersion]
  );
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[230] grid place-items-center bg-black/60 backdrop-blur-sm"
          onDoubleClick={onClose}
          data-testid="changelog-overlay"
        >
          <motion.div
            initial={{ y: 16, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 10, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
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
                  <ul className="space-y-1.5">
                    {entry.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-[12.5px] leading-relaxed text-ink/90">
                        <Check size={12} className="mt-1 shrink-0 text-[rgb(var(--accent))]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
              {entries.length === 0 && (
                <div className="py-6 text-center text-sm text-muted">
                  You&apos;re fully caught up.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-[rgb(var(--border))]/60 bg-panel/70 backdrop-blur px-5 py-3">
              <span className="text-[11px] text-muted">
                Shown once per update. You can re-read it any time from the About section.
              </span>
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
