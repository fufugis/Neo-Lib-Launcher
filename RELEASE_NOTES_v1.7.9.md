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
- **Readable Wall polish** — ratings use a fixed high-contrast badge and cover
  titles keep a readable size at every density, truncating long names instead
  of shrinking them into unreadable text.
- **Community shortcut** — Reddit remains immediately beside Discord in the
  title bar for the official NEO-LIB community.

## Verification

Focused visual-boundary, renderer-binding and metadata-workflow checks pass.
Rebuilt Windows visual and interaction acceptance remains required before this
candidate is published as a public release.

## Release status

This is a testing candidate. Publish only from the exact clean Git tag
`v1.7.9` after the Windows acceptance record is complete.
