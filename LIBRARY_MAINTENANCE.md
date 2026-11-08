# Library maintenance

## Find missing games

Open Add games → Library care → Find missing games → Quick scan Library.
This checks recorded local files/folders only, in batches of 100, without
recursively searching disks, launching games or deleting files.

Missing entries are not selected automatically. Choose individual entries or
Select missing, then Remove selected and confirm. Paths are checked again
immediately before removal; entries whose locations changed are retained.
Disconnected/inaccessible drives are shown separately and cannot be selected for
removal. Launcher-only/virtual targets without a local path are unverified, not
uninstalled. Locked private entries are excluded. ROM entries check their ROM
file rather than the shared emulator executable.

Locate executable opens a file picker. Locate folder tries the old filename
inside the selected folder, with validation before changing the entry. If an EXE
was renamed, use Locate executable instead. No filename guessing or recursive
search runs. ROM relocation uses Locate folder. Names, playtime, artwork and
categories are retained; matching primary executable routes follow the new path.
Stop or leaving the tab ignores late scan/picker results.

## Reset and Clear Entire library

Settings → Library offers a destructive reset with two typed confirmations:
RESET, then CLEAR LIBRARY. Export a backup first if you may want entries back.

Reset clears all game entries, Tools and categories, including private groups.
It does not uninstall anything or delete game folders. Home/settings and the
separate playtime history stay; game progress/rating/day data is archived locally.
The empty Library must save successfully before the current list is cleared.
Failed saves keep the Library unchanged and show a persistent Settings message.
Owned artwork-cache cleanup happens afterward and is optional: locked cache
files cannot prevent a successful Library reset.

Automated verification uses injected/temporary profiles only. No real player
Library has been reset during implementation.
