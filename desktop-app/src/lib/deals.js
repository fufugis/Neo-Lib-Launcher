import { AFFILIATE_CONFIG } from './affiliateConfig';

/**
 * Deal URL wrapper — uses build-time affiliate IDs from affiliateConfig.js.
 *
 * Priority order:
 *   1. Humble Bundle native partner= param (humblebundle.com only)
 *   2. Awin cread.php (Fanatical / GMG)
 *   3. Generic urlTemplate
 *   4. Skimlinks go.redirectingat.com wrapper (catch-all)
 *   5. Direct URL (no affiliate)
 *
 * Falls back gracefully if any ID is missing.
 */
export function wrapDealUrl(url, _affiliate /* legacy arg, ignored */) {
  if (!url) return url;
  const a = AFFILIATE_CONFIG || {};

  // 1. Humble Bundle: insert partner= query param on humble URLs (only)
  if (a.humbleId && url.includes('humblebundle.com')) {
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}partner=${a.humbleId}`;
  }

  // 1b. Instant Gaming — direct partner program, 3% per sale.
  if (a.instantGamingId && url.includes('instant-gaming.com')) {
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}igr=${a.instantGamingId}`;
  }

  // 2. Awin (Fanatical / GMG / etc): wrap via cread.php
  if (a.awinAffId && a.awinMid) {
    return `https://www.awin1.com/cread.php?awinmid=${a.awinMid}&awinaffid=${a.awinAffId}&ued=${encodeURIComponent(url)}`;
  }

  // 3. Generic URL template
  if (a.urlTemplate && a.urlTemplate.includes('{URL}')) {
    return a.urlTemplate.replace('{URL}', encodeURIComponent(url));
  }

  // 4. Skimlinks catch-all redirect (works as soon as account is approved).
  //    `xs=1` marks it as a publisher-originated link.
  if (a.skimlinksId) {
    return `https://go.redirectingat.com/?id=${a.skimlinksId}&xs=1&url=${encodeURIComponent(url)}`;
  }

  // 5. Direct (no monetization)
  return url;
}

/**
 * Get the Skimlinks script tag URL, if configured.
 * Used to auto-affiliate anchor-tag clicks rendered inside the app.
 */
export function getSkimlinksScriptSrc() {
  const id = AFFILIATE_CONFIG?.skimlinksId;
  if (!id) return null;
  return `https://s.skimresources.com/js/${id}.skimlinks.js`;
}
