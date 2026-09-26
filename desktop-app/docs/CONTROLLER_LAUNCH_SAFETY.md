# Controller launch boundary

Desktop controller navigation is opt-in. It may focus a Launch button, but A
does not click that button. A programmatic click is not a trusted pointer or
keyboard action and must never be used to obtain `game:armLaunch`.

Before controller launch is enabled, implement and test a separate isolated
preload authorization path:

1. Require NEO-LIB to be visible, focused, awake and unlocked. Require the
   selected standard-mapping controller to remain connected; another pad may
   not take over if the preferred pad disconnects.
2. Require a visible, enabled `[data-neolib-launch]` target to hold DOM focus
   without changing for the entire gesture. A modal, private/panic lock,
   navigation move, disconnect or blur cancels it.
3. Have preload itself sample the browser Gamepad API. Require a fresh A-button
   press held continuously for at least 1.2 seconds after the launch target
   receives focus. Renderer timers, synthetic click/keyboard events and a
   renderer-reported duration are never authorization evidence.
4. Show hold progress and the exact game/route in the renderer. The player must
   release A after success before another launch can be armed. Issue one
   short-lived, single-use native launch token through the existing main
   process launch service. A cancel or failed check issues no token.
5. Run installed Windows tests with Xbox/PlayStation pads, Steam Input on/off,
   two matching pads, disconnect during hold, a private game, Wall Peek,
   alternate route, Rest/tray, and rapid repeated presses before enabling it.

Until that isolated verification exists, mouse/keyboard Launch keeps its
current trusted-input boundary and controller A shows a clear explanation.
