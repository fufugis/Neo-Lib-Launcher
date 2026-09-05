import React from 'react';

const FRAME_FILES = {
  anime: 'anime-button-frame-v2.png',
  pro: 'industrial-chain-button-v4.png',
  colorful: 'magical-button-frame-v2.png',
};
const FLOURISH_FILES = {
  anime: 'anime-control-vine-v1.png',
  pro: 'industrial-control-machinery-v1.png',
  colorful: 'magical-corner-wisp-v2.png',
};

// HTML image URLs resolve against the document, including Electron file://.
// Keep them out of stylesheet-relative CSS custom properties.
export default function NavButtonArtwork({ theme, opacity = 0.46, active = false }) {
  const filename = FRAME_FILES[theme];
  const strength = Number.isFinite(opacity) ? Math.max(0, Math.min(1, opacity)) : 0.46;
  if (!filename || strength === 0) return null;
  const src = new URL(`${import.meta.env.BASE_URL}theme-art/${filename}`, document.baseURI).href;
  const flourish = new URL(`${import.meta.env.BASE_URL}theme-art/${FLOURISH_FILES[theme]}`, document.baseURI).href;
  const outward = theme === 'anime' ? 6 : 5;
  const imageStyle = {
    // Stretch with the individual button, including horizontal sidebar resizing.
    // No fixed aspect ratio or natural-image minimum width participates in layout.
    position: 'absolute', inset: 0, width: '100%', height: '100%',
    maxWidth: 'none', objectFit: 'fill', pointerEvents: 'none',
  };
  return (
    <span aria-hidden="true" data-testid="nav-button-artwork" data-art-theme={theme}
      style={{ position: 'absolute', inset: theme === 'pro' ? '-10px -5px' : `-${outward}px`, zIndex: 2, pointerEvents: 'none',
        borderRadius: '10px', overflow: 'visible', opacity: Math.min(1, strength * 1.85) }}>
      <img src={src} alt="" draggable={false} style={imageStyle} />
      {theme !== 'pro' && <img src={src} alt="" draggable={false} style={{ ...imageStyle, transform: 'rotate(180deg)' }} />}
      {/* The opaque face leaves a narrow illustrated ring on all four sides. */}
      {theme !== 'pro' && <span style={{ position: 'absolute', inset: `${outward + 4}px`, borderRadius: '5px',
        background: active
          ? 'linear-gradient(rgb(var(--accent)/0.15), rgb(var(--accent)/0.07)), rgb(var(--panel))'
          : 'rgb(var(--panel))', pointerEvents: 'none' }} />}
      {/* Real illustration details at opposite corners, outside the clear label area.
          Viewport crops enlarge petals/gears/crystals without stretching a toolbar frame. */}
      {theme === 'colorful' && [
        { right: '-3px', top: '-3px', transform: 'none' },
        { left: '-3px', top: '-3px', transform: 'scaleX(-1)' },
        { right: '-3px', bottom: '-3px', transform: 'scaleY(-1)' },
        { left: '-3px', bottom: '-3px', transform: 'scale(-1)' },
      ].map((corner, index) => <img key={index} data-nav-flourish="true" data-magic-corner={index}
        src={flourish} alt="" draggable={false} style={{ position: 'absolute', width: 'min(30px, 24%)',
          height: '30px', objectFit: 'fill', maxWidth: 'none', pointerEvents: 'none', ...corner }} />)}
      {theme === 'anime' && [false, true].map(opposite => <span key={String(opposite)} data-nav-flourish="true"
        style={{ position: 'absolute', width: '29px', height: '29px', overflow: 'hidden',
          ...(theme === 'colorful'
            ? opposite ? { left: '-2px', bottom: '-3px' } : { right: '-2px', top: '-3px' }
            : opposite ? { right: '-2px', bottom: '-3px' } : { left: '-2px', top: '-3px' }),
          transform: opposite ? 'rotate(180deg)' : 'none', pointerEvents: 'none' }}>
        <img src={flourish} alt="" draggable={false} style={{ position: 'absolute', maxWidth: 'none',
          width: theme === 'pro' ? '100px' : '92px', height: '62px', objectFit: 'fill', pointerEvents: 'none',
          ...(theme === 'anime' ? { left: '-2px', top: '-4px' }
            : theme === 'pro' ? { right: '-2px', bottom: '-2px' }
            : { right: '-2px', top: '-2px' }),
          filter: theme === 'pro' ? 'sepia(0.3) saturate(1.3) brightness(1.15)' : 'saturate(1.15)' }} />
      </span>)}
    </span>
  );
}
