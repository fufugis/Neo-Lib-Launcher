import React from 'react';
import { requestSteamArtwork, steamArtworkId } from '../lib/steam-artwork-cache.mjs';
export function useSteamArtwork(game, enabled = true) {
  const id = steamArtworkId(game);
  const [result, setResult] = React.useState(null);
  const api = typeof window !== 'undefined' ? window.api : null;
  React.useEffect(() => {
    if (!enabled || !id) return;
    let active = true;
    requestSteamArtwork(api, id).then(value => { if (active) setResult(value); });
    return () => { active = false; };
  }, [api, id, enabled]);
  return result && String(result.appid) === id ? { ...game, steamArtwork: result } : game;
}
