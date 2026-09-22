# NEO-LIB v1.7.9 — Library workflow and Wall polish hotfix

v1.7.9 is a focused follow-up to the v1.7.8 architecture candidate. It keeps
the existing launcher, metadata, privacy and mascot work intact while making
Library and Wall easier to use.

## What changed

- **One Library Wizard** — manual game add, folder scans, launcher imports,
  missing-metadata refresh, full metadata refresh and library tidy-up now start
  from Wizard. The duplicate Add and Refresh toolbar menus are gone.
- **Full-workspace Wall** — Wall hides the Library pane and becomes a lighter
  browsing mode. Home and Library actions return to the normal workspace.
- **Two Wall views** — choose large side-by-side cover browsing or a detailed
  list with main genre, release date, last played, install size, tracked hours,
  source and personal rating.
- **Slim Wall controls** — the former tall Wall introduction and two large view
  cards are now one compact toolbar with Covers/Details, density and return
  controls, leaving much more room for the collection.
- **Better cover recovery** — older Steam imports reuse their saved app ID to
  load official portrait art. Titles without a portrait show vivid existing
  artwork instead of a washed-out gray card, with a colorful NEO-LIB title
  cover as the final fallback.
- **Readable Wall polish** — ratings use a flat, shadow-free 11px badge with a
  clean star icon, and cover titles keep a readable size at every density,
  truncating long names instead of shrinking them into unreadable text.
- **Library crash fix** — capability-only games can no longer make Preview read
  an achievement source from a missing achievement record.
- **Community shortcut** — Reddit remains immediately beside Discord in the
  title bar for the official NEO-LIB community.
- **Category-free Home widget canvas** — Home now has a clear Unlock/Done mode
  and no movable category containers. Every widget stands alone. Snap mode
  provides live grid reordering; Free move stores exact position, size, overlap
  and stacking. Title-bar menus expose placement mode, stacking, resizing,
  reset and hide actions.
- **Compact widget manager** — built-in and imported widgets use tidy
  three-column cards with the author inline, short descriptions, concise size
  facts and an accessible eye-only visibility control.

## Verification

Focused Home-widget, visual-boundary, renderer-binding and metadata-workflow
checks pass, and the complete renderer prebuild source gate passes.
Rebuilt Windows visual and interaction acceptance remains required before this
candidate is published as a public release.

## Release status

This is a testing candidate. Publish only from the exact clean Git tag
`v1.7.9` after the Windows acceptance record is complete.
