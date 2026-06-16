# NEO-LIB

> A synthwave-flavored, portable Windows game library — scans your launchers,
> fetches metadata from Steam / Epic / GOG, surfaces hand-picked deals, and
> stays out of your way.

![version](https://img.shields.io/badge/version-v1.1.1-ff2bd6) ![status](https://img.shields.io/badge/status-active-ff2bd6) ![platform](https://img.shields.io/badge/platform-Windows%20x64-9b5cff) ![license](https://img.shields.io/badge/license-Proprietary-1a1a2e)

### Latest — v1.1.1 (Polish & QoL)
- Selective metadata accept — pick exactly which fields (image, description, genres…) replace existing ones.
- Wizard **Deep Scan** toggle — Fast (default, 5-deep) or Deep (10-deep, more files) for nested folder structures.
- Drop a folder onto the window → Wizard now **auto-runs** the scan.
- Optional per-game ambient backdrop — tints the background with the selected hero image.
- Bright "Mint Garden" theme, grouped Dark/Bright themes in Settings.
- Modal backdrop closes are now **double-click** to prevent accidental dismissal.
- Sound effects volume normalized via a dynamics compressor.

---

## What it is

NEO-LIB is a **fully portable** desktop app (Electron + React + Vite) that
unifies every game on your PC into one neon-lit interface — no accounts, no
cloud, no telemetry. Your library lives in a single JSON file under
`%APPDATA%\NEO-LIB\`.

It launches games via their original executable, so Steam / Epic / EA App /
GOG Galaxy overlays, achievements, and cloud saves keep working exactly as
before.

---

## Highlights

- **5 dynamic themes** — Synthwave, Midnight, Ocean, Crimson, Anime — each
  with its own ambient particle background.
- **Smart Wizard** — pick folders, drives, or whole launcher install roots;
  exclusion paths supported; back-button at every step.
- **Auto-detect launchers** — Steam, Epic, EA App, GOG, Ubisoft, Battle.net,
  Riot, Xbox/MS Store. Inactive launchers are dimmed.
- **Launcher tabs** — filter the sidebar by store (All / Steam / Epic / EA /
  GOG / Other).
- **Two-Row layout** — toggle dense double-column view; categories never
  split between columns.
- **Smart Auto-Sort** — one click and your library is bucketed into Recently
  Played, Long Games, Quick Sessions, AAA, Indie, Hidden Gems.
- **Granular Troubleshoot panel** — when a Steam/Epic/GOG fetch fails, pick
  another match without re-running the full Wizard.
- **Resizable sidebar** with thick drag handle + dynamic sliders for row
  size, category text size, glow intensity, spacing.
- **Live Deals strip** — Epic Free Games + Steam Featured Deals, refreshed
  on launch. Optional Affiliate routing benefits the developer.
- **PayPal donations** — "Buy me a coffee" modal with QR + direct link.
- **Sound packs** — subtle UI clicks for the synthwave purists.

---

## Install (end users)

1. Download `NEO-LIB-windows-portable.zip` from the latest release.
2. Extract anywhere — even a USB stick.
3. Run `NEO-LIB.exe`.

No installer, no registry writes, no admin rights. Delete the folder to
uninstall.

---

## Build from source (developers)

Requirements: Node.js 18+, Yarn, Windows 10/11.

```bash
cd desktop-app
yarn install
yarn build:win   # → dist/NEO-LIB-Setup-x.y.z.exe (NSIS installer)
yarn dev         # hot-reload dev mode (Vite + Electron)
```

The portable build script in `package.json` (`build:portable`) produces a
self-contained folder you can zip and ship.

---

## Project layout

```
desktop-app/
├── electron/
│   ├── main.js              # Main process (IPC, scanners, deals, scrapers)
│   └── preload.js           # Context bridge → window.api
├── src/
│   ├── App.jsx              # Root state, modals, persistence
│   ├── styles.css           # Themes + animations + particle fields
│   ├── components/
│   │   ├── Sidebar.jsx          # Tree, tabs, launcher filter, two-row
│   │   ├── GameDetail.jsx       # Right info pane
│   │   ├── ShowcaseStrip.jsx    # Deals + recently played
│   │   ├── WizardModal.jsx      # Folder scanner + exclusions
│   │   ├── AutoSortModal.jsx    # Smart category builder
│   │   ├── TroubleshootModal.jsx# Per-source refetch UI
│   │   ├── DonateModal.jsx      # PayPal QR & link
│   │   └── SettingsModal.jsx    # User preferences
│   └── lib/
│       ├── utils.js
│       ├── sound.js
│       ├── deals.js             # Affiliate URL wrapper
│       └── affiliateConfig.js   # Build-time IDs (DO NOT COMMIT CHANGES)
├── build/                   # icon.ico, installer assets
├── package.json
└── vite.config.js
```

---

## Data location

All user data is stored locally:

```
%APPDATA%\NEO-LIB\
   library.json   ← games, categories, tools, settings
   covers\        ← downloaded cover art
   sounds\        ← optional sound packs
```

Wipe these to factory-reset.

---

## Monetization & affiliates (transparent)

NEO-LIB is free. Maintenance is funded by:

- **Affiliate-tagged deal links** — when the Deals strip shows a sale on
  Humble / Fanatical / Steam, clicking it routes through the developer's
  affiliate ID. Identifiers are baked into the build (`affiliateConfig.js`)
  and **not editable from the UI**. Tampering with them in redistributed
  builds violates the license (see `LICENSE`).
- **Voluntary donations** — the "Support" button opens a PayPal QR / link
  modal. Donations go to the developer; nothing is unlocked or gated behind
  payment.

No data leaves your machine except direct, on-demand HTTP requests to
public store APIs (Steam, Epic, GOG) for metadata, and the deal feeds on
app start.

---

## Roadmap

- [ ] Cloud sync via GitHub Gist (opt-in, encrypted)
- [ ] Steam manifest reading — show actual build IDs + "updated X days ago"
- [ ] Keyboard shortcuts overlay (press `?`)
- [ ] Split bloated `App.jsx` / `Sidebar.jsx` into hooks

---

## License

**Proprietary — All Rights Reserved.** See [`LICENSE`](./LICENSE).

Source is published for transparency and study. Redistribution, repackaging,
or stripping of affiliate/donation links is prohibited.

For commercial licensing or partnership: contact the author.
