# NEO-LIB

**Your PC game collection, brought together.**

NEO-LIB is a visual Windows game library for Steam, Epic, EA, GOG, Ubisoft,
Battle.net, Riot, Xbox, Rockstar, itch.io, standalone games, and useful tools.
It keeps your collection on your own PC and launches games through their normal
launcher or executable.

[![Windows x64](https://img.shields.io/badge/Windows-x64-6b8cff)](https://github.com/fufugis/Neo-Lib-Launcher/releases/latest)
[![Release](https://img.shields.io/badge/candidate-v1.7.9-9b5cff)](https://github.com/fufugis/Neo-Lib-Launcher/releases)
[![Status](https://img.shields.io/badge/status-testing-f0b429)](RELEASE_NOTES_v1.7.9.md)

[Download NEO-LIB](https://github.com/fufugis/Neo-Lib-Launcher/releases/latest)
· [Patch notes](RELEASE_NOTES_v1.7.9.md)
· [Reddit](https://www.reddit.com/r/NeoLibLauncher/)
· [Discord](https://discord.gg/spk6QWREk8)

> v1.7.9 is currently a testing candidate. Check the release page for the latest
> published installer and portable package.

## What NEO-LIB does

- **One library for many sources** — import installed games from the major PC
  launchers, scan a chosen folder, or add a standalone game through one Wizard.
- **A reviewed Retro Library** — connect your own emulator and ROM folder,
  review detected titles/platforms, then browse them in platform shelves and
  launch each ROM through the emulator profile you selected.
- **A library you can make your own** — categories, favorites, personal ratings,
  sorting, icon-only browsing, cover Wall, detailed Wall, and compact quick filters.
- **Reviewed metadata instead of silent guesses** — compare proposed titles,
  descriptions, genres, artwork, and source evidence before saving changes.
- **Deliberate collection work** — select several games for favorite, status,
  category, reviewed metadata/artwork, or confirmed private-category changes.
- **A customizable Home** — move, resize, reorder, hide, and restore independent
  widgets on a snapping grid or a free-position canvas.
- **Visual personality** — built-in themes, effects, custom cursors, layout controls,
  mascot companions, and a choice between top or sidebar navigation.
- **Useful local facts** — tracked playtime, last played, measured install size,
  update evidence, controller support, multiplayer features, and other sourced facts.
- **Quiet when you need the PC** — Rest Mode pauses non-essential work, including
  automatic rest while a confidently matched external game is running.

## Privacy and safety

NEO-LIB is designed as a local-first launcher:

- no NEO-LIB account is required;
- no telemetry service tracks your library;
- library data and preferences stay on your PC;
- imports use bounded, player-chosen locations and local launcher records;
- games still run through their original launcher or executable;
- metadata and artwork changes are review-first;
- NEO-LIB does not download games, ROMs, BIOS files, or cracked content.

Some optional features open public store pages or request public metadata, news,
artwork, deals, and update information from the internet. Their source is shown
where practical.

## Supported library sources

Current local import coverage includes:

- Steam
- Epic Games
- EA app
- GOG Galaxy
- Ubisoft Connect
- Battle.net
- Riot Client
- Xbox / Game Pass
- Rockstar Games Launcher
- itch.io installed folders
- standalone games and tools selected by the player
- player-owned ROM folders through player-installed emulator profiles

Import coverage does not mean NEO-LIB replaces a store client. Games that require
their original launcher still use it.

## Install

1. Open [Releases](https://github.com/fufugis/Neo-Lib-Launcher/releases/latest).
2. Download the Windows installer, or the portable ZIP when one is included.
3. Install or extract NEO-LIB.
4. Open **Wizard** and choose how to add games.
5. Review detected games before accepting them into the Library.

Windows may show a reputation warning for unsigned community builds. Verify that
the file came from this repository's release page and compare the included checksum
when available. Code signing is planned; it is not currently claimed.

## The main spaces

- **Home** — a personal widget canvas for updates, suggestions, stats, PC status,
  storage, recent releases, and other optional panels.
- **Library** — the everyday list with categories, search, sorting, game actions,
  Preview, and the import Wizard.
- **Wall** — a full-workspace cover browser or factual details list with All,
  Favorites, Most played, and Recently played filters.
- **Tools** — focused utilities and system handoffs.
- **Control Center** — settings, themes, visual tweaks, mascots, controllers,
  patch notes, updates, and shutdown.

## Current status

NEO-LIB is in active development. The architecture has been separated into tested
boundaries for library storage, launcher imports, metadata providers, launch safety,
diagnostics, visuals, widgets, updates, and release packaging. Source checks are not
treated as proof that a Windows build is ready: every release candidate still needs
an installed-app acceptance pass.

Work currently being prepared includes:

- a clearer Game Workshop for metadata, artwork, launch routes, and library status;
- a compact Wall preview overlay and configurable detailed-list columns;
- an Artwork Workshop with comparison, protection, restore controls, and an
  optional player-keyed SteamGridDB selection gallery;
- Windows acceptance for community widget isolation and permissions;
- optional achievement connectors;
- expanded reviewed emulator presets and retro metadata/artwork sources;
- a documented folder-based custom theme format.

The active development queue is public in [WORK_QUEUE.md](WORK_QUEUE.md). Planned
work is not presented as a shipped feature.

## Feedback and community

Bug reports are most useful when they include:

- the NEO-LIB version shown under **Settings → About**;
- what you clicked immediately before the problem;
- whether the installed or portable build was used;
- a screenshot and the local startup/crash log when NEO-LIB offers one.

Use the in-app Feedback action, join [Discord](https://discord.gg/spk6QWREk8),
or post in [r/NeoLibLauncher](https://www.reddit.com/r/NeoLibLauncher/).

## Build from source

NEO-LIB's active application lives in [`desktop-app`](desktop-app/).

```powershell
cd desktop-app
npm ci
npm run prebuild:renderer
npm run build:win
```

See [desktop-app/INSTALL.md](desktop-app/INSTALL.md) for the complete Windows build
and artifact instructions. The build requires a supported Node.js release and a
normal Windows environment capable of running Electron Builder's native tools.

## Project documentation

- [v1.7.9 release notes](RELEASE_NOTES_v1.7.9.md)
- [Windows acceptance checklist](WINDOWS_ACCEPTANCE_V1.7.9.md)
- [Architecture ownership](ARCHITECTURE_OWNERSHIP.md)
- [Architecture roadmap](ARCHITECTURE_ROADMAP.md)
- [Library experience milestones](LIBRARY_EXPERIENCE_MILESTONES.md)
- [Home widget package format](docs/HOME_WIDGETS.md)

## License

NEO-LIB is source-available under the terms in
[`desktop-app/LICENSE`](desktop-app/LICENSE). Read those terms before redistributing
the application or modified builds.

---

Made by [@fufugis](https://github.com/fufugis).
