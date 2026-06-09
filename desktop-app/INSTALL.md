# How to install on Windows (3 minutes)

You have two simple options to get a `.exe` installer that creates a desktop shortcut.

---

## Option A — Build on your own Windows PC (recommended)

Prereqs: **Node.js 20+** ( https://nodejs.org ) and Git (optional).

```powershell
# 1. unzip / clone this folder somewhere, then in a Windows terminal:
cd desktop-app

# 2. install dependencies
npm install      # or: yarn install

# 3. build the Windows installer
npm run build:win
```

The installer will be created at:
```
desktop-app/dist/GameLibrary-Setup-1.0.0.exe
```

Double-click it. It will:
- let you choose the install folder
- create a **desktop shortcut**
- create a **Start-menu** entry
- launch the app on finish

That's it.

---

## Option B — GitHub Actions (no local Windows machine needed)

If you push this repo to GitHub, the included workflow
`.github/workflows/build-windows.yml` automatically builds a Windows installer
on every push and uploads it as a downloadable artifact.

1. Push the project to a new GitHub repo
2. Open the repository → **Actions** tab → run the **build-windows** workflow
3. Download the produced `GameLibrary-Windows-Installer` zip → inside is the `.exe`

---

## Option C — Portable build (no installer at all)

If you just want a single `.exe` that runs without installing:

```powershell
npx electron-builder --win portable --x64
```

Output: `desktop-app/dist/GameLibrary-1.0.0-portable.exe` — copy to USB stick,
double-click to run. (No shortcut, no install — just runs.)

---

## What to do after installing

1. Launch **Game Library** from the desktop shortcut.
2. **Manual add**: click **+ Add** → pick a game's `.exe` → it auto-searches Steam and shows you matches → pick the right one (or "Add without metadata").
3. **Auto-import wizard**: click **Wizard** → choose a folder (e.g. `C:\Games\` or your `D:\` drive) → review each detected game with cover preview → Accept or Skip.
4. **Fix wrong metadata**: right-click a game in the list → **Re-obtain info online** (it will try a different Steam match).
5. **Update everything online**: click the circular arrow button in the sidebar to refresh metadata for every game at once.
6. **Theme**: open **Settings** (gear icon) → pick Midnight, Daybreak, Ocean, or Crimson.

Your data lives at `%APPDATA%\GameLibrary\` — back it up to keep your library if you move PCs.
