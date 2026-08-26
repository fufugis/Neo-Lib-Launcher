import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check, X } from 'lucide-react';
import { sendChangelogReaction } from './FeedbackModal';

/**
 * Changelog / "What's new" modal.
 *
 * Shown automatically once after each app update — compares
 * settings.lastSeenVersion vs the current bundled APP_VERSION.
 *
 * Entries are pinned per-version so the user sees only what landed since they
 * last opened the app. First-run (no prior version) skips this modal — the
 * Tutorial handles that case.
 */

export const CHANGELOG = [
  {
    version: '1.6.5',
    title: 'Webhook re-rotated · News is English-only · Gold ring & category glow scale with text size · 3 new textures · ACTUALLY vertical theme picker',
    items: [
      '**🔒 Webhook rotated again.** The Discord channel was getting spammed a second time — old channel deleted, brand-new webhook wired in via `.env` only. Never hardcoded.',
      '**News feed is English-only now.** Steam\'s `GetNewsForApp` has no working language filter, so publishers\' non-English translations of the same announcement (e.g. a Russian Witcher 3 post) were slipping through. Items whose title/snippet are dominated by a non-Latin script (Cyrillic, CJK, Arabic, Hebrew, Thai, etc.) are now filtered out before they reach the panel.',
      '**Gold 5-star ring now scales with your name text size.** It used to be a fixed inset:0 ring sized to the whole row, so at very small text it visually bled into the row above/below. It now shrinks inward as `nameTextSize` drops below its baseline.',
      '**Category glow does the same trick.** The halo/bloom behind category names was fixed-px regardless of the "Category text size" slider — now every glow dimension (and the color dot\'s glow) scales with it, so small text no longer washes into neighbouring categories.',
      '**3 new background textures**: Scanlines, Circuit, Chevron — alongside Grain / Grid / Diagonal / Hex / Dots.',
      '**The vertical theme picker, for real this time.** v1.6.4\'s changelog claimed this landed — it didn\'t; the code still rendered a horizontal wrapping grid. Now it\'s genuinely 4 columns left → right (Bright · Mid · Dark · Special), themes stacked vertically inside each column. Swatches are ~20% shorter; label text size unchanged.',
    ],
  },
  {
    version: '1.6.4',
    title: 'Fixed: hide-genre toggle now works · Toolbar chrome darker · Column-switcher in Visuals · Launcher dropdown · Vertical theme picker · 5-star gold shimmer · Better sci-fi sound · Range-aware Most Played · Webhook secured',
    items: [
      '**Fixed the "hide genre strip under game names" toggle for real.** The Visuals popover was flipping the setting fine, but the prop was never actually forwarded from `Section` into `GameRow` — so nothing changed on screen. One-line fix, third time was the charm. Genre chips now hide/show instantly.',
      '**Toolbar chrome darker** so the tab pills (Library / Tools / News / Stats / Settings / Feedback) and the row-2 buttons read as chrome instead of blending with the game rows underneath.',
      '**Background texture no longer draws over hero banners / preview screenshots.** Moved from a full-viewport `mix-blend-mode: overlay` layer to a `background-image` INSIDE the sidebar body only. Main pane content stays pristine.',
      '**Column-switcher moved into the Visuals popover** (Layout section). Row-2 toolbar is one button lighter as a result.',
      '**Launcher filter is now a compact dropdown** — the six pills (All / Steam / Epic / EA / GOG / Other) collapsed into "▾ All launchers". Same functionality, way less clutter.',
      '**"+ New" renamed to "+ Category"** so its purpose is unambiguous next to "+ Add Game".',
      '**Theme picker restructured** to vertical layout, groups ordered Bright → Middle → Dark → Special. Special group is now the last thing you see (as it should be — it\'s the "wildcard" category).',
      '**5-star favourites now sport a subtle animated gold shimmer border** — a slowly-rotating conic highlight that says "this is a top pick" without screaming for attention. Uses `@property --gold-a` for smooth 360° rotation; graceful fallback for older browsers.',
      '**Sci-fi sound pack rebuilt** — the barely-audible bandpass filter sweep is gone. Replaced with a "warp punch": FM chirp descending zap on hover, ascending warp-drive engage with noise burst on launch. Now actually punches through your desk speakers.',
      '**"Most played · This week/Month/Year" ranks correctly now.** Steam only stores lifetime totals, so we now snapshot per-appid playtime daily into `playtime-history.json` and compute deltas at render time. The header "tracked" hours also reflects the range, not a mystery number.',
      '**🔒 Security:** Rotated the compromised Discord feedback webhook. Removed the hardcoded fallback URL from source — CI-built .exe releases now show "not configured" until a proper signed relay is set up. Local dev + hand-built releases read from `desktop-app/.env`.',
    ],
  },
  {
    version: '1.6.3',
    title: 'Fixed: phantom Steam hours on non-Steam games · Toolbar aligned · Bigger themes · Textures actually visible',
    items: [
      '**🔴 Fixed: Hellclock / Solarpunk (and other non-Steam games) getting 500+ phantom hours after a Steam import.** localconfig.vdf was being treated as an ownership signal — but Steam writes entries there for demos, playtests, and launcher shortcuts too. Only `sharedconfig.vdf` and installed `appmanifest_*.acf` files count now. The import also now double-checks ownership at apply time, so even "Select all" can no longer bulldoze a local/pirated copy with Steam hours.',
      '**Background textures now actually cover the library pane.** The texture layer used to sit behind the frosted sidebar/main panels and get almost fully hidden. It now paints on top at `mix-blend-mode: overlay`, so patterns are visible across the whole app. Opacity slider bumped to 0–100%.',
      '**Toolbar aligned & icons enlarged.** Feedback pill now matches the Library/Tools/News/Stats/Settings row height perfectly. Tab icons and sidebar buttons are ~20% larger. Settings tab still shows the cog wheel.',
      '**Renamed "Add" → "Add Game"** so the button label is unambiguous.',
      '**Moved Playtime toolkit out of the Visuals menu** — it now lives exclusively in the Stats panel via "Import hours". Visual dials stay with visual dials.',
      '**Special themes turned up to eleven** — Colorful now has a slow-rotating conic prism aura, hue-drift, and a denser twinkle field. Pro gains hazard-chevron march, brushed-metal sheen, and corner emergency pulses. Reads as truly "special" now.',
      '**Theme picker fonts readable again** — swatches enlarged, labels bumped to 11.5px, grid changed from 6-columns to 4/5 so each button has room to breathe.',
    ],
  },
  {
    version: '1.6.2',
    title: 'Fixed: Steam hours coming back after Reset · Select-all bulk button',
    items: [
      '**🔴 Fixed: after Reset, Steam hours never came back.** Bulk "Reset all" was stamping every game with `playtimeManual: true` — which then locked them out of every future Steam import. Bulk resets now explicitly clear `playtimeManual`, so subsequent "Select all Steam-owned" + Apply actually pulls Steam values in again.',
      '**Fixed:** "Select all Steam-owned" and the per-row Apply also no longer refuse to override a `playtimeManual` game when you\'ve explicitly checked its box. Your intent wins.',
      '**New: proper "✓ Select all" bulk button** in gradient accent. Marks every row for apply in one click — Steam-owned rows pull Steam hours, others get their current value written back cleanly. Companion "Deselect all" button too.',
      '**Renamed** the previous button to "✓ Select Steam-owned only" so the two are unambiguous.',
    ],
  },
  {
    version: '1.6.1',
    title: 'Ownership detection rewrite · Bulk playtime actions · Modal fixes · Feedback works in CI builds',
    items: [
      '**Fixed: Steam ownership detection.** The v1.6.0 parser used a non-greedy regex that broke on nested cloud/autocloud blocks inside game entries in `localconfig.vdf`, so most games came back as "unowned". Also, only the main Steam install\'s `steamapps/` was scanned for `appmanifest_*.acf` — games installed on secondary drives (like Icarus on a D:\\ library) were completely missed. Now uses proper brace-matched parsing AND walks `libraryfolders.vdf` to scan every Steam library folder on every drive.',
      '**Fixed: import preview modal.** Checkboxes were disabled for "unowned" rows so you couldn\'t apply anything. Refresh buttons were passive. Both work now on every row.',
      '**New bulk actions in the import modal** — "✓ Select all Steam-owned" · "⚠ Zero all unowned" · "💥 Reset all to 0" · "🔄 Re-fetch all from Steam". One click cleans up years of corrupted values.',
      '**New: Playtime toolkit shortcut** in the Visuals menu — opens the import modal from outside the Stats panel so you can find it.',
      '**Fixed: Feedback pill in shipped .exe builds.** The webhook URL was gitignored so CI-built releases showed "not configured". Added a hardcoded fallback URL alongside the env variable; feedback now sends from any build.',
      '**Debug info** — the import modal header now shows a subtle "(?)" hover-tooltip with source counts (sharedconfig / localconfig / manifests / library folders) so you can see exactly what NEO-LIB detected.',
    ],
  },
  {
    version: '1.6.0',
    title: 'Playtime import preview · True Steam ownership · Manual override · Safer reset',
    items: [
      '**True Steam ownership** — NEO-LIB now derives ownership from **Steam\'s own signals** for the currently signed-in account only: `sharedconfig.vdf` (tagged/owned appids) + `localconfig.vdf` (played appids) + installed `appmanifest_*.acf` files. Games with an `appid` in metadata but NOT in that ownership list (pirated repacks, manually-added exes, games from other Steam accounts on the same machine) are treated as local-only and get no Steam merge and no `[STEAM]` chip.',
      '**Playtime import preview modal** — every import (from Stats panel or right-click "Re-import from Steam") now opens a scrollable preview showing the signed-in account name, every game with its current vs Steam hours, an ownership badge, per-row toggle, per-row refresh, and per-row **manual override**. Nothing is written until you click Apply.',
      '**Manual playtime override** — click any game\'s hour cell in the preview modal, type your own number in minutes. The game gets tagged `[MANUAL]` and is skipped by all future Steam imports so you\'re never overwritten again.',
      '**Only signed-in Steam account is imported** — reads `loginusers.vdf` → `MostRecent=1`. Multi-account shared machines no longer bleed playtime across users.',
      '**Safer Reset playtime** — right-click Reset now shows the exact current hours, explains Steam records are never touched, and requires typing `RESET` for values > 100 hours. Also clears the `playtimeManual` flag.',
      '**`[MANUAL]` source chip** — appears beside game names anywhere playtime is shown when the user has manually overridden it.',
    ],
  },
  {
    version: '1.5.0',
    title: 'Feedback pill · Rate this update · Playtime source tags · Reset & Re-import playtime',
    items: [
      '**Feedback / Bug / Suggestion pill** — a very visible neon "Feedback" pill next to Stats & Settings, plus three shortcut buttons (🐛 Bug · 💡 Idea · 💬 Say hi) inside the Visuals menu. All post straight to a Discord webhook — no signup, no email, just type and send. Your app version, theme, and platform are auto-attached so bug reports come pre-diagnosed.',
      '**Rate this update** — a small three-emoji reaction (😍 😐 😕) at the bottom of every "What\'s new" changelog modal. One tap fires to the same Discord webhook.',
      '**Playtime source tags** — Steam-imported hours now show a small `[STEAM]` chip beside the game name in the Sidebar and the Stats ranking. GOG / itch / Epic / EA / Ubisoft tags too. Locally-tracked games show no tag, so you can instantly tell "did this hour count come from an import or from my sessions?".',
      '**Reset playtime** — right-click any game → "Reset playtime to 0". Wipes local tracking; Steam imports may re-populate on next Stats-panel open.',
      '**Re-import from Steam** — right-click any Steam game → "Re-import from Steam" pulls the latest `localconfig.vdf` playtime for that appid and overwrites the local value.',
      '**.env-configured Discord endpoint** — the webhook URL lives in `desktop-app/.env` (gitignored) as `VITE_FEEDBACK_WEBHOOK_URL`, baked at build time. A `.env.example` is committed as a template for forks.',
    ],
  },
  {
    version: '1.4.0',
    title: '5-star ratings · Startup intro · News alerts · Background textures · Playtime unit fix',
    items: [
      '**Star ratings** — click stars at the top of the game preview to rate 1-5. Games rated 5⭐ get a subtle warm-gold gradient wash behind their name in the library. Rating is preview-only, never clutters the sidebar.',
      '**Sidebar reshuffle** — Settings moved next to Stats in the top TabPill row; cog-wheel button removed from the mid toolbar. Sliders renamed to **Visuals** (wider, more prominent pill).',
      '**Background textures** — 5 built-in patterns (Grain / Grid / Diagonal / Hex / Dots) with a transparency dial, both inside the Visuals popover. Adds subtle depth behind the library.',
      '**Startup intro** — 3-second synthwave logo reveal with a WebAudio-synthesized "hook" jingle on every boot. Skippable by clicking anywhere. Muted if UI sounds are off.',
      '**Watched-game news alerts** — for favorited (pinned) OR 5⭐-rated games, NEO-LIB polls news once per hour and pops a center-screen alert with soft chime when something new lands. Click outside to dismiss, or hit "Read news" to open the article.',
      '**"This Week" showcase now = most played** — regardless of the current showcase mode, the This Week bucket sorts by playtime desc so you always see what you\'re currently sinking hours into.',
      '**Hours badges on tiles** — This Week and This Month showcase tiles show a small gradient hours-played badge in the top-right corner.',
      '**Fixed:** playtime numbers. The `playtime` field is now consistently stored in **MINUTES** across the entire app. `formatPlaytime()` was interpreting values as seconds while everyone else stored minutes → wildly inflated readouts. Game-exit tracking also fixed to convert seconds → minutes on write.',
      '**Fixed:** News modal now dismisses on click-outside.',
      '**Fixed:** Category-dot toggle in Visuals now also affects the category header itself. When hidden, a colored backdrop stripe replaces the dot so the category identity signal stays visible.',
      '**Fixed:** Drag-and-drop reorder in Uncategorized. Now uses an explicit `__uncat__` sentinel in the drag-data so the reorder-vs-move check no longer relies on the null/empty-string edge case.',
      '**Compact theme picker** — grid tightened to 6/7 columns, tile ~50% smaller. Fits everything without scrolling.',
      '**Settings > Visual effects** — collapsed to a redirect hint; all controls now live in the sidebar Visuals popover, arranged in a compact CSS-columns masonry.',
    ],
  },
  {
    version: '1.3.1',
    title: 'Compact theme picker · Gradient theme swatches · Sidebar row reshuffle',
    items: [
      '**Compact theme picker** — the Settings > Theme grid is now a tight 4/5-column tile layout with icon-first swatches and labels below. Roughly half the vertical space, no info lost.',
      '**Gradient theme swatches** — each theme button now shows a real linear-gradient of the theme\'s surface + accent + accent-2 colors instead of a flat pink dot. Now you can eyeball each theme\'s mood before switching.',
      '**Sidebar row reshuffle** — the launcher filter row (All / Steam / Epic / EA / GOG / Other) moved **below** the Add / Wizard / Settings toolbar. Auto-sort and New category buttons joined the same row on the right side. One less strip of vertical space wasted.',
    ],
  },
  {
    version: '1.3.0',
    title: 'Theme park rebalanced · Real Steam playtime · Sub-cat toggle fixed',
    items: [
      '**Themes rebalanced — less pink, more variety.** Vaporwave Day → vivid purple + teal daylight canvas. Daybreak → deep teal on warm paper. Gaming → Twitch-style vivid purple + electric blue. Anime → sorcerer purple + electric blue + neon green (kept the JJK Gojo vibe). Synthwave & Colorful still have their signature pinks; the other five now cover purple, teal, blue, black, orange more evenly.',
      '**Real Steam playtime import** — Stats panel now reads `userdata/<steamid>/config/localconfig.vdf` on open and merges Playtime + LastPlayed for every appid, across every Steam account on the machine. Auto-runs on open (5-min cached), manual re-import button available.',
      '**Stats ranking now shows game icons** — Steam capsule / user cover / initials fallback beside every entry, plus per-client color dot and last-played date.',
      '**Sub-cat toggle bug fixed** — the "hide sub cat" switch also plumbs through the 2-column layout (`SectionWrap`) now, so it takes effect in every sidebar mode.',
      '**Non-Steam games no longer misattributed to Steam** — Stats client detection is now `source > appid > website > local`, so a manual itch game that accidentally picked up an appid won\'t get bucketed under Steam.',
      '**Colorful theme** — carbon-black base, blue balance behind the library, pink kept but no longer dominant.',
      '**Pro theme** — saturated hot-orange primary, marine-blue accent-2, darker gray surfaces.',
    ],
  },
  {
    version: '1.2.9',
    title: 'Stats tab · 2 Special themes · Text-size slider · Subcat toggle · 3 new sound packs',
    items: [
      '**New: Stats tab** in the top toolbar — shows every launcher/client you have imports from (Steam, GOG, itch, EA, Ubisoft, Epic, Battle.net…), your most-played ranking filtered by This week / month / year / all time, total hours, and a Link Discord button. Not a social profile — just numbers.',
      '**Two Special themes** — `Colorful` (pink / blue / carbon-black / textured-white with sparkles + shooting stars + bloom) and `Pro` (light/dark industrial grays with dark-orange edge glow, brushed-metal texture, and a subtle sweeping scanline). Both spawn 1.5× particles even at Medium.',
      '**Sidebar tint** — per-theme accent wash behind the library so contrast stays readable on light-font vs dark-font themes.',
      '**Text-size slider** independent of icon size — dial the game name font from 9 → 22px without changing the row height.',
      '**Sub-category strip toggle** — the "Action, RPG" genre badges under each game can now be turned off separately from the category dot.',
      '**News popup anchors next to News button** instead of the far right; opens in ~140ms with no darken/blur.',
      '**Three new sound packs** — `Crystal` (bell-like glass ping), `Cyberpunk` (glitchy square + noise burst), `Bubble` (soft plop).',
    ],
  },
  {
    version: '1.2.8',
    title: 'Tidy Up bug fix · Sliders portal · Every theme animated · Draggable news · 2-col Settings',
    items: [
      '**CRITICAL FIX** — Tidy Up "remove duplicates" no longer wipes out your Steam library. The over-eager Rule 3 (matched every game sharing `Steam\\steamapps\\common\\`) has been dropped; only same-exe and same-name rules remain. Clusters larger than 6 games are discarded as safety.',
      'Sliders popover is now **portaled to document.body** — always floats above the game preview instead of hiding behind screenshots. Also fully opaque so it reads clearly over any background.',
      '**Every theme now animates** — particles, sakura, edge glow all scale with the effects slider on synthwave, midnight, ocean, crimson, anime, mint, gaming and modern themes. Future themes automatically get particles too.',
      'The "Latest news" pill on selected games is now impossible to miss — animated border pulse, diagonal shimmer sweep every 5s, thicker 1.5px accent border, bigger blinking dot.',
      'News popup is now **draggable** by its header (grip cursor + drag from the title row). No backdrop overlay — clicks outside the popup work normally.',
      'Settings modal is now **2 columns** (masonry via CSS columns) — theme picker stays wide at the top, everything else tiles into a compact grid. No more endless scrolling.',
    ],
  },
  {
    version: '1.2.7',
    title: 'Category dot fixed · Effects moved · Time-bucketed showcase · Snappier news',
    items: [
      'Bug fix: Category dot toggle now hides BOTH the tiny dots next to game meta AND the colored circle next to each category header.',
      'Library settings popover z-bumped to z-[70] so it overlays the game preview instead of hiding behind screenshots.',
      'The Effects intensity slider moved from Settings → to the sidebar Sliders menu (where all the visual dials live).',
      'Effects levels beefed up dramatically: Max now spawns 64 particles, 88 sakura petals, drifting radial blobs, and a pulsing accent-color edge glow around the entire viewport.',
      'The "Latest news" pill on selected games is now full-width with a big blinking dot, LIVE label, gradient tint and a proper "Read full" button — click it or expand for the snippet.',
      'News popup is now snappier — slides in from the top-right in 140ms with NO dark backdrop and NO blur. Feels like a native notification tray.',
      'News tab now pulses with an unread badge when there are new items you haven\'t seen since last opening the tab.',
      'Showcase strip below the preview is now smaller and horizontally bucketed into **This week** (big tiles), **This month** (medium), and **Long ago** (compact icons with hover-tooltips) — so recent-first is spatially obvious.',
    ],
  },
  {
    version: '1.2.6',
    title: 'Live news pill · Ubisoft deals · Frosted panels · Per-theme effects · Toolbar refresh',
    items: [
      'New: every selected game now shows a small pulsing "Latest news" pill above its description. Click to expand a preview, click "Read full" to open the source.',
      'New: Deals bar now pulls **Ubisoft Store** offers alongside Steam, Epic, GOG, IG and Fanatical. Every deal card carries a platform badge (STEAM / EPIC / GOG / UBI / FAN / IG).',
      'Visual: primary panels (sidebar, About, gallery, showcase cards, deals bar) now use frosted glass — the animated theme background shows through, killing the "stack of opaque bricks" feel.',
      'Visual: Library / Tools / News tab bar redesigned as a proper toolbar — frosted band, bigger icons in rounded tiles, gradient underline separating it from the tree.',
      'Effects intensity slider now remembers a **different level per theme** — dial Synthwave to Max, Modern to Low, and NEO-LIB will restore each level when you swap themes.',
      'Small: extra breathing room between the About and gallery panels; softer inner highlights on all glass surfaces.',
    ],
  },
  {
    version: '1.2.5',
    title: 'Installer fix · Deals expanded · News as floating popup · Effects dial',
    items: [
      'Bug fix: Ticking "Run NEO-LIB after install" in the installer now actually launches the app. The flaky MUI finish-page checkbox was replaced with a robust custom NSIS hook that always fires post-install.',
      'Deals bar now pulls from **GOG** discounts (public catalog, up to 12 items at 40%+ off) and **Fanatical** star deal (covers many EA / Ubisoft titles).',
      'Platform badges — every deal card now shows a small colored badge (STEAM / EPIC / GOG / IG / FAN) on its image so you can see the source at a glance.',
      '"All N" pill is punchier — animated pulse, accent gradient background, flame icon. Impossible to miss.',
      'News is now a floating popup instead of a full pane — backdrop blurs and darkens the app, focus lands on the feed. Scrolls properly. Close with Esc / X / click-outside.',
      'New "Effects intensity" slider in Settings → Visual effects. Single dial, 5 stages: None → Low → Medium → High → Max. Scales particles, sakura, glow, and grid brightness together.',
      'Revenue linkage audit — all wrapped deal URLs route through Instant Gaming (direct 3% commission), Awin, or Skimlinks catch-all. Skimlinks JS is auto-injected on boot so every anchor click gets tracked.',
    ],
  },
  {
    version: '1.2.4',
    title: 'Build IDs, itch devlogs & GOG patch notes',
    items: [
      'New: Every Steam game card now shows "Updated N days ago · Build 12345 · X GB on disk" — read live from the local appmanifest_<appid>.acf file, cached 5 min.',
      'New: News tab now aggregates three sources: Steam announcements, itch.io devlog RSS, and GOG patch notes (from api.gog.com changelog).',
      'itch devlogs are pulled from <game>/devlog.rss for any game whose website is a *.itch.io page.',
      'GOG changelogs are date-parsed from the HTML blob; only sections with a valid date within the last 14 days are surfaced.',
      'Source badges + per-source feed counts + toggles for itch / GOG (added to the existing Official / Community / Third-party toggles).',
      'Footer note now counts games that have no Steam / itch / GOG source so users know what\'s left out.',
    ],
  },
  {
    version: '1.2.3',
    title: 'Steam News, live feed',
    items: [
      'New: The News tab is live — pulls announcements, patch notes and press coverage from Steam for every Steam game in your library.',
      'Only surfaces items from the last 14 days so the feed stays fresh (no ancient noise).',
      'Feed filter toggles — flip Official / Community / Third-party posts on or off; live counts next to each toggle.',
      'Per-item cards show the game capsule, "time ago" stamp, snippet preview, and open the post in your browser on click.',
      'Cached for 30 minutes in the Electron process; hit Refresh to force a re-fetch.',
      'Non-Steam games (GOG, itch, standalone) show a "coming soon" footer note — GOG / itch feeds are next.',
    ],
  },
  {
    version: '1.2.2',
    title: 'Fixes + Tidy up + News tab',
    items: [
      'Bug fix: Custom .exe picker in the Customize panel now actually saves the picked path (was silently no-oping due to a return-shape mismatch).',
      'Bug fix: "Category dot" toggle now really toggles just the dots — before it hid the whole meta line.',
      'Dynamic glow slider — smoother 0-300% range with a bright white core kick above ~120%. Max glow is now unmissable.',
      'Auto-scroll while dragging games — hover near the top or bottom of the tree and the sidebar scrolls with you.',
      'Refresh button is now a menu: Refresh (unchanged) + Tidy up (new).',
      'New: Tidy up — finds duplicate games (same exe, same normalized name, or multiple .exes sharing a folder tree) and shows them side-by-side so you can pick which one to keep.',
      'New: "News" tab (placeholder) — future home for Steam / GOG / itch patch notes on the last 14 days of your library.',
    ],
  },
  {
    version: '1.2.1',
    title: 'Community access',
    items: [
      'New "Discord" button in the title bar — one click to join the NEO-LIB community for bug reports, feature suggestions, and update news.',
      'Same Discord button mirrored in Settings → About so it\'s reachable from there too.',
    ],
  },
  {
    version: '1.2.0',
    title: 'Unified multi-source fetch picker',
    items: [
      'Brand new "Find metadata" picker — single window with editable query, big "Auto fetch" button, plus dedicated buttons for Steam, GOG, itch.io, DLsite, VNDB, Ryuugames, F95Zone, Google/DDG, and Ask AI.',
      'Smart query seeding — when you open the picker, NEO-LIB auto-fills the query from the exe name + parent folder (strips version tags, x64, repack noise).',
      'Results carousel — every source returns up to 8-10 candidates, browse left/right with arrows. "1 / 5" counter, preview card with cover + year + snippet.',
      'New F95Zone source (via DDG site-search) — finally findable adult-game threads.',
      'Re-fetch info on the game detail page now opens this picker (was Troubleshoot).',
      '"Try again" on the Accept preview also opens this picker — clean up unknown games quickly.',
    ],
  },
  {
    version: '1.1.9',
    title: 'CI fix: native Discord IPC',
    items: [
      'Build pipeline fix — replaced the discord-rpc npm package (whose Windows postinstall was breaking CI) with a native ~80-line IPC client using only Node\'s built-in net module. Zero new dependencies.',
      'Bumped CI runner to Node 22 to silence the Node 20 deprecation warning.',
      'No user-facing changes from v1.1.8 — same Customize button, same Discord status feature.',
    ],
  },
  {
    version: '1.1.8',
    title: 'Customize button + Discord status',
    items: [
      'New eye-catching "Customize" button on every game detail page — opens a single panel for custom cover, icon, hero, background, screenshots, description, and a custom .exe path or launch arguments.',
      'Discord Rich Presence — when you launch a game through NEO-LIB, your Discord status reads "Playing <game> · via NEO-LIB". Toggleable in Settings → App behaviour. Needs Discord desktop running.',
    ],
  },
  {
    version: '1.1.7',
    title: 'Themes, layout & window memory',
    items: [
      'Two new "Middle" themes — Gaming (dark blue + pink) and Modern (dark orange + light blue) — grouped in their own niche between Dark and Bright.',
      'Window now opens at 75% of your native screen by default and remembers any resize / move between sessions.',
      'New library slider: "Gap between header & first game" — pull games right under the category header or push them further away.',
      'Steam (and other launcher) popup no longer reappears once you already have games from that launcher imported — only NEW installs trigger a silent toast.',
    ],
  },
  {
    version: '1.1.6',
    title: 'Windows CI hardening',
    items: [
      'Build pipeline hardened: explicit Vite step, disabled code-signing on Windows runner, verbose electron-builder logs, and dist verification before zipping.',
      'No app behavior changes — purely a release-engineering fix so the .exe always reaches the Release page.',
    ],
  },
  {
    version: '1.1.5',
    title: 'UI polish & visibility',
    items: [
      'Current app version is now visible in the title bar (no need to dig into Settings).',
      'Update-available pill in the title bar gently pulses so you never miss a new release.',
      'Settings tooltips redesigned — bigger, white card with dark text, positioned below the cursor so it never overlaps your reading.',
      'Modal backdrop blur softened — opens feel less heavy.',
    ],
  },
  {
    version: '1.1.4',
    title: 'Tray mode + Featured banner',
    items: [
      'Close-to-tray — toggle in Settings → App behaviour. The X button hides NEO-LIB to the system tray (next to the clock) instead of quitting. Right-click the tray icon to fully quit.',
      'Featured deal banner — a slim sponsored card above the deals bar that rotates through Instant Gaming hot deals. Dismissible separately; re-enable in Settings → Deals.',
      'Steam-deal supply expanded earlier (15 entries, ≥20% off) carried over.',
    ],
  },
  {
    version: '1.1.3',
    title: 'More deals, still subtle',
    items: [
      'Instant Gaming hot deals now appear in the rotation — routes through your affiliate code (the paying source).',
      'Steam specials expanded from 8 to 15 entries, threshold lowered to 20% off.',
      'New "All N" pill in the deals bar — opens a tidy popover with every current deal at a glance. Hidden until you click it.',
    ],
  },
  {
    version: '1.1.2',
    title: 'What\u2019s new toast + small polish',
    items: [
      'New: this very modal — pops once after each update so you actually see what changed.',
      'Updated About copy and version badges across the app.',
    ],
  },
  {
    version: '1.1.1',
    title: 'Polish & QoL',
    items: [
      'Wizard Deep Scan toggle (Fast 5-deep / Deep 10-deep) — finds nested games Fast Scan missed.',
      'Selective metadata accept — pick exactly which fields (image, description, genres\u2026) replace existing ones.',
      'Drop a folder onto the window \u2192 Wizard auto-runs the scan, no extra click.',
      'Per-game ambient backdrop toggle (Settings \u2192 Visual effects).',
      'New bright "Mint Garden" theme; themes grouped Dark/Bright in Settings.',
      'Modal backdrop close is now double-click \u2014 no more accidental dismissals.',
      'UI sound effects are volume-normalized via a dynamics compressor.',
    ],
  },
  {
    version: '1.1.0',
    title: 'Major release',
    items: [
      'Accept-before-add metadata preview modal.',
      'Manual Edit Metadata form with local image pickers.',
      'Drag-drop .exe / .lnk / folders onto the app to add games.',
      'GitHub Releases auto-update pill in the title bar.',
      'Affiliate-tagged deals strip (Instant Gaming, Awin Humble/Fanatical/Superbox).',
    ],
  },
];

