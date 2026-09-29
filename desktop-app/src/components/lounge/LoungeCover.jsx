import React from 'react';
import { artworkBackdrop, portraitArtworkCandidates } from '../../lib/game-artwork-model.mjs';

function fallbackGradient(name) {
  let hash = 0;
  for (const character of String(name || 'NEO-LIB')) hash = ((hash << 5) - hash + character.charCodeAt(0)) | 0;
  const hue = Math.abs(hash) % 360;
  return `linear-gradient(145deg, hsl(${hue} 66% 42%), hsl(${(hue + 74) % 360} 72% 24%))`;
}

function LoungeCover({ game }) {
  const [rejectedPortraitUrls, setRejectedPortraitUrls] = React.useState([]);
  const [failedBackdropUrl, setFailedBackdropUrl] = React.useState('');
  const portrait = portraitArtworkCandidates(game).find(url => !rejectedPortraitUrls.includes(url));
  const backdrop = artworkBackdrop(game);
  const rejectPortrait = url => setRejectedPortraitUrls(current => current.includes(url) ? current : [...current, url]);
  if (portrait) return <img src={portrait} alt="" loading="lazy" decoding="async" onError={() => rejectPortrait(portrait)} onLoad={event => {
    const { naturalWidth, naturalHeight } = event.currentTarget;
    if (naturalWidth > naturalHeight * 0.92) rejectPortrait(portrait);
  }} className="h-full w-full bg-black/20 object-contain" />;
  return <span className="relative grid h-full w-full place-items-center overflow-hidden p-3" style={{ background: fallbackGradient(game.name) }} data-testid="lounge-cover-fallback">
    {backdrop && backdrop !== failedBackdropUrl && <>
      <img src={backdrop} alt="" loading="lazy" decoding="async" onError={() => setFailedBackdropUrl(backdrop)} className="absolute inset-0 h-full w-full scale-110 object-cover opacity-35 blur-xl saturate-[1.12]" />
      <img src={backdrop} alt="" loading="lazy" decoding="async" onError={() => setFailedBackdropUrl(backdrop)} className="relative z-[1] max-h-full max-w-full object-contain drop-shadow-[0_3px_12px_rgb(0_0_0/.5)]" />
    </>}
    <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
    <span className="absolute inset-x-3 bottom-3 z-[2] break-words text-center text-base font-bold leading-tight text-white [text-shadow:0_1px_3px_rgb(0_0_0/.85)]">{game.name || 'Untitled game'}</span>
  </span>;
}

export default React.memo(LoungeCover);
