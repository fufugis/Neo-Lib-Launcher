// URL alternatives are only suggestions: callers must load and verify dimensions.
export function coverImageRecoveryUrls(url, record = {}) {
  const urls = [url, record.capsuleImage, record.coverUrl].filter(value => typeof value === 'string' && /^https:\/\//i.test(value));
  const steam = String(url || '').match(/^https:\/\/(?:cdn\.(?:cloudflare|akamai)|shared\.(?:fastly|akamai))\.steamstatic\.com\/(?:steam|store_item_assets\/steam)\/apps\/(\d+)\/(?:[^/?]+\/)?library_600x900(?:_2x)?\.(?:jpg|png|webp)(?:\?.*)?$/i);
  if (steam) {
    for (const base of [`https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${steam[1]}`, `https://cdn.cloudflare.steamstatic.com/steam/apps/${steam[1]}`]) {
      for (const file of ['library_600x900.jpg', 'library_600x900.png', 'library_600x900_2x.jpg', 'library_600x900_2x.png']) urls.push(`${base}/${file}`);
    }
  }
  return [...new Set(urls)].slice(0, 12);
}

export async function recoverPortraitImage(url, record, verify) {
  // Small concurrent batches avoid a serial timeout per CDN/file alternative.
  const urls = coverImageRecoveryUrls(url, record);
  for (let index = 0; index < urls.length; index += 4) {
    const results = await Promise.all(urls.slice(index, index + 4).map(async candidate => {
      try { return await verify(candidate) ? candidate : ''; } catch { return ''; }
    }));
    const found = results.find(Boolean);
    if (found) return found;
  }
  return '';
}
