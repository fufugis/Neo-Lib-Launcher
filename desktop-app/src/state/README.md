# Renderer state ownership

Stage 6 moves durable interface decisions out of `App.jsx` without redesigning
the UI. Each module is deliberately small and independently testable:

- `use-renderer-store.mjs` owns Library/settings persistence plus current game,
  tool and unlocked-category session state.
- `library-state.mjs` owns document hydration, workspace slices, launcher filters,
  category/item movement and play-session updates.
- `navigation-state.mjs` owns Home/Library/Wall/Tools transitions and safe remembered
  selections. Home remains the normal startup view.
- `privacy-state.mjs` owns locked-category discovery, Home redaction, Wall filtering
  and panic-lock selection.
- `metadata-refresh-state.mjs` owns refresh targeting and review-queue transitions.
- `playtime-state.mjs` owns session/rating decisions and imported playtime patches.
- `settings-state.mjs` owns settings hydration and derived visual state.
- `experience-mode-state.mjs` keeps Default/Minimalistic interface density separate
  from Desktop/NEO Lounge presentation so themes and domain actions can be shared.
- `tool-bootstrap-state.mjs` owns idempotent managed hardware-tool defaults;
  `launcher-category-state.mjs` owns the ten launcher labels/categories;
  `update-ledger-state.mjs` owns bounded update evidence in Settings.
- `../input/controller-model.mjs` owns privacy-safe pad normalization and preferred
  fingerprints; `../input/controller-navigation.mjs` owns semantic commands, dead
  zones, safe repeats and activation rules. `../services/controller-input.mjs`
  refreshes Controller Center only while open, while
  `../services/controller-navigation-service.mjs` is a dormant explicit start/stop
  adapter for later focus integration.
- `../services/renderer-api.mjs` is the single App-to-preload gateway.

Theme ambience and decorative art render through `components/ThemeVisuals.jsx`.
They remain beneath interactive content and are separate from state transitions.

Run `npm run test:renderer-state` for the pure transition, privacy, experience,
controller, integration, JSX parsing and renderer-boundary checks.
