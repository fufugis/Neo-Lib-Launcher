import React from 'react';
import { themeVideoMetadataAllowed } from '../themes/theme-video-model.mjs';

// Still artwork remains visible until Chromium confirms the local video is
// decodable and within the theme playback limits.
export default function ThemeVideoMedia({ animatedUrl, stillUrl, loop = 'while-visible', forceStill = false, showStill = true, className = '', style = undefined }) {
  const videoRef = React.useRef(null);
  const [reducedMotion, setReducedMotion] = React.useState(() => Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches));
  const [visible, setVisible] = React.useState(() => document.visibilityState !== 'hidden');
  const [ready, setReady] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const [ended, setEnded] = React.useState(false);
  React.useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const onMotion = () => setReducedMotion(Boolean(media?.matches));
    const onVisibility = () => setVisible(document.visibilityState !== 'hidden');
    media?.addEventListener?.('change', onMotion);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      media?.removeEventListener?.('change', onMotion);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);
  React.useEffect(() => { setReady(false); setFailed(false); setEnded(false); }, [animatedUrl]);
  React.useEffect(() => { if (!visible && loop === 'while-visible') setReady(false); }, [visible, loop]);
  const stillOnly = forceStill || reducedMotion || failed || ended || !visible && loop === 'while-visible';
  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (stillOnly || !visible || !ready) { video.pause(); return; }
    const attempt = video.play();
    attempt?.catch?.(() => setFailed(true));
  }, [stillOnly, visible, ready]);
  return <>
    {showStill && <img src={stillUrl} alt="" aria-hidden="true" draggable={false} className={className} style={{ ...style, opacity: ready && !stillOnly ? 0 : style?.opacity }} />}
    {!stillOnly && <video ref={videoRef} src={animatedUrl} muted playsInline preload="metadata" loop={loop !== 'once'}
      aria-hidden="true" className={className} style={{ ...style, opacity: ready ? style?.opacity : 0 }}
      onLoadedMetadata={event => themeVideoMetadataAllowed(event.currentTarget) ? setReady(true) : setFailed(true)}
      onError={() => setFailed(true)} onEnded={() => { if (loop === 'once') setEnded(true); }} />}
  </>;
}
