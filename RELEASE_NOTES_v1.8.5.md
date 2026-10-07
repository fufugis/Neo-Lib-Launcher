# NEO-LIB v1.8.5 — Modules, retro sources and Lounge customization

## Windows installer rebuild

Future Windows installers are named **NEO-LIB-Setup.exe**, without a version in the filename. The app retains version 1.8.5; portable ZIP, provenance and checksum inspection remain part of the release process. CI uploads the exact installer name instead of arbitrary EXEs.

Stable website download after a published latest release contains this asset:
https://github.com/fufugis/Neo-Lib-Launcher/releases/latest/download/NEO-LIB-Setup.exe

Existing published assets are unchanged. Release preparation does not publish a tag or certify an installer.

## Carried-forward features

- **Playtime pie widget:** available in Home and Lounge. Filter recorded lifetime minutes by title, minimum/maximum hours, launcher, Journey status, favourites and recent game activity. Choose 5/10/15 named slices; Other preserves remaining totals. Filters save independently and locked games are excluded. Recent activity selects games, not invented period-hour totals.
- **Official modules and addons:** Lounge retains its top-level placement and NEO-LIB ownership while using a separate renderer/window. Import coded modules and opt-in addons with capability review, isolated runtime boundaries and recoverable removal. Existing library data remains core-owned.
- **Retro sources:** optional Skraper gamelist exports, ScreenScraper identification and your own RomM server. Review imports/downloads before applying; no bundled ROMs, BIOS or emulator downloads. Credentials stay in the native core.
- **Fantasy themes:** Moonlit Arcana and Cosmic Citadel preserve the supplied original 5504×3072 JPEGs. Lounge stays sharp; desktop presentation is gently softened.
- **Emulator carousel:** grouped size/width controls and compact visibility checkmarks. Unconfigured consoles appear grey; hidden consoles are skipped without deleting profiles or games.
- **Navigation:** Visuals and Settings flyouts reduce sidebar clutter. Addons use themed button choices; top labels collapse together before clipping. Modules stays in the normal left Menu and sidebar.
- **Lounge positioning and pulse:** position-aware zoom anchors and matching light-source projection. Ordinary theme art receives highlight pulse; off-screen sources remain suppressed and pulse follows atmosphere opacity.
- **Artwork and Journey:** broader reviewed artwork sources, portrait recovery and always-visible game progress controls. Existing protected artwork and save-before-apply boundaries remain.
- **FiFi response handling:** corrections to the privacy-bounded library question path, without broadening the information sent online.

## Release status

The first tagged GitHub build (commit 9b3fa99, run 37703125539) stopped before compilation in a retro-import fixture because Windows TEMP used its short path alias while the service returned the canonical path. The local correction compares canonical file identity and adds aliased-root coverage; release-order checks also tolerate Windows CRLF. Runtime path confinement and stable installer naming are unchanged. The failed tag still refers to the original source; a corrected commit must be built before claiming CI success.

Source target: **v1.8.5**. The complete prebuild source suite passes, including current-version identity, update discovery and candidate fixtures. Production renderer compilation also passes (2358 modules; 16.42s) after the approved outside-sandbox retry; the initial sandbox attempt could not spawn esbuild. Vite still reports a large-chunk warning. This compile is not a credential-configured release package. Installer/portable generation, inspection of actual packages and installed Windows/controller acceptance remain pending. No tag, commit, push or publication is performed by this preparation.

See [WINDOWS_ACCEPTANCE_V1.8.5.md](WINDOWS_ACCEPTANCE_V1.8.5.md). Existing source checks are not evidence of measured FPS, smooth animation, live provider success or packaged Windows behaviour.
