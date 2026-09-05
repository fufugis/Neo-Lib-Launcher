# NEO-LIB

> A synthwave-flavored, **fully portable Windows game library** that unifies every game on your PC — Steam, Epic, EA App, GOG, standalone — into one neon-lit interface. No accounts. No cloud. No telemetry.

![status](https://img.shields.io/badge/status-testing-f59e0b) ![platform](https://img.shields.io/badge/platform-Windows%20x64-9b5cff) ![release](https://img.shields.io/badge/release-v1.7.5-8a4fff) ![license](https://img.shields.io/badge/license-Proprietary-1a1a2e)

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

- **Outside-Library PC check** — a player-requested, read-only Windows snapshot can name top CPU/RAM apps during a Fungist alert, even when the game was never imported. Clear game/client names are highlighted without touching game memory, accounts, overlays, or processes.
- **5 dynamic themes** — Synthwave · Midnight · Ocean · Crimson · Anime — each with its own animated particle background
- **Smart Wizard** — pick folders, drives, or whole launcher install roots; exclusion paths supported; back-button at every step
- **Auto-detect launchers** — Steam · Epic · EA App · GOG · Ubisoft · Battle.net · Riot · Xbox/MS Store. Inactive launchers dim out automatically
- **Launcher filter tabs** — switch the sidebar between All / Steam / Epic / EA / GOG / Other in one click
- **Two-Row library layout** — dense double-column view; categories never split between columns
- **Responsive Home pairs** — related compact Home cards share a row on wide windows, remain independently movable, and fall back to a readable single-column flow when space is tight.
- **Illustrated Special-theme button frames** — Anime blossom vines, Industrial gear/hazard machinery, and Magical rune/crystal art visibly frame the navigation and Preview actions without covering controls.
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

### v1.7.5 — Library Refinement, Safety & Fungist *(testing candidate — not published)*

#### Major changes & new features

- **Cleaner category headers** — launcher badges no longer repeat the same name beside them; custom category names remain visible.

- **Launcher wizard recovery (testing)** — launcher confirmation appears on its own top-level layer; local installed games and their category no longer wait for online metadata downloads. Scans offer Cancel and a timeout message. Refresh info fills artwork/descriptions after import; non-Steam product IDs are kept separate from Steam IDs.

- **Subtler Preview glass** — a small reduction in the outer Preview backdrop opacity lets more theme FX show, while retaining inner reading-card surfaces and blur.

- **Finer Magical corners** — four mirrored wisp/star accents replace chunky cropped ornaments while retaining the existing illuminated border lines.

- **Industrial spark polish** — three larger welding spark clusters decorate the chain border, which stretches with each navigation button as the Library pane changes width.

- **Industrial chain trim** — navigation buttons use a continuous illustrated chain with small dark cogs and welding sparks. Magical ornaments now align with the upper-right and lower-left corners.

- **More expressive Special buttons** — larger outward cherry blossoms, warm machinery/cog corners and magical rune/crystal flourishes surround each navigation button, with clear centres and adjustable decoration strength.

- **Choose what refresh replaces (testing)** — game refresh now offers candidate artwork/descriptions before saving: up to five results initially, then **Show more**. Select one icon/banner or multiple screenshots; review complete metadata, cancel unchanged, or step through bulk refresh with Skip/Stop.

- **Fungist’s welcome is now truly startup-only** — the “Welcome to NEO-LIB” voice line plays only after a completed intro, once per desktop window. Normal mascot notices cannot accidentally reuse it as a background reaction.
- **Library dropdowns now stay in front and readable** — launcher, Sort, Categories, and Refresh menus use a forced foreground plane above scrolling games, with a near-solid themed surface so category names and game art cannot bleed through options.
- **Battle.net Re-fetch now applies exact Blizzard results immediately** — when Warcraft III or World of Warcraft resolves through its maintained Battle.net identity, Re-fetch info saves the result directly instead of leaving it behind the generic metadata-approval screen. Manual re-search remains a separate reviewable action.
- **Battle.net metadata now has a true Blizzard-first recovery path** — Re-fetch info carries the local Battle.net product identity into NEO-LIB’s Blizzard catalogue before any Steam/store match is considered. Warcraft III: Reforged and World of Warcraft recover their correct canonical title, Blizzard publisher, description, website, genres, and tags even if an official product page is temporarily unavailable. A manual refresh deliberately retries Blizzard’s current page for art and wording, but never falls through into an unrelated Steam match.
- **News now reaches every launcher and local game** — Steam, GOG, and itch.io retain their own public feeds. EA App, Epic, Ubisoft Connect, Battle.net, Riot, Xbox, Rockstar, and standalone/F95-style library entries now receive an official-site-first public news check, with clearly-labelled web discovery only when no direct feed has fresh news. Searches are bounded, cached, and rotated across larger libraries so Home stays responsive; an unverified search result is never presented as a launcher update.
- **Library popups always stay in front** — Sort, launcher filter, Categories, Add, and Refresh menus now sit on a dedicated foreground layer. Category rows, game art, textures, and theme FX cannot show through or cover an open menu.
- **Home now tells you when private categories are locked** — a compact Home notice appears whenever a PIN category remains locked. It reminds you that stats and news from those games stay hidden until you unlock them in Library, then disappears automatically once all private categories are open.
- **Preview actions now let the theme breathe** — the dark strip behind Launch and the game action menu is slightly more transparent with lighter blur. The controls remain clear, while more background animation and Special-theme art stays visible behind the bar.
- **Private PIN setup now explains Lock private** — when you protect a category for the first time, NEO-LIB shows where the readable red-outline **Lock private** button lives: top-right of Home. It explains that the button immediately re-locks every PIN category, redacts protected content, and returns to a safe Library view. Your PIN is retained; enter it again later to reveal that category.
- **Library toolbar stays readable over theme art** — Add, Wizard, Visuals, launcher filter, Sort, Categories, Auto-sort, and Refresh now sit on denser themed control surfaces. Their dropdown panels are near-solid, so texture and animation cannot wash out labels or choices.
- **Fungist now speaks more simply** — ordinary voice lines use one compact text bubble with a small tail, without a large caption, quote treatment, or heavy glow. Full notice cards remain reserved for something that genuinely needs your action.
- **Private categories work in Cover Wall too** — each still-locked PIN category now appears only as its own protected padlock button at the top of Wall. Enter its PIN to show that category’s games; switching to Wall alone never exposes them.
- **Category headers scale as one** — the Visuals category-text slider now resizes the category name, launcher/client badge, count, marker, arrows, and header controls together, keeping the row centred and balanced.
- **Private categories keep their visual identity** — locked PIN categories follow your selected Dot or Backdrop category-marker style without revealing protected game counts or titles.
- **Library titles stay contained** — game names can use two natural lines inside the resizable Library but cannot bleed into neighbouring rows or the Preview pane; the full title remains available on hover.
- **Fungist hover text stays on-screen** — the mascot now uses a compact in-app hover bubble, and its remembered dock position is clamped so the companion and bubble remain visible in smaller windows.
- **Private games stay private across Home** — locked-category games become category-only lock tiles across Home’s rankings, activity, news, updates, Chronicle, and storage surfaces; their title, art, platform, path, and links are hidden until that category is unlocked. Home’s readable red-outline **Lock private** button instantly re-locks every PIN category and jumps to a safe Preview.
- **Private shelves are cleaner** — a locked category now has one clear lock control and a simple Unlock label instead of repeated lock icons. Its protected game count stays hidden until you enter the PIN.
- **Home now puts the week where it matters** — Top 5 Played now includes one compact weekly summary for hours played, games touched, today, and your Library total, replacing the separate Your Week card. **What Should I Play** takes the freed half-width slot with smaller art and concise reasons. The pinned weekly-news rail is larger and easier to spot at a glance, with a stronger accent edge, clearer headline, and bigger readable story cards.
- **Tools now identify themselves like first-class library entries** — Add Tool and Re-fetch info use a dedicated Windows-software resolver: the selected executable's native icon and file identity come first, followed by recognised vendor profiles and one bounded public official-software lookup. GPU-Z, CPU-Z, OBS, driver panels, editors, and unfamiliar utilities can receive a name, icon, publisher, version, category, description, official page, and evidence trail without being searched as a Steam game. Existing incomplete Tools are filled only when Tools opens; manual information is never overwritten.
- **A cleaner, grouped Home** — Top 5 Played remains fixed at the top, with a smaller **This Week’s News** rail directly beneath it. The rest of Home is now arranged into three clear sections: **Play & history** for sessions, ratings, recommendations, and Chronicle; **News & updates** for available updates and new releases; and **Library & PC care** for Library Health and Storage Control. There is intentional space between sections while scrolling. Reorder individual cards only within their own section, or drag a section itself to rearrange the dashboard without mixing unrelated content.
- **Special navigation now has real artwork around it** — Anime, Industrial, and Magical frame the main Home, Library, Wall, and Tools buttons with their actual transparent blossom, machinery, or rune illustration. The decoration slider controls these frames, while the controls stay completely usable.
- **Preview actions join the Special-theme world** — the game Launch/action strip now gets a deliberately subtler outer-edge frame using the same artwork. Actions and labels sit above it, remain clear and clickable, and never lose their contrast.
- **Preview glass now leaves room for the theme** — the main Preview, story, identity, detail, media, and action surfaces are about 20% lighter. Theme animation and artwork can show through the page again, while the text contrast remains protected.
- **Category dots are reliable again** — Dot mode now keeps a coloured marker visible for launcher-labelled categories such as Steam, Battle.net, and Epic, positioned beside the collapse control instead of being replaced by the launcher badge.
- **Visuals is now a real control board** — the tall Visuals menu is reorganised into three clear lanes: **Object sizes & Layout**, **Text & category**, and **FX**. Solid themed section tabs make each control family obvious, while smaller windows automatically reflow to two or one columns.
- **FX now respects the interface** — title bar, Library, Home, Preview, Tools, deals, text, menus, and every interactive control sit in one foreground plane. Particles, theme art, textures, glows, and Special decoration remain behind them, never over wording or buttons.
- **Fungist has a remembered dock** — click-hold and drag him within his safe lower-right area to avoid overlapping a control. His perch is saved locally, and all launch/chat/alert flights return to that exact chosen position.
- **Released This Week now has a useful quiet-week fallback** — NEO-LIB still prefers major launches, then noteworthy titles with early player/review momentum. If neither appears, it uses Steam’s current New Releases shelf to show clearly-labelled popular new releases rather than leaving the Home panel empty. The feed remains selective and says which fallback was used.
- **External-game Rest Mode asks clearly** — if Fungist notices elevated/high PC use, he can check whether a known NEO-LIB game is already running from Steam, Battle.net, Epic, or another client. A positive match names the game and offers **Enable low usage until it closes**. This is a local executable-path check only—no launcher accounts, game memory, injection, overlays, or network access. Once enabled, NEO-LIB automatically resumes shortly after that exact game process closes.
- **Choose a Library font** — Visuals now has five clean system-font choices for the Library tree, plus separate **Fat** and **Cursive** controls. These change only game and category text in the Library; Home, Preview, Tools, and Settings keep their established type.
- **Real Special-theme artwork** — Anime, Industrial, and Magical now use proper transparent decorative artwork instead of procedural pixel fragments: a cherry-blossom vine, graphite machinery/hazard detail, and a rune-light flourish. Each now occupies a deliberate UI-safe composition layer and is visibly present at normal FX levels; the Special decoration slider still controls visibility, and Rest Mode removes it completely.
- **Special themes now decorate controls** — Anime adds delicate blossom-vine curls and leaves around navigation/game controls; Industrial adds bolted rails, rivets, and hazard seams; Magical adds rune arcs and star dust. These never block clicks or labels, remain controlled by the one Special decoration slider, and disappear at FX 0 or in Rest Mode.
- **Recovered Settings panel** — Settings returns to the established shared modal layout after a Settings-specific sizing route could leave a blank gray shell in the packaged app. A dedicated recovery layer now catches any future Settings-only rendering error, keeping NEO-LIB usable and giving you a direct bug-report route.
- **Cleaner Library and bigger Preview media** — Library game names no longer sit on dark bordered backplates. Preview now hugs the Library side again: readable game information stays left while a substantially larger 460–560px right-side gallery displays up to eight verified headers, backgrounds, covers, and screenshots.
- **Better Game Identity placement** — genre, subgenre, and gameplay tags now sit back inside the top-right of the About this game card. The description has its own hard text column, so its final line always ends before the tags begin; the gallery remains dedicated to artwork.
- **Helpful AI failure route** — if Fungist cannot reach the configured AI, he now says so plainly, points to the top-bar Feedback button, and offers a direct **Report a bug** action instead of an unrelated emotional reply.
- **Feedback always has a route** — builds without the optional private Discord relay now open a prefilled public GitHub report instead of showing technical relay configuration instructions to players.
- **Working update actions** — a pending Steam update card is now fully clickable in Preview and Home, opening Steam’s Downloads page through a fixed safe native route. This is never treated as a game-launch request; unsupported future client queues show a clear message instead of failing silently.
- **Windows-aware Optimize routing** — Speed Up Gaming now detects Windows 10/11 plus release/build, shows the matching manual path for Game Mode, GPU scheduling, Background capture, and Power mode, and opens the real Windows page for each one. Background capture now goes directly to Game DVR/Captures; older builds are plainly told when GPU scheduling is unavailable.
- **Workspace defaults are now intentional** — Home is only Home. Opening Library restores the most recently played game (or the first library game), while Tools restores the last utility you opened or shows an honest **Add programs first** empty state. Wall stays a Wall until a selected tile deliberately opens Preview.
- **Wall now reaches 10×10** — dense Wall layouts now include 9×9 and 10×10, use centered landscape cards, and prefer each game’s higher-quality wide header/capsule artwork before falling back to a cover. Locked Private titles remain excluded.
- **Private unlock is explicit** — a locked shelf now shows a readable **Unlock {category name} ({game count})** action. It still exposes no game rows until its PIN is accepted.
- **Fungist’s chat and launch moment** — Fungist now flies above the chat header in a ready-to-help pose when you open a conversation, instead of being hidden behind it. A confirmed manual game launch gives him a short fly-to-Launch-button cheer before NEO-LIB enters Rest Mode.
- **Expanded local voice palette** — the nine additional user-supplied clips are now packaged with the earlier set: 27 local lines total. They are mapped to chat agreement, playful suggestions, small/large completion, update attention, support, and future hand-off moments. Settings still offers individual local previews, voice mute, and volume.
- **Theme backgrounds are visible again** — all theme atmosphere art now has a stronger but still behind-the-UI grade at normal FX levels. It remains tied to the FX slider and disappears in Rest Mode.
- **The actual startup trigger was removed** — the automatic update checker was passing each library executable after PowerShell’s command switch while it inspected Windows version information. Windows could interpret those paths as commands, which explains games opening in library order. Executable paths are now bound as inert data to a fixed encoded reader and cannot be executed by that scan.
- **Deliberate launch handshake** — NEO-LIB now asks its native Windows side for a short-lived authorization at the exact moment the player presses **Launch**. A trusted press is captured inside the isolated native bridge instead of relying on a fragile window-level input timestamp, so genuine clicks work reliably while background work, boot animations, and automatic renderer calls still cannot start a game. A blocked press now explains why instead of silently doing nothing.
- **Launch audit trail** — startup itself and every allowed or blocked launch request are written locally, making an unusual result diagnosable by evidence rather than guesswork.
- **Build-time launch safety gate** — every renderer/Windows build now verifies the encoded version reader, inert path binding, guarded preload route, one-time native authorization, and visible Launch-button handshake before Vite or the installer may continue.
- **Categories control centre** — the Library’s new **Categories** menu contains a visible On/Off shelf switch plus **Manage categories**. Add, edit, and remove collections from one clean screen; removal always sends its games to Uncategorized, never out of NEO-LIB. A typed-confirmation bulk action removes regular categories together while Private categories remain protected.
- **A livelier, more dimensional Fungist** — the companion now has a polished 3D pose family for idle, blink, important alert flight, sleep, and completion, plus occasional curiosity, stretch, smile, and sparkle moments at rest. These remain sparse transform/pose animations—not GIF/video playback, a canvas, or background polling—and stop completely in Rest Mode.
- **A bigger, more fluid Fungist** — Fungist’s dock is now larger, with a smoother 2.55-second resting motion, more frequent irregular blinks, and shorter gaps between his smile, curiosity, stretch, sparkle, and greeting moments. This is still transform/pose work only and remains fully absent in Rest Mode.
- **A careful Fungist voice palette** — all supplied voice lines are bundled with NEO-LIB and mapped to specific moments: welcome/tutorial introduction, favourite news and updates, NEO-LIB updates, PC attention, deliberate game launch, guided actions, completions, and short chat acknowledgements. Voice lines have a shared cooldown, respect UI Sounds and Rest Mode, and can be independently muted or volume-adjusted in Settings with a full preview map.
- **Visible speech delivery** — when Fungist uses a real voice line, he now shows the exact words in a speech bubble and animates a matching happy, thoughtful, concerned, urgent, or celebratory delivery. This shared behavior covers automatic alerts, chat, task results, launch celebrations, support, Settings previews, and tutorial voice moments—never unexplained background speech.
- **A real library companion** — Fungist is now a transparent character overlay, not a circular profile pod: he floats over a responsive neon ground pad with aura, hover sparkles, and action FX. Manual AI questions receive a compact visible-library snapshot of names, genres/tags, ratings, and playtime—never file paths, saves, accounts, processes, or locked Private games—so he can make tailored comparisons and recommendations. Typed commands such as `Launch Forza 5` and `Launch a random action game` resolve locally, then still require a guarded named confirmation button.
- **No more mascot transparency flash** — pose changes now stay fully opaque. Fungist can blink, speak, smile, sleep, or celebrate without fading in from a half-transparent state.
- **Aligned companion FX** — Fungist’s pulsing ground glow is now centred independently from its scale animation, keeping the effect directly beneath him.
- **Wall route repair** — selecting Wall no longer immediately resets the workspace back to Preview. It remains in the cover grid until you open a game or deliberately return to Library.
- **Calmer theme samples** — the Settings theme bars now use one restrained 48-second colour drift instead of rapid visual movement.
- **Compact theme-tile standard** — every Settings theme tile now has the same fixed, label-safe width based on the longest current name plus breathing room, rather than stretching across the whole window.
- **Clearer side-by-side library rows** — every Library row now puts the complete game name in a compact accent-edged nameplate at the bottom of its information block, so long titles can wrap instead of vanishing into an ellipsis. Freshly imported or manually added games receive a small **New** marker; it clears only after the player deliberately opens that title from the Library into Preview.
- **Friends becomes Launchers** — the rail shortcut is now a straightforward **Launchers** hub. It locally checks your supported clients and opens Steam, Battle.net, Epic, EA app, or Ubisoft Connect normally; it does not present a friends list or attempt to read social data.
- **Category controls scale properly** — the category expand/collapse arrow now follows the exact category-text size slider. Its touch target scales around the glyph, so it remains easy to click at every size.
- **Mascot quiet mode with a safe way back** — switching off **Show NEO-LIB mascot** now also mutes every Fungist voice line. Settings immediately explains that Fungist can always be restored from **Settings → NEO-LIB Mascot**, and remembers the previous voice preference for when he returns.
- **A Library atmosphere of its own** — the left Library pane now receives a deliberately faint, slow-moving version of the active theme artwork plus its existing accent wash. It remains visually distinct from Home, respects the FX level, and stays fully quiet in Rest Mode.
- **Anime is now truly illustrated** — the Anime backdrop is rebuilt as an original fully rendered 2D moonlit shrine-and-cherry-blossom scene, with a quiet centre for readable UI. The former manga/SVG outline layer has been removed completely; only the finished illustrated environment and its existing petals remain.
- **Three proper Special themes** — Anime now joins Industrial and the renamed **Magical** theme in the Special group. A new **Special theme decoration** slider controls their optional edge flourishes: drifting cherry petals, subtle machine cogs/rivets, or spell arcs and sparkles. Set it to 0% for a clean colour-only look.
- **Rest Mode is explained where it matters** — the Optimize performance view now makes clear that NEO-LIB may appear while you are browsing, but automatically pauses its effects, animation, sound, system monitoring, launcher/news/social checks, and other non-essential work once a tracked game launches. There is no need to close NEO-LIB merely because it appears in the snapshot.
- **Calmer Preview media** — a compact source-owned carousel now uses at most two curated images, while the game description remains uninterrupted prose instead of a long sequence of screenshots between paragraphs.
- **A safe welcome after boot** — after the intro has visibly finished, Fungist briefly arrives with a friendly raised-hand welcome and a larger greeting motion, then returns to his dock. This is renderer-only: it cannot launch games, scan updates, open a link, or touch a launcher, and it yields to real health/news alerts.
- **Startup and window-boundary repair** — the boot intro is one-shot, so ordinary startup updates cannot restart its timer and freeze its last frame. Tutorial waits until the intro is fully gone; Fungist’s greeting waits until the tutorial is closed, so no voice plays underneath startup. Tutorial cards, core draggable panels, metadata windows, News, Stats, Visuals, and category menus stay inside the visible app and scroll internally when needed. Retired legacy FX flags no longer override the modern Effects slider and silently remove particles/art after an upgrade.
- **A smarter, calmer Library** — a solid category arrow is now easy to see and click at every scale. The new Sort menu can preserve your own drag order or sort the visible scope by Alphabetical, Date Added, My Rating, Most Played, or Last Played. **Wall** is a new top-pane cover view: it removes the persistent Preview, lets you scale a cover-and-name grid from 3×3 to 8×8, and opens Preview only when you click a game. Locked Private games stay hidden.
- **A more inviting game story** — Preview is now a centered, less-transparent reading panel instead of two competing columns. The old screenshot carousel is retired; verified screenshots appear as subtle visual breaks inside longer descriptions, while animated theme art remains visible around the panel edge—never a random image search or AI-generated substitute.
- **Safer Library maintenance** — Refresh now clearly separates a targeted pass for missing/older metadata from a full refresh. Both show their affected count before starting, keep manual edits protected, and provide live progress; Tidy Up remains its own diagnosis and repair tool.
- **Auto-sort now asks first** — the conservative review plan proposes no more than four genre shelves after three direct metadata matches, avoids broad Adventure/Simulation fall-through, displays every proposed assignment, lets you exclude individual game/shelf matches, choose exactly which incomplete games get enriched, deliberately reuse a matching category or create an `Auto · …` shelf, and undo the last transaction.

#### Fixes, adjustments & polish

- **Individual illustrated button frames (verification pending)** — rebuilt Special navigation with direct image elements per button: Anime cherry branches, Industrial machinery and Magical sparkle art. Explicit theme/opacity settings replace the old CSS image/mask route; opaque centres protect labels. Component and asset checks pass; rendered visual acceptance remains pending.

- **Lighter default Library type** — normal Library typography now uses a true regular weight rather than a semi-bold baseline. Turn on **Fat** only when you want stronger, heavier game and category names.
- **Cleaner source tree** — generated build logs and one unreferenced duplicate mascot sleep asset are removed, while active mascot artwork, voice clips, theme art, and safety scripts required by the app remain versioned with the release source.
- **Cleaner Mascot sound settings** — removed the redundant Fungist synthesized-soundscape preview. Global UI sounds remain in **Sounds**, while Fungist’s voice toggle, volume, and line preview stay together as the companion’s single audio control.
- **Launcher update trust restored** — a current Steam manifest is now final for that launcher-owned install, rather than being reinterpreted by loose public-page matches. Other supported launcher imports remain honestly **launcher-managed** until NEO-LIB can read a launcher-specific pending-download signal; that state is recorded for diagnostics but never shown as a possible update. Independent/repack games retain their separate local-versus-public comparison path, even when they use Steam-sourced metadata.
- **Per-game update evidence, never a leaked result** — Home and Preview cache only the exact games they asked about, preventing a library scan from showing one game’s update on another game’s Preview. NEO-LIB now reads a broader bounded set of nearby version/config/manifest formats, ranks saved and official sources above web discovery, records the route taken, and gives Home a targeted **Resolve checks** action for games that still need evidence. A blocked or unreachable public source is now clearly recorded as missing evidence, never silently mistaken for a clean result.
- **Startup update scan isolated** — Home and the library-wide update cache now wait until 35 seconds after startup. Windows executable-resource inspection has its own 30-second boot quarantine, receives paths only as non-executable data, and coalesces overlapping Home/library requests into one scan.
- **Fungist / Rest Mode false-positive fix** — launcher imports now reject converters, assistants, importers, editors, benchmarks, diagnostics, and other helper EXEs when choosing the playable target. Existing launcher entries that still point at a helper are repaired from stronger launcher identity evidence, and legacy helpers are ignored by external-game Rest Mode immediately.
- **Startup bulk-launch protection** — executable starts are blocked during the first fifteen seconds, require a fresh native click/key action, and permit only one launch from that action. NEO-LIB also refuses duplicate app instances, guards against rapid repeats across windows, blocks game-launch links from the generic external-link bridge, and keeps intro input from falling through to the Library.
- **Confirmation-first launcher imports** — every supported launcher now opens a confirmation before it scans. If that launcher was imported before, NEO-LIB performs a second comparison, clearly says how many games already exist, and only offers genuinely new entries. Launcher detection opens this same Wizard path; it never silently bulk-imports in the background.
- **Theme contrast hardening** — decorative accent colours no longer have to double as tiny text. Vaporwave Day, Daybreak, Mint, Modern, and Home now use independently readable accent text colours while retaining their original glow/border colour story. Coloured status text receives a stronger edge across all themes, and Home returns to a calmer gray workspace with darker, readable blue and gold copy.
- **Home theme rebuilt** — normal neutral copy is now clean and unoutlined. Home uses a calm medium-gray room with deeper slate boxes, light-gray regular text, and blue/gold reserved for signals, glows, and FX; only coloured signal text receives a soft readability edge.
- **Theme artwork begins** — Home, Generic Gray, and Generic Blue now have low-contrast, full-window atmosphere art behind their interface instead of relying only on lines and particles. The artwork stays beneath the UI, softly drifts only outside Calm motion, fades with FX level, and disappears completely in Rest Mode.
- **Every theme now has its own environment** — Home/Generics feel calm and physical; Midnight is starlit navy; Industrial is graphite safety-light; Anime is pink/violet manga décor; Daybreak is sunrise architecture; Mint is an organic conservatory; Ocean is submerged blue; Crimson is ember-and-rose; Synthwave/Vaporwave Day, Gaming, Modern, and Colorful each get their own distinct backdrop. Each remains low contrast and background-only, with a long transform drift that shuts off in Calm/Rest Mode.
- **Balanced gameplay tags** — the preview now keeps up to eight useful gameplay tags, filtering storefront-only noise such as Steam Cloud, Trading Cards, and controller-support badges. Sparse sources are gently filled from already-confirmed subgenres and playstyle, so their identity remains comparable without inventing metadata or changing Library categories.
- **Smoother Balanced FX** — Balanced visual motion no longer uses visibly choppy animation steps. It stays fluid while reducing costly particles, bloom/edge glow, blur layers, and ambient opacity; Calm applies the stronger resource-saving version. Menus and ordinary button feedback stay smooth.
- **Home update results no longer vanish during navigation** — once an update check finishes, Home keeps that exact result locally when you open a game Preview and return. The list changes only when the next completed detection produces a newer result, rather than resetting to an empty panel on remount.
- **Settings switch alignment** — all Settings toggles now use one fixed control rail, so switches remain centred and aligned even when a label wraps onto two lines.
- **Softer dark-theme surfaces** — Synthwave, Midnight, Ocean, Crimson, Anime, Magical, and Industrial keep their original neon/accent colours, but their formerly near-black base and box surfaces now use deliberate charcoal, graphite, navy, or wine-gray layers. The result stays dark while making bright accents less exhausting.
- **Tutorial Preview stability** — the live tutorial no longer repeatedly reapplies the Preview destination while settings save, removing the distracting Preview flicker during that step.
- **Calmer title-bar actions** — Feedback, Discord, and Coffee now share one compact, theme-aware button treatment rather than competing coloured badges.

### v1.7.3 — PC Power-Up · smarter updates · a more helpful library

#### Major changes & new features

- **Meet Fungist, your living NEO-LIB companion** — Fungist now has a gentle docked hover plus blink, smile, shocked, and sleep poses; ordinary attention gets soft sparkles, while major PC attention gets neon flight trails, a red firework halo, and clear green/yellow/red status glows. He uses sensible per-type cooldowns, explains every alert through “Why am I seeing this?”, and gives a real completed-action response. Right-click Fungist for a short Inbox and Quick Settings. Settings also lets the player enable or mute each reaction type independently—PC alerts, favourite news/updates, NEO-LIB updates, completion, and idle naps—and visibly marks the current safe AI model, ready for future connected choices. His six lightweight synthesized cues obey both the UI-sounds switch and No sound pack. He remains fully removed during Rest Mode.
- **Optimize Center** — the animated action beside CPU/RAM gives a clear Speed Up Gaming view: it detects Windows 10/11 plus release/build, opens the real Game Mode, advanced graphics, Capture/Game DVR, and power page with matching in-app paths, and marks Hardware-accelerated GPU scheduling unavailable on older builds. It also shows top CPU/memory users and GPU activity where Windows exposes it; no hidden system tweak is ever applied.
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
- **New NEO-LIB icon everywhere** — the supplied neon power artwork now covers the app window, taskbar, installed EXE, installer, desktop and Start shortcuts. Windows uses the matching stable NEO-LIB app identity, and the installer safely asks Explorer to refresh icons after upgrade—without deleting a cache, changing pins, or touching user data. A dedicated transparent tray mark is packaged beside the app, so Close to tray stays crisp in the Windows notification area instead of falling back to a blank icon.
- **Fungist, Home, and onboarding test corrections** — Fungist’s pose artwork now resolves from safe packaged-app paths, so the companion appears instead of its fallback image text. His chat visibly explains whether a Gemini API key is ready and takes you to Settings when it needs setup. It is now a real local scrollable conversation: sent text clears immediately, both sides remain in history, the latest small chat context accompanies the next request, and Clear removes the local record. Fungist now speaks as a cheerful mystical Oracle—brief and direct unless you ask for depth. The refreshed tutorial actively tours the real Library, Preview, Tools, Visuals, Home, Game Ready, and companion surfaces. Settings now has a visual **NEO-LIB Mascot** picker with Fungist selected, a clear **Show NEO-LIB mascot** restore switch, and space for future companions; opening full mascot settings preserves visibility. Fungist now sits above Friends. Home uses deeper neutral-gray panels, darker blue/gold highlights, and a subtle dark text edge so coloured labels—including Game Ready CPU/RAM states—stay readable. Category and fixed interface labels now wrap at natural word breaks instead of hiding their final words.
- **Battle.net metadata resolver** — Battle.net’s shortened Windows display names are normalized against a safe Blizzard product map before metadata fetching, so known products use their canonical title and official page first. Low-confidence Steam/GOG/itch matches can no longer stop the automatic chain and attach unrelated metadata. If the first title fails, NEO-LIB automatically tries local executable/folder/readme clues, then public sources and optional Gemini. A confirmed text-first result receives one safe public-page art pass for available cover, hero, background, and gallery images—never invented artwork.
- **Final v1.7.3 polish pass** — Home’s gray/blue/gold balance is richer and its text edge is stronger; Fungist gains livelier but lightweight idle animation and a clean transparent sleep pose; the guided Visuals state closes cleanly; and the Library now has a Categories/Flat List switch that never exposes locked Private games. When an independent install hides its own version but a trustworthy public patch page reveals a newer release, NEO-LIB shows an amber **comparison needed** card with Patch History instead of falsely declaring an update or “up to date.”
- **A living rest state** — sleeping Fungist now has a slow transform-only breathing loop, quiet aura pulse, and drifting `zZz`, keeping him alive without a GIF/video decoder or background particle system. It stays fully disabled in NEO-LIB Rest Mode.
- **Genre Intelligence v2** — a broad label is no longer treated as a finished identity. NEO-LIB retains up to thirty direct Steam community tags, remaps existing evidence through a richer exact-match taxonomy, and derives only transparent combinations such as Sandbox + Building → Sandbox Builder or Roguelike + Dungeon Crawler → Roguelike Dungeon Crawler. Auto-sort and Tidy Up can now run an approval-first **Enrich source tags** pass. It never mines loose description text or changes your Library categories.
- **Update evidence recovery** — if a standalone game does not expose its version in its own bounded files, NEO-LIB can read the Windows executable version resource as a local clue. It may surface a public patch for comparison, but never marks a game current or confirms an update from that weak clue alone.

### v1.7.2 — Released This Week · selective major-release discovery

- **GPU setup assistant** — on first desktop launch, NEO-LIB reads Windows’ normal graphics-adapter list and adds GPU-Z, CPU-Z, and a detected NVIDIA/AMD/Intel control-centre shortcut to a Hardware & graphics Tools group. If no local vendor centre is found, it uses Windows Graphics Settings instead—no driver, registry, or GPU setting is changed.
- **Locate or install GPU-Z / CPU-Z** — missing utilities are visibly muted with a clear setup state. Select one for a compact Locate or Install menu: Locate validates the chosen executable; Install starts only after your click and uses the official publisher source. GPU-Z is placed as its portable executable; CPU-Z opens CPUID’s normal visible installer, never a silent install.
- **Optimize Center** — a new bottom-right Optimize button beside CPU/RAM opens an animated two-part dashboard. Speed Up Gaming shows top CPU and memory processes, GPU activity and responsible programs where Windows exposes them, plus Game Mode, GPU scheduling, capture, power-plan, and restart checks with clear pros and trade-offs. Protected Windows/NEO-LIB processes cannot be closed, and NEO-LIB never applies hidden registry tweaks.
- **Inspection-first cleanup** — Safe Junk Review scans only known temp/crash locations and folders beside configured games for old logs, dumps, caches, and large forgotten installers/archives. Every exact file links to its folder, requires inspection plus two confirmations, then goes to the Windows Recycle Bin. No whole-drive scan or recursive folder deletion is used.
- **Post-play ratings + visual Preview news** — meaningful sessions can gently request a precise one-decimal private rating, with snooze and never-ask choices. Game Preview news now uses feed artwork when present and falls back through the game’s existing hero, background, screenshot, and cover.
- **Current development pass** — Rating System v2 resets legacy personal ratings once and shows true fractional star fills; Battle.net titles get official-page metadata; provider tags such as Third-Person Shooter and Action Roguelike stay visible alongside core genres; and independent games can derive a local version from bounded nearby version/readme/changelog files before comparison with a public official/watch page.
- **Background update scan** — version evidence now warms shortly after startup and after launching a game, using local launcher manifests, saved version data, executable/folder clues, and bounded nearby Version/Changelog/Readme/Config files. Verified updates blink in Preview above game news; checks use a polite small queue and short cache.
- **Update checklist + Library precision** — conclusive results are saved locally as current, pending, available, or needs-evidence, so updated games leave Home/Preview alerts automatically. The first-game gap can now become cleanly compact, category Backdrops scale with label size, and a first window starts at 75% width by 90% usable height before restoring user bounds later.
- **External-launch Rest Mode detection** — NEO-LIB can identify a known local game launched through Steam, Battle.net, Epic, or another client by its ordinary Windows process path. Idle launchers do not count; there is no injection, overlay, memory inspection, or credential access. The current high-use flow offers a clear one-game Rest Mode choice before NEO-LIB pauses.
- **Storage Control fix** — scans ignore launcher URLs, measure shared install folders once, remain visible when returning to Home, and walk up to three configured game folders in parallel. NEO-LIB never scans entire drives.
- **New Mid theme: Home** — a welcoming light-gray workspace with crisp black/white structure, light-blue edge lighting and FX, plus a warm yellow/gray comfort blend pattern.
- **New quick-start tutorial + hover help** — a concise current first-run guide now covers importing, Hidden privacy, Home, game controls, customization, and Rest Mode. Hold over described controls for one second to see a theme-aware explanation.
- **Home and Friends polish** — Top 5 Played is a centred fixed feature; detailed Library Health stands on its own; live Home reordering previews placement while you drag; What should I play? uses larger, more explanatory cards; and Friends is larger, easier to read, and slightly less transparent. Generic Gray and Generic Blue are now Mid themes, with Generic Blue made lighter.
- **Released This Week** — a rearrangeable Home pane identifies notable full-game launches from the past seven days. Each card shows artwork, Steam source, official release date, and why it qualifies.
- **Selective by design** — NEO-LIB verifies each candidate's real store date, then requires meaningful early player, review, or launch-reach signals. It avoids padding the feed with low-visibility uploads.
- **Transparent and light** — the feed explains its criteria, uses a six-hour cache plus a manual refresh, and opens official store pages. No account access is required.
- **Safer Steam matching** — launcher imports keep Steam’s exact local app ID and manifest title authoritative, so delisted titles that vanish from Store search cannot be replaced by a fuzzy, unrelated match.
- **Home cleanup** — My Best Games is top five by personal decimal rating; Library Health is compact and clickable; Top 5 Played and Recent Sessions have distinct jobs; and Gaming Chronicle is an informative, scrollable history.
- **Theme cleanup** — new Special Generic Gray and Generic Blue themes join a sharper Midnight, danger-bright Industrial, slate/red Modern, warm-sunrise Daybreak, and clearly organic Mint Garden.
- **Shell polish** — Friends lives at the far right of the permanent sponsor rail, Coffee remains readable on light themes, and Tools uses a utilities icon rather than a settings-like wrench.
- **Genre Intelligence — foundation** — refreshed metadata now keeps direct provider genres intact while building a separate, exact-match identity profile for core genres, specific subgenres, playstyle, perspective, and themes. Steam refreshes can use official categories plus cached, rate-limited Steam community tags; this never changes a user’s Library categories. Auto-sort now recommends at most six evidence-backed collections and never scans descriptions for loose genre words.
- **Review what is new** — add-from-match and metadata refresh now use the approval popup before writing. Newly detected fields, including the structured game identity, are green and labelled **NEW**; Genres controls whether that identity is applied.
- **Wizard identity review** — each folder-scan match now previews its detected core genres, subgenres, playstyle, perspective, and themes in a green **NEW** panel before acceptance. Those direct source tags are saved with the game; they do not create or alter Library categories.
- **Preview-pane refinement** — genres now live in their own theme-responsive vertical identity card; supporting actions are grouped into a calmer menu beside Launch, and developer / publisher / release / score details read as a clean list.
- **Released This Week fallback** — major releases remain the first choice. If none clear the strict threshold in a quiet week, Home automatically shows only verified semi-major releases with real early momentum and labels the switch clearly.
- **Library identity repair queue** — Tidy Up can walk through every game missing an identity, tracking repaired and skipped games. The finder offers title clues from the executable, nearby folders, and bounded local README/title fields, then sends every chosen match through the green **NEW** approval screen before saving.
- **Update Intelligence · Steam foundation** — Home and the game preview now report concrete pending Steam downloads from local launcher manifests, including remaining size and a safe handoff to Steam Downloads. NEO-LIB never changes the queue and never guesses from ambiguous flags.
- **Independent-game update watch** — Customize can store an installed version and a public official/itch/forum update page. NEO-LIB checks only explicit `Version`, `Build`, or `vX.Y` labels, alerts only when a higher version is found, and links back to the chosen source without downloading anything.
- **In-app patch history** — independent-game alerts now open a read-only NEO-LIB history window first, listing explicit version entries, dates when available, and which releases came after the installed copy; the full chosen source remains one click away.
- **Consistent native launcher imports** — first-time detection, background refresh, and the Wizard now use the same Steam, Epic, GOG, EA, Ubisoft, Battle.net, Riot, Xbox, Rockstar, and itch.io adapters, retaining each launcher’s executable, product ID, version, source, and category identity.
- **Honest launcher identity** — Home platform labels and the expanded launcher filter use the game’s actual launcher, never a metadata app ID, so standalone/repack games remain local even when Steam supplied their artwork.
- **Predictable dialog dismissal** — standard dialogs and the custom metadata/Tidy/What’s New surfaces close with one outside click as well as Escape or their close control.
- **Native GOG import** — the Wizard now reads installed GOG games from the Windows registry, finds a likely primary executable without deep-drive scanning, preserves the GOG identity, and creates the proper GOG Library category.
- **Native EA/Origin import** — installed EA App and legacy Origin games can now be read from their local Windows installation records, deduplicated by launcher product identity, and grouped under a proper EA category.
- **Native Ubisoft Connect import** — installed Ubisoft games are now read from local launcher registry records, retain their Ubisoft product identity/native launch URI, use bounded executable discovery, and join a proper Ubisoft category.
- **Native Battle.net import** — installed Blizzard games are discovered through verified Windows installation records, excluding the launcher itself, with version/product identity, bounded executable selection, deduplication, and a Battle.net category.
- **Native Riot import** — installed Riot games are now read from bounded local product metadata, excluding the client itself while preserving product/version identity, configured launch targets, deduplication, and Riot category grouping.
- **Native Xbox/Game Pass import** — NEO-LIB now checks bounded `XboxGames` roots and each title’s `MicrosoftGame.config`, preserving Store identity and configured executable information without enumerating unrelated Microsoft Store applications.
- **Native Rockstar import** — installed Rockstar games are now discovered through verified Windows installation records while launcher/Social Club/support components are excluded, with version/product identity and category grouping preserved.
- **Native itch.io import** — configured itch desktop install locations are read locally and bounded to completed-install receipt markers. NEO-LIB does not access itch’s live catalog database or copy account data.

### v1.7.1 — Home intelligence · safe save backups · play suggestions · storage · Chronicle

- **Library Health** — a colour-coded score highlights metadata gaps, missing launch targets, and duplicate candidates, with a direct path into Tidy Up.
- **Richer Home** — larger news cards use game artwork where available and Top 5 gains cover art, platform, and playtime.
- **Home you can arrange** — drag Home panes into your preferred order, hide a pane from its hover control, and restore any hidden pane from the Home header. News now opens in NEO-LIB first with a clear Full story link, and **My Best Games** compares your top ten personal ratings with Metacritic where available.
- **Cleaner shell** — Friends lives as a substantial action in the selected game’s preview pane; Coffee joins Discord in the title bar; Settings follows Visuals in Library controls; and Refresh/Tidy lives beside Auto-sort. The sponsored rail is now always present, centred, slightly taller, and no longer dismissible.
- **Smarter Game Ready** — yellow begins at 65% and red at 85%; the Library can scroll fully above its footer.
- **Rest Mode while gaming** — enabled by default for games launched through NEO-LIB. It temporarily pauses ambience, animations, UI sounds, local health polling, launcher scans, news/deal checks, and social refreshes, while keeping the app ready to return to normal the moment the game closes.
- **Save Game Folder + safe backups** — a detail-page button and library right-click action let users choose and open a save folder, search a chosen drive/folder for name-matched older save candidates, create local NEO-LIB backups, and recover them safely. NEO-LIB never overwrites a non-empty live save folder; it offers a separate restored folder instead.
- **What should I play?** — Home suggests an updated game, a forgotten rated favourite, or a fresh unplayed addition using only the user’s local library and already-fetched news.
- **Storage Control Centre** — an explicit, read-only Home scan measures game folders and conventional mod/workshop folders, showing the largest entries without background drive crawling.
- **Gaming Chronicle** — a private Home timeline records games added, played, rated, and recently updated.
- **Launch Doctor** — only after repeated immediate failures/very short launches, NEO-LIB checks the configured executable and offers nearby candidates for review. It changes nothing automatically and gives cautious antivirus-quarantine guidance rather than making assumptions.
- **Theme ambience variation** — each theme now gives the shared particle system a different visual language: stars, bubbles, embers, pixels, pollen, rays, ink flecks, dust, prism motes, or metal sparks, while staying tied to the Effects intensity control.
- **New chimes and textures** — Aurora, Ember, and Harbor sound packs; plus Weave, Brushed, and Stardust Visuals textures. Brushed replaces the earlier Topography tile with a seamless material finish.
- **Theme polish** — Anime gains original manga line art plus a pink-forward/violet palette. Pro is renamed **Industrial**, with graphite, safety yellow, burnt orange, lively safety-light effects, and no CRT scanlines.
- **Category marker fix** — `None` now removes both the dot and backdrop as intended.
- **Library Health and saves** — Review issues now opens the actual affected games, and Save Game Folder checks common local locations plus Steam Cloud's local mirror without changing anything until you choose a folder.
- **Visuals reorganisation** — Object sizes, Text & category, FX, and Layout groups replace Quick presets. Icon position and category marker style are discrete sliders; the category Backdrop mode scales its translucent strength with Category glow.

### v1.7.0 — Friends Hub · Local launcher status · Safe native social handoff

- **Friends Hub** — a compact, theme-aware top-right panel detects Steam, Battle.net, Epic, EA app, and Ubisoft Connect locally.
- **Setup that recovers gracefully** — the panel scans on open, distinguishes running / installed-but-off / not found states, and lets you locate a custom launcher executable once for future use.
- **Theme artwork pass** — Anime now carries an original transparent manga-inspired scene behind the glass UI; Gaming and Modern receive their own arena and editorial ambient treatments. All respect Effects intensity.
- **Every theme illustrated** — every theme now has its own original, low-opacity background motif; the Effects intensity control remains the master dial.
- **Home Hub** — Home replaces the floating News and Stats panels with a full right-pane hub: date-sorted scrollable game news, Today / Week / Month activity, Top 5, and cover-led recent activity. One compact, labelled sponsored rail replaces the old activity deck and large featured banner.
- **Cleaner controls** — Settings, feedback, and Discord now live beside the version in the title bar, so the Library / Tools / News / Stats tabs keep their labels. The sidebar's compact **+ Add** menu now contains both Add game and Add category.
- **Responsive sidebar labels** — toolbar text now scales down smoothly while resizing, becomes icon-only before it is unreadable, and scales back in when space returns.
- **Safe native handoff** — each platform opens in its original client; NEO-LIB never reads launcher credentials, cookies, friend lists, or private chats.

### v1.6.4 — Genre hide fixed · Chromier toolbar · Column switcher in Visuals · Launcher dropdown · Vertical themes · Gold shimmer · Warp sci-fi sound · Range-aware Most Played · Webhook secured
- **🔴 Fixed:** the "hide genre strip under game names" toggle now actually hides the chips (prop wasn't being forwarded from `Section` to `GameRow`).
- **Toolbar chrome darker** so tab pills and the row-2 toolbar read as chrome instead of blending with game rows.
- **Background textures** no longer overlay hero banners / preview screenshots — moved inside the sidebar body only.
- **Column layout switcher** moved from row-2 toolbar into the Visuals popover (Layout section).
- **Launcher filter → compact dropdown** ("▾ All launchers"). Six pills collapsed to one control.
- **Renamed "+ New" → "+ Category"** for clarity.
- **Theme picker restructured** to vertical layout, groups ordered Bright → Middle → Dark → Special.
- **5-star favourites** get a subtle animated gold "electric" shimmer border.
- **Sci-fi sound pack rebuilt** as a "warp punch" (FM zap + noise burst on launch).
- **"Most played · This week/Month/Year"** ranks correctly — daily playtime snapshots stored in `playtime-history.json` power range deltas.
- **🔒 Rotated leaked feedback webhook** and removed the hardcoded fallback URL from source. CI-built .exe releases will show "not configured" for feedback until a signed relay is set up.

### v1.6.3 — Fixed: phantom hours on non-Steam games · Aligned toolbar · Textures visible · Louder Special themes
- **🔴 Fixed:** Hellclock / Solarpunk (and other non-Steam games) getting 500+ phantom hours after a Steam import. localconfig.vdf is no longer treated as an ownership signal — only sharedconfig.vdf and installed appmanifest_*.acf count. Apply now double-checks ownership even when the user hits "Select all".
- **Fixed:** background textures were invisible behind the frosted library. Texture layer now paints on top via `mix-blend-mode: overlay`. Opacity slider bumped to 0–100%.
- **Toolbar alignment** — Feedback pill matches the Library/Tools/News/Stats/Settings row height. Tab & sidebar icons enlarged ~20%.
- **Renamed** "Add" → "Add Game".
- **Moved** Playtime toolkit out of the Visuals menu — now exclusively in the Stats panel.
- **Special themes turned up** — Colorful gets a slow-rotating conic prism aura + denser twinkle field; Pro gains hazard-chevron march, brushed-metal sheen and corner emergency pulses.
- **Theme picker readable again** — swatches enlarged, labels bumped to 11.5px.

### v1.6.2 — Fixed: Steam hours after Reset · Select-all bulk
- **🔴 Fixed:** after Reset, Steam hours never came back. Bulk reset was stamping every game with `playtimeManual: true` — which then locked them out of every future Steam import. Bulk resets now explicitly clear `playtimeManual`, so a Reset → Select all Steam-owned → Apply flow actually pulls Steam values in again.
- **Fixed:** "Select all Steam-owned" and per-row Apply no longer refuse to override `playtimeManual` when you explicitly check the row. Your intent wins.
- **New:** gradient **"✓ Select all"** bulk button — marks every row for apply in one click. Steam-owned rows pull Steam hours, others get their current value written back cleanly. Companion **"Deselect all"** button too.
- **Renamed:** previous button to **"✓ Select Steam-owned only"** so the two are unambiguous.

### v1.6.1 — Ownership rewrite · Bulk playtime actions · Modal fixes · Feedback works in CI
- **Fixed:** 🎯 **Steam ownership detection.** v1.6.0 parser used a non-greedy regex that broke on nested `cloud`/`autocloud` blocks in `localconfig.vdf` — most games came back "unowned". Also only scanned the main Steam install's `steamapps/` for `appmanifest_*.acf` — **games on secondary drives (like Icarus on a D:\ library) were completely missed**. Rewritten with proper brace-matched parsing + walks `libraryfolders.vdf` to scan every Steam library folder on every drive.
- **Fixed:** 📋 **Import preview modal usability.** Checkboxes for "unowned" rows were disabled — you couldn't do anything. Refresh buttons were passive. Both work on every row now.
- **New:** 🚀 **Bulk actions in the import modal:**
   - `✓ Select all Steam-owned` — one click to accept all legit Steam merges
   - `⚠ Zero all unowned` — wipes the phantom hours from pre-v1.6 bugs on games that aren't in your Steam ownership set
   - `💥 Reset all to 0` — nuclear option to clean years of corrupted data
   - `🔄 Re-fetch all from Steam` — force a fresh scan
- **New:** 🎛️ **Playtime toolkit shortcut** in the Visuals menu — opens the import modal from outside the Stats panel so you can actually find it.
- **Fixed:** 💬 **Feedback pill in shipped .exe builds.** Webhook URL was gitignored so CI-built releases showed "not configured". Added a hardcoded fallback alongside the env variable.
- **New:** 🔍 **Debug info** in the import modal header — hover the `(?)` to see source counts (sharedconfig / localconfig / manifests / library folders scanned).

### v1.6.0 — Playtime import preview · True Steam ownership · Manual override · Safer reset
- **New:** 🎯 **True Steam ownership.** NEO-LIB now derives ownership from Steam's OWN signals for the currently signed-in account only: `sharedconfig.vdf` (owned/tagged appids) + `localconfig.vdf` (played appids) + installed `appmanifest_*.acf` files. Games with an `appid` in metadata but NOT in that ownership list — **pirated repacks, manually-added games, games from other Steam accounts on the same machine** — are treated as local-only. They no longer get Steam hours merged in and no longer wear the `[STEAM]` chip.
- **New:** 📋 **Playtime import preview modal.** Every import (from Stats panel or right-click "Re-import from Steam") opens a scrollable preview showing: signed-in account name · every game with current vs Steam hours · ownership badge · per-row toggle · per-row refresh · per-row **manual override**. Nothing writes until you click Apply.
- **New:** ✏️ **Manual playtime override.** Click any game's hour cell in the preview modal, type your own number in minutes. The game gets tagged `[MANUAL]` and is skipped by all future Steam imports so you're never overwritten again.
- **New:** 🎮 **Only signed-in Steam account is imported.** NEO-LIB reads `loginusers.vdf` → `MostRecent=1`. Multi-account shared machines no longer bleed playtime across users.
- **Improved:** 🛡️ **Safer Reset playtime.** Right-click Reset now shows the exact current hours, explicitly notes that Steam records are never touched, and requires typing `RESET` for values > 100 hours. Also clears the `playtimeManual` flag.
- **New:** 🏷️ `[MANUAL]` source chip appears beside game names anywhere playtime is shown when the user has manually overridden it.

### v1.5.0 — Feedback pill · Rate this update · Playtime source tags · Reset & Re-import
- **New:** 💬 **Feedback / Bug / Suggestion pill.** A very visible neon pill next to Stats & Settings, plus three shortcut buttons (🐛 Bug · 💡 Idea · 💬 Say hi) inside the Visuals menu. All post straight to a Discord webhook — no signup, no email. App version, theme, and platform auto-attached so bug reports come pre-diagnosed.
- **New:** ⭐ **Rate this update.** A three-emoji reaction (😍 😐 😕) at the bottom of every "What's new" changelog modal. One tap fires to the same Discord webhook.
- **New:** 🏷️ **Playtime source tags.** Steam-imported hours show a small `[STEAM]` chip beside the game name in the Sidebar and the Stats ranking. GOG / itch / Epic / EA / Ubisoft tags too. Locally-tracked games show no tag — instantly see which hours came from an import vs local sessions.
- **New:** 🔄 **Reset playtime.** Right-click any game → "Reset playtime to 0". Wipes local tracking; Steam re-populates on next Stats-panel open.
- **New:** 🔁 **Re-import from Steam.** Right-click any Steam game → pulls the latest `localconfig.vdf` playtime for that appid and overwrites the local value.
- **Under the hood:** Webhook URL lives in `desktop-app/.env` (`VITE_FEEDBACK_WEBHOOK_URL`, gitignored). `.env.example` template committed for forks.

### v1.4.0 — Star ratings · Startup intro · News alerts · Textures · Playtime fix
- **New:** ⭐ **5-star ratings.** Click stars at the top of any game's preview to rate it 1–5. Games rated 5⭐ get a subtle warm-gold gradient wash behind their name in the library. Rating is preview-only — never clutters the sidebar.
- **New:** 🧭 **Sidebar reshuffle.** Settings moved into the top TabPill row next to Stats (cog-wheel button removed from the mid toolbar). Sliders renamed to **Visuals** — wider, more prominent pill.
- **New:** 🎨 **5 background textures.** Grain · Grid · Diagonal · Hex · Dots — each with a transparency slider, all inside the Visuals popover. Adds subtle depth behind the library.
- **New:** 🎬 **Startup intro.** 3-second synthwave logo reveal with a WebAudio-synthesized "hook" jingle on every boot. Skippable by clicking anywhere. Muted if UI sounds are off.
- **New:** 🔔 **Watched-game news alerts.** For favorited (pinned) OR 5⭐-rated games, NEO-LIB polls news once per hour and pops a center-screen alert with soft chime when something new lands. Click outside to dismiss, "Read news" opens the article.
- **New:** 🏆 **"This Week" showcase = most-played** (regardless of current showcase mode). This Week & This Month tiles show a gradient hours-played badge in the top-right corner.
- **Fixed:** 🐛 Playtime numbers. The `playtime` field is now consistently stored in **minutes** across the entire app. `formatPlaytime()` was interpreting values as seconds while everyone else stored minutes → wildly inflated readouts. Game-exit tracking also fixed to convert seconds → minutes on write.
- **Fixed:** News modal now dismisses on click-outside.
- **Fixed:** Category-dot toggle in Visuals now also affects the category header itself. When hidden, a colored backdrop stripe replaces the dot so the category identity signal stays visible.
- **Fixed:** Drag-and-drop reorder in Uncategorized. Now uses an explicit `__uncat__` sentinel in the drag-data.
- **Improved:** Theme picker — 6/7-column tile grid, ~50% smaller. All Settings > Visual effects controls collapsed to a redirect hint; the actual controls live in the sidebar Visuals popover in a compact CSS-columns masonry.

### v1.3.1 — Compact theme picker · Gradient swatches · Sidebar reshuffle
- **New:** 🎨 **Compact theme picker.** Settings > Theme is now a tight 4/5-column tile grid with icon-first swatch and label under. Roughly half the vertical space, no info lost.
- **New:** 🌈 **Gradient theme swatches.** Every theme button now shows a real `linear-gradient(surface → accent → accent-2)` blend of the actual palette. No more misleading flat pink dots — you can eyeball each theme's mood before switching.
- **New:** 🧭 **Sidebar reshuffle.** Launcher filter row (All / Steam / Epic / EA / GOG / Other) moved **below** the Add / Wizard / Settings toolbar. Auto-sort and New-category buttons joined that same row on the right side. One fewer strip of vertical space wasted.

### v1.3.0 — Theme park rebalanced · Real Steam playtime · Sub-cat toggle fixed
- **New:** 🎨 **Themes rebalanced — less pink, more variety.** Vaporwave Day → vivid purple + teal on lavender wash. Daybreak → deep teal on warm paper. Gaming → Twitch-style vivid purple + electric blue. Anime → sorcerer purple + electric blue + neon green (kept the JJK Gojo vibe). Synthwave and Colorful keep their signature pinks; the palette now covers purple / teal / blue / black / orange evenly.
- **New:** ⏱️ **Real Steam playtime import.** Stats panel now reads `userdata/<steamid>/config/localconfig.vdf` on open and merges Playtime + LastPlayed for every appid, across every Steam account on the machine. 100% offline, no API key, works even signed-out. 5-min cache with a manual re-import button.
- **New:** 🏆 **Stats ranking icons.** Every ranking row now shows Steam capsule / cover / initials fallback.
- **Fixed:** Sub-category toggle now propagates through the 2-column sidebar layout (previously only worked in single-column mode).
- **Fixed:** Non-Steam games with an accidental appid are no longer bucketed under Steam. Client attribution is now `source > appid > website > local`.

### v1.2.9 — Stats tab · 2 Special themes · Text-size slider · Sub-cat toggle · 3 sound packs
- **New:** 📊 **Stats tab** in the top toolbar — connected clients breakdown (Steam / GOG / itch / EA / Ubisoft / Epic / Battle.net), most-played ranking filtered by week / month / year / all time, total hours, and a Link Discord button. Not a social profile, just numbers.
- **New:** 💫 **Two Special themes** — `Colorful` (pink + blue + carbon-black + textured-white with sparkles + shooting stars) and `Pro` (dark industrial gray with orange edge glow + brushed-metal texture + sweeping scanline). Both spawn 1.5× particles.
- **New:** 🎨 **Sidebar tint** — subtle per-theme accent wash behind the library for readability.
- **New:** Independent text-size slider (game name font 9-22px, decoupled from icon size).
- **New:** Sub-category strip toggle — hide the "Action, RPG" genre badges separately from the category dot.
- **New:** News popup anchors next to the News button instead of the far right.
- **New:** 🔊 Three new sound packs — `Crystal` (glass ping), `Cyberpunk` (glitch pop + noise), `Bubble` (soft plop).

### v1.2.8 — Tidy Up bug fix · Sliders portal · Every theme animated · Draggable news · 2-col Settings
- **🔴 CRITICAL FIX:** Tidy Up "remove duplicates" no longer wipes out your entire Steam library. Over-eager rule that clustered every game sharing `Steam\steamapps\common\` has been dropped; cluster-size safety cap added.
- **New:** Sliders popover portaled to `document.body` + fully opaque — always floats above the game preview.
- **New:** Every theme now animates — particles + edge glow apply to synthwave, midnight, ocean, crimson, anime, mint, gaming, modern and any future theme automatically.
- **Polish:** Latest news pill = animated border pulse + diagonal shimmer sweep + thicker accent border + bigger blinking dot.
- **New:** News popup draggable by its header (grip cursor). No backdrop overlay — clicks outside pass through.
- **New:** Settings modal is now 2-column masonry (CSS columns). Theme picker stays wide at the top, everything else tiles.

### v1.2.7 — Category dot fixed · Effects moved · Time-bucketed showcase · Snappier news
- **Fixed:** Category dot toggle now hides both the meta dots AND the category header dot.
- Sliders popover z-70 (was 30) — floats above the GameDetail hero.
- **New:** Effects intensity slider moved from Settings to the Library sliders popover; Max level now genuinely maxed (64 particles, drifting radial blobs, pulsing viewport edge glow).
- **New:** Full-width latest-news pill in GameDetail — LIVE label, gradient tint, big blinking dot, gradient "Read full" CTA.
- News popup snappier — 220ms → 140ms, no darkening backdrop, top-right notification-tray position.
- **New:** Time-bucketed Showcase strip — This Week (72px tiles) · This Month (56px) · Long Ago (44px icon-only w/ hover tooltip) based on `lastPlayedAt`.
- **New:** Unread news badge (pulsing red) on the sidebar News tab.

### v1.2.6 — Live news pill · Ubisoft deals · Frosted panels · Per-theme effects · Toolbar refresh
- **New:** 📰 **Live "Latest news" pill** in every GameDetail — pulsing indicator, platform label, click-to-expand snippet, "Read full" deep link. 15-min compact cache.
- **New:** 🛍️ **Ubisoft deals** scraped from `store.ubisoft.com/us/deals` — 6 titles per fetch (images + links, prices skipped since Ubisoft loads them via JS). Wrapped through Skimlinks.
- **New:** Global `.glass` / `.glass-soft` / `.glass-strong` CSS utilities — applied to sidebar, GameDetail About/gallery, ShowcaseStrip tiles, DealsBar.
- **New:** Sidebar top tabs rebuilt as a proper frosted toolbar — bigger icon tiles, active-state gradient, bottom accent line.
- **New:** Effects intensity slider now stores per-theme values in `settings.effectsLevelByTheme`.

### v1.2.5 — Installer fix · Deals expansion · News popup · Effects dial
- **🔴 Fixed:** Installer "run after install" bug. Replaced flaky `MUI_FINISHPAGE_RUN` checkbox with a custom NSIS `installer.nsh` hook that ExecShells the app from `customInstall` — guaranteed non-elevated launch after files are copied.
- **New:** Deals expanded — GOG discounted catalog (up to 12 items, 40%+ off) and Fanatical `stardeal` (covers EA/Ubisoft titles).
- **New:** Platform badge overlay on every deal card — STEAM / EPIC / GOG / IG / FAN with brand-matched gradients.
- **New:** News tab converted from full-panel replacement to a floating modal (portal + backdrop + Esc/X/backdrop-click to close).
- **New:** Effects Level slider (5 discrete stages: None / Low / Medium / High / Max) — scales particles, sakura, and overlay opacity together.

### v1.2.4 — Build IDs, itch devlogs & GOG patch notes
- **New:** Steam manifest reading — every Steam game shows "Updated N days ago · Build 12345 · X GB on disk" below the exe path.
- **New:** itch.io devlog RSS support — any game whose `website` matches `*.itch.io` now surfaces its devlog updates.
- **New:** GOG changelog reader — parses the last 14 days of changelog sections from `api.gog.com/products/<id>?expand=changelog`.
- **New:** Feed toggle bar auto-adds `itch devlog` and `GOG patch` pills.

### v1.2.3 — Steam News, live feed
- **New:** 📰 Full Steam News implementation via `ISteamNews/GetNewsForApp` — 14-day window, 30-min cache, parallel batches of 8 games.
- **New:** Feed classifier groups items into Official / Community / Third-party with per-feed toggles and live counts.
- BBCode/HTML stripped, 320-char snippets, click-to-open on Steam.

### v1.2.2 — Fixes + Tidy up + News placeholder
- **New:** Tidy Up modal — duplicate finder with side-by-side compare (later revamped in 1.2.8).
- **New:** News tab placeholder — implemented for real in v1.2.3.

### v1.2.1 — Community access
- Community access polish and infrastructure prep for the deals / news expansion.

### v1.2.0 — Unified multi-source metadata fetch picker
- **New:** Dedicated buttons in the metadata picker for Steam / Epic / GOG / itch.io / VNDB / DLsite / DuckDuckGo / Google — pick your source instead of relying on the auto-chain.
- **New:** Smart query seeding — when you open the picker, NEO-LIB auto-fills the query from the exe name + parent folder (strips version tags, x64, repack noise).

### v1.1.4 — Tray mode + Featured banner
- **New:** Close-to-tray behavior — hitting X on the window minimizes to the system tray instead of quitting (opt-in via Settings). Tray icon with Show / Quit context menu; left-click toggles the window.
- **New:** Slim "featured" deal banner (56px) above the Deals bar — rotates hot Instant Gaming deals for extra visibility.

### v1.1.3 — More deals (revenue), still subtle
- **New:** Instant Gaming scraper added with regex-based parsing and defensive try/catch.
- Steam deals supply bumped 8 → 15, discount threshold relaxed 25% → 20%.
- **New:** "All N" popover in the Deals bar — see every current deal in a compact grid.

### v1.1.2 — What's-new toast
- **New:** Changelog modal auto-opens 2.2s after boot when a new version is detected. Skipped on first-ever run (tutorial owns that moment).

### v1.1.1 — Polish & QoL
- **New:** Per-game ambient backdrop tint from the selected game's hero image (subtle wash, never overpowers the theme).
- **New:** Deep Scan toggle in the Wizard for exhaustive folder recursion.
- **New:** Drop-folder auto-scan and selective metadata accept.

### v1.1.0 — GameDetail rework + accept-before-add preview
- **New:** 🖼️ **GameDetail layout redesign.** Hero banner shrunk by ~35% (aspect 16:2.1 vs old 16:3.2) to free up vertical space. Below the hero is now a true two-pane layout:
  - **Left pane (scrollable)** — About text + Developer/Publisher/Released/Metacritic cells + executable path footer. Has its own scroll independent of the page.
  - **Right pane (gallery)** — One big screenshot preview that swaps when you click any thumbnail below. Active thumb gets an accent ring + offset, inactive thumbs dim to 55% opacity. Smooth motion fade on swap.
  - Both panes have `bg-panel/30` glass cards with hairlines so they feel like proper boxes.
- **New:** ✅ **Accept-before-add modal.** Right-clicking → "Refresh info" no longer silently overwrites your game's metadata. Instead, NEO-LIB opens a side-by-side preview showing **current vs proposed** values for name / release / developer / publisher / genres / description / hero banner / screenshots. Differing fields glow with an accent ring. Three actions:
  - **Accept** — applies the patch
  - **Try again with a different name** — re-runs the fetcher with whatever you type (great for indie games NEO-LIB matched to the wrong title)
  - **Cancel** — leaves your current data untouched
  - Plus an **Open source** button if the result has a `website` (opens DLsite / itch / Steam page in your browser)
- **Bulk refetches** ("Refresh all" + silent launcher auto-import) still apply without prompting — only interactive single-game refetches show the modal.

### v1.0.9 — Crash fix · stronger fetcher · anime overhaul · hero auto-brighten
- **🔴 Fixed:** Right-clicking a game no longer blanks the entire app. Root cause was a missing `isPinned` prop in the game-row context menu (introduced in v1.0.8 prep) → `ReferenceError` crashed the whole React tree.
- **New:** 🎨 **Anime theme overhaul.** Replaced the old soft-sakura pastel palette with a bold modern anime aesthetic: deep magenta + electric blue + neon green on dark indigo void, plus a new diagonal "speed lines" ambient pattern (very Jujutsu Kaisen / Demon Slayer). Distinctively different from Vaporwave-Day now.
- **New:** 🌒 **Smart hero auto-brighten.** Loaded hero banners are sampled (16×16 luminance read via canvas) and if too dark → automatic `brightness(1.22–1.45)` + contrast lift is applied so titles always stay readable. Ultra-bright covers (white anime keyart) get a tiny dim. Cyberpunk-poster style problem solved.
- **New:** 🔍 **Much stronger metadata fetcher** — added FOUR new sources:
  - **DLsite** (`RJ#####` / `VJ#####` / `BJ#####` code lookup) — deterministic 100%-precision match for Japanese indie / RPG-Maker / RenPy games. Folder names like "Lust Room RJ01450973" resolve instantly.
  - **VNDB** (visual novel database) — authoritative public API for VN metadata.
  - **Ryuugames** — covers + descriptions for adult-VN releases that nothing else indexes.
  - New chain: **DLsite-code → curated → Steam → GOG → itch.io → VNDB → Gemini → Ryuugames → Web×6-variants**
- **New:** 💸 **Instant Gaming affiliate routing live.** Any instant-gaming.com URL in the deals strip now appends `?igr=gamer-1485e8f` (3% commission). Awin publisher ID `2935955` is also baked in — activates per-merchant as you join Fanatical/GMG/etc.

### v1.0.8 — Pinned games, auto-update, smarter refetch
- **New:** 📌 **Pinned games strip.** Right-click any game → "Pin to top (max 5)". A new full-width strip lives above all categories — works in both single-column AND two-row layouts (always stays full-width above the column split). Pinned games show as 7px-tall pill cards with icon + name.
- **New:** 🆕 **Auto-update checker.** On launch, NEO-LIB pings the GitHub releases API and shows a gradient "v1.0.X" pill in the title bar if a newer release exists. Click → opens the release page. Cached for 6 hours so we don't hammer GitHub. Pill auto-hides when you're on the latest.
- **Improved:** ☑️ **Category-dot toggle now also hides the genre/playtime row** under each game name. One toggle, two visual cleanups — significantly denser library.
- **Improved:** 🔍 **Smarter refetch fallback.** When metadata search returns nothing, NEO-LIB now opens the Troubleshoot modal automatically instead of dead-ending on a toast. Web fallback also tries 6 search variants (original / cleaned / first-3-words / each + " game" suffix) before giving up — many more obscure indie games will resolve.

### v1.0.7 — itch.io support + smarter refetch
- **New:** 🎨 **itch.io is now a first-class metadata source.** When Steam and GOG can't find a match, NEO-LIB scrapes itch.io's search → grabs the top game's cover, description, creator, and screenshots. Critical for indie / Python / RPG-Maker / experimental games. Marked with `source: 'itch'`.
- **New:** Web fallback now tries up to **3 progressively-simplified search variants** instead of giving up after the first attempt. Strips `(v1.2)`, `[demo]`, `build 47`, alpha/beta tags from folder names, then falls back to the first 3 words. Far fewer "no results" failures.
- **New:** 🛡️ **"Refresh all" skips manually-edited games.** Anything saved via the new Edit Metadata modal (marked `manualOverride: true`) is protected from being clobbered by bulk refetches. Toast tells you how many were skipped. You can still refetch them individually if you change your mind.
- **New:** 📂 **Drag a folder onto NEO-LIB → Wizard opens pre-filled** with that exact root. No more re-picking the folder.

### v1.0.6 — Confetti, drag-drop & manual metadata override
- **New:** 🎉 Theme-aware sparkle bursts fire when you add a game, finish the Wizard, or run Auto-sort. ~32 particles with directional spread + gravity, colored from the live accent CSS vars — every theme has its own vibe.
- **New:** 📥 **Drag-drop installer.** Drop any `.exe`, `.bat`, `.cmd`, `.lnk` (Windows shortcut), or folder right onto the NEO-LIB window. Files instant-add with auto icon extraction. `.lnk` files resolve to their real target. Folders open the Wizard. Beautiful neon "Drop to add" overlay shows while dragging.
- **New:** 🎨 **Manual metadata override modal.** Right-click any game → "Details / edit cover" now opens a full editor for name, **icon (file picker)**, cover, hero image, background, description, genres, devs, publishers, release date, website, metacritic, **and screenshots** (one URL per line). Critical for itch.io / indie / Python games where Steam/Epic/GOG can't find a match. Saved games are marked `manualOverride: true` so future bulk refetches don't overwrite your edits.

### v1.0.5 — Polish round 1
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
