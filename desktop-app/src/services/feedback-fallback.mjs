function wellFormed(value) {
  const text = String(value || '');
  if (typeof text.toWellFormed === 'function') return text.toWellFormed();
  let output = '';
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    if (code >= 0xD800 && code <= 0xDBFF) {
      const next = text.charCodeAt(index + 1);
      if (next >= 0xDC00 && next <= 0xDFFF) {
        output += text[index] + text[index + 1];
        index += 1;
      } else output += '\uFFFD';
    } else if (code >= 0xDC00 && code <= 0xDFFF) output += '\uFFFD';
    else output += text[index];
  }
  return output;
}

export function buildGitHubIssueUrl({ baseUrl, title, body, maxUrlLength = 7000 }) {
  const target = String(baseUrl || '');
  const safeTitle = Array.from(wellFormed(title)).slice(0, 120).join('');
  const fullBody = wellFormed(body);
  const create = value => `${target}?title=${encodeURIComponent(safeTitle)}&body=${encodeURIComponent(value)}`;
  const direct = create(fullBody);
  if (direct.length <= maxUrlLength) return direct;

  const suffix = '\n\n[Report shortened to fit the browser link.]';
  const characters = Array.from(fullBody);
  let low = 0;
  let high = characters.length;
  let best = suffix;
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const candidate = `${characters.slice(0, middle).join('')}${suffix}`;
    if (create(candidate).length <= maxUrlLength) {
      best = candidate;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  return create(best);
}
