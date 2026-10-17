# Playtime calendar

Enable **Playtime calendar** in Home → Widgets, or select it in Lounge Settings → Widgets. It shares the existing box resizing, Home content-size and Lounge zoom systems.

- **Year** displays twelve Monday-first month grids; **Month** displays one larger grid. Click a month heading to open that month.
- Previous/next and **Today** navigate periods. Future days are disabled.
- Filter to one visible game or all visible games. Home and Lounge save their view/filter choices separately.
- Heat levels are consistent between views: no recorded time, under 30 minutes, 30 minutes–2 hours, 2–4 hours, and 4+ hours.
- Hover/focus a day for its labelled date/time; select it for individual game totals and game-opening buttons. Keyboard/controller controls use the existing grid navigation.
- Period totals, active days and the busiest day summarize the selected games and period.

## Data limitations and privacy

This uses completed NEO-LIB-tracked session durations, saved locally in each game's `playtimeDays` when its exit event arrives. Sessions spanning local midnight are divided across the actual elapsed portions of each day, including daylight-saving changes. History is bounded to the most recent 3,660 recorded date entries per game.

Existing lifetime totals, Steam total snapshots, manually edited hours and old undated activity do not provide exact dates. They are not fabricated into past heatmap cells. Empty cells mean **no recorded playtime**, not proof that the user did not play. Running sessions appear after they end; unobserved/crash-interrupted sessions cannot be reconstructed by this widget.

Locked/private games are excluded by the existing Home/Lounge visibility rules. The calendar makes no network requests, adds no tracking permissions and does not upload dates or game details to optional usage reporting. Official Lounge receives only the same permitted games' daily maps; third-party module permissions are unchanged.

Source fixtures cover persistence, imports, midnight/DST, leap years, future dates, privacy, filters, heat thresholds and Home/Lounge wiring. Physical visual/controller acceptance remains separate.
