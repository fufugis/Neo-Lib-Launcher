# GameLibrary — Standalone Windows Desktop App

## Original Problem Statement
> I need a standalone app for Windows. A Game library for installed games — Steam-like.
> Left sidebar: games list with name + .exe icon. Right side: preview/info, hero image,
> name, genre, short description. Global button to auto-update info online. Right-click
> "re-obtain game info" per game. Manual add OR Wizard that scans a drive for games,
> showing each with name/info/image so user can accept before continuing.
> Themes: dark, light, blue, crimson+black. Minimal but modern & stylish, animations.
> Must install (.exe / .msi) with desktop shortcut. Fully offline, lightweight,
> quick startup. Metadata fetched online automatically (no API keys to manage).

## Architecture / Tech Stack
- **Electron 33** + **Vite + React 18** + **TailwindCSS** + **Framer Motion** + **lucide-react**
- Frameless custom title bar; renderer in `dist-renderer/`, main process in `electron/`
- **electron-builder** with NSIS target → installer creates desktop & start-menu shortcuts
- Metadata source: **public Steam Store API** (`storesearch` + `appdetails`), no key required
- Game data: JSON in `%APPDATA%/GameLibrary/library.json` + cached covers in `covers/`
- Exe icons extracted via Electron's `app.getFileIcon`

## Core Features (implemented · 2026-01-09)
- [x] Frameless titlebar with min/max/close + search
- [x] Sidebar: searchable list with icons; selection animation
- [x] Detail pane: hero, screenshots carousel, about, genres, devs, publishers, release, metacritic, website, path
- [x] Manual **Add Game** modal: pick exe → guess name → Steam search → pick match → cache cover → save
- [x] **Wizard**: pick drive/folder → recursive scan with noise filter → per-game review with accept/skip/re-search/next-match → bulk import
- [x] Right-click menu per game: **Re-obtain info online** (re-search, skipping current appid), Edit, Reveal in folder, Remove
- [x] Global **Update All** button to refresh metadata for the whole library
- [x] **4 themes**: Midnight (default gold-on-dark), Daybreak (light), Ocean (electric blue), Crimson (red+black noir)
- [x] Settings modal with live theme switching
- [x] Toast notifications, Framer Motion animations on every interaction
- [x] Demo data fallback when run outside Electron (browser preview)
- [x] electron-builder NSIS config: desktop shortcut, start-menu, custom install path, launch on finish
- [x] GitHub Actions workflow for headless Windows builds
- [x] Vite build verified, lint clean (0 errors)

## Build / Delivery
Source ships in `/app/desktop-app/`. User runs `npm install && npm run build:win` on Windows.
Output: `desktop-app/dist/GameLibrary-Setup-1.0.0.exe`. Detailed steps in `INSTALL.md`.

## Backlog / Next Iterations (P1)
- Allow user to set a custom cover image (drag/drop or paste URL) per game
- Tag/Category filters in sidebar (Action, RPG, …)
- Playtime tracking (record when a launched process exits)
- Import from existing Steam library (parse `appmanifest_*.acf`)
- "Last played" sort option
- Backup/restore library JSON via Settings
