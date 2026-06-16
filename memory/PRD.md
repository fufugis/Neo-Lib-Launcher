# NEO-LIB — Product Requirements

## Original problem statement
Standalone Windows Game Library app (NEO-LIB). Massive UX/UI refinements,
advanced customization, integrated metadata fetching, auto-sorting categories,
and a non-intrusive monetization system (Deals banners via Affiliate links).

## Architecture
- Electron + React + Vite. Fully portable.
- Library data: `%APPDATA%\NEO-LIB\library.json` (flat JSON).
- CI: GitHub Actions builds NSIS `.exe` + portable `.zip` on tag push.
- Main process scrapers: Steam, GOG, itch, DLsite, VNDB, Ryuugames, DuckDuckGo, Gemini fallback.

## Version 1.1.1 — Feb 16, 2026
**Polish & QoL batch shipped this session:**
- Per-game ambient backdrop toggle (Settings → Visual effects). When ON, the
  selected game's hero image is rendered as a subtle blurred wash behind the
  theme's ambient layer.
- Wizard **Deep Scan** toggle (Fast default 5-deep/1500 files vs Deep 10-deep/5000 files),
  visible in Wizard Step 1.
- Drop-folder auto-scan — dropping a folder onto the window now opens Wizard
  AND auto-triggers the scan (250ms delay).
- Selective metadata accept — AcceptMetadataModal now has per-field checkboxes
  (Name, Image, Description, Genres, Developer, Publisher, Release, Screenshots)
  with quick "All / Only changed / None" presets. Only ticked fields are written.
- Version strings bumped across `package.json`, `SettingsModal`, `README.md`.

## What was already implemented (prior sessions)
- Drag-drop `.exe`/`.lnk` (single files added directly).
- AcceptMetadataModal (preview-before-write).
- EditMetadataModal (manual override with `file://` pickers).
- Dual-pane GameDetail (text + screenshots gallery).
- 6 themes (Synthwave / Midnight / Ocean / Crimson / Anime / Mint Garden) grouped by Dark/Bright.
- DynamicsCompressorNode-normalized UI sounds, sound packs.
- Pinned Games strip + Library tabs (Steam/Epic/EA/GOG/Other).
- Smart Auto-Sort categories.
- Live deals strip with Affiliate routing (Instant Gaming, Awin Humble/Fanatical/Superbox).
- GitHub Releases update checker pill in TitleBar.
- Modal double-click-to-close (replaces single-click).
- CRT boot animation, particles, sparkles, scanlines.

## Roadmap / Backlog

### P1
- [ ] PC Tuner Wizard — diagnostic for running overlays, GPU acceleration, Xbox Game Bar, heavy CPU/GPU background tasks.
- [ ] Keyboard shortcuts overlay (press `?`).

### P2
- [ ] Steam manifest reading — show actual build IDs + "updated X days ago".
- [ ] Cloud sync via GitHub Gist (opt-in, encrypted).
- [ ] Refactor `App.jsx` (~1600 lines) and `electron/main.js` (~1400 lines) into hooks/modules.

## Versioning rule
Every git push bumps `+0.0.1` across:
- `desktop-app/package.json`
- `desktop-app/src/components/SettingsModal.jsx` (About line)
- `desktop-app/README.md` (badge + Latest section)

## Test notes
- No `.exe` testing locally — instruct user to push + tag (e.g., `v1.1.1`) so CI builds.
- Vite `yarn dev` for UI checks. Some features (Electron IPC) won't fire in the browser.
- Pre-existing lint warnings: 5 errors in `App.jsx` (react-hooks/immutability) and 1 in `GameDetail.jsx` (set-state-in-effect) — not introduced this session.
