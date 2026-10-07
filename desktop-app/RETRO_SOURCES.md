# Retro sources: reviewed imports, not automatic scraping

NEO-LIB supplies neither ROMs, BIOS files nor emulators. Use only collections you own or have permission to use. These optional integrations are owned by the native core, not Addons or imported Modules. No third-party implementation is bundled.

## Where to find them

- **Settings → Retro sources**: save, test or disconnect a connection.
- **Wizard → Retro Library → Manage profiles → Retro sources**: export review, source browsing, ROM identification, reviewed metadata and selected downloads. Save your installed emulator and a specific platform first.
- **Edit game → Artwork → Online**: ScreenScraper and RomM join the existing artwork sources. Confirm the title and load an image before selecting it; Save game remains the final apply action. Original retro box shapes are accepted only from these sources’ box-art slots, not arbitrary screenshots. Regular PC portrait checks remain.

Restart the desktop application after updating: new native commands need the new preload, not just a renderer refresh.

## Skraper / EmulationStation exports

Choose a `gamelist.xml` inside the saved profile’s ROM folder. The reader accepts standard game names, descriptions, release dates, developers, publishers, genres and relative ROM/image/logo paths. It does not execute XML, fetch remote paths or import external entities. Files escaping the canonical profile root, missing ROMs and unsupported formats are skipped. Keep related media inside that folder; absolute paths and links outside it are deliberately not followed.

Review each page, choose up to 100 games and import. A list can contain up to 2,000 entries and 8 MiB of XML. Export images default to scene artwork because the XML field does not establish their shape; the explicit box-cover option lets you use reviewed images as covers. Logos keep their own role. Images are copied into NEO-LIB’s private media storage so moving the export later does not break them. The ROM itself stays in your chosen folder.

Existing ROM paths are deduplicated rather than overwritten. Existing games, categories, ratings, Journey status and launcher configuration remain. Unsupported archives/disc layouts require manual extraction or a local scan with the appropriate profile.

## ScreenScraper

The API needs authorized developer credentials for this client, with optional ScreenScraper account credentials. Account login alone does not replace developer access. No key is shipped, borrowed from Skraper or downloaded automatically. Establish authorized developer access before live use.

Choose region/language, save, then test the connection by loading platforms. Search by title, confirm the platform, preview available box art/logos/scenery and apply reviewed fields to a saved ROM. By default only empty fields are filled. Explicit replacement still respects every artwork protection lock and records previous artwork in its history. Names, launch paths, ratings and progress on existing games are not rewritten.

Checksum identification is a separate opt-in action. It sends the saved ROM’s filename, size, MD5 and SHA1—not the ROM contents. The file must belong to a saved profile or private RomM download storage. Hashes are reused only while the file size/modification time remain unchanged. Failure leaves the library intact; title search remains available.

Requests are serialized and conservatively limited to at most ten per minute or the account’s lower advertised limit. Daily allowance and HTTP 429 cooldowns are respected. Metadata is temporarily cached, concurrent requests coalesced, and downloaded artwork reused for seven days. Artwork credentials/URLs never enter the renderer: it receives only restricted local media URLs. Available PDF manuals and MP4 videos can be explicitly downloaded and opened in the system viewer; there is no automatic playback/import.

Official contract: [ScreenScraper API](https://www.screenscraper.fr/webapi2.php). Export producer: [Skraper](https://www.skraper.net/).

## RomM

Use your own server URL and client API token. Prefer HTTPS. Insecure HTTP requires a separate acknowledgement and should only be used on a trusted local network; it exposes the token in transit. Changing server address requires a new token, never reuse of the previous server’s token. Use read-only access sufficient for platforms, ROM listing/details/content and resource images. Exact permissions/version compatibility must be checked against your server’s `/api/docs` or `/openapi.json`.

Browse 50 games per page, optionally search and filter by server platform, and preview metadata/artwork. Match that platform to your saved local emulator profile yourself; NEO-LIB does not guess which emulator to run. Reviewed fields can enrich an existing local ROM without downloading one.

To add a remote game, explicitly confirm permission and the platform, then download that selected ROM. One download runs at a time, up to 8 GiB, with a 15-minute transfer bound and stalled-transfer timeout. Cancel is available; closing the source panel or changing credentials also cancels the transfer. Private downloads are reused only when their completion marker/file attributes still match; existing unverified files are never replaced. Transfer length is checked against the declared file size when available. This is not a cryptographic content guarantee: database ROM hashes may describe decoded/headerless content rather than the downloaded container, so they are not used to reject downloads. A changed connection or platform invalidates the prior review. The completed game is added with your emulator profile; it is never launched automatically.

Multi-file/nested games need manual download/extraction through RomM followed by a local ROM-folder scan. No ZIP extraction, destructive server sync, upload, delete or server-admin capability is provided. PDF/manual and MP4/video viewing is explicit and bounded to 32/64 MiB respectively. External artwork hosts are refused on the authenticated path; cached local images, including RomM’s merged screenshots, remain available.

Official contracts: [API authentication](https://docs.romm.app/5.0.0/developers/api-authentication/) and [API reference](https://docs.romm.app/5.0.0/developers/api-reference/). This is an independent API integration, not a copy of the Playnite extension or RomM implementation.

## Storage and boundaries

Credentials use Electron safeStorage encryption in `userData/retro-sources/credentials.bin`, never renderer settings or library backup JSON. No plaintext fallback exists. Windows encryption failure prevents saving. Public status includes endpoint and configured flags but never passwords/tokens. Disconnect forgets credentials; it deliberately preserves downloaded games and cached media.

ROMs and explicit manual/video downloads stay under `userData/retro-sources/`. Artwork uses UUID-named files under the existing restricted `userData/lounge-backgrounds/` media route; cache indexes contain only local names/times. Automatic global disk cleanup is not implemented: saved games must not lose referenced artwork. No startup requests or automatic collection downloads occur. Addons, imported Modules and the official Lounge preload receive none of the new source/file commands.

Native service owner: `electron/emulation/retro-source-service.cjs`; storage, transport and export reader are separate sibling services. Eleven `retro-sources:*` commands have one guarded IPC domain and one core preload mapping each. Renderer review policy is in `src/lib/retro-source-model.mjs`, composed by the Wizard and Workshop. Library changes go through existing App callbacks, never native direct JSON writes.

## Verification status

`npm run test:emulation` exercises restricted exports, encrypted-storage fixtures, token/URL boundaries, platform/title/checksum responses, cached artwork, file preservation, streaming limits/cancellation, connection revisions and all eleven request contracts. Fixtures are not evidence of live server compatibility or Windows DPAPI/Electron UI acceptance.

Still required: real authorized ScreenScraper access, a user RomM server/token, native dialogs/media URLs in Electron, visual/controller acceptance, a normal Windows production build and packaged tests. No installer, publication or live-account success is claimed by this source implementation.

2026-10-04: the entire final `prebuild:renderer` suite passes, including existing Lounge/module/privacy/launch checks and new retro fixtures. Whitespace checks pass. The production Vite build is blocked before compilation by this environment's `spawn EPERM`; no new production renderer or installer was produced.
