# NEO-LIB page add-ons · API v1

Addons are embedded custom pages. **Modules** are separate-window experiences documented in MODULES.md. Lounge is an official NEO-LIB module, stays in its top navigation position and is not installed under Addons. Custom modules use `module.json`, a separate private root and `neoLibModule`; Addons continue using `addon.json` and `neoLibAddon`.

Add-ons are independent coded pages, not patches to the launcher. Enable **Settings → Addons**, import a folder's `addon.json`, review requested permissions, then enable that package. Entries appear under **Addons** in the side rail or in the **Addons** dropdown beside Tools in top navigation. In sidebar mode, **Settings → Manage Addons** opens management; the Addons rail heading appears only when enabled pages exist. Back to Library and normal navigation remain host-owned. Disabling the global switch or package closes its runtime.

## Package

See `examples/addons/library-shelf`: copy the folder, change its identity and code, then import its manifest. Nothing is installed automatically. Manifest fields: `formatVersion:1`, `kind:"page"`, `apiVersion:1`, unique lowercase `id`, `name`, `description`, `author:{name,url?}`, semantic `version`, relative HTML `entry`, optional `permissions`. API versions other than 1 cannot run.

Write any HTML/CSS/JavaScript layout inside the page; Canvas and WebGL are available subject to the browser. Frameworks must be built into a **self-contained classic browser bundle**. Local `<script src="…js"></script>`, stylesheet links (rel before href) and image tags are inlined. CSS assets, dynamic imports, local fetches, workers, Node packages at runtime and remote script/CDN imports are not supported; bundle or embed these assets before importing. There is no host DOM access. Do not expect an Electron preload or filesystem API.

## Page SDK

`await window.neoLibAddon.ready` returns `{apiVersion,addonId,theme,grants,library,storage}`. Subscribe to `window.addEventListener('neolib:change',event => …event.detail…)` for refreshed snapshots; do not save the library in storage. Listen after the initial promise or tolerate duplicate initial snapshots.

- `library.read`: up to 2,000 **public** game records, with `id,name,cover,source,genres,playtimeMinutes,rating`. All private-category games are excluded even when unlocked. No paths, credentials, save files or category/PIN data. Cover URLs are HTTPS only; local artwork is not exposed.
- `storage`: your own JSON settings via `neoLibAddon.storage.set(key,value)`. Keys are 1–80 letters/digits/dot/dash/underscore; prototype names rejected. Max 50 keys, 8 KiB/value, 64 KiB total. Updated storage arrives in the change snapshot. Storage persists through disable/uninstall and is private to that ID. IDs are an ownership convention, not publisher authentication.
- `network`: optional HTTPS fetch/media/images. Without it, use embedded data/blob artwork. Network can transmit granted data externally: only approve authors you trust. The example uses this permission for remote covers, but runs with placeholders if denied.

No capabilities are required to render a page. No launch, filesystem, native command, core setting, arbitrary window creation or mutation API is provided. A separate native window is intentionally not part of API v1. Host messages are checked against the actual frame window and rate limited; authors should throttle writes. Package updates need explicit review, a newer version, and fresh activation/permission approval. Uninstall keeps a recoverable local package; Restore does not enable it.

## Boundaries and limits

Package code executes in an opaque-origin `sandbox="allow-scripts"` frame under a host-injected CSP. Packages are privately copied to the dedicated Addons root, never installed over application files. Symlinks/native executable files are rejected; limits: 500 files, 64 MiB package, 2 MiB per runtime asset, 5 MiB assembled page, 32 folder depth. Bundle smaller assets rather than raising limits. An add-on cannot access other add-ons through the bridge.

Isolation is not a promise against CPU/GPU abuse or browser vulnerabilities. A deliberate infinite loop or expensive shader can still hurt responsiveness. Install trusted code; use Reload, Back, or Settings to disable a broken package. This is a controlled web-page API, not unrestricted native plug-in execution. Never inject untrusted library strings with `innerHTML`; use `textContent` as the example does.

Native document navigation is prevented for source-document frames, using Electron's [frame navigation event](https://www.electronjs.org/docs/latest/api/web-contents/#event-will-frame-navigate), so a page cannot replace its CSP by navigating to an external document. In-page anchors are fine. There is deliberately no external-link/window API in v1.

## Acceptance

Run `npm.cmd run test:widgets` for package/bridge fixtures. An optional actual-runtime smoke test is `node_modules\electron\dist\electron.exe scripts\verify-addon-runtime.cjs`; it uses temporary user data and a hidden window, not the real library. This environment's attempted Electron launch did not initialize/report results and was stopped, so runtime acceptance is **not passed**.

Before release, test the real app: enable globally; import the shelf; deny all grants and verify it renders its empty guidance; grant public library/optional storage and network, then enable again; open from both navigation layouts; change sorting and reopen to check storage; disable while open and verify teardown; update to a higher version and verify activation/grants reset; uninstall/restore; confirm private games remain absent even after unlocking. Check keyboard/controller focus, narrow toolbar layout and responsiveness with a large public library.
