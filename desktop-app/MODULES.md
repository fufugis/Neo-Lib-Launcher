# NEO-LIB Modules · API v1

Modules are independently hosted experiences, not modifications to launcher files. **Lounge remains an official, built-in NEO-LIB module in its existing top navigation position.** It is not an Addon, never requires the custom-module switch and cannot be overwritten or uninstalled by imported packages. The Modules manager identifies its owner as NEO-LIB; the native registry, not an author's manifest, determines official status.

Open **Modules** from the sidebar, the left **Menu → Modules** in normal navigation, or Settings. The manager provides Lounge entry, custom-module import, permission review, individual activation, explicit version updates, recoverable uninstall and restore. Imported modules open through their manager card. Addons remain separate embedded pages under Addons.

## Official Lounge architecture

Lounge opens in a separate Electron window with its own renderer and dedicated sandboxed preload. The module entry does not mount the library's App or persistence store. It reuses the existing Lounge feature tree and themes rather than maintaining a second copy. The current release still builds both entries with Vite; separate rendering does not require replacing the build tool or installing a second framework.

The core owns the library, PIN/privacy state, settings persistence, executable paths and actual launch service. Only privacy-allowed display records go to Lounge. Launch-status booleans preserve recommendations without exposing executable paths. Module launch requests resolve the current permitted ID in core and require the existing one-use, trusted mouse/keyboard launch intent. No arbitrary command or general filesystem bridge is exposed.

Snapshots send changed fields only after initial handoff. Selection/resume saves therefore do not resend the entire scenery configuration or game list. The core pauses its background effects, sound and controller navigation while module windows are open; Lounge has its own foreground controller bridge. Actual FPS/memory improvements must be measured, not inferred from the process split.

Media import dialogs are parented to the calling Lounge window. Prepared custom themes, Lounge presets, widgets, news, update checks and storage scans retain bounded routes. Requesting a private-category unlock returns to the existing core PIN flow; reopen Lounge after unlocking. Closing or crashing a module clears its pending requests; closing the library tears down all its module windows. Windows are session-only, limited to four, and do not automatically reopen at startup.

## Your own coded modules

Copy `examples/modules/library-shelf`, edit the files, then import **module.json**. Nothing installs automatically. Required manifest fields:

```json
{
  "formatVersion": 1,
  "kind": "window",
  "apiVersion": 1,
  "id": "my-studio.my-shelf",
  "name": "My Shelf",
  "description": "My independently coded library view.",
  "author": { "name": "Your name" },
  "version": "1.0.0",
  "entry": "index.html",
  "permissions": ["library.read", "storage", "network"]
}
```

IDs starting with `neolib.` are reserved. Writing NEO-LIB in `author` does not confer ownership, an official badge or Lounge capabilities. Imported packages are copied to the private **modules** root, separate from Addons, Home widgets and installed launcher code. Enable imported custom modules globally, review the permissions, then enable each package. Changing permissions or installing a newer version requires renewed activation; Restore leaves the package disabled.

Authors can write HTML/CSS/JavaScript, Canvas or WebGL. Frameworks need a self-contained classic browser bundle. Local classic scripts, stylesheet links and image tags are assembled into the isolated page. Dynamic imports, local fetches, workers, runtime Node dependencies, remote script imports and native plug-ins are not supported. Embed or bundle assets instead. See ADDONS.md for assembly details and limits: 500 files, 64 MiB package, 2 MiB runtime asset and 5 MiB assembled page.

## Module page SDK

`await window.neoLibModule.ready` returns `{apiVersion,addonId,theme,grants,library,storage}`. The existing v1 `addonId` field and `neoLibAddon` alias remain for shared page-SDK compatibility; `addonId` is this module's ID, not an Addons installation. Subscribe to `neolib:change` for refreshed snapshots.

- `library.read`: at most 2,000 public game records. Private-category games are excluded even if unlocked. No PINs, credentials, paths or raw library document.
- `storage`: `neoLibModule.storage.set(key,value)` stores only this module's bounded JSON state. At most 50 keys, 8 KiB/value and 64 KiB total; storage survives disable and recoverable uninstall.
- `network`: optional HTTPS fetch/images/media. It can transmit granted data externally; approve only trusted authors. Without it, embed data/blob artwork.

No permissions are necessary just to render. There is no game-launch, global-settings, filesystem, arbitrary-window or native-command API for imported modules. Their own window hosts an opaque-origin `sandbox="allow-scripts"` frame with CSP; the frame cannot access the window's preload. Native checks also reject unregistered windows, subframes, other module runtime IDs and attempts to call official-only capabilities. Importing code is not protection against heavy CPU/GPU use or browser vulnerabilities; code must still be trusted.

## Verification and acceptance

`npm.cmd run test:widgets` includes module package, sender-role, reserved-identity, privacy, changed-field bridge and crash-cleanup fixtures. These are source tests, not proof of a live desktop session.

Before release, test: Lounge entry/exit/reopen and Escape; same-monitor fullscreen; preferences/resume after immediate close; controller focus and held carousel movement; custom background/audio/theme imports; Home feeds/scans; private unlock/relock; game launch/return; module crash recovery; importing the example with permissions denied/granted; updating/disabling/removing/restoring while open; both navigation layouts. Measure frame time and memory with the real library. Live and packaged acceptance remain outstanding.
