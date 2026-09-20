# NEO-LIB v1.7.8 — Architecture, Reliability & FiFi Hotfix Update

v1.7.8 keeps the complete v1.7.7 architecture and player-facing release intact,
then adds the following hotfixes and polish completed after that release.

## Hotfixes since v1.7.7

- Replaced Optimize's broad encoded PowerShell inspection with antivirus-friendly
  aggregate CPU/RAM sampling and a deliberate Windows Task Manager handoff.
- Added exact-title metadata recovery for difficult and delisted indie games,
  including joined-name expansion and official itch creator-page artwork/details.
- Made Preview hero banners brighter and more colourful without sacrificing title
  readability; moved developer, publisher, release date and website above the story.
- Cleaned provider markup, broken spacing and embedded store headings into readable
  descriptions without using AI to rewrite or invent text.
- Expanded Recent Game Releases across every supported launcher, prioritising major
  launches for 14 days while limiting smaller Steam-heavy catalogue entries to 5 days.
- Added the Monochrome white/gray/black Bright theme.
- Rebalanced the Mid theme group so Generic Blue, Gaming and Modern use lifted
  medium-tone workspaces beside Generic Gray and Home, instead of reading as
  extra Dark themes.
- Added Library icon-only mode, adjustable icon spacing/size/rows and a Visual Tweaks
  panel that opens beside the Library.
- Added personal-rating tags to Cover Wall.
- Kept mascot speech and interface elements readable when resizing the character;
  external-game alerts now explain and enter Rest Mode through a large central notice.
- Completed the recent FiFi switch, Home update-card and visual-polish follow-ups.
- Moved GitHub release publishing to the maintained Node 24 action runtime.

## Original v1.7.7 release notes

v1.7.7 was the largest internal and player-facing NEO-LIB update so far. It keeps
the local-first launcher you already know, but rebuilds the foundations beneath
Library, metadata, privacy, updates, launching, diagnostics and the interface so
future fixes and features have clear owners instead of accumulating in a few giant
files.

## Highlights

- **Monochrome** joins the Bright theme group: a crisp white, gray and black
  workspace with high-contrast controls, restrained geometric linework and
  grayscale ambient motion that still follows Effects intensity and Rest Mode.

### 🧠 A rebuilt foundation

- The architecture is now separated across Library state, metadata, providers,
  launching, storage, privacy, Windows services, interface composition and release
  tooling.
- All 85 renderer-to-Windows commands use one duplicate-safe registry across 28
  domains, with request and response validation at the native boundary.
- Library, settings and playtime use a versioned local document service with atomic
  saves, recovery copies, migration backups and preservation of private/custom data.
- Long-running work reports real running, completed, partial, cancelled, timed-out,
  unavailable and failed states instead of leaving unexplained endless spinners.
- A complete offline source gate checks 181 runtime files and 113 renderer modules
  before a release build can proceed.
- Optimize no longer launches an encoded PowerShell probe across processes, paths,
  GPU counters, WMI and gaming registry values. It now shows aggregate CPU/RAM only
  and sends per-program investigation to Windows Task Manager, avoiding the
  behaviour pattern reported by Bitdefender Advanced Threat Defense.

### 👾 Meet FiFi

- FiFi joins Fungist as a selectable local companion.
- Her layered rig blinks, breathes, looks around, moves fins and tendrils, reacts to
  launcher events and uses restrained reaction particles.
- A separate pool of 27 local voice recordings is mapped to greetings, help,
  updates, launches, completion and other reactions.
- Mascot Center now lets you opt into useful, quiet extra moments: launch
  send-offs, deliberate library additions, PIN-category confirmations and
  Controller Center connection changes. Rest Mode, mute and cooldowns still win.
- Both companions retain mute, volume, reduced-motion, Rest Mode, drag positioning
  and the remembered home dock.
- Fungist speech is now shown in a smaller, simpler bubble and his welcome line is
  restricted to a real startup welcome.

### 🎮 One Library for every launcher

- Steam, Epic Games, EA App, GOG, Ubisoft Connect, Battle.net, Riot, Xbox, Rockstar,
  itch.io and standalone installs share the same reviewed import path.
- Launcher imports add local games and categories first instead of hanging while
  waiting for online artwork. Metadata can be reviewed afterwards.
- Manual folder scans and metadata review now have visible cancellation and firm
  time limits, so an unavailable folder, icon cache or online source returns you
  to a clear retry/skip choice rather than an endless busy screen.
- Battle.net refresh uses Blizzard identity before cross-store matching, including
  reliable fallback records for World of Warcraft and Warcraft III.
- Category headers no longer repeat launcher names, and their arrow, marker, badge,
  count and controls scale together from the Visuals setting.
- Library-only typography now offers five normal system font choices plus optional
  Fat and Cursive styles.
