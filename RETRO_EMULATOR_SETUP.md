# Retro emulator setup

Wizard → Retro Library → Manage profiles now shows a growing list of emulator rows. Add emulator opens the native executable picker; selecting an actual .exe adds only configuration, never a game or playtime entry. Known executable filenames supply a suggested name/platform/description; Windows supplies the local icon. Identification is a suggestion, not proof of authenticity. Unknown or multi-system emulators remain manually configurable. Nothing downloads, runs, guesses a BIOS or silently searches the network.

Rename each row. Add ROM folder is on that same row; selecting a folder saves it and opens the bounded scan/review flow. Inspect names/platforms and import selected ROMs. Ambiguous disc/archive formats need explicit platform choice. For another folder or console in the same emulator, add another row; duplicate executables are permitted, IDs remain separate. Up to 128 configurations are supported without the old twenty-row truncation.

Emulator options and visuals contains executable/folder paths, a custom still-image icon, launch arguments, working folder and automatic-process/manual tracking selection. Inline native icons survive moving the original executable; custom picked image-file icons still rely on that image remaining available. Removing a row does not delete ROMs, imported games or recorded history. Its games cannot launch until a compatible profile is restored. Replacing the executable uses current profile paths at launch rather than stale per-game copies.

## Launch configuration

New recognized Dolphin rows receive -b -e; new Cemu rows receive -g. These are based on their official command-line definitions. RetroArch requires configuring the player's installed core in arguments, e.g. -L "C:/RetroArch/cores/snes9x_libretro.dll". No core is selected or downloaded automatically. Unknown emulators require player-supplied arguments as needed.

MAME rows use the original archive shortname plus -rompath rather than passing the ZIP filename as a normal disc image. ROM sets, BIOS dependencies and software-list configurations remain MAME's responsibility; changing a friendly displayed title does not rename an archive. Other emulator forks may require tailored arguments; do not claim every possible emulator/version has been physically tested.

References: [Dolphin CLI source](https://github.com/dolphin-emu/dolphin/blob/master/Source/Core/UICommon/CommandLineParse.cpp), [Cemu CLI source](https://github.com/cemu-project/Cemu/blob/main/src/config/LaunchSettings.cpp), [MAME command-line documentation](https://docs.mamedev.org/commandline/commandline-all.html).

## Lounge and statistics

Imported games retain ROM identity/platform and emulator-profile ID. Lounge still groups them by console, marks configured consoles and launches through the authoritative core's current profile; private executable/ROM paths are not exposed to detached Lounge. Executable detection alone cannot identify which ROM is running: ROMs and configured emulator entries are excluded from generic external-process detection to prevent crediting another game.

Explicit launches use each ROM's library ID for process sessions, lifetime minutes, last-played and dated session history. Emulator setup entries never accrue playtime; standalone emulator/manual-tracking launches suppress recording. Automatic ROM time lasts until the launched emulator process exits. Loading a different ROM inside an already-running emulator, a bootstrap process that hands off to another instance, or starting ROMs entirely outside NEO-LIB cannot be identified reliably by this mechanism. Use separate launched sessions or manual tracking; real emulator-specific acceptance remains required.

ROMs appear in rankings/pie/calendar by default. Exclude ROMs from statistics is available in Home widget settings, Top Played, pie/calendar filters and the legacy Stats panel. The Home flag is shared across its analytics widgets. Lounge's embedded widgets synchronize their own shared flag through its saved pie/calendar preferences. Filtering does not delete history, stop tracking or remove ROMs from Library/carousels. Emulator software itself is excluded from statistics. Recorded daily ROM sessions can appear in period stats; older lifetime-only totals are not fabricated into dated history.

## Acceptance still required

Test Add/cancel/rename/icon/folder/review/restart, multiple rows using the same executable, changed/removed profiles, appropriate core/arguments, one ROM launch from Library and detached Lounge, exit and per-ROM minute/day attribution, manual tracking, and statistics toggles with controller/mouse. Pure/fake-native checks cannot certify physical emulator behavior.
