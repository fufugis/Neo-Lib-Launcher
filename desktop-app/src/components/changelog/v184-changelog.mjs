export const V184_CHANGELOG = {
  version: '1.8.4',
  title: 'Lounge, Library and Home expanded',
  major: [
    {
      title: 'Direct startup and lighter sidebar artwork',
      body: 'The startup logo and CRT flash are gone. Saved layout preferences load alongside your library before the launcher appears. Dedicated compressed sidebar artwork loads early, with original pictures and framing retained.',
    },
    {
      title: 'Wave drift without travelling cutoffs',
      body: 'Waves have extra off-screen coverage and feathered edges. Combined drift, motion and strength cannot push a hard rectangular layer edge across the picture. Wave colour, strength and motion remain available.',
    },
    {
      title: 'Imported backgrounds load in live development',
      body: 'Custom backgrounds use a restricted route for NEO-LIB’s copied media, avoiding local-file loading failures in the live development app. Saved pictures and lighting metadata remain intact; browser security stays enabled. Restart the app once after updating.',
    },
    {
      title: 'Custom backgrounds belong in Themes',
      body: 'Import your own artwork or video in Themes → Scenes → Custom background, or reuse the saved background. Lighting preparation and private copies are preserved. Framing, zoom and effects remain in Visuals.',
    },
    {
      title: 'Widget zoom keeps tiles full-size',
      body: 'Zoom enlarges headings, text, artwork and controls inside each widget. Tile widths, grid boundaries and scrolling areas stay fixed, so widgets no longer shrink inside the holding box.',
    },
    {
      title: 'Widgets can reach higher',
      body: 'Widget vertical position uses clear space beside the browsing controls, keeping safe clearance from controls above its own position. The top header, hero and carousel stay protected, and settings and mini preview share the expanded range.',
    },
    {
      title: 'Seven more click sounds',
      body: 'ClickF through ClickL join the Clicks sound picker in Lounge Sound & Music. Preview and assign them to any sound role; your current selections stay unchanged. There are now 44 bundled clips.',
    },
    {
      title: 'Global widget zoom',
      body: 'Zoom every imported widget together from 75% to 200% in Lounge Settings → Widgets. Artwork, text and controls scale together while the outer box stays in place and content remains scrollable. Normal size is 100%; desktop Home is unchanged.',
    },
    {
      title: 'Pulse rays feel alive',
      body: 'Source-coloured rays gently sweep and breathe around the highlight. Existing shimmer speed sets their pace, while Motion Off, Rest and reduced motion keep them still. Static gradients are reused with movement and opacity animation only.',
    },
    {
      title: 'Bigger Lounge Settings',
      body: 'A wider and taller settings box gives text and sliders more room: 700px normally, 810px in Far mode. The window stays within smaller screens and retains its live preview, dragging and scrolling.',
    },
    {
      title: 'Highlight pulse matches its light source',
      body: 'The highlight samples the colour around its light-source spot, not the average picture or theme palette. Both glow layers reuse that tint through zoom and positioning, with no per-frame analysis. Custom-background profiles save the colour and older profiles acquire it on first use.',
    },
    {
      title: 'A wider, tidier Visual Builder',
      body: 'More width and balanced groups give artwork, colour, preview placement, frames and particles room to breathe. Near and Medium modes use shorter slider boxes without reducing slider or button size. Far mode keeps its generous spacing, and the live preview remains pinned.',
    },
    {
      title: 'Side panels sit closer to the carousel',
      body: 'The selected card no longer sets the clearance height for the entire row. Side descriptions and widgets can move down toward ordinary cards, while panels overlapping the enlarged centre card or neighbours still keep safe clearance. Settings and previews follow the same bounds.',
    },
    {
      title: 'Widget controls use the available space',
      body: 'Widget height now runs up to 100% of the usable area, while vertical position spans top to bottom without an inactive half-range. A full-height box explains why movement is unavailable until shortened. Actual description boundaries replace fixed half-screen widget limits, and shared hero/widget opacity now goes down to 20%.',
    },
    {
      title: 'Clearer atmosphere layering',
      body: 'Steampunk and Anime Winter gain regular ray styles. Ambient light no longer weakens when bloom is reduced. Scenery shading sits behind atmosphere effects, and detailed rays and smoke sit above broad bloom/highlights. Slider ranges and effects remain intact; all-at-maximum can still be visually intense.',
    },
    {
      title: 'Custom backgrounds remember their lighting',
      body: 'Imported artwork prepares a saved lighting profile beside its private copy. Lounge reuses its bright-source anchor rather than rereading pixels, including after reopening the app. Older imports prepare on first use; animated artwork samples one frame. Fit, zoom and position still project the lighting correctly.',
    },
    {
      title: 'Description preview stays visible when moved down',
      body: 'Scene hero panels now use screen-aware placement even with widgets turned off. Downward positioning keeps the complete box above the carousel instead of clipping it at an old container boundary. The Visual Builder preview follows the same layout.',
    },
    {
      title: 'Lounge widgets use more of the free scene',
      body: 'Maximum widget sizing expands beside the actual description box and above the visible carousel cards. Fixed midpoint and transparent shelf-padding limits are removed, while screen boundaries and peak selected-card clearance stay protected.',
    },
    {
      title: 'Optional carousel game titles',
      body: 'Choose Show titles or Artwork only in Lounge Settings. Cards retain their bottom anchor: turning titles on lifts the artwork, while turning them off reclaims the title strip. The live preview follows the choice; Wall labels and accessible game names stay intact.',
    },
    {
      title: 'Bigger description covers and screen-fitting pictures',
      body: 'Visual Builder adds Description cover size from 50–250%. Screenshots fill the bottom of game details without horizontal scrolling, and selected pictures open near full-screen without cropping. The first keyboard, mouse or controller button input closes only the picture; held inputs must be released before acting on details.',
    },
    {
      title: 'FX strength with a meaningful range',
      body: 'Low uses 18%, Medium 42%, High 70%, and Max 100% of your configured look. Atmosphere, postprocessing, motion, card glow and particles respond together, including the live preview. Your individual tuning and artwork framing stay unchanged.',
    },
    {
      title: 'Steampunk, Anime Winter and individual effect controls',
      body: 'Two original Lounge scenes add brass clockwork scenery and an icy anime village. Rust Flakes tumble while Blizzard drives ice streaks diagonally. Local Smoke wisps and ice-blue Cold Rays have their own tuning. Atmosphere, postprocessing and effects use independent checkmarks: only enabled effects reveal sliders, and disabled tuning is retained. Particles stay separate.',
    },
    {
      title: 'Cleaner emulator console browsing',
      body: 'Console logos and names stand on their own, without side arrows or repeated status text. Mouse-wheel browsing and controller wraparound remain available.',
    },
    {
      title: 'Your Home widgets in Lounge',
      body: 'Enable Settings → Widgets to choose up to four built-in Home widgets. Adjust placement, width, height and vertical position within safe screen bounds. Widgets cannot occupy the description slot; side carousels unlock bottom placements. Hide the holding box for an integrated look, with opacity shared with the description. Desktop Home is unchanged.',
    },
    {
      title: 'Movable two-row Sound & Music',
      body: 'Drag the Sound & Music title bar to reposition its wider window. Browsing sounds and samples occupy the upper row, with music and ambience below. Far-mode sizing and independent sample selection are retained.',
    },
    {
      title: 'Roomier across-room Lounge popups',
      body: 'Far viewing distance adds modestly larger text and controls, plus wider Lounge settings and other popups. Near and Medium sizes stay unchanged, with mini-screen previews and smaller displays protected.',
    },
    {
      title: 'Screen-edge carousel glow',
      body: 'Horizontal game rows extend through the page margins, removing inset side seams from covers and their glow. Hero and menu spacing stays unchanged, with all effects retained.',
    },
    {
      title: 'Mouse scrolling for emulator consoles',
      body: 'Mouse wheels and trackpads browse the bottom console carousel without opening its games. Expanded game rows keep separate scrolling and reconnect correctly after reopening.',
    },
    {
      title: 'Controller carousel lanes and reachable controls',
      body: 'Left/Right stays in game or console carousels; Up reaches upper controls and Down returns to the selected card. PC/Emulator tabs are back at the top. Console browsing only opens games when confirmed. Sliders support controller adjustment, including RGB custom frame colours, while menus retain priority over browsing.',
    },
    {
      title: 'Adjustable emulator dock',
      body: 'Emulators Size and Emulator carousel width sit beside game cover size in Lounge Settings. Resize console cards and fit more or fewer systems in the centered bottom row without changing PC covers. Both controls are saved and reset with the layout.',
    },
    {
      title: 'Two-tier emulator carousel',
      body: 'Choose a console from the compact centered bottom row, with larger logos and a sharp, readable central trio, to expand its games above. Down or Back collapses the games and returns to consoles; mouse users have a Back to consoles button. Unconfigured consoles show setup guidance.',
    },
    {
      title: 'Less hidden work while browsing Lounge',
      body: 'Covered launcher panels stop layout and painting while retaining their state. Neutral controller polling avoids repeated screen-geometry scans. Live fast-scroll timing improved with all visual effects retained; continuous flicker and packaged verification remain in progress.',
    },
    {
      title: 'Separate scenery and reusable rendering work',
      body: 'Carousel selection no longer updates unrelated scenery. Image lighting is sampled once per source, GPU artwork resources are reused, and carousel travel uses cached geometry and one translated track. Distant cards suspend artwork/effects while keeping navigation intact. All effects remain available; live fast-scroll acceptance is still in progress.',
    },
    {
      title: 'GPU artwork rendering and steadier previews',
      body: 'Built-in Lounge backgrounds combine colour splitting and grading in one GPU pass with compatibility fallback, retaining chromatic aberration and visual controls. Shelf and hero covers reuse validated loaded artwork. Rapid game selection no longer repeatedly restarts the preview entrance fade. Fast-scroll performance verification remains in progress.',
    },
    {
      title: 'Consistent emulator panel opacity',
      body: 'Emulator selector and setup-panel backgrounds now follow the existing Visuals panel opacity, including decorative tint, while keeping text and controls readable.',
    },
    {
      title: 'Softer, adjustable carousel glow',
      body: 'Card glow strength now sits beneath the glow choices, from 0–200%, with saved settings and preview support. External halos follow frame colours and the carousel reserves room for their scaled falloff instead of cutting them off sharply.',
    },
    {
      title: 'Lighter Lounge Home overlay',
      body: 'Home pauses underlying background effects, particles and carousel movement while open. Its controls retain stable hover targets and focus without scroll jumps; browsing effects resume on return.',
    },
    {
      title: 'More consistent carousel motion',
      body: 'Carousel glide retains fractional progress instead of feeding browser scroll rounding back into its timing. Neon and Reactor keep peak glow, orbit and breathing without changing shadow blur each frame.',
    },
    {
      title: 'Predictable bloom spread',
      body: 'Bloom spread changes glow radius proportionally without repeating the glow pattern or shifting its anchors. Bloom brightness remains separate, with the same sizing in the mini preview.',
    },
    {
      title: 'Responsive Lounge height controls',
      body: 'Visuals owns a single Hero preview height control, from 80px to the full screen height, with proportional mini preview sizing. Carousel positioning updates while editing and supports upward/downward travel to the visible screen edge without invisible glow padding limiting movement. Preview height and placement respond independently of the surrounding hero region.',
    },
    {
      title: 'A quieter, higher Lounge browsing dock',
      body: 'Wall, Game browser and filters share slim horizontal icon/label controls at the top right. PC/Emulator stays separate. The browsing dock stays visible while scrolling, with readable sizes for Near, Medium and Far.',
    },
    {
      title: 'Steadier Lounge navigation feedback',
      body: 'Lounge filter and mode buttons keep stationary mouse targets, with colour and glow feedback preserved. Source tabs avoid animated shadow extents over moving scenery. Carousel selection scales from its current size rather than restarting, and artwork brightness no longer filters the whole glowing frame. Portraits finish decoding before replacing their fallback; scenery blends are isolated from the cover stack, with stable Wall hover targets too.',
    },
    {
      title: 'Visual Builder is easier to shape and preview',
      body: 'Lounge Visuals now has three clear rows for Scenery & artwork, Game layout & readability, and Atmosphere & effects. Every existing control remains. Built-in scenes, personal backgrounds and game art now share horizontal/vertical framing and zoom; imported-art zoom works at its real percentage, while image-derived highlights and rays follow the crop. Its taller pinned mini screen uses your current games, selected-cover size, top-bar opacity, particles and motion pace so changes are easier to judge before closing the panel.',
    },
    {
      title: 'Less image work while browsing Lounge',
      body: 'Portrait covers no longer load and paint a second wide fallback image underneath them. Moving between games also reuses the displayed art for bright-spot effects instead of opening a duplicate full-size image. Existing lighting and cover fallbacks stay available.',
    },
    {
      title: 'A complete couch-ready Lounge',
      body: 'Browse and inspect games in fullscreen with mouse or controller. A compact PC/Emulator switcher replaces the separate Emulator Zone banner; five consoles surround the selected system, while game filters stay available for both sources. Tune the carousel, game preview, themes, moving backgrounds, light, particles, neon edges and Lounge-only presets. Visuals adds independent scenery colour and drift controls, moving aurora ribbons, adjustable screen-edge lighting and three editable light looks. Choose from five whole-card carousel frames, including glass, chrome and animated Reactor, independently of cover glow, then tint their full outlines with theme-matched, curated or custom colours. Six new Lounge particle looks add Prism Shards, Digital Rain, Ember Rise, Halo Rings, Starbursts and Moon Wisps. Near, Medium and Far now set explicit sizes across Lounge navigation instead of barely changing a few buttons; farther modes keep names visible. The top buttons sit beneath the heading, clear of top-right performance overlays. Visuals adds optional Film grain and Chromatic aberration on scenery, while covers and text remain clear. Original Solar Grove and Rainlight City scenes add distinct forest and rain-washed city palettes with scene-aware particles. Selected and neighboring cards now scale upward from a shared bottom edge, with enough space above the focused card to prevent clipping even during its animation. The hidden carousel scrollbar no longer adds a visible gutter or layout bump. Carousel browsing glides consistently across refresh rates without snap-back or redrawing distant covers. Bloom reaches 600%; rays and waves reach 300%, with independent wave drift, bloom spread, ray softness and light-shimmer speed controls. The pulse-controlled artwork highlight stays adjustable and now follows the correct ultrawide crop. A separate preview seam and fixed orb are gone. Sound & Music has its own destination, and your Lounge choices are saved locally.',
    },
    {
      title: 'More capable Library and artwork tools',
      body: 'The guided Library Wizard and full-workspace Wall make large collections easier to manage. A single scrollable repair list audits covers and metadata across the library, and lets you open a focused fix or refresh for one game at a time. Applying or cancelling one repair returns to the same list, preserving its search and view choice; the Wizard remains open behind it. Portrait covers stay separate from landscape heroes; the cover picker now hides broken or landscape images and rejects nearby demos, soundtracks and unrelated titles. Recommended SteamGridDB art and a verified paste-from-Google-Images route can be reviewed before applying. Settings → Library can back up, restore or safely clear game records while protecting categories behind their PINs.',
    },
    {
      title: 'A clearer, more personal Home',
      body: 'Home widgets stay movable and resizable, with simpler framing, restrained per-widget accents and stronger title text that is easier to read. The optional sidebar includes a direct Lounge shortcut and compact headings for Lounge, Browse, Actions, Personalise, NEO-LIB and Exit. Controls under each heading share one accent, making the rail easier to scan without a different colour on every icon. Normal mode keeps the familiar Menu dropdown.',
    },
  ],
  fixes: ['Lounge lighting and film grain retain their saved strength without repainting full-screen filters every frame. Grain makes small, less frequent shifts; bright lighting pulses no longer fade nearly out and back. Fake HDR no longer duplicates a full-screen image, and soft light layers render more economically at high resolution. Carousel wheel navigation and its lower screen edge are repaired; repeated console warnings no longer flood diagnostics. Unfocused neon covers stay lit without all animating at once.', 'The Emulator selector now uses a wide five-console row with readable marks and names instead of squeezing its buttons into a narrow strip.'],
};
