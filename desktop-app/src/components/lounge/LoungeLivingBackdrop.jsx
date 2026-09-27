import React from 'react';
import { customThemeAssetUrl, customThemeCanvas, customThemeManifest, stockThemeAssetUrl, stockThemeFileUrl, stockThemeManifest } from '../../themes/stock-theme-registry.mjs';

export default function LoungeLivingBackdrop({ theme, game, loungeLevel, motion, active, flowOpacity = 0.36, flowSeconds = 18, preferences }) {
  const [failedGameArt, setFailedGameArt] = React.useState('');
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
  const animated = active && flow > 0 && motion !== 'off';
  const mode = preferences?.backdropMode || 'theme';
  const gameArt = [game?.headerImage, game?.background, game?.capsuleImage].find(value => typeof value === 'string' && value.trim()) || '';
  const image = mode === 'image' ? preferences?.backgroundUrl : mode === 'theme' || mode === 'game' ? stillAsset : '';
  const paletteCanvas = 'linear-gradient(145deg, rgb(var(--grad-1)), rgb(var(--grad-2)))';
  const canvas = mode === 'light' ? 'linear-gradient(145deg, #e8f1ff, #c7d6e9)' : mode === 'dark' ? 'linear-gradient(145deg, #080e1a, #1c2940)' : mode === 'theme' || mode === 'game' ? customThemeCanvas(theme) || paletteCanvas : paletteCanvas;
  const imageOpacity = mode === 'image' ? (preferences?.backgroundOpacity ?? 65) / 100 : artOpacity * (preferences?.backgroundOpacity ?? 65) / 65;
  const backgroundMoves = animated && preferences?.ambientMotion !== 'still';
  const waveLevel = Math.max(0, Math.min(4, Number(loungeLevel) || 0)) / 4;
  const waveStrength = Math.max(0, Math.min(100, Number(preferences?.waveStrength ?? 35) || 0));
  const waveOpacity = backgroundMoves && preferences?.ambientMotion === 'waves'
    ? (waveStrength / 160) * (0.4 + 0.6 * waveLevel) * (motion === 'subtle' ? 0.7 : 1) : 0;
  return <div className="lounge-living-backdrop pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true" data-lounge-backdrop-active={backgroundMoves ? 'true' : 'false'} data-lounge-backdrop-motion={preferences?.ambientMotion || 'drift'} style={{ '--lounge-backdrop-art-opacity': Math.max(0, Math.min(1, imageOpacity)), '--lounge-backdrop-position-y': `${preferences?.backgroundPositionY ?? 50}%`, '--lounge-game-art-opacity': Math.min(0.7, (preferences?.backgroundOpacity ?? 65) / 100), '--lounge-backdrop-halo-opacity': animated ? Math.min(0.52, (0.08 + loungeLevel * 0.045) * (flow / 0.36)) : 0, '--lounge-backdrop-duration': `${duration}s`, '--lounge-wave-opacity': waveOpacity }}>
    <div className="lounge-living-backdrop__canvas absolute inset-0" style={{ backgroundImage: canvas }} />
    {image && <div className="lounge-living-backdrop__art absolute inset-0" style={{ backgroundImage: `url(${JSON.stringify(image)})` }} />}
    {mode === 'game' && gameArt && gameArt !== failedGameArt && <img key={gameArt} src={gameArt} alt="" onError={() => setFailedGameArt(gameArt)} className="lounge-living-backdrop__game absolute inset-0 h-full w-full object-cover" />}
    <div className="lounge-living-backdrop__waves absolute inset-0" />
    <div className="lounge-living-backdrop__light absolute inset-0" />
    <div className="lounge-living-backdrop__shade absolute inset-0" />
  </div>;
}
