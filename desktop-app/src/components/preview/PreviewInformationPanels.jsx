import React from 'react';
import { motion } from 'framer-motion';
import { Award, Building2, Calendar, Cloud, Gamepad2, Globe, ImageIcon, Radio, Trophy, UserRound, Users, Wrench } from 'lucide-react';
import { genreDisplayGroups } from '../../lib/genreTaxonomy';
import { PREVIEW_DESCRIPTION_FALLBACK, previewIdentityGroups, previewMedia, previewStoryBlocks } from './preview-information-model.mjs';
import { achievementAvailability, gameCapabilities } from '../../lib/game-capabilities-model.mjs';

/** Source-owned description and identity. Text never flows behind the identity panel. */
export function GameStory({ game, profile }) {
  const story = previewStoryBlocks(game);

  return (
    <section className="overflow-hidden rounded-xl border border-[rgb(var(--border)/0.72)] bg-[linear-gradient(145deg,rgb(var(--panel)/0.27),rgb(var(--surface)/0.11))]" data-testid="game-story-panel">
      <div className="flex items-center justify-between gap-3 border-b border-[rgb(var(--border)/0.55)] px-3.5 py-2.5">
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.28em] text-muted">About this game</h3>
          <p className="mt-0.5 text-[10px] text-muted/70">A closer look at your library entry</p>
        </div>
        {game.releaseDate && <span className="shrink-0 rounded-full border border-[rgb(var(--border)/0.55)] bg-[rgb(var(--surface)/0.24)] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">{game.releaseDate}</span>}
      </div>

      <div className="grid items-start gap-4 px-3.5 py-3.5 sm:grid-cols-[minmax(0,1fr)_190px]">
        <div className="min-w-0 space-y-3">
          {story.length ? story.map((block, index) => block.type === 'heading' ? (
            <h4 key={`${game.id}-story-${index}`} className="pt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[rgb(var(--accent-2))]">{block.text}</h4>
          ) : (
            <p key={`${game.id}-story-${index}`} className="text-[13.5px] leading-7 text-muted [text-wrap:pretty]">{block.text}</p>
          )) : <p className="text-[13px] leading-7 text-muted/80">{PREVIEW_DESCRIPTION_FALLBACK}</p>}
        </div>
        <GenreProfile profile={profile} fallbackGenres={game.genres || []} />
      </div>
    </section>
  );
}

/** Verified artwork from the selected game, with at most eight unique images. */
export function GameMediaGallery({ game }) {
  const media = previewMedia(game);
  const [active, setActive] = React.useState(0);
  React.useEffect(() => setActive(0), [media.join('|')]);
  const current = media[active] || media[0];
  if (!current) return <section className="rounded-xl border border-[rgb(var(--border)/0.72)] bg-[rgb(var(--panel)/0.26)] p-4 text-center text-[11px] text-muted"><ImageIcon className="mx-auto mb-2 text-[rgb(var(--accent))]" size={18} /><b className="block text-ink">No game media yet</b><span className="mt-1 block">Refresh info or add screenshots in Customize.</span></section>;
  return (
    <section className="overflow-hidden rounded-xl border border-[rgb(var(--border)/0.72)] bg-[rgb(var(--panel)/0.24)]" data-testid="game-media-gallery">
      <div className="flex items-center justify-between border-b border-[rgb(var(--border)/0.55)] px-3.5 py-2.5"><div><h3 className="text-[10px] font-bold uppercase tracking-[0.28em] text-muted">Game media</h3><p className="mt-0.5 text-[10px] text-muted/70">{media.length} verified image{media.length === 1 ? '' : 's'}</p></div><span className="rounded-full border border-[rgb(var(--border)/0.55)] px-2 py-1 text-[9px] font-semibold text-muted">{active + 1} / {media.length}</span></div>
      <div className="group relative aspect-[16/10] overflow-hidden bg-[rgb(var(--surface)/0.35)]">
        <motion.img key={current} initial={{ opacity: 0.72, scale: 1.012 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.28 }} src={current} alt={`${game.name} game artwork`} className="h-full w-full object-cover" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgb(var(--surface)/0.30),transparent_36%,rgb(var(--surface)/0.24))]" />
      </div>
      {media.length > 1 && <div className="grid grid-cols-4 gap-1.5 border-t border-[rgb(var(--border)/0.45)] p-2">{media.map((url, index) => <button key={url} type="button" onClick={() => setActive(index)} className={`aspect-[16/10] overflow-hidden rounded-md border transition ${index === active ? 'border-[rgb(var(--accent))] opacity-100 shadow-[0_0_12px_-4px_rgb(var(--accent))]' : 'border-transparent opacity-58 hover:opacity-95'}`} aria-label={`Show image ${index + 1} of ${media.length}`}><img src={url} alt="" className="h-full w-full object-cover" /></button>)}</div>}
    </section>
  );
}

