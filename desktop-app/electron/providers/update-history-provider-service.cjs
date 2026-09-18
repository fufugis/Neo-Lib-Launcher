function createUpdateHistoryProviderService({ httpGetText, stripHtml, now = Date.now }) {
  if (typeof httpGetText !== 'function' || typeof stripHtml !== 'function') throw new TypeError('createUpdateHistoryProviderService requires HTTP and HTML cleanup.');
  const parts = value => String(value || '').toLowerCase().replace(/^v/, '').match(/\d+/g)?.map(Number) || [];
  function compare(left, right) { const a = parts(left); const b = parts(right); for (let index = 0; index < Math.max(a.length, b.length); index += 1) { const delta = (a[index] || 0) - (b[index] || 0); if (delta) return delta; } return 0; }
  async function fetch({ url, currentVersion = '' } = {}) {
    let parsed; try { parsed = new URL(url); } catch { return { ok: false, entries: [], error: 'Invalid update page URL.' }; }
    if (!['http:', 'https:'].includes(parsed.protocol)) return { ok: false, entries: [], error: 'Only public HTTP/HTTPS update pages are supported.' };
    try {
      const text = stripHtml(await httpGetText(parsed.toString())).replace(/\s+/g, ' ').slice(0, 700000);
      const pattern = /(?:\b(?:version|build)\s*(?:is|to|[:=#-])?\s*v?(\d+(?:\.\d+){1,3}[a-z]?)|\bv(\d+(?:\.\d+){1,3}[a-z]?))/gi; const seen = new Set(); const entries = []; let match;
      while ((match = pattern.exec(text)) !== null && entries.length < 30) {
        const version = match[1] || match[2]; if (seen.has(version.toLowerCase())) continue; seen.add(version.toLowerCase());
        const before = text.slice(Math.max(0, match.index - 90), match.index); const after = text.slice(match.index + match[0].length, match.index + match[0].length + 260); const context = `${before} ${match[0]} ${after}`.trim();
        const date = context.match(/\b(?:20\d{2}[-/.]\d{1,2}[-/.]\d{1,2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+20\d{2})\b/i)?.[0] || '';
        entries.push({ version, date, summary: context.slice(0, 340), url: parsed.toString() });
      }
      entries.sort((a, b) => compare(b.version, a.version));
      return { ok: true, entries: entries.slice(0, 20).map(entry => ({ ...entry, newerThanInstalled: currentVersion ? compare(entry.version, currentVersion) > 0 : null })), sourceUrl: parsed.toString(), currentVersion, fetchedAt: now() };
    } catch (error) { return { ok: false, entries: [], error: error?.message || 'Update history page could not be read.' }; }
  }
  return Object.freeze({ fetch, compare });
}
module.exports = { createUpdateHistoryProviderService };
