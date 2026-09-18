function createUpdatePageVersionService({ confidenceFor }) {
  if (typeof confidenceFor !== 'function') throw new TypeError('createUpdatePageVersionService requires source confidence.');

  function parts(value) {
    return String(value || '').toLowerCase().replace(/^v/, '').match(/\d+/g)?.map(Number) || [];
  }

  function compare(left, right) {
    const a = parts(left);
    const b = parts(right);
    for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
      const delta = (a[index] || 0) - (b[index] || 0);
      if (delta) return delta;
    }
    return 0;
  }

  function collect(sourceResults = []) {
    const matches = [];
    const pattern = /(?:\b(?:version|build)\s*(?:is|to|[:=#-])?\s*v?(\d+(?:\.\d+){1,3}[a-z]?)|\bv(\d+(?:\.\d+){1,3}[a-z]?))/gi;
    for (const source of (Array.isArray(sourceResults) ? sourceResults : []).filter(Boolean)) {
      let match;
      while ((match = pattern.exec(String(source.text || ''))) !== null && matches.length < 80) {
        matches.push({ version: match[1] || match[2], source, confidence: confidenceFor(source.kind) });
      }
    }
    return matches;
  }

  function selectLatest(sourceResults = []) {
    const matches = collect(sourceResults);
    const trusted = matches.filter(entry => entry.confidence >= 80);
    return (trusted.length ? trusted : matches)
      .sort((left, right) => compare(right.version, left.version) || right.confidence - left.confidence)[0] || null;
  }

  return Object.freeze({ parts, compare, collect, selectLatest });
}

module.exports = { createUpdatePageVersionService };
