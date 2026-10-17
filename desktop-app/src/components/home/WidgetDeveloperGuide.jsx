import React from 'react';

export const WIDGET_STARTER_MANIFEST = {
  formatVersion: 1, apiVersion: 1, id: 'example.library-snapshot', name: 'My Library Snapshot',
  description: 'A small read-only view of my visible library.', author: { name: 'Your name' },
  version: '1.0.0', entry: 'index.html',
  layout: { minCols: 2, minRows: 2, defaultCols: 6, defaultRows: 3 }, permissions: ['library.read'],
};
export const WIDGET_STARTER_HTML = `<!doctype html>
<html><head><meta charset="utf-8"><style>
body { margin: 0; padding: 12px; font: 14px system-ui; color: #eef2ff; background: #172033; }
h2 { font-size: 1.1em; } li { padding: 6px 0; overflow-wrap: anywhere; }
</style></head><body><h2>My library</h2><p id="summary">Enable Library permission to begin.</p><ul id="games"></ul>
<script>
addEventListener('message', event => {
  if (event.source !== parent || event.data?.channel !== 'neo-lib-widget-v1' || event.data.type !== 'init') return;
  const games = event.data.library || [];
  document.getElementById('summary').textContent = games.length + ' visible games';
  const list = document.getElementById('games'); list.replaceChildren();
  games.slice(0, 5).forEach(game => {
    const item = document.createElement('li');
    item.textContent = game.name + ' — ' + Math.round(game.playtimeMinutes / 60) + 'h recorded';
    list.append(item);
  });
});
</script></body></html>`;

export default function WidgetDeveloperGuide({ onChoose, busy }) {
  return <section className="space-y-3 rounded-xl border border-[rgb(var(--accent)/0.4)] bg-[rgb(var(--surface)/0.3)] p-4" data-testid="widget-developer-guide">
    <h3 className="text-sm font-bold">Build your first NEO-LIB widget</h3>
    <p className="text-xs leading-relaxed text-muted">Use HTML, CSS and JavaScript. Create a folder containing <b>widget.json</b> and <b>index.html</b>. Save the examples below as those two files, change the author and unique ID, then choose widget.json. Extract ZIPs first—direct archive import is not supported.</p>
    <p className="text-xs text-muted">Imported widgets run on <b>Home</b> today. Lounge's widget picker currently accepts built-in widgets only. Modules/addons are separate extension systems; this format does not add pages or sidebar buttons.</p>
    <details><summary className="cursor-pointer text-xs font-bold">Starter files — copy and save</summary>
      <p className="my-2 text-xs font-bold">widget.json</p><pre className="max-h-64 overflow-auto rounded-lg bg-black/25 p-3 text-[11px] select-text"><code>{JSON.stringify(WIDGET_STARTER_MANIFEST, null, 2)}</code></pre>
      <p className="my-2 text-xs font-bold">index.html</p><pre className="max-h-80 overflow-auto rounded-lg bg-black/25 p-3 text-[11px] select-text"><code>{WIDGET_STARTER_HTML}</code></pre>
    </details>
    <details><summary className="cursor-pointer text-xs font-bold">Format and size limits</summary><p className="mt-2 text-xs leading-relaxed text-muted">API/format version 1. Lowercase unique ID with letters, numbers, dots or hyphens; version major.minor.patch. All four layout values are integers 1–12; defaults cannot be smaller than minimums. HTML entry and each referenced file: 2 MB maximum; assembled runtime: 5 MB; folder: 500 files / 64 MB. No symlinks, native executables or path traversal. Local script src, stylesheet link and img src references are bundled. Dynamic imports, local fetch(), CSS asset URLs and arbitrary file reads are not bundled APIs.</p></details>
    <details><summary className="cursor-pointer text-xs font-bold">Permissions and message API</summary><div className="mt-2 space-y-2 text-xs leading-relaxed text-muted">
      <p><b>library.read</b>: up to 2,000 visible, unlocked game summaries: id, name, source, genres, playtimeMinutes, lastPlayedAt and rating. Deliberately unlocked private games may be included; trust the author before granting. No executable paths, accounts, secrets or dated session logs.</p>
      <p><b>storage</b>: your widget's own state through window.neoLibWidget.storage.get(key) / set(key, value). Keys: 1–80 letters/numbers/dot/underscore/hyphen; up to 50 keys, 8,192 JSON characters per value. Reads reply with channel neo-lib-widget-v1, type storage:value, key and value.</p>
      <p><b>network</b>: HTTPS fetch/images/media, subject to browser CORS. Not remote script/CDN loading. Do not embed private API keys or bypass permissions. No permissions are granted automatically.</p>
      <p>Listen for parent messages on channel <b>neo-lib-widget-v1</b>, type <b>init</b>: apiVersion, widgetId, grants, library and storage. Render with textContent for external data. Ready is sent automatically; window.neoLibWidget.ready() can request a fresh init snapshot.</p>
    </div></details>
    <p className="text-xs leading-relaxed text-muted"><b>Not available:</b> Node/Electron/window.api, app settings, locked games, other widgets' data, file dialogs, game launch, device/controller access or native commands. A widget is a sandboxed display, not a trusted app plugin.</p>
    <p className="text-xs leading-relaxed text-muted">Keep layouts fluid and keyboard-friendly, support small boxes/content zoom, avoid constant animation or polling, and respect prefers-reduced-motion. Import disabled → review capabilities → grant Library for this example → enable. Raise the version to update; updates require fresh grants/enabling. Uninstall keeps a recoverable local copy.</p>
    <button type="button" disabled={busy} onClick={onChoose} className="rounded-lg bg-[rgb(var(--accent))] px-3 py-2 text-xs font-bold text-[rgb(var(--surface))] disabled:opacity-50">Choose widget.json to import</button>
  </section>;
}
