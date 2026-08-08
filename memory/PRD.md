# NEO-LIB — Product Requirements

## Original problem statement
Standalone Windows Game Library app (NEO-LIB). Massive UX/UI refinements,
advanced customization, integrated metadata fetching, auto-sorting categories,
and a non-intrusive monetization system (Deals banners via Affiliate links).

## Architecture
- Electron + React + Vite. Fully portable.
- Library data: `%APPDATA%\NEO-LIB\library.json` (flat JSON).
- CI: GitHub Actions builds NSIS `.exe` + portable `.zip` on tag push.
- System tray (Electron Tray API) for close-to-tray behavior.

## Version 1.2.9 — Feb 2, 2026
**Stats tab · Two Special themes · Text-size slider · Sub-cat toggle · 3 sound packs · News anchoring:**
- **Stats tab** (`StatsPanel.jsx`): draggable portal, anchors next to `tab-stats` button. Shows connected clients (Steam/GOG/itch/EA/Ubi/Epic/Battle.net), most-played ranking filtered by This week / month / year / all time (based on `lastPlayedAt`), total hours, Link Discord button. Placeholder for future Steam Web API playtime import.
- Two Special themes (`colorful`, `pro`) added to `THEMES`, styles.css, and BgAmbience `ambClass` map. Colorful spawns extra `.shooting-stars` layer at effects level > 0; Pro gets brushed-metal texture + orange scanline. Both bump particle count 1.5× to feel more "premium".
- New CSS var `--sidebar-tint` per theme + `.sidebar-tint` layer inside sidebar renders a soft accent wash behind the library for contrast.
- Independent `nameTextSize` slider in `LibrarySettingsPopover` — clamps 9-22px, decouples from `rowSize`.
- `showSubcatStrip` toggle — plumbed through Sidebar → SectionWrap → CategorySection → GameRow. Gates the genre/playtime meta strip line.
- News popup: added `anchorSelector` prop; positions itself under `[data-testid="tab-news"]` via `getBoundingClientRect()`.
- Sound packs: added `crystal` (bell chime), `cyberpunk` (glitch pop + noise), `bubble` (soft plop) to `sound.js` PACKS registry.

