const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { pathToFileURL } = require('url');

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_VIDEO_BYTES = 250 * 1024 * 1024;
const VIDEO_EXTENSIONS = new Set(['.mp4', '.m4v', '.webm', '.mov', '.ogv']);

async function importLoungeBackground(selected, destinationRoot) {
  const extension = path.extname(selected || '').toLowerCase();
  const isVideo = VIDEO_EXTENSIONS.has(extension);
  if (!['.png', '.jpg', '.jpeg', '.webp', '.gif', '.apng', ...VIDEO_EXTENSIONS].includes(extension)) return { ok: false, error: 'Choose an image, GIF or common video file.' };
  let file;
  try {
    file = await fs.open(selected, 'r');
    const stats = await file.stat();
    const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (!stats.isFile() || stats.size < 12 || stats.size > maxBytes) return { ok: false, error: isVideo ? 'Choose a video smaller than 250 MB.' : 'Choose an image smaller than 20 MB.' };
    const header = Buffer.alloc(12);
    await file.read(header, 0, header.length, 0);
    const png = header.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const jpg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
    const webp = header.toString('ascii', 0, 4) === 'RIFF' && header.toString('ascii', 8, 12) === 'WEBP';
    const gif = ['GIF87a', 'GIF89a'].includes(header.toString('ascii', 0, 6));
    const webm = header.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
    const ogv = header.toString('ascii', 0, 4) === 'OggS';
    const isoVideo = header.toString('ascii', 4, 8) === 'ftyp';
    const validImage = (['.png', '.apng'].includes(extension) && png) || (['.jpg', '.jpeg'].includes(extension) && jpg) || (extension === '.webp' && webp) || (extension === '.gif' && gif);
    const validVideo = (['.webm'].includes(extension) && webm) || (extension === '.ogv' && ogv) || (['.mp4', '.m4v', '.mov'].includes(extension) && isoVideo);
    if (!(isVideo ? validVideo : validImage)) {
      return { ok: false, error: 'This file does not match a supported image or video format.' };
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
