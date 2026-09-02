import React from 'react';
import { AlertTriangle, Bug, X } from 'lucide-react';

/**
 * A Settings-only render guard. Settings is optional UI and must never be
 * allowed to blank the Launcher if a newly added preference control fails.
 */
export default class SettingsRecoveryBoundary extends React.Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    // Keep diagnostic detail available in development without presenting a
    // technical stack trace to the player.
    console.error('NEO-LIB Settings failed to render', error);
  }

  componentDidUpdate(previousProps) {
    if (!this.props.open && previousProps.open && this.state.failed) {
      this.setState({ failed: false });
    }
  }

  render() {
    const { open, onClose, onReportBug, children } = this.props;
    if (!open || !this.state.failed) return children;
    return (
      <div className="fixed inset-0 z-[150] grid place-items-center bg-black/65 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Settings recovery">
        <section className="w-full max-w-md rounded-2xl border border-[rgb(var(--border)/0.9)] bg-[rgb(var(--panel)/0.98)] p-5 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-300/10 text-amber-300"><AlertTriangle size={20} /></span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-300">Settings recovery</p>
                <h2 className="mt-1 text-base font-black text-ink">Settings needs a small repair</h2>
                <p className="mt-2 text-[11px] leading-relaxed text-muted">NEO-LIB is still safe to use. Close this panel to return to your library, then send a bug report so we can repair the exact Settings control.</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted hover:bg-white/10 hover:text-ink" aria-label="Close Settings recovery"><X size={16} /></button>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-[rgb(var(--border)/0.85)] px-3 py-2 text-[11px] font-bold text-muted hover:bg-white/5 hover:text-ink">Back to library</button>
            <button type="button" onClick={() => { onClose?.(); onReportBug?.(); }} className="inline-flex items-center gap-1.5 rounded-lg bg-[rgb(var(--accent))] px-3 py-2 text-[11px] font-black text-[rgb(var(--surface))] shadow-lg"><Bug size={13} />Report a bug</button>
          </div>
        </section>
      </div>
    );
  }
}