## Version 1.2.8 — Feb 2, 2026
**Tidy Up bug fix · Sliders portal · Every theme animated · Draggable news · 2-col Settings:**
- **CRITICAL fix in `TidyUpModal.jsx findDuplicates()`**: dropped Rule 3 (shared 3+ folder ancestors) which lumped ALL Steam library games into one cluster because they all share `Steam\steamapps\common\`. User reported: "I had those two games only and the other 42 games from steam were removed." Now only same-exe (Rule 1) and same normalized name (Rule 2) fire. Added cluster-size safety cap (max 6 games per cluster).
- Sliders popover (`LibrarySettingsPopover`) portaled to `document.body` with `position: fixed` + `z-[9999]` and **fully opaque** `rgb(var(--surface))` background — no longer hides behind game preview and no longer see-through when hovering the preview pane. Anchor position computed from trigger button rect on open.
- `BgAmbience`: removed the early `if (!ambClass) return null` bailout. Every theme now spawns particles/sakura/edgeGlow/extraLayers scaled by `LEVEL_MAP[level]`. Themes without a dedicated CSS class (Gaming, Modern, and any future ones) still get full effects.
- `LatestNewsPill` polished: 1.5px accent border, animated `boxShadow` pulse (2.4s cycle), diagonal shimmer sweep every ~5s (`x: -120% → 380%`), thicker 12px blinking dot with double-radius shadow.
- `NewsPanel` modal: drag-controlled via framer-motion. Header row is the drag handle. Backdrop is `pointer-events-none` so clicks outside pass through to the app.
- `SettingsModal`: CSS columns 2-up layout for everything below the theme picker. Theme picker stays wide at top. Media query drops to 1 column below 720px.

## Version 1.2.7 — Feb 2, 2026
**Category dot fixed · Effects moved · Time-bucketed showcase · Snappier news:**
- Bug fix: Category dot toggle now hides both the meta dots (GameRow) AND the category header dot (`CategorySection`, line 900-911). Previously only the meta dots were gated.
- Library settings popover z-index bumped from 30 → 70 so it overlays the GameDetail hero, not hidden behind screenshots. Also uses `glass-strong` for better readability.
- Effects intensity slider **moved** from `SettingsModal` to `LibrarySettingsPopover` in the sidebar (where all other visual dials live). SettingsModal now shows an info hint pointing users there.
- Effects `LEVEL_MAP` beefed up: Max now spawns 64 particles + 88 sakura + drifting radial blobs (2-3 layers) + pulsing viewport `boxShadow` edge glow. Every level from Low → Max is visibly distinct.
- `LatestNewsPill` in `GameDetail.jsx` redesigned: full-width, big pulsing dot with LIVE label, gradient tint background, expandable snippet, gradient "Read full" CTA button.
- News popup: removed backdrop blur + darkening, animation duration cut 220 → 140ms, positioned top-right corner instead of center — feels like a notification tray.
- New `unseenNewsCount` state in App polls `news:fetchAll` every 10 min; renders as a pulsing red badge on the News tab. `settings.newsLastSeenAt` stamped when News is opened.
- `ShowcaseStrip` restructured: horizontal buckets **This week (72px tiles) · This month (56px) · Long ago (44px icon-only w/ hover tooltip)** based on `lastPlayedAt` / `addedAt` matched to the active mode. Vertical group labels with per-bucket accent dot + count.

## Version 1.2.6 — Feb 2, 2026
**Live news pill · Ubisoft deals · Frosted panels · Per-theme effects · Toolbar refresh:**
- New IPC `news:latestForGame` — compact 15-min-cached lookup that returns the single newest news item across Steam / itch / GOG for one game.
- `LatestNewsPill` component in `GameDetail.jsx` — pulsing indicator + platform label + click-to-expand snippet + "Read full" deep link.
- Deals bar now scrapes `store.ubisoft.com/us/deals` (regex on static tiles → 6 titles per fetch, images + links; prices skipped since Ubisoft loads them via JS). Wrapped through Skimlinks.
- Global CSS `.glass` / `.glass-soft` / `.glass-strong` utilities in `styles.css`. Applied to sidebar, GameDetail About/gallery, ShowcaseStrip tiles, DealsBar.
- Sidebar top tabs (Library/Tools/News) rebuilt as a proper frosted toolbar with bigger icon tiles, active-state gradient background, and a bottom accent line separating it from the category tree.
- Effects intensity slider now stores per-theme values in `settings.effectsLevelByTheme[theme]`; `BgAmbience` reads the current theme's value with legacy `effectsLevel` as fallback.
- Gaps between the About and gallery panels bumped from `gap-4` to `gap-5` for more breathing room.

## Version 1.2.5 — Feb 2, 2026
**Installer fix + Deals expansion + News popup + Effects dial:**
- Installer bug fixed: replaced flaky `MUI_FINISHPAGE_RUN` checkbox with `build/installer.nsh` custom NSIS hook that ExecShells the app from `customInstall` (fires after files are copied, guaranteed non-elevated).
- `package.json` nsis: `runAfterFinish: false` + `include: "build/installer.nsh"`.
- Deals expanded — new sources: GOG discounted catalog (up to 12 items, 40%+ off) and Fanatical `stardeal` (covers EA/Ubisoft titles).
- Platform badge overlay on every deal card (`PlatformBadge` component in `DealsBar.jsx`) — STEAM / EPIC / GOG / IG / FAN with brand-matched gradients.
- "All N" pill: animated pulse loop (framer-motion), flame icon, accent gradient background.
- News tab: converted from full-panel replacement to a floating modal via `createPortal(body, document.body)`. Backdrop uses `backdrop-blur(6px)` + darkening layer. Modal itself uses `backdrop-blur(18px) saturate(140%)`. Body scrolls (uses `flex-1 min-h-0 overflow-y-auto`). Close via Esc, X, or backdrop click.
- New `EffectsLevelSlider` (5 discrete stages: None/Low/Medium/High/Max) — single control in `SettingsModal.jsx` that scales particles, sakura, and overlay opacity together via the `LEVEL_MAP` in `BgAmbience`.
- Affiliate revenue audit: verified Instant Gaming direct `?igr=gamer-1485e8f`, Skimlinks catch-all fallback wraps every else, Skimlinks JS auto-injected in `main.jsx`.

## Version 1.2.4 — Feb 2, 2026
**Build IDs, itch devlogs & GOG patch notes:**
- New IPC `steam:manifest` — reads `%STEAM%\steamapps\appmanifest_<appid>.acf` on demand (5-min per-appid cache) and returns `buildid`, `LastUpdated`, `SizeOnDisk`.
- `GameDetail.jsx` — `SteamManifestLine` component renders "Updated N days ago · Build 12345 · X GB on disk" below the exe path (Steam games only).
- New IPC `news:fetchAll` — unifies Steam + itch.io devlog RSS + GOG changelog HTML into one 30-min cached feed. Preserves per-source badge/colour + per-source counts.
- itch.io: parses `<user>.itch.io/<slug>/devlog.rss` for any game whose `website` matches `*.itch.io`.
- GOG: reads `api.gog.com/products/<id>?expand=changelog`, extracts `<h1..h6>` sections whose heading contains an ISO date, long-form date (`30 March 2018`), or fragment. Only sections within the last 14 days are surfaced.
- Feed toggle bar auto-adds `itch devlog` and `GOG patch` pills; hidden if count is 0.

## Version 1.2.3 — Feb 2, 2026
**Steam News, live feed:**
- New IPC handler `news:fetchSteam` in `electron/main.js` — queries `ISteamNews/GetNewsForApp` for every game with a Steam appid, parallel batches of 8, 30-min in-process cache, force-refresh flag.
- Filters items to the last **14 days** (server-side), strips BBCode/HTML for a 320-char snippet.
- `NewsPanel.jsx` rewritten from placeholder into full feed: game capsule, "time ago" stamp, snippet, click-to-open on Steam.
- Feed classifier groups items into **Official / Community / Third-party** via `feedname` heuristic; UI toggle bar with live per-feed counts.
- Non-Steam games surface a "coming soon" footer note (GOG / itch feeds are next).
- Version bumped 1.2.2 → 1.2.3 across all 5 pinned locations.

## Version 1.2.2 — Feb 1, 2026
**Fixes + Tidy up + News placeholder** (see CHANGELOG for full list).

## Version 1.1.4 — Feb 16, 2026
**Tray mode + Featured banner:**
- Close-to-tray (Electron `Tray` + window `close` interception, persisted via `settings.minimizeToTray`).
  Tray menu: Show / Quit. Left-click toggles window visibility.
- `FeaturedDealBanner.jsx` — slim 56px sponsored card above DealsBar, rotates IG hot deals (paying affiliate).

## Version 1.1.3 — Feb 16, 2026
**More deals (revenue), still subtle:**
- Instant Gaming scraper in `main.js` (regex-based, defensive try/catch).
- Steam supply 8 → 15, threshold 25% → 20%.
- "All N" popover in DealsBar.

## Version 1.1.2 — Feb 16, 2026
**What's-new toast:**
- `ChangelogModal.jsx` auto-opens 2.2s after boot when `lastSeenVersion !== APP_VERSION`.

## Version 1.1.1 — Feb 16, 2026
**Polish & QoL:** per-game ambient backdrop, Deep Scan toggle, drop-folder auto-scan, selective metadata accept.

## Affiliate network status (as of v1.1.4)
| Network | ID | Status |
|---|---|---|
| Instant Gaming | `gamer-1485e8f` | LIVE — 3% / sale |
| Humble Bundle | `8518905` | Submitted, pending |
| Awin (Superbox MID 81755) | `2935955` | LIVE (Superbox only) |
| Skimlinks | `304685X1792871` | Submitted, pending |

## Roadmap / Backlog

### P1 (active)
- [ ] **Xbox / EA / standalone launcher feeds** — extend NewsPanel beyond Steam / itch / GOG.
- [ ] **News notification badge** — count of unread news items on the sidebar News tab.

### Deferred per user
- Refactor `App.jsx` / `main.js` (only when regression-risk shrinks).

### Dropped per user
- PC Tuner Wizard, keyboard shortcuts overlay, cloud sync via GitHub Gist.

## Versioning rule
Every git push bumps `+0.0.1` across:
- `desktop-app/package.json`
- `desktop-app/src/App.jsx` (`APP_VERSION` constant)
- `desktop-app/src/components/SettingsModal.jsx` (About line)
- `desktop-app/src/components/ChangelogModal.jsx` (top of `CHANGELOG`)
- `desktop-app/README.md` (badge + Latest section + previous Latest demoted)

## Test notes
- Tray feature MUST be tested on a real Windows install — Electron `Tray` doesn't render in CI/headless.
- IG scraper regex is fragile by nature; try/catch yields empty array on failure.
- Pre-existing lint warnings unrelated to this session.
