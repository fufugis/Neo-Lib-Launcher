# NEO-LIB v1.8.4 — Major features since v1.7.9

This is a cumulative, feature-focused summary of the major changes introduced since v1.7.9. Routine hotfixes are intentionally left out.

## Windows installer rebuild

The release source is prepared for a fresh Windows installer and portable ZIP rebuild. Run the repository's release command in a normal PowerShell environment with the configured feedback relay variables available, then inspect the produced installer and portable archive before installing. No installer is claimed by this source-only summary.

## Carried-forward features

The launcher no longer plays a startup logo intro or CRT boot flash. Saved settings and the library load together before the configured layout is displayed. Dedicated compressed sidebar artwork starts loading early while preserving the original artwork and framing. Live startup and interaction measurements remain pending; this is not a claimed FPS or Core Web Vitals result.

Wave drift keeps its moving surface beyond the visible screen with soft feathered edges and bounded travel. Strong combined motion settings no longer move the layer's hard rectangular edge across the scenery; waves and their intensity controls remain available.

Imported custom pictures and videos use an app-owned media route that works with the live development renderer as well as the packaged page. Saved backgrounds and lighting metadata retain their identity; browser security stays enabled. Restart the app fully once to activate the new native handler.

Custom background import is under Lounge Themes → Scenes → Custom background, including reuse of the saved picture/video. Private copies and reusable lighting preparation remain intact. Visuals keeps positioning, zoom, colours and effects.

Global widget zoom keeps each tile's boundaries and width fixed inside the holding box. Only its heading and inner content grow; the grid and scroll areas no longer shrink as zoom increases.

Widgets can move farther upward into empty space beside browsing controls, instead of stopping at the entire controls area's bottom edge. The highest position keeps clearance from controls in its own lane and stays below the header. The hero and carousel remain unchanged.

Lounge Sound & Music adds seven click effects, ClickF through ClickL, under Clicks. Preview and assign them to movement, confirmation, back or game details without changing existing selections. The bundled collection now contains 44 clips.

Lounge Settings → Widgets adds Global widget zoom (75–200%, normal 100%). It enlarges artwork, text and controls together without changing the holding box, hero or desktop Home. Content remains scrollable and the mini preview reflects the zoom.

Highlight pulse has gently sweeping, breathing rays tinted by its artwork light source. The existing shimmer-speed control sets their pace; Motion Off, Rest and reduced motion keep them still. The gradient is reused rather than repainted each frame.

Lounge Settings opens in a larger box: up to 700px wide normally and 810px in Far mode, with more height on tall screens. Smaller displays remain protected by viewport bounds and internal scrolling.

Highlight pulse takes its colour from the artwork patch around its detected light source, rather than fixed white/warm or theme colours. The tint is cached, retained through framing adjustments and saved with custom-background lighting metadata. Earlier profiles acquire the colour once when used.

Visual Builder is wider and its three rows are rebalanced: artwork beside colour/film finish, separate layout/appearance columns, and frames apart from particles. Near and Medium modes use shorter slider containers without shrinking sliders or buttons; Far mode retains roomier controls. The live preview remains pinned above the scrolling settings.

Lounge description and widget panels can sit closer to the carousel beside its enlarged selection. The selected card no longer raises the clearance limit across the entire screen: only panels crossing the taller centre card or nearby enlarged cards reserve that extra height.

Lounge widget height now ranges up to 100% of the actual free area, without an inactive upper slider range. Vertical placement spans top to bottom; full-height boxes explain that they must be shortened before moving. Mixed top/bottom slots use the actual description boundary rather than fixed half-screen limits. Shared description/widget opacity can be reduced to 20%.

Lounge FX use clearer layering: scenery shading sits below atmosphere emissions, with broad bloom/highlights behind detailed rays and smoke. Ambient-light strength is independent of bloom, and regular rays now work in Steampunk and Anime Winter. Existing slider ranges remain; simultaneously maximising every effect can still overwhelm subtle details.

Custom Lounge artwork is prepared on import with saved lighting metadata beside its private image copy. Dimensions, a bright-source anchor, brightness tiles and average colour are retained; existing lighting reloads the anchor without repeated image analysis and projects it through zoom/fit/position changes. Earlier imports prepare on first use. Animated artwork uses one representative frame. This is lightweight luminance analysis, not AI depth estimation; no DDS conversion is required.

Lounge scene description panels use screen-aware placement even when widgets are disabled. Moving a preview down keeps the whole box visible above the carousel rather than clipping it at the old preview-stage boundary. The Visual Builder preview uses the same placement.

The v1.8.4 build retains the tested launch safety, controller, backup, playtime, update, feedback and privacy boundaries carried forward from the preceding releases. Existing library data and Home/playtime information remain outside the destructive Library reset scope.

