# Game Library

A minimal, modern, native-feeling Windows desktop app for managing your installed games.
Frameless window, four themes (Midnight, Daybreak, Ocean, Crimson), Steam-powered metadata,
icon extraction from `.exe` files, and a guided **Auto-import Wizard** that scans a folder
for installed games.

> 100% offline browsing & launching. The internet is used **only** when you press
> **Add Game / Wizard / Re-fetch / Update all** to look up metadata.

---

## Features

- **Left sidebar**: searchable list of games with their .exe icon
- **Right detail pane**: hero image, screenshots, description, genres, release date, dev/publisher
- **Manual add**: pick a game's `.exe`, auto-searches Steam, lets you pick the correct match
- **Wizard**: scan a folder/drive → review each detected game (with cover preview) → accept or skip
- **Right-click → Re-obtain info online**: re-searches Steam, skipping the previously chosen match so it "tries differently"
- **Global "Update all"** button: refresh metadata for every game in your library
- **Themes**: Midnight (default), Daybreak (light), Ocean (deep blue), Crimson (red/black noir)
- **No API keys, no cloud sync, no accounts.** Library JSON lives in `%APPDATA%/GameLibrary/`

---

## Build the Windows installer

You need Node.js 18+ and Yarn (or npm) on Windows.

```bash
# 1. install deps
yarn install
# or: npm install

# 2. build the installer (.exe + desktop shortcut)
yarn build:win
```

Output → `dist/GameLibrary-Setup-1.0.0.exe`

When you run that installer:
- creates a Start-menu entry
- creates a **desktop shortcut**
- lets you pick the install location
- launches the app on finish

### Development (hot-reload)

```bash
yarn dev
```

Runs Vite on `localhost:5173` and Electron pointing at it.

---

## Project layout

```
desktop-app/
├── electron/
│   ├── main.js          # Main process (IPC, file ops, Steam API, scanner)
│   └── preload.js       # Exposes window.api safely to the renderer
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── styles.css
│   ├── components/      # TitleBar, Sidebar, GameDetail, modals
│   └── lib/utils.js
├── index.html
├── package.json         # includes electron-builder config (NSIS, desktop shortcut)
├── tailwind.config.js
├── vite.config.js
└── build/               # Place icon.ico / icon.png here before packaging
```

---

## Where data is stored

- `library.json` → list of games + their metadata
- `settings.json` → theme preference
- `covers/` → downloaded Steam cover art

All inside `%APPDATA%/GameLibrary/` (e.g. `C:\Users\<you>\AppData\Roaming\GameLibrary`).

---

## Notes about metadata

Metadata is fetched from the **public Steam Store catalog** (`store.steampowered.com/api/...`).
No API key is required. Most PC games (Steam, GOG, Epic, standalone) get matched as long as
the folder/exe name resembles the title. If a match is wrong, right-click the entry → **Re-obtain info online**
to retry with the next-best result.

---

## Icon

A default `build/icon.ico` is included as a placeholder. Replace it with your own 256×256
multi-resolution `.ico` file for a custom installer icon.
