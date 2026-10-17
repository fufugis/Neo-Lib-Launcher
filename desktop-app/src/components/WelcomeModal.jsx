import React from 'react';
import { Gamepad2, LayoutDashboard, Tv2, Palette, MessageCircle, ShieldCheck, Wand2, Compass, GraduationCap } from 'lucide-react';
import Modal from './Modal';
import UsagePrivacyNotice from './UsagePrivacyNotice';
import { USAGE_PRIVACY_READY } from '../services/usage-privacy.mjs';

const FEATURES = [
  [Gamepad2, 'Your games, together', 'Add installed launchers, local games and your own retro library. Your library stays on this PC.'],
  [LayoutDashboard, 'Home, your way', 'Choose widgets, rearrange them, see game news and explore recorded playtime.'],
  [Tv2, 'Lounge for the big screen', 'Full-screen browsing with controller navigation, scenery and customizable layouts.'],
  [Palette, 'Make the launcher yours', 'Themes, Visuals, artwork, categories and isolated modules/addons you choose to enable.'],
];

export default function WelcomeModal({ open, improve, onImprove, onChoose, onTutorial, busy = false, error = '' }) {
  React.useEffect(() => {
    if (!open) return undefined;
    const root = document.querySelector('[data-testid="first-run-welcome"]');
    root?.querySelector('[data-testid="welcome-wizard"]')?.focus();
    const trap = event => {
      if (event.key !== 'Tab') return;
      const controls = [...(root?.querySelectorAll('button:not(:disabled), input:not(:disabled), a[href], [tabindex="0"]') || [])];
      if (!controls.length) return;
      const index = controls.indexOf(document.activeElement);
      if (event.shiftKey && index <= 0) { event.preventDefault(); controls.at(-1).focus(); }
      else if (!event.shiftKey && (index < 0 || index === controls.length - 1)) { event.preventDefault(); controls[0].focus(); }
    };
    document.addEventListener('keydown', trap);
    return () => document.removeEventListener('keydown', trap);
  }, [open]);
  return <Modal open={open} onClose={() => { if (!busy) onChoose('explore'); }} title="Welcome to NEO-LIB" wide testid="first-run-welcome">
    <div role="dialog" aria-modal="true" aria-label="Welcome to NEO-LIB" className="space-y-5 p-6 text-ink">
      <div><p className="text-xs font-bold uppercase tracking-[.22em] text-[rgb(var(--accent))]">Your all-in-one game library</p><h2 className="mt-2 text-2xl font-bold">A home for your games. A launcher that feels like you.</h2><p className="mt-2 text-sm text-muted">Start with the Wizard, take a tour, or explore at your own pace. No account is required to organize and launch your games.</p></div>
      <div className="grid gap-3 sm:grid-cols-2">{FEATURES.map(([Icon, title, body]) => <div key={title} className="rounded-xl hairline bg-[rgb(var(--surface)/.35)] p-4"><Icon size={21} className="text-[rgb(var(--accent))]" /><h3 className="mt-2 text-sm font-bold">{title}</h3><p className="mt-1 text-xs leading-relaxed text-muted">{body}</p></div>)}</div>
      <div className="rounded-xl hairline p-4"><label className="flex items-center gap-3 font-bold"><input type="checkbox" checked={USAGE_PRIVACY_READY && improve} disabled={busy || !USAGE_PRIVACY_READY} onChange={event => onImprove(event.target.checked)} data-testid="welcome-improve" className="accent-[rgb(var(--accent))]" /><ShieldCheck size={18} />Help improve NEO-LIB — I am 16 or older</label><p className="mt-2 text-xs leading-relaxed text-muted">Optional usage reporting: a random installation ID, app version, first-open/setup milestones and meaningful active days. No game names, files, hardware IDs, username or input history. The service receives your IP to handle the connection and limit abuse; IPs are not included in your usage report. Only opt in if you are 16 or older. You can turn this off in Settings to stop reporting and request deletion. Declining changes no features.</p><UsagePrivacyNotice /></div>
      <div className="flex gap-3 rounded-xl border border-[rgb(var(--accent)/.3)] bg-[rgb(var(--accent)/.06)] p-4"><MessageCircle size={19} className="shrink-0 text-[rgb(var(--accent))]" /><p className="text-xs leading-relaxed"><b>Help shape NEO-LIB.</b> Use the Feedback button in the top bar to report bugs, share ideas or tell us what feels clunky. Configure emulators and optional online sources only when you need them; private categories can protect sensitive games.</p></div>
      {error && <p role="alert" className="text-sm text-amber-200">{error}</p>}
      <div className="flex flex-wrap gap-2"><button type="button" disabled={busy} data-testid="welcome-wizard" className="inline-flex items-center gap-2 rounded-lg bg-[rgb(var(--accent))] px-4 py-3 text-sm font-bold text-[rgb(var(--surface))]" onClick={() => onChoose('wizard')}><Wand2 size={17} />Add your games now — take me to the Wizard</button><button type="button" disabled={busy} data-testid="welcome-explore" className="inline-flex items-center gap-2 rounded-lg hairline px-4 py-3 text-sm" onClick={() => onChoose('explore')}><Compass size={17} />I’ll explore NEO-LIB on my own</button><button type="button" disabled={busy} data-testid="welcome-tutorial" className="inline-flex items-center gap-2 rounded-lg hairline px-4 py-3 text-sm" onClick={onTutorial}><GraduationCap size={17} />Start tutorial</button></div>
      <p className="text-[11px] text-muted">Tutorial returns here. After choosing Wizard or Explore, patch notes come next. The Wizard opens only after you close those notes.</p>
    </div>
  </Modal>;
}
