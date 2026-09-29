import React from 'react';
import { ArrowUpRight, ChevronLeft, ChevronRight, Play, X } from 'lucide-react';
import { previewMedia, previewStoryParagraphs } from '../preview/preview-information-model.mjs';
import { portraitArtwork } from '../../lib/game-artwork-model.mjs';
import { loungeSessionContext } from './lounge-context.mjs';

export default function LoungeGamePanel({ game, position = 1, total = 1, updateLedger, onPrevious, onNext, onClose, onLaunch }) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [failedArt, setFailedArt] = React.useState('');
  const [enlargedScreenshot, setEnlargedScreenshot] = React.useState('');
  const closeRef = React.useRef(null);
  const bodyRef = React.useRef(null);
  React.useEffect(() => { closeRef.current?.focus(); }, []);
  React.useEffect(() => { setError(''); setEnlargedScreenshot(''); if (bodyRef.current) bodyRef.current.scrollTop = 0; }, [game.id]);
  const media = previewMedia(game);
  const facts = loungeSessionContext(game, updateLedger);
  const story = previewStoryParagraphs(game);
  const wideArt = [game.headerImage, game.capsuleImage, game.background, media[0]].find(value => typeof value === 'string' && value.trim()) || '';
  const heroArt = wideArt || portraitArtwork(game);
  const gallery = media.filter(src => src && src !== heroArt).slice(0, 3);
  const detailFacts = [['Played', facts?.playtime], ['Journey', facts?.journey], ['Last played', facts?.lastPlayed], ['Released', game.releaseDate], ['Metacritic', game.metacritic]].filter(([, value]) => value);
  const launch = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const armed = await window.api?.armGameLaunch?.();
      if (!armed?.ok) { setError(armed?.error || 'Launch needs a direct mouse click or keyboard press.'); return; }
      if (await onLaunch(game, armed.token) !== true) setError('The game did not start. Check the launch target in Library.');
    } catch (failure) { setError(failure?.message || 'The game did not start.'); }
    finally { setBusy(false); }
  };
  return <div role="dialog" aria-modal="true" aria-label={`${game.name || 'Game'} details`} className="lounge-detail-scrim fixed inset-0 z-[9100] flex items-center justify-center bg-black/75 p-3 sm:p-8" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section data-testid="lounge-game-panel" className="lounge-detail-panel relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-[rgb(var(--accent)/0.55)] bg-[rgb(var(--surface))] shadow-[0_30px_100px_rgb(0_0_0/0.58)]">
      <div className="lounge-detail-hero relative flex h-48 shrink-0 items-end overflow-hidden bg-[rgb(var(--panel))] sm:h-72">
        {heroArt && heroArt !== failedArt && <img key={heroArt} src={heroArt} alt="" onError={() => setFailedArt(heroArt)} className={`absolute inset-0 h-full w-full object-cover ${wideArt ? '' : 'lounge-detail-hero--portrait'}`} />}
        <div className="lounge-detail-hero-shade pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative z-10 min-w-0 px-5 pb-5 pr-16 sm:px-8 sm:pb-7"><p className="text-xs font-black uppercase tracking-[0.2em] text-[rgb(var(--accent-2))]">In Lounge · {game.launcher || game.source || 'Library game'}</p><h2 className="mt-2 line-clamp-2 text-3xl font-black leading-tight text-white sm:text-5xl">{game.name || 'Untitled game'}</h2></div>
      </div>
      <button ref={closeRef} type="button" data-controller-close onClick={onClose} aria-label="Close game details" className="absolute right-4 top-4 z-20 rounded-xl border border-white/35 bg-black/65 p-2 text-white focus-visible:outline focus-visible:outline-4 focus-visible:outline-[rgb(var(--accent))]"><X size={22} /></button>
      <div ref={bodyRef} className="lounge-detail-body min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-8 sm:py-7">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">{position} of {total} in this view</p><div className="flex items-center gap-2" role="group" aria-label="Browse game details"><button type="button" disabled={busy || total < 2} onClick={onPrevious} aria-label="Previous game" className="lounge-detail-step inline-flex min-h-11 items-center gap-1 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.65)] px-3 text-sm font-bold text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-[rgb(var(--accent))] disabled:opacity-40"><ChevronLeft size={20} /> Previous</button><button type="button" disabled={busy || total < 2} onClick={onNext} aria-label="Next game" className="lounge-detail-step inline-flex min-h-11 items-center gap-1 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.65)] px-3 text-sm font-bold text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-[rgb(var(--accent))] disabled:opacity-40">Next <ChevronRight size={20} /></button></div></div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-8"><div className="min-w-0">
          {Array.isArray(game.genres) && game.genres.length > 0 && <p className="text-xs font-bold uppercase tracking-[0.16em] text-[rgb(var(--accent-2))]">{game.genres.map(genre => typeof genre === 'string' ? genre : genre?.name).filter(Boolean).join(' · ')}</p>}
          <h3 className="mt-2 text-sm font-black uppercase tracking-[0.18em] text-muted">About this game</h3>
          <p className="mt-3 line-clamp-5 max-w-3xl text-base leading-relaxed">{story[0] || game.description || 'No game description is available yet.'}</p>
          {gallery.length > 0 && <div className="mt-6"><h3 className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-muted">A closer look</h3><div className="lounge-detail-gallery flex gap-3 overflow-x-auto" role="group" aria-label="Game screenshots">{gallery.map((src, index) => <button key={`${src}-${index}`} type="button" aria-label={`${enlargedScreenshot === src ? 'Return' : 'Enlarge'} screenshot ${index + 1} for ${game.name || 'this game'}`} aria-pressed={enlargedScreenshot === src} data-controller-screenshot="true" onClick={() => setEnlargedScreenshot(current => current === src ? '' : src)} className="lounge-detail-shot h-40 w-64 shrink-0 overflow-hidden rounded-xl border border-white/20 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--accent))] sm:h-48 sm:w-80"><img src={src} alt="" aria-hidden="true" className="h-full w-full object-cover" /></button>)}</div></div>}
        </div><aside className="lounge-detail-facts flex flex-wrap content-start gap-2 lg:flex-col" aria-label="Game facts">{detailFacts.map(([label, value]) => <span key={label} className="min-w-[110px] flex-1 rounded-xl border border-[rgb(var(--border)/0.72)] bg-[rgb(var(--panel)/0.62)] px-3 py-2 lg:flex-none"><b className="block text-[10px] uppercase tracking-[0.16em] text-muted">{label}</b><span className="mt-1 block truncate text-sm font-semibold" title={String(value)}>{value}</span></span>)}</aside></div>
        {error && <p role="alert" className="mt-4 rounded-xl border border-rose-300/35 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-200">{error}</p>}
      </div>
      <div className="lounge-detail-actions flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[rgb(var(--border)/0.72)] bg-[rgb(var(--panel)/0.9)] px-5 py-3 sm:px-8"><span className="text-xs text-muted">Use mouse or keyboard to launch. Lounge stays open behind the game.</span><button type="button" data-neolib-launch="true" disabled={busy} onClick={launch} className="lounge-launch-button inline-flex items-center gap-2 rounded-xl bg-[rgb(var(--accent))] px-6 py-2.5 text-base font-black text-[rgb(var(--surface))] disabled:opacity-50"><Play size={19} />{busy ? 'Opening…' : 'Launch game'}<ArrowUpRight size={17} /></button></div>
    </section>
  </div>;
}