## A couch-ready Lounge

Maximum widget sizing now uses the actual free space beside the description and above the visible carousel cards. A fixed midpoint and the carousel's transparent glow viewport no longer unnecessarily restrict the box. Screen bounds, description separation and peak selected-card clearance remain protected; widget feeds stay independent of carousel selection.

Lounge Settings adds Carousel game titles: keep names below covers or choose Artwork only. Removing titles reclaims their height while retaining the bottom anchor; restoring titles lifts the artwork above that same baseline. Selection and neighbour scaling, glow clearance, accessible game names and Wall labels are retained.

Visual Builder adds Description cover size (50–250%) independently of the game carousel. Game-detail screenshots now fill a responsive full-width bottom gallery without horizontal scrolling. Selecting one opens a near-full-screen, uncropped viewer; the first keyboard, mouse or controller button input closes only the picture. Held keys and controller inputs must be released before acting on the details underneath.

FX strength now controls the complete configured look: Low 18%, Medium 42%, High 70%, and Max 100%. Atmosphere, postprocessing, motion, card glow and particles respond together, with matching live preview. Lower levels visibly soften strong effects without losing individual slider values or changing artwork framing.

Steampunk and Anime Winter add original brass-clockwork and frozen anime scenery, with their own Lounge palettes. Rust Flakes tumble like weathered metal; Blizzard sends fast wind-driven ice streaks across the scene, distinct from falling snow. Smoke adds localized soft wisps without a screen-covering haze, while Cold Rays add ice-blue shafts aligned with the artwork's light and framing.

Atmosphere, postprocessing and effects now have individual checkmarks. Only enabled effects reveal their tuning sliders; disabling an effect stops its output without losing its saved values. Particles remain in their own independent section, and the live preview uses the same effects as the Lounge scene.

The emulator console strip is cleaner: console logos and names remain, without side arrows or duplicated right-hand status text. Mouse-wheel and controller navigation are retained.

Lounge Settings → Widgets adds an optional Home-widget area, disabled by default. Choose up to four built-in Home widgets, with real library data and their own scrollable tiles. Place the area left, middle or right without occupying the description's slot; side-mounted game carousels unlock bottom placements for both. Width, height and vertical-position sliders fit the available space, with an optional holding box and opacity shared with the description. Desktop Home stays unchanged, and widget feeds stay separate from carousel selection updates.

Sound & Music is now a movable centered window with two clear rows: browsing cues and sample assignments above, music and ambience below. Its wider layout retains Far-mode readability and scrolls on smaller screens; sample selection opens independently of the dragged window.

Far / across-room viewing mode now makes Lounge popups easier to read: slightly larger text and controls, and approximately 15–18% wider Settings, Sound, Visuals, Themes, game details and navigation panels. Near/Medium modes retain their original sizes; mini-screen preview proportions and small-screen layouts stay intact.

Emulator browsing now uses two rows: a centered console carousel at the bottom, with the selected console's game carousel expanding above it. Down or Back collapses the game row; a mouse button provides the same action. Selecting a console starts with all its games, and unconfigured consoles show setup guidance.

The bottom console dock has a compact centered width with larger logos and labels. The selected console and its two nearest neighbours remain sharp and readable, while the outer pair fades gently; narrow screens retain the central three.

Lounge Settings now adds Emulators Size (70–150%) and Emulator carousel width (800–2400px) beside game cover size. These independently control console cards and the bottom row, with 3–9 consoles shown according to width and size. Settings are saved and included in layout reset; PC game card sizes are unchanged.

Controller navigation keeps Left/Right in the active game or console carousel, including at game-row endpoints. Up returns to the top controls; Down from browsing controls returns to the selected card. PC/Emulator tabs stay at the top. Browsing consoles does not open their games until confirmed. Sliders support controller focus and Left/Right adjustment, and custom frame colours offer red/green/blue sliders. Menus remain isolated from underlying carousel input.

Mouse-wheel and trackpad scrolling now browse the bottom emulator console row without opening games. Expanded game rows retain their own scrolling, including after reopening a console.

Horizontal game carousels and their glow now reach the real screen edges instead of being abruptly clipped at inset page margins. Hero panels, menus and effect strength stay unchanged.

Lounge no longer lays out and paints the covered launcher panels underneath it; their state is preserved for returning. Neutral controller polling no longer scans screen geometry every frame. All background and card effects remain available.

Scenery is isolated from carousel selection, image lighting analysis is reused per source, and GPU artwork resources persist while adjusting positioning. Carousel travel uses a single translated track with cached layout and off-screen artwork/effect suspension. Development frame timing and main-thread stall measurements support live tuning; fast-scroll smoothness and continuous flicker-free acceptance remain in progress. All visual effects remain available.

