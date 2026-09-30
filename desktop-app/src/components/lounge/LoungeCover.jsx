import React from 'react';
import { Gamepad2 } from 'lucide-react';
import { hasPortraitDimensions, portraitArtworkCandidates } from '../../lib/game-artwork-model.mjs';

function fallbackGradient(name) {
  let hash = 0;
  for (const character of String(name || 'NEO-LIB')) hash = ((hash << 5) - hash + character.charCodeAt(0)) | 0;
  const hue = Math.abs(hash) % 360;
  return `linear-gradient(145deg, hsl(${hue} 66% 42%), hsl(${(hue + 74) % 360} 72% 24%))`;
}

function fallbackArtwork(game) {
  const screenshots = Array.isArray(game?.screenshots) ? game.screenshots : [];
  return [game?.headerImage, game?.background, ...screenshots, game?.capsuleImage, game?.coverUrl]
    .find(value => typeof value === 'string' && value.trim()) || '';
}

function LoungeCover({ game }) {
  const [rejectedPortraitUrls, setRejectedPortraitUrls] = React.useState([]);
  const [approvedPortraitUrl, setApprovedPortraitUrl] = React.useState('');
  const [failedBackdrop, setFailedBackdrop] = React.useState(false);
  const [failedIcon, setFailedIcon] = React.useState(false);
  React.useEffect(() => {
    setRejectedPortraitUrls([]);
    setApprovedPortraitUrl('');
    setFailedBackdrop(false);
    setFailedIcon(false);
  }, [game?.id]);
  const portrait = portraitArtworkCandidates(game).find(url => !rejectedPortraitUrls.includes(url));
  const backdrop = fallbackArtwork(game);
  const icon = typeof game?.icon === 'string' && game.icon.trim() ? game.icon : '';
  const rejectPortrait = url => setRejectedPortraitUrls(current => current.includes(url) ? current : [...current, url]);

  return <span className="relative grid h-full w-full place-items-center overflow-hidden" style={{ background: fallbackGradient(game?.name) }} data-testid={!approvedPortraitUrl ? 'lounge-cover-fallback' : undefined}>
    {backdrop && !failedBackdrop && <img src={backdrop} alt="" aria-hidden="true" loading="lazy" decoding="async" onError={() => setFailedBackdrop(true)} data-testid="lounge-cover-fallback-art" className="absolute inset-0 h-full w-full scale-105 object-cover opacity-40 transition-opacity duration-300" />}
    <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-slate-950/35 to-slate-950/85" />
    <span className="relative z-[1] grid h-12 w-12 place-items-center overflow-hidden rounded-2xl border border-white/35 bg-black/40 shadow-[0_8px_28px_rgb(0_0_0/.45)]" aria-hidden="true">
      {icon && !failedIcon
        ? <img src={icon} alt="" onError={() => setFailedIcon(true)} className="h-full w-full object-cover" />
        : <Gamepad2 size={22} className="text-white/80" />}
    </span>
    {portrait && <img src={portrait} alt="" loading="lazy" decoding="async" onError={() => rejectPortrait(portrait)} onLoad={event => {
      const { naturalWidth, naturalHeight } = event.currentTarget;
      if (hasPortraitDimensions(naturalWidth, naturalHeight)) setApprovedPortraitUrl(portrait);
      else rejectPortrait(portrait);
    }} className={`absolute inset-0 z-[2] h-full w-full object-cover ${approvedPortraitUrl === portrait ? 'visible' : 'invisible'}`} />}
  </span>;
}

export default React.memo(LoungeCover);
