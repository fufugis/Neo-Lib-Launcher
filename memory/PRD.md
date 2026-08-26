# NEO-LIB — Product Requirements

## Original problem statement
Standalone Windows Game Library app (NEO-LIB). Massive UX/UI refinements,
advanced customization, integrated metadata fetching, auto-sorting categories,
and a non-intrusive monetization system (Deals banners via Affiliate links).

## Architecture
- Electron + React + Vite. Fully portable.
- Library data: `%APPDATA%\NEO-LIB\library.json` (flat JSON).
- Playtime history: `%APPDATA%\NEO-LIB\playtime-history.json` (daily per-appid snapshots).
- CI: GitHub Actions builds NSIS `.exe` + portable `.zip` on tag push.
- System tray (Electron Tray API) for close-to-tray behavior.

## Version 1.6.6 — Feb 25, 2026
**Feedback finally works in the compiled .exe, via a signed Cloudflare Worker relay:**
- **New `desktop-app/cloudflare-relay/`** — `worker.js` (Cloudflare Worker), `wrangler.toml`, `README.md`. The app now signs feedback payloads with HMAC-SHA256 (`VITE_FEEDBACK_RELAY_KEY`) and POSTs to `VITE_FEEDBACK_RELAY_URL`; the Worker verifies the signature (5-min replay window), rate-limits 8 req/hour/IP via Workers KV, reshapes the payload server-side (capped field lengths, fixed username, exactly 1 embed), then forwards to the real Discord webhook — which lives ONLY as a Worker secret, never in the repo or the shipped `.exe`.
- **`FeedbackModal.jsx`** — new `postFeedbackPayload()` prefers the relay; `VITE_FEEDBACK_WEBHOOK_URL` direct-POST is now a local-dev-only fallback used when the relay env vars are empty. `FEEDBACK_ENABLED = RELAY_CONFIGURED || !!WEBHOOK_URL`.
- **`.github/workflows/build-windows.yml`** — new step writes `desktop-app/.env` from `NEOLIB_FEEDBACK_RELAY_URL` / `NEOLIB_FEEDBACK_RELAY_KEY` GitHub secrets right before `yarn build:renderer`, so CI-built `.exe`/portable zips ship with a working feedback button. **User still needs to**: run `wrangler deploy` themselves (own free Cloudflare account, steps in `cloudflare-relay/README.md`) and add the two GitHub secrets — this wasn't done in this session since it requires the user's own Cloudflare account.
- **Root cause of the "endpoint not configured" report**: `desktop-app/.env` is (by design) gitignored, so the webhook rotation done in v1.6.5 only ever existed in the sandbox — it never reached the user's compiled `.exe`. The relay solves this permanently: CI bakes in the relay URL+key via GitHub secrets instead of relying on a gitignored file.

## Version 1.6.5 — Feb 25, 2026
**Webhook re-rotated · News is English-only · Gold ring & category glow scale with text size · 3 new textures · ACTUALLY vertical theme picker:**
- **🔒 Webhook rotated again** — old Discord channel deleted (2nd spam-bot hit), new webhook wired into `desktop-app/.env` only, never hardcoded.
- **`electron/main.js` `isLikelyEnglishNews()`** — Valve's `GetNewsForApp` has no working language filter; publishers post the same announcement once per language as separate feed items. New heuristic drops any Steam news item whose title/snippet is dominated by non-Latin script (Cyrillic/CJK/Arabic/Hebrew/Thai/Greek/Devanagari ranges). Applied in `news:fetchSteam`, `news:fetchAll`, and `news:latestForGame`.
- **`Sidebar.jsx` `GameRow` `ringScale`** — the 5-star gold shimmer ring used to be a fixed `inset:0` sized to the whole row regardless of `nameTextSize`. Now computes `ringScale = clamp(0.45, 1.15, size.font/14)` → CSS var `--ring-scale` → `styles.css .row-5star-shimmer::before` shrinks its inset/padding inward as text gets smaller, so it no longer bleeds into neighboring rows at tiny text sizes. Tested live: `nameTextSize=12` → `--ring-scale: 0.857`.
- **`Sidebar.jsx` `Section` `catScale`** — same fix for the category name glow/halo and the color-dot glow: `catScale = clamp(0.55, 1.3, catTextSize/11)` scales every shadow dimension so small "Category text size" no longer washes glow into neighboring category headers.
- **3 new background textures**: Scanlines, Circuit, Chevron — pure CSS `repeating-linear-gradient`/grid patterns, no external assets. `BG_TEXTURE_PATTERNS`, `BG_TEXTURES`, `bgTexturePreview()` all updated (9 total incl. None).
- **Settings theme picker — genuinely vertical this time.** v1.6.4's changelog claimed this shipped; the code still rendered a horizontal wrapping grid (confirmed by user + code read). Rebuilt as 4 columns left→right: Bright · Mid · Dark · Special, each with the tone label at top and themes stacked **vertically** inside. Swatch height cut ~20% (28px → 22px); label text size (11.5px) unchanged.
- **Answered (not code):** user asked about reading private chats from other apps in the background to build a unified friends list/DM gateway. Declined as out of scope — reading another process's private chat contents (Discord/Battle.net/EA/Steam) requires memory-scraping or a keylogger-equivalent, which breaks every platform's ToS and is a serious privacy liability, regardless of Emergent's own capability to build it. Alternative on the books (Task 3, P2): aggregate each platform's *public* presence data (online status, currently-playing game) via official APIs where the user's profile is public — not chat content.

