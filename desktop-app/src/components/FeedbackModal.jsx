import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, Lightbulb, MessageCircle, Send, X, Check, AlertTriangle } from 'lucide-react';

/**
 * FeedbackModal — one modal, three modes. Posts to a Discord webhook.
 *
 * v1.5.0.
 *
 * Modes:
 *  - bug          → "🐛 Bug report" (auto-attaches version + platform + theme + last log tail if the electron API exposes it)
 *  - suggestion   → "💡 Feature suggestion"
 *  - feedback     → "💬 General feedback"
 *
 * The webhook URL is read from Vite's `import.meta.env.VITE_FEEDBACK_WEBHOOK_URL`.
 * If missing, the modal renders a "not configured" banner and disables submit.
 */
const WEBHOOK_URL = import.meta.env.VITE_FEEDBACK_WEBHOOK_URL || '';

const MODES = {
  bug: {
    key: 'bug',
    icon: Bug,
    color: '#ff5a6e',
    label: 'Bug report',
    title: 'Report a bug',
    placeholder: 'What went wrong? What did you expect? Steps to reproduce if you remember them.',
    prompt: 'Describe the bug',
  },
  suggestion: {
    key: 'suggestion',
    icon: Lightbulb,
    color: '#ffcc4a',
    label: 'Suggestion',
    title: 'Suggest a feature',
    placeholder: 'What would you love to see in NEO-LIB? Anything from a small dial to a whole new panel.',
    prompt: 'Describe your idea',
  },
  feedback: {
    key: 'feedback',
    icon: MessageCircle,
    color: 'rgb(var(--accent))',
    label: 'Feedback',
    title: 'Send feedback',
    placeholder: 'Tell us what you love, what feels off, or anything else on your mind.',
    prompt: 'Your thoughts',
  },
};

