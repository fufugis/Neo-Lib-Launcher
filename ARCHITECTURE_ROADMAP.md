# NEO-LIB architecture roadmap

This roadmap prepares NEO-LIB for long-term maintenance without rewriting the
working application. Every stage is deliberately small enough to review and
reverse on its own. A stage may reorganize code or deliberately change behaviour,
but never both at once.

## Rules for every stage

1. Record the current behaviour with tests or a reproducible manual checklist.
2. Move one responsibility behind a named boundary; keep public IPC, saved-data
   shape and visible behaviour stable unless the stage explicitly says otherwise.
3. Run focused regression checks, existing safety checks and the renderer build.
4. Build the Windows app and smoke-test the affected flow with disposable data.
5. Update this roadmap, `WORK_QUEUE.md`, `PROGRESS.md`, patch notes and the in-app
   changelog accurately. Keep “source-tested” separate from “desktop-tested.”
6. Make one reviewable commit per accepted stage so rollback is straightforward.

The post-restructure controller, Minimalistic and fullscreen track is specified in
[`CONTROLLER_EXPERIENCE_MILESTONES.md`](CONTROLLER_EXPERIENCE_MILESTONES.md). It is
an additive product track: it shares the architecture below and cannot reopen the
completed extraction work or block the current Windows acceptance pass.
The complete post-restructure sequence, including current acceptance and optional
connected services, lives in [`FUTURE_MILESTONES.md`](FUTURE_MILESTONES.md).

No stage may silently rewrite a user's library, settings, images, playtime, save
backups or category privacy data. Data-format changes require a versioned migration,
backup, validation and rollback test.

## Stage 0 — Safety baseline and build gate

**Goal:** establish repeatable evidence before further structural work.

**Current state:** partially ready. Launch safety, launcher import, launcher scanner,
metadata refresh and FiFi controller checks exist. Launcher tests now run before
renderer builds. The current environment cannot start Vite's build helper
(`spawn EPERM`), so a successful normal Windows build is still outstanding.

**Done when:** the current branch builds on Windows; the app starts; a compact smoke
check covers load/save, Library, Home, Wall, Tools, Settings, one safe launch and one
launcher import using disposable data; the result is recorded without calling
unverified behaviour complete.

## Stage 1 — Installed-launcher detection boundary

**Goal:** remove launcher discovery from the Electron main-process god object.

**Current state:** code extraction and automated regression verification complete;
desktop acceptance pending. Ten scanners now live in
`desktop-app/electron/launchers/scanners.cjs`. Forty before/after fixture runs and
ten full-main integration scans match the original results and ordered I/O. All 83
IPC endpoints register. No detection algorithms or result fields changed.

**Done when:** Stage 0's build succeeds and the installed-app wizard successfully
scans at least Steam plus two non-Steam launchers available on the test PC, imports
into a disposable library, survives cancellation/failure, and restarts with the
imported categories intact.

## Stage 2 — Persistence boundary

**Goal:** give library, settings, playtime and cache data one trustworthy owner.

**Work:** extract atomic JSON reading/writing and file locations into a storage
service; document each saved shape; validate loaded values; add explicit schema
versions, backup-before-migration and recovery tests. First move the existing logic
unchanged. Add validation/migrations only in a separately reviewed change.

**Done when:** golden fixture libraries and settings round-trip without data loss;
malformed/interrupted files recover predictably; old supported files migrate from a
backup; privacy/category fields and manual edits survive; packaged restart passes.

**Current state:** code and virtual-disk verification complete; packaged acceptance
pending. App-data paths and raw operations now live in `app-storage.cjs`; versioned
library/settings/playtime rules live in `document-store.cjs`. Schema 0 files migrate
to schema 1 only after a complete `.bak`; valid saves are serialized and backed up;
corrupt primaries may recover from last-known-good; invalid or newer documents are
protected from autosave. Private/unknown fields and window-setting merge behaviour
are covered. The full regression gate passes. The renderer build still stops before
bundling because this environment cannot spawn Vite's helper (`spawn EPERM`), so
Windows migration/restart/rollback testing has not occurred and Stage 2 remains open.

## Stage 3 — Thin, explicit IPC contracts

**Goal:** make each renderer-to-Windows command easy to find and debug.

**Work:** group IPC registration by domain (library, launch, launchers, metadata,
news, saves, system and tools); make handlers call services instead of containing
business logic; validate request and response shapes; reject duplicate channel
registration; standardize safe error results while retaining useful causes in logs.

**Done when:** every preload method maps to exactly one documented handler, invalid
inputs cannot crash the main process, contract tests cover success/failure, and the
renderer does not depend on internal service details.

