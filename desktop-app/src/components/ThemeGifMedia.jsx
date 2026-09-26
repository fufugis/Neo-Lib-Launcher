import React from 'react';

// The package supplies only an already-validated GIF and a still fallback.
// Mounting controls decoder lifetime; no theme-owned code or timers run here.
export default function ThemeGifMedia({ animatedUrl, stillUrl, loop = 'while-visible', playbackMs = 0, forceStill = false, showStill = true, className = '', style = undefined }) {
  const [reducedMotion, setReducedMotion] = React.useState(() => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  const [visible, setVisible] = React.useState(() => typeof document === 'undefined' || document.visibilityState !== 'hidden');
  const [loaded, setLoaded] = React.useState(false);
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
  React.useEffect(() => { setLoaded(false); setEnded(false); }, [animatedUrl]);
  React.useEffect(() => { if (loop === 'once' && (!visible || reducedMotion || forceStill)) setEnded(true); }, [loop, visible, reducedMotion, forceStill]);
  React.useEffect(() => {
    if (loop !== 'once' || !loaded || ended || !visible || forceStill || reducedMotion) return undefined;
    const timer = window.setTimeout(() => setEnded(true), playbackMs);
    return () => window.clearTimeout(timer);
  }, [loop, loaded, ended, visible, forceStill, reducedMotion, playbackMs]);
  const useStill = forceStill || reducedMotion || ended || (loop === 'while-visible' && !visible)
    || (loop === 'once' && (!visible || !Number.isInteger(playbackMs) || playbackMs < 100 || playbackMs > 20_000));
  return useStill && !showStill ? null : <img src={useStill ? stillUrl : animatedUrl} onLoad={() => { if (!useStill) setLoaded(true); }} alt="" aria-hidden="true" draggable={false} className={className} style={style} />;
}