- Visual Tweaks now opens beside the Library and adds a separate icon-only view:
  game names, category headers and the pinned strip disappear, while dedicated
  controls set icon size, spacing and one-to-three compact lanes. Incompatible
  text/category controls visibly disable until standard view returns.

### 🔍 Metadata you approve

- Refresh actions now show candidate icons, banners, screenshots, descriptions and
  complete metadata before anything is replaced.
- The picker shows five candidates first and can expand with **Show more**.
- Difficult indie titles now get an exact-title public recovery pass before AI:
  joined names such as `MonolithBay` are expanded, changing search layouts are
  tolerated, and a surviving official itch creator page can supply its real title,
  description, creator, cover and screenshots even when catalogue search omits it.
- Steam identity remains locked to the correct app; Battle.net product identity is
  kept separate; uncertain matches require review.
- Tools now have their own Windows-software metadata path using executable identity,
  embedded icons, known vendor profiles and bounded official-site discovery instead
  of pretending utilities are Steam games.

### 📰 News and update intelligence across the whole Library

- Native Steam, GOG and itch.io feeds remain first choice.
- EA, Epic, Ubisoft, Battle.net, Riot, Xbox, Rockstar, standalone and F95-style
  entries can use bounded official-site-first public discovery when no direct feed
  exists.
- Update checks combine launcher evidence, local version files, Blizzard build data,
  saved official pages and carefully ranked public sources.
- Weak or missing evidence is described honestly instead of silently claiming a game
  is current.
- **Recent Game Releases** now checks Steam, Epic, EA, GOG, Ubisoft, Battle.net,
  Riot, Xbox, Rockstar and itch.io sources instead of letting Steam's
  catalogue dominate the card. Major launches stay visible for 14 days and always
  rank first; a maximum of four smaller verified releases may follow and expire
  after 5 days.

### 🔒 Private games stay private everywhere

- Locked-category games are redacted across Home, Wall, Preview, news, rankings,
  history, storage and links—not merely hidden from the Library list.
- Wall shows a protected unlock control for each locked category and reveals its
  games only after the correct PIN.
- Home explains when private statistics/news are hidden.
- **Lock private** immediately re-locks every PIN category, removes protected content
  from view and returns to a safe Library selection.
- First-time PIN setup explains exactly where the control is and what it does.

### 🏠 A cleaner, more useful Home

- Top 5 Played remains pinned and now carries the compact weekly play summary.
- This Week's News is more prominent and easier to scan.
- Related cards share 50/50 rows on wide windows and fall back cleanly on narrow
  layouts.
- Home is grouped into Play & history, News & updates, and Library & PC care.
- Cards reorder inside their own section while whole sections can be reordered
  independently.

### 📖 Cleaner game descriptions

- Store HTML, BBCode, entities, invisible characters and broken spacing are cleaned
  automatically without rewriting the source text through AI.
- Embedded store headings such as **Explore the Tenth World** become compact themed
  section headings, while prose is grouped into readable paragraphs.
- Obvious cut-off provider fragments are removed, and reviewed descriptions are
  normalised before saving. Player-written descriptions remain player-controlled.
- Developer, publisher, release date and official website now appear in a compact
  first row, with About this game directly underneath instead of basic facts being
  hidden below the full description.
- Preview hero banners now recover dark or washed-out source art using measured
  brightness and colour, while already-vivid banners remain natural. Heavy global
  tinting, fades and scanlines are reduced, with contrast focused behind the title.

### 🎨 Stronger themes without covering the interface

- Anime, Industrial and Magical themes have purpose-built transparent button frames:
  blossom branches, responsive chains/cogs/welding sparks, and four-corner magic.
- Navigation and Preview controls always remain above decorative art and FX.
- Popup menus use readable, near-solid surfaces on a dedicated foreground layer.
- Preview glass is slightly lighter so background animation remains visible without
  weakening the inner reading surfaces.
- Visuals is reorganised into three clear areas with responsive two- and one-column
  layouts.
- Library titles are contained, dropdowns stay above rows, and category headers share
  one centred scale.

### 🖥️ Windows, controllers and performance

- The new left-side **NEO-LIB Control Center** brings Themes, Visual Tweaks,
  Controllers, Settings, patch notes, update checks, feedback and a real full
  quit into one clear foreground-safe menu. TV Mode is visibly planned for Phase 2.
- Themes now open in their own focused studio, while Settings is shorter and
  behaviour-focused; Visual Tweaks no longer consumes Library toolbar space.
- Mascot now has its own Control Center for companion choice, permitted warnings,
  voice and chat controls. Controller Center links to Windows device settings and
  Steam Input only when Steam is already running.

