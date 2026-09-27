const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { pathToFileURL } = require('url');

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

async function importLoungeBackground(selected, destinationRoot) {
  const extension = path.extname(selected || '').toLowerCase();
  if (!['.png', '.jpg', '.jpeg', '.webp'].includes(extension)) return { ok: false, error: 'Choose a PNG, JPG or WebP image.' };
  let file;
  try {
    file = await fs.open(selected, 'r');
    const stats = await file.stat();
    if (!stats.isFile() || stats.size < 12 || stats.size > MAX_IMAGE_BYTES) return { ok: false, error: 'Choose an image smaller than 20 MB.' };
    const header = Buffer.alloc(12);
    await file.read(header, 0, header.length, 0);
    const png = header.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const jpg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
    const webp = header.toString('ascii', 0, 4) === 'RIFF' && header.toString('ascii', 8, 12) === 'WEBP';
    if (!(extension === '.png' && png || ['.jpg', '.jpeg'].includes(extension) && jpg || extension === '.webp' && webp)) {
      return { ok: false, error: 'This file does not contain a supported image.' };
    }
  } catch {
    return { ok: false, error: 'Could not read the selected image.' };
  } finally {
    await file?.close();
  }
  try {
    await fs.mkdir(destinationRoot, { recursive: true });
    const destination = path.join(destinationRoot, `${crypto.randomUUID()}${extension}`);
    await fs.copyFile(selected, destination, require('fs').constants.COPYFILE_EXCL);
    return { ok: true, url: pathToFileURL(destination).href };
  } catch {
    return { ok: false, error: 'Could not save a private copy of this image.' };
  }
}

module.exports = { importLoungeBackground };
