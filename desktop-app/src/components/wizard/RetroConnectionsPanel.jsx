import React from 'react';
const control = 'mt-1 w-full rounded-md hairline bg-panel/60 px-3 py-2 text-xs text-ink';
const button = 'rounded-md hairline px-3 py-2 text-xs text-ink disabled:opacity-40';
export default function RetroConnectionsPanel() {
  const [status, setStatus] = React.useState(null);
  const [source, setSource] = React.useState('romm');
  const [form, setForm] = React.useState({ url: '', token: '', allowInsecure: false, developerId: '', developerPassword: '', username: '', password: '', region: 'us', language: 'en' });
  const [message, setMessage] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const mounted = React.useRef(true);
  React.useEffect(() => {
    mounted.current = true;
    window.api?.retroSourceStatus?.().then(result => {
      if (!mounted.current) return;
      setStatus(result);
      setForm(old => ({ ...old, url: result.romm?.url || '', allowInsecure: result.romm?.allowInsecure === true, username: result.screenscraper?.username || '', region: result.screenscraper?.region || 'us', language: result.screenscraper?.language || 'en' }));
    }).catch(() => { if (mounted.current) setMessage('Connection storage could not be read.'); });
    return () => { mounted.current = false; };
  }, []);
  const set = (key, value) => setForm(old => ({ ...old, [key]: value }));
  const run = async action => {
    setBusy(true); setMessage('');
    try {
      const values = source === 'romm' ? { url: form.url, token: form.token, allowInsecure: form.allowInsecure } : Object.fromEntries(['developerId','developerPassword','username','password','region','language'].map(key => [key, form[key]]));
      const result = action === 'test' ? await window.api.retroSourcePlatforms({ source }) : await window.api.configureRetroSource({ source, values, forget: action === 'forget' });
      if (!mounted.current) return;
      if (!result?.ok) throw Error(result?.error || 'Connection request failed.');
      if (action !== 'test') { setStatus(result); setForm(old => ({ ...old, token: '', developerId: '', developerPassword: '', password: '' })); }
      setMessage(action === 'test' ? `Connected: ${result.platforms.length} platforms available.` : action === 'forget' ? 'Disconnected. Saved credentials were removed; your games and artwork remain.' : 'Connection saved securely. Test it when you are ready.');
    } catch (error) { if (mounted.current) setMessage(error.message); }
    finally { if (mounted.current) setBusy(false); }
  };
  if (!window.api?.retroSourceStatus) return <p className="text-xs text-muted">Retro source connections are available in the installed desktop app.</p>;
  return <div className="space-y-3" aria-label="Retro source connections">
    <p className="text-xs text-muted">Optional sources. Credentials stay in encrypted native storage, outside library backups and module snapshots. Blank secret fields keep a saved secret.</p>
    <div className="flex gap-2">{[['romm','Your RomM server'],['screenscraper','ScreenScraper']].map(([id, name]) => <button type="button" key={id} disabled={busy} aria-pressed={source === id} onClick={() => { setSource(id); setMessage(''); }} className={button}>{name}{status?.[id]?.configured ? ' · saved' : ''}</button>)}</div>
    {source === 'romm' ? <>
      <label className="block text-xs text-muted">Server URL<input className={control} value={form.url} onChange={e => set('url', e.target.value)} placeholder="https://romm.your-server.example" autoComplete="off" /></label>
      <label className="block text-xs text-muted">Client API token<input type="password" className={control} value={form.token} onChange={e => set('token', e.target.value)} autoComplete="new-password" /></label>
      <label className="flex gap-2 text-xs text-muted"><input type="checkbox" checked={form.allowInsecure} onChange={e => set('allowInsecure', e.target.checked)} />Allow insecure HTTP on my trusted local network (token is not encrypted in transit)</label>
      <p className="text-xs text-muted">Use a read-only client token with platform, ROM and resource access. NEO-LIB does not change your server library.</p>
    </> : <>
      <p className="text-xs text-muted">ScreenScraper requires developer access for this client. Your account login alone is not sufficient. No credentials are bundled or borrowed from Skraper.</p>
      <div className="grid gap-2 sm:grid-cols-2">{[['developerId','Developer ID'],['developerPassword','Developer password'],['username','Account name (optional)'],['password','Account password (optional)'],['region','Artwork region, e.g. us'],['language','Description language, e.g. en']].map(([key, label]) => <label key={key} className="text-xs text-muted">{label}<input className={control} type={key.toLowerCase().includes('password') ? 'password' : 'text'} value={form[key]} onChange={e => set(key, e.target.value)} autoComplete="new-password" /></label>)}</div>
    </>}
    <div className="flex flex-wrap gap-2"><button type="button" className={button} disabled={busy || !status?.encryptedStorageAvailable} onClick={() => run('save')}>Save connection</button><button type="button" className={button} disabled={busy || !status?.[source]?.configured} onClick={() => run('test')}>Test saved connection</button><button type="button" className={button} disabled={busy || !status?.[source]?.configured} onClick={() => run('forget')}>Disconnect and forget credentials</button></div>
    {status && !status.encryptedStorageAvailable && <p role="alert" className="text-xs text-amber-200">Windows secure storage is unavailable. Credentials will not be saved as plain text.</p>}
    <p role="status" className="text-xs text-muted">{busy ? 'Working…' : message}</p>
  </div>;
}
