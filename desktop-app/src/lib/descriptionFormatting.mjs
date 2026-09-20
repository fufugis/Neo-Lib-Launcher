const HEADING_WORDS = /^(?:ABOUT|OVERVIEW|STORY|GAMEPLAY|FEATURES?|KEY FEATURES|EXPLORE|BUILD|GATHER|CRAFT|SURVIVE|DISCOVER|CREATE|FIGHT|PLAY|MASTER|BECOME|WELCOME|THE WORLD|MULTIPLAYER)(?:\b|[,:])/i;
const TERMINAL_PUNCTUATION = /[.!?…”’)]$/;

function decodeEntities(value) {
  const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  return String(value || '').replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (_match, entity) => {
    if (entity[0] === '#') {
      const hex = entity[1]?.toLowerCase() === 'x';
      const point = Number.parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10);
      return Number.isFinite(point) && point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : ' ';
    }
    return named[entity.toLowerCase()] ?? ' ';
  });
}

function trimIncompleteTail(value) {
  const text = String(value || '').trim();
  if (text.length < 180 || TERMINAL_PUNCTUATION.test(text)) return text;
  const lastStop = Math.max(text.lastIndexOf('.'), text.lastIndexOf('!'), text.lastIndexOf('?'));
  const tail = lastStop >= 0 ? text.slice(lastStop + 1).trim() : '';
  return lastStop >= text.length * 0.62 && tail.length > 0 && tail.length <= 140 ? text.slice(0, lastStop + 1) : text;
}

/** Clean provider/store markup without rewriting or inventing the source text. */
export function cleanDescriptionText(value) {
  let text = String(value || '')
    .replace(/\r\n?/g, '\n')
    .replace(/<(?:br|hr)\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|section|article|h[1-6]|li)>/gi, '\n')
    .replace(/<(?:p|div|section|article|h[1-6])(?:\s[^>]*)?>/gi, '\n')
    .replace(/<li(?:\s[^>]*)?>/gi, '\n• ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\[(?:\/?)(?:b|i|u|s|url|img|color|size|font|center|left|right|quote|code)(?:=[^\]]*)?\]/gi, '')
    .replace(/\[(?:\/?)(?:h[1-6]|p|list|\*)[^\]]*\]/gi, '\n');
  text = decodeEntities(text)
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s+([,.;!?])/g, '$1')
    .trim();
  return trimIncompleteTail(text);
}

function headingCase(value) {
  const small = new Set(['a', 'an', 'and', 'as', 'at', 'for', 'from', 'in', 'of', 'on', 'or', 'the', 'to', 'with']);
  return String(value || '').toLowerCase().split(/\s+/).map((word, index) => {
    if (index && small.has(word)) return word;
    return word.replace(/(^|[-/])([a-z])/g, (_match, lead, letter) => `${lead}${letter.toUpperCase()}`);
  }).join(' ');
}

function headingPrefix(line) {
  const colon = line.match(/^([A-Z][A-Z0-9 '&/,+-]{3,64}):\s*(.+)$/);
  if (colon) return { heading: colon[1], body: colon[2] };
  const caps = line.match(/^([A-Z][A-Z0-9 '&/,+-]{5,64})\s+(?=[A-Z][a-z])(.+)$/);
  if (caps && (HEADING_WORDS.test(caps[1]) || caps[1].trim().split(/\s+/).length >= 3)) return { heading: caps[1], body: caps[2] };
  return null;
}

function standaloneHeading(line) {
  const plain = line.replace(/:$/, '').trim();
  return plain.length >= 4 && plain.length <= 64 && HEADING_WORDS.test(plain) && plain === plain.toUpperCase();
}

/** Convert cleaned source copy into calm, readable headings and paragraphs. */
export function formatDescription(value) {
  const clean = cleanDescriptionText(value);
  if (!clean) return [];
  const blocks = [];
  let paragraph = '';
  const flush = () => {
    if (paragraph.trim()) blocks.push({ type: 'paragraph', text: paragraph.trim() });
    paragraph = '';
  };
  const addBody = body => {
    const next = String(body || '').replace(/^[-–—•]\s*/, '').trim();
    if (!next) return;
    if (paragraph && paragraph.length + next.length + 1 > 430) flush();
    paragraph = paragraph ? `${paragraph} ${next}` : next;
  };

  for (const sourceLine of clean.split('\n')) {
    const rawLine = sourceLine.trim();
    if (!rawLine) { flush(); continue; }
    const prefixed = headingPrefix(rawLine);
    if (prefixed) {
      flush();
      blocks.push({ type: 'heading', text: headingCase(prefixed.heading.replace(/:$/, '')) });
      addBody(prefixed.body);
    } else if (standaloneHeading(rawLine)) {
      flush();
      blocks.push({ type: 'heading', text: headingCase(rawLine.replace(/:$/, '')) });
    } else {
      addBody(rawLine);
    }
  }
  flush();
  return blocks;
}
