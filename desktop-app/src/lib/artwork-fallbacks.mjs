import { officialSteamPortrait } from './game-artwork-model.mjs';

const imageUrl = value => typeof value === 'string' && /^(https?:\/\/|file:|neolib-background:|data:image\/)/i.test(value.trim());
const escape = value => String(value).replace(/[<>&"']/g, character => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[character]);

export function generatedGameArtwork(game = {}, role = 'cover') {
  const name = String(game.name || 'Untitled game').trim().slice(0, 90);
  let hash = 0;
  for (const character of String(game.id || name)) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  const wide = ['hero', 'background', 'logo'].includes(role);
  const width = wide ? 1200 : 720, height = wide ? 675 : role === 'icon' ? 720 : 960;
  const lines = name.match(/.{1,22}(?:\s|$)|\S{1,22}/g) || [name];
  const text = lines.slice(0, 4).map((line, index) => `<tspan x="50%" dy="${index ? 58 : 0}">${escape(line.trim())}</tspan>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" data-neolib-generated="true"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="hsl(${hash % 360},55%,30%)"/><stop offset="1" stop-color="#111827"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><circle cx="${width * .8}" cy="${height * .2}" r="220" fill="none" stroke="white" opacity=".13" stroke-width="3"/><path d="M0 ${height * .8}L${width} ${height * .45}" stroke="white" opacity=".12" stroke-width="6"/><text x="50%" y="${height * .42}" text-anchor="middle" font-family="Arial,sans-serif" font-size="46" font-weight="bold" fill="white">${text}</text><text x="50%" y="${height - 65}" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" fill="#cbd5e1">NEO-LIB · Generated game artwork</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function gameArtworkCandidates(game = {}, role = 'cover', { includeGenerated = true } = {}) {
  const screenshots = Array.isArray(game.screenshots) ? game.screenshots : String(game.screenshots || '').split(/\r?\n/);
  const cover = [game.coverUrl, game.portraitImage];
  const hero = [game.heroArtworkOverride, game.headerImage, game.hero];
  const logo = [game.logo, game.logoImage];
  const official = officialSteamPortrait(game.steamAppId || game.appid);
  const preferred = role === 'icon' ? [game.icon, ...cover]
    : role === 'logo' ? logo
      : role === 'hero' ? hero
        : role === 'background' ? [game.background, ...hero]
          : [...cover, official];
  const candidates = [...preferred, ...cover, ...hero, game.background, game.capsuleImage, ...logo, game.icon, ...screenshots.slice(0, 24), official];
  const urls = [...new Set(candidates.filter(imageUrl).map(value => value.trim()))];
  if (includeGenerated) urls.push(generatedGameArtwork(game, role));
  return urls;
}
