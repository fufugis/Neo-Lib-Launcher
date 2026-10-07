import React from 'react';
import { hasPortraitDimensions } from '../lib/game-artwork-model.mjs';
import { loadWorkshopAssets, searchWorkshopTitles, workshopArtworkAssets } from '../lib/workshop-artwork.mjs';

const sources = [['steam', 'Steam · no key'], ['gog', 'GOG · no key'], ['google', 'Web title search'], ['steamgriddb', 'SteamGridDB'], ['existing', 'Existing game images']];
export default function WorkshopArtworkGallery({state, setState, apiKey, game, onUse}) {
  const [source, setSource] = React.useState('steam');
  const [loaded, setLoaded] = React.useState(new Map());
  const request = React.useRef(0);
  const galleryRef = React.useRef(null);
  React.useEffect(() => { galleryRef.current?.scrollIntoView({block: 'start', behavior: 'smooth'}); }, []);
  React.useEffect(() => () => { request.current++; }, []);
  const update = patch => setState(current => ({...current, ...patch}));
  const reset = next => {
    request.current++; setSource(next); setLoaded(new Map());
    update({games: [], assets: [], selectedGame: null, busy: false, error: ''});
    if (next === 'existing') update({assets: workshopArtworkAssets(game, state.slot), selectedGame: {name: game.name}});
  };
  const search = async () => {
    const run = ++request.current;
    setLoaded(new Map()); update({busy: true, error: '', games: [], assets: [], selectedGame: null});
    try {
      const games = await searchWorkshopTitles(window.api, source, state.query, apiKey);
      if (run === request.current) update({games, busy: false, error: games.length ? '' : 'No titles found here. Try another source or edit the search title.'});
    } catch (error) { if (run === request.current) update({busy: false, error: error.message}); }
  };
  const choose = async title => {
    const run = ++request.current;
    setLoaded(new Map()); update({busy: true, error: '', selectedGame: title, assets: []});
    try {
      const assets = await loadWorkshopAssets(window.api, source, title, state.slot, apiKey);
      if (run === request.current) update({assets, busy: false, error: assets.length ? '' : 'This source has no artwork for this role. Try another source, file or direct image URL.'});
    } catch (error) { if (run === request.current) update({busy: false, error: error.message}); }
  };
  const external = engine => {
    const role = {cover: 'portrait game cover', hero: 'game wallpaper', background: 'game wallpaper', logo: 'game transparent logo', icon: 'game icon'}[state.slot];
    const query = encodeURIComponent(`${state.query} ${role}`);
    window.api?.openExternal?.(engine === 'google' ? `https://www.google.com/search?tbm=isch&q=${query}` : `https://www.bing.com/images/search?q=${query}`);
  };
  return <section ref={galleryRef} className="rounded-xl hairline bg-panel/30 p-4 space-y-3" aria-label="Artwork source gallery">
    <div className="flex items-center justify-between"><h3 className="text-xs font-bold text-ink">Find {state.slot} artwork</h3><button type="button" onClick={() => {request.current++; update({open: false});}} className="text-xs text-muted">Close gallery</button></div>
    <p className="text-xs text-muted">Choose a source, confirm the title, then preview an image. Use this only updates the edit form; Save game applies it.</p>
    <div className="flex flex-wrap gap-2">{[...sources, ['screenscraper', 'ScreenScraper · saved connection'], ['romm', 'RomM · saved connection']].map(([id, name]) => <button type="button" key={id} onClick={() => reset(id)} aria-pressed={source === id} className={`rounded-md hairline px-3 py-2 text-xs ${source === id ? 'bg-[rgb(var(--accent)/0.2)] text-ink' : 'text-muted'}`}>{name}</button>)}</div>
    {source !== 'existing' && <div className="flex gap-2"><input aria-label="Artwork search title" value={state.query} onChange={event => {request.current++; update({query: event.target.value, busy: false});}} onKeyDown={event => {if(event.key === 'Enter') {event.preventDefault(); search();}}} className="min-w-0 flex-1 rounded-md hairline bg-panel/60 px-3 py-2 text-xs text-ink" /><button type="button" onClick={search} disabled={state.busy || !state.query.trim()} className="rounded-md hairline px-3 text-xs text-ink disabled:opacity-40">{state.busy ? 'Searching…' : 'Search titles'}</button></div>}
    <div className="flex flex-wrap gap-2"><button type="button" onClick={() => external('google')} className="rounded-md hairline px-3 py-2 text-xs text-ink">Google Images</button><button type="button" onClick={() => external('bing')} className="rounded-md hairline px-3 py-2 text-xs text-ink">Bing Images</button><span className="text-xs text-muted self-center">Paste a chosen image’s direct URL in the artwork slot above, or use File.</span></div>
    {state.error && <p role="alert" className="text-xs text-amber-200">{state.error}</p>}
    {!state.selectedGame && <div className="grid gap-2 sm:grid-cols-2">{state.games.map(title => <button type="button" key={`${title.source || source}-${title.id}`} onClick={() => choose(title)} className="rounded-lg hairline p-3 text-left text-xs text-ink"><b>{title.name}</b><span className="block text-muted">{title.source || source} · choose this title</span></button>)}</div>}
    {state.selectedGame && <div className="flex justify-between text-xs text-muted"><span>{state.selectedGame.name}</span>{source !== 'existing' && <button type="button" onClick={() => {request.current++; update({selectedGame: null, assets: [], busy: false});}}>Choose another title</button>}</div>}
    <div className="grid max-h-96 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">{state.assets.map(asset => <article key={asset.id} className="rounded-lg hairline p-2 space-y-2">
      <img src={asset.url} alt={`${state.selectedGame?.name || ''} ${state.slot} candidate`} className="h-40 w-full bg-black/20 object-contain" onLoad={event => {const image = event.currentTarget; const ratio = image.naturalWidth / image.naturalHeight; const originalBox = ['screenscraper', 'romm'].includes(source) && asset.verifiedBoxArt === true && image.naturalWidth >= 64 && image.naturalHeight >= 64 && ratio >= 0.4 && ratio <= 2.2; const valid = state.slot !== 'cover' || hasPortraitDimensions(image.naturalWidth, image.naturalHeight) || originalBox; setLoaded(old => new Map(old).set(asset.id, {valid, width: image.naturalWidth, height: image.naturalHeight}));}} onError={() => setLoaded(old => new Map(old).set(asset.id, {valid: false}))} />
      <p className="text-[10px] text-muted">{asset.author}{loaded.get(asset.id)?.valid ? ` · ${loaded.get(asset.id).width}×${loaded.get(asset.id).height}` : loaded.has(asset.id) ? ' · unavailable or wrong shape' : ' · checking image…'}{asset.nsfw ? ' · NSFW' : ''}{asset.humor ? ' · Humor' : ''}</p>
      <button type="button" disabled={!loaded.get(asset.id)?.valid} onClick={() => onUse({...asset, ...loaded.get(asset.id)})} className="w-full rounded-md bg-[rgb(var(--accent)/0.18)] px-2 py-2 text-xs text-ink disabled:opacity-40">Use this {state.slot}</button>
    </article>)}</div>
  </section>;
}
