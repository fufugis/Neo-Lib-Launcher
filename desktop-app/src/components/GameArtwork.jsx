import React from 'react';
import { explicitArtwork, gameArtworkCandidates, generatedGameArtwork } from '../lib/artwork-fallbacks.mjs';
import { steamArtworkId } from '../lib/steam-artwork-cache.mjs';
import { useSteamArtwork } from '../hooks/use-steam-artwork.mjs';

// Automatic Steam artwork tries matching shapes first; custom choices stay first.
// Any working related image remains a last resort before the local SVG.
export default function GameArtwork({ game = {}, role = 'cover', className = '', alt = '', loading = 'lazy', onDimensions }) {
  game = useSteamArtwork(game, role === 'icon' || role === 'cover');
  const urls = gameArtworkCandidates(game, role);
  const retry = `${game.metadataFetchedAt || ''}:${game.artworkRevisions?.at(-1)?.at || ''}`;
  return <ArtworkImage key={JSON.stringify([urls, retry])} urls={urls} preferShape={Boolean(steamArtworkId(game)) && !explicitArtwork(game, role)} placeholder={generatedGameArtwork(game, role)} role={role} className={className} alt={alt} loading={loading} onDimensions={onDimensions} />;
}

function ArtworkImage({ urls, preferShape, placeholder, role, className, alt, loading, onDimensions }) {
  const [index, setIndex] = React.useState(0);
  const [loaded, setLoaded] = React.useState(false);
  const [fit, setFit] = React.useState('contain');
  const [deferred, setDeferred] = React.useState([]);
  const atEnd = !urls[index] || urls[index] === placeholder;
  const url = atEnd ? deferred[0] || placeholder : urls[index];
  const next = () => {
    setLoaded(false);
    if (atEnd && deferred.length) setDeferred(current => current.slice(1));
    else setIndex(current => Math.min(current + 1, urls.length - 1));
  };
  return <>
    {!loaded && <img src={placeholder} alt="" aria-hidden="true" className={className} style={{ objectFit: 'contain' }} decoding="async" />}
    <img key={`${index}:${url}`} src={url} alt={alt} loading={loading} decoding="async" className={className}
      data-game-artwork={role} style={{ objectFit: fit, visibility: loaded ? 'visible' : 'hidden' }} onError={next} onLoad={async event => {
        const image = event.currentTarget;
        if (!(image.naturalWidth > 0 && image.naturalHeight > 0)) { next(); return; }
        const ratio = image.naturalWidth / image.naturalHeight;
        if (preferShape && !atEnd && (role === 'icon' && (ratio < 0.8 || ratio > 1.25) || role === 'cover' && ratio > 1 / 1.15)) {
          setDeferred(current => [...current, url]); next(); return;
        }
        try { await image.decode?.(); } catch { if (image.isConnected) next(); return; }
        if (!image.isConnected) return;
        setFit(role === 'cover' && image.naturalHeight >= image.naturalWidth * 1.15 || ['hero', 'background'].includes(role) ? 'cover' : 'contain');
        setLoaded(true);
        onDimensions?.({ width: image.naturalWidth, height: image.naturalHeight, src: url });
      }} />
  </>;
}
