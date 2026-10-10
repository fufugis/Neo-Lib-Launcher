# Upcoming — Home widgets and News (not in published v1.8.6)

- Automatic idle power saver after 15 quiet minutes without a tracked game, using aggregate Windows idle time or NEO-LIB inactivity. Active input keeps it awake; controller activity overrides Windows mouse/keyboard idle. Separate from hard game/manual/tray Rest: pauses costly FX, Home/health/launcher/deal work but retains mascot, watched-game news and GitHub announcements in the main window. Official Lounge gets its own idle visual/music/video pause, retaining navigation and existing selected-game notices. Settings opt-out. App release checks repeat hourly while open or in soft idle, with one-hour cache. Existing hard-Rest and detached-Lounge notification deferrals remain unchanged; no push delivery or electricity-savings claim.

- Classic Home arrangement editor: zoomed-out bordered canvas, named draggable/resizable boxes, optional grid snapping and free overlap. Save applies exact positions and exits; Cancel preserves the original arrangement. Current grid/free layouts and community widgets carry over. Editor zoom is only a working view, not widget content zoom.

- Home/Lounge playtime pie slices gain mouse-following tooltips with game, percentage of filtered recorded playtime and hours/minutes. Includes zoom-aware hit testing and screen-edge bounds.

- Startup checks and queued popups wait one minute; new popups play the selected mascot news clip, respecting sound/voice/mute/volume settings and shared cooldown.

- Public GitHub announcement file supports scheduled/expiring plain-text news without releasing a new installer for each announcement, once clients have the reader.
- One News popup per message collapses toward a mail icon. The inbox retains multiple messages until deleted, with unread indicators and persistent deletion history.
- Hourly checks, bounded parsing, offline retention, safe user-clicked links, Rest Mode/dialog deferral, keyboard/controller controls and reduced-motion animation.

Dedicated news fixtures, the complete prebuild source suite and production compilation pass. Live popup animation, layout and physical-controller acceptance remain pending. Evidence is recorded in WORK_QUEUE.md and PROGRESS.md. No broadcast or new release is performed by adding the feature.
