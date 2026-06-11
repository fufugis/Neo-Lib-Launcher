/**
 * Deal URL wrapper — appends affiliate IDs to deal URLs if the user has set them
 * in Settings. Currently supported:
 *   - Steam: just direct links (Steam no longer accepts new affiliates)
 *   - Epic: direct links (no public affiliate program)
 *   - General: a single "Awin/Fanatical affiliate ID" can wrap Steam/Epic URLs
 *     via the Awin clickref URL pattern (user supplies their own publisher ID)
 *
 * If no affiliate ID is configured, returns the original URL unchanged.
 */
export function wrapDealUrl(url, affiliate = {}) {
  if (!url) return url;
  // Generic Awin/Fanatical wrap: https://www.awin1.com/cread.php?awinmid=XXX&awinaffid=YYY&p=ENCODED_URL
  if (affiliate.awinAffId && affiliate.awinMid) {
    return `https://www.awin1.com/cread.php?awinmid=${affiliate.awinMid}&awinaffid=${affiliate.awinAffId}&ued=${encodeURIComponent(url)}`;
  }
  // Generic affiliate URL template: any string with {URL} placeholder
  if (affiliate.urlTemplate && affiliate.urlTemplate.includes('{URL}')) {
    return affiliate.urlTemplate.replace('{URL}', encodeURIComponent(url));
  }
  return url;
}
