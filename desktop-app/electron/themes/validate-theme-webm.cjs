const MAX_WEBM_BYTES = 8 * 1024 * 1024;

function readVint(data, offset, sizeValue = false) {
  if (offset >= data.length) throw new Error('WebM header is truncated.');
  const first = data[offset];
  let mask = 0x80;
  let length = 1;
  while (length <= 8 && !(first & mask)) { mask >>= 1; length += 1; }
  if (length > 8 || offset + length > data.length) throw new Error('WebM header has an invalid EBML length.');
  let value = sizeValue ? BigInt(first & (mask - 1)) : BigInt(first);
  for (let index = 1; index < length; index += 1) value = (value << 8n) | BigInt(data[offset + index]);
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('WebM header size is unbounded.');
  return { value: Number(value), length };
}

// This is a conservative container gate, not a codec decoder. Chromium's
// loadedmetadata check still rejects excessive duration or decoded dimensions.
function validateThemeWebm(data) {
  if (!Buffer.isBuffer(data) || data.length < 128 || data.length > MAX_WEBM_BYTES) throw new Error('Theme WebM must be a local file under 8 MB.');
  if (!data.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) throw new Error('Theme video needs a WebM EBML header.');
  const headerSize = readVint(data, 4, true);
  const end = 4 + headerSize.length + headerSize.value;
  if (end > Math.min(data.length - 4, 4096)) throw new Error('Theme WebM header is too large or incomplete.');
  let offset = 4 + headerSize.length;
  let webmDocType = false;
  while (offset < end) {
    const id = readVint(data, offset);
    offset += id.length;
    const size = readVint(data, offset, true);
    offset += size.length;
    if (offset + size.value > end) throw new Error('Theme WebM header element is incomplete.');
    if (id.value === 0x4282) webmDocType = data.toString('ascii', offset, offset + size.value) === 'webm';
    offset += size.value;
  }
  if (!webmDocType || !data.subarray(end, end + 4).equals(Buffer.from([0x18, 0x53, 0x80, 0x67]))) throw new Error('Theme video must be a WebM document.');
  if (data.indexOf(Buffer.from([0x1f, 0x43, 0xb6, 0x75]), end + 4) < 0) throw new Error('Theme WebM has no media cluster.');
  return { bytes: data.length };
}

module.exports = { validateThemeWebm, MAX_WEBM_BYTES };
