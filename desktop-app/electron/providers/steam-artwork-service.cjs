const validId = value => /^\d{1,12}$/.test(String(value || '').trim());
function parseSteamArtwork(item, id) {
  if (String(item?.appid || item?.id) !== id || item.success !== 1 || item.item_type !== 0) return null;
  const portraits = [];
  let icon = '';
  for (const assets of [item.assets, item.assets_without_overrides]) {
    if (!assets) continue;
    if (!icon && /^[a-f\d]{40}$/i.test(assets.community_icon || '')) {
      icon = `https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/apps/${id}/${assets.community_icon}.jpg`;
    }
    const format = String(assets.asset_url_format || '');
    if (!new RegExp('^steam/apps/' + id + '/\\$\\{FILENAME\\}(?:\\?t=\\d+)?$').test(format)) continue;
    for (const file of [assets.library_capsule_2x, assets.library_capsule]) {
      if (typeof file !== 'string' || !/^(?:[a-f\d]{40}\/)?library_(?:capsule|600x900)(?:_alt_assets_\d+)?(?:_2x)?\.(?:jpg|png|webp)$/i.test(file)) continue;
      portraits.push('https://shared.fastly.steamstatic.com/store_item_assets/' + format.replace('${FILENAME}', file));
    }
  }
  return { appid: id, icon, portraitImage: portraits[0] || '', portraits: [...new Set(portraits)] };
}

function createSteamArtworkService({ httpGetJson }) {
  const cache = new Map(), requests = new Map();
  async function getMany(values) {
    if (!Array.isArray(values) || values.length > 40 || !values.every(validId)) return [];
    const ids = [...new Set(values.map(value => String(value).trim()))];
    const missing = ids.filter(id => !cache.has(id) || cache.get(id).expires <= Date.now());
    if (missing.length) {
      const key = [...missing].sort().join(',');
      let request = requests.get(key);
      if (!request && requests.size >= 4) return ids.flatMap(id => cache.get(id)?.expires > Date.now() ? [{ ...cache.get(id).value, portraits: [...cache.get(id).value.portraits] }] : []);
      if (!request) {
        request = (async () => {
          try {
            const input = { ids: missing.map(id => ({ appid: Number(id) })), context: { language: 'english', country_code: 'US' }, data_request: { include_assets: true, include_assets_without_overrides: true } };
            const data = await httpGetJson('https://api.steampowered.com/IStoreBrowseService/GetItems/v1/?input_json=' + encodeURIComponent(JSON.stringify(input)), 7000);
            const items = Array.isArray(data?.response?.store_items) ? data.response.store_items : [];
            for (const id of missing) {
              const value = parseSteamArtwork(items.find(item => String(item?.appid || item?.id) === id), id);
              if (!value || (!value.icon && !value.portraits.length)) continue;
              if (cache.size >= 512) cache.delete(cache.keys().next().value);
              cache.set(id, { value, expires: Date.now() + 600000 });
            }
          } catch { /* Missing/offline artwork is optional; never negative-cache it here. */ }
          finally { requests.delete(key); }
        })();
        requests.set(key, request);
      }
      await request;
    }
    return ids.flatMap(id => cache.get(id)?.expires > Date.now() ? [{ ...cache.get(id).value, portraits: [...cache.get(id).value.portraits] }] : []);
  }
  return { getMany };
}
module.exports = { createSteamArtworkService, parseSteamArtwork };
