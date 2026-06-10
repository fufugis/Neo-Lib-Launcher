# NEO-LIB — Standalone Windows Desktop Game Library

## Original Problem Statement
> Standalone Windows game library app (Steam-like). Left side: games list with .exe icons.
> Right side: preview/info pane. Wizard scans drives for installed games. Global button to
> auto-update metadata online. Multiple themes (dark, light, synthwave). Modern, minimal,
> animated. Installer with desktop shortcut. Fully offline-capable, lightweight, quick startup.

## Architecture / Tech Stack
- **Electron 33** + **Vite + React 18** + **TailwindCSS** + **Framer Motion** + **lucide-react**
- Frameless custom title bar; renderer in `dist-renderer/`, main process in `electron/`
- **electron-builder** with NSIS target (GitHub Actions for full builds; cloud builds use `--dir` portable)
- Metadata: multi-source (Steam → GOG → Gemini → DuckDuckGo scrape). No keys required by default.
- Game data: JSON in `%APPDATA%/NEO-LIB/library.json` + cached covers
- Exe icons extracted via Electron's `app.getFileIcon`, fallback to Steam capsule

## Core Features (implemented)
- [x] Frameless titlebar with min/max/close + global search
- [x] Sidebar tree (categories) with drag-and-drop reordering, collapse/expand
- [x] Detail pane: hero, screenshots carousel, about, genres, devs, publishers, release, metacritic
- [x] Manual Add Game + Wizard (drive scan with per-game review)
- [x] Right-click context menus (via React Portals — z-index safe)
- [x] Global Update All button + per-game Re-fetch
- [x] Multiple themes including Synthwave + Synthwave Day, Midnight, Daybreak, Ocean, Crimson
- [x] Categories (multi-category per game, color tags, drag-drop)
- [x] Ghost (private/PIN-protected) categories
- [x] Library vs Tools tabs at top
- [x] Showcase strip (recently played / added)
- [x] Playtime tracking via process monitoring
- [x] Launcher imports (Steam / EA / Epic) — pinned to bottom with launcher logos
- [x] Dynamic UI sliders (row size, category text size, glow intensity, icon position)
- [x] Hover sounds + Launch sound effect
- [x] YouTube gameplay search button
- [x] Clickable genre/developer/publisher tags (search online)
- [x] Wizard incremental saving (no data loss on early exit)
- [x] **Patch Notes hotlink** (Steam news page if appid, else Google search) — 2026-02
- [x] **Mods hotlink** to Nexus Mods search — 2026-02

## Build / Delivery
- Source: `/app/desktop-app/`
- Cloud env produces **portable ZIP** (`dist/NEO-LIB-windows-portable.zip`, ~111 MB)
- Download endpoint: `GET /api/download/neolib-portable`
- For full NSIS installer: user runs `npm run build:win` on Windows machine, or GitHub Actions
- Detailed steps in `INSTALL.md`

## 2026-02 Session — Patch Notes / Mods / Auto-update Feasibility
Decision: lightweight hotlink approach (no UI for full integration).
- Patch Notes button → opens Steam news page (`/news/app/{appid}`) or Google search fallback
- Mods button → opens Nexus Mods search for game name
- Vortex integration deferred; user is on Vortex but full mod-manager rewrite is out of scope
- Auto-update: app is intended public release, but currently no code-signing cert. Deferred.

## Backlog / Next Iterations
### P1
- **Steam manifest parsing** for actual `buildid` + last-updated timestamp (display in detail pane)
- **Vortex detection**: scan `%APPDATA%\Vortex\{gameId}\mods\` → show mod count badge per game
- **Manual update-check banner**: ping GitHub Releases API on startup, show "v1.x available" toast
- **GitHub Actions release pipeline** producing signed NSIS installer
- Code-signing certificate procurement (~$300/year) for silent auto-updates

### P2
- Custom cover image upload (drag/drop or paste URL)
- Backup/restore library JSON via Settings
- "Last played" sort option
- Refactor `App.jsx` (650+ lines) into `useLibrary`, `useCategories`, `useDragDrop` hooks

## Build Environment Notes
- Container is **ARM64 Linux**: cannot build NSIS installer (32-bit toolchain incompatible)
- Portable `--dir` build via electron-builder works
- Final `.exe` installer requires Windows machine or GitHub Actions runner
