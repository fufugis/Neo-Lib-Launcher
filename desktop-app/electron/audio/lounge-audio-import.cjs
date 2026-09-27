const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { pathToFileURL } = require('url');

const MAX_AUDIO_BYTES = 30 * 1024 * 1024;

async function importLoungeAudio(selected, destinationRoot) {
  if (path.extname(selected || '').toLowerCase() !== '.mp3') return { ok: false, error: 'Choose an MP3 audio file.' };
  let file;
  try {
    file = await fs.open(selected, 'r');
    const stats = await file.stat();
    if (!stats.isFile() || stats.size < 12 || stats.size > MAX_AUDIO_BYTES) return { ok: false, error: 'Choose an MP3 smaller than 30 MB.' };
    const header = Buffer.alloc(12);
    await file.read(header, 0, header.length, 0);
    const id3 = header.toString('ascii', 0, 3) === 'ID3';
    const frame = header[0] === 0xff && (header[1] & 0xe0) === 0xe0;
    if (!id3 && !frame) return { ok: false, error: 'This file does not contain MP3 audio.' };
  } catch {
    return { ok: false, error: 'Could not read the selected audio.' };
  } finally {
    await file?.close();
  }
  try {
    await fs.mkdir(destinationRoot, { recursive: true });
    const destination = path.join(destinationRoot, `${crypto.randomUUID()}.mp3`);
    await fs.copyFile(selected, destination, require('fs').constants.COPYFILE_EXCL);
    return { ok: true, url: pathToFileURL(destination).href };
  } catch {
    return { ok: false, error: 'Could not save a private copy of this audio.' };
  }
}

module.exports = { importLoungeAudio };
