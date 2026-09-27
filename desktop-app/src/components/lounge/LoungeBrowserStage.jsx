import React from 'react';
import { ArrowUpRight, Clock3, Gamepad2, Sparkles } from 'lucide-react';
import { portraitArtwork } from '../../lib/game-artwork-model.mjs';
import LoungeCover from './LoungeCover';
import { loungeSessionContext } from './lounge-context.mjs';

export default function LoungeBrowserStage({ game, index, total, preferences, updateLedger, onOpenDetails }) {
  const [failedArt, setFailedArt] = React.useState('');
  if (!game) return null;
  const wideArt = [game.headerImage, game.capsuleImage, game.background].find(value => typeof value === 'string' && value.trim()) || '';
  const art = wideArt || game.coverUrl || game.cover || portraitArtwork(game);
  const visibleArt = art && art !== failedArt;
  const facts = loungeSessionContext(game, updateLedger);
  const description = game.shortDescription || game.description || game.about || 'Your next story is waiting.';
  const isMinimal = preferences.infoDensity === 'minimal';
  const isRich = preferences.infoDensity === 'rich';
  const position = Math.max(0, Math.min(100, ((index + 1) / Math.max(1, total)) * 100));
  return <article className="lounge-browser-stage relative isolate flex min-h-0 flex-1 items-end overflow-hidden rounded-[28px] border border-[rgb(var(--accent)/0.52)] bg-[rgb(var(--panel))]" data-testid="lounge-selected-stage" data-preview-style={preferences.previewStyle} style={{ minHeight: `${preferences.stageHeight}px`, '--lounge-progress': `${position}%` }}>
    {visibleArt && <img key={art} src={art} alt="" onError={() => setFailedArt(art)} className={`lounge-stage-art absolute inset-0 h-full w-full object-cover ${wideArt ? '' : 'lounge-stage-art--fallback'}`} />}
    <div className="lounge-stage-shade pointer-events-none absolute inset-0" aria-hidden="true" />
    <div className="lounge-stage-orbit pointer-events-none absolute inset-0" aria-hidden="true" />
    <div className="lounge-stage-sweep pointer-events-none absolute inset-0" aria-hidden="true" />
    <div className="lounge-stage-count absolute left-7 top-6 z-10 flex items-center gap-2 rounded-full border border-white/30 bg-black/35 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-white backdrop-blur-xl"><Sparkles size={13} /> {String(index + 1).padStart(2, '0')} <span className="opacity-50">/</span> {String(total).padStart(2, '0')}</div>
    <div className="lounge-stage-edition absolute right-7 top-6 z-10 hidden items-center gap-2 rounded-full border border-white/20 bg-black/25 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.15em] text-white/80 backdrop-blur-xl sm:flex"><span className="lounge-stage-edition-dot" /> Your collection</div>
    <div key={`${game.id}-copy`} className="lounge-stage-copy relative z-10 w-full max-w-4xl p-7 sm:p-10 lg:p-14">
      <p className="lounge-stage-kicker flex items-center gap-2 text-xs font-black uppercase tracking-[0.3em] text-[rgb(var(--accent-2))]"><span className="h-1.5 w-7 rounded-full bg-[rgb(var(--accent))] shadow-[0_0_14px_rgb(var(--accent))]" /> Now in focus</p>
      <h2 className="lounge-stage-title mt-4 max-w-3xl text-4xl font-black leading-[0.98] sm:text-6xl lg:text-7xl">{game.name || 'Untitled game'}</h2>
      {!isMinimal && <p className="mt-4 line-clamp-2 max-w-xl text-sm leading-relaxed text-white/88 sm:text-base">{description}</p>}
      {!isMinimal && <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-white/90"><span className="lounge-stage-fact flex items-center gap-1.5"><Clock3 size={13} /> {facts?.playtime}</span><span className="lounge-stage-fact flex items-center gap-1.5"><Gamepad2 size={13} /> {facts?.journey}</span>{isRich && <><span className="lounge-stage-fact">{game.launcher || game.source || 'Library game'}</span>{game.releaseDate && <span className="lounge-stage-fact">Released {game.releaseDate}</span>}</>}</div>}
      <button type="button" onClick={() => onOpenDetails(game.id)} className="lounge-stage-action mt-6 inline-flex items-center gap-3 rounded-2xl border border-white/60 bg-white/90 px-6 py-3 text-base font-black text-black shadow-[0_12px_35px_rgb(0_0_0/0.3)]"><span>Explore game</span><ArrowUpRight size={20} /></button>
    </div>
    {preferences.previewStyle !== 'clean' && <div key={`${game.id}-portrait`} className="lounge-stage-portrait pointer-events-none absolute bottom-10 right-[6%] w-[clamp(140px,15vw,240px)] rotate-[6deg] overflow-hidden rounded-2xl border-2 border-white/50 shadow-[0_25px_70px_rgb(0_0_0/0.52)]" aria-hidden="true"><div className="aspect-[2/3]"><LoungeCover game={game} /></div></div>}
    <div className="lounge-stage-progress pointer-events-none absolute inset-x-0 bottom-0 z-20 h-1 bg-white/15" aria-hidden="true"><span /></div>
  </article>;
}
