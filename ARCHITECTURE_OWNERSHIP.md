# NEO-LIB architecture ownership

This is the short ownership map for future fixes. A change should begin in the
smallest owner below. `electron/main.js` connects owners; it is not the default
home for new behavior.

## Windows side

| Area | Owner | Responsibility |
| --- | --- | --- |
| Startup and composition | `desktop-app/electron/main.js` | Creates the window, composes tested services and registers domain adapters. |
| Renderer bridge | `desktop-app/electron/preload.js` | Exposes the deliberately limited native API. |
| Native command contracts | `desktop-app/electron/ipc/` | One registration and request/response contract per command domain. |
| Privacy-safe local diagnostics | `desktop-app/electron/diagnostics/diagnostic-recorder.cjs` | Rotates structured failure/status events, strips private content and produces the player-controlled report. |
| Launcher discovery | `desktop-app/electron/launchers/` | Reads bounded local launcher evidence and returns normalized installed games. |
| Library/settings/playtime storage | `desktop-app/electron/storage/` | Versioned documents, recovery copies and serialized writes. |
| Metadata, news and update evidence | `desktop-app/electron/providers/` | Network-source policy, normalization, caching, confidence and truthful fallbacks. |
| Game launch and external detection | `desktop-app/electron/game/` | One-use launch authorization, process start/exit and path-only running-game checks. |
| Saves | `desktop-app/electron/saves/` | Bounded inspection, backup discovery, safe copy and non-overwriting restore. |
| Optimization | `desktop-app/electron/optimize/` | Read-only process inspection and reviewed Recycle Bin cleanup. |
| OS/app helpers | `desktop-app/electron/app/`, `doctor/`, `images/`, `playtime/`, `system/` | Focused native capabilities that do not own UI state. |
| Release identity and artifacts | `desktop-app/scripts/prepare-release-config.cjs`, `build-release.ps1`, `build-provenance.cjs`, `package-portable.ps1`, `release-candidate-inspector.cjs` | Validates integration input, always removes temporary renderer credentials, fingerprints exact runtime source, packages the portable tree, rejects stale/incomplete artifacts and emits path-safe hashes. |

## Interface side

| Area | Owner | Responsibility |
| --- | --- | --- |
| App composition | `desktop-app/src/App.jsx` | Connects screens, shared state and native actions; feature rules should move to an owner below. |
| Persistent renderer state | `desktop-app/src/state/` | Pure state transitions, privacy filtering, launcher/category identity, tool bootstrap, bounded ledgers and operation lifecycle. |
| Controller input | `desktop-app/src/input/`, `desktop-app/src/services/controller-*.mjs` | Privacy-safe device normalization, semantic commands, explicit-lifecycle detection/navigation and no input-history persistence. |
| Renderer workflows | `desktop-app/src/services/` | Bounded operations, diagnostics, refresh sessions and the native API boundary. |
| Feature interfaces | `desktop-app/src/components/` | Screen behavior and rendering, with reusable subareas in named component folders. |
| Library Visuals | `desktop-app/src/components/library/LibraryVisualsPopover.jsx`, `library-visual-model.mjs` | Owns the complete Library visual-control panel and its font policy; `Sidebar.jsx` only opens it and supplies values/actions. |
| Library live tree | `desktop-app/src/components/library/LibraryTree.jsx`, `library-tree-model.mjs` | Owns category balancing/rendering, game rows, pinned games, drag/drop and foreground game/category menus; Sidebar supplies state and actions. |
| Library toolbar controls | `desktop-app/src/components/library/LibraryToolbarControls.jsx` | Owns reusable action buttons, decorated main tabs and the launcher dropdown, including foreground readability and dismissal behavior. |
| App modal and overlay layer | `desktop-app/src/components/app/AppModalLayer.jsx` | Owns dialog composition, review surfaces, tutorial/intro, transient overlays and toast rendering; `App.jsx` retains workflow state and passes an explicit contract. |
| Browser preview seed | `desktop-app/src/state/demo-library.mjs` | Pure factory for deterministic preview-only games, tools, categories and injected local PIN hashing; never touches a saved library. |
| Metadata refresh workflow | `desktop-app/src/services/metadata-workflow.mjs` | Coordinates reviewed refresh, source identity locks, metadata application, repair queues and bulk confirmation through injected UI/native dependencies. |
| Category/privacy workflow | `desktop-app/src/services/category-privacy-workflow.mjs` | Coordinates category CRUD/order/assignment, PIN protection and panic locking while preserving assignment-only deletion and private-game redaction. |
| Launcher detection policy | `desktop-app/src/services/launcher-detection-workflow.mjs` | Decides when a running launcher may offer the confirmation-first Wizard; never scans or imports automatically. |
| Auto-sort workflow | `desktop-app/src/services/auto-sort-workflow.mjs` | Applies reviewed category suggestions and owns the exact single-step assignment/category undo. |
| Preview information | `desktop-app/src/components/preview/PreviewInformationPanels.jsx`, `PreviewHeroTitle.jsx`, `preview-information-model.mjs` | Owns About/Identity, verified media, factual details, hero title/release and the player’s precise rating; `GameDetail.jsx` composes them. |
| Preview actions | `desktop-app/src/components/preview/PreviewActionBar.jsx` | Owns the visible launch authorization request, game action toolbar, foreground category menu and managed-tool setup menu. |
| Preview status | `desktop-app/src/components/preview/PreviewStatusCards.jsx`, `preview-status-model.mjs` | Owns Steam manifest evidence, per-game news, managed-tool readiness, update/history presentation and their display calculations. |
| Visual system | `desktop-app/src/index.css`, `desktop-app/src/theme/` | Theme tokens, layering, motion and reusable visual rules. |
| Packaged static assets | `desktop-app/public/` | Theme and mascot media referenced by the interface. |

## Rules that keep it maintainable

1. A renderer feature must not add native filesystem, process or network access.
2. A new native command gets one preload mapping, one IPC-domain contract and one service owner.
3. Provider-specific parsing belongs under `electron/providers/`, not in a React component.
4. Storage writes belong behind the document store; no feature writes library JSON directly.
5. UI operations that can wait use the bounded operation lifecycle and expose truthful terminal status.
6. Private-game identity is filtered before Home, Wall, diagnostics or external AI/web payloads.
7. `npm run prebuild:renderer` is the source gate. Packaged Windows acceptance remains a separate required gate.
8. A release candidate uses `npm run build:release`; configuration, installer, portable ZIP, evidence JSON and checksums must come from that one source generation.