function getChangesSince(lastSeen) {
  // Return entries strictly newer than lastSeen. If lastSeen is empty/falsy
  // we return only the newest entry so the modal stays bite-sized.
  if (!lastSeen) return CHANGELOG.slice(0, 1);
  const idx = CHANGELOG.findIndex((c) => c.version === String(lastSeen).replace(/^v/i, ''));
  if (idx === -1) return CHANGELOG.slice(0, 1);
  return CHANGELOG.slice(0, idx);
}

export default function ChangelogModal({ open, currentVersion, lastSeenVersion, onClose, theme }) {
  const entries = React.useMemo(
    () => getChangesSince(lastSeenVersion),
    [lastSeenVersion]
  );
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[230] grid place-items-center bg-black/60 backdrop-blur-sm"
          onDoubleClick={onClose}
          data-testid="changelog-overlay"
        >
          <motion.div
            initial={{ y: 16, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 10, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
            className="relative w-[min(620px,94vw)] max-h-[85vh] overflow-hidden rounded-xl hairline glass shadow-2xl"
            data-testid="changelog-modal"
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-[rgb(var(--border))]/60">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-[rgb(var(--accent))]" />
                <h3 className="font-display font-bold tracking-[0.18em] text-sm uppercase">
                  What&apos;s new
                </h3>
                <span className="rounded-full px-2 py-0.5 text-[10px] hairline text-[rgb(var(--accent-2))] bg-[rgb(var(--accent-2)/0.08)]">
                  v{currentVersion}
                </span>
              </div>
              <button
                data-testid="changelog-close"
                onClick={onClose}
                className="grid h-7 w-7 place-items-center rounded text-muted hover:text-ink hover:bg-panel"
                title="Close"
              >
                <X size={14} />
              </button>
            </div>

            <div className="max-h-[60vh] space-y-5 overflow-y-auto px-5 py-4">
              {entries.map((entry) => (
                <section key={entry.version} data-testid={`changelog-entry-${entry.version}`}>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="font-display text-base font-bold text-ink">
                      v{entry.version}
                    </span>
                    <span className="text-[11px] text-muted">{entry.title}</span>
                  </div>
                  <ul className="space-y-1.5">
                    {entry.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-[12.5px] leading-relaxed text-ink/90">
                        <Check size={12} className="mt-1 shrink-0 text-[rgb(var(--accent))]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
              {entries.length === 0 && (
                <div className="py-6 text-center text-sm text-muted">
                  You&apos;re fully caught up.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-[rgb(var(--border))]/60 bg-panel/70 backdrop-blur px-5 py-3">
              {/* v1.5.0 — Rate this update: three emoji reactions fire to Discord */}
              <RateThisUpdate version={currentVersion} theme={theme} />
              <button
                data-testid="changelog-got-it"
                onClick={onClose}
                className="neon inline-flex items-center gap-1.5 rounded-full bg-[rgb(var(--accent))] px-5 py-1.5 text-xs font-bold text-[rgb(var(--surface))] hover:brightness-110"
              >
                Got it
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* v1.5.0 — 3-emoji reaction to fire from a changelog view. Once picked,
   swaps to a thank-you row. Never asks again for the same version. */
function RateThisUpdate({ version, theme }) {
  const [picked, setPicked] = React.useState(null);
  const [sending, setSending] = React.useState(false);
  const fire = async (reaction) => {
    if (sending || picked) return;
    setSending(true);
    setPicked(reaction);
    try { await sendChangelogReaction({ version, reaction, theme }); } catch { /* ignore */ }
    setSending(false);
  };
  if (picked) {
    return (
      <span className="text-[11px] text-muted inline-flex items-center gap-1.5" data-testid="rate-thanks">
        <span className="text-[14px]">{picked}</span> Thanks — noted!
      </span>
    );
  }
  return (
    <div className="flex items-center gap-2" data-testid="rate-this-update">
      <span className="text-[10.5px] uppercase tracking-wider text-muted">Rate this update</span>
      {['😍', '😐', '😕'].map((e) => (
        <button
          key={e}
          onClick={() => fire(e)}
          data-testid={`rate-${e}`}
          className="grid h-7 w-7 place-items-center rounded-full hairline text-[14px] transition-transform hover:scale-125 hover:border-[rgb(var(--accent)/0.6)] hover:bg-[rgb(var(--accent)/0.10)]"
          title={`Rate: ${e}`}
        >
          {e}
        </button>
      ))}
    </div>
  );
}
