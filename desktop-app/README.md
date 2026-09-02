# NEO-LIB

> A synthwave-flavored, portable Windows game library — scans your launchers,
> fetches metadata from Steam / Epic / GOG, surfaces hand-picked deals, and
> stays out of your way.

![version](https://img.shields.io/badge/version-v1.7.4-8a4fff) ![status](https://img.shields.io/badge/status-testing-f59e0b) ![platform](https://img.shields.io/badge/platform-Windows%20x64-9b5cff) ![license](https://img.shields.io/badge/license-Proprietary-1a1a2e)

### Latest — v1.7.4 (Startup Safety Recovery — testing candidate)

#### Major changes & new features

- **Recovered Settings + bigger Preview imagery** — Settings returns to its established shared modal layout after a Settings-specific sizing route could leave a blank gray shell. A Settings-only recovery layer prevents future settings-control errors from blanking NEO-LIB and offers a safe return plus a bug report. Preview’s desktop media gallery is now roughly twice the previous visual area, leaving game details readable beside richer source-owned images. If Fungist cannot reach AI, he now points plainly to top-bar Feedback and offers a direct **Report a bug** action.
- **Game Identity belongs with the story** — genre, subgenre, and gameplay tags return to the top-right inside About this game. Description prose has its own strict column, so it ends before tags begin instead of flowing behind or beneath them; the image column stays reserved for larger game artwork.
- **Feedback has a player-safe fallback** — a build without the optional Discord relay opens a prefilled GitHub issue rather than showing developer environment-variable instructions.
- **Intentional workspace defaults** — Home stays Home. Library restores your last-played game (or first game), Tools restores your last utility (or says **Add programs first**), and Wall remains a dedicated cover view until you choose a tile.
- **Wall 9×9 / 10×10** — Wall now adds two denser layout steps, centered landscape cards, and a wide header/capsule-art preference for sharper source images. Private games remain excluded.
- **Readable Library rows + New marker** — single and two-column Library rows now use a compact bordered nameplate at the bottom of the information block, allowing long game names to wrap rather than disappear. A small **New** tag appears only on newly added games and clears when that specific game is deliberately opened from the Library into Preview.
- **Launchers shortcut, not a social layer** — the former Friends control is now called **Launchers**. It gives one-click access to detected Steam, Battle.net, Epic, EA app, and Ubisoft Connect clients, while keeping all account, friend, and chat data completely outside NEO-LIB.
- **Category-arrow scale** — the expand/collapse arrow now uses the same dynamic size as category text, with a proportional click target around it.
- **Readable Private unlock** — a locked shelf now has a direct **Unlock {category} ({count})** action without exposing protected game rows.
- **Fungist joins the interaction** — opening chat lifts Fungist above the conversation in a ready pose; a confirmed launch sends him toward the Launch button for a short cheer before Rest Mode. The local voice palette now totals 27 supplied clips, with mapped chat, completion, update, support, and hand-off moments plus Settings previews.
- **Visible theme environments** — theme artwork now has a stronger normal-FX presence while staying behind all controls and fully absent in Rest Mode.
- **A centered Preview** — Preview uses one more-solid centered reading block with a compact source-owned carousel capped at two curated images. Description prose stays uninterrupted instead of being split by a long screenshot parade.
- **Categories control centre** — the new **Categories** menu provides a clear shelf On/Off switch and a simple manager for adding, editing, and removing collections. Removing a category keeps every game safely in NEO-LIB and returns it to Uncategorized; a guarded bulk action removes regular categories together while Private categories remain protected.
- **Reliable deliberate launching** — a real press on the visible Launch button is now captured by NEO-LIB’s isolated native bridge before it can create its one-time authorization. This retains the startup bulk-launch protection without depending on a fragile window-level input timestamp, and a rejected press shows a clear reason instead of failing silently.
- **More alive, still lightweight** — Fungist now has a polished 3D-rendered pose family for idle, blink, important alert flight, sleep, and completion, plus sparse curiosity, stretch, smile, and sparkle moments built from local pose art and transforms. This adds no GIF/video decoder, canvas, or background polling. Balanced visual motion is smooth rather than stepped and lowers expensive particles, bloom, blur, and ambient layers; Calm lowers them further.
- **Bigger, more fluid Fungist** — the docked companion is larger, has a smoother resting motion, more frequent irregular blinks, and more often shows small smile, curiosity, stretch, sparkle, or greeting gestures. These stay lightweight transform/pose animations and still stop in Rest Mode.
- **Fungist voice palette** — all supplied clips are packaged locally and assigned to specific welcome/tutorial, favourite news/update, NEO-LIB update, PC-attention, game-launch, guided-action, completion, and chat-acknowledgement moments. The independent voice switch, volume slider, and preview map live in Settings. Shared event cooldowns prevent chatter; UI Sounds, No Sound, and Rest Mode always silence the voice.
- **Visible Fungist speech** — every real Fungist voice line now has an exact speech bubble and matching happy, thoughtful, concerned, urgent, or celebratory delivery. It covers alerts, chat, completion, launch, support, Settings previews, and tutorial lines, so the companion never speaks only as background audio.
- **Living library companion** — Fungist is now a transparent character overlay rather than a circular profile pod, with a responsive neon ground pad, aura, hover sparkles, and action FX. Manual AI messages share only a compact visible-library summary of names/tags/ratings/playtime for tailored recommendations; no paths, saves, accounts, processes, or locked Private games are included. Local launch commands such as `Launch Forza 5` and `Launch a random action game` resolve a game first, then require a named guarded confirmation before launch.
- **Opaque pose changes** — Fungist now remains fully visible through blink, speech, smile, sleep, and celebration swaps; the previous half-transparent entrance fade is removed.
- **Aligned ground FX** — Fungist’s pulsing ground glow is now centred separately from its animation, so it remains directly beneath the character.
- **Wall route repair** — selecting Wall now stays in the cover grid instead of being immediately reset to Preview by the normal Library route.
- **Calmer theme samples** — Settings theme bars now use one restrained 48-second colour drift rather than fast attention-grabbing motion.
- **Compact theme-tile standard** — every Settings theme tile now shares one fixed, label-safe width rather than stretching across the full settings window.
- **Mascot quiet mode with recovery guidance** — turning off **Show NEO-LIB mascot** mutes every Fungist voice line too. Settings tells you exactly where to restore him later and remembers your voice preference for when he returns.
- **A distinct Library atmosphere** — the left Library pane gets a deliberately faint copy of the current theme artwork plus its accent wash. It stays quieter than Home, follows the FX level, and is absent in Rest Mode.
- **Proper 2D Anime artwork** — Anime now uses an original fully rendered moonlit shrine-and-cherry-blossom environment with a calm UI-safe centre. The earlier SVG/manga outline layer is gone; only the finished illustration and petals remain.
- **Special-theme decoration control** — Anime now joins Industrial and the renamed **Magical** theme under Special. One Settings slider controls their optional, subtle edge decoration: cherry petals, machinery cogs/rivets, or spell arcs and sparkles. At 0%, each stays a clean colour-only theme.
- **Rest Mode reassurance in Optimize** — NEO-LIB now explains its own presence in the performance snapshot: while you browse it can appear in the list, but launching a tracked game pauses its effects, animations, sound, monitoring, launcher/news/social checks, and other non-essential work. Players do not need to close it just because it appears there.
- **Windows-aware Optimize routes** — Speed Up Gaming identifies Windows 10 or 11 with the installed release/build, shows the matching Settings path for each recommendation, and opens the real Game Mode, advanced graphics, Capture/Game DVR, or power page. Background capture no longer points at a generic gaming destination, and older builds are clearly told when GPU scheduling is unavailable.
- **Working Steam update cards** — clicking a pending Steam update in Preview or Home now opens Steam’s Downloads page through a fixed native action. It is not a game-launch path; an unsupported future launcher queue reports a visible explanation rather than failing silently.
- **Library-hugging Preview gallery** — Library title backplates are removed for cleaner rows. Preview now anchors to the Library side, keeps readable details left, and gives up to eight verified game headers, backgrounds, covers, and screenshots their own right-side gallery.
- **Content-sized Settings** — Settings uses a compact cap built around its four slim theme columns rather than becoming a wide desktop sheet, while retaining its safe small-window clamp and drag bounds.
- **Special-theme control decoration** — Anime’s blossom vines/leaves, Industrial’s bolted hazard rails/rivets, and Magical’s rune arcs/star dust now reach navigation and game controls as well as the background. They are pointer-safe, slider-controlled, and fully absent at FX 0 or in Rest Mode.
- **A safe welcome after boot** — only after the visual intro has fully left, Fungist gives one friendly raised-hand welcome with a brief larger motion before returning to his dock. It is renderer-only: no game start, update scan, external link, or launcher route is involved, and real alerts take priority.
- **Startup and window boundaries** — intro timing is now one-shot, so normal renderer updates cannot restart it and strand the final frame. Tutorial waits until intro exit, while Fungist’s greeting waits until tutorial close. Tutorial, core draggable panels, metadata windows, News, Stats, Visuals, and category menus clamp to the visible app and scroll internally on smaller windows. Legacy retired FX flags cannot silently hide the current Effects/particle system.
- **A smarter, calmer Library** — category headers now have an unmistakable solid expand/collapse arrow. Sort keeps your custom order or sorts the visible category / Flat List by Alphabetical, Date Added, My Rating, Most Played, or Last Played. The top-pane **Wall** mode removes the permanent Preview, presents a 3×3–10×10 cover-and-name grid, and opens Preview only after a tile click. Locked Private games remain hidden.

- **Root startup trigger removed** — the background update checker no longer appends a library EXE path after PowerShell’s command switch while reading Windows version information. Paths are now inert process data consumed by one fixed encoded reader, so an inspected game cannot be interpreted as a command.
- **Deliberate launch handshake** — only the real Launch button can mint the very short-lived native authorization needed to start a game. Boot-time or background calls cannot launch one.
- **Launch audit trail** — NEO-LIB records startup and every allowed or blocked game-launch request locally for a clear support audit.
- **Build-time safety gate** — packaging first checks the encoded version reader, inert EXE-path binding, guarded preload route, native authorization, and real Launch-button handshake. A regression stops the build instead of reaching a player.

#### Fixes, adjustments & polish

- **Cleaner source tree** — generated build logs and one unreferenced duplicate mascot sleep asset are removed, while active mascot artwork, voice clips, theme art, and build-safety scripts remain included in release source.
- **Cleaner Mascot sound settings** — the redundant Fungist synthesized-soundscape preview is gone. Global UI Sounds remain separate; Fungist voice now has one focused toggle, volume, and line-preview treatment.
- **Launcher update trust restored** — a current Steam manifest is final for its launcher-owned install, so a weak public patch-page match can no longer create a second false update warning. Other supported launcher imports are explicitly recorded as launcher-managed until their own safe pending-download adapter is available; that is an honest diagnostic state, never an alert. Standalone/repack games keep their independent local-versus-public check even if their metadata came from Steam.
- **Per-game update evidence, never a leaked result** — Home and Preview now cache only the exact game request, so a library scan cannot show one game’s update in another Preview. Bounded local version/config/manifest reads are broader, official/saved sources outrank generic web discovery, the evidence route is recorded, and Home can target only unresolved games with **Resolve checks**. A blocked or unreachable public source stays visible as missing evidence instead of being quietly treated as clean.
- **Balanced game tags** — NEO-LIB now limits the preview to useful gameplay tags, filters storefront-only noise such as Steam Cloud and Trading Cards, and fills sparse non-Steam entries from their already-confirmed genre profile. It never invents source data or changes Library categories.
- **Stable Home update results** — opening an update in Game Preview no longer clears Home’s update list on return. NEO-LIB keeps the last completed detection result and only replaces it after a newer completed check.
- **Aligned Settings switches** — toggle controls now stay on a consistent right-side rail even when labels wrap.
- **Calmer dark surfaces** — Synthwave, Midnight, Ocean, Crimson, Anime, Magical, and Industrial retain their existing accent colours while their near-black base/box surfaces become restrained charcoal, navy, graphite, or wine-gray layers for easier long-session viewing.
- **Tutorial Preview stability + title-bar unity** — tutorial navigation no longer replays the Preview destination after each settings save, preventing flicker during the Preview step. Feedback, Discord, and Coffee now use one restrained, theme-aware title-bar action style.

- **Startup update scan isolated** — automatic library and Home update checks wait 35 seconds; executable-resource inspection independently sleeps for the first 30 seconds, never receives a path as PowerShell command text, and overlapping warm-up requests share one scan.
- **Confirmation-first launcher imports** — every launcher import is now deliberate: confirm before scanning, then receive a second clear comparison when entries were previously imported. Only the new entries are offered; existing records remain untouched. Launcher detection opens the same Wizard instead of silently importing in the background.
- **Theme contrast hardening** — NEO-LIB now separates decorative accent colour from readable accent text where a bright/light theme needs it. Vaporwave Day, Daybreak, Mint, Modern, and Home retain their visual identity while small labels, coloured status copy, and Home’s blue/gold information text get a dependable dark edge and contrast-safe companion colour.
- **Home theme rebuilt** — normal neutral copy is now clean and unoutlined. The theme uses a calm medium-gray room with darker slate surfaces, light-gray regular text, and blue/gold held back for clear signals, glows, and FX. Only coloured signal text keeps a soft dark edge.
- **Quiet artwork for the newest themes** — Home, Generic Gray, and Generic Blue now place original low-contrast atmosphere art behind their interface. It remains subdued beneath readable content, responds to FX intensity, uses only a gentle transform drift outside Calm motion, and is absent in Rest Mode.
- **Every theme gets its own environment** — Home/Generics, Midnight, Industrial, Anime, Daybreak, Mint, Ocean, Crimson, Synthwave, Vaporwave Day, Gaming, Modern, and Colorful each now have distinct original atmosphere art. It remains low-contrast behind content, follows FX intensity, and stops with Calm/Rest Mode.
- **Mascot / Rest Mode recovery** — launcher scans no longer select converters, assistants, importers, editors, benchmarks, diagnostics, or other utilities as the game EXE. Existing launcher games with one of those legacy targets are repaired from their stable launcher identity, while Rest Mode ignores the helper immediately instead of hiding Fungist.
- **Preview reading polish** — game descriptions now live in a calm editorial card. Longer verified descriptions use the game’s own already-fetched screenshots as optional visual breaks; NEO-LIB does not invent imagery or run a random image search.
- **Deliberate metadata maintenance** — the Refresh menu now offers a targeted missing/older-metadata pass and a separately confirmed full refresh. Both show the affected count, protect manual edits, and display compact live progress; Tidy Up stays a distinct diagnosis tool.
- **Approval-first Auto-sort** — Auto-sort proposes at most four precise shelves after three direct matches, shows every game assignment, supports shelf opt-in/out and per-game exclusion, lets you select individual unknown games for enrichment, deliberately reuse a matching category or create a separate `Auto · …` shelf, limits each game to two new shelves, and can undo the last transaction without removing unrelated categories.
- **Startup bulk-launch protection** — game starts are blocked for the first fifteen seconds, require fresh native input, allow only one start per input, reject duplicates across app windows, and cannot travel through the generic external-link bridge. Intro input is fully contained.

### v1.7.3 (PC Power-Up · smarter updates · a more helpful library)

#### Major changes & new features

- **Meet Fungist, your living NEO-LIB companion** — Fungist now has a gentle docked hover plus blink, smile, shocked, and sleep poses; ordinary attention gets soft sparkles, while major PC attention gets neon flight trails, a red firework halo, and clear green/yellow/red status glows. He uses sensible per-type cooldowns, explains every alert through “Why am I seeing this?”, and gives a real completed-action response. Right-click Fungist for a short Inbox and Quick Settings. Settings also lets the player enable or mute each reaction type independently—PC alerts, favourite news/updates, NEO-LIB updates, completion, and idle naps—and visibly marks the current safe AI model, ready for future connected choices. His six lightweight synthesized cues obey both the UI-sounds switch and No sound pack. He remains fully removed during Rest Mode.
- **Optimize Center** — the new animated action beside CPU/RAM gives a clear Speed Up Gaming view: top CPU and memory users, GPU activity where Windows exposes it, and useful Game Mode, GPU scheduling, capture, power-plan, and restart guidance.
- **Safe Junk Review** — review temporary files, crash reports, logs, and nearby forgotten installers before anything changes. Every file links to its folder, requires inspection and two confirmations, then moves to the Windows Recycle Bin.
- **Hardware & graphics in Tools** — first launch can detect the graphics adapter and add GPU-Z, CPU-Z, plus the appropriate NVIDIA, AMD, Intel, or Windows graphics shortcut. Missing utilities can be located or installed only after an explicit click.
- **Smarter game updates** — a light startup/launch queue combines reliable launcher data with bounded local version, Readme, Changelog, Config, and Battle.net `.build.info` clues. It then tries known official pages plus a small automatic web discovery pass before showing a verified newer release above Preview news.
- **A richer personal library** — meaningful play sessions can request a precise one-decimal rating; Preview news has more artwork; direct provider tags remain next to broad genres; and Rest Mode can activate for a tracked game launched from its original client.

#### Fixes, adjustments & polish

- **Storage Control audit trail** — every displayed size now exposes its exact measured folder, file count, conventional mod split, and partial-scan status in a scrollable full-library list. NEO-LIB validates the configured target before it measures: missing files, folders mistaken for executables, known launcher links, and suspicious shared-library roots are skipped with a visible reason rather than being attributed to a game. Each measured root has an Open action, while normal Reveal in folder now reports errors and falls back to the containing folder when a configured executable has moved.
- **Visual performance controls** — Effects intensity and the new global **Full / Balanced / Calm** motion-rate slider now live together in Visuals → FX. Lowering Effects intensity reduces visual layers; lowering motion rate retains the selected particles and scene layers but advances ambient movement less often. The compact in-app tip explains that lowering either—or both—can improve performance without affecting normal controls.
- **Startup launch safety** — NEO-LIB requires a short-lived native authorization from the actual Launch button, then allows an executable game start only after a fresh native click/key action. It holds starts during its short startup settling window, prevents duplicate app instances, and rejects rapid repeats across all NEO-LIB windows. Game-launch protocols are also blocked from the generic external-link bridge. The boot screen owns its pointer input, so skipping it cannot activate content underneath. Startup itself and every allowed or blocked request are recorded locally for an exact support audit.
- **Home and Library precision** — the first game can sit cleanly against the Library header, category Backdrops scale with label size, and a first window opens at 75% width by 90% height while later launches remember your own size.
- **Theme and Friends polish** — the new Mid Home theme joins refined Generic Gray, Generic Blue, Midnight, Industrial, Modern, Daybreak, and Mint Garden treatments. Friends is roomier and easier to read.
- **Safer background behavior** — protected Windows/NEO-LIB processes cannot be closed from Optimize, NEO-LIB applies no hidden system tweaks, and an idle launcher never triggers Rest Mode.
- **NVIDIA and Visual corrections** — Store-installed NVIDIA Control Panel/NVIDIA App is now detected through Windows Start-app registration instead of falling back too early to Graphics Settings. Home is a calmer gray, and Category Backdrops closely follow the text size instead of becoming a thick extra row.
- **Honest update results** — a page without an explicit latest version no longer records a game as current. NEO-LIB reports that stronger evidence is needed and explains the automatic folder, launcher, official-page, and web checks it already attempted.
- **Optimize stability and calmer monitoring** — Safe Junk Review holds its completed results rather than restarting its scan; the Game Ready footer refreshes every 15 seconds, and the external-launch path probe now runs every 30 seconds to avoid needless background wake-ups.
- **Home breathing room + AI reliability** — Home’s news artwork, titles, spacing, and overall dashboard scale are larger, while the pane eye/drag controls now sit clear of headings. Gemini metadata uses one current 2.5 Flash route with validated output, useful visible errors, and a Settings connection test.
- **New NEO-LIB icon everywhere** — the neon power artwork now covers the app window, taskbar, installer, desktop and Start shortcuts. Windows uses the matching stable NEO-LIB app identity, and the installer safely asks Explorer to refresh icons after upgrade—without deleting a cache, changing pins, or touching user data. A dedicated transparent tray mark keeps Close to tray crisp instead of falling back to a blank notification-area icon.
- **Fungist, Home, and onboarding test corrections** — Fungist’s packaged pose artwork now resolves from the right Windows-app path, so the companion appears instead of fallback image text. Chat visibly shows whether its Gemini API key is ready and opens Settings when setup is needed. It is now a real local scrollable conversation: sent text clears immediately, both sides remain in history, the latest small chat context accompanies the next request, and Clear removes the local record. Fungist speaks as a cheerful mystical Oracle—brief and direct unless you ask for depth. The refreshed tutorial actively tours the real Library, Preview, Tools, Visuals, Home, Game Ready, and companion surfaces. Settings now has a visual **NEO-LIB Mascot** picker with Fungist selected, a clear **Show NEO-LIB mascot** restore switch, and room for future companions; opening full mascot settings preserves visibility. Fungist now sits safely above Friends. Home uses deeper neutral-gray panels, darker blue/gold highlights, and a soft dark text edge so light and coloured copy—including Game Ready CPU/RAM states—stays readable. Category and fixed interface labels now wrap at natural word breaks instead of hiding their final words.
- **Battle.net metadata resolver** — shortened Windows display names are normalized against a safe Blizzard product map before metadata fetching, so known products use their canonical title and official page first. Low-confidence Steam/GOG/itch matches cannot stop the automatic chain and attach unrelated metadata. If a title fails, NEO-LIB tries bounded local executable/folder/readme clues, then public sources and optional Gemini. A confirmed text-first result gets one safe public-page art pass for available cover, hero, background, and gallery images—never invented artwork.
- **Final v1.7.3 polish pass** — Home uses a more vivid gray/blue/gold balance with stronger text edges; Fungist has livelier, resource-light idle motion and a clean transparent sleep pose; the guided Visuals popover closes cleanly; and the Library can switch from Categories to a flat visible-games list without exposing locked Private titles. For independent installs, a trustworthy public patch can now surface as an amber **comparison needed** card when the local build version is unreadable—clear attention, never a false update claim.
- **A living rest state** — sleeping Fungist now breathes with a slow transform-only rise/fall, a quiet aura pulse, and drifting `zZz`. It avoids GIF/video decoding and stops completely in NEO-LIB Rest Mode.
- **Genre Intelligence v2** — broad labels no longer count as finished identity. NEO-LIB keeps up to thirty direct Steam community tags, migrates existing evidence through a richer exact-match taxonomy, and derives transparent tag combinations such as Sandbox + Building → Sandbox Builder and Roguelike + Dungeon Crawler → Roguelike Dungeon Crawler. Auto-sort and Tidy Up can run an approval-first **Enrich source tags** pass, without mining loose description text or altering Library categories.
- **Update evidence recovery** — if a standalone build has no readable version in its own bounded files, NEO-LIB can read the Windows executable version resource as a local clue. It may surface a public patch for comparison, but never uses that weak clue alone to mark a game current or confirm an update.

#### v1.7.2 release highlights

- **GPU setup assistant** — on first desktop launch, NEO-LIB reads Windows’ normal graphics-adapter list and adds GPU-Z, CPU-Z, and a detected NVIDIA/AMD/Intel control-centre shortcut to a Hardware & graphics Tools group. If no local vendor centre is found, it uses Windows Graphics Settings instead—no driver, registry, or GPU setting is changed.
- **Locate or install GPU-Z / CPU-Z** — missing utilities are visibly muted with a clear setup state. Select one for a compact Locate or Install menu: Locate validates the chosen executable; Install starts only after your click and uses the official publisher source. GPU-Z is placed as its portable executable; CPU-Z opens CPUID’s normal visible installer, never a silent install.
- **Optimize Center** — a new bottom-right Optimize button beside CPU/RAM opens an animated two-part dashboard. Speed Up Gaming shows top CPU and memory processes, GPU activity and responsible programs where Windows exposes them, plus Game Mode, GPU scheduling, capture, power-plan, and restart checks with clear pros and trade-offs. Protected Windows/NEO-LIB processes cannot be closed, and NEO-LIB never applies hidden registry tweaks.
- **Inspection-first cleanup** — Safe Junk Review scans only known temp/crash locations and folders beside configured games for old logs, dumps, caches, and large forgotten installers/archives. Every exact file links to its folder, requires inspection plus two confirmations, then goes to the Windows Recycle Bin. No whole-drive scan or recursive folder deletion is used.
- **Post-play ratings + visual Preview news** — meaningful sessions can gently request a precise one-decimal private rating, with snooze and never-ask choices. Game Preview news now uses feed artwork when present and falls back through the game’s existing hero, background, screenshot, and cover.
- **Current development pass** — Rating System v2 clears legacy personal ratings once and renders true decimal star fills. Battle.net metadata now favours official public product pages; detailed provider tags remain visible; and independent games can safely derive a local version from bounded version/readme/changelog files before a public-page comparison.
- **Background update scan** — startup and launch warm safe update evidence from launcher manifests, saved versions, executable/folder clues, and bounded nearby Version/Changelog/Readme/Config files. Verified updates blink in Preview directly above game news; checks run through a small cached queue.
- **Update checklist + Library precision** — local conclusive results are current, pending, available, or needs-evidence, keeping current games out of alert surfaces. First-game spacing now reaches clean compact zero, Backdrops scale with category text, and a first window opens at 75% width by 90% usable height while your later bounds remain yours.
- **External-launch Rest Mode** — a known library game launched from Steam, Battle.net, Epic, or another client now activates Rest Mode through an exact ordinary Windows process-path match. An idle launcher never counts; NEO-LIB does no injection, overlay, memory inspection, or credential access.
- **Storage Control fix** — launcher URLs are ignored, a shared install folder is measured once, Home retains results during navigation, and up to three configured game folders are measured in parallel. NEO-LIB never scans an entire drive.
- **New Mid theme: Home** — a welcoming light-gray workspace with sharp black/white structure, light-blue edges and FX, and a soft warm-yellow/gray blend pattern.
- **New quick-start tutorial + hover help** — the concise current first-run path covers importing, Hidden privacy, Home, game controls, customization, and Rest Mode. Hold a described control for one second to read its theme-aware explanation.
- **Home & Friends refinement** — a centred fixed Top 5, standalone detailed Library Health, live animated Home ordering preview, richer What should I play? explanations, and a larger, more readable Friends panel. Generic Gray and Generic Blue move to Mid; Generic Blue is lighter.
- **Released This Week** — Home gains a rearrangeable pane for notable full-game launches from the last seven days, with cover art, source, official release date, and a transparent inclusion reason.
- **Selective, not noisy** — NEO-LIB verifies the real store release date and requires meaningful early player, review, or launch-reach signals before including a title.
- **Lightweight refresh** — the feed is cached for six hours, can be refreshed manually, and opens official store pages without accessing any account.
- **Safer Steam matching** — launcher imports keep Steam’s exact local app ID and manifest title authoritative, so delisted titles that vanish from Store search cannot be replaced by a fuzzy, unrelated match.
- **Home cleanup** — My Best Games is top five by personal decimal rating; Library Health is compact and clickable; Top 5 Played and Recent Sessions have distinct jobs; and Gaming Chronicle is an informative, scrollable history.
- **Theme cleanup** — new Special Generic Gray and Generic Blue themes join a sharper Midnight, danger-bright Industrial, slate/red Modern, warm-sunrise Daybreak, and clearly organic Mint Garden.
- **Shell polish** — Friends lives at the far right of the permanent sponsor rail, Coffee remains readable on light themes, and Tools uses a utilities icon rather than a settings-like wrench.
- **Genre Intelligence — foundation** — refreshed metadata now keeps direct provider genres intact while building a separate, exact-match identity profile for core genres, specific subgenres, playstyle, perspective, and themes. Steam refreshes can use official categories plus cached, rate-limited Steam community tags; this never changes a user’s Library categories. Auto-sort now recommends at most six evidence-backed collections and never scans descriptions for loose genre words.
- **Review what is new** — add-from-match and metadata refresh now use the approval popup before writing. Newly detected fields, including the structured game identity, are green and labelled **NEW**; Genres controls whether that identity is applied.
- **Wizard identity review** — every folder-scan match now previews its detected core genres, subgenres, playstyle, perspective, and themes in a green **NEW** panel before acceptance. Saving that identity never changes Library categories.
- **Preview-pane refinement** — a theme-responsive vertical identity card now owns genres, supporting actions form one calm menu beside Launch, and game facts appear as a clean readable list.
- **Released This Week fallback** — Home keeps major releases first, then automatically surfaces only verified semi-major games when a quiet week would otherwise leave the pane blank.
- **Library identity repair queue** — Tidy Up walks through unidentified games with repaired/skipped progress, clickable local title clues from the EXE/folder/bounded README scan, and approval before every change.
- **Update Intelligence · Steam foundation** — pending Steam download bytes appear in Home and the selected game preview, with a safe handoff to Steam Downloads and no launcher-queue writes.
- **Independent update watch** — optionally store the installed version and a public update page in Customize; explicit higher version labels appear in Home and Game Preview with a link to the chosen source.
- **In-app patch history** — an independent-game update alert opens a read-only version timeline with detected release dates, versions newer than the installed copy, and a button to the full user-chosen source.
- **Consistent native launcher imports** — first-time detection, background refresh, and the Wizard all use the same supported adapters and preserve their verified executable, product/version, source, and launcher-category fields.
- **Honest launcher identity** — Home and the full launcher filter use the actual launcher field rather than metadata provenance, preventing local/repack games with Steam metadata from being presented as Steam-owned.
- **Predictable dialog dismissal** — dialogs and custom review surfaces now close with one click outside, while Escape and explicit close buttons remain available.
- **Native GOG import** — Wizard import now discovers installed GOG games through the Windows registry, retains their GOG identity, and groups them correctly without account access.
- **Native EA/Origin import** — Wizard import now discovers locally registered EA and legacy Origin installs, retains product/version identity, and creates the EA category without account access.
- **Native Ubisoft Connect import** — Wizard import now discovers locally registered Ubisoft installs, keeps product identity and native launch routing, and creates the Ubisoft category.
- **Native Battle.net import** — Wizard import now discovers locally registered Blizzard games, excludes the desktop client, preserves product/version identity, and creates the Battle.net category.
- **Native Riot import** — Wizard import now discovers games from Riot’s bounded local product metadata, excludes the client itself, and preserves product/version/launch identity under a Riot category.
- **Native Xbox/Game Pass import** — Wizard import now reads bounded XboxGames roots and per-title MicrosoftGame.config files, retaining Store/configured-executable identity under an Xbox category.
- **Native Rockstar import** — Wizard import now discovers verified Rockstar game installs, excludes launcher/Social Club/support entries, and preserves version/product identity under a Rockstar category.
- **Native itch.io import** — Wizard import reads only the install locations configured by the itch desktop app, recognises completed installs from their own local receipt marker, and routes folder-derived titles through the normal approval-first metadata flow. It never opens itch’s live catalog database, copies credentials, or scans unrelated folders.

### Previous — v1.7.1 (Home intelligence — safe save backups, play suggestions, storage, and your Chronicle)

- **Library Health** — a colour-coded score highlights metadata gaps, missing launch targets, and duplicate candidates, with a direct path into Tidy Up.
- **Richer Home** — larger news cards use game artwork where available and Top 5 gains cover art, platform, and playtime.
- **Home you can arrange** — drag Home panes into order, hide one from its hover control, and restore hidden panes from the Home header. News opens inside NEO-LIB before offering a Full story link, while **My Best Games** compares personal ratings with Metacritic where available.
- **Cleaner shell** — Friends now belongs in the selected game preview, Coffee sits beside Discord, Settings follows Visuals in Library controls, and Refresh/Tidy sits beside Auto-sort. The centred sponsored rail is permanent and no longer dismissible.
- **Smarter Game Ready** — yellow begins at 65% and red at 85%; the Library can scroll fully above its footer.
- **Rest Mode while gaming** — on by default for games launched through NEO-LIB. It pauses ambience, animations, UI sounds, health polling, launcher scans, news/deal checks, and social refreshes until the game exits, then resumes automatically.
- **Save Game Folder + safe backups** — choose and open a per-game save folder, search a user-selected location for possible older saves, create private local backups, and recover safely without overwriting a non-empty live save folder.
- **What should I play?** — Home suggests a recently updated game, a forgotten personal favourite, or a fresh unplayed addition using local library signals.
- **Storage Control Centre** — a user-triggered, read-only scan measures game folders and recognised mod/workshop folders; it never crawls drives silently.
- **Gaming Chronicle** — a private local timeline captures games added, played, rated, and updated.
- **Launch Doctor** — only after repeated immediate failures or very short launches, checks the configured executable and offers nearby candidates for review without changing anything automatically.
- **Theme ambience variation** — each theme now has its own particle language (stars, bubbles, embers, pixels, pollen, rays, ink, dust, prism, or metal) while respecting its Effects intensity.
- **Three new chimes** — Aurora, Ember, and Harbor; plus Weave, Brushed, and Stardust textures in Visuals. Brushed replaces the earlier Topography tile with a seamless material finish.
- **Theme polish** — Anime gains original manga line art plus a pink-forward/violet palette. Pro is renamed **Industrial**, with lively safety-light effects and no CRT scanlines.
- **Category marker fix** — `None` now removes both the dot and backdrop as intended.
- **Library Health and saves** — Review issues now opens the actual affected games, and Save Game Folder safely checks common local locations plus Steam Cloud's local mirror.
- **Cleaner Visuals menu** — grouped into Object sizes, Text & category, FX, and Layout; Quick presets removed in favour of direct control. Icon position and category marker style are sliders, and the translucent category backdrop scales with Category glow.

- **Friends Hub** — a compact, theme-aware top-right panel detects Steam, Battle.net, Epic, EA app, and Ubisoft Connect locally.
- **Setup that recovers gracefully** — the panel scans on open, distinguishes running / installed-but-off / not found states, and lets you locate a custom launcher executable once for future use.
- **Theme artwork pass** — Anime now carries an original transparent manga-inspired scene behind the glass UI; Gaming and Modern receive their own arena and editorial ambient treatments. All respect Effects intensity.
- **Every theme illustrated** — every theme now has its own original, low-opacity background motif; the Effects intensity control remains the master dial.
- **Cleaner controls** — Settings, feedback, and Discord now live beside the version in the title bar, so the Library / Tools / News / Stats tabs keep their labels. The sidebar's compact **+ Add** menu now contains both Add game and Add category.
- **Responsive sidebar labels** — toolbar text now scales down smoothly while resizing, becomes icon-only before it is unreadable, and scales back in when space returns.
- **Game Ready footer** — a full-width, bottom-edge Library overlay keeps game rows visible behind its glass surface while showing local CPU/RAM health. Click it for tips; amber/red states pulse, and narrow windows reflow the bar instead of clipping text.
- **Home Hub** — Home replaces the floating News and Stats panels with a full right-pane hub: date-sorted scrollable game news, Today / Week / Month activity, Top 5, and cover-led recent activity. One compact, labelled sponsored rail replaces the old activity deck and large featured banner.
- **Safe native handoff** — open each platform's own social client from NEO-LIB. No launcher credentials, cookies, friend lists, or private chats are read.

### Previous — v1.6.6 (Feedback works in the compiled .exe via a signed Cloudflare Worker relay)

### Previous — v1.6.5 (Webhook re-rotated · English-only news · Gold ring & category glow scale with text size · 3 new textures · Actually-vertical theme picker)

### Previous — v1.6.4 (Genre hide fixed · Chromier toolbar · Column switcher in Visuals · Launcher dropdown · Vertical themes · Gold shimmer · New sci-fi sound · Range-aware Most Played · Webhook secured)
- **🔴 Fixed** the "hide genre strip" toggle for real — prop was never forwarded from `Section` to `GameRow`. One-line fix, third time was the charm.
- **Toolbar chrome darker** so tab pills read as chrome, not game rows.
- **Background textures** no longer overlay hero banners / preview screenshots — moved inside the sidebar body only.
- **Column layout switcher** moved from row-2 toolbar into the Visuals popover.
- **Launcher filter → dropdown** ("▾ All launchers"). Six pills collapsed to one compact control.
- **"+ New" → "+ Category"** for clarity.
- **Theme picker vertical**, groups ordered Bright → Middle → Dark → Special.
- **5-star favourites** get a subtle animated gold "electric" shimmer border.
- **Sci-fi sound pack rebuilt** as a "warp punch" (FM zap + noise burst). Actually audible now.
- **Most played · This week / Month / Year** ranks correctly — daily playtime snapshots power range deltas.
- **🔒 Rotated the leaked feedback webhook** + removed the hardcoded fallback URL from source.

### v1.6.3 (Fixed: phantom hours on non-Steam games · Aligned toolbar · Textures visible · Louder Special themes)
- **🔴 Fixed** Hellclock / Solarpunk (and any other non-Steam game) getting 500+ phantom hours after a Steam import. localconfig.vdf is no longer treated as ownership — only sharedconfig + installed manifests count. Apply now double-checks ownership even under "Select all".
- **Fixed** background textures were invisible over the library pane. Texture layer now paints on top of the frosted panels via `mix-blend-mode: overlay`. Opacity slider bumped to 0–100%.
- **Toolbar alignment** — Feedback pill matches the Library / Tools / News / Stats / Settings row height. Tab & sidebar icons enlarged ~20%.
- **Renamed** "Add" → **"Add Game"**.
- **Moved** Playtime toolkit out of the Visuals menu — now exclusively in the Stats panel.
- **Special themes turned up** — Colorful has a slow-rotating conic prism aura + denser twinkle field; Pro gains hazard-chevron march, brushed-metal sheen and corner emergency pulses.
- **Theme picker readable again** — swatches enlarged, labels bumped to 11.5px.

### v1.6.2 (Fixed: Steam hours after Reset · Select-all bulk)
- **🔴 Fixed** after Reset, Steam hours never came back. Bulk reset was setting `playtimeManual` which then blocked every future Steam import. Reset now explicitly clears the flag.
- **Fixed** "Select all Steam-owned" no longer refuses to override manual flag when you check a box explicitly.
- **New** gradient **"✓ Select all"** bulk button — marks every row in one click. Companion "Deselect all" too.
- Previous button renamed **"✓ Select Steam-owned only"**.

### v1.6.1 (Ownership rewrite · Bulk playtime actions · Modal fixes · CI feedback)
- **Fixed** Steam ownership detection — brace-matched VDF parsing (was breaking on nested cloud blocks) + walks `libraryfolders.vdf` for multi-drive installs (Icarus & other secondary-drive games now detected).
- **Fixed** modal — checkboxes and refresh buttons work on every row (were previously disabled for "unowned").
- **New** bulk actions in preview modal: `✓ Select all Steam-owned` · `⚠ Zero all unowned` · `💥 Reset all to 0` · `🔄 Re-fetch all`.
- **New** Playtime toolkit shortcut in the Visuals menu.
- **Fixed** Feedback pill in CI-built .exes — hardcoded webhook fallback so it works without .env.
- **Debug info** in the import header (source counts + library-folder list on hover).

### v1.6.0 (Playtime import preview · True Steam ownership · Manual override · Safer reset)
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
