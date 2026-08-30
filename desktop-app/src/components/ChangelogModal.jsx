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
    version: '1.7.3',
    title: 'PC Power-Up · smarter updates · a more helpful library',
    major: [
      {
        title: 'Meet Fungist, your NEO-LIB companion',
        body: 'Fungist is now properly alive without becoming a resource drain: a gentle docked hover, blink, smile, shocked, and sleep poses; soft sparkles for ordinary attention; a neon-trail flight and red firework halo for major PC attention; plus green/yellow/red status glows and a cheerful completion pose. Alerts now have sensible per-type cooldowns, a “Why am I seeing this?” explanation, and a real action-complete response. Right-click Fungist for a short Inbox of shown notices plus Quick Settings. Every reaction type—PC use, favourite news/updates, NEO-LIB updates, completion, and idle naps—can be turned on or off in Settings. His AI model is shown as Current in the same place, with a safe allow-list ready for more connected models later.',
      },
      {
        title: 'Optimize Center',
        body: 'A new animated Optimize action beside CPU/RAM gives you a clear Speed Up Gaming view: top CPU and memory users, GPU activity where Windows exposes it, and practical Game Mode, GPU scheduling, capture, power-plan, and restart guidance.',
      },
      {
        title: 'Safe Junk Review',
        body: 'Review temporary files, crash reports, logs, and forgotten nearby installers before anything changes. Every item opens its folder first, requires inspection and two confirmations, then moves safely to the Windows Recycle Bin.',
      },
      {
        title: 'Hardware & graphics in Tools',
        body: 'NEO-LIB can detect your graphics adapter on first launch and add GPU-Z, CPU-Z, plus the right NVIDIA, AMD, Intel, or Windows graphics shortcut. Missing utilities can be located or installed only after you choose to do so.',
      },
      {
        title: 'Smarter game updates',
        body: 'Update checks now warm in a light background queue after startup and launches. They combine trustworthy launcher data with bounded local version, readme, changelog, config, and Battle.net .build.info clues, then try known official pages and a small automatic web discovery pass before surfacing a verified newer release above Preview news.',
      },
      {
        title: 'A richer, more personal library',
        body: 'Meaningful play sessions can ask for a precise one-decimal rating, Preview news has more artwork, provider tags stay alongside broad genres, and NEO-LIB can rest even when a tracked game is started from its original launcher.',
      },
    ],
    fixes: [
      {
        title: 'Storage Control stays accurate',
        body: 'Shared install folders are measured once, launcher links are ignored, results remain when returning Home, and scans stay focused on configured game folders instead of whole drives.',
      },
      {
        title: 'Home and Library polish',
        body: 'The first game can sit neatly against the Library header, category Backdrops scale with label size, and a first-ever window opens at a comfortable 75% width by 90% height while later launches remember your size.',
      },
      {
        title: 'Cleaner visual choices',
        body: 'The new Mid Home theme joins refined Generic Gray, Generic Blue, Midnight, Industrial, Modern, Daybreak, and Mint Garden treatments. Friends is roomier and easier to read, too.',
      },
      {
        title: 'Safer in the background',
        body: 'Protected Windows and NEO-LIB processes cannot be closed from Optimize, no hidden system tweaks are applied, and Rest Mode never activates just because a launcher is idle.',
      },
      {
        title: 'NVIDIA and Visuals corrections',
        body: 'Store-installed NVIDIA Control Panel/NVIDIA App can now be found through Windows Start-app registration instead of falling back too early to Graphics Settings. The Home theme is calmer gray, and Category Backdrops now hug their text more closely as the size slider changes.',
      },
      {
        title: 'No more false “up to date” labels',
        body: 'A missing explicit latest version now remains “needs stronger evidence” rather than being silently recorded as current. The update card explains the automatic checks already attempted instead of asking you to manually fill every game page first.',
      },
      {
        title: 'Optimize Center stability and lighter monitoring',
        body: 'Safe Junk Review now completes once and holds its results instead of restarting after every summary update. The Game Ready footer samples on a calmer 15-second cadence, while the external-launch path probe runs every 30 seconds rather than repeatedly waking Windows management tools.',
      },
      {
        title: 'A larger Home and dependable AI fallback',
        body: 'Home now gives its news, artwork, titles, and spacing more room to breathe, with pane controls moved clear of headings. Gemini metadata now uses one current 2.5 Flash route with validated JSON, visible errors, and a Settings connection test instead of silent, inconsistent fallback calls.',
      },
      {
        title: 'New NEO-LIB icon, everywhere',
        body: 'The new neon power artwork now drives the app window, taskbar, installer, desktop and Start shortcuts. Windows uses one stable NEO-LIB identity and receives a safe Explorer refresh after upgrade, while the notification area gets its own crisp transparent mark instead of a blank fallback.',
      },
    ],
  },
  {
    version: '1.7.2',
    title: 'Released This Week · safer Steam matching · a cleaner Home and theme collection',
    items: [
      '**GPU setup assistant** — first desktop launch reads the ordinary Windows graphics-adapter list, then adds GPU-Z, CPU-Z, and a detected NVIDIA/AMD/Intel control-centre shortcut under Hardware & graphics in Tools. If a vendor centre is not installed locally, NEO-LIB uses Windows Graphics Settings instead; it never changes drivers, GPU settings, or the registry.**',
      '**Managed GPU-Z / CPU-Z** — a missing utility appears muted with Set up required. Select it for a compact Locate or Install menu. Locate validates the selected executable; Install begins only after your click, uses the official TechPowerUp/CPUID source, keeps GPU-Z portable inside NEO-LIB’s managed tools area, and opens CPU-Z’s visible official installer without silent flags.**',
      '**Optimize Center** — a new bottom-right Optimize action beside CPU/RAM opens two animated power-up tools and remembers their latest results. Speed Up Gaming shows top CPU/memory users, GPU activity and responsible programs when Windows exposes them, plus Game Mode, GPU scheduling, capture, power-plan, and restart checks with honest pros and trade-offs. Protected Windows/NEO-LIB processes cannot be closed, and settings open in Windows rather than receiving hidden tweaks.**',
      '**Safe Junk Review** — scan only known Windows temp/crash locations and folders beside configured games for reviewable caches, logs, dumps, and large old installers/archives. Every exact file links to its folder and must be marked inspected. Two confirmations are required before it moves to the Windows Recycle Bin; NEO-LIB never recursively deletes a folder or silently sweeps a drive.**',
      '**Post-play rating + Preview news art** — a meaningful session can gently request a precise one-decimal private rating, with snooze and never-ask choices. Preview news now uses the article image when supplied, then falls back to existing game hero, background, screenshot, or cover artwork.**',
      '**Rating System v2** — existing personal ratings reset once so the new one-decimal scale begins fairly. Stars now fill dynamically, so a 3.5 score is visibly three-and-a-half stars.**',
      '**Richer independent update checks** — Refresh now looks for an explicit local version in a game’s nearby Version / Changelog / Readme files, then safely compares it with an official public page or saved watch page. Games that lack enough evidence say exactly what is missing instead of being silently treated as up to date.**',
      '**Background update scan** — shortly after startup and when you launch a game, NEO-LIB safely warms update evidence for your eligible library in a small queue. It checks launcher manifests, saved versions, executable/folder clues, and bounded nearby Version / Changelog / Readme / Config files. A verified newer version now blinks in a dedicated preview bar directly above game news.**',
      '**Update checklist and precision pass** — conclusive checks are recorded locally as current, pending, available, or needs-evidence, so updated games naturally leave Home and Preview alerts. The Library’s first-game gap can now reach a clean zero, category Backdrops scale with label size, and a first-ever window opens at 75% width by 90% usable height while later launches retain your own size.**',
      '**External-launch Rest Mode** — NEO-LIB now rests for a tracked library game launched directly through Steam, Battle.net, Epic, or another client. It matches only ordinary Windows process paths against your local library, never assumes an idle launcher is a game, and never injects, overlays, reads game memory, or accesses launcher credentials.**',
      '**Fixed: Storage Control** — non-file launcher targets no longer point several entries at the same working folder. Shared install folders are measured once, completed results remain when returning to Home, and up to three configured game folders are measured at a time. NEO-LIB never scans an entire drive.**',
      '**New Mid theme: Home** — a welcoming light-gray workspace with crisp black and white structure, light-blue edge lighting/effects, and a softly layered warm-yellow/gray comfort pattern.**',
      '**New quick-start tutorial + hover help** — first run now gives a brief, current path through importing, Hidden privacy, Home, game controls, customization, and Rest Mode. Hold over described controls for one second to see a clear, theme-aware explanation.**',
      '**Battle.net metadata enrichment** — known Blizzard titles use their official public Battle.net product page before generic metadata sources, improving descriptions, artwork, and direct game tags without account access.**',
      '**More useful game identity** — the preview now retains direct provider tags such as Third-Person Shooter, Action Roguelike, Co-op, and Multiplayer alongside the broad core genre.**',
      '**Home interaction pass** — Top 5 Played is now a fixed centred Home feature with hide/restore support; Library Health is an independent detailed panel; and Home pane reordering previews the live landing position with an active glow, dimmed neighbours, and an insertion line.**',
      '**Recommendation and Friends polish** — What should I play? now gives larger cards and clearer personal reasons. Friends is roomier, easier to read, and slightly more solid against the current theme. Generic Gray and Generic Blue now live in Mid, with a lighter Generic Blue.**',
      '**Released This Week** — Home now has a dedicated, rearrangeable pane for notable games launched in the past seven days. Each card shows artwork, title, Steam source, official release date, and a clear reason it earned its place.',
      '**A quality filter instead of a release dump** — NEO-LIB verifies the actual store release date and only includes full games showing meaningful early player, review, or launch-reach signals. Small low-visibility uploads are intentionally excluded.',
      '**Transparent and refreshable** — the pane explains the inclusion criteria, uses a six-hour cache to stay light on services, and offers a manual Refresh button. Selecting a title opens its official store page; NEO-LIB never accesses an account for this feed.',
      '**Fixed: delisted Steam games cannot be fuzzy-replaced.** Steam imports now use their exact local Steam app ID as the source of truth. If a game is still in your library but no longer appears in public Store search, NEO-LIB preserves Steam’s manifest title and ID instead of attaching an unrelated match.',
      '**Home cleanup** — My Best Games is now your top five by personal rating, with decimal ratings available from the preview stars. Library Health is a compact, clickable status blob; Top 5 is clearly labelled as playtime; Recent Sessions is chronological; and the expanded, scrollable Gaming Chronicle better tells your library story.',
      '**Theme cleanup** — added the neutral Special themes Generic Gray and Generic Blue. Midnight is now moonlit navy with sharp star-yellow highlights; Industrial leans into danger yellow and neon orange; Modern becomes graphite, blue, white, and restrained dark red; Daybreak becomes a warm sunrise while Mint Garden remains green and organic. Coffee now stays readable in every light theme.',
      '**Shell polish** — Friends moves to the far right of the permanent sponsor rail, while Tools keeps its useful name but now uses a clear utilities icon rather than a settings-like wrench.',
      '**Genre Intelligence — foundation** — refreshed metadata now builds a separate, exact-match profile for core genres, subgenres, playstyle, perspective, and themes while retaining raw provider data. Steam can combine official categories with cached, rate-limited community tags. Auto-sort now recommends at most six evidence-backed collections and never scans descriptions for loose genre words. Your own Library categories are never touched.',
      '**Review what is new** — add-from-match and metadata refresh now show the approval popup before writing. Freshly detected fields, including the structured game identity, are green and labelled **NEW**. Genres controls whether that identity is applied.',
      '**Wizard identity review** — every folder-scan match now shows the detected core genres, subgenres, playstyle, perspective, and themes in a green **NEW** panel before you accept it. This saves the identity data only; your Library categories stay yours.',
      '**Preview-pane refinement** — genres now have their own theme-responsive vertical identity card. Supporting actions are a tidy menu beside Launch, while developer, publisher, release, score, and website are presented as a calm game-details list.',
      '**Released This Week fallback** — major releases always take priority. On a quiet week with no qualifying major launch, Home now shows clearly-labelled, verified semi-major releases instead of an empty pane.',
      '**Library identity repair queue** — Tidy Up now walks through every game with no identity, tracks repaired/skipped progress, and finds clickable title clues from the EXE, nearby folders, and bounded README title fields. Every match still goes through the green **NEW** approval screen before saving.',
      '**Update Intelligence · Steam foundation** — Home and the selected-game preview now show concrete pending Steam downloads and remaining size from the local launcher manifest. Open Steam Downloads with one click; NEO-LIB never alters the queue or guesses from ambiguous state flags.',
      '**Independent-game update watch** — Customize can now remember an installed version and a public official, itch.io, or forum update page. Only explicit higher Version/Build/vX.Y labels trigger an alert, and NEO-LIB links to the source without downloading or installing anything.',
      '**In-app patch history** — independent-game alerts now open a read-only version timeline inside NEO-LIB, including detected dates and clear “After yours” markers, before handing off to the full chosen source.',
      '**Native GOG import** — the Wizard now discovers installed GOG games through their Windows registry records, finds a bounded likely game executable, preserves the GOG ID, and creates the correct launcher category without signing into an account.',
      '**Native EA/Origin import** — the Wizard now reads installed EA App and legacy Origin game records locally, preserves product/version identity, selects a bounded likely executable, deduplicates results, and creates the proper EA category.',
      '**Native Ubisoft Connect import** — the Wizard now reads Ubisoft’s local installed-game records, preserves product identity and native launch routing, uses bounded executable discovery, and creates the proper Ubisoft category.',
      '**Native Battle.net import** — the Wizard now reads verified Blizzard installation records, excludes the Battle.net desktop client, preserves product/version identity, uses bounded executable discovery, and creates the proper Battle.net category.',
      '**Native Riot import** — the Wizard now reads Riot’s bounded local product metadata, excludes the Riot Client itself, preserves product/version and configured executable identity, deduplicates results, and creates the Riot category.',
      '**Native Xbox/Game Pass import** — the Wizard now reads bounded XboxGames installation roots and each title’s MicrosoftGame.config, preserving Store/configured-executable identity and creating the Xbox category without sweeping unrelated Store apps.',
      '**Native Rockstar import** — the Wizard now reads verified Rockstar installation records, excludes the launcher, Social Club, and support components, preserves product/version identity, and creates the Rockstar category.',
      '**Native itch.io import** — the Wizard can now read only the install locations configured by the itch desktop app and recognise completed games through their own receipt marker. It never opens itch’s live catalog database, copies credentials, or scans unrelated folders; folder-derived names still go through the normal approval-first metadata flow.',
      '**Launcher import path audit** — first-time detection and the Wizard now route every supported launcher through its real adapter, preserve its own source/product/version fields, and prefer the adapter’s verified game executable instead of a generic install folder.',
      '**Launcher identity stays honest** — Home and launcher filters now cover every supported client and use the actual launcher field, so a standalone or repack game cannot become “Steam” merely because Steam supplied its artwork or metadata.',
      '**One-click dismissal** — standard dialogs, metadata review, Customize, Tidy Up, the source picker, and What’s New now close with one click on the dimmed area outside them; Escape and close buttons still work.',
    ],
  },
  {
    version: '1.7.1',
    title: 'Home intelligence — safe save backups, play suggestions, storage, and your Chronicle',
    items: [
      '**Library Health** — Home now gives your library a colour-coded health score with a visual progress bar, highlighting missing art, missing details, missing launch targets, and possible duplicate names. Review issues opens Tidy Up directly.',
      '**More visual Home** — news cards are larger and easier to read, use Steam game artwork where available, and Top 5 now includes game cover art alongside platform and playtime.',
      '**Arrange Home your way** — drag each Home pane by its left grip to reorder it. The hover control hides a pane, and the Home header lists hidden panes so you can restore them later. News now opens in NEO-LIB first with a clear “Read full story” link, and My Best Games shows your top ten personal ratings alongside Metacritic where available.',
      '**Cleaner library shell** — Friends now lives as a substantial button at the bottom of a selected game’s preview pane. Coffee joins Discord in the title bar; Settings follows Visuals in Library controls; Refresh/Tidy is grouped with Auto-sort; and the sponsored rail is centred, permanent, slightly taller, and no longer overlaps or duplicates Coffee.',
      '**Smarter Game Ready thresholds** — yellow now starts at 65% usage and red at 85%, avoiding warnings caused by normal desktop multitasking. The Library scroll area also reserves space so its last games are never trapped behind the footer.',
      '**Rest Mode while gaming** — enabled by default for games launched through NEO-LIB. While the game is open, NEO-LIB pauses ambience, animations, UI sounds, local health polling, launcher scans, news/deal checks, and social refreshes. The Game Ready footer changes to “NEO-LIB RESTING” with the game name, then everything resumes automatically when it closes. You can turn this off in Settings.',
      '**Save Game Folder** — every game now has a Save games button and a right-click shortcut. Pick its save folder, open it, search a chosen drive or folder for possible older save locations, and review every result before selecting it.',
      '**Safe local save backups** — create backups inside NEO-LIB\'s own app-data folder and view their date, file count, size, and location. Recovery never overwrites a non-empty live save folder: it stops and offers a separate “NEOLIB Restored” folder for manual review instead.',
      '**What should I play?** — Home now surfaces timely, personal reasons to return: a game with fresh patch notes, a highly rated game you have not touched in a while, or an unplayed recent addition.',
      '**Storage Control Centre** — a user-triggered, read-only Home scan measures installed game folders and recognised mod folders, then highlights the biggest games. NEO-LIB never silently crawls your drives.',
      '**Gaming Chronicle** — Home now keeps a private timeline of games added, played, rated, and updated. It is built from your local library, not a social feed.',
      '**Launch Doctor** — after two immediate failures or very short launches within ten minutes, NEO-LIB opens a guided diagnostic. It checks the configured executable, lists plausible nearby executables for review, and explains what to check; it never changes files automatically or guesses that antivirus is at fault.',
      '**More distinct theme ambience** — the shared floating sparkle layer is now reinterpreted per theme: Midnight star dust, Ocean bubbles, Crimson embers, Gaming pixels, Mint pollen, Daybreak rays, Anime ink flecks, Modern dust, Colorful prism motes, and Industrial metal sparks. All still obey each theme’s Effects intensity dial.',
      '**Three new sound chimes** — Aurora (soft northern-light chord), Ember (warm bell), and Harbor (gentle sonar chime) join the selectable sound packs in Settings.',
      '**Three new Visuals textures** — Weave, Brushed, and Stardust extend the library background texture collection. Brushed replaces the earlier Topography tile with a seamless material finish.',
      '**Theme polish** — Anime now has an original manga line-art character in its distant background and a pink-forward/violet palette. Pro is now **Industrial**: graphite, safety yellow, burnt orange, moving safety lights and metal sparks, with no CRT scanlines.',
      '**Fixed: Category marker None** — selecting None now removes both the dot and the coloured backdrop, leaving the category text cleanly on its own.',
      '**Fixed: Library Health review** — health now recognises descriptions from every metadata field and Review issues lists the affected games (missing details, art, or launch target) instead of opening an empty duplicate-only screen.',
      '**Automatic common-save check** — opening Save Game Folder now safely checks standard Documents, Saved Games, AppData, game-folder, and Steam Cloud mirror locations. It never guesses or changes your live folder; you choose any detected candidate yourself.',
      '**Cleaner Visuals controls** — the popover is now grouped into Object sizes, Text & category, FX, and Layout. Quick presets are gone so custom tuning stays in control. Icon position is a Left / Right / None slider; category marker is a Dot / Backdrop / None slider. Backdrop strength scales with Category glow, topping out at a translucent 65%.',
    ],
  },
  {
    version: '1.7.0',
    title: 'Friends Hub — your game clients, one elegant launch point',
    items: [
      '**Friends Hub in the title bar** — a compact, theme-aware Friends button opens a frosted-glass panel from the top-right of NEO-LIB.',
      '**Live launcher status** — see whether Steam, Battle.net, Epic, EA app, and Ubisoft Connect are running, refreshed safely in the background.',
      '**Reliable setup and recovery** — Friends scans when you open it and now distinguishes Running, Installed but not running, Not detected, and a saved path that needs attention. You can rescan at any time or locate a custom client executable once; NEO-LIB remembers that local choice.',
      '**Theme artwork pass** — Anime now has an original, transparent manga-inspired illustration layer (moon, shrine gate, distant city and speed-line panels) behind the UI. Gaming gains a soft esports-arena backdrop, while Modern gets calm editorial geometry and grain. All three respect the existing per-theme Effects intensity setting.',
      '**Every theme now has its own illustrated signature** — Synthwave gets a sun and mountain horizon, Vaporwave Day gets clouds and palms, Midnight has constellations, Ocean a jellyfish, Crimson a thorned rose, Mint botanical branches, Daybreak architecture, Colorful stars, and Pro industrial geometry. Every layer stays in the distant background and is original artwork.',
      '**Cleaner navigation and creation controls** — Settings, feedback, and Discord now sit neatly beside the version in the title bar, freeing the Library / Tools / News / Stats tabs to stay readable. The sidebar now uses one compact `+ Add` menu with Add game and Add category choices.',
      '**Responsive sidebar labels** — navigation and action labels now shrink smoothly as the library sidebar narrows, collapse fully to icons before becoming unreadable, and scale back in as you expand it.',
      '**Game Ready footer** — the Library now has a full-width, bottom-edge status overlay. It keeps game rows behind its glass surface, shows CPU and RAM health at a glance, pulses amber/red for warnings, and expands upward with local tips when clicked. It reflows taller on narrow windows rather than cutting text off.',
      '**Home Hub replaces floating News and Stats** — Home now owns the full right pane when no game is selected, with a date-sorted, scrollable News rail; Today / This week / This month activity filters; warm play summaries; Top 5; and cover-led recent activity showing platform, last-played date, and added date. Selecting a game always returns to its normal detail page.',
      '**Playtime lives in Home now** — Sync hours opens the full Steam import preview from the Home activity card. Top 5 also has an All time view that ranks every platform together by tracked playtime.',
      '**Quieter bottom deck** — the multi-bucket activity deck and large featured banner are gone. Deals now use one compact, clearly-labelled sponsored footer rail; its All deals button still opens the full list.',
      '**Safe native handoff** — each platform has an Open action that hands you back to its own client. NEO-LIB does not read credentials, cookies, friend lists, or private chats.',
      '**Ready for future approved integrations** — the panel is a privacy-first social launcher; any future friend-presence integration must be official and opt-in.',
    ],
  },
  {
    version: '1.6.6',
    title: 'Feedback finally works in the compiled .exe — via a signed Cloudflare Worker relay',
    items: [
      '**Cloudflare Worker relay shipped AND deployed** (`desktop-app/cloudflare-relay/`) — live at `neo-lib-feedback-relay.kennethnordsveen.workers.dev`. The shipped `.exe` no longer needs a Discord webhook baked in at all — the app POSTs a HMAC-SHA256-signed payload to the Worker, which holds the real webhook as a server-side secret, rate-limits to 8 requests/hour/IP, and reshapes every payload before forwarding. Even a fully decompiled binary only yields the relay URL + a signing key, never posting power over the channel directly. End-to-end tested: signed request → Discord 204, bad/missing signature → 401.',
      '**`FeedbackModal.jsx`** now prefers `VITE_FEEDBACK_RELAY_URL` + `VITE_FEEDBACK_RELAY_KEY`; the old `VITE_FEEDBACK_WEBHOOK_URL` direct-POST path is kept only as a local-dev convenience fallback.',
      '**CI (`build-windows.yml`)** now writes the relay URL + key (from `NEOLIB_FEEDBACK_RELAY_URL` / `NEOLIB_FEEDBACK_RELAY_KEY` GitHub secrets) into `.env` right before the Vite renderer build, so every CI-built `.exe` ships with a working feedback button. See `cloudflare-relay/README.md` for one-time setup.',
    ],
  },
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
          onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.(); }}
          data-testid="changelog-overlay"
        >
          <motion.div
            initial={{ y: 16, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 10, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
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
                  {(() => {
                    const sections = entry.major || entry.fixes
                      ? [
                          { title: 'Major changes & new features', items: entry.major || [] },
                          { title: 'Fixes, adjustments & polish', items: entry.fixes || [] },
                        ].filter((section) => section.items.length > 0)
                      : [{ title: null, items: entry.items || [] }];

                    return sections.map((section) => (
                      <div key={section.title || 'changes'} className="mb-4 last:mb-0">
                        {section.title && (
                          <h4 className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[rgb(var(--accent-2))]">
                            {section.title}
                          </h4>
                        )}
                        <ul className="space-y-2">
                          {section.items.map((item, i) => {
                            const structured = typeof item === 'object';
                            return (
                              <li key={i} className="flex items-start gap-2 text-[12.5px] leading-relaxed text-ink/90">
                                <Check size={12} className="mt-1 shrink-0 text-[rgb(var(--accent))]" />
                                {structured ? (
                                  <span><strong className="text-ink">{item.title}</strong> — {item.body}</span>
                                ) : <span>{item}</span>}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ));
                  })()}
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
