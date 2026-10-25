import React from 'react';
import { gameArtworkCandidates, generatedGameArtwork } from '../lib/artwork-fallbacks.mjs';

// All shapes are usable. Failed images advance once, then end at a local SVG.
export default function GameArtwork({ game = {}, role = 'cover', className = '', alt = '', loading = 'lazy', onDimensions }) {
  const urls = gameArtworkCandidates(game, role);
  const retry = `${game.metadataFetchedAt || ''}:${game.artworkRevisions?.at(-1)?.at || ''}`;
  return <ArtworkImage key={JSON.stringify([urls, retry])} urls={urls} placeholder={generatedGameArtwork(game, role)} role={role} className={className} alt={alt} loading={loading} onDimensions={onDimensions} />;
}

function ArtworkImage({ urls, placeholder, role, className, alt, loading, onDimensions }) {
  const [index, setIndex] = React.useState(0);
  const [loaded, setLoaded] = React.useState(false);
  const [fit, setFit] = React.useState('contain');
  const url = urls[index] || placeholder;
  const next = () => { setLoaded(false); setIndex(current => Math.min(current + 1, urls.length - 1)); };
  return <>
    {!loaded && <img src={placeholder} alt="" aria-hidden="true" className={className} style={{ objectFit: 'contain' }} decoding="async" />}
    <img key={url} src={url} alt={alt} loading={loading} decoding="async" className={className}
      data-game-artwork={role} style={{ objectFit: fit, visibility: loaded ? 'visible' : 'hidden' }} onError={next} onLoad={async event => {
        const image = event.currentTarget;
        if (!(image.naturalWidth > 0 && image.naturalHeight > 0)) { next(); return; }
        try { await image.decode?.(); } catch { if (image.isConnected) next(); return; }
        if (!image.isConnected) return;
        setFit(role === 'cover' && image.naturalHeight >= image.naturalWidth * 1.15 || ['hero', 'background'].includes(role) ? 'cover' : 'contain');
        setLoaded(true);
        onDimensions?.({ width: image.naturalWidth, height: image.naturalHeight, src: url });
      }} />
  </>;
}