**Current state:** domain-contract extraction plus complete request/response validation
and standardized safe failure logging are verified; acceptance remains open. All 83
native commands now pass through one registry that rejects invalid names and
duplicate registration, and all preload invokes resolve exactly once across the
measured 28 domains. Every domain now has an explicit contract module and
`main.js` has zero direct registrations. Persistence, window/dialog utilities,
system health, playtime, image caching, app lifecycle, Launch Doctor, all six save
operations and Home storage measurement also have dedicated services; the remaining
complex provider behavior is
supplied as compatibility services pending later domain stages. A shared contract
guard now protects all 53 renderer payload commands. The first batch covers game launch/watch,
save inspection/backup/restore/search, Optimize process/junk actions, storage
measurement and directory scans. The second covers metadata, news, updates,
releases, Steam, GOG, Gemini, public web and managed-tool requests. Tests prove
malformed or oversized inputs never reach those native services, domain-safe result
shapes return, and valid arguments/results remain unchanged. A final local-boundary
batch covers launcher actions, external/path operations, lifecycle toggles,
library/settings saves, playtime, image caching, Launch Doctor, shortcuts and icon
extraction. The other 30 native commands are intentionally no-payload. Request
validation is therefore complete at the automated contract level. Response guards
now protect all 85 commands: the 14 high-consequence game launch/watch, save
backup/restore/search and Optimize process/junk commands, plus 14 Steam, GOG,
Gemini, public-web, deals and managed-tool commands, plus 10 unified metadata,
news, update and weekly-release commands, plus 28 local utility commands covering
dialogs, windows, persistence, directory/storage scans, OS/lifecycle actions,
system health, playtime, images, shortcuts, icons and Launch Doctor, followed by all
15 launcher action/detection/scanner commands. Tests prove valid
success/failure results remain unchanged and malformed native results become explicit
safe fallbacks or `INVALID_RESPONSE` failures matching each renderer contract.
Automated request/response validation and safe failure handling are complete. A
service throw, rejected promise or malformed result returns the command's existing
contract-safe fallback and appends a channel-aware diagnostic to the local
privacy-bounded local diagnostics; request payloads and error text are never recorded. Deeper service extraction
and packaged Windows acceptance remain pending. See
`desktop-app/electron/ipc/README.md`.

The save-domain extraction also exposed and corrected an existing Node copy conflict:
backup/restore created a destination and then requested a copy that must fail when the
destination exists. The isolated service now copies each child with no-overwrite
semantics. Temporary-disk tests cover real backup data, metadata, confined restore,
occupied-folder refusal and bounded candidate search.

Home storage measurement now lives in `storage-scan-service.cjs`. A real temporary
filesystem test covers missing and launcher targets, duplicate/shared-root exclusion,
mod measurement, cache reuse and forced rescans without touching the user's library.

Optimize junk review and Recycle Bin actions now live in `optimize/junk-service.cjs`.
Temporary-filesystem tests prove scans stay inside known roots, protect configured
game/save paths, require fresh unchanged tokens and call only the injected Recycle Bin
action. No test deletes a file; Optimize process inspection remains to extract.

Optimize process inspection and cooperative close requests now live in
`optimize/process-inspection-service.cjs`. Tests cover payload normalization,
Windows/NEO-LIB process protection, stale and name-changed snapshots, Windows refusal,
and the exact non-force `taskkill` arguments without starting or stopping a process.

Game launching and external-process watching now live in two `electron/game/`
services. Tests cover one-use authorization expiry, startup quarantine, local/shared
cooldowns, exact spawn options, exit accounting, helper filtering, exact path-only
external detection, locally launched exclusion, state-change events and 8s/30s
resume cadence. No test launches, queries or stops a real process.

## Stage 4 — Metadata, news and update providers

**Goal:** turn the current mixed search logic into honest, replaceable sources.

**Work:** create separate adapters for Steam, GOG, Battle.net/Blizzard, itch.io,
F95zone where permitted, official sites, general web fallback and optional AI.
Centralize timeouts, cancellation, cache policy, rate limits, confidence and source
provenance. A provider must say “not found” rather than inventing certainty.

**Current state:** source implementation is complete. Seventeen injected services now
own Steam/GOG stores, public and specialist discovery, candidate orchestration,
Gemini, news normalization/discovery, weekly and owned feeds, update history, deals,
scan coordination, source discovery, installed evidence, page-version evaluation and
per-game independent assessment. The final boundary audit proves that every service
is imported by `main.js`, feed routes are unique, provider-owned caches have no legacy
duplicates, providers hide no direct Electron/process/network dependency, and refresh
still requires renderer review rather than automatic metadata apply.