/** Compact factual rows; only the official-site action reaches the native bridge. */
export function DetailList({ game }) {
  const rows = [];
  if (game.developers?.length) rows.push({ icon: <Building2 size={13} />, label: 'Developer', value: game.developers.join(', ') });
  if (game.publishers?.length && game.publishers.join() !== (game.developers || []).join()) rows.push({ icon: <Building2 size={13} />, label: 'Publisher', value: game.publishers.join(', ') });
  if (game.releaseDate) rows.push({ icon: <Calendar size={13} />, label: 'Released', value: game.releaseDate });
  if (game.metacritic) rows.push({ icon: <Award size={13} />, label: 'Metacritic', value: String(game.metacritic) });
  if (game.website) rows.push({ icon: <Globe size={13} />, label: 'Website', value: 'Open official site', action: () => window.api?.openExternal(game.website) });
  if (!rows.length) return null;
  return (
    <section className="mb-5 overflow-hidden rounded-xl border border-[rgb(var(--border)/0.7)] bg-[rgb(var(--surface)/0.16)]" data-testid="game-detail-list">
      <div className="border-b border-[rgb(var(--border)/0.55)] px-3.5 py-2 text-[9px] font-bold uppercase tracking-[0.24em] text-muted">Game details</div>
      <div className="grid grid-cols-1 divide-y divide-[rgb(var(--border)/0.45)] sm:grid-cols-2 sm:divide-y-0 xl:grid-cols-4">
        {rows.map((row) => (
          <div key={row.label} className="grid min-w-0 grid-cols-[18px_minmax(0,1fr)] items-center gap-x-2 border-[rgb(var(--border)/0.45)] px-3.5 py-2.5 text-[11px] sm:border-r sm:last:border-r-0">
            <span className="text-[rgb(var(--accent))]">{row.icon}</span>
            <span className="text-[8.5px] font-bold uppercase tracking-[0.12em] text-muted">{row.label}</span>
            {row.action ? (
              <button onClick={row.action} className="col-start-2 min-w-0 justify-self-start truncate text-[rgb(var(--accent-2))] hover:underline">{row.value} ↗</button>
            ) : <span className="col-start-2 truncate font-semibold text-ink" title={row.value}>{row.value}</span>}
          </div>
        ))}
      </div>
    </section>
  );
}