Built-in scenery supports GPU colour splitting while preserving chromatic aberration, grading, framing and motion controls; the existing image effect remains as a compatibility fallback. Preview copy stays readable during rapid selection instead of repeatedly restarting its entrance fade. Rapid-scroll performance acceptance is still in progress.

Built-in colour grading shares the existing GPU artwork pass instead of adding a second full-screen CSS filter. Shelf and hero covers reuse validated artwork when their actual image pixels are loaded. Continuous flashing-layer and smoothness verification remains open.

Emulator picker and setup-panel backdrops follow the existing Visuals panel opacity, without fading their text or controls.

Hero preview height has one control in Visuals, adjustable from 80px to the full screen height with proportional preview sizing.

Card glow strength is adjustable from 0–200%, with softer external neon halos and glow-aware carousel clearance to prevent sharp clipping.

Layout and filters share a slim top-right browsing dock with always-visible labels, raised alongside navigation on wide screens and kept below telemetry; PC/Emulator remains separate and the controls stay in place while browsing.

Navigation retains colour/glow feedback with stationary pointer targets and lighter hover transitions.
Carousel selection scales smoothly from its current size, with artwork-only brightness grading and steadier hover during scrolling.
Portraits finish decoding before replacing their fallback, and scenery blends stay isolated from foreground covers.
Carousel placement updates live in Visuals with upward/downward travel to the visible screen edge, independent of invisible glow padding; preview height and vertical placement respond independently of hero-region sizing.
Bloom spread controls glow radius proportionally without duplicating or shifting the light sources.
Carousel glide preserves fractional motion; neon and Reactor breathing retain their glow without changing shadow blur every frame.
Home pauses underlying Lounge effects and carousel movement while open, with stable hover and focus behaviour; browsing effects resume when returning.

- **Fullscreen Lounge** brings together game browsing, cover Wall, game details and protected launch actions, designed for keyboard and controller use from the couch.
- **Retro Library in Lounge** uses a top-left PC/Emulator switcher instead of a separate full-width Emulator Zone. The active source is highlighted; Emulator expands the pane so its five-console window has full-size, nonoverlapping marks and names centered on the selected system, with neighboring systems fading toward the edges. Arrows or controller shoulders move through all consoles, and the normal game filters remain available for either source. Consoles that are not configured direct players back to the launcher setup flow.
- **A smoother carousel** grows and animates the selected game from a shared bottom edge, keeping selected and neighboring cards flush when the horizontal carousel is moved down. The shelf reserves the selected card's full upward growth, including the brief focus animation, so its top is not clipped; downward placement stops before covers leave the screen. Its scrollbar track is hidden without disabling scrolling, so it cannot add a visual gutter or shift the layout. Mouse-wheel input now moves the selected game reliably without passive-listener warnings, and controller selections use a refresh-rate-independent glide without snap-back; unchanged distant covers no longer redraw as selection moves. Valid portrait covers do not also fetch and paint wide fallback art, and the image-derived light effect reuses the displayed game/personal image rather than decoding a second copy on each selection. Portrait and extra-tall cover cards avoid landscape banners inside them.
- **Visual Builder** groups its controls into three purpose-based rows—Scenery & artwork, Game layout & readability, and Atmosphere & effects—and keeps its taller mini screen visible while scrolling. The preview uses neighboring games, selected-cover size, active particle level, motion pace and top-bar opacity from the current Lounge settings. Horizontal/vertical framing and 50–200% zoom now work for built-in scenes as well as personal and game artwork; zoom no longer collapses imported images, and image-derived rays/highlights follow fit, crop and zoom in the full scene and mini preview. It controls layout, preview placement and size, information density, surface opacity, background framing, motion, lighting, particles and neon cover outlines. New independent controls grade scenery saturation, contrast and warmth; tune built-in scene drift and micro-zoom; add moving aurora ribbons with intensity, speed and height; and shape screen-edge glow with width and pulse. Three editable light looks give a starting point. The carousel has five selectable whole-card frames—Classic, Gallery, Glass, Chrome and animated Reactor—shown in the live preview and independent of cover glow. Bloom now reaches 600%; rays and waves reach 300%, with independent wave drift, bloom spread, ray softness and light-shimmer speed controls. Strong effects keep their saved intensity while animated full-screen filters and grain texture repaints are reduced; neon/Reactor frames animate around focused games rather than every library card. The image-derived highlight pulse stays adjustable and uses a local glow rather than a duplicate full-screen image; soft atmospheric light is rendered more economically at high resolution. A separate preview light that caused a full-width seam and artificial orb is removed; adjustable surfaces stay clear rather than blurring the background.
- **More carousel and particle styling** adds six procedural Lounge particle looks—Prism Shards, Digital Rain, Ember Rise, Halo Rings, Starbursts and Moon Wisps—alongside the existing particles. Carousel frames now offer theme-matched, five curated and custom colours, with the same choices shown in frame samples and the live preview. Frame colour remains independent of frame shape and cover glow.
- **Clearer couch-distance choices and film effects** make Near, Medium and Far navigation presets visibly different, with exact button sizes shown in Settings and larger persistent labels at sofa/across-room distances. The top buttons sit beneath the Lounge heading so top-right performance overlays do not cross their icons and names. Visual Builder adds Film grain and Chromatic aberration sliders for the scenery and its live preview. Both start Off, leave covers and interface text clear, and respect motion/reduced-motion safeguards. Grain moves in small, measured steps and strong lighting pulses retain a steady bright baseline rather than flashing across the scenery; their maximum strengths remain available.
- **Lounge-only themes and presets** stay separate from the desktop theme. Original Solar Grove and Rainlight City scenery add warm forest light and cool rain-washed neon, each with a matching palette and scene-aware particles. Save and select complete personal setups, and import or export portable presets without bundling local artwork or audio paths.
- **Living scenery and media** bring custom background drift and mini-zooms, animated GIF/APNG artwork, and muted looping local video (MP4, M4V, WebM, MOV and OGV). Simulated bloom, image-derived shimmering rays and pulse-controlled overexposure, particles and two-colour neon edges add motion while keeping the highlighted image aligned with its source, with Still, Motion Off, Rest and reduced-motion safeguards.
- **Sound & Music** gets its own destination, with Lounge ambience, navigation cues, supplied samples and personal clips. Choices and the last-used Lounge setup are saved locally.
- **Couch-friendly details** include larger game screenshots that can be enlarged with mouse, keyboard or controller focus, plus customizable preview facts such as playtime, journey, release and ratings.

