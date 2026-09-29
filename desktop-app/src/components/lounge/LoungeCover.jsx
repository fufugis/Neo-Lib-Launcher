import React from 'react';
import { hasPortraitDimensions, portraitArtworkCandidates } from '../../lib/game-artwork-model.mjs';

function fallbackGradient(name) {
  let hash = 0;
  for (const character of String(name || 'NEO-LIB')) hash = ((hash << 5) - hash + character.charCodeAt(0)) | 0;
  const hue = Math.abs(hash) % 360;
  return `linear-gradient(145deg, hsl(${hue} 66% 42%), hsl(${(hue + 74) % 360} 72% 24%))`;
}

function LoungeCover({ game }) {
  const [rejectedPortraitUrls, setRejectedPortraitUrls] = React.useState([]);
  const [approvedPortraitUrl, setApprovedPortraitUrl] = React.useState('');
  React.useEffect(() => {
    setRejectedPortraitUrls([]);
    setApprovedPortraitUrl('');
  }, [game?.id]);
  const portrait = portraitArtworkCandidates(game).find(url => !rejectedPortraitUrls.includes(url));
  const rejectPortrait = url => setRejectedPortraitUrls(current => current.includes(url) ? current : [...current, url]);
  return <span className="relative grid h-full w-full place-items-end overflow-hidden p-3" style={{ background: fallbackGradient(game.name) }} data-testid={approvedPortraitUrl === portrait ? undefined : 'lounge-cover-fallback'}>
    <span className="pointer-events-none absolute -right-8 top-8 h-44 w-44 rotate-12 rounded-[28%] border border-white/20 bg-white/10" />
    <span className="pointer-events-none absolute left-1/2 top-[38%] h-px w-4/5 -translate-x-1/2 bg-white/25" />
    <span className="pointer-events-none absolute inset-0 grid place-items-center text-[clamp(3rem,7vw,5rem)] font-black uppercase text-white/30" aria-hidden="true">{String(game.name || 'N').trim().slice(0, 1)}</span>
    <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/10" />
    <span className="relative z-[1] w-full text-left text-[10px] font-bold uppercase tracking-[0.1em] text-white/90 [text-shadow:0_1px_3px_rgb(0_0_0/.85)]">Portrait cover needed</span>
    {portrait && <img src={portrait} alt="" loading="lazy" decoding="async" onError={() => rejectPortrait(portrait)} onLoad={event => {
      const { naturalWidth, naturalHeight } = event.currentTarget;
      if (hasPortraitDimensions(naturalWidth, naturalHeight)) setApprovedPortraitUrl(portrait);
      else rejectPortrait(portrait);
    }} className={`absolute inset-0 z-[2] h-full w-full object-cover ${approvedPortraitUrl === portrait ? 'visible' : 'invisible'}`} />}
  </span>;
}

export default React.memo(LoungeCover);
