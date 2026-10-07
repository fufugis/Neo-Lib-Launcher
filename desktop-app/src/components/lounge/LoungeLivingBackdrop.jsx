import React from 'react';
import { loungeBackgroundDisplayUrl } from './lounge-background-url.mjs';
import LoungeArtworkPixels from './LoungeArtworkPixels';
import LoungeAtmosphereLayer from './LoungeAtmosphereLayer';
import { loungeAmbientLightOpacity, loungeEffectPreferences } from './lounge-effect-model.mjs';
import { customThemeAssetUrl, customThemeCanvas, customThemeManifest, stockThemeAssetUrl, stockThemeFileUrl, stockThemeManifest } from '../../themes/stock-theme-registry.mjs';
import { loungeSceneArt } from './lounge-scene-art.mjs';
import { preparedArtworkLighting, sampleArtworkLighting, projectArtworkPoint } from './lounge-light-analysis.mjs';
import { loungeBackgroundMediaKind, loungeBackgroundMotionStyle } from './lounge-layout-model.mjs';

const lightAnalysisCache = new Map();
const LoungeLivingBackdrop = React.memo(function LoungeLivingBackdrop({ theme, game, loungeLevel, motion, active, flowOpacity = 0.36, flowSeconds = 18, preferences: savedPreferences, onBackgroundError }) {
  const preferences = React.useMemo(() => loungeEffectPreferences(savedPreferences, loungeLevel), [savedPreferences, loungeLevel]);
  const chromaticFilterId = `lounge-chromatic-${React.useId().replace(/[^a-z0-9_-]/gi, '')}`;
  const [failedGameArt, setFailedGameArt] = React.useState([]);
  const [failedBackgroundUrl, setFailedBackgroundUrl] = React.useState('');
  const [artRatio, setArtRatio] = React.useState(16 / 9);
  const [brightestArea, setBrightestArea] = React.useState({ x: 72, y: 18, strength: 0.35 });
  const [sampledLightSource, setSampledLightSource] = React.useState('');
  const currentLightSource = React.useRef('');
  const [viewport, setViewport] = React.useState(() => ({ width: window.innerWidth, height: window.innerHeight }));
  const backdropRef = React.useRef(null);
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
    const node = backdropRef.current;
    if (!node) return undefined;
    const measure = () => {
      const { width, height } = node.getBoundingClientRect();
      if (width > 0 && height > 0) setViewport(previous => previous.width === width && previous.height === height ? previous : { width, height });
    };
    measure();
    const observer = typeof window.ResizeObserver === 'function' ? new window.ResizeObserver(measure) : null;
    observer?.observe(node);
    window.addEventListener('resize', measure);
    return () => { observer?.disconnect(); window.removeEventListener('resize', measure); };
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
  const displayImage = mode === 'image' ? loungeBackgroundDisplayUrl(image) : image;
  const backgroundMotion = Math.max(0, Math.min(100, Number(preferences?.backgroundMotion ?? 55)));
  const movingUserArt = mode === 'image' && animated && backgroundMotion > 0;
  const lightSource = mode === 'game' ? gameArt || image : mode === 'image' ? image : mode === 'theme' ? image : '';
  currentLightSource.current = lightSource;
  const sampleArtwork = React.useCallback(async (source) => {
    // Metadata dimensions can arrive before a video has any drawable pixels.
    if (source && 'videoWidth' in source && source.readyState < 2) return;
    const width = source?.naturalWidth || source?.videoWidth || 0;
    const height = source?.naturalHeight || source?.videoHeight || 0;
    if (!width || !height) return;
    const cached = lightAnalysisCache.get(lightSource);
    if (cached) { setArtRatio(cached.ratio); setBrightestArea(cached.area); setSampledLightSource(lightSource); return; }
    const ratio = width / height;
    setArtRatio(ratio);
    let area = { x: 72, y: 18, strength: 0 };
    try {
      const profile = mode === 'image' ? await preparedArtworkLighting(lightSource, source) : sampleArtworkLighting(source);
      area = profile.area;
    } catch { /* Cross-origin media uses a stable neutral light anchor. */ }
    if (lightAnalysisCache.size >= 64) lightAnalysisCache.delete(lightAnalysisCache.keys().next().value);
    lightAnalysisCache.set(lightSource, { ratio, area });
    if (currentLightSource.current !== lightSource) return;
    setBrightestArea(area); setSampledLightSource(lightSource);
  }, [lightSource, mode]);
  React.useEffect(() => { setFailedBackgroundUrl(''); }, [preferences?.backgroundUrl]);
  React.useEffect(() => {
    const video = backgroundVideoRef.current;
    if (!video) return;
    if (!movingUserArt) { video.pause(); return; }
    video.play().catch(() => {});
  }, [image, movingUserArt]);
  React.useEffect(() => {
    if (!lightSource || (mode === 'game' && gameArt) || mode === 'image') return undefined;
    if (loungeBackgroundMediaKind(lightSource) === 'video') {
      if (backgroundVideoRef.current) sampleArtwork(backgroundVideoRef.current);
      return undefined;
    }
    const cached = lightAnalysisCache.get(lightSource);
    if (cached) { setArtRatio(cached.ratio); setBrightestArea(cached.area); setSampledLightSource(lightSource); return undefined; }
    let cancelled = false;
    const probe = new Image();
    probe.onload = () => { if (!cancelled) sampleArtwork(probe); };
    probe.onerror = () => { if (!cancelled) { setBrightestArea({ x: 72, y: 18, strength: 0 }); setSampledLightSource(lightSource); } };
    probe.src = lightSource;
    return () => { cancelled = true; probe.onload = null; probe.onerror = null; };
  }, [lightSource, mode, gameArt, sampleArtwork]);
  // Lighting is sampled once per source, never on an animation/video timer.
  const paletteCanvas = 'radial-gradient(ellipse at 12% 15%, rgb(var(--accent) / 0.28), transparent 52%), radial-gradient(ellipse at 88% 80%, rgb(var(--accent-2) / 0.24), transparent 55%), linear-gradient(145deg, rgb(var(--grad-1)), rgb(var(--grad-2)))';
  const canvas = mode === 'light' ? 'linear-gradient(145deg, #e8f1ff, #c7d6e9)' : mode === 'dark' ? 'linear-gradient(145deg, #080e1a, #1c2940)' : sceneArt ? paletteCanvas : mode === 'theme' || mode === 'game' ? customThemeCanvas(theme) || paletteCanvas : paletteCanvas;
  const imageOpacity = mode === 'image' || sceneArt ? (preferences?.backgroundOpacity ?? 65) / 100 : artOpacity * (preferences?.backgroundOpacity ?? 65) / 65;
  const backgroundMoves = animated;
  const waveLevel = Math.max(0, Math.min(4, Number(loungeLevel) || 0)) / 4;
  const waveStrength = Math.max(0, Math.min(300, Number(preferences?.waveStrength ?? 35) || 0));
  const waveGain = waveStrength / 100;
  const waveOpacity = backgroundMoves && preferences?.ambientMotion === 'waves'
    ? Math.min(1, waveGain * (0.95 + 0.65 * waveLevel) * (motion === 'subtle' ? 0.7 : 1)) : 0;
  const atmosphereOpacity = Math.max(0, Math.min(100, Number(preferences?.atmosphereOpacity ?? 100))) / 100;
  const lightBloom = Math.max(0, Math.min(600, Number(preferences?.lightBloom ?? 55))) / 100;
  // Ambient illumination is its own effect: bloom never gates its strength.
  const ambientLightOpacity = loungeAmbientLightOpacity(preferences.ambientLight, loungeLevel, flow, animated);
  const bloomSpread = Math.max(40, Math.min(220, Number(preferences?.bloomSpread ?? 100)));
  const raySoftness = Math.max(0, Math.min(100, Number(preferences?.raySoftness ?? 45)));
  const lightShimmer = Math.max(0, Math.min(100, Number(preferences?.lightShimmer ?? 55)));
  const waveDrift = Math.max(0, Math.min(200, Number(preferences?.waveDrift ?? 100))) / 100;
  const sceneDrift = Math.max(0, Math.min(200, Number(preferences?.sceneDrift ?? 100))) / 100;
  const backgroundZoom = Math.max(50, Math.min(200, Number(preferences?.backgroundZoom ?? 100))) / 100;
  const artSaturation = Math.max(50, Math.min(200, Number(preferences?.artSaturation ?? 100))) / 100;
  const artContrast = Math.max(70, Math.min(150, Number(preferences?.artContrast ?? 100))) / 100;
  const artTemperature = Math.max(-100, Math.min(100, Number(preferences?.artTemperature ?? 0)));
  const filmGrain = Math.max(0, Math.min(100, Number(preferences?.filmGrain ?? 0)));
  const chromaticAberration = Math.max(0, Math.min(100, Number(preferences?.chromaticAberration ?? 0)));
  const chromaticOffset = Number((chromaticAberration * 0.08).toFixed(2));
  const ribbonIntensity = Math.max(0, Math.min(100, Number(preferences?.ribbonIntensity ?? 0))) / 100;
  const ribbonSpeed = Math.max(20, Math.min(200, Number(preferences?.ribbonSpeed ?? 100)));
  const ribbonPosition = Math.max(0, Math.min(100, Number(preferences?.ribbonPosition ?? 35)));
  const edgeGlow = Math.max(0, Math.min(100, Number(preferences?.edgeGlow ?? 0))) / 100;
  const edgeWidth = Math.max(20, Math.min(180, Number(preferences?.edgeWidth ?? 80)));
  const edgePulse = Math.max(0, Math.min(100, Number(preferences?.edgePulse ?? 50))) / 100;
  const shimmerDuration = Math.max(0.28, 1.35 - lightShimmer / 100) * duration;
  const artworkFit = mode === 'theme' ? 'cover' : artFit;
  const renderedBrightestArea = projectArtworkPoint(sampledLightSource === lightSource ? brightestArea : { x: 50, y: 50, strength: 0 }, artRatio, screenRatio, artworkFit, preferences?.backgroundPositionX ?? 50, preferences?.backgroundPositionY ?? 50, preferences?.backgroundZoom ?? 100);
return <div ref={backdropRef} className="lounge-living-backdrop pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true" data-lounge-backdrop-active={backgroundMoves ? 'true' : 'false'} data-lounge-backdrop-motion={preferences?.ambientMotion || 'drift'} data-lounge-user-motion={movingUserArt ? 'true' : 'false'} data-lounge-edge-pulse={animated && edgePulse > 0 ? 'true' : 'false'} style={{ ...loungeBackgroundMotionStyle(preferences?.backgroundUrl, preferences?.backgroundZoom, backgroundMotion), '--lounge-art-zoom-drift': String(backgroundZoom * (1 + 0.06 * sceneDrift)), '--lounge-art-zoom-near': String(backgroundZoom * (1 + 0.035 * sceneDrift)), '--lounge-art-zoom-far': String(backgroundZoom * (1 + 0.06 * sceneDrift)), '--lounge-scene-drift': sceneDrift, '--lounge-art-saturation': artSaturation, '--lounge-art-contrast': artContrast, '--lounge-chromatic-filter': chromaticAberration > 0 ? `url("#${chromaticFilterId}")` : 'brightness(1)', '--lounge-film-grain-opacity': filmGrain * 0.0055, '--lounge-temperature-color': artTemperature < 0 ? `rgb(80 155 255 / ${Math.abs(artTemperature) / 250})` : `rgb(255 169 86 / ${artTemperature / 250})`, '--lounge-ribbon-opacity': ribbonIntensity, '--lounge-ribbon-duration': `${duration * 100 / ribbonSpeed}s`, '--lounge-ribbon-y': `${ribbonPosition}%`, '--lounge-edge-opacity': edgeGlow, '--lounge-edge-width': `${edgeWidth}px`, '--lounge-edge-pulse': edgePulse, '--lounge-atmosphere-opacity': atmosphereOpacity, '--lounge-motion-strength': motionStrength, '--lounge-wave-strength': waveStrength / 100, '--lounge-wave-drift': waveDrift, '--lounge-light-bloom': lightBloom, '--lounge-bloom-spread': `${bloomSpread}%`, '--lounge-ray-blur': `${0.5 + raySoftness * 0.04}px`, '--lounge-shimmer-duration': `${shimmerDuration}s`, '--lounge-backdrop-art-opacity': Math.max(0, Math.min(1, imageOpacity)), '--lounge-backdrop-position-x': `${preferences?.backgroundPositionX ?? 50}%`, '--lounge-backdrop-position-y': `${preferences?.backgroundPositionY ?? 50}%`, '--lounge-bright-x': `${renderedBrightestArea.x}%`, '--lounge-bright-y': `${renderedBrightestArea.y}%`, '--lounge-bright-strength': renderedBrightestArea.strength, '--lounge-highlight-color': (renderedBrightestArea.color || [255, 255, 255]).join(' '), '--lounge-game-art-opacity': Math.min(0.9, (preferences?.backgroundOpacity ?? 65) / 100), '--lounge-backdrop-halo-opacity': ambientLightOpacity, '--lounge-backdrop-duration': `${duration}s`, '--lounge-wave-opacity': waveOpacity, '--lounge-light-rays': Math.max(0, Math.min(300, Number(preferences?.lightRays ?? 65))) / 100, '--lounge-highlight-pulse': (preferences?.highlightPulse ?? 55) / 100 }}>
    {chromaticAberration > 0 && <svg width="0" height="0" focusable="false" className="absolute" aria-hidden="true"><defs><filter id={chromaticFilterId} x="-2%" y="-2%" width="104%" height="104%" colorInterpolationFilters="sRGB"><feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red" /><feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="green" /><feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue" /><feOffset in="red" dx={chromaticOffset} result="redShift" /><feOffset in="blue" dx={-chromaticOffset} result="blueShift" /><feBlend in="green" in2="redShift" mode="screen" result="greenRed" /><feBlend in="greenRed" in2="blueShift" mode="screen" /></filter></defs></svg>}
    <div className="lounge-living-backdrop__canvas absolute inset-0" style={{ backgroundImage: canvas }} />
    {image && mode !== 'image' && <div className="lounge-living-backdrop__art absolute inset-0"><LoungeArtworkPixels src={image} chromaticOffset={chromaticOffset} positionX={preferences?.backgroundPositionX ?? 50} positionY={preferences?.backgroundPositionY ?? 50} saturation={artSaturation} contrast={artContrast} /></div>}
    {mode === 'image' && image && <div className="lounge-living-backdrop__user-image absolute inset-0">{(mediaKind === 'video'
      ? <video ref={backgroundVideoRef} crossOrigin="anonymous" src={displayImage} muted loop playsInline preload="metadata" autoPlay={movingUserArt} onLoadedMetadata={event => sampleArtwork(event.currentTarget)} onLoadedData={event => sampleArtwork(event.currentTarget)} onError={() => { setFailedBackgroundUrl(image); onBackgroundError?.(); }} className="lounge-art-pixels lounge-living-backdrop__user-video absolute inset-0 h-full w-full" style={{ objectFit: artFit, objectPosition: `${preferences?.backgroundPositionX ?? 50}% ${preferences?.backgroundPositionY ?? 50}%` }} />
      : <img crossOrigin="anonymous" src={displayImage} alt="" onLoad={event => sampleArtwork(event.currentTarget)} onError={() => { setFailedBackgroundUrl(image); onBackgroundError?.(); }} className="lounge-art-pixels absolute inset-0 h-full w-full" style={{ objectFit: artFit, objectPosition: `${preferences?.backgroundPositionX ?? 50}% ${preferences?.backgroundPositionY ?? 50}%` }} />)}</div>}
    {mode === 'game' && gameArt && <div className="lounge-living-backdrop__game absolute inset-0"><img src={gameArt} alt="" onLoad={event => sampleArtwork(event.currentTarget)} onError={() => setFailedGameArt(previous => [...previous, gameArt])} className="lounge-art-pixels absolute inset-0 h-full w-full" style={{ objectFit: artFit, objectPosition: `${preferences?.backgroundPositionX ?? 50}% ${preferences?.backgroundPositionY ?? 50}%` }} /></div>}
    {artTemperature !== 0 && <div className="lounge-living-backdrop__color-grade absolute inset-0" />}
    {/* Shade grades scenery only, not the atmosphere painted above it. */}
    <div className="lounge-living-backdrop__shade absolute inset-0" />
      <div className="lounge-living-backdrop__fx absolute inset-0">
      {lightSource && <div className="lounge-living-backdrop__specular absolute" />}
      <LoungeAtmosphereLayer preferences={preferences} animated={animated} sun={renderedBrightestArea} project={point => projectArtworkPoint(point, artRatio, screenRatio, artworkFit, preferences?.backgroundPositionX ?? 50, preferences?.backgroundPositionY ?? 50, preferences?.backgroundZoom ?? 100)} />
      <div className="lounge-living-backdrop__waves absolute" />
      {ribbonIntensity > 0 && <div className="lounge-living-backdrop__ribbons absolute inset-0" />}
      {preferences.ambientLight > 0 && <div className="lounge-living-backdrop__light absolute inset-0" style={{ opacity: ambientLightOpacity }} />}
      <div className="lounge-living-backdrop__bloom absolute inset-0" />
      {(sceneArt || mode === 'game' || mode === 'image') && <div className="lounge-living-backdrop__rays absolute inset-0" data-lounge-scene-art={sceneArt ? preferences?.specialTheme : 'dynamic'} />}
      {lightSource && <div className="lounge-living-backdrop__highlight absolute inset-0" />}
    </div>
    {filmGrain > 0 && <div className="lounge-living-backdrop__grain absolute inset-0" />}
    {edgeGlow > 0 && <div className="lounge-living-backdrop__edge absolute inset-0" />}
  </div>;
});

export default LoungeLivingBackdrop;
