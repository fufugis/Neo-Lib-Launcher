export const ADDON_CHANNEL = 'neo-lib-addon-v1';
const KEY = /^[a-zA-Z0-9._-]{1,80}$/;
const FORBIDDEN = new Set(['__proto__', 'prototype', 'constructor']);
export function addonStorage(raw) {
  const next = Object.create(null);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return next;
  let size = 0;
  for (const [key, value] of Object.entries(raw).slice(0, 50)) {
    if (!KEY.test(key) || FORBIDDEN.has(key)) continue;
    try { const encoded = JSON.stringify(value); if (encoded && encoded.length <= 8192 && size + encoded.length <= 65536) { next[key] = JSON.parse(encoded); size += encoded.length; } } catch { /* unsupported value */ }
  }
  return next;
}
export function addonLibrary(games) {
  const image = value => typeof value === 'string' && /^https:\/\//i.test(value) ? value.slice(0, 2048) : '';
  return (games || []).filter(game => game && !game.homeLocked).slice(0, 2000).map(game => ({
    id: String(game.id || '').slice(0, 200), name: String(game.name || '').slice(0, 300),
    cover: image(game.portraitImage || game.coverUrl || game.coverImage || game.cover),
    source: String(game.launcher || game.source || 'local').slice(0, 80),
    genres: (Array.isArray(game.genres) ? game.genres : []).slice(0, 12).map(value => String(value).slice(0, 80)),
    playtimeMinutes: Math.max(0, Number(game.playtime) || 0), rating: Math.max(0, Math.min(5, Number(game.rating) || 0)),
  })).filter(game => game.id && game.name);
}
export function enabledAddons(packages, settings) {
  if (settings?.addonsEnabled !== true) return [];
  return packages.filter(addon => addon.compatible && settings.addonConfig?.[addon.id]?.enabled === true && settings.addonConfig[addon.id].version === addon.version);
}
export function addonDocument(source, networkAllowed, namespace = 'addon') {
  const media = networkAllowed ? 'data: blob: https:' : 'data: blob:';
  const csp = `default-src 'none'; script-src 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'unsafe-inline'; img-src ${media}; media-src ${media}; font-src data:; connect-src ${networkAllowed ? 'https:' : "'none'"}; frame-src 'none'; worker-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'`;
  // Security and SDK precede ALL author markup, even malformed HTML.
  const sdk = `<script>(()=>{const channel='${ADDON_CHANNEL}';let init;let resolve;const ready=new Promise(r=>resolve=r);window.neoLibAddon={ready,storage:{set:(key,value)=>parent.postMessage({channel,type:'storage:set',key,value},'*')}};addEventListener('message',e=>{if(e.source!==parent||e.data?.channel!==channel||e.data.type!=='init')return;init=e.data;resolve(init);dispatchEvent(new CustomEvent('neolib:change',{detail:init}));});addEventListener('DOMContentLoaded',()=>parent.postMessage({channel,type:'ready'},'*'));addEventListener('error',()=>parent.postMessage({channel,type:'crash'},'*'));})();<\/script>`;
  const alias = namespace === 'module' ? '<script>window.neoLibModule=window.neoLibAddon;<\/script>' : '';
  return `<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="${csp}"><meta name="referrer" content="no-referrer"><style>html,body{margin:0;min-height:100%;background:transparent;color:#eef2ff;font:16px system-ui}*{box-sizing:border-box}</style>${sdk}${alias}</head><body>${source}</body></html>`;
}