Offline fixtures cover fallback order, bounded requests and text, caching, confidence,
source labels, partial outages and honest missing evidence. They also prove a cached
page with no explicit version cannot become false-current. Complete alpha, beta and
release-candidate installed-version suffixes are retained. A separate read-only live
smoke passes against Steam and GOG metadata, public search, itch.io, Steam News and
four active deal sources. The renderer/package attempt still stops before bundling
because this managed host rejects the build helper with `spawn EPERM`; packaged
Windows refresh interaction therefore remains an external acceptance gate rather
than unfinished Stage 4 source architecture.

**Done when:** provider contract tests prove fallback order, cancellation, bounded
waits, caching and source labels; refresh never overwrites manual data before user
approval; non-Steam fixtures receive the correct provider route; offline mode fails
cleanly; packaged refresh is manually checked.

## Stage 5 — Launch, process watch and power-saving service

**Goal:** make starting/stopping games and NEO-LIB's low-usage behaviour one coherent,
auditable subsystem.

**Work:** isolate launch authorization, launcher URLs, executable spawning, external
game detection, session timing, Discord presence and low-usage transitions. Define
an explicit state machine: idle → game detected/launching → low usage → game stopped
→ resumed. Keep optimization actions opt-in and separate from observation.

**Done when:** tests cover direct and launcher launches, externally started games,
failed launches, duplicate processes, stop/resume and app restart; no test launches a
real game; a packaged smoke test confirms one real safe launch and one external-game
detection; resource alerts distinguish a running game from unexplained usage.

## Stage 6 — Renderer application state

**Goal:** reduce `App.jsx` from a central state-and-action owner into composition.

**Work:** extract domain hooks/controllers for library, selection/navigation,
privacy locks, metadata refresh, playtime and settings. Keep state transitions pure
where possible and place native API calls behind a renderer service. Move one domain
at a time; do not redesign the UI during these moves.

**Current state:** source implementation is complete. Seven focused state modules
and one store hook now own Library/category transitions, remembered navigation,
global private-game redaction and panic locking, metadata review queues, playtime,
settings-derived visual values and persistence. `App.jsx` uses one stable preload
gateway instead of direct `window.api` calls. Home remains the startup screen while
the last valid Library and Tools selections can be restored behind it. Theme ambience
and decorative rendering moved intact to `ThemeVisuals.jsx`, reducing the central app
from 3,088 to about 2,500 lines without a visual redesign. Pure fixtures cover every
domain; privacy assertions prohibit locked name, art, path, URL, source and store-ID
leaks; App and visual JSX parse; the complete regression gate passes. Packaged
navigation/restart acceptance remains unavailable because this managed host refuses
to start the renderer build helper with `spawn EPERM`.

**Done when:** each extracted domain has transition tests; locked-game redaction is
tested globally; Home/Library/Wall selection and back-navigation survive restart;
`App.jsx` primarily composes domains and screens; packaged navigation smoke passes.

## Stage 7 — Component and visual boundaries

**Goal:** make UI bugs local instead of forcing edits across giant components.

**Work:** split the largest components by stable responsibility: changelog content
versus modal shell, Library header/category/game row, Preview identity/media/actions,
Home cards/sections, Settings tabs, and mascot controller/view/speech/FX. Create
shared primitives for popup layering, readable surfaces, buttons and responsive
bounds. Keep theme art separate from interaction layers.

**Current state:** the source boundary foundation is complete. Changelog release
content and Settings controls have separate owners; Home privacy/update/health/
recommendation logic and Fungist command/notice decisions are pure modules rather
than visual-component internals. Every portal-based menu and modal now reaches the
same foreground gateway, and decorative navigation art has an explicit pointer-safe
wrapper. A focused gate parses every renderer component, prohibits stray portal
owners and clickable decoration, and directly tests private Home redaction, health,
recommendations, Fungist commands, alert cooldowns and the startup-only welcome
voice rule. The complete offline regression gate passes. Further physical splitting
of the still-large Library and Preview presentation files is useful maintenance work,
but is no longer required to obtain one popup/privacy/decoration behavior owner.
Packaged standard-width, narrow-width, keyboard/focus, theme and reduced-motion
acceptance remains open because this managed host stops Vite at `spawn EPERM`.

**Done when:** popup layering, keyboard/focus, narrow-window bounds, reduced motion,
all themes and privacy redaction have targeted tests/checklists; visual screenshots
are accepted at standard and reduced widths; no decoration intercepts input.

## Stage 8 — Diagnostics and truthful status

