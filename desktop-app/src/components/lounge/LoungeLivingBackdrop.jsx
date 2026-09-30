import React from 'react';
import { customThemeAssetUrl, customThemeCanvas, customThemeManifest, stockThemeAssetUrl, stockThemeFileUrl, stockThemeManifest } from '../../themes/stock-theme-registry.mjs';
import { loungeSceneArt } from './lounge-scene-art.mjs';
import { findBrightestArea } from './lounge-light-analysis.mjs';
import { loungeBackgroundMediaKind, loungeBackgroundMotionStyle } from './lounge-layout-model.mjs';

export default function LoungeLivingBackdrop({ theme, game, loungeLevel, motion, active, flowOpacity = 0.36, flowSeconds = 18, preferences, onBackgroundError }) {
  const [failedGameArt, setFailedGameArt] = React.useState([]);
  const [failedBackgroundUrl, setFailedBackgroundUrl] = React.useState('');
  const [artRatio, setArtRatio] = React.useState(16 / 9);
  const [brightestArea, setBrightestArea] = React.useState({ x: 72, y: 18, strength: 0.35 });
  const [viewport, setViewport] = React.useState(() => ({ width: window.innerWidth, height: window.innerHeight }));
  const backgroundVideoRef = React.useRef(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(() => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  React.useEffect(() => {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!query) return undefined;
    const update = () => setPrefersReducedMotion(query.matches);
    query.addEventListener?.('change', update);
    return () => query.removeEventListener?.('change', update);
  }, []);
  React.useEffect(() => {
    const resize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);
  const custom = customThemeManifest(theme);
  const manifest = custom || stockThemeManifest(theme);
  const atmosphere = manifest?.layers?.atmosphere;
  const stillAsset = atmosphere?.type === 'image'
    ? stockThemeAssetUrl(theme, 'atmosphere')
    : atmosphere?.reducedMotionAsset
      ? (custom ? customThemeAssetUrl(theme, atmosphere.reducedMotionAsset) : stockThemeFileUrl(theme, atmosphere.reducedMotionAsset))
      : '';
  const artOpacity = Math.min(0.44, Math.max(0.12, (atmosphere?.opacity ?? 0.3) * 0.65));
  const flow = Math.max(0, Math.min(1, Number(flowOpacity) || 0));
  const seconds = Math.max(6, Math.min(60, Number(flowSeconds) || 18));
  const paceMultiplier = preferences?.ambientPace === 'slow' ? 1.7 : preferences?.ambientPace === 'lively' ? 0.72 : 1;
  const duration = seconds * (motion === 'subtle' ? 2.4 : 1.6) * paceMultiplier;
  const animated = active && !prefersReducedMotion && motion !== 'off' && preferences?.ambientMotion !== 'still';
  const motionStrength = motion === 'off' ? 0 : motion === 'subtle' ? 1 : 3;
  const mode = preferences?.backdropMode || 'theme';
  const sceneArt = mode === 'theme' ? loungeSceneArt(preferences?.specialTheme) : '';
  const gameArt = [...(Array.isArray(game?.screenshots) ? game.screenshots : []), game?.headerImage, game?.background, game?.capsuleImage].find(value => typeof value === 'string' && value.trim() && !failedGameArt.includes(value)) || '';
  const screenRatio = viewport.width / Math.max(1, viewport.height);
  const artFit = preferences?.backgroundFit === 'fit' || (preferences?.backgroundFit !== 'fill' && screenRatio > artRatio * 1.18) ? 'contain' : 'cover';
  const savedImage = mode === 'image' && preferences?.backgroundUrl !== failedBackgroundUrl ? preferences?.backgroundUrl : '';
  const image = mode === 'image' ? savedImage : mode === 'theme' ? sceneArt || stillAsset : mode === 'game' ? stillAsset : '';
  const mediaKind = loungeBackgroundMediaKind(image);
  const backgroundMotion = Math.max(0, Math.min(100, Number(preferences?.backgroundMotion ?? 55)));
  const movingUserArt = mode === 'image' && animated && backgroundMotion > 0;
  const lightSource = mode === 'game' ? gameArt || image : mode === 'image' ? image : mode === 'theme' ? image : '';
  const sampleArtwork = React.useCallback((source) => {
    const width = source?.naturalWidth || source?.videoWidth || 0;
    const height = source?.naturalHeight || source?.videoHeight || 0;
    if (!width || !height) return;
    setArtRatio(width / height);
    try {
      const sampleWidth = 96;
      const sampleHeight = 54;
      const canvas = document.createElement('canvas');
      canvas.width = sampleWidth;
      canvas.height = sampleHeight;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (context) {
        context.drawImage(source, 0, 0, sampleWidth, sampleHeight);
        setBrightestArea(findBrightestArea(context.getImageData(0, 0, sampleWidth, sampleHeight).data, sampleWidth, sampleHeight));
      }
    } catch { setBrightestArea({ x: 72, y: 18, strength: 0.35 }); }
  }, []);
  React.useEffect(() => { setFailedBackgroundUrl(''); }, [preferences?.backgroundUrl]);
  React.useEffect(() => {
    const video = backgroundVideoRef.current;
    if (!video) return;
    if (!movingUserArt) { video.pause(); return; }
    video.play().catch(() => {});
  }, [image, movingUserArt]);
  React.useEffect(() => {
    if (!lightSource) { setBrightestArea({ x: 72, y: 18, strength: 0.35 }); return undefined; }
    if (loungeBackgroundMediaKind(lightSource) === 'video') {
      if (backgroundVideoRef.current) sampleArtwork(backgroundVideoRef.current);
      return undefined;
    }
    let cancelled = false;
    const probe = new Image();
    probe.onload = () => {
      if (cancelled) return;
      setArtRatio(probe.naturalWidth / Math.max(1, probe.naturalHeight));
      try {
        const sampleWidth = 96;
        const sampleHeight = 54;
        const canvas = document.createElement('canvas');
        canvas.width = sampleWidth;
        canvas.height = sampleHeight;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) return;
        context.drawImage(probe, 0, 0, sampleWidth, sampleHeight);
        setBrightestArea(findBrightestArea(context.getImageData(0, 0, sampleWidth, sampleHeight).data, sampleWidth, sampleHeight));
      } catch {
        setBrightestArea({ x: 72, y: 18, strength: 0.35 });
      }
    };
    probe.onerror = () => { if (!cancelled) setBrightestArea({ x: 72, y: 18, strength: 0.35 }); };
    probe.src = lightSource;
    return () => { cancelled = true; probe.onload = null; probe.onerror = null; };
  }, [lightSource, sampleArtwork]);
  React.useEffect(() => {
    if (mediaKind !== 'video' || !movingUserArt) return undefined;
    const timer = window.setInterval(() => {
      const video = backgroundVideoRef.current;
      if (video?.readyState >= 2) sampleArtwork(video);
    }, 1600);
    return () => window.clearInterval(timer);
  }, [image, mediaKind, movingUserArt, sampleArtwork]);
  const paletteCanvas = 'radial-gradient(ellipse at 12% 15%, rgb(var(--accent) / 0.28), transparent 52%), radial-gradient(ellipse at 88% 80%, rgb(var(--accent-2) / 0.24), transparent 55%), linear-gradient(145deg, rgb(var(--grad-1)), rgb(var(--grad-2)))';
  const canvas = mode === 'light' ? 'linear-gradient(145deg, #e8f1ff, #c7d6e9)' : mode === 'dark' ? 'linear-gradient(145deg, #080e1a, #1c2940)' : sceneArt ? paletteCanvas : mode === 'theme' || mode === 'game' ? customThemeCanvas(theme) || paletteCanvas : paletteCanvas;
  const imageOpacity = mode === 'image' || sceneArt ? (preferences?.backgroundOpacity ?? 65) / 100 : artOpacity * (preferences?.backgroundOpacity ?? 65) / 65;
  const backgroundMoves = animated;
  const waveLevel = Math.max(0, Math.min(4, Number(loungeLevel) || 0)) / 4;
  const waveStrength = Math.max(0, Math.min(100, Number(preferences?.waveStrength ?? 35) || 0));
  const waveOpacity = backgroundMoves && preferences?.ambientMotion === 'waves'
    ? Math.min(1, (waveStrength / 160) * 3 * (0.4 + 0.6 * waveLevel) * (motion === 'subtle' ? 0.7 : 1)) : 0;
  const atmosphereOpacity = Math.max(0, Math.min(100, Number(preferences?.atmosphereOpacity ?? 100))) / 100;
  const lightBloom = Math.max(0, Math.min(100, Number(preferences?.lightBloom ?? 55))) / 100;
  return <div className="lounge-living-backdrop pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true" data-lounge-backdrop-active={backgroundMoves ? 'true' : 'false'} data-lounge-backdrop-motion={preferences?.ambientMotion || 'drift'} data-lounge-user-motion={movingUserArt ? 'true' : 'false'} style={{ ...loungeBackgroundMotionStyle(preferences?.backgroundUrl, preferences?.backgroundZoom, backgroundMotion), '--lounge-atmosphere-opacity': atmosphereOpacity, '--lounge-motion-strength': motionStrength, '--lounge-wave-strength': waveStrength / 100, '--lounge-light-bloom': lightBloom, '--lounge-backdrop-art-opacity': Math.max(0, Math.min(1, imageOpacity)), '--lounge-backdrop-position-x': `${preferences?.backgroundPositionX ?? 50}%`, '--lounge-backdrop-position-y': `${preferences?.backgroundPositionY ?? 50}%`, '--lounge-bright-x': `${brightestArea.x}%`, '--lounge-bright-y': `${brightestArea.y}%`, '--lounge-bright-strength': brightestArea.strength, '--lounge-game-art-opacity': Math.min(0.9, (preferences?.backgroundOpacity ?? 65) / 100), '--lounge-backdrop-halo-opacity': animated ? Math.min(0.75, (0.12 + loungeLevel * 0.055) * (flow / 0.36) * lightBloom) : 0, '--lounge-backdrop-duration': `${duration}s`, '--lounge-wave-opacity': waveOpacity, '--lounge-light-rays': (preferences?.lightRays ?? 65) / 100, '--lounge-highlight-pulse': (preferences?.highlightPulse ?? 55) / 100 }}>
    <div className="lounge-living-backdrop__canvas absolute inset-0" style={{ backgroundImage: canvas }} />
    {image && mode !== 'image' && <div className="lounge-living-backdrop__art absolute inset-0" style={{ backgroundImage: `url(${JSON.stringify(image)})` }} />}
    {mode === 'image' && image && (mediaKind === 'video'
      ? <video ref={backgroundVideoRef} src={image} muted loop playsInline preload="metadata" autoPlay={movingUserArt} onLoadedMetadata={event => sampleArtwork(event.currentTarget)} onLoadedData={event => sampleArtwork(event.currentTarget)} onError={() => { setFailedBackgroundUrl(image); onBackgroundError?.(); }} className="lounge-living-backdrop__user-image lounge-living-backdrop__user-video absolute inset-0 h-full w-full" style={{ objectFit: artFit, objectPosition: `${preferences?.backgroundPositionX ?? 50}% ${preferences?.backgroundPositionY ?? 50}%` }} />
      : <img src={image} alt="" onLoad={event => sampleArtwork(event.currentTarget)} onError={() => { setFailedBackgroundUrl(image); onBackgroundError?.(); }} className="lounge-living-backdrop__user-image absolute inset-0 h-full w-full" style={{ objectFit: artFit, objectPosition: `${preferences?.backgroundPositionX ?? 50}% ${preferences?.backgroundPositionY ?? 50}%` }} />)}
    {mode === 'game' && gameArt && <img src={gameArt} alt="" onLoad={event => setArtRatio(event.currentTarget.naturalWidth / Math.max(1, event.currentTarget.naturalHeight))} onError={() => setFailedGameArt(previous => [...previous, gameArt])} className="lounge-living-backdrop__game absolute inset-0 h-full w-full" style={{ objectFit: artFit, transform: `scale(${(preferences?.backgroundZoom ?? 100) / 100})` }} />}
    {lightSource && loungeBackgroundMediaKind(lightSource) !== 'video' && <img src={lightSource} alt="" className="lounge-living-backdrop__specular absolute inset-0 h-full w-full" style={{ objectFit: artFit, objectPosition: `${preferences?.backgroundPositionX ?? 50}% ${preferences?.backgroundPositionY ?? 50}%`, transform: `scale(${(preferences?.backgroundZoom ?? 100) / 100})` }} />}
    <div className="lounge-living-backdrop__fx absolute inset-0">
      <div className="lounge-living-backdrop__waves absolute inset-0" />
      <div className="lounge-living-backdrop__light absolute inset-0" />
      <div className="lounge-living-backdrop__bloom absolute inset-0" />
      {(sceneArt || mode === 'game' || mode === 'image') && <><div className="lounge-living-backdrop__rays absolute inset-0" data-lounge-scene-art={sceneArt ? preferences?.specialTheme : 'dynamic'} /><div className="lounge-living-backdrop__highlight absolute inset-0" /></>}
    </div>
    <div className="lounge-living-backdrop__shade absolute inset-0" />
  </div>;
}