## Library, artwork and metadata

- **One Library Wizard** brings manual additions, folder scans, launcher imports, Retro setup, metadata refresh and library care into a guided workflow.
- **Full-workspace Wall** offers cover browsing and a details view with adjustable layouts, columns and sizing, while the normal Library remains the everyday workspace.
- **Better artwork roles and recovery** distinguish portrait covers from landscape heroes and backgrounds. Cover selection favors portrait art; hero artwork can be reframed and animated, including local GIF and video, from Edit game → Artwork.
- **Broader metadata discovery** searches across available providers and can use optional SteamGridDB portrait covers. Artwork and metadata suggestions stay reviewable before saving.
- **A library-wide repair list** scans games together, showing the executable, detected title, cover, artwork warnings and metadata coverage. Fix or refresh one game directly from its row instead of stepping through a popup for every title. After applying or cancelling a single-game repair, the same audit list stays open with its search and view choice intact; the Wizard remains available when you finish. It flags missing covers, known-wide files and reused images; visual inspection is still needed to spot unrelated or badly framed art that file data cannot identify.
- **More direct cover selection** shows recommended portrait-art results in NEO-LIB when a SteamGridDB key is configured. Suggestions now require a matching game title and a successfully loaded portrait image, rather than offering broken Steam image links or nearby demos and soundtracks. Google Images can also be opened for a chosen game; paste a direct image URL back into the review, verify its portrait preview and explicitly apply it.
- **Library Health measures more than file presence**, including portrait covers, descriptions, genres, developer/publisher, release date, launch targets and duplicate candidates. Its review action opens the same game-by-game repair list.
- **Larger, better-fitted Library heroes** favor useful background art or screenshots and avoid stretching small store headers across ultrawide layouts.
- **Library & Metadata backup and care** can export and restore the library with cached artwork, reset game entries while preserving playtime/Home information, and remove categories with per-category PIN protection.

## Home and navigation

- **Home widgets remain movable and resizable**, with simpler single-title framing, restrained accents, and stronger title text that is easier to read across themes.
- **More purposeful navigation** adds an optional coloured icon sidebar, direct Lounge access, and clearer destinations for Home, Library, Wall and Tools. The sidebar now has compact Lounge, Browse, Actions, Personalise, NEO-LIB and Exit headings; each heading and its controls share a restrained accent rather than giving every icon a different colour. Disabling the sidebar restores the normal Menu dropdown.

## Release status

Source preparation is complete: package, displayed version, current in-app changelog and Windows release workflow target v1.8.4. Targeted release-hardening, configuration, provenance, startup and renderer checks pass. The complete build gate, production rendering measurements, installer/portable inspection and Windows acceptance remain pending. This preparation does not publish a tag, create an installer or certify the outstanding Lounge visual changes.

The application/package version is 1.8.4. This document is a feature summary, not proof of a successful installer build or installed-app acceptance; those checks remain tracked in [WINDOWS_ACCEPTANCE_V1.8.4.md](WINDOWS_ACCEPTANCE_V1.8.4.md).
