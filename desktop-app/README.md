# NEO-LIB

> A synthwave-flavored, portable Windows game library — scans your launchers,
> fetches metadata from Steam / Epic / GOG, surfaces hand-picked deals, and
> stays out of your way.

![version](https://img.shields.io/badge/version-v1.6.0-8a4fff) ![status](https://img.shields.io/badge/status-active-ff2bd6) ![platform](https://img.shields.io/badge/platform-Windows%20x64-9b5cff) ![license](https://img.shields.io/badge/license-Proprietary-1a1a2e)

### Latest — v1.6.0 (Playtime import preview · True Steam ownership · Manual override · Safer reset)
- **True Steam ownership** — derived from `sharedconfig.vdf` + `localconfig.vdf` + installed `appmanifest_*.acf` for the currently signed-in account only. Pirated repacks and manually-added games no longer get Steam hours merged in.
- **Import preview modal** — scrollable list of every game with current vs Steam hours, per-row toggle / refresh / manual override. Nothing is written until you click Apply.
- **Manual playtime override** — type your own hours; game tagged `[MANUAL]`, future Steam imports skip it.
- **Only signed-in Steam account** — reads `loginusers.vdf` → `MostRecent=1`. No more shared-machine bleed.
- **Safer Reset** — explicit copy, requires typing `RESET` for > 100h. Never touches Steam records.
- New `[MANUAL]` source chip.

### v1.5.0 (Feedback pill · Rate this update · Playtime source tags · Reset & Re-import)
- **Feedback / Bug / Suggestion pill** in the top toolbar + 3 shortcut buttons inside Visuals menu. All post to a Discord webhook. Version, theme, and platform auto-attached.
- **Rate this update** — 3-emoji reaction (😍 😐 😕) at the bottom of every "What's new" modal, fires to the same webhook.
- **Playtime source tags** — Steam / GOG / itch / Epic / EA / Ubisoft chips beside game names in Sidebar and Stats, so you can eyeball where each hour count came from.
- **Reset playtime** — right-click → wipes local tracking to 0.
- **Re-import from Steam** — right-click any Steam game → pulls the latest `localconfig.vdf` value.
- Webhook URL is read from `desktop-app/.env` (`VITE_FEEDBACK_WEBHOOK_URL`, gitignored). `.env.example` template committed.

### v1.4.0 (Star ratings · Startup intro · News alerts · Textures · Playtime fix)
- **Star ratings** — 5-star click-to-rate at the top of every game preview; 5⭐ games get a subtle warm-gold wash behind their name in the library.
- **Sidebar reshuffle** — Settings moved into the top TabPill row next to Stats; the cog-wheel is gone. Sliders renamed to **Visuals** (wider, more important pill).
- **Background textures** — Grain / Grid / Diagonal / Hex / Dots with a transparency slider, all inside Visuals.
- **Startup intro** — 3-second synthwave logo reveal with a WebAudio-synthesized jingle every boot. Skippable.
- **Watched-game news alerts** — favorited (pinned) or 5⭐ games trigger a centered chime + popup once/hour when new news arrives. Click outside to dismiss, "Read news" opens the article.
- **Showcase deck** — "This Week" now always sorts by most-played; This Week & This Month tiles get an hours-played badge overlay.
- **Fixed** playtime numbers (units were mixed seconds/minutes; now consistently minutes everywhere).
- **Fixed** News modal click-outside dismiss, category-dot toggle for the category header itself (colored backdrop stripe replaces it), and drag-drop reorder in Uncategorized.
- **Compact theme picker** — 6/7-column tile grid, ~50% smaller.

### v1.3.1 (Compact theme picker · Gradient swatches · Sidebar reshuffle)
- **Compact theme picker** — 4/5-column tile grid instead of 2/3 wide rows; roughly half the vertical space.
- **Gradient theme swatches** — each button now shows a real surface→accent→accent-2 gradient (the "average" of the theme) so you can eyeball each mood before switching.
- **Sidebar reshuffle** — launcher filter row (All / Steam / Epic / EA / GOG / Other) moved below the Add / Wizard toolbar; Auto-sort and New category buttons joined that row on the right side.

### v1.3.0 (Theme park rebalanced · Real Steam playtime · Sub-cat toggle fixed)
- **Themes rebalanced** — less pink, more variety. Vaporwave Day → purple + teal, Daybreak → teal, Gaming → Twitch purple + electric blue, Anime → sorcerer purple. Synthwave and Colorful keep their pink signatures; the rest now cover purple / teal / blue / black / orange evenly.
- **Real Steam playtime import** — Stats panel reads `localconfig.vdf` across every Steam account on the machine (offline, no API key).
- **Stats ranking icons** — every ranking row now shows the Steam capsule / cover / initials fallback.
- **Sub-cat toggle bug fixed** — hide-sub-cat also propagates through the 2-column sidebar mode.
- **Client attribution fixed** — non-Steam games with an accidental appid are no longer bucketed under Steam.

### v1.2.9 (Stats tab · Special themes · Text-size slider · Subcat toggle · 3 sound packs)
- **Stats tab** — connected clients breakdown + most-played ranking filtered by week / month / year / all time.
- **Colorful** and **Pro** — two Special themes with sparkles, shooting stars, carbon/textured surfaces, sweeping scanlines, and bumped particle counts.
- **Sidebar tint** — subtle per-theme wash behind the library for readability.
- **Text-size slider** independent of icon size.
- **Sub-category toggle** — turn off "Action, RPG" genre badges without hiding the category dot.
- **News popup** anchors next to the News button.
- **3 new sound packs**: Crystal / Cyberpunk / Bubble.

### v1.2.8 (Tidy Up fix · Sliders portal · Every theme animated · Draggable news · 2-col Settings)
- **CRITICAL FIX**: Tidy Up "remove duplicates" no longer wipes out your Steam library (over-eager Rule 3 dropped, cluster-size cap added).
- **Sliders popover** portaled + fully opaque — always floats above the game preview.
- **Every theme now animates** — particles + edge glow apply to synthwave, midnight, ocean, crimson, anime, mint, gaming, modern and any future theme automatically.
- **News pill** = animated border pulse + diagonal shimmer sweep + thicker accent border.
- **News popup** draggable by its header.
- **Settings modal** = 2-column masonry layout.

### v1.2.7 (Category dot fixed · Effects moved · Time-bucketed showcase · Snappier news)
- **Bug fix**: Category dot toggle now hides both the meta dots AND the category header dot.
- **Sliders popover** now floats above the preview pane (z-70 instead of z-30).
- **Effects slider moved** from Settings to the sidebar Sliders menu; Max level is now genuinely maxed (64 particles, drifting blobs, pulsing viewport edge glow).
- **Latest news pill** on selected games — full-width, LIVE label, gradient tint, big blinking dot, "Read full" gradient CTA.
- **News popup** slides in from the corner in ~140ms with no blur / no darken; **News tab pulses** when there are unseen items.
- **Showcase strip** below the preview is smaller and horizontally bucketed: **This week** (big) → **This month** (medium) → **Long ago** (compact).

### v1.2.6 (Live news pill · Ubisoft deals · Frosted panels)
- **Live news pill** — every selected game shows a small pulsing "Latest news" pill above its description; click to expand, click "Read full" to open the source.
- **Ubisoft deals** — deals bar now pulls Ubisoft Store offers alongside Steam / Epic / GOG / IG / Fanatical.
- **Frosted panels** — primary surfaces (sidebar, About, gallery, showcase cards, deals bar) now use backdrop-blurred glass so the theme background breathes through.
- **Toolbar refresh** — Library / Tools / News is now a proper frosted top-bar with bigger icons and a gradient underline.
- **Effects per theme** — the intensity slider remembers a different level for each theme.

### v1.2.5 (Installer fix · Deals expanded · News popup · Effects dial)
- **Installer fix** — "Run NEO-LIB after install" checkbox now actually launches the app (custom NSIS hook bypasses the flaky electron-builder finish-page behaviour).
- **Deals expanded** — GOG discounts + Fanatical star deal (covers EA / Ubisoft titles), platform badges on every card so you see the source at a glance.
- **All N pill** — animated pulse + flame icon + accent gradient. Impossible to miss.
- **News is a floating popup** — backdrop blur + darken the app so focus lands on the feed. Scrolls properly. Close with Esc / X / click-outside.
- **Effects intensity slider** — one dial, 5 stages (None / Low / Medium / High / Max) that scale particles, sakura, and glow together.

### v1.2.4 (Build IDs, itch devlogs & GOG patch notes)
- **Steam Build IDs on every card** — reads the local `appmanifest_<appid>.acf` and shows `Updated N days ago · Build 12345 · X GB on disk` under the exe path.
- **News tab now covers itch.io** — parses `<user>.itch.io/<slug>/devlog.rss` for every itch game in your library.
- **News tab now covers GOG** — reads `api.gog.com/products/<id>?expand=changelog` and pulls out per-date sections from the last 14 days.
- New feed toggles for `itch devlog` and `GOG patch` alongside Official / Community / Third-party.

### v1.2.3 (Steam News, live feed)
- **News tab is live** — pulls announcements & patch notes from Steam for every Steam game in your library, restricted to the last **14 days**.
- **Feed filters** — toggle Official / Community / Third-party posts with live counts.
- **Rich cards** — game capsule, "time ago" stamp, snippet preview; click to open on Steam.
- **Cached 30 min** in the Electron process; Refresh button forces a re-fetch.
- Non-Steam games get a "coming soon" footer note (GOG / itch feeds are next).

### v1.2.2 (Fixes + Tidy up + News placeholder)
- **Bug fix:** Custom .exe picker now actually saves the picked path.
- **Bug fix:** "Category dot" toggle correctly toggles only the dots.
- **Dynamic glow slider** — 0-300% range with a white-core "extra pop" above 120%.
- **Auto-scroll while dragging** games near the top/bottom edge of the sidebar.
- **Refresh menu** with a new **Tidy up** action — finds duplicate games (same exe, same name, or multiple exes sharing a folder tree) and shows them side-by-side.
- **New "News" tab** placeholder — implemented for real in v1.2.3.

### v1.2.1 (Community access)
- **Discord button in the title bar** (and Settings → About) — one click to join the community: https://discord.gg/spk6QWREk8 — submit bugs, suggest features, stay updated.

### v1.2.0 (Unified multi-source fetch picker)
- **Brand-new "Find metadata" picker** — replaces the old auto-cycle black box with a single window: editable query, big "Auto fetch", plus dedicated buttons for **Steam · GOG · itch.io · DLsite · VNDB · Ryuugames · F95Zone · Google/DDG · Ask AI**.
- **Smart query seeding** from the exe + parent folder (strips version tags, x64, repack noise).
- **Results carousel** — every source returns up to 8-10 candidates with arrows + "1 / N" counter + cover preview.
- **F95Zone source** (via DuckDuckGo site-search) — finally findable adult-game threads.
- "**Re-fetch info**" on Game Detail + "**Try again**" on Accept preview both open this picker.

### v1.1.9 (CI hotfix)
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

- **8 dynamic themes** — Synthwave, Midnight, Ocean, Crimson, Anime, Gaming,
  Modern, Mint Garden — grouped Dark / Middle / Bright. Each with its own
  ambient particle field, sound pack, and optional CRT boot animation.
- **Smart Wizard** — pick folders, drives, or whole launcher install roots.
  Fast (5-deep) and **Deep Scan** (10-deep, 5000 files) for nested setups.
  Exclusion paths supported; back-button at every step.
- **Auto-detect launchers** — Steam, Epic, EA App, GOG, Ubisoft, Battle.net,
  Riot, Xbox / MS Store. Inactive launchers are dimmed. Only prompts on
  first detection or when a NEW game is found — never nags on subsequent starts.
- **Drag-drop** `.exe` / `.lnk` / **folders** onto the window — single files
  add instantly, folders open the Wizard and auto-scan.
- **Multi-source metadata picker (v1.2.0)** — dedicated buttons for Steam,
  GOG, itch.io, DLsite, VNDB, Ryuugames, F95Zone, Google/DDG, and Ask AI.
  Results carousel with 1/N counter, arrow navigation, cover preview.
- **Accept-before-add** metadata preview — pick exactly which fields (cover /
  description / genres / screenshots / dev / publisher / …) to apply, with
  All / Only changed / None presets.
- **Customize panel** — one prominent button on every game detail page →
  set custom **cover / icon / hero / background / screenshots / description**,
  plus a custom **.exe path** and **launch arguments**.
- **Tidy up — duplicate finder** — scans for same-exe, same-name, or
  multiple-.exes-in-the-same-folder-tree clusters. Side-by-side compare,
  keep one, remove the rest (files on disk untouched).
- **Launcher tabs** — filter the sidebar by store (All / Steam / Epic / EA /
  GOG / Other).
- **Pinned Games strip** + **Two-Row dense layout** + **resizable sidebar**.
- **Smart Auto-Sort** — bucket your library into Recently Played, Long Games,
  Quick Sessions, AAA, Indie, Hidden Gems with one click.
- **Granular Troubleshoot panel** — refetch from a specific source when one
  fails, without re-running the full Wizard.
- **Discord Rich Presence** — game launches show "Playing X · via NEO-LIB".
- **Live Deals strip** — Epic Free Games + Steam discounts + Instant Gaming
  hot deals, refreshed on launch. Affiliate-tagged so it helps fund updates.
  "All N" pill opens a full-grid popover; **Featured deal banner** above the
  bar showcases one IG hot deal at a time.
- **Close-to-tray mode** — hide NEO-LIB to the system tray (next to the
  clock) instead of quitting. Right-click tray = Show / Quit.
- **Auto-updater pill** in the title bar — pulses when a new release is out.
- **"What's new" toast** — auto-shows once after each update so you actually
  see what changed.
- **Per-game ambient backdrop** — selected game's hero image subtly tints
  the theme behind it. Optional.
- **Window bounds memory** — opens at 75% of your native screen on first
  launch, remembers any resize / move between sessions.
- **News tab (coming soon)** — placeholder for auto-collected patch notes
  and dev announcements from every launcher, last 14 days only.
- **PayPal donations** — "Buy me a coffee" modal with QR + direct link.
- **Discord community** — join button in the title bar + Settings → About.

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
