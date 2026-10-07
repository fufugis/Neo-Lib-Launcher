import React from 'react';
import { ADDON_CHANNEL, addonDocument, addonLibrary, addonStorage } from './addon-model.mjs';

export default function AddonPage({ addon, config, games, theme, onStorageChange, onClose, namespace = 'addon' }) {
  const frame = React.useRef(null);
  const [html, setHtml] = React.useState('');
  const [error, setError] = React.useState('');
  const [ready, setReady] = React.useState(false);
  const [reload, setReload] = React.useState(0);
  const grantsKey = (config.grants || []).filter(value => addon.permissions.includes(value)).sort().join('|');
  const grants = React.useMemo(() => grantsKey ? grantsKey.split('|') : [], [grantsKey]);
  const payload = React.useRef(null);
  const saveStorage = React.useRef(onStorageChange);
  saveStorage.current = onStorageChange;
  payload.current = { channel: ADDON_CHANNEL, type: 'init', apiVersion: 1, addonId: addon.id, theme: String(theme || ''), grants,
    library: grants.includes('library.read') ? addonLibrary(games) : [],
    storage: grants.includes('storage') ? addonStorage(config.storage) : {} };
  React.useEffect(() => {
    let active = true; setHtml(''); setError(''); setReady(false);
    Promise.resolve(window.api?.loadAddonRuntime?.(addon.id)).then(result => {
      if (!active) return;
      if (!result?.ok || result.widget?.version !== addon.version) setError('Add-on is missing or changed. Review it in Settings.');
      else setHtml(addonDocument(result.html, grants.includes('network'), namespace));
    }).catch(() => active && setError('Could not load this add-on.'));
    return () => { active = false; };
  }, [addon.id, addon.version, grants, reload, namespace]);
  React.useEffect(() => {
    if (!html) return undefined;
    let requests = 0; let second = Date.now();
    const timer = setTimeout(() => setError('Add-on did not start. Close it or try Reload.'), 10000);
    const receive = event => {
      if (event.source !== frame.current?.contentWindow || event.data?.channel !== ADDON_CHANNEL) return;
      if (Date.now() - second > 1000) { requests = 0; second = Date.now(); }
      if (++requests > 30) return;
      if (event.data.type === 'ready') { clearTimeout(timer); setReady(true); frame.current.contentWindow.postMessage(payload.current, '*'); }
      else if (event.data.type === 'crash') { clearTimeout(timer); setError('Add-on encountered an error. Close it or reload.'); }
      else if (event.data.type === 'storage:set' && grants.includes('storage')) {
        const { key, value } = event.data;
        if (typeof key !== 'string') return;
        const validated = addonStorage({ [key]: value });
        if (Object.hasOwn(validated, key)) {
          const storage = addonStorage({ ...payload.current.storage, [key]: validated[key] });
          payload.current.storage = storage;
          saveStorage.current(storage);
        }
      }
    };
    window.addEventListener('message', receive);
    return () => { clearTimeout(timer); window.removeEventListener('message', receive); };
  }, [html, grants]);
  React.useEffect(() => { if (ready) frame.current?.contentWindow?.postMessage(payload.current, '*'); }, [games, theme, config.storage, ready]);
  return <section className="flex h-full min-h-0 flex-col" data-testid="addon-page">
    <header className="flex shrink-0 items-center gap-3 border-b border-[rgb(var(--border))] p-3"><h1 className="min-w-0 flex-1 truncate font-bold">{addon.name}</h1><span className="text-xs text-muted">{namespace === 'module' ? 'Imported community module' : 'Isolated add-on'} · v{addon.version}</span><button type="button" onClick={() => setReload(value => value + 1)}>Reload</button><button type="button" onClick={onClose}>Back to Library</button></header>
    {error ? <p role="alert" className="p-6 text-amber-200">{error}</p> : html ? <iframe ref={frame} name={`neo-lib-addon:${addon.id}`} title={addon.name} srcDoc={html} sandbox="allow-scripts" referrerPolicy="no-referrer" allow="camera 'none'; microphone 'none'; geolocation 'none'; clipboard-read 'none'; clipboard-write 'none'; fullscreen 'none'" className="min-h-0 w-full flex-1 border-0" /> : <p className="p-6">Starting add-on…</p>}
  </section>;
}
