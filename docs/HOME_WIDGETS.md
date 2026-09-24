# Home Widgets

Home is moving from a fixed dashboard to a player-owned widget space. A widget is a small, independently placeable Home surface such as **Game Updates**, **Recently active**, or a future community-made dashboard, companion, tool or lawful local emulator.

## Current host

The first release of this foundation registers every existing Home panel as a **first-party widget**. Their present content, privacy rules and controls are unchanged. The registry records each widget's stable ID, Home group and minimum size so the future grid cannot make a widget too small to read.

Community widgets are imported disabled. Open Home → Widgets to review the author, version and requested capabilities, then enable a widget deliberately. Its HTML, CSS and JavaScript run inside a separate sandboxed frame.

## What modders will make

Widgets are web packages, not DLL files. A package contains a versioned manifest plus HTML, CSS, JavaScript and optional images. This first host supports self-contained HTML and local script, stylesheet and image references. WebAssembly, advanced media, controller access and emulator widgets still need their own tested capability work.

The first distribution path is a manually shared folder through [r/NeoLibLauncher](https://www.reddit.com/r/NeoLibLauncher/) or Discord. The player selects its `widget.json` file. Archive import and a marketplace are later work.

## Package folder structure

An author shares one folder or archive with this exact root file:

```text
my-widget/
├─ widget.json       # required manifest, selected by Import widget
├─ index.html        # isolated widget entry point
├─ widget.js         # optional local script
├─ style.css         # optional local stylesheet
└─ assets/           # optional local images
```

When a player selects `widget.json`, NEO-LIB validates it, checks the entry file exists, then copies the whole package into its own local application-data folder:

```text
NEO-LIB user data/
└─ widgets/
   └─ author.widget-id/
      └─ widget.json
```

The original folder is never run in place. The app rejects symbolic links, executable/native files, packages over 500 files or 64 MB, invalid IDs and invalid manifests. Updates to an installed ID require a higher version and a visible review. The old copy is retained for recovery.

## Manifest contract

```json
{
  "formatVersion": 1,
  "apiVersion": 1,
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

The author field, description, version, requested permissions and dimensions appear in the Home **Widgets** list. Version uses `major.minor.patch`. API version 1 is currently supported. The host clamps size to the declared minimum and shows an error/reload control for a broken widget without blocking Home.

## Making the first widget

Put `widget.json` beside `index.html`. Use ordinary local references such as `<script src="widget.js"></script>`, `<link rel="stylesheet" href="style.css">` and `<img src="assets/icon.png">`. NEO-LIB bundles these files into the sandboxed entry at load time. Keep the resulting entry below 5 MB; individual entry and referenced files must be below 2 MB. Dynamic imports and arbitrary local-file reads are not part of API v1.

Listen for `message` events from `parent`. The `neo-lib-widget-v1` / `init` message contains `apiVersion`, `widgetId`, granted capability names, and only the data granted to that widget. `library.read` supplies up to 2,000 non-private game summaries with name, source, genres, playtime, last played and rating, but no executable paths or account information. `storage` supplies the widget's own bounded key/value state. A widget can call `window.neoLibWidget.storage.set(key, value)` or `get(key)`; replies use `storage:value` messages. Keys must be short letters/numbers/dots/underscores/hyphens and values stay small. No other host commands are available.

## Safety boundary

- No DLLs, EXEs, native modules, `require`, Node.js or Electron access.
- No direct access to `window.api`, the library document, settings, private categories, game executable paths, tokens or other widgets.
- Each widget runs in its own sandboxed frame with a strict Content Security Policy and a narrow message bridge.
- Permissions default to none and are granted individually in Widgets. They are `storage`, `library.read` and `network`. Network allows HTTPS requests from the isolated frame. Changing an existing grant stops the widget until it is enabled again.
- Updating a package disables it and clears its grants. Uninstall moves the package into local recovery instead of deleting it.
- A widget cannot launch a game, select files, open external links or access a controller/device unless a player action goes through a specific host-approved bridge.

## Emulator example

An SNES widget remains a future use case. A separate, reviewed player-selected ROM handoff and tested emulator core would be needed. The current widget host cannot read arbitrary ROM files or invoke a native emulator.

## Terminology

**Home Widgets** are sandboxed content that lives on Home. Future broader **Plugins** may integrate elsewhere in NEO-LIB, but should use a separate, more carefully reviewed capability model rather than inheriting Home's widget permissions.