## Version 1.6.4 — Feb 24, 2026
**Genre hide fixed · Chromier toolbar · Column switcher in Visuals · Launcher dropdown · Vertical themes · Gold shimmer · Warp sci-fi sound · Range-aware Most Played · Webhook secured:**
- **`Sidebar.jsx` Section → GameRow** — Forwarded `showSubcatStrip` prop that was previously dropped. The "Sub-category strip" toggle in the Visuals popover now actually hides the genre chips under game names. Third time was the charm.
- **`Sidebar.jsx` toolbar bands** — Darkened both toolbar rows to `linear-gradient(rgb(0 0 0 / 0.38) → 0.20)` so the tab pills read as chrome, not more game rows.
- **`App.jsx` `BgTexture`** — Removed the full-viewport `mix-blend-mode: overlay` layer. Sidebar now renders texture patterns via `BG_TEXTURE_PATTERNS` map as `background-image` inside its own body. Hero banners / preview images in the main pane stay pristine.
- **`Sidebar.jsx` LibrarySettingsPopover** — Added Column Layout section (single / two columns). Removed the standalone Columns button from row-2 toolbar.
- **`Sidebar.jsx` LauncherDropdown** — Replaced 6-pill launcher filter row with a single dropdown ("All launchers ▾"). Click-outside + Escape close, keyboard-nav ready. Frees ~200px of horizontal chrome.
- **`Sidebar.jsx` "+ New" → "+ Category"** — Category-creation button relabeled for parity with "+ Add Game".
- **`SettingsModal.jsx` theme picker order** — Reversed groups to Bright → Middle → Dark → Special (Special last as it's the "wildcard").
- **`styles.css` `.row-5star-shimmer`** — New animated gold conic-gradient border for 5-star favourites. Uses `@property --gold-a` for smooth 360° rotation with graceful pulse fallback. Applied in `GameRow` when `g.rating === 5`.
- **`lib/sound.js` PACK_SCIFI rebuilt** — Bandpass filter sweep replaced with a "warp punch": FM chirp descending zap on hover (carrier + square modulator, highpass @ 240Hz), ascending saw + noise burst warp-drive engage on launch. Actually audible now.
- **`electron/main.js` playtime history** — On every `steam:importPlaytime`, snapshot each appid's lifetime playtime to `playtime-history.json` keyed by YYYY-MM-DD. Kept for 400 days.
- **`electron/main.js` `playtime:history` IPC** — New handler returns per-appid delta minutes over the last N days. Baseline = latest snapshot ≤ (today - N days), falls back to earliest snapshot if we haven't been tracking that long.
- **`StatsPanel.jsx`** — Uses `window.api.playtimeHistory({ days })` to compute a per-game `displayMinutes` for the ranking. "Most played · This week/Month/Year" now ranks by *hours in that window*, not lifetime totals. Header "tracked" count also range-aware.
- **`FeedbackModal.jsx`** — Removed the hardcoded `FALLBACK_WEBHOOK` constant. `.env`-only path. `desktop-app/.env` rotated with fresh webhook URL. CI-built .exes will show "not configured" until a signed relay ships.
- **`preload.js`** — Exposed `window.api.playtimeHistory(opts)`.

## Version 1.6.3 — Feb 23, 2026
**Fixed: phantom Steam hours on non-Steam games · Aligned toolbar · Visible textures · Louder Special themes:**
- **`electron/main.js`** — Steam import no longer treats `localconfig.vdf` appids as ownership. Only `sharedconfig.vdf` + installed `appmanifest_*.acf` count. Empty/dormant localconfig entries (playtime=0, lastPlayed=0) are also dropped from the merge map. Fixes Hellclock / Solarpunk (and other non-Steam games) inheriting phantom 500+ hour numbers on import.
- **`PlaytimeImportModal.jsx` `apply()`** — Added `row.owned` guard to the Steam-hours branch. Even under "Select all" bulk action, Steam playtime is never applied to a row that isn't verified-owned in the currently signed-in Steam account.
- **`App.jsx` `BgTexture`** — Textures now paint on top of the frosted sidebar/main at `z-index: 50` with `mix-blend-mode: overlay` so they're actually visible over the library pane. Default opacity bumped from 12 → 40; slider max increased from 40% → 100%. Pattern rgba values darkened for contrast.
- **`Sidebar.jsx` top toolbar** — Rebuilt as flex row with progressive-collapse labels: at `sidebarWidth ≥ 340px`, Library / Tools / News / Stats show icon + label; below 340px, labels hide and tabs go icon-only. TabPill has a hairline border + subtle panel bg even when inactive, so it always looks like a button. Settings and Feedback are icon-only pills aligned at `h-9` for perfect flush alignment.
- **`Sidebar.jsx` toolbar row 2** — Same progressive-collapse: Add Game / Wizard / Visuals labels hide below 340px. Add Game button renamed from "Add".
- **`Sidebar.jsx` Visuals popover** — Removed the "Playtime toolkit" shortcut; playtime access now lives exclusively in the Stats panel via "Import hours".
- **`SettingsModal.jsx` theme picker** — Grid changed from 6-column to 4/5-column so labels have room. Font bumped `text-[9px]` → `text-[11.5px]`, swatch enlarged `h-5` → `h-7`.
- **`styles.css` `.amb-colorful`** — Added conic-gradient prism aura with slow rotation, hue-drift animation, extra rainbow bloom radials, denser sparkle field.
- **`styles.css` `.amb-pro`** — Added hazard-chevron march animation, brushed-metal sheen, corner emergency pulses via layered radials.

## Version 1.6.2 — Feb 2, 2026
**Fixed: Steam hours coming back after Reset · Proper Select-all bulk button:**
- **`PlaytimeImportModal.jsx`** — bulk resets (`bulkResetAll`, `bulkZeroUnowned`) now stamp rows with `_bulkReset: true` and clear `wasManual`. In `apply()`, the `_bulkReset` branch writes `playtimeManual: false` — which unlocks the game for future Steam imports. Previously the reset was writing `playtimeManual: true` and permanently locking Steam merges.
- **`apply()` steam branch** — dropped the `!row.wasManual` guard. If the user explicitly checks a row (or hits "Select all Steam-owned"), Steam value wins even for previously-manual games.
- **New bulk buttons** `bulkSelectAll` / `bulkDeselectAll` — one-click flip of every row. Renamed the ownership-filtered one to "Select Steam-owned only" to distinguish.
- **Per-row `refreshOne`** — also clears wasManual / overrideValue / _bulkReset so a per-row refresh always writes cleanly.

## Version 1.6.1 — Feb 2, 2026
**Fixed: Steam hours coming back after Reset · Proper Select-all bulk button:**
- **`PlaytimeImportModal.jsx`** — bulk resets (`bulkResetAll`, `bulkZeroUnowned`) now stamp rows with `_bulkReset: true` and clear `wasManual`. In `apply()`, the `_bulkReset` branch writes `playtimeManual: false` — which unlocks the game for future Steam imports. Previously the reset was writing `playtimeManual: true` and permanently locking Steam merges.
- **`apply()` steam branch** — dropped the `!row.wasManual` guard. If the user explicitly checks a row (or hits "Select all Steam-owned"), Steam value wins even for previously-manual games.
- **New bulk buttons** `bulkSelectAll` / `bulkDeselectAll` — one-click flip of every row. Renamed the ownership-filtered one to "Select Steam-owned only" to distinguish.
- **Per-row `refreshOne`** — also clears wasManual / overrideValue / _bulkReset so a per-row refresh always writes cleanly.

## Version 1.6.1 — Feb 2, 2026
**Ownership rewrite · Bulk playtime actions · Modal fixes · Feedback works in CI builds:**
- **`electron/main.js`** — Steam import rewritten. New `extractAppBlocks()` uses brace-matched parsing (previous non-greedy regex broke on nested `cloud`/`autocloud` blocks in `localconfig.vdf`). Now walks `steamapps/libraryfolders.vdf` to enumerate every Steam library folder across drives and scans `appmanifest_*.acf` in each — fixes secondary-drive installs (Icarus, etc.) previously being flagged "unowned". Returns `debug.sources` with per-source counts.
- **`PlaytimeImportModal.jsx`** — removed `disabled` on unowned-row checkboxes, added `cursor-pointer` and `type=button` to refresh buttons. New bulk-action bar: `Select all Steam-owned`, `Zero all unowned`, `Reset all to 0`, `Re-fetch all from Steam`. New `debug` prop renders a "(?)" tooltip in header.
- **`Sidebar.jsx`** — new "Playtime toolkit…" shortcut button at the bottom of the Visuals popover; plumbed `onOpenPlaytimeImport` from App.jsx.
- **`FeedbackModal.jsx`** — added `FALLBACK_WEBHOOK` constant so shipped .exe builds without `.env` still POST feedback.
- **`App.jsx`** — `onRefreshAll` handler wired to `PlaytimeImportModal`; `openPlaytimeImport` now stores `debug` field.

## Version 1.6.0 — Feb 2, 2026
**Playtime import preview · True Steam ownership · Manual override · Safer reset:**
- **`electron/main.js`** — rewrote Steam playtime import. Now scoped to the **currently signed-in** account (read from `loginusers.vdf` → `MostRecent=1`) only. Ownership set derived from `sharedconfig.vdf` apps block ∪ `localconfig.vdf` apps block ∪ installed `appmanifest_*.acf`. Returns `{ data, ownedAppids, currentAccount, count, ownedCount }`.
- **`utils.js` `playtimeSource(g)`** — v1.6.0 requires `g.steamOwned === true` for the STEAM tag. Also handles `g.playtimeManual` returning `MANUAL` chip.
- **`StatsPanel.jsx` `mergedGames`** — only merges Steam playtime when `g.steamOwned === true`. Manual overrides (`playtimeManual`) short-circuit the merge.
- **New `PlaytimeImportModal.jsx`** — scrollable list of every game with current vs Steam hours, ownership badge, per-row toggle / refresh / manual override. Applies patches setting `steamOwned`, `playtime`, `lastPlayedAt`, and optional `playtimeManual`.
- **Stats "Import hours" button** — now opens the preview modal via `onOpenImportPreview` prop. Right-click "Re-import from Steam" also opens it.
- **`ConfirmModal.jsx`** — added `typedConfirm` prop. Confirm button stays disabled until the user types the exact string. Used for large-value playtime resets (`> 100h`).
- **`handleGameContext('reset-playtime')`** — new copy explicitly says "LOCAL playtime, Steam records not touched", uses `typedConfirm='RESET'` for large values, and clears `playtimeManual`.

## Version 1.5.0 — Feb 2, 2026
**Feedback pill · Rate this update · Playtime source tags · Reset & Re-import playtime:**
- **`FeedbackModal.jsx`** — new component. Three modes (bug / suggestion / feedback) posting to a Discord webhook. Also exports `sendChangelogReaction()` and `FEEDBACK_ENABLED` flag.
- **Very visible Feedback pill** in Sidebar top TabPill row (gradient accent → accent-2 background, pulsing gold dot). Plus 3 shortcut buttons at the bottom of the Visuals popover: Bug / Idea / Say hi.
- **Rate this update** — `RateThisUpdate` component in `ChangelogModal.jsx` renders 3-emoji reactions (😍 😐 😕) in the modal footer. Fires `sendChangelogReaction()` on click; once picked, swaps to a thank-you row.
- **Playtime source tags** — new `playtimeSource()` helper in `utils.js` returns `{ id, label, color }` for Steam / GOG / itch / Epic / EA / Ubisoft (or `null` for local). Rendered as a small chip in `Sidebar.jsx` game rows and `StatsPanel.jsx` ranking rows.
- **Reset playtime** — right-click menu → "Reset playtime to 0" in Sidebar; handled in `handleGameContext('reset-playtime')` in App.jsx via `updateGame(g.id, { playtime: 0, lastPlayedAt: 0 })`.
- **Re-import from Steam** — right-click menu → calls `window.api.importSteamPlaytime({ force: true })` and writes back to the game.
- **`desktop-app/.env`** — created with `VITE_FEEDBACK_WEBHOOK_URL`; added to `.gitignore`. `.env.example` committed as template.

## Version 1.4.0 — Feb 2, 2026
**Star ratings · Startup intro · News alerts · Background textures · Playtime unit fix:**
- **5-star ratings** — click stars at top of GameDetail. 5⭐ games get warm-gold gradient wash behind their name in Sidebar. `game.rating` (0–5) persisted via `onUpdateGame`. New `StarRating` component in `GameDetail.jsx`.
- **Sidebar reshuffle** — Settings moved next to Stats in top TabPill row; cog-wheel SideBtn removed from mid toolbar. Sliders renamed to **Visuals** (wider pill).
- **5 background textures** — Grain / Grid / Diagonal / Hex / Dots + opacity slider. Rendered by new `<BgTexture>` global layer in App.jsx; picker in `BgTexturePicker` inside Visuals popover. Settings `bgTextureId`, `bgTextureOpacity`.
- **Startup intro** — new `StartupIntro.jsx` with 3-sec synthwave logo reveal + WebAudio-synthesized jingle (pad chord + kick x2 + lead pluck). Skippable. Gated by session ref + `settings.skipIntro`.
- **Watched-game news alerts** — new `GameNewsAlert.jsx` popup with soft chime. `App.jsx` polls `window.api.fetchAllNews` hourly for pinned OR 5⭐ games; new items > `settings.newsAlertLastAt` trigger the popup.
- **Deck showcase** — This Week bucket now sorts by playtime desc regardless of mode. Hours badge overlaid on This Week & This Month tiles.
- **🐛 Playtime unit fix** — standardized on MINUTES across the app. `formatPlaytime()` now takes minutes; `App.jsx` game-exit handler divides seconds by 60 before adding. Sidebar row and TidyUpModal updated.
- **🐛 News modal** — click-outside on backdrop now dismisses (backdrop no longer has pointer-events: none).
- **🐛 Category-dot toggle** — now hides the category-header dot too. When hidden, section renders a colored backdrop stripe + left border in the category color.
- **🐛 Uncategorized drag-drop** — explicit `__uncat__` sentinel in drag-data; both row-drop and section-drop normalize the sentinel.
- **Theme picker** — 6/7-col grid, ~50% smaller tiles.
- **Settings > Visual effects** — collapsed to a redirect hint; controls moved to Visuals popover with `.settings-columns` two-col masonry.

## Version 1.3.1 — Feb 2, 2026
**Compact theme picker · Gradient theme swatches · Sidebar row reshuffle:**
- **Compact theme picker** in `SettingsModal.jsx` — 4/5-column tile grid with icon-first swatch and label under, replaces the 2/3-column wide rows. Roughly half the vertical space.
- **Gradient theme swatches** — added `gradient` field to every entry in `THEMES` (utils.js), a real `linear-gradient(135deg, surface → accent → accent-2)` per theme. The theme buttons now show the "average" mood, not a flat pink dot.
- **Sidebar reshuffle** — deleted the pre-toolbar launcher filter row; moved the pills below the Add/Wizard/Settings toolbar. Deleted the standalone Auto-sort + New category strip and merged them into the right side of the new launcher-pills row. Tools mode keeps a simple `Tools` label.

## Version 1.3.0 — Feb 2, 2026
**Theme park rebalanced · Real Steam playtime · Sub-cat toggle fixed:**
- **Theme park rebalanced (less pink).** `synthwave-day` → vivid purple (138 79 255) + teal (22 176 176) on lavender wash. `daybreak` → deep teal (20 156 158) on warm paper. `gaming` → Twitch-style vivid purple (155 100 255) + electric blue on esports navy. `anime` → sorcerer purple (158 76 235) + electric blue + neon green. Synthwave and Colorful keep their signature pinks. `.vapor-sun` / `.vapor-floor` decorations retuned to match new palette. THEMES swatch registry updated.
- **Real Steam playtime import** — `steam:importPlaytime` IPC in `main.js` walks `userdata/<steamid>/config/localconfig.vdf` for every Steam account, extracts Playtime + LastPlayed per appid, merges across accounts. 5-min in-process cache, force-refresh flag. Offline, no API key.
- **StatsPanel** auto-runs the import on open, merges Steam totals via `Math.max(local, steam)` into `mergedGames` used by all aggregates.
- **Client attribution** in StatsPanel fixed: explicit `source > appid > website > local`. A manual itch game with an accidental appid no longer buckets under Steam.
- **Stats ranking icons** — every row now shows Steam capsule / cover / initials fallback.
- **Sub-cat toggle** fully plumbed through `SectionWrap` for 2-column sidebar mode.

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
