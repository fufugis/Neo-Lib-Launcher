function createImageCacheService({ path, coversDir, download, now = () => Date.now() }) {
  if (typeof path?.join !== 'function' || typeof coversDir !== 'function' || typeof download !== 'function' || typeof now !== 'function') {
    throw new TypeError('createImageCacheService requires path, coversDir, download and now.');
  }

  async function cache({ url, name } = {}) {
    if (!url) return null;
    try {
      const safeName = (name || 'cover').replace(/[^a-z0-9_-]+/gi, '_').slice(0, 60);
      const extension = (String(url).match(/\.(jpg|jpeg|png|webp)/i) || ['.jpg'])[0];
      const outputPath = path.join(coversDir(), `${safeName}_${now()}${extension}`);
      await download(url, outputPath);
      return 'file://' + outputPath.replace(/\\/g, '/');
    } catch {
      return null;
    }
  }

  return Object.freeze({ cache });
}

module.exports = { createImageCacheService };
