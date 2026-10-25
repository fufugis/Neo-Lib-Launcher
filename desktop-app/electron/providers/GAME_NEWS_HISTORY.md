# Per-game news history

The Library preview shows five dated posts initially, expandable to ten, newest
first. Its fixed **News and update history** layout section supports the existing
preview editor, content-size controls, live miniature, resize and save. Older saved
layouts append it below existing rectangles, without discarding arrangements.
The page scrolls as a whole; the timeline is not an inner scrolling box.

## Where posts come from

- A saved exact Steam App ID (or the exact ID in a Steam game URL): public
  ISteamNews developer announcements, not generic press coverage or a fuzzy
  title-to-store match.
- A saved exact GOG product ID: public, dated changelog sections when supplied
  by the GOG endpoint. Not every product exposes a changelog.
- An itch project URL: the project's public /devlog.rss feed.
- A saved game website or update-watch page: same-publisher RSS/Atom discovery,
  dated JSON-LD articles, or article/time markup. A bounded same-publisher news
  link may be followed when a home page advertises one.
- **News source** in the timeline: explicitly save a game-specific HTTPS news
  page or RSS/Atom feed. Leave blank to restore automatic sources. This works
  independently of the launcher, including Epic, EA, Ubisoft, Battle.net, Riot,
  Xbox, Rockstar and manually added games.
- If no official posts are available, PC Gamer's game-tag RSS and GamesRadar+
  RSS supply exact-title keyword-matched coverage. These are explicitly labelled
  with their outlet and Coverage type, never mistaken for official patch notes.
  Ambiguous short titles are conservatively filtered. Shared publication caches
  hold normalized entries, not full pages, and are bounded to 40 feed URLs.

Shared publisher pages require matching game-title tokens. Game-specific URLs,
itch project feeds and explicitly selected sources do not need to repeat the
game's name in every post. There is no login, account scraping, launcher database
access, search-engine scraping or executable/AI-generated news. A news post is not
proof that the installed game needs an update.

## Limits and safety

The separate Node HTTPS client blocks credentials, non-HTTPS URLs, unusual ports,
local/private/link-local/multicast/reserved IPs and mixed private/public DNS.
Each request resolves and pins a validated public address; redirects are checked
again and limited to three within the same publisher hostname (www aliases
allowed). Requests carry no Electron-session cookies or authentication, run no
scripts and load no embedded images/iframes. The deadline includes DNS and body,
with an eight-second total and 2 MiB body limit per request. Compressed responses
are rejected rather than risking decompression expansion.

Publisher discovery reads at most four pages/feeds per lookup; extraction is
bounded and does not resolve XML external entities. The service permits two
concurrent lookups, bounded waiting/in-flight work, coalesced duplicates and a
100-entry cache. Cache TTL is 30 minutes; force refresh has a 30-second floor.
Renderer selection is debounced and cached; it refreshes the selected game every
30 minutes while visible, and rechecks stale data on focus. Stale history is
retained and labelled after connection failures. Late responses cannot replace a
different game's current history. Layout miniature rendering never starts its
own lookup.

All text is rendered as text, not remote HTML. Only valid, source-supplied
publication dates are included, with future outliers omitted. Articles are sorted,
deduplicated and capped at ten without a recent-only cutoff: old games can still
show their last historical updates. Unknown dates are not stamped with the fetch
date. When a publisher has no suitable feed/markup, blocks access, or requires
JavaScript/login, show an honest empty/unavailable state and source option.
Universal coverage of every game is not claimed.

## Verification

- Default gate: scripts/verify-game-history.cjs — public-network boundary,
  parser, timestamp/order/deduplication, source matching, old updates, cache,
  stale recovery, coalescing and concurrency fixtures. No network.
- scripts/verify-game-history-browser.cjs — actual game preview, five/ten,
  safe source editing, external links, stale/empty/late responses, whole-page
  scrolling, old-layout migration and live-editor/save behavior.
- Native IPC registry, input/output contracts, full-main scanner harness and
  existing preview-editor regression remain required.

Reference formats:
[Steam ISteamNews](https://partner.steamgames.com/doc/webapi/ISteamNews),
[itch devlog RSS](https://itch.io/updates/updates-to-devlogs).
Live source availability can change independently of NEO-LIB.
