# NEO-LIB

> A synthwave-flavored, **fully portable Windows game library** that unifies every game on your PC — Steam, Epic, EA App, GOG, standalone — into one neon-lit interface. No accounts. No cloud. No telemetry.

![status](https://img.shields.io/badge/status-active-ff2bd6) ![platform](https://img.shields.io/badge/platform-Windows%20x64-9b5cff) ![release](https://img.shields.io/badge/release-v1.0.5-1a1a2e) ![license](https://img.shields.io/badge/license-Proprietary-1a1a2e)

---

## ⬇️ Download

Grab the latest build from the **[Releases page](../../releases/latest)** →
- **`NEO-LIB-Setup-x.y.z.exe`** — one-click installer (Start Menu + Desktop shortcut)
- **`NEO-LIB-windows-portable.zip`** — extract anywhere (USB stick friendly), no install

Run, scan, done.

---

## ✨ What it does

NEO-LIB is a **launcher for ALL your games**. Standalone games scattered across your drives get auto-detected and added. Your Steam / Epic / EA / GOG libraries get pulled in alongside them. You can even drop in tools (GPU-Z, MSI Afterburner, etc.) so everything launches from one place.

Games launch via their **original executable**, so Steam overlays, Epic achievements, cloud saves, and DRM keep working exactly as before. NEO-LIB just sits on top as the front door.

---

## 🎨 Features

- **5 dynamic themes** — Synthwave · Midnight · Ocean · Crimson · Anime — each with its own animated particle background
- **Smart Wizard** — pick folders, drives, or whole launcher install roots; exclusion paths supported; back-button at every step
- **Auto-detect launchers** — Steam · Epic · EA App · GOG · Ubisoft · Battle.net · Riot · Xbox/MS Store. Inactive launchers dim out automatically
- **Launcher filter tabs** — switch the sidebar between All / Steam / Epic / EA / GOG / Other in one click
- **Two-Row library layout** — dense double-column view; categories never split between columns
- **Smart Auto-Sort** — one click and your library is bucketed into Recently Played, Long Games, Quick Sessions, AAA, Indie, Hidden Gems
- **Granular Troubleshoot panel** — when a Steam/Epic/GOG fetch picks the wrong game, pick a different match in seconds without rerunning the Wizard
- **Resizable sidebar** with thick drag handle + dynamic sliders for row size, category text size, glow intensity, spacing
- **Live Deals strip** — Epic Free Games + Steam Featured Deals refreshed on launch, with affiliate-routed links that fund development
- **PayPal "Buy me a coffee"** — tasteful donate modal with QR code + direct link
- **Sound packs** — subtle UI clicks for the synthwave purists (optional, off by default)
- **100% offline browsing & launching** — internet is only used when you actively press *Add / Wizard / Refetch / Update All* or load the Deals strip

---

## 🚀 Quick start

1. Download the installer or portable ZIP from [Releases](../../releases/latest).
2. Run `NEO-LIB.exe`.
3. On first launch you'll see the **Wizard** — point it at your game install folders (or whole drives). It'll scan, fetch metadata + cover art, and present each detected game for confirmation.
4. Right-click any game for *Refetch / Rename / Edit launch args / Reveal in folder / Manage categories / Remove*.
5. Hit the **Auto-sort** button (sparkle icon) to instantly bucket everything into smart categories.

Library + settings live at `%APPDATA%\NEO-LIB\`. Delete that folder to factory-reset.

---

## 📜 Patch notes

### v1.0.5 — Polish round 1 *(current)*
- **New:** Subtle window edge glow — soft accent-colored inner halo around the frameless window (Riot/Discord-style premium feel). Auto-dims on light themes.
- **New:** Theme switching now cross-fades smoothly over 560ms instead of snapping. Ambient particle layer fades along with it.
- **Polished:** "Buy me a coffee" button — bigger, gradient gold, gentle pulse every 4s, hover lifts + spins the ☕. Pulse stops on hover so it never feels nagging.
- **New:** Hero parallax — when you move the mouse over a game's banner image, it tilts ~4° in 3D and shifts a few pixels (Apple TV-style). Smooth, GPU-only, no rerenders.
- **New:** Wizard de-dupes — when you re-scan a folder, games already in your library are silently skipped. A small "N already imported · skipped" chip on step 3 lets you know.
- **New:** Wizard name input is now pre-filled with the exe-derived game name. No more empty box for itch.io / indie games — just tweak and re-search.

### v1.0.4 — Check for Updates
- Added **"Check for updates"** button in Settings → About (opens the latest GitHub release page).

### v1.0.3 — Theme persistence + cleaner library
- **Fixed** theme occasionally reverting to Midnight on launch. Settings file writes are now atomic (writes to `.tmp` and renames), and the fallback default is now Synthwave instead of Midnight — your theme will stick.
- **Added** toggle for the small colored category dot beside each game's genre/playtime — in Library Settings popover (sliders icon). Saves visual noise + a few pixels of horizontal space.

### v1.0.2 — Launcher auto-import + privacy + Library tab fix
- **Fixed** the Library tab not being clickable from Tools mode (stale-state race condition).
- **Fixed** privacy leak — private/locked categories no longer auto-show their first game in the preview pane on app startup.
- **New:** When you say "Yes" to a launcher import (Steam / Epic / etc), NEO-LIB remembers and never asks again. Instead, on every launch it silently scans for new installs, auto-imports just the new ones, auto-fetches metadata, and shows a single bottom toast: *"NEO-LIB detected 3 new installs on Steam — now imported into NEO-LIB."*
- Imported games now auto-refetch metadata immediately (no more manual "Refetch" pass).

### v1.0.1 — Proper EXE icon
- Rebuilt the Windows `.ico` as a proper multi-resolution file (16/32/48/64/128/256). The previous build had a malformed `.ico` that broke NSIS installer generation.
- New synthwave power-button icon is now shown in the title bar's top-left as a 7×7 rounded thumbnail with a subtle accent glow.

### v1.0.0 — Synthwave Launch

**First public build.** Everything below shipped together:

- 5 ambient themes with animated backgrounds (Synthwave / Midnight / Ocean / Crimson / Anime)
- Smart Wizard with folder exclusion paths + back-button on every step
- Launcher auto-detector (Steam / Epic / EA / GOG / Ubisoft / Battle.net / Riot / Xbox)
- Launcher filter tabs in the sidebar
- Two-Row library layout (categories never split between columns)
- Smart Auto-Sort into 6 default categories
- Troubleshoot Refetch panel — granular per-source retries (Steam / Epic / GOG / Web)
- Resizable sidebar with thick drag handle
- Dynamic sliders: row size · category text · glow · spacing · gap
- Live Deals strip (Epic Free Games + Steam Featured) — bottom bar + showcase tile
- Humble Partner + Skimlinks affiliate routing (auto-activates on approval)
- PayPal donate modal with QR + direct link
- Sound packs (opt-in)
- Synthwave app icon

> Each release from here on will append a new section to this list with the date and the changes shipped.

---

## 🛣️ Roadmap

- [ ] Cloud Sync via GitHub Gist (opt-in, encrypted library backup)
- [ ] Steam manifest reading — show actual build IDs + "updated X days ago"
- [ ] Keyboard shortcuts overlay (press `?`)
- [ ] More themes (community submissions welcome)
- [ ] Refactor internal state into custom hooks (cleanup, no user impact)

---

## 💸 Monetization & affiliates (transparent)

NEO-LIB is free. Maintenance is funded by:

- **Affiliate-tagged deal links** — when the Deals strip surfaces a sale on Humble / Fanatical / Steam, clicking it routes through the developer's affiliate ID. IDs are baked in at build time (`desktop-app/src/lib/affiliateConfig.js`) and **not editable from the UI**. Tampering with them in redistributed builds violates the license.
- **Voluntary donations** — the "Support" button opens a PayPal QR / link modal. Nothing in the app is gated behind payment.

No data leaves your machine except direct, on-demand HTTPS requests to public store APIs (Steam, Epic, GOG) for metadata and the deal feeds on app start.

---

## 🛠️ Build from source (developers)

Requirements: Node.js 18+, Yarn, Windows 10/11.

```bash
cd desktop-app
yarn install
yarn build:win    # → dist/NEO-LIB-Setup-x.y.z.exe  (NSIS installer)
yarn dev          # hot-reload dev mode (Vite + Electron)
```

CI builds run automatically on every `v*` tag push via `.github/workflows/build-windows.yml` and attach the `.exe` + portable ZIP directly to the GitHub Release.

Source tree map lives in [`desktop-app/README.md`](./desktop-app/README.md).

---

## 📄 License

**Proprietary — All Rights Reserved.** See [`desktop-app/LICENSE`](./desktop-app/LICENSE).

Source is published for transparency and study. Redistribution, repackaging, or stripping of affiliate / donation identifiers is prohibited.

For commercial licensing, partnership, or distribution inquiries, contact the author.

---

<p align="center"><sub>Made with 💜 in synthwave neon — by <a href="https://github.com/fufugis">@fufugis</a></sub></p>
