import React from 'react';
import { Gamepad2 } from 'lucide-react';
import { hasPortraitDimensions, portraitArtworkCandidates } from '../../lib/game-artwork-model.mjs';

// Share successful decode/validation between shelf, hero and remounted cards.
// URL identity keeps an edited game's new cover independent of its old cover.
const decodedPortraits = new Map();

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
  const portraitRef = React.useRef(null);
  const [rejectedPortraitUrls, setRejectedPortraitUrls] = React.useState([]);
  const [approvedPortraitUrl, setApprovedPortraitUrl] = React.useState('');
  const [failedBackdrop, setFailedBackdrop] = React.useState(false);
  const [failedIcon, setFailedIcon] = React.useState(false);
  React.useEffect(() => {
    setRejectedPortraitUrls([]);
    setFailedBackdrop(false);
    setFailedIcon(false);
  }, [game?.id]);
  const portrait = portraitArtworkCandidates(game).find(url => !rejectedPortraitUrls.includes(url));
  React.useLayoutEffect(() => {
    const image = portraitRef.current;
    // Reuse validation before paint only when this actual element has pixels.
    // A previously approved URL alone does not guarantee a cache hit.
    if (portrait && decodedPortraits.has(portrait) && image?.complete && hasPortraitDimensions(image.naturalWidth, image.naturalHeight)) {
      setApprovedPortraitUrl(portrait);
    }
  }, [portrait, game?.id]);
  const backdrop = fallbackArtwork(game);
  const icon = typeof game?.icon === 'string' && game.icon.trim() ? game.icon : '';
  const rejectPortrait = url => {
    decodedPortraits.delete(url);
    setRejectedPortraitUrls(current => current.includes(url) ? current : [...current, url]);
    setApprovedPortraitUrl(current => current === url ? '' : current);
  };
  const portraitVisible = Boolean(portrait && approvedPortraitUrl === portrait);

  return <span className="relative grid h-full w-full place-items-center overflow-hidden" style={{ background: fallbackGradient(game?.name) }} data-testid={!portraitVisible ? 'lounge-cover-fallback' : undefined}>
    {!portrait && backdrop && !failedBackdrop && <img src={backdrop} alt="" aria-hidden="true" loading="lazy" decoding="async" onError={() => setFailedBackdrop(true)} data-testid="lounge-cover-fallback-art" className="absolute inset-0 h-full w-full scale-105 object-cover opacity-40 transition-opacity duration-300" />}
    {!portraitVisible && <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-slate-950/35 to-slate-950/85" />}
    {!portraitVisible && <span className="relative z-[1] grid h-12 w-12 place-items-center overflow-hidden rounded-2xl border border-white/35 bg-black/40 shadow-[0_8px_28px_rgb(0_0_0/.45)]" aria-hidden="true">
      {icon && !failedIcon
        ? <img src={icon} alt="" onError={() => setFailedIcon(true)} className="h-full w-full object-cover" />
        : <Gamepad2 size={22} className="text-white/80" />}
    </span>}
    {portrait && <img ref={portraitRef} key={portrait} src={portrait} alt="" loading="eager" decoding="async" onError={() => rejectPortrait(portrait)} onLoad={async event => {
      const image = event.currentTarget;
      const { naturalWidth, naturalHeight } = image;
      if (!hasPortraitDimensions(naturalWidth, naturalHeight)) { rejectPortrait(portrait); return; }
      // Load can precede async decode. Do not remove the fallback until the
      // actual pixels are ready, or let a superseded candidate approve itself.
      try { if (image.decode) await image.decode(); }
      catch { if (image.isConnected) rejectPortrait(portrait); return; }
      if (image.isConnected) {
        decodedPortraits.delete(portrait); decodedPortraits.set(portrait, true);
        if (decodedPortraits.size > 512) decodedPortraits.delete(decodedPortraits.keys().next().value);
        setApprovedPortraitUrl(portrait);
      }
    }} className={`absolute inset-0 z-[2] h-full w-full object-cover ${portraitVisible ? 'visible' : 'invisible'}`} />}
  </span>;
}

export default React.memo(LoungeCover);
