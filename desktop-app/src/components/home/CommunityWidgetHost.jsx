import React from 'react';
import { AlertTriangle, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';

const CHANNEL = 'neo-lib-widget-v1';
const STORAGE_KEY = /^[a-zA-Z0-9._-]{1,80}$/;

function safeLibrary(games) {
  return games.filter((game) => game && !game.homeLocked).slice(0, 2000).map((game) => ({
    id: String(game.id || ''), name: String(game.name || '').slice(0, 300),
    source: String(game.launcher || game.source || 'local').slice(0, 80),
    genres: (Array.isArray(game.genres) ? game.genres : []).map(String).slice(0, 12),
    playtimeMinutes: Math.max(0, Number(game.playtime) || 0),
    lastPlayedAt: Math.max(0, Number(game.lastPlayedAt) || 0),
    rating: Math.max(0, Math.min(5, Number(game.rating) || 0)),
  })).filter((game) => game.id && game.name);
}

function boundedStorage(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const result = {};
  for (const [key, entry] of Object.entries(value).slice(0, 50)) {
    if (!STORAGE_KEY.test(key)) continue;
    try {
      const encoded = JSON.stringify(entry);
      if (encoded.length <= 8192) result[key] = JSON.parse(encoded);
    } catch { /* ignore unsupported values */ }
  }
  return result;
}

function sandboxDocument(source, networkAllowed) {
  const network = networkAllowed ? 'https:' : "'none'";
  const media = networkAllowed ? 'data: blob: https:' : 'data: blob:';
  const csp = `default-src 'none'; script-src 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'unsafe-inline'; img-src ${media}; media-src ${media}; font-src data:; connect-src ${network}; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; navigate-to 'none'`;
  const bootstrap = `<script>(()=>{const c='${CHANNEL}';const send=(type,payload={})=>parent.postMessage({channel:c,type,...payload},'*');addEventListener('error',()=>send('crash'));addEventListener('unhandledrejection',()=>send('crash'));window.neoLibWidget={ready:()=>send('ready'),storage:{get:key=>send('storage:get',{key}),set:(key,value)=>send('storage:set',{key,value})}};addEventListener('DOMContentLoaded',()=>send('ready'));})();<\/script>`;
  const security = `<meta http-equiv="Content-Security-Policy" content="${csp}"><meta name="referrer" content="no-referrer"><style>html,body{margin:0;min-height:100%;background:transparent;color:#eef2ff;font:14px system-ui,sans-serif}*{box-sizing:border-box}</style>`;
  const html = String(source || '');
  if (/<head(?:\s[^>]*)?>/i.test(html)) {
    const secured = html.replace(/<head(?:\s[^>]*)?>/i, match => `${match}${security}`);
    return /<\/body>/i.test(secured) ? secured.replace(/<\/body>/i, `${bootstrap}</body>`) : `${secured}${bootstrap}`;
  }
  return `<!doctype html><html><head>${security}</head><body>${html}${bootstrap}</body></html>`;
}

export default function CommunityWidgetHost({ widget, grants = [], storage = {}, games = [], onStorageChange }) {
  const frameRef = React.useRef(null);
  const [reload, setReload] = React.useState(0);
  const [state, setState] = React.useState({ loading: true, error: '', html: '' });
  const grantsKey = grants.filter((permission) => widget.permissions.includes(permission)).sort().join('|');
  const granted = React.useMemo(() => new Set(grantsKey ? grantsKey.split('|') : []), [grantsKey]);

  React.useEffect(() => {
    let active = true;
    setState({ loading: true, error: '', html: '' });
    window.api?.loadWidgetRuntime?.(widget.id).then((result) => {
      if (!active) return;
      if (!result?.ok) setState({ loading: false, error: result?.error || 'Widget could not be loaded.', html: '' });
      else setState({ loading: true, error: '', html: sandboxDocument(result.html, granted.has('network')) });
    }).catch(() => active && setState({ loading: false, error: 'Widget host failed safely.', html: '' }));
    return () => { active = false; };
  }, [granted, reload, widget.id]);

  React.useEffect(() => {
    if (!state.html) return undefined;
    const timer = window.setTimeout(() => setState((current) => current.loading ? { ...current, loading: false, error: 'Widget did not become ready. Reload it or disable it from Widgets.' } : current), 6000);
    const receive = (event) => {
      if (event.source !== frameRef.current?.contentWindow || event.data?.channel !== CHANNEL) return;
      const message = event.data;
      if (message.type === 'ready') {
        window.clearTimeout(timer);
        setState((current) => ({ ...current, loading: false, error: '' }));
        frameRef.current?.contentWindow?.postMessage({
          channel: CHANNEL, type: 'init', apiVersion: 1, widgetId: widget.id, grants: [...granted],
          library: granted.has('library.read') ? safeLibrary(games) : undefined,
          storage: granted.has('storage') ? boundedStorage(storage) : undefined,
        }, '*');
      } else if (message.type === 'crash') {
        window.clearTimeout(timer);
        setState((current) => ({ ...current, loading: false, error: 'Widget stopped after an internal error. NEO-LIB is still safe.' }));
      } else if (message.type === 'storage:get' && granted.has('storage') && STORAGE_KEY.test(String(message.key || ''))) {
        frameRef.current?.contentWindow?.postMessage({ channel: CHANNEL, type: 'storage:value', key: message.key, value: boundedStorage(storage)[message.key] }, '*');
      } else if (message.type === 'storage:set' && granted.has('storage') && STORAGE_KEY.test(String(message.key || ''))) {
        const next = boundedStorage({ ...boundedStorage(storage), [message.key]: message.value });
        onStorageChange?.(next);
      }
    };
    window.addEventListener('message', receive);
    return () => { window.clearTimeout(timer); window.removeEventListener('message', receive); };
  }, [games, granted, onStorageChange, state.html, storage, widget.id]);

  if (state.error) return <div className="grid h-full min-h-24 place-items-center p-4 text-center"><div><AlertTriangle size={20} className="mx-auto text-amber-300" /><p className="mt-2 text-xs font-bold text-ink">{state.error}</p><button type="button" onClick={() => setReload((value) => value + 1)} className="mt-3 inline-flex items-center gap-1 rounded-md border border-[rgb(var(--border))] px-2.5 py-1.5 text-[10px] font-bold text-muted hover:text-ink"><RefreshCw size={11} />Reload widget</button></div></div>;
  return <div className="relative h-full min-h-24 overflow-hidden rounded-lg bg-[rgb(var(--surface)/0.18)]">
    {state.loading && <div className="absolute inset-0 z-10 grid place-items-center bg-[rgb(var(--surface)/0.88)]"><span className="inline-flex items-center gap-2 text-xs font-bold text-muted"><Loader2 size={14} className="animate-spin" />Starting isolated widget…</span></div>}
    {state.html && <iframe key={reload} ref={frameRef} srcDoc={state.html} title={widget.name} sandbox="allow-scripts" referrerPolicy="no-referrer" allow="camera 'none'; microphone 'none'; geolocation 'none'; payment 'none'; usb 'none'; serial 'none'; bluetooth 'none'; gamepad 'none'; clipboard-read 'none'; clipboard-write 'none'" className="h-full w-full border-0 bg-transparent" onError={() => setState((current) => ({ ...current, loading: false, error: 'Widget frame failed safely.' }))} />}
    <span className="pointer-events-none absolute bottom-1 right-1 inline-flex items-center gap-1 rounded bg-black/55 px-1.5 py-0.5 text-[8px] font-bold text-emerald-200"><ShieldCheck size={9} />Isolated</span>
  </div>;
}
