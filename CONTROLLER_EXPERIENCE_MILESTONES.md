# NEO-LIB controller and experience milestones

This is a product track, not a rewrite of the desktop launcher. The current
Default desktop experience remains the safe baseline throughout the work.

## Product model

NEO-LIB has two independent choices:

1. **Interface mode** — `Default` keeps today's information-rich workspace;
   `Minimalistic` presents the same library and features with calmer hierarchy,
   fewer simultaneous controls and progressive disclosure.
2. **Presentation mode** — `Desktop` is the current mouse/keyboard window;
   the future **NEO Lounge** is a fullscreen, distance-readable, controller-first
   experience. A theme is visual identity and remains compatible with every mode.

Keeping these choices separate prevents Minimalistic from becoming a theme and
prevents fullscreen from becoming a second, disconnected application.

## Milestone C0 — foundation (source complete)

- Define stable Default/Minimalistic and Desktop/NEO Lounge identifiers.
- Normalize browser-visible gamepads into a small privacy-safe device model.
- Define semantic actions such as Confirm, Back, Details and Next section rather
  than teaching pages to react to Xbox/PlayStation button numbers directly.
- Provide the official Windows Bluetooth settings route as the hand-off for
  pairing/removal. NEO-LIB does not impersonate Windows device management.
- No visible UI or input interception in this milestone.

## Milestone C1 — Controller Center (source complete; Windows acceptance pending)

- Add an optional Controller Center that refreshes only while it is open.
- Show connected controllers, active/preferred pad, standard mapping status,
  last-seen connection state and a simple input test.
- Offer **Manage controllers in Windows**, opening `ms-settings:bluetooth`.
- Say when battery, wireless state or a disconnect action is unavailable rather
  than inventing data the browser Gamepad API does not expose.
- Save only a small preferred-device fingerprint; never record button history.

The live Settings entry now meets the source requirements above. It also fixes
the native route boundary that previously rejected the existing Optimize Center
Windows links: only five exact NEO-LIB-owned `ms-settings:` destinations are
allowed, while arbitrary settings routes, local files and game protocols remain
blocked. A rebuilt app and physical controllers are still required for C1
acceptance.

## Milestone C2 — controller navigation (safety foundation complete)

- Introduce one focus/navigation layer shared by Default and Minimalistic modes.
- Use semantic commands, visible focus, repeat-delay protection and modal focus
  traps. Preserve mouse, keyboard and accessibility behavior.
- Test reconnect, duplicate pads, held buttons, overlays, text fields, private
  locks, panic lock, Rest Mode and launching.
- NEO-LIB controls only its own interface. Games continue using their own native
  controller support after launch.

The pure command/repeat model and an explicit start/stop frame adapter now exist
without being enabled in the app. Confirm/Back/Home never auto-repeat, typing
suppresses controller commands, HOME cannot escape a modal, and Launch controls
cannot be controller-activated through the current trusted-click path. Visible
focus ownership, modal/surface integration and a dedicated controller-safe
hold-to-launch confirmation remain the next C2 work.

## Milestone C3 — Minimalistic interface

- Build it as a presentation policy over existing data/actions, not duplicated
  feature logic.
- Keep advanced actions available through focused drawers and context panels.
- Retain every theme, privacy rule, metadata source and launch safeguard.
- Allow instant return to Default with no library migration.

## Milestone C4 — NEO Lounge fullscreen

- Create a distance-readable home/library/preview flow with large focus targets,
  fast resume and a controller-safe on-screen keyboard hand-off where necessary.
- Make quick launch, recent sessions, updates, downloads, controller status,
  private-lock state and the selected mascot feel native to the experience.
- Add an explicit Enter/Exit Lounge action; never seize fullscreen at startup.
- Measure idle GPU/CPU cost and keep Rest Mode behavior identical to Desktop.

## Milestone C5 — polish and identity

- Add optional controller glyph families chosen from detected mapping, without
  claiming an exact brand when detection is ambiguous.
- Give NEO Lounge its own motion language, transitions and sound cues while all
  themes remain recognizable.
- Explore unique NEO-LIB features: a living mascot guide, update-aware game cards,
  session memory, private-category shielding and a one-action low-use launch flow.

## Acceptance rule

Each milestone needs pure model tests first, then a rebuilt Windows interaction
pass with Xbox-style, PlayStation-style and generic pads where available. No
milestone is called controller-ready from static source checks alone.
