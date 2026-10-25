# NEO-LIB

**Your PC game collection, brought together.**

NEO-LIB is a visual, local-first Windows game library. Bring together games from
Steam, Epic, EA, GOG, Ubisoft, Battle.net, Riot, Xbox, Rockstar, itch.io and your own
folders, then launch them through their normal client or executable.

[![Windows x64](https://img.shields.io/badge/Windows-x64-6b8cff)](https://github.com/fufugis/Neo-Lib-Launcher/releases/latest)
[![Version](https://img.shields.io/badge/version-1.8.11-9b5cff)](RELEASE_NOTES_v1.8.11.md)

[Downloads and releases](https://github.com/fufugis/Neo-Lib-Launcher/releases)
· [1.8.11 patch notes](RELEASE_NOTES_v1.8.11.md)
· [Discord](https://discord.gg/spk6QWREk8)
· [Reddit](https://www.reddit.com/r/NeoLibLauncher/)

> Current source version: **1.8.11**. Download an attached installer or portable
> package from a completed release. A tag or release page alone does not mean
> its Windows downloads have finished building.

## What you can do

- **Bring your collection together:** import installed launcher games, review
  metadata and artwork, or add standalone games and tools through **Add games → Wizard**.
- **Browse your way:** search, sort, filter, organize categories and favorites,
  or switch between the Library and cover Wall.
- **Build your Home:** move, resize and temporarily park widgets while arranging
  your page; customize content size, playtime charts and month/year calendar heatmaps.
- **Arrange game previews:** move and resize separate sections while keeping text
  readable; review artwork, launch routes, ratings and Journey progress.
- **Relax in Lounge:** a couch-friendly game browser with themes, custom backgrounds,
  atmospheric effects, music, optional widgets and emulator browsing.
- **Personalize the interface:** themes, full-height Library textures, background
  graphics, custom cursors and a permanent sidebar with size, spacing and order controls.
- **Keep useful local records:** game/ROM playtime, last played, personal ratings,
  progress and saved install-size measurements shared by Home and Library.
- **Connect your retro collection:** add your installed emulators and ROM folders
  row by row, with optional metadata/artwork sources and your own RomM server.
- **Extend without editing core files:** import community widgets, addons and modules
  through their documented formats and permission boundaries.
- **Stay informed, then rest:** update/download prompts, a news inbox and mascot
  announcements, with an automatic idle power saver for expensive visuals.

## Install and add games

1. Open [Releases](https://github.com/fufugis/Neo-Lib-Launcher/releases).
2. Choose a completed release with **NEO-LIB-Setup.exe**, or extract
   **NEO-LIB-windows-portable.zip** when included.
3. Install or open NEO-LIB, then use **Add games**, directly below Lounge in the sidebar.
4. Choose a Wizard tab and review detected games before adding them.

Games that require their original launcher still use it. No games, ROMs, BIOS files
or emulators are bundled. Optional RomM imports/downloads use the server you configure
and content you are authorized to access.

Current builds are unsigned. Windows may show a reputation warning; verify the
release source and compare its supplied SHA-256 checksums before running a download.

## Privacy and choice

No NEO-LIB account is required. Your library and preferences are stored locally.
Optional online features contact their respective services for artwork, metadata,
news, updates or other requested information; optional AI features have separate settings.

**Help improve NEO-LIB is off by default and restricted to users who confirm they
are 16 or older.** If enabled, minimal usage reports include a random installation
ID, app version and first-open/setup/active-day events—not your games or library.
Connection metadata is handled by the hosting provider as explained in the notice.
Turning reporting off stops uploads and requests deletion, with retries if offline.
Read the [optional usage reporting privacy notice](desktop-app/public/privacy/optional-usage.md)
before opting in. Every app feature remains available without reporting.

Private categories control visibility inside the app; they are not disk encryption.

## Development and release status

The active application is in [desktop-app](desktop-app/). Use the
[Windows development and build guide](desktop-app/INSTALL.md) for dependencies,
local startup, verification and packaging. The repository uses a Yarn lockfile.

Source checks do not establish that every installed Windows interaction has passed.
The [1.8.11 acceptance record](WINDOWS_ACCEPTANCE_V1.8.11.md) keeps remaining physical,
installed-upgrade and controller checks explicit.
[WORK_QUEUE.md](WORK_QUEUE.md) is the authoritative active queue.

## Guides and feedback

Start with the [documentation index](docs/README.md) for widget/layout editors,
retro setup, modules, addons, themes, privacy and release operations. Older planning
snapshots are retained in the [planning archive](docs/archive/README.md), not as
the current roadmap. Historical release notes remain at their original paths.

Report problems through in-app Feedback, [Discord](https://discord.gg/spk6QWREk8)
or [r/NeoLibLauncher](https://www.reddit.com/r/NeoLibLauncher/). Include the version
and Build ID from **Settings → About**, what you clicked, what happened and a screenshot.
Do not post private library files, credentials or API keys.

## License

NEO-LIB is source-available, not offered under an open-source license.
Read [desktop-app/LICENSE](desktop-app/LICENSE) before redistributing or modifying builds.

Made by [@fufugis](https://github.com/fufugis).
