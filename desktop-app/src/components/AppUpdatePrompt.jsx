import React from 'react';
import Modal from './Modal';

const DISMISSED_KEY = 'neolib:app-update-dismissed';
export default function AppUpdatePrompt({ info, paused, onDownload, onReleaseNotes }) {
  const [dismissed, setDismissed] = React.useState(() => { try { return localStorage.getItem(DISMISSED_KEY) || ''; } catch { return ''; } });
  const [requested, setRequested] = React.useState(false);
  const [clearToShow, setClearToShow] = React.useState(false);
  const [error, setError] = React.useState('');
  const [downloading, setDownloading] = React.useState(false);
  const opening = React.useRef(false);
  const body = React.useRef(null);
  const eligible = Boolean(info?.available && !info.error && info.latestVersion && (requested || dismissed !== info.latestVersion));
  React.useEffect(() => {
    const request = () => setRequested(true);
    window.addEventListener('neolib:show-app-update', request);
    return () => window.removeEventListener('neolib:show-app-update', request);
  }, []);
  React.useEffect(() => {
    if (!eligible || paused) { setClearToShow(false); return undefined; }
    const sync = () => {
      const otherDialog = [...document.querySelectorAll('[data-controller-surface="modal"], [data-controller-surface="layout-editor"], [role="dialog"][aria-modal="true"]')]
        .some(element => !element.closest('[data-testid="app-update-popup"]'));
      setClearToShow(!document.hidden && !otherDialog);
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener('visibilitychange', sync);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', sync); };
  }, [eligible, paused, info?.latestVersion]);
  const open = eligible && !paused && clearToShow;
  React.useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    const surface = body.current?.closest('[data-controller-surface]');
    body.current?.querySelector('[data-update-download]')?.focus();
    const trap = event => {
      if (event.key !== 'Tab') return;
      const controls = [...(surface?.querySelectorAll('button:not(:disabled)') || [])];
      const index = controls.indexOf(document.activeElement);
      if (controls.length && (index < 0 || (event.shiftKey ? index === 0 : index === controls.length - 1))) {
        event.preventDefault(); (event.shiftKey ? controls.at(-1) : controls[0]).focus();
      }
    };
    surface?.addEventListener('keydown', trap);
    return () => { surface?.removeEventListener('keydown', trap); if (previous?.isConnected) previous.focus(); };
  }, [open]);
  const dismiss = () => {
    setDismissed(info.latestVersion); setRequested(false); setError('');
    try { localStorage.setItem(DISMISSED_KEY, info.latestVersion); } catch { /* session state still prevents repeats */ }
  };
  const download = async () => {
    if (opening.current) return;
    opening.current = true; setDownloading(true);
    setError('');
    try {
      const result = await onDownload?.(info.downloadUrl || info.releaseUrl);
      if (result?.ok === false) throw new Error();
      dismiss();
    } catch { setError('Could not open the download. Please try again or open release notes.'); }
    finally { opening.current = false; setDownloading(false); }
  };
  return <Modal open={open} onClose={dismiss} title="New update available" testid="app-update-popup">
    <div ref={body} role="dialog" aria-modal="true" aria-label="New NEO-LIB update available" className="space-y-4 p-5">
      <p className="text-lg font-bold">NEO-LIB v{info?.latestVersion} is available</p>
      <p className="text-sm text-muted">You are running v{info?.currentVersion}. Download the new release from our GitHub repository. Nothing installs automatically.</p>
      {error && <p role="alert" className="text-sm text-amber-200">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" data-update-download disabled={downloading} onClick={download} className="rounded-lg bg-[rgb(var(--accent))] px-3 py-2 text-sm font-bold text-[rgb(var(--surface))] disabled:opacity-50">{downloading ? 'Opening download…' : info?.downloadUrl ? 'Download update' : 'View release downloads'}</button>
        <button type="button" onClick={onReleaseNotes} className="rounded-lg border hairline px-3 py-2 text-sm">Release notes</button>
        <button type="button" data-controller-close onClick={dismiss} className="rounded-lg border hairline px-3 py-2 text-sm">Later</button>
      </div>
      <p className="text-xs text-muted">Shown once per release after dismissal. You can check again from Settings → Updates or use the update badge.</p>
    </div>
  </Modal>;
}
