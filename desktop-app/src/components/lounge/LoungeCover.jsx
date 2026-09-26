import React from 'react';
import { artworkBackdrop, portraitArtwork } from '../../lib/game-artwork-model.mjs';

function fallbackGradient(name) {
  let hash = 0;
  for (const character of String(name || 'NEO-LIB')) hash = ((hash << 5) - hash + character.charCodeAt(0)) | 0;
  const hue = Math.abs(hash) % 360;
  return `linear-gradient(145deg, hsl(${hue} 66% 42%), hsl(${(hue + 74) % 360} 72% 24%))`;
}

export default function LoungeCover({ game }) {
  const [failedPortraitUrl, setFailedPortraitUrl] = React.useState('');
  const [failedBackdropUrl, setFailedBackdropUrl] = React.useState('');
  const portrait = portraitArtwork(game);
  const backdrop = artworkBackdrop(game);
  if (portrait && failedPortraitUrl !== portrait) return <img src={portrait} alt="" loading="lazy" decoding="async" onError={() => setFailedPortraitUrl(portrait)} className="h-full w-full object-cover" />;
  return <span className="relative grid h-full w-full place-items-end overflow-hidden p-3" style={{ background: fallbackGradient(game.name) }} data-testid="lounge-cover-fallback">
    {backdrop && backdrop !== failedPortraitUrl && backdrop !== failedBackdropUrl && <img src={backdrop} alt="" loading="lazy" decoding="async" onError={() => setFailedBackdropUrl(backdrop)} className="absolute inset-0 h-full w-full object-cover saturate-[1.12]" />}
    <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
    <span className="relative break-words text-base font-bold leading-tight text-white [text-shadow:0_1px_3px_rgb(0_0_0/.85)]">{game.name || 'Untitled game'}</span>
  </span>;
}
