import React from 'react';
import { USAGE_KEY, USAGE_WITHDRAWAL_KEY } from '../services/usage-reporting.mjs';
import { USAGE_PRIVACY, USAGE_PRIVACY_READY } from '../services/usage-privacy.mjs';

export default function UsagePrivacyNotice() {
  const [expanded, setExpanded] = React.useState(false);
  const [reportingId, setReportingId] = React.useState('');
  const [pendingDeletion, setPendingDeletion] = React.useState(false);
  const regionId = React.useId();
  React.useEffect(() => {
    const refresh = () => { try { setPendingDeletion(Boolean(localStorage.getItem(USAGE_WITHDRAWAL_KEY))); } catch { /* No storage access. */ } };
    refresh();
    window.addEventListener('neolib:usage-privacy-state', refresh);
    window.addEventListener('storage', refresh);
    return () => { window.removeEventListener('neolib:usage-privacy-state', refresh); window.removeEventListener('storage', refresh); };
  }, []);
  const showId = () => {
    try {
      const value = JSON.parse(localStorage.getItem(USAGE_KEY) || 'null')?.id || localStorage.getItem(USAGE_WITHDRAWAL_KEY);
      setReportingId(typeof value === 'string' && /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(value) ? value : 'No local reporting ID. Reporting may be off or not started.');
    } catch { setReportingId('No local reporting ID is available.'); }
  };
  return <div className="text-xs leading-relaxed text-muted" data-testid="usage-privacy">
    <button type="button" aria-expanded={expanded} aria-controls={regionId} onClick={() => { setExpanded(value => !value); setReportingId(''); }} className="rounded px-1 py-2 text-left text-[rgb(var(--accent))] underline underline-offset-4 focus-visible:outline focus-visible:outline-2" data-testid="usage-privacy-open">{expanded ? 'Close' : 'Read'} optional usage reporting privacy notice</button>
    {!USAGE_PRIVACY_READY && <p role="status">Reporting is currently unavailable while the responsible operator’s identity is being confirmed.</p>}
    {pendingDeletion && <p role="status">Reporting stopped. Server deletion is pending and will retry when connected. New reporting waits for confirmation.</p>}
    {pendingDeletion && <button type="button" className="rounded-lg hairline px-3 py-2 text-ink" onClick={() => window.dispatchEvent(new Event('neolib:usage-delete-retry'))}>Retry deletion now</button>}
    {expanded && <section id={regionId} aria-label="Optional usage reporting privacy notice" className="mt-2 max-h-[45vh] space-y-4 overflow-y-auto rounded-xl hairline p-4" tabIndex={0}>
      <h3 className="text-sm font-bold text-ink">Optional usage reporting — privacy and consent</h3>
      <p>Updated {USAGE_PRIVACY.updated} · Notice version {USAGE_PRIVACY.version}</p>
      <p>Responsible operator: {USAGE_PRIVACY.controllerName || 'Not yet confirmed — draft notice; reporting unavailable'}. NEO-LIB is an independent private project. Contact: {USAGE_PRIVACY.contact}.</p>
      {USAGE_PRIVACY.sections.map(([title, body]) => <div key={title}><h4 className="font-bold text-ink">{title}</h4><p className="mt-1">{body}</p></div>)}
      <p>Provider terms: <a href="https://www.cloudflare.com/cloudflare-customer-dpa/" target="_blank" rel="noreferrer" className="underline">Cloudflare Data Processing Addendum</a>. Infrastructure metadata: <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noreferrer" className="underline">Cloudflare Privacy Policy</a>. Complaints: <a href="https://www.datatilsynet.no/en/" target="_blank" rel="noreferrer" className="underline">Datatilsynet</a>.</p>
      <button type="button" onClick={showId} className="rounded-lg hairline px-3 py-2 text-ink">Show my reporting ID for a privacy request</button>
      {reportingId && <p role="status" className="break-all select-text">{reportingId}</p>}
      <p>A document copy is included in the app’s privacy folder. This notice is information about optional consent, not acceptance of unrelated terms.</p>
    </section>}
  </div>;
}
