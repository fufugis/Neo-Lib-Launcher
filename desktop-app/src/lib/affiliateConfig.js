/**
 * BUILD-TIME AFFILIATE CONFIG (private to KenLun).
 * These IDs are baked into the app at build time. Users cannot see or edit them.
 *
 * To activate:
 *   1. Wait for the affiliate network to approve your account
 *   2. Paste your ID(s) below
 *   3. Run `npm run build:win` to rebuild
 *
 * Leaving an ID blank means deal links from that network stay non-affiliate (direct).
 * The active configuration below is loaded in `lib/deals.js` for URL wrapping.
 */
export const AFFILIATE_CONFIG = {
  // Awin / Fanatical / GMG — paste once approved
  awinAffId: '2935955',     // your Awin publisher ID
  awinMid:   '81755',       // currently set to Superbox (TV boxes — not gaming, but the only Awin merchant approved so far).
                            // Replace with Fanatical=18809 / GMG=10825 / etc. once a gaming merchant approves.

  // Humble Partner — submitted ID 8518905; activates once Humble approves your application
  humbleId:  '8518905',

  // Skimlinks (auto-affiliate across hundreds of stores).
  // Format: '<publisherId>X<siteId>' — e.g. '304685X1792871'
  // Until Skimlinks approves the request, redirects still work but won't pay out.
  skimlinksId: '304685X1792871',

  // Instant Gaming — direct partner ID (3% commission).
  // Format: 'gamer-XXXXXXXX'. Any instant-gaming.com URL gets `?igr=<id>` appended.
  instantGamingId: 'gamer-1485e8f',

  // Generic affiliate URL wrapper (advanced, optional)
  urlTemplate: '',        // e.g. 'https://example.com/track?aff=YOU&dest={URL}'
};
