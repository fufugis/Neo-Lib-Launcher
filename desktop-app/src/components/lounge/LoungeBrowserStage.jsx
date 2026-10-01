import React from 'react';
import { ArrowUpRight, Clock3, Gamepad2, Sparkles, Star, Award } from 'lucide-react';
import LoungeCover from './LoungeCover';
import { loungeSessionContext } from './lounge-context.mjs';

export default function LoungeBrowserStage({ game, index, total, preferences, updateLedger, onOpenDetails }) {
  const [failedArt, setFailedArt] = React.useState([]);
  if (!game) return null;
  const art = [...(Array.isArray(game.screenshots) ? game.screenshots : []), game.headerImage, game.background, game.hero, game.capsuleImage]
    .find(value => typeof value === 'string' && value.trim() && !failedArt.includes(value)) || '';
  const facts = loungeSessionContext(game, updateLedger);
  const description = game.shortDescription || game.description || game.about || 'Your next story is waiting.';
  const isMinimal = preferences.infoDensity === 'minimal';
  const isDetailed = preferences.infoDensity === 'rich';
  const position = Math.max(0, Math.min(100, ((index + 1) / Math.max(1, total)) * 100));
  const personalRating = Number(game.myRating ?? game.rating);
  const detailFacts = !preferences.previewShowFacts ? [] : [
    preferences.previewShowPlaytime && facts?.playtime && { key: 'playtime', icon: <Clock3 size={14} />, text: facts.playtime },
    preferences.previewShowJourney && facts?.journey && { key: 'journey', icon: <Gamepad2 size={14} />, text: facts.journey },
    preferences.previewShowSource && (game.launcher || game.source) && { key: 'source', text: game.launcher || game.source },
    preferences.previewShowRelease && game.releaseDate && { key: 'release', text: `Released ${game.releaseDate}` },
    preferences.previewShowYourRating && personalRating > 0 && { key: 'rating', icon: <Star size={14} />, text: `Your rating ${personalRating.toFixed(1)}/5` },
    preferences.previewShowMetacritic && Number(game.metacritic) > 0 && { key: 'metacritic', icon: <Award size={14} />, text: `Metacritic ${game.metacritic}` },
  ].filter(Boolean);
  const developer = (Array.isArray(game.developers) ? game.developers : []).filter(Boolean).join(', ');
  const publisher = (Array.isArray(game.publishers) ? game.publishers : []).filter(Boolean).join(', ');
  const genres = (Array.isArray(game.genres) ? game.genres : []).map(genre => typeof genre === 'string' ? genre : genre?.name).filter(Boolean).slice(0, 4).join(' · ');
  const installBytes = Number(game.installSizeBytes);
  const installSize = installBytes > 0
    ? installBytes >= 1024 ** 3 ? `${(installBytes / 1024 ** 3).toFixed(installBytes >= 10 * 1024 ** 3 ? 0 : 1)} GB installed`
      : `${Math.max(1, Math.round(installBytes / 1024 ** 2))} MB installed`
    : '';
  const expandedFacts = !preferences.previewShowFacts || !isDetailed ? [] : [
    developer && { key: 'developer', text: `Developer ${developer}` },
    publisher && publisher !== developer && { key: 'publisher', text: `Publisher ${publisher}` },
    genres && { key: 'genres', text: genres },
    installSize && { key: 'install-size', text: installSize },
  ].filter(Boolean);
  const visibleFacts = isMinimal ? [] : isDetailed ? [...detailFacts, ...expandedFacts] : detailFacts.slice(0, 3);
  if (preferences.specialTheme !== 'theme') return <article
    className="lounge-browser-stage lounge-scene-stage relative isolate flex min-h-0 flex-1 items-end overflow-hidden rounded-[28px]"
    data-testid="lounge-selected-stage"
    data-preview-style="scene"
    style={{ '--lounge-preview-height': String(preferences.stageHeight) + 'px' }}
  >
    <div className="lounge-scene-stage__content relative z-10 flex min-w-0 items-center gap-6 border border-white/30 p-5 text-white sm:p-7">
      {preferences.previewShowCover && <div className="lounge-scene-stage__cover hidden shrink-0 overflow-hidden rounded-2xl border-2 border-white/65 shadow-[0_20px_50px_rgb(0_0_0/0.45)] sm:block" aria-hidden="true"><div className="aspect-[2/3]"><LoungeCover game={game} /></div></div>}
      <div key={String(game.id) + '-scene-copy'} className="lounge-stage-copy min-w-0 flex-1">
        {preferences.previewShowIndex && <span className="absolute right-6 top-5 rounded-full border border-white/30 bg-black/30 px-3 py-1 text-xs font-black tracking-wider text-white/85">{String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>}
        <h2 className="lounge-stage-title mt-0 text-3xl font-black leading-tight sm:text-5xl">{game.name || 'Untitled game'}</h2>
        {!isMinimal && preferences.previewShowDescription && <p className={`mt-3 ${isDetailed ? 'line-clamp-3' : 'line-clamp-2'} max-w-3xl text-sm leading-relaxed text-white/90 sm:text-base`}>{description}</p>}
        {visibleFacts.length > 0 && <div className={`mt-4 flex flex-wrap gap-2 text-xs font-semibold ${isDetailed ? 'lounge-stage-facts--detailed' : ''}`}>{visibleFacts.map(fact => <span key={fact.key} className="lounge-stage-fact flex items-center gap-1.5">{preferences.previewShowFactIcons && fact.icon}{fact.text}</span>)}</div>}
        <button type="button" onClick={() => onOpenDetails(game.id)} className="lounge-stage-action mt-5 inline-flex items-center gap-3 rounded-xl border border-white/70 bg-white px-5 py-2.5 text-sm font-black text-black shadow-[0_12px_35px_rgb(0_0_0/0.3)]">Explore game <ArrowUpRight size={18} /></button>
        {preferences.previewShowProgress && <div className="lounge-scene-progress mt-5 h-1 overflow-hidden rounded-full bg-white/20" aria-hidden="true"><span className="block h-full rounded-full bg-[rgb(var(--accent))]" style={{ width: String(position) + '%' }} /></div>}
      </div>
    </div>
  </article>;
  return <article className="lounge-browser-stage relative isolate flex min-h-0 flex-1 items-end overflow-hidden rounded-[28px] border border-[rgb(var(--accent)/0.52)] bg-[rgb(var(--panel))]" data-testid="lounge-selected-stage" data-preview-style={preferences.previewStyle} style={{ '--lounge-preview-height': `${preferences.stageHeight}px`, '--lounge-progress': `${position}%` }}>
    {art && <img src={art} alt="" onError={() => setFailedArt(previous => [...previous, art])} className="lounge-stage-art absolute inset-0 h-full w-full object-cover" />}
    <div className="lounge-stage-shade pointer-events-none absolute inset-0" aria-hidden="true" />
    <div className="lounge-stage-orbit pointer-events-none absolute inset-0" aria-hidden="true" />
    <div className="lounge-stage-sweep pointer-events-none absolute inset-0" aria-hidden="true" />
    {preferences.previewShowIndex && <div className="lounge-stage-count absolute left-7 top-6 z-10 flex items-center gap-2 rounded-full border border-white/30 bg-black/35 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-white"><Sparkles size={13} /> {String(index + 1).padStart(2, '0')} <span className="opacity-50">/</span> {String(total).padStart(2, '0')}</div>}
    <div className="lounge-stage-edition absolute right-7 top-6 z-10 hidden items-center gap-2 rounded-full border border-white/20 bg-black/25 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.15em] text-white/80 sm:flex"><span className="lounge-stage-edition-dot" /> Your collection</div>
    <div key={`${game.id}-copy`} className="lounge-stage-copy relative z-10 w-full max-w-4xl p-7 sm:p-10 lg:p-14">
      <h2 className="lounge-stage-title mt-0 max-w-3xl text-4xl font-black leading-[0.98] sm:text-6xl lg:text-7xl">{game.name || 'Untitled game'}</h2>
      {!isMinimal && preferences.previewShowDescription && <p className={`mt-4 ${isDetailed ? 'line-clamp-3' : 'line-clamp-2'} max-w-xl text-sm leading-relaxed text-white/88 sm:text-base`}>{description}</p>}
      {visibleFacts.length > 0 && <div className={`mt-5 flex flex-wrap gap-2 text-xs font-semibold text-white/90 ${isDetailed ? 'lounge-stage-facts--detailed' : ''}`}>{visibleFacts.map(fact => <span key={fact.key} className="lounge-stage-fact flex items-center gap-1.5">{preferences.previewShowFactIcons && fact.icon}{fact.text}</span>)}</div>}
      <button type="button" onClick={() => onOpenDetails(game.id)} className="lounge-stage-action mt-6 inline-flex items-center gap-3 rounded-2xl border border-white/60 bg-white/90 px-6 py-3 text-base font-black text-black shadow-[0_12px_35px_rgb(0_0_0/0.3)]"><span>Explore game</span><ArrowUpRight size={20} /></button>
    </div>
    {preferences.previewShowCover && preferences.previewStyle !== 'clean' && <div key={`${game.id}-portrait`} className="lounge-stage-portrait pointer-events-none absolute bottom-10 right-[6%] w-[clamp(140px,15vw,240px)] rotate-[6deg] overflow-hidden rounded-2xl border-2 border-white/50 shadow-[0_25px_70px_rgb(0_0_0/0.52)]" aria-hidden="true"><div className="aspect-[2/3]"><LoungeCover game={game} /></div></div>}
    {preferences.previewShowProgress && <div className="lounge-stage-progress pointer-events-none absolute inset-x-0 bottom-0 z-20 h-1 bg-white/15" aria-hidden="true"><span /></div>}
  </article>;
}