**Goal:** make user reports actionable and prevent endless spinners or silent failure.

**Work:** add bounded operation IDs, timeouts, cancellation and structured local logs
for imports, refresh, launch, updates and news. Provide a privacy-reviewed diagnostic
export that excludes secrets and private-category identity. UI states must distinguish
waiting, cancelled, unavailable, partial result, failed and completed.

**Current state:** source implementation is complete for the targeted long-running
flows. Launcher scan/import, metadata review, Home and full-panel news, weekly release
discovery, game-update scans and storage scans now use one operation lifecycle with a
unique ID, explicit running/succeeded/partial/failed/cancelled/timed-out/unavailable
states, stale-result rejection and bounded deadlines where the work is not deliberately
player-paced. Home and News expose Cancel while work is active and retain truthful
timeout/partial/error guidance instead of silently replacing failure with an empty
list. Launch retains its existing native launch audit. A forty-entry local journal
stores only operation domain/status/timing/counts/error code; it cannot store request
payloads, game names, paths, searches, keys, message text or private-category identity.
Feedback can include this summary only through an unchecked player-controlled option.
Direct tests cover success, partial completion, timeout, cancellation, stale ownership,
privacy filtering and every required UI route; the complete offline regression gate
passes. Packaged Windows timing/cancellation/feedback acceptance remains unavailable
because this managed host refuses to start Vite's helper with `spawn EPERM`.

The follow-up Diagnostic Recorder now also owns rotating native startup, renderer,
Electron child-process, main-process and IPC failure events. Its strict allow-list
retains error class and bounded status facts but cannot serialize game names, paths,
URLs, searches, payloads, message text, keys, PINs or private-category identity.
Feedback can copy the report or open its folder, and attachment remains explicitly
opt-in. Source privacy, rotation and all 83 IPC contracts pass; packaged interaction
acceptance remains part of this stage's open gate.

**Done when:** every long operation terminates or can be cancelled; failures include
a user-facing next action and a local diagnostic cause; feedback can attach a safe
summary only with approval; tests cover stale replies and app/window closure.

## Stage 9 — Consolidation and release hardening

**Goal:** remove obsolete paths only after new boundaries have proven themselves.

**Current source state:** the first consolidation pass is complete. It removed one
shadowed HTML helper, eight proven-unused metadata, Gemini and news helpers, and one
deprecated no-output visual stub
without changing the active service routes. `test:release-hardening` now scans all
runtime source for conflicting top-level ownership and unresolved relative modules,
checks package entry points/assets and version alignment, refuses returned legacy
helpers, and requires the documented ownership map. `ARCHITECTURE_OWNERSHIP.md` and
`RELEASE_HARDENING.md` record final owners, Windows acceptance, performance evidence
and rollback. Packaged smoke tests and same-machine performance measurements remain
open, so Stage 9 is not release-ready yet.

An optional behavior-preserving renderer cleanup resumed at the player’s request.
Its first batch reduced `App.jsx` from 2,545 to 2,418 lines by moving hardware-tool
bootstrapping, launcher identity/category rules, conservative launch-target repair,
mascot library context and bounded update/inbox transitions behind small tested
owners. All ten real Wizard import routes and the release gates still pass. Further
cleanup must follow the same rule: one responsibility, direct fixtures, no interface
redesign and no controller/fullscreen work mixed into the change.

The next completed boundary moved the full Library Visuals panel out of `Sidebar.jsx`.
Its layout, typography, category, texture, effects, motion and feedback controls now
live in `components/library/LibraryVisualsPopover.jsx`, with font policy in a small
model. Sidebar fell from about 2,320 to 1,796 lines and only owns the trigger plus
state/action wiring. The visual-boundary gate parses the extracted JSX, verifies all
important controls and foreground layering, protects the five font choices and
prevents the implementation helpers from drifting back into Sidebar.

The following Preview pass moved About/Identity, verified media, factual details,
hero title/release and personal rating into focused `components/preview/` owners.
`GameDetail.jsx` fell from roughly 1,140 to 918 lines. Pure fixtures preserve story
paragraphs, media deduplication/eight-image limits and fallback identity, while the
visual gate protects every panel/rating hook and prevents those implementations from
returning to the composition component. Launch, update and news behavior was not
changed in this pass.

The following action/status audit then removed three proven-unreachable legacy
Preview renderers (`GalleryBox`, `MetaStrip` and `ScreenshotStrip`) before touching
the protected launch toolbar. That reduced `GameDetail.jsx` again from 918 to 737
lines; the launch-authorization gate and full source suite pass, and the visual gate
rejects any return of those obsolete paths. The live action toolbar and update/news
cards remain the next behavior-preserving boundary.