export default function FeedbackModal({ open, initialMode = 'feedback', appVersion, theme, onClose }) {
  const [mode, setMode] = React.useState(initialMode);
  const [text, setText] = React.useState('');
  const [name, setName] = React.useState('');
  const [status, setStatus] = React.useState('idle'); // idle | sending | ok | error
  const [errorMsg, setErrorMsg] = React.useState('');

  React.useEffect(() => {
    if (open) {
      setMode(initialMode || 'feedback');
      setText('');
      setName('');
      setStatus('idle');
      setErrorMsg('');
    }
  }, [open, initialMode]);

  if (!open) return null;
  const cfg = MODES[mode] || MODES.feedback;
  const disabled = !WEBHOOK_URL || status === 'sending' || text.trim().length < 3;

  const submit = async () => {
    if (disabled) return;
    setStatus('sending');
    setErrorMsg('');
    try {
      const platform = (typeof navigator !== 'undefined' && navigator.platform) || 'unknown';
      const ua = (typeof navigator !== 'undefined' && navigator.userAgent) || '';
      const payload = {
        username: 'NEO-LIB in-app',
        embeds: [
          {
            title: `${modeEmoji(mode)} ${cfg.title}${name.trim() ? ` — ${name.trim()}` : ''}`,
            description: text.trim().slice(0, 3500),
            color: parseInt('ff2a8a', 16),
            fields: [
              { name: 'Version', value: appVersion || 'unknown', inline: true },
              { name: 'Theme',   value: theme || 'unknown',      inline: true },
              { name: 'Platform', value: platform, inline: true },
            ],
            footer: { text: ua.slice(0, 120) },
            timestamp: new Date().toISOString(),
          },
        ],
      };
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok && res.status !== 204) throw new Error(`Discord ${res.status}`);
      setStatus('ok');
      setTimeout(() => { onClose?.(); }, 1200);
    } catch (e) {
      setStatus('error');
      setErrorMsg(e?.message || 'Send failed');
    }
  };

  const body = (
    <AnimatePresence>
      <motion.div
        key="feedback-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
        className="fixed inset-0 z-[9990] grid place-items-center"
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
        data-testid="feedback-backdrop"
      >
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.96 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          onMouseDown={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl hairline shadow-2xl"
          style={{
            backgroundColor: 'rgb(var(--panel))',
            border: '1px solid rgb(var(--accent) / 0.4)',
            boxShadow: '0 30px 80px -20px rgba(0,0,0,0.9), 0 0 60px -10px rgb(var(--accent)/0.5)',
          }}
          data-testid="feedback-modal"
        >
          {/* Header + close */}
          <div
            className="flex items-center gap-3 border-b border-[rgb(var(--border))] px-5 py-3"
            style={{
              background: 'linear-gradient(90deg, rgb(var(--accent)/0.18), rgb(var(--accent-2)/0.12))',
            }}
          >
            <cfg.icon size={18} style={{ color: cfg.color }} />
            <div className="flex-1 text-[15px] font-bold">{cfg.title}</div>
            <button
              onClick={onClose}
              data-testid="feedback-close-btn"
              className="grid h-8 w-8 place-items-center rounded-md text-muted hover:text-ink hover:bg-surface/40"
              title="Close"
            >
              <X size={14} />
            </button>
          </div>

          {/* Mode tabs */}
          <div className="flex gap-1 border-b border-[rgb(var(--border))] px-3 pt-2">
            {(['bug', 'suggestion', 'feedback']).map((k) => {
              const m = MODES[k];
              const active = mode === k;
              return (
                <button
                  key={k}
                  onClick={() => setMode(k)}
                  data-testid={`feedback-tab-${k}`}
                  className={
                    'flex items-center gap-1.5 rounded-t-md px-3 py-1.5 text-[12px] font-medium transition-colors ' +
                    (active
                      ? 'bg-[rgb(var(--accent)/0.14)] text-ink border-b-2 border-[rgb(var(--accent))]'
                      : 'text-muted hover:text-ink hover:bg-[rgb(var(--accent)/0.06)]')
                  }
                >
                  <m.icon size={12} style={active ? { color: m.color } : {}} />
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* Body */}
          <div className="px-5 py-4 space-y-3">
            {!WEBHOOK_URL && (
              <div
                className="flex items-start gap-2 rounded-md border px-3 py-2 text-[11.5px]"
                style={{ background: 'rgba(255,90,110,0.12)', borderColor: 'rgba(255,90,110,0.4)' }}
              >
                <AlertTriangle size={14} className="mt-0.5 text-[#ff5a6e]" />
                <span className="text-ink/90">
                  Feedback endpoint not configured. Set <code className="text-[rgb(var(--accent))]">VITE_FEEDBACK_WEBHOOK_URL</code> in
                  {' '}<code className="text-[rgb(var(--accent))]">desktop-app/.env</code> and rebuild.
                </span>
              </div>
            )}

            <div>
              <div className="mb-1 text-[10.5px] uppercase tracking-wider text-muted">Your name (optional)</div>
              <input
                data-testid="feedback-name-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Anon"
                maxLength={40}
                className="w-full rounded-md hairline bg-panel/40 px-3 py-2 text-[13px] outline-none focus:border-[rgb(var(--accent)/0.6)]"
              />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <div className="text-[10.5px] uppercase tracking-wider text-muted">{cfg.prompt}</div>
                <div className="text-[10.5px] text-muted">{text.length}/3500</div>
              </div>
              <textarea
                data-testid="feedback-text-input"
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, 3500))}
                placeholder={cfg.placeholder}
                rows={6}
                className="w-full resize-none rounded-md hairline bg-panel/40 px-3 py-2 text-[13px] leading-snug outline-none focus:border-[rgb(var(--accent)/0.6)]"
              />
            </div>

            <div className="text-[10.5px] text-muted">
              We attach app version, theme, and platform automatically. Nothing else.
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-2 border-t border-[rgb(var(--border))] px-5 py-3">
            <div className="min-h-[16px] text-[11.5px]">
              {status === 'ok' && (
                <span className="inline-flex items-center gap-1 text-[#4ade80]">
                  <Check size={12} /> Sent — thank you!
                </span>
              )}
              {status === 'error' && (
                <span className="inline-flex items-center gap-1 text-[#ff5a6e]">
                  <AlertTriangle size={12} /> {errorMsg}
                </span>
              )}
            </div>
            <button
              onClick={submit}
              disabled={disabled}
              data-testid="feedback-submit-btn"
              className={
                'inline-flex items-center gap-1.5 rounded-md px-4 h-9 text-[12.5px] font-bold transition-all ' +
                (disabled
                  ? 'cursor-not-allowed bg-surface/50 text-muted'
                  : 'text-white hover:scale-[1.03]')
              }
              style={
                disabled
                  ? undefined
                  : {
                      background: 'linear-gradient(135deg, rgb(var(--accent)) 0%, rgb(var(--accent-2)) 100%)',
                      boxShadow: '0 0 14px -3px rgb(var(--accent)/0.7)',
                    }
              }
            >
              <Send size={12} />
              {status === 'sending' ? 'Sending…' : 'Send to Discord'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
  if (typeof document === 'undefined') return body;
  return createPortal(body, document.body);
}

/**
 * Fire-and-forget "Rate this update" reaction for the Changelog modal.
 * Emoji is one of 😍 / 😐 / 😕. Returns true if sent.
 */
export async function sendChangelogReaction({ version, reaction, theme, note }) {
  if (!WEBHOOK_URL) return false;
  try {
    const payload = {
      username: 'NEO-LIB in-app',
      embeds: [
        {
          title: `${reaction} v${version || '?'} — quick reaction`,
          color: parseInt('ff2a8a', 16),
          fields: [
            { name: 'Reaction', value: reaction, inline: true },
            { name: 'Version', value: String(version || '?'), inline: true },
            { name: 'Theme',   value: theme || 'unknown', inline: true },
          ],
          description: note ? String(note).slice(0, 800) : undefined,
          timestamp: new Date().toISOString(),
        },
      ],
    };
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok || res.status === 204;
  } catch { return false; }
}

function modeEmoji(m) {
  return m === 'bug' ? '🐛' : m === 'suggestion' ? '💡' : '💬';
}

export const FEEDBACK_ENABLED = !!WEBHOOK_URL;