- Controller Center detects pads only while open, remembers a preferred device,
  shows live buttons/sticks and opens the correct Windows Bluetooth page for device
  management.
- Outside-launch Rest Mode now recognises launcher child processes only inside an
  imported game's saved install folder. This covers Battle.net starting
  `retail\\Overwatch.exe` from an Overwatch bootstrap record without confusing an
  idle Battle.net client for gameplay.
- PC-use warnings can run a player-requested read-only check for heavy background apps,
  even when a running game was not imported into NEO-LIB.
- A detected external game can enable low usage until that exact process exits, after
  which NEO-LIB automatically resumes.
- CPU usage now uses a fresh one-second whole-machine sample rather than an old
  fifteen-second average.
- Windows 10/11 settings links use OS-aware, allowlisted routes.

### 🛡️ Safer launching, storage and recovery

- Deliberate launches use a short-lived one-use authorization and startup quarantine;
  automated tests never launch a real game.
- Save backup/restore, storage measurement, junk review and process controls each have
  focused, independently tested Windows services.
- Junk cleanup uses review tokens and the Recycle Bin—never an unreviewed force-delete
  path.
- Process controls protect Windows-critical tasks and NEO-LIB and never escalate to a
  forced kill.
- A small rotating local diagnostic report records safe error categories, never game
  names, paths, searches, messages, keys, PINs or private-category identity.

### 📦 Trustworthy builds and updates

- Settings → About shows the exact build fingerprint, architecture label, revision and
  build time.
- Packaging refuses a missing or stale renderer, preventing an old interface from
  being combined with current Windows code.
- The release inspector checks the installer, portable ZIP, archive identity, icons,
  mascot/voice assets, feedback configuration and known credential signatures.
- Feedback keeps the typed report when the relay is unavailable and offers a deliberate
  GitHub fallback.
- Temporary build credentials are removed after renderer compilation, including failed
  builds, and `.env` files cannot enter the package.
- Clean tag `v1.7.8` remains detectable by older v1.7.3 installations.

## Notable fixes and polish

- Cover Wall now marks every visible personally rated game with a yellow upper-right cover tag showing its exact one-decimal score. Unrated and still-locked games receive no tag.
- Mascot resizing now affects only FiFi/Fungist and immediate character effects. Speech bubbles, alerts, hover text, completion messages, chat, quick settings and major centre notices remain at their full readable interface size.
- External library games such as Valheim now enter Rest Mode automatically after a confident local match. A large centre-screen FiFi/Fungist notice explains what was detected, what paused and that NEO-LIB wakes when the game closes. Serious PC alerts share this major-event surface; ordinary mascot bubbles are larger, calmer and easier to read.
- Fixed FiFi/Fungist quick-setting switch knobs protruding beyond their tracks. The complete Home Game Updates body—including stronger-evidence notices—now stays inside one compact scrolling area without removing its explanatory text.
- Fixed the left-side Control Center gear being blocked by layered Library artwork, and keep delayed hover explanations inside the visible window at every edge.
- Fixed false Steam “update available” cards caused by old completed-manifest byte counters. NEO-LIB now requires Steam’s live update/download state as well as remaining bytes, and **Open downloads** uses Steam’s documented Downloads route.
- Repaired the blank-window startup regression and added a visible recovery screen.
- Fixed launcher Wizard confirmations appearing behind the original dialog.
- Fixed indefinite launcher-import waiting and added cancellation/timeout handling.
- Fixed Battle.net refreshes being diverted through stale Steam identity.
- Fixed Library dropdowns and Sort menus rendering behind game rows or theme FX.
- Fixed four repeated lock icons on private category headers.
- Fixed oversized category arrows, uneven header alignment and hidden category markers.
- Fixed long Library names escaping their row or pane.
- Fixed mascot bubbles leaving the window and mascot docking over controls.
- Fixed Game Identity overlapping the description and restored it to the story card.
- Fixed Settings opening as an empty gray/full-app screen.
- Fixed CPU sampling disagreement caused by an unintended long averaging window.
- Fixed local-day playtime boundaries around midnight in positive UTC offsets.
- Fixed helper executables being mistaken for active games and hiding the mascot.
- Fixed stale async results overwriting a newer or cancelled operation.
- Removed the unused `electron-store` production dependency and its packaged tree.

## Privacy and connectivity

NEO-LIB remains local-first: no launcher-account login, cloud library, telemetry or
background game-memory access was added. Public metadata/news/deal requests are bounded
and only the required public query is sent. Manual AI chat remains opt-in and excludes
paths, accounts, saves, processes and locked Private games.

## Release status

The source architecture and automated gates are complete. The Windows installer and
portable package must still pass the documented clean-profile, upgrade, visual/audio,
launcher, privacy and performance acceptance checklist before this candidate is
published as the final v1.7.8 release.