/** Provider-declared platform/features only. Never inferred from prose or AI copy. */
export function GameCapabilities({ game }) {
  const capabilities = gameCapabilities(game);
  const achievement = achievementAvailability(game);
  if (!capabilities.length && !achievement) return null;
  return (
    <section className="mb-5 overflow-hidden rounded-xl border border-[rgb(var(--border)/0.7)] bg-[rgb(var(--surface)/0.16)]" data-testid="game-capabilities">
      <div className="flex items-center justify-between gap-3 border-b border-[rgb(var(--border)/0.55)] px-3.5 py-2">
        <div><h3 className="text-[9px] font-bold uppercase tracking-[0.24em] text-muted">Capabilities</h3><p className="mt-0.5 text-[9px] text-muted/75">Reported by the selected game source</p></div>
        {achievement && <span className="inline-flex items-center gap-1 rounded-full border border-[rgb(var(--accent)/0.28)] bg-[rgb(var(--accent)/0.08)] px-2 py-1 text-[8.5px] font-bold text-[rgb(var(--accent-2))]" title={`${achievement.source} achievement source`}><Trophy size={10} />{achievement.total == null ? 'Achievements' : `${achievement.total} achievements`}</span>}
      </div>
      <div className="flex flex-wrap gap-2 px-3.5 py-3">
        {capabilities.map((item) => {
          const Icon = CAPABILITY_ICONS[item.id] || Radio;
          return <span key={item.id} title={`${item.label} · ${item.source}${item.detail ? ` · ${item.detail}` : ''}`} className="inline-flex items-center gap-1.5 rounded-lg border border-[rgb(var(--border)/0.62)] bg-[rgb(var(--panel)/0.35)] px-2 py-1.5 text-[10px] font-semibold text-ink"><Icon size={13} className="text-[rgb(var(--accent-2))]" />{item.label}</span>;
        })}
      </div>
      {achievement && achievement.syncState !== 'linked' && <p className="border-t border-[rgb(var(--border)/0.45)] px-3.5 py-2 text-[9px] leading-relaxed text-muted"><Trophy size={10} className="mr-1 inline text-[rgb(var(--accent-2))]" />{achievement.source} confirms achievement support{achievement.total == null ? '' : ` (${achievement.total} available)`}. Earned progress will appear only after the future opt-in {achievement.source} connection—NEO-LIB does not guess it.</p>}
    </section>
  );
}

const CAPABILITY_ICONS = Object.freeze({
  'single-player': UserRound,
  'online-multiplayer': Users,
  'local-multiplayer': Users,
  'co-op': Users,
  pvp: Users,
  'controller-full': Gamepad2,
  'controller-partial': Gamepad2,
  achievements: Trophy,
  'cloud-saves': Cloud,
  workshop: Wrench,
  'remote-play': Radio,
});

function GenreProfile({ profile, fallbackGenres = [] }) {
  const shownGroups = previewIdentityGroups(genreDisplayGroups(profile), fallbackGenres);
  if (!shownGroups.length) return null;
  return (
    <aside className="genre-identity-blob self-start w-full overflow-hidden rounded-xl border border-[rgb(var(--accent)/0.34)] bg-[rgb(var(--surface)/0.36)] shadow-[0_12px_28px_-22px_rgb(var(--accent))]" data-testid="game-genre-profile">
      <div className="border-b border-[rgb(var(--accent)/0.22)] bg-[rgb(var(--accent)/0.11)] px-3 py-2.5">
        <div className="text-[9px] font-black uppercase tracking-[0.2em] text-[rgb(var(--accent))]">Game identity</div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="text-[10px] text-muted">Genres &amp; playstyle</span>
          {profile?.confidence ? <span className="rounded-full border border-[rgb(var(--accent)/0.25)] px-1.5 py-0.5 text-[8px] font-bold text-[rgb(var(--accent-2))]" title={`Direct metadata confidence ${(profile.confidence * 100).toFixed(0)}%`}>{profile.source || 'source'}</span> : null}
        </div>
      </div>
      <div className="divide-y divide-[rgb(var(--border)/0.45)]">
        {shownGroups.map(([label, entries]) => (
          <div key={label} className="px-3 py-2.5">
            <div className="mb-1.5 text-[8.5px] font-bold uppercase tracking-[0.14em] text-muted">{label}</div>
            <div className="flex flex-wrap gap-1">
              {entries.map((entry) => <span key={entry.id} className="rounded-md border border-[rgb(var(--accent)/0.22)] bg-[rgb(var(--accent)/0.08)] px-1.5 py-0.5 text-[9.5px] font-semibold text-ink">{entry.label}</span>)}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
