import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, RefreshCw, Calendar, Award, Building2, Globe, FolderOpen,
  Library, Sparkles, ChevronLeft, ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function GameDetail({ game, onLaunch, onRefetch, onRevealFolder, fetching }) {
  if (!game) return <EmptyState />;
  return (
    <motion.div
      key={game.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="relative flex h-full flex-1 flex-col overflow-y-auto"
    >
      {/* Hero */}
      <Hero game={game} />

      {/* Action bar */}
      <div className="sticky top-0 z-10 -mt-px flex items-center gap-2 border-y hairline glass px-7 py-3">
        <motion.button
          data-testid="detail-launch-btn"
          onClick={() => onLaunch(game)}
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.02 }}
          className="group inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-[13px] font-semibold text-surface shadow-lg shadow-accent/20 transition-all hover:shadow-accent/40"
        >
          <Play size={14} className="transition-transform group-hover:translate-x-0.5" />
          Launch
        </motion.button>
        <button
          data-testid="detail-refetch-btn"
          onClick={() => onRefetch(game)}
          disabled={fetching}
          className="inline-flex items-center gap-2 rounded-full hairline px-4 py-2 text-xs text-muted hover:text-ink hover:border-accent/40 disabled:opacity-50 transition-all"
        >
          <RefreshCw size={13} className={fetching ? 'animate-spin' : ''} />
          {fetching ? 'Fetching…' : 'Re-fetch info'}
        </button>
        <button
          data-testid="detail-reveal-btn"
          onClick={() => onRevealFolder(game)}
          className="inline-flex items-center gap-2 rounded-full hairline px-4 py-2 text-xs text-muted hover:text-ink hover:border-accent/40 transition-all"
        >
          <FolderOpen size={13} />
          Locate
        </button>

        <div className="ml-auto text-[11px] text-muted">
          {game.appid && <>Steam · {game.appid}</>}
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 gap-8 px-7 py-6 lg:grid-cols-[1fr_240px]">
        <div className="space-y-6">
          <Section title="About">
            <p className="whitespace-pre-line text-[13px] leading-relaxed text-muted">
              {game.about || game.shortDescription || 'No description available yet. Press “Re-fetch info” to pull metadata online.'}
            </p>
          </Section>

          {game.screenshots && game.screenshots.length > 0 && (
            <Section title="Screenshots">
              <ScreenshotStrip shots={game.screenshots} />
            </Section>
          )}
        </div>

        <aside className="space-y-4">
          <Stat icon={<Calendar size={13} />} label="Released" value={game.releaseDate || '—'} />
          <Stat icon={<Library size={13} />} label="Genres" value={(game.genres || []).join(', ') || '—'} />
          <Stat icon={<Building2 size={13} />} label="Developer" value={(game.developers || []).join(', ') || '—'} />
          <Stat icon={<Building2 size={13} />} label="Publisher" value={(game.publishers || []).join(', ') || '—'} />
          {typeof game.metacritic === 'number' && (
            <Stat icon={<Award size={13} />} label="Metacritic" value={String(game.metacritic)} />
          )}
          {game.website && (
            <Stat
              icon={<Globe size={13} />}
              label="Website"
              value={
                <button
                  onClick={() => window.api?.openExternal(game.website)}
                  className="text-accent hover:underline"
                >
                  Open ↗
                </button>
              }
            />
          )}
          <Stat icon={<FolderOpen size={13} />} label="Path" value={<code className="break-all text-[11px]">{game.exePath}</code>} />
        </aside>
      </div>
    </motion.div>
  );
}

function Hero({ game }) {
  const bg = game.background || game.headerImage || game.coverUrl;
  return (
    <div className="relative isolate aspect-[16/6] w-full overflow-hidden noise-overlay">
      {bg ? (
        <motion.img
          initial={{ scale: 1.06, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          src={bg}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 grid-bg opacity-50" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-surface/90 via-transparent to-transparent" />

      <div className="absolute bottom-6 left-7 right-7 flex items-end gap-5">
        {game.coverUrl && (
          <motion.img
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            src={game.coverUrl}
            alt=""
            className="h-28 w-20 rounded-md hairline object-cover shadow-2xl"
          />
        )}
        <div className="min-w-0 flex-1">
          <motion.h1
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="font-display text-3xl font-bold tracking-tight"
          >
            {game.name}
          </motion.h1>
          <motion.div
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.12 }}
            className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted"
          >
            {(game.genres || []).slice(0, 4).map((g) => (
              <span key={g} className="rounded-full bg-accent/12 px-2 py-0.5 text-accent">
                {g}
              </span>
            ))}
            {game.releaseDate && <span className="text-muted/80">· {game.releaseDate}</span>}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h3 className="mb-3 text-[10px] uppercase tracking-[0.22em] text-muted">{title}</h3>
      {children}
    </div>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="rounded-lg hairline bg-panel/40 p-3">
      <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted">
        <span className="text-accent">{icon}</span>
        {label}
      </div>
      <div className="text-[12.5px] text-ink">{value}</div>
    </div>
  );
}

function ScreenshotStrip({ shots }) {
  const [idx, setIdx] = React.useState(0);
  return (
    <div>
      <div className="relative overflow-hidden rounded-lg hairline aspect-[16/9] bg-panel/40">
        <AnimatePresence mode="wait">
          <motion.img
            key={shots[idx]}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.32 }}
            src={shots[idx]}
            className="h-full w-full object-cover"
          />
        </AnimatePresence>
        <button
          onClick={() => setIdx((i) => (i - 1 + shots.length) % shots.length)}
          className="absolute left-2 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full glass hairline text-ink hover:bg-accent/20"
        >
          <ChevronLeft size={14} />
        </button>
        <button
          onClick={() => setIdx((i) => (i + 1) % shots.length)}
          className="absolute right-2 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full glass hairline text-ink hover:bg-accent/20"
        >
          <ChevronRight size={14} />
        </button>
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto">
        {shots.map((s, i) => (
          <button
            key={s}
            onClick={() => setIdx(i)}
            className={cn(
              'h-14 w-24 shrink-0 overflow-hidden rounded-md hairline transition-all',
              idx === i ? 'border-accent ring-2 ring-accent/40' : 'opacity-60 hover:opacity-100'
            )}
          >
            <img src={s} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="relative grid h-full flex-1 place-items-center overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="relative z-10 max-w-md text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 220 }}
          className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-accent/15 text-accent"
        >
          <Sparkles size={20} />
        </motion.div>
        <h2 className="font-display text-2xl font-semibold">Your library, your way.</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
          Add your installed games manually, or run the Wizard to scan a folder and auto-import everything we can find.
        </p>
        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-muted">
          Tip: right-click a game to <span className="kbd ml-1">refetch</span> its info.
        </div>
      </div>
    </div>
  );
}
