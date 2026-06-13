import { AFFILIATE_CONFIG } from './affiliateConfig';

/**
 * Deal URL wrapper — uses build-time affiliate IDs from affiliateConfig.js.
 * Falls back to direct (non-affiliate) URL if no IDs are configured.
 */
export function wrapDealUrl(url, _affiliate /* legacy arg, ignored */) {
  if (!url) return url;
  const a = AFFILIATE_CONFIG || {};

  // Humble Bundle: insert partner= query param on humble URLs (only)
  if (a.humbleId && url.includes('humblebundle.com')) {
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}partner=${a.humbleId}`;
  }

  // Awin (Fanatical / GMG / etc): wrap via cread.php
  if (a.awinAffId && a.awinMid) {
    return `https://www.awin1.com/cread.php?awinmid=${a.awinMid}&awinaffid=${a.awinAffId}&ued=${encodeURIComponent(url)}`;
  }

  // Generic URL template
  if (a.urlTemplate && a.urlTemplate.includes('{URL}')) {
    return a.urlTemplate.replace('{URL}', encodeURIComponent(url));
  }

  // Skimlinks rewrites server-side via their script — we just return the URL as-is.
  return url;
}
