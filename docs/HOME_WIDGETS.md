# Home Widgets

Home is moving from a fixed dashboard to a player-owned widget space. A widget is a small, independently placeable Home surface such as **Game Updates**, **Recently active**, or a future community-made dashboard, companion, tool or lawful local emulator.

## Current foundation

The first release of this foundation registers every existing Home panel as a **first-party widget**. Their present content, privacy rules and controls are unchanged. The registry records each widget's stable ID, Home group and minimum size so the future grid cannot make a widget too small to read.

Community widgets are **not loaded yet**. This is intentional: a folder found on disk must not be able to run inside NEO-LIB's main page by accident.

## What modders will make

Widgets will be web packages, not DLL files. A package will contain a versioned manifest plus HTML, CSS, JavaScript and optional WebAssembly/assets. That supports interactive real code—canvas/WebGL dashboards, gamepad-aware tools, mini experiences, and a lawful emulator frontend—without giving community code unrestricted access to Windows or the launcher.

The first distribution path will be a manually installed `.neolib-widget` package or folder shared through [r/NeoLibLauncher](https://www.reddit.com/r/NeoLibLauncher/) and Discord. A marketplace is deliberately later work, after ownership, trust and update policy are clear.

## Package folder structure

An author shares one folder or archive with this exact root file:

```text
my-widget/
├─ widget.json       # required manifest, selected by Import widget
├─ index.html        # future isolated widget entry point
├─ widget.js          # optional future code
├─ style.css          # optional styling
└─ assets/            # optional images, audio, WASM and local data
```

When a player selects `widget.json`, NEO-LIB validates it, checks the entry file exists, then copies the whole package into its own local application-data folder:

```text
NEO-LIB user data/
└─ widgets/
   └─ author.widget-id/
      └─ widget.json
```

The original folder is never run in place. The app rejects symbolic links, packages over 500 files or 64 MB, invalid IDs, invalid manifests and duplicate widget IDs. The same package can later be distributed as a `.neolib-widget` archive; archive support will be added only once its extraction rules receive the same validation.

## Manifest contract

```json
{
  "formatVersion": 1,
  "id": "example.play-log",
  "name": "Play Log",
  "description": "A compact history dashboard for your recent sessions.",
  "author": { "name": "Widget Author", "url": "https://example.com" },
  "version": "1.0.0",
  "entry": "index.html",
  "layout": { "minCols": 4, "minRows": 2, "defaultCols": 6, "defaultRows": 3 },
  "permissions": ["storage"]
}
```

The author field, description, version, requested permissions and dimensions appear in the Home **Widgets** list. The host validates the manifest before showing anything. It will clamp size to the declared minimum/maximum and disable broken widgets without preventing NEO-LIB itself from opening.

## Safety boundary

- No DLLs, EXEs, native modules, `require`, Node.js or Electron access.
- No direct access to `window.api`, the library document, settings, private categories, game executable paths, tokens or other widgets.
- Each widget will run in its own isolated sandboxed frame with a strict Content Security Policy and an explicit message bridge.
- Permissions default to none. Later optional permissions will be narrow and host-controlled: private storage, limited read-only/redacted library data, or user-approved network requests.
- A widget cannot launch a game, select files, open external links or access a controller/device unless a player action goes through a specific host-approved bridge.

## Emulator example

An SNES widget can be a good future use case: its emulator core can run as JavaScript/WebAssembly inside its isolated frame, the player explicitly chooses their own legally obtained ROM, and its saves live inside the widget's scoped local storage. NEO-LIB must not ship ROMs, scrape them, or allow an emulator widget to read arbitrary paths or use native code.

## Terminology

**Home Widgets** are sandboxed content that lives on Home. Future broader **Plugins** may integrate elsewhere in NEO-LIB, but should use a separate, more carefully reviewed capability model rather than inheriting Home's widget permissions.
