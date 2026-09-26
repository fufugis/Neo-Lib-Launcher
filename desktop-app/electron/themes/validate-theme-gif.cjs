// Validate bounded GIF structure before handing an untrusted theme image to Chromium.
// The browser still owns decoding; this checks dimensions, frame count, pace and
// an embedded infinite-loop declaration so the host never promises a loop it
// cannot control. GIF blocks follow the GIF89a grammar.
function validateThemeGif(data) {
  if (!Buffer.isBuffer(data) || data.length < 30 || data.toString('ascii', 0, 6) !== 'GIF89a') throw new Error('Animated theme artwork must be GIF89a.');
  let offset = 6;
  const take = length => {
    if (offset + length > data.length) throw new Error('GIF artwork is truncated.');
    const start = offset;
    offset += length;
    return start;
  };
  const screen = take(7);
  const width = data.readUInt16LE(screen);
  const height = data.readUInt16LE(screen + 2);
  if (!width || !height || width > 1920 || height > 1080 || width * height > 2_073_600) throw new Error('GIF dimensions exceed 1920×1080.');
  if (data[screen + 4] & 0x80) take(3 * (2 ** ((data[screen + 4] & 7) + 1)));
  const subBlocks = visit => {
    while (true) {
      const size = data[take(1)];
      if (size === 0) return;
      const start = take(size);
      visit?.(start, size);
    }
  };
  let frames = 0;
  let decodedPixels = 0;
  let durationMs = 0;
  let delay = 0;
  let infiniteLoop = false;
  while (offset < data.length) {
    const block = data[take(1)];
    if (block === 0x3b) {
      if (offset !== data.length || frames < 2 || !infiniteLoop) throw new Error('GIF needs 2–60 frames and an embedded infinite loop.');
      return { width, height, frames, durationMs };
    }
    if (block === 0x21) {
      const label = data[take(1)];
      if (label === 0xf9) {
        if (data[take(1)] !== 4) throw new Error('Invalid GIF frame timing block.');
        const control = take(4);
        delay = data.readUInt16LE(control + 1);
        if (data[take(1)] !== 0) throw new Error('Invalid GIF frame timing terminator.');
      } else if (label === 0xff) {
        const nameSize = data[take(1)];
        const name = data.toString('ascii', take(nameSize), offset);
        subBlocks((start, size) => {
          if (name === 'NETSCAPE2.0' && size === 3 && data[start] === 1 && data.readUInt16LE(start + 1) === 0) infiniteLoop = true;
        });
      } else subBlocks();
      continue;
    }
    if (block !== 0x2c) throw new Error('Invalid GIF block.');
    const descriptor = take(9);
    const left = data.readUInt16LE(descriptor);
    const top = data.readUInt16LE(descriptor + 2);
    const frameWidth = data.readUInt16LE(descriptor + 4);
    const frameHeight = data.readUInt16LE(descriptor + 6);
    decodedPixels += frameWidth * frameHeight;
    if (!frameWidth || !frameHeight || left + frameWidth > width || top + frameHeight > height || ++frames > 60 || decodedPixels > 24_000_000 || delay < 5) throw new Error('GIF frame size, count or pace is outside the safe range.');
    durationMs += delay * 10;
    delay = 0;
    if (data[descriptor + 8] & 0x80) take(3 * (2 ** ((data[descriptor + 8] & 7) + 1)));
    const lzwSize = data[take(1)];
    if (lzwSize < 2 || lzwSize > 8) throw new Error('GIF image data is invalid.');
    subBlocks();
  }
  throw new Error('GIF trailer is missing.');
}

module.exports = { validateThemeGif };
