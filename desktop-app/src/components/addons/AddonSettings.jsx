import React from 'react';

export default function AddonSettings({ settings, onChange, api = window.api, namespace = 'addon' }) {
  const [packages, setPackages] = React.useState([]);
  const [recoverable, setRecoverable] = React.useState([]);
  const [notice, setNotice] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [update, setUpdate] = React.useState(null);
  const config = settings.addonConfig || {};
  const latest = React.useRef({ config, onChange });
  latest.current = { config, onChange };
  const refresh = async () => {
    const result = await api?.listAddons?.();
    setPackages(result?.widgets || []); setRecoverable(result?.recoverable || []);
    window.dispatchEvent(new Event('neolib:addons-changed'));
  };
  React.useEffect(() => { let active = true; api?.listAddons?.().then(result => { if (active) { setPackages(result.widgets || []); setRecoverable(result.recoverable || []); } }).catch(() => active && setNotice('Packages require the desktop app.')); return () => { active = false; }; }, [api]);
  const change = (id, patch) => latest.current.onChange({ addonConfig: { ...latest.current.config, [id]: { ...latest.current.config[id], ...patch } } });
  const act = async task => { setBusy(true); setNotice(''); try { await task(); } catch { setNotice('Operation failed safely.'); } finally { setBusy(false); } };
  const importPackage = async () => {
    const path = await api?.pickAddonManifest?.(); if (!path) return;
    const result = await api.importAddon(path);
    if (result.code === 'UPDATE_REVIEW_REQUIRED') { setUpdate({ path, addon: result.widget, previous: result.currentVersion }); return; }
    setNotice(result.ok ? 'Imported. Review permissions and enable it below.' : result.error);
    if (result.ok) { change(result.widget.id, { enabled: false, grants: [], version: result.widget.version }); await refresh(); }
  };
  return <div className="space-y-3" data-testid="addon-settings">
    <label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={settings.addonsEnabled === true} onChange={event => onChange({ addonsEnabled: event.target.checked })} />{namespace === 'module' ? 'Enable imported custom modules' : 'Enable Addons'}</label>
    <p className="text-xs text-muted">Custom coded pages, separate from Home widgets. Only install code you trust. No imported {namespace === 'module' ? 'module' : 'add-on'} runs until both switches are enabled. Private games, native commands and launcher files are not exposed. Network access can send the library data you grant to external servers.</p>
    {settings.addonsEnabled === true && <>
      <button type="button" disabled={busy || !api?.importAddon} onClick={() => act(importPackage)} className="rounded border border-[rgb(var(--border))] px-3 py-2">Import {namespace}.json</button>
      {notice && <p role="status" className="text-xs text-amber-200">{notice}</p>}
      {update && <div className="rounded border border-amber-300/40 p-3"><p>Review update: {update.addon.name} · {update.previous} → {update.addon.version}</p><p className="text-xs">Requested permissions: {update.addon.permissions.join(', ') || 'none'}. Approval resets activation and grants.</p><button disabled={busy} type="button" onClick={() => act(async () => { const result = await api.updateAddon(update.path); if (result.ok) { change(update.addon.id, { enabled: false, grants: [], version: update.addon.version }); setUpdate(null); await refresh(); } setNotice(result.ok ? 'Updated. Review and enable again.' : result.error); })}>Approve update</button><button type="button" onClick={() => setUpdate(null)} className="ml-3">Cancel</button></div>}
      {packages.length === 0 && <p className="text-xs text-muted">No {namespace === 'module' ? 'custom modules' : 'add-ons'} installed. Authors create a page package; importing a script alone is not supported.</p>}
      {packages.map(addon => {
        const current = config[addon.id]?.version === addon.version ? config[addon.id] : {};
        return <article key={addon.id} className="space-y-2 rounded border border-[rgb(var(--border))] p-3"><div className="flex flex-wrap items-center gap-3"><strong>{addon.name}</strong><span className="text-xs text-muted">{addon.author.name} · v{addon.version}</span><label className="ml-auto text-xs"><input type="checkbox" disabled={!addon.compatible || busy} checked={current.enabled === true} onChange={event => change(addon.id, { enabled: event.target.checked, version: addon.version, grants: current.grants || [] })} /> Enabled</label></div><p className="text-xs text-muted">{addon.description}</p>
          <div className="flex flex-wrap gap-3">{addon.permissions.map(permission => <label key={permission} className="text-xs"><input type="checkbox" disabled={busy} checked={(current.grants || []).includes(permission)} onChange={event => change(addon.id, { enabled: false, version: addon.version, grants: event.target.checked ? [...(current.grants || []), permission] : (current.grants || []).filter(value => value !== permission) })} /> {permission}</label>)}</div>
          {namespace === 'module' && <><span className="text-xs text-muted">Imported community module · not official</span><button type="button" disabled={busy || !current.enabled} className="ml-3 rounded border px-2 py-1 text-xs" onClick={() => act(async () => { const result = await api.openPackage(addon.id); setNotice(result.ok ? 'Opened in its own module window.' : result.error); })}>Open module window</button></>}
          <button type="button" disabled={busy} className="ml-3 text-xs text-red-200" onClick={() => act(async () => { const result = await api.removeAddon(addon.id); if (result.ok) { change(addon.id, { enabled: false }); await refresh(); } setNotice(result.ok ? 'Removed. A recoverable copy remains.' : result.error); })}>Uninstall safely</button>
        </article>;
      })}
      {recoverable.map(addon => <button type="button" key={`${addon.id}-${addon.installedAt}`} disabled={busy} className="mr-3 text-xs" onClick={() => act(async () => { const result = await api.restoreAddon(addon.id); if (result.ok) { change(addon.id, { enabled: false, grants: [] }); await refresh(); } setNotice(result.ok ? 'Restored, disabled.' : result.error); })}>Restore {addon.name}</button>)}
    </>}
  </div>;
}
