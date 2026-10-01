# NEO-LIB v1.8.3 — Major features since v1.7.9

This is a cumulative, feature-focused summary of the major changes introduced since v1.7.9. Routine hotfixes are intentionally left out.

## Windows installer rebuild

The release source is prepared for a fresh Windows installer and portable ZIP rebuild. Run the repository's release command in a normal PowerShell environment with the configured feedback relay variables available, then inspect the produced installer and portable archive before installing. No installer is claimed by this source-only summary.

## Carried-forward features

The v1.8.3 build retains the tested launch safety, controller, backup, playtime, update, feedback and privacy boundaries carried forward from the preceding releases. Existing library data and Home/playtime information remain outside the destructive Library reset scope.

## A couch-ready Lounge

- **Fullscreen Lounge** brings together game browsing, cover Wall, game details and protected launch actions, designed for keyboard and controller use from the couch.
- **Retro Library in Lounge** uses a compact PC/Emulator switcher instead of a separate full-width Emulator Zone. The active source is highlighted; Emulator shows a five-console window centered on the selected system, with neighboring systems fading toward the edges. Arrows or controller shoulders move through all consoles, and the normal game filters remain available for either source. Consoles that are not configured direct players back to the launcher setup flow.
- **A smoother carousel** grows and animates the selected game from a shared bottom edge, keeping selected and neighboring cards flush when the horizontal carousel is moved down. Its scrollbar track is hidden without disabling scrolling, so it cannot add a visual gutter or shift the layout. Mouse-wheel and controller selections now use a refresh-rate-independent glide without snap-back; unchanged distant covers no longer redraw as selection moves. Portrait and extra-tall cover cards avoid landscape banners inside them.
- **Visual Builder** controls layout, preview placement and size, information density, surface opacity, background framing and zoom, motion, lighting, particles and neon cover outlines. New independent controls grade scenery saturation, contrast and warmth; tune built-in scene drift and micro-zoom; add moving aurora ribbons with intensity, speed and height; and shape screen-edge glow with width and pulse. Three editable light looks give a starting point. The carousel has five selectable whole-card frames—Classic, Gallery, Glass, Chrome and animated Reactor—shown in the live preview and independent of cover glow. Bloom now reaches 600%; rays and waves reach 300%, with independent wave drift, bloom spread, ray softness and light-shimmer speed controls. The highlight-pulse image treatment stays adjustable and now follows the correct crop and movement on ultrawide screens. A separate preview light that caused a full-width seam and artificial orb is removed; adjustable surfaces stay clear rather than blurring the background.
- **More carousel and particle styling** adds six procedural Lounge particle looks—Prism Shards, Digital Rain, Ember Rise, Halo Rings, Starbursts and Moon Wisps—alongside the existing particles. Carousel frames now offer theme-matched, five curated and custom colours, with the same choices shown in frame samples and the live preview. Frame colour remains independent of frame shape and cover glow.
- **Clearer couch-distance choices and film effects** make Near, Medium and Far navigation presets visibly different, with exact button sizes shown in Settings and larger persistent labels at sofa/across-room distances. Visual Builder adds Film grain and Chromatic aberration sliders for the scenery and its live preview. Both start Off, leave covers and interface text clear, and respect motion/reduced-motion safeguards.
- **Lounge-only themes and presets** stay separate from the desktop theme. Original Solar Grove and Rainlight City scenery add warm forest light and cool rain-washed neon, each with a matching palette and scene-aware particles. Save and select complete personal setups, and import or export portable presets without bundling local artwork or audio paths.
- **Living scenery and media** bring custom background drift and mini-zooms, animated GIF/APNG artwork, and muted looping local video (MP4, M4V, WebM, MOV and OGV). Simulated bloom, image-derived shimmering rays and pulse-controlled overexposure, particles and two-colour neon edges add motion while keeping the highlighted image aligned with its source, with Still, Motion Off, Rest and reduced-motion safeguards.
- **Sound & Music** gets its own destination, with Lounge ambience, navigation cues, supplied samples and personal clips. Choices and the last-used Lounge setup are saved locally.
- **Couch-friendly details** include larger game screenshots that can be enlarged with mouse, keyboard or controller focus, plus customizable preview facts such as playtime, journey, release and ratings.

## Library, artwork and metadata

- **One Library Wizard** brings manual additions, folder scans, launcher imports, Retro setup, metadata refresh and library care into a guided workflow.
- **Full-workspace Wall** offers cover browsing and a details view with adjustable layouts, columns and sizing, while the normal Library remains the everyday workspace.
- **Better artwork roles and recovery** distinguish portrait covers from landscape heroes and backgrounds. Cover selection favors portrait art; hero artwork can be reframed and animated, including local GIF and video, from Edit game → Artwork.
- **Broader metadata discovery** searches across available providers and can use optional SteamGridDB portrait covers. Artwork and metadata suggestions stay reviewable before saving.
- **A library-wide repair list** scans games together, showing the executable, detected title, cover, artwork warnings and metadata coverage. Fix or refresh one game directly from its row instead of stepping through a popup for every title. It flags missing covers, known-wide files and reused images; visual inspection is still needed to spot unrelated or badly framed art that file data cannot identify.
- **More direct cover selection** shows recommended portrait-art results in NEO-LIB when a SteamGridDB key is configured. Google Images can also be opened for a chosen game; paste a direct image URL back into the review, preview it and explicitly apply it.
- **Library Health measures more than file presence**, including portrait covers, descriptions, genres, developer/publisher, release date, launch targets and duplicate candidates. Its review action opens the same game-by-game repair list.
- **Larger, better-fitted Library heroes** favor useful background art or screenshots and avoid stretching small store headers across ultrawide layouts.
- **Library & Metadata backup and care** can export and restore the library with cached artwork, reset game entries while preserving playtime/Home information, and remove categories with per-category PIN protection.

## Home and navigation

- **Home widgets remain movable and resizable**, with simpler single-title framing, restrained accents, and stronger title text that is easier to read across themes.
- **More purposeful navigation** adds an optional coloured icon sidebar, direct Lounge access, and clearer destinations for Home, Library, Wall and Tools. When the sidebar is enabled it becomes the complete navigation surface, grouping Lounge, primary destinations, tools and utility controls; disabling it restores the normal Menu dropdown.

## Release status

The application/package version is 1.8.3. This document is a feature summary, not proof of a successful installer build or installed-app acceptance; those checks remain tracked in [WINDOWS_ACCEPTANCE_V1.8.3.md](WINDOWS_ACCEPTANCE_V1.8.3.md).
