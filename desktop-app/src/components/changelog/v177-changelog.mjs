export const V177_CHANGELOG = {
  version: '1.7.7',
  title: 'Architecture, Reliability & FiFi',
  major: [
    {
      title: 'One clear NEO-LIB Control Center',
      body: 'The gear now sits left of Home and groups Themes, Visual Tweaks, Controllers, Mascot, Settings, patch notes, update checks, feedback and a true Quit NEO-LIB action. Themes has its own studio with Custom theme marked coming soon; Mascot owns companion, warnings, voice and chat controls. Controller Center now links safely to Windows and running Steam Input.',
    },
    {
      title: 'NEO-LIB rebuilt for the future',
      body: 'Library state, metadata, providers, privacy, launching, Windows services and interface composition now have focused owners instead of accumulating inside a few giant files. The complete automated source gate covers 181 runtime files, 113 renderer modules and all 85 native commands.',
    },
    {
      title: 'FiFi joins the launcher',
      body: 'Choose FiFi in Mascot Center for a living companion with blinking, breathing, gaze, fin and tendril motion, reaction particles, a remembered dock and 27 locally stored voice lines. Both companions now have opt-in, low-frequency reactions for launches, additions, private-category actions and Controller Center changes. Fungist remains available; mute, volume, reduced motion and Rest Mode always win.',
    },
    {
      title: 'All-launcher importing without the endless wait',
      body: 'Steam, Epic, EA, GOG, Ubisoft, Battle.net, Riot, Xbox, Rockstar, itch.io and standalone imports add reviewed local games first instead of waiting on online artwork. Scans can be cancelled and timed out safely; metadata is reviewed afterwards.',
    },
    {
      title: 'Metadata refresh is now your choice',
      body: 'Icons, banners, screenshots, descriptions and complete metadata open in a candidate picker before replacement. Five choices appear first, Show more expands the search, and uncertain store identities are never silently applied.',
    },
    {
      title: 'News and updates across the whole Library',
      body: 'Direct Steam, GOG and itch.io feeds remain first. Other launchers and standalone games gain bounded official-site-first discovery, while update checks combine launcher, local version and trusted public evidence without pretending weak evidence is certain.',
    },
    {
      title: 'Private games stay private everywhere',
      body: 'Locked games are redacted across Home, Wall, Preview, news, history, rankings, storage and links. Wall unlocks each private category separately, while Lock private re-locks everything and immediately returns to a safe selection.',
    },
    {
      title: 'Home is cleaner and easier to scan',
      body: 'Top 5 Played carries the weekly summary, weekly news is more prominent, related cards share rows, and Play & history, News & updates, and Library & PC care can be reordered as clear sections.',
    },
    {
      title: 'Special themes have real button artwork',
      body: 'Anime blossom branches, Industrial chains/cogs/welding sparks and Magical four-corner effects wrap navigation and Preview actions. Controls, text and menus always remain above decorative art and background FX.',
    },
    {
      title: 'Tools get proper software metadata',
      body: 'Utilities now use executable identity, embedded Windows icons, known vendor profiles and bounded official-site discovery instead of being searched as Steam games. Automatic fill never overwrites manual information.',
    },
    {
      title: 'Controller Center foundation',
      body: 'Settings detects gamepads only while Controller Center is open, remembers a preferred pad, shows live input and opens the correct Windows Bluetooth page. Full controller navigation remains deliberately disabled until physical-device acceptance.',
    },
    {
      title: 'Smarter low-usage recovery',
      body: 'A player-requested PC check can identify heavy background apps and recognise an external game even when it was launched outside NEO-LIB. Low usage can remain active until that exact process closes, then NEO-LIB resumes automatically.',
    },
    {
      title: 'Private diagnostics you control',
      body: 'A small rotating local report captures safe startup, renderer, operation and native-command failure categories. It excludes game names, paths, searches, messages, keys, PINs and private identity, and is attached to Feedback only after you opt in.',
    },
    {
      title: 'Trustworthy release packages',
      body: 'Every build carries an exact source fingerprint. Packaging rejects stale renderer output, inspects installer and portable contents, blocks credential-like material and publishes checksums. Older v1.7.3 installations can detect the clean v1.7.7 update tag.',
    },
  ],
  fixes: [
    'Theme Studio now has a fourth Bright theme: Monochrome. It combines white and pale-gray surfaces with black controls, geometric grayscale atmosphere and restrained neutral particles that still respect Effects intensity and Rest Mode.',
    'Recent Game Releases now watches every supported launcher source: Steam, Epic, EA, GOG, Ubisoft, Battle.net, Riot, Xbox, Rockstar and itch.io. Major titles stay for 14 days and rank first; smaller verified launches expire after 5 days and are limited so Steam volume cannot bury a major non-Steam release.',
    'Visual Tweaks now opens beside the Library. A separate Icons only mode removes game text, categories and the pinned strip, with its own icon-size, spacing and one-to-three lane controls; incompatible standard sliders visibly disable while it is active.',
    'Cover Wall now places a yellow upper-right tag on every visible game you personally rated, showing the exact one-decimal score while keeping locked and unrated games private/clean.',
    'Mascot size now changes only FiFi/Fungist and character effects. Speech bubbles, alerts, hover text, completion messages, chat, quick settings and major notices keep their full readable interface size.',
    'External library games such as Valheim now start Rest Mode automatically instead of hiding the choice in a tiny mascot button. A large centre-screen mascot notice explains the detection, pause and automatic wake-up; serious PC alerts share it, while ordinary mascot bubbles are larger and less cluttered.',
    'Fixed FiFi/Fungist quick-setting switch knobs protruding beyond their tracks, and bounded the complete Home Game Updates body—including evidence warnings—inside one compact scrolling area without removing its text.',
    'Fixed the Control Center gear ignoring clicks under layered Library artwork, and kept every delayed hover explanation fully inside the app window.',
    'Fixed false Steam update cards caused by stale completed-manifest byte counters; the Downloads action now opens Steam’s documented Downloads route.',
    'Fixed Wizard folder scans and metadata review getting stuck: every scan, lookup and optional artwork cache now has a visible recovery path, firm time limit and late-result protection.',
    'Fixed external-game Rest Mode for launcher child processes: Battle.net bootstrap records can now recognise the real Overwatch retail executable inside the same saved game folder, without treating an idle Battle.net client as gameplay.',
    'Repaired the blank startup window and added a visible recovery path when the interface cannot mount.',
    'Fixed Launcher Wizard confirmations, cancellation, timeouts and category creation without online metadata delays.',
    'Fixed Battle.net refresh identity for World of Warcraft and Warcraft III before cross-store matching.',
    'Fixed dropdowns, Sort panels, menus and buttons appearing behind Library text or theme FX.',
    'Fixed Settings opening as an empty gray or full-app blank screen.',
    'Fixed category arrow size, header alignment, duplicate launcher text, hidden markers and repeated locks.',
    'Fixed long Library titles escaping their row or pane; added Library-only font and weight controls.',
    'Fixed Preview description overlap, restored Game Identity to the story card and enlarged verified media.',
    'Fixed mascot speech bubbles leaving the window and preserved the player-selected dock after temporary flights.',
    'Fixed CPU sampling to use a fresh one-second window and corrected local-day playtime boundaries.',
    'Fixed stale or cancelled background results overwriting newer work and removed endless-spinner failure states.',
    'Removed the unused electron-store runtime dependency and strengthened save, storage, cleanup and launch safety.',
  ],
};