The live toolbar is now owned by `preview/PreviewActionBar.jsx`. All nine actions,
the foreground category menu and managed-tool menu moved together; the native one-use
launch request remains on the sole visible Launch control. `GameDetail.jsx` fell from
737 to 517 lines. Launch safety, visual hooks, renderer bindings and the full source
gate pass. Steam manifest, news and update-status cards are the next Preview boundary.

That status boundary is now complete. Steam build evidence, all-launcher news,
managed-tool readiness and update/history presentation live in
`preview/PreviewStatusCards.jsx`; pure age, size and version/remaining labels live in
`preview-status-model.mjs`. `GameDetail.jsx` is now a 216-line composition component,
down from roughly 1,140 before the Preview pass. All native calls, stale-result guards,
truthful errors and review paths remain intact, and the full source gate passes across
99 renderer modules. The next audit has started on Sidebar's Section/GameRow tree.

That Sidebar audit is now complete. `LibraryTree.jsx` owns two-column balancing,
category sections, game rows, pinned games and their foreground menus, while
`library-tree-model.mjs` makes the no-split/no-duplicate column policy directly
testable. `LibraryToolbarControls.jsx` also owns the reusable action button,
decorated navigation tab and launcher dropdown; the unreachable launcher-pill
renderer was deleted. `Sidebar.jsx` fell from roughly 1,847 to 798 lines while all
drag/drop, privacy, selection, badge, playtime and popup hooks stayed intact. The
full source gate now covers 102 renderer modules. Root `App.jsx` composition is the
next behavior-preserving audit; fullscreen/controller work remains a later milestone.

The first root-composition pass is complete. All dialogs, review flows, Settings
recovery, Controller Center handoff, tutorial/intro, feedback/import surfaces,
drag overlay and toast now render through `components/app/AppModalLayer.jsx` while
their state and workflows remain in `App.jsx`. The browser-preview library also
moved to a pure deterministic `state/demo-library.mjs` factory with injected PIN
hashing. `App.jsx` fell from 2,415 to roughly 2,030 lines; the visual and experience
gates now follow the new owners and cover 104 renderer modules. The next safe audit
targets one workflow-state cluster rather than moving more JSX for its own sake.

The first workflow-state extraction is also complete. `services/metadata-workflow.mjs`
now owns per-game refresh, Steam/Battle.net identity rules, local hint retries, cached
artwork, accept-before-write, Tidy identity queues and confirmed bulk review. Direct
fixtures use an injected native API and prove that no normal refresh silently replaces
metadata. `App.jsx` fell again to roughly 1,860 lines and the source gate covers 105
renderer modules. Category/privacy coordination is the next cohesive root workflow.

Category/privacy coordination is now extracted as well. The dedicated workflow owns
category CRUD/order, game assignment movement, PIN setup/removal/unlock and panic
locking while reusing the existing pure library/privacy transitions. In-memory tests
prove assignment-only deletion and private-game protection. `App.jsx` is roughly
1,755 lines and the gate covers 106 renderer modules. Launcher detection now has a
small pure policy owner as well: it can only offer the review-first Wizard, and the
unreachable silent-import branch was deleted. The ten-client Wizard retains bounded
scan, cancellation, review, duplicate protection and category creation. `App.jsx` is
roughly 1,640 lines and the gate now covers 110 renderer modules. The final root audit
then extracted reviewed Auto-sort apply/undo and removed four proven-dead bindings.
`App.jsx` is roughly 1,590 lines, has no unused root binding, and the renderer
architecture is now frozen for installed acceptance rather than further reshuffling.

**Work:** find duplicate helpers, dead code, conflicting metadata paths and legacy
scaffolding; delete in small reviewed commits; document the final ownership map;
measure startup, idle RAM/CPU, Library rendering and background-game low-use mode.

**Done when:** full automated checks, Windows packaging, clean-profile and upgrade
smoke tests pass; performance measurements are recorded; release notes separate
facts from pending limitations; rollback instructions are known; only then is the
architecture milestone described as complete and release-ready.

## Recommended order this week

The source restructuring is complete enough to stop moving boundaries. Finish through
acceptance now: confirm repaired startup/restart/tray and build identity; run the
disposable clean/upgrade persistence checks; exercise launcher import, cancellation,
metadata/news/update flows, launch and low-use recovery; complete the earlier-request
visual/privacy sweep; compare the fresh CPU sample and record same-machine performance;
then audit the queue, commit and push. Keep optional feature decisions such as mascot
web research and third-party metadata credentials outside the architecture gate.
