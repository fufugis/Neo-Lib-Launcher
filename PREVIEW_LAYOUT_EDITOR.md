# Global game-preview layout editor

In Library → game Preview, choose **Edit preview layout**. A bordered, zoomed-out canvas shows fixed named sections: Hero/title/launch controls, Setup/updates/news, Game details, Capabilities/achievements, Description/genres, Game media and Source/install information.

- Drag a section to move it; drag its corner to resize. Narrow Description to give another section more room.
- Snap aligns to a 24px grid; Free placement allows finer moves. Zoom/Fit only change the editor view.
- The Section picker brings a covered box forward. Tab and arrow keys move/resize focused boxes; Shift increases move steps.
- Save layout applies one arrangement to **all games**. Cancel/Escape discards changes; Reset draft returns to the arrangement opened.
- Restore default on the normal Preview toolbar removes the custom layout. It does not delete game data or change Home/Lounge settings.

Horizontal positions/widths are stored as proportions of the preview area. Box sizes are minimums, not scrollports: content grows its box, and the virtual surface expands to include it. Sections that would overlap are moved down in geometric reading order, preserving side-by-side arrangements where they fit. A narrow description stacks its genre panel; facts reflow by actual box width. Empty notices/capabilities reserve space when capturing a default arrangement, since another game may populate them.

The live preview never scales the whole surface: text and controls keep normal size. Boxes reflow within the available width; custom box positions and minimum heights compress only within a 70–100% geometry range as the viewport height changes. Natural content still expands its box and neighbours move clear. No box becomes its own scrollport. If a long description or large saved layout cannot fit, the whole page remains scrollable instead of hiding content or blurring text. Only the arrangement editor uses zoom-to-fit. Reopening captures normal-size geometry. Optional content may be empty for some games; no facts are invented. Hero and launch controls move together.

The native window stops at 70% of the default display-aware window width/height, with a 960×600 baseline capped to the display. This is a window-size floor, not 70% text zoom, and takes effect after restarting the desktop app. Saved window bounds are clamped to that floor. Extremely large content cannot be guaranteed to fit a fixed window without either overflow or shrinking; the readable whole-page fallback covers that case.

This is not a widget system: the sections are fixed first-party renderers. There are no imports, third-party code, permissions or native actions in the layout editor. Only `settings.previewLayout` changes; metadata, ratings, Journey status, launch paths and Library privacy rules stay owned by their existing controls. The standard Library Preview is in scope; Lounge's separate layout controls are unchanged.

Source/persistence/geometry fixtures do not certify physical drag/controller behaviour or visual layout. Live desktop acceptance remains required.
