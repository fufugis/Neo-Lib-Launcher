import React from 'react';

export default function StorageSafetyNotice({ status, library, settings, onRetry, onExport }) {
  const [recoveryDismissed, setRecoveryDismissed] = React.useState(false);
  const failures = Object.entries(status).filter(([, value]) => value.error);
  const repaired = (library.libraryRecovery?.length || 0) + ['games','tools','categories','toolCategories'].reduce((count, key) => count + (library[key] || []).filter(item => item.recordRecovery).length, 0);
  const blockedRead = library._neoLibReadIssue || settings?._neoLibReadIssue;
  if (!blockedRead && !failures.length && (!repaired || recoveryDismissed)) return null;
  const pending = Object.values(status).some(value => value.pending);
  if (blockedRead) return <aside role="alert" data-testid="storage-read-warning" className="fixed right-4 top-14 z-[110] max-w-[440px] rounded-xl border border-amber-300 bg-[rgb(var(--surface))] p-4 text-ink"><h2 className="font-bold">Saved data needs recovery</h2><p className="mt-2 text-sm">Neo-Lib could not safely load or migrate a saved file. Original files have been left untouched and saving is protected. Do not reset the library. Correct the storage problem or restore a trusted backup, then restart Neo-Lib.</p></aside>;
  return <aside role="alert" data-testid="storage-safety-notice" className="fixed right-4 top-14 z-[110] max-h-[65vh] w-[min(440px,calc(100vw-32px))] overflow-auto rounded-xl border border-amber-300/70 bg-[rgb(var(--surface))] p-4 text-sm text-ink shadow-xl">
    {failures.length ? <><h2 className="font-bold">Changes have not been saved</h2><p className="mt-2">Your {failures.map(([key]) => key === 'library' ? 'Library' : 'settings').join(' and ')} changes are still in memory. Keep Neo-Lib open. Check free disk space and folder permissions, then retry.</p><button type="button" className="mt-3 rounded-lg border px-3 py-2 font-bold disabled:opacity-50" disabled={pending} onClick={onRetry}>{pending ? 'Retrying…' : 'Retry saving'}</button></>
      : <><h2 className="font-bold">Some saved entries needed repair</h2><p className="mt-2">Healthy entries remain available. Original problem entries and fields were retained locally in your library data, not discarded. Export a backup before making major changes.</p><button type="button" className="mt-3 rounded-lg border px-3 py-2" onClick={() => setRecoveryDismissed(true)}>Understood</button></>}
    {onExport && <button type="button" className="ml-2 mt-3 rounded-lg border px-3 py-2" onClick={onExport}>Export Library backup</button>}
  </aside>;
}
