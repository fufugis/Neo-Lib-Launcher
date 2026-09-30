# NEO-LIB v1.8.3 — Major features since v1.7.9

This is a cumulative feature-focused summary of the work introduced since v1.7.9. It highlights the substantial changes and leaves routine hotfixes out.

## Lounge becomes a customizable couch experience

- **A dedicated fullscreen Lounge** brings together game browsing, cover Wall, game details and protected launch actions, designed for keyboard and controller use from the couch.
- **Retro Library and Emulator Zone** add console-by-console browsing, console artwork, shoulder-button switching and per-system game carousels. Consoles that are not configured direct players back to the launcher setup flow.
- **A smoother, more expressive carousel** grows and animates the selected game, centers controller selections fluidly, supports mouse-wheel browsing, and offers portrait and extra-tall cover cards without placing landscape banners inside them.
- **A full Lounge Visual Builder** controls layout, preview placement and size, information density, surface opacity, background framing and zoom, motion, lighting, particles and neon cover outlines. Its live preview follows the Lounge layout, and adjustable surfaces stay clear rather than blurring the background.
- **Lounge-only Themes and presets** keep their looks separate from the desktop theme. Save and select complete personal setups, and import or export portable presets without bundling local artwork or audio paths.
- **Living scenery and media** bring custom background drift and mini-zooms, animated GIF/APNG artwork, and muted looping local video (MP4, M4V, WebM, MOV and OGV). Simulated bloom, shimmering rays, highlights, particles and two-colour neon edges add motion, with Still, Motion Off, Rest and reduced-motion safeguards.
- **Sound & Music gets its own destination**, with Lounge ambience, navigation cues, supplied samples and personal clips. Choices and the last-used Lounge setup are saved locally.
- **Couch-friendly details** include larger game screenshots that can be enlarged with mouse, keyboard or controller focus, plus customizable preview facts such as playtime, journey, release and ratings.

## Library and artwork improvements

- **One Library Wizard** brings manual additions, folder scans, launcher imports, Retro setup, metadata refresh and library care into a guided workflow.
- **Full-workspace Wall** offers cover browsing and a details view with adjustable layouts, columns and sizing, while the normal Library remains available as the everyday workspace.
- **Better artwork roles and recovery** distinguish portrait covers from landscape heroes and backgrounds. Cover selection prefers verified portrait art; hero artwork can be reframed and gently animated, including local GIF and video, from Edit game → Artwork.
- **Broader metadata discovery** searches across available providers and can use optional SteamGridDB portrait covers. Artwork and metadata choices remain reviewable before being saved.
- **Larger, better-fitted Library heroes** favor useful background art or screenshots and avoid stretching small store headers across ultrawide layouts.

## Home and personal organization

- **Home widgets remain movable and resizable** while gaining a cleaner, single-title design and restrained accents that distinguish activity, discovery, updates and system information.
- **More purposeful navigation** adds an optional coloured icon sidebar, direct Lounge access, and clearer destinations for Home, Library, Wall and Tools.
- **Library & Metadata backup and care** can export and restore the library with cached artwork, reset game entries while preserving playtime/Home information, and remove categories with per-category PIN protection.

## Release status

These notes summarize features present in the current source line; they do not claim that a v1.8.3 installer has been built or accepted. The latest recorded renderer/package attempt was blocked by this environment's `esbuild` child-process `spawn EPERM` failure. A normal Windows build and installed-app acceptance are still required before calling v1.8.3 ready to ship.
