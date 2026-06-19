# NEO-LIB

> A synthwave-flavored, portable Windows game library — scans your launchers,
> fetches metadata from Steam / Epic / GOG, surfaces hand-picked deals, and
> stays out of your way.

![version](https://img.shields.io/badge/version-v1.1.9-ff2bd6) ![status](https://img.shields.io/badge/status-active-ff2bd6) ![platform](https://img.shields.io/badge/platform-Windows%20x64-9b5cff) ![license](https://img.shields.io/badge/license-Proprietary-1a1a2e)

### Latest — v1.1.9 (CI hotfix)
- Replaced the `discord-rpc` npm package — its Windows postinstall was killing the CI build at yarn install — with a tiny native IPC client using only Node's built-in `net` module. **No new dependencies.**
- Bumped CI runner to Node 22 (Node 20 was deprecated).
- Same user-facing Customize button + Discord status as v1.1.8, just builds reliably now.

### v1.1.8 (Customize button + Discord status)
- New eye-catching **Customize** button on every game detail page → single panel for custom **cover / icon / hero / background / screenshots / description**, plus a custom **.exe path** and **launch arguments** so you can point NEO-LIB at any executable you want.
- **Discord Rich Presence** — when you launch a game through NEO-LIB, your Discord status reads `Playing <game> · via NEO-LIB`. Toggle in Settings → App behaviour. (Requires NEO-LIB's Discord App ID to be set; see *Discord RPC setup* below.)

#### Discord RPC setup (one-time)
1. Go to https://discord.com/developers/applications → **New Application** → name it `NEO-LIB`.
2. Copy the **Application ID** from General Information.
3. In the GitHub repo: `Settings → Secrets and variables → Actions → New repository secret` → name `NEOLIB_DISCORD_APP_ID`, paste the ID.
4. Optional: under **Rich Presence → Art Assets** in the Discord portal, upload a square logo and name the asset key `neolib_logo`.
5. Push a new tag — the CI build will bake the App ID into the installer.

### v1.1.7 (Themes, layout & window memory)
- **Two new "Middle" themes** — **Gaming** (dark blue + pink) and **Modern** (dark orange + light blue) — grouped in their own niche between Dark and Bright.
- **Window remembers your size & position** across sessions; opens at 75% of native screen on first launch.
- **New slider:** "Gap between header & first game" — minimum value lets games sit right under the category header.
- **Steam popup fix:** once a launcher has games imported, it no longer re-prompts on startup. New installs are silently added with a toast.

### v1.1.6 (Windows CI hardening)
- Pipeline hardened: explicit Vite renderer step, code-signing disabled on Windows runner, verbose electron-builder logs, dist verification before zipping.
- No user-facing behavior changes — purely a release-engineering fix to make the `.exe` reliably reach the Releases page.

### v1.1.5 (UI polish & visibility)
- **Current version** now shown directly in the title bar — no Settings dive needed.
- **Update pill blinks** gently so you never miss a new release.
- **Settings tooltips redesigned** — bigger, white card with dark text, offset below the cursor so it never overlaps your reading.
- **Modal backdrop blur softened** — opens feel less heavy.

### v1.1.4 (Tray mode + Featured banner)
- **Close to system tray** — toggle in Settings → App behaviour. The X button now hides NEO-LIB next to the clock instead of quitting. Right-click the tray icon to fully quit.
- **Featured deal banner** — slim sponsored card above the deals bar, rotates through Instant Gaming hot deals. Dismissible; re-enable in Settings → Deals.

### v1.1.3 (More deals, still subtle)
- **Instant Gaming hot deals** added to the rotation (paying affiliate).
- **Steam specials expanded** 8 → 15 entries, threshold lowered to ≥20%.
- New **"All N" pill** opens a popover with every current deal.

### v1.1.2 (What's new toast)
- **"What's new" modal** auto-shows once after each update so you actually see what changed. Manual replay via Settings → About → "What's new".
- Settings About reworked with side-by-side "Check for updates" + "What's new" buttons.

### v1.1.1 (Polish & QoL)
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

- **6 dynamic themes** — Synthwave, Midnight, Ocean, Crimson, Anime, Mint
  Garden (grouped Dark / Bright). Each with its own ambient particle field,
  sound pack, and optional CRT boot animation.
- **Smart Wizard** — pick folders, drives, or whole launcher install roots.
  Fast (5-deep) and **Deep Scan** (10-deep, 5000 files) for nested setups.
  Exclusion paths supported; back-button at every step.
- **Auto-detect launchers** — Steam, Epic, EA App, GOG, Ubisoft, Battle.net,
  Riot, Xbox / MS Store. Inactive launchers are dimmed.
- **Drag-drop** `.exe` / `.lnk` / **folders** onto the window — single files
  add instantly, folders open the Wizard and auto-scan.
- **Accept-before-add** metadata preview — pick exactly which fields (cover /
  description / genres / screenshots / dev / publisher / …) to apply, with
  All / Only changed / None presets.
- **Edit Metadata** form — manual override with local `file://` image pickers.
- **Launcher tabs** — filter the sidebar by store (All / Steam / Epic / EA /
  GOG / Other).
- **Pinned Games strip** + **Two-Row dense layout** + **resizable sidebar**.
- **Smart Auto-Sort** — bucket your library into Recently Played, Long Games,
  Quick Sessions, AAA, Indie, Hidden Gems with one click.
- **Granular Troubleshoot panel** — refetch from a specific source when one
  fails, without re-running the full Wizard.
- **Live Deals strip** — Epic Free Games + Steam discounts + Instant Gaming
  hot deals, refreshed on launch. Affiliate-tagged so it helps fund updates.
  "All N" pill opens a full-grid popover; **Featured deal banner** above the
  bar showcases one IG hot deal at a time.
- **Close-to-tray mode** — hide NEO-LIB to the system tray (next to the
  clock) instead of quitting. Right-click tray = Show / Quit.
- **Auto-updater pill** in the title bar — checks GitHub Releases and shows
  when a new version is out.
- **"What's new" toast** — auto-shows once after each update so you actually
  see what changed.
- **Per-game ambient backdrop** — selected game's hero image subtly tints
  the theme behind it. Optional.
- **PayPal donations** — "Buy me a coffee" modal with QR + direct link.

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
