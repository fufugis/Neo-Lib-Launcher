import React from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import {
  Search, Sparkles, X, ChevronLeft, ChevronRight, GripVertical, Check,
  Loader2, Globe, Bot,
} from 'lucide-react';
import { cn } from '../lib/utils';

const isElectron = typeof window !== 'undefined' && !!window.api;

/**
 * FetchSourcePicker — unified, multi-source metadata picker.
 *
 * Replaces the "auto cycle through sources" black-box with an explicit UI:
 *   - Editable query (auto-seeded from the game's exe/folder names)
 *   - Big "Auto fetch" button (uses the legacy aggregated search)
 *   - One button per source (Steam, GOG, itch, DLsite, VNDB, Ryuugames,
 *     F95Zone, Google, Ask AI). Each loads its own candidate list.
 *   - Carousel of candidates with left/right arrows, showing 1/N counter
 *   - "Use this one" picks the highlighted candidate and returns it via
 *     `onPick(metadata)` after expanding to full details.
 *
 * Props:
 *   - open: boolean
 *   - game: the game being matched (used for query seeding + exe path)
 *   - geminiKey: optional, enables the "Ask AI" source
 *   - onPick: (metadata) => void
 *   - onClose: () => void
 */
export default function FetchSourcePicker({ open, game, geminiKey, onPick, onClose }) {
  const dragControls = useDragControls();
  const [query, setQuery] = React.useState('');
  const [source, setSource] = React.useState('auto');
  const [candidates, setCandidates] = React.useState([]);
  const [cursor, setCursor] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [statusMsg, setStatusMsg] = React.useState('');
  const [expanding, setExpanding] = React.useState(false);

  // Smart query seeding — when the modal opens, derive a sensible default
  // from the exe filename + parent folder. e.g. given
  // "F:/Games/Lust Room v1.5/bin/launcher.exe" pick "Lust Room".
  React.useEffect(() => {
    if (!open || !game) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuery(deriveBestQuery(game));
    setCandidates([]);
    setCursor(0);
    setSource('auto');
    setStatusMsg('Pick a source — or hit "Auto fetch" to try everything.');
  }, [open, game?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open || !game) return null;

  const runSource = async (src) => {
    if (!isElectron || !window.api?.listCandidates) {
      setStatusMsg('Only works in the installed app (Electron-only).');
      return;
    }
    setSource(src);
    setLoading(true);
    setCandidates([]);
    setCursor(0);
    setStatusMsg(`Searching ${prettyName(src)}…`);
    try {
      if (src === 'auto') {
        // Auto uses the legacy single-best-guess endpoint and presents it
        // as a 1-result carousel so the UI is consistent.
        const result = await window.api.fetchMetadata({ query, geminiKey });
        if (result) {
          setCandidates([candidateFromMetadata(result)]);
          setStatusMsg(`Auto-fetch found a match on ${prettyName(result.source || 'web')}.`);
        } else {
          setStatusMsg('Auto-fetch found nothing. Try a specific source below.');
        }
      } else {
        const { candidates: list, error } = await window.api.listCandidates({
          source: src, query, geminiKey,
        });
        if (error) setStatusMsg(`Error: ${error}`);
        setCandidates(list || []);
        if (!list || !list.length) setStatusMsg(`${prettyName(src)} returned nothing. Try editing the query.`);
        else setStatusMsg(`${list.length} possible result${list.length === 1 ? '' : 's'} on ${prettyName(src)}.`);
      }
    } catch (e) {
      setStatusMsg(`Search failed: ${String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  const acceptCurrent = async () => {
    const c = candidates[cursor];
    if (!c) return;
    setExpanding(true);
    try {
      let full;
      if (source === 'auto') {
        // Auto already gave us a full record — wrap it back out.
        full = c.raw || c;
      } else {
        full = await window.api.expandCandidate({ candidate: c });
      }
      if (full) onPick(full);
      else setStatusMsg('Could not expand this result. Try another.');
    } catch (e) {
      setStatusMsg(`Could not load full details: ${String(e)}`);
    } finally {
      setExpanding(false);
    }
  };

  const current = candidates[cursor];
  const SOURCES = [
    { id: 'steam',     label: 'Steam',       hint: 'Mainstream PC games' },
    { id: 'gog',       label: 'GOG',         hint: 'DRM-free classics + new releases' },
    { id: 'itch',      label: 'itch.io',     hint: 'Indie / Python / RPG-Maker' },
    { id: 'dlsite',    label: 'DLsite',      hint: 'JP indies + RJ-code lookup' },
    { id: 'vndb',      label: 'VNDB',        hint: 'Visual novel database' },
    { id: 'ryuugames', label: 'Ryuugames',   hint: 'VN repackages, JP→EN' },
    { id: 'f95zone',   label: 'F95Zone',     hint: 'Adult-game threads via DDG' },
    { id: 'google',    label: 'Google / DDG', hint: 'Web search fallback' },
    { id: 'ai',        label: 'Ask AI',      hint: 'Gemini identifies the game' },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[215] grid place-items-center bg-black/65 backdrop-blur-[2px]"
        onDoubleClick={onClose}
        data-testid="fetch-picker-overlay"
      >
        <motion.div
          drag
          dragControls={dragControls}
          dragListener={false}
          dragMomentum={false}
          dragElastic={0}
          initial={{ y: 12, opacity: 0, scale: 0.97 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 12, opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-[min(900px,96vw)] max-h-[92vh] overflow-hidden rounded-xl hairline glass shadow-2xl flex flex-col"
          data-testid="fetch-picker-modal"
        >
          {/* Header (draggable handle) */}
          <div
            onPointerDown={(e) => dragControls.start(e)}
            className="cursor-move flex items-center justify-between px-5 py-3 border-b border-[rgb(var(--border))]/60 select-none"
          >
            <div className="flex items-center gap-2">
              <GripVertical size={14} className="text-muted" />
              <Search size={14} className="text-[rgb(var(--accent))]" />
              <h3 className="font-display font-bold tracking-[0.18em] text-sm uppercase">
                Find metadata · {game.name}
              </h3>
            </div>
            <button
              data-testid="fetch-picker-close"
              onClick={onClose}
              className="grid h-7 w-7 place-items-center rounded text-muted hover:text-ink hover:bg-panel"
            >
              <X size={14} />
            </button>
          </div>

          {/* Editable query */}
          <div className="px-5 pt-4 pb-2">
            <label className="block text-[10px] uppercase tracking-[0.2em] text-muted/80 mb-1.5">
              Search query
            </label>
            <input
              data-testid="fetch-picker-query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') runSource('auto'); }}
              className="w-full h-10 rounded-lg bg-panel/60 hairline px-3 text-[13px] focus:outline-none focus:border-[rgb(var(--accent)/0.7)]"
            />
            <div className="mt-1 text-[10.5px] text-muted/70">
              Seeded from <span className="font-mono text-muted">{shortExe(game.exePath)}</span>. Edit freely — try the full title for best results.
            </div>
          </div>

          {/* Action grid */}
          <div className="px-5 py-3 space-y-2">
            {/* Big Auto-fetch */}
            <button
              data-testid="fetch-picker-auto"
              onClick={() => runSource('auto')}
              disabled={loading || !query.trim()}
              className="group flex w-full items-center justify-center gap-2 rounded-lg px-4 h-11 text-[13px] font-bold transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundImage: 'linear-gradient(135deg, rgb(var(--accent)) 0%, rgb(var(--accent-2)) 100%)',
                color: 'rgb(var(--surface))',
                boxShadow: '0 0 18px -2px rgb(var(--accent) / 0.6)',
              }}
            >
              <Sparkles size={14} className="transition-transform group-hover:rotate-12" />
              {loading && source === 'auto' ? 'Auto fetching…' : 'Auto fetch (tries everything)'}
            </button>

            {/* Per-source grid */}
            <div className="grid grid-cols-3 gap-1.5">
              {SOURCES.map((s) => (
                <button
                  key={s.id}
                  data-testid={`fetch-picker-source-${s.id}`}
                  onClick={() => runSource(s.id)}
                  disabled={loading || !query.trim()}
                  title={s.hint}
                  className={cn(
                    'group flex flex-col items-start gap-0.5 rounded-md hairline px-2.5 py-1.5 text-left text-[11.5px] transition-colors disabled:opacity-50',
                    source === s.id
                      ? 'border-[rgb(var(--accent-2)/0.7)] bg-[rgb(var(--accent-2)/0.12)] text-ink'
                      : 'text-muted hover:text-ink hover:border-[rgb(var(--accent)/0.5)] hover:bg-[rgb(var(--accent)/0.08)]'
                  )}
                >
                  <span className="font-semibold flex items-center gap-1.5">
                    {s.id === 'ai' && <Bot size={11} />}
                    {s.id === 'google' && <Globe size={11} />}
                    {s.label}
                  </span>
                  <span className="text-[10px] text-muted/80">{s.hint}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Status bar */}
          <div className="px-5 py-2 border-t border-[rgb(var(--border))]/40 flex items-center justify-between gap-2 text-[11.5px] bg-surface/30">
            <span className="flex items-center gap-2 text-muted truncate">
              {loading && <Loader2 size={12} className="animate-spin shrink-0" />}
              <span className="truncate">{statusMsg}</span>
            </span>
            {candidates.length > 1 && (
              <span className="shrink-0 rounded-full hairline px-2 py-0.5 font-mono text-[10px] text-[rgb(var(--accent-2))]">
                {cursor + 1} / {candidates.length}
              </span>
            )}
          </div>

          {/* Results carousel */}
          <div className="flex-1 min-h-[200px] max-h-[36vh] overflow-y-auto px-5 py-4">
            {!current && !loading && (
              <div className="grid h-full place-items-center text-center text-sm text-muted">
                <div>
                  <Search className="mx-auto mb-2 text-muted/50" size={28} />
                  Pick a source above to see results.
                </div>
              </div>
            )}
            {current && (
              <div className="relative">
                {candidates.length > 1 && (
                  <>
                    <button
                      data-testid="fetch-picker-prev"
                      onClick={() => setCursor((c) => (c - 1 + candidates.length) % candidates.length)}
                      className="absolute left-0 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full hairline bg-panel/80 backdrop-blur hover:border-[rgb(var(--accent)/0.7)] hover:bg-[rgb(var(--accent)/0.12)] transition-colors"
                      title="Previous result"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      data-testid="fetch-picker-next"
                      onClick={() => setCursor((c) => (c + 1) % candidates.length)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full hairline bg-panel/80 backdrop-blur hover:border-[rgb(var(--accent)/0.7)] hover:bg-[rgb(var(--accent)/0.12)] transition-colors"
                      title="Next result"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </>
                )}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={current.source + current.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.18 }}
                    className="mx-12 flex gap-4 rounded-lg hairline bg-surface/40 p-4"
                    data-testid="fetch-picker-result-card"
                  >
                    {current.image ? (
                      <img src={current.image} alt="" className="h-32 w-24 shrink-0 rounded-md object-cover hairline" />
                    ) : (
                      <div className="h-32 w-24 shrink-0 rounded-md hairline bg-panel/60 grid place-items-center text-[10px] text-muted/60">
                        no cover
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="rounded-full px-2 py-0.5 text-[9.5px] uppercase tracking-wider bg-[rgb(var(--accent-2)/0.12)] text-[rgb(var(--accent-2))]">
                          {current.source}
                        </span>
                        {current.year && <span className="text-[10.5px] text-muted">{current.year}</span>}
                      </div>
                      <div className="font-display text-base font-bold text-ink truncate" title={current.name}>
                        {current.name}
                      </div>
                      <p className="mt-1.5 text-[11.5px] text-muted/90 line-clamp-5">
                        {current.shortDescription || 'No preview text available. Pick this to load full details.'}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 border-t border-[rgb(var(--border))]/60 bg-panel/80 backdrop-blur px-5 py-3">
            <div className="text-[11px] text-muted">
              Double-click outside to close. Picked metadata still goes through the preview screen.
            </div>
            <div className="flex items-center gap-2">
              <button
                data-testid="fetch-picker-cancel"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 rounded-md hairline px-3 h-8 text-xs text-muted hover:text-ink hover:border-[rgb(var(--accent)/0.5)]"
              >
                Cancel
              </button>
              <button
                data-testid="fetch-picker-accept"
                onClick={acceptCurrent}
                disabled={!current || expanding}
                className="inline-flex items-center gap-1.5 rounded-md bg-[rgb(var(--accent))] px-4 h-8 text-xs font-bold text-[rgb(var(--surface))] shadow-[0_0_14px_-2px_rgb(var(--accent)/0.7)] hover:brightness-110 disabled:opacity-50"
              >
                {expanding ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                Use this one
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ---- helpers ---- //
function deriveBestQuery(g) {
  // Priority 1 — explicit game.name (if it looks reasonable)
  if (g.name && !looksLikeExeStub(g.name)) return g.name.trim();
  // Priority 2 — parent folder of exe (often the game title)
  if (g.exePath) {
    const parts = g.exePath.replace(/\\/g, '/').split('/').filter(Boolean);
    // Walk up the path, picking the first folder that doesn't look like noise
    const noise = /^(bin|x64|x86|win64|win32|game|release|build|game_data|app|files)$/i;
    for (let i = parts.length - 2; i >= 0; i -= 1) {
      const seg = parts[i];
      if (!noise.test(seg)) return cleanFolderName(seg);
    }
  }
  return g.name || '';
}
function looksLikeExeStub(name) {
  return /^(launcher|game|main|run|start|play|setup)$/i.test(name)
    || /\.exe$/i.test(name);
}
function cleanFolderName(s) {
  return (s || '')
    .replace(/[._-]+/g, ' ')
    .replace(/\bv?\d+(\.\d+)+\b/g, '')  // strip version tags
    .replace(/\b(steam|gog|repack|portable|en|jp|english|x64|x86)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}
function shortExe(p) {
  if (!p) return '(no exe path)';
  const parts = p.replace(/\\/g, '/').split('/').slice(-3);
  return parts.join('/');
}
function prettyName(src) {
  return {
    auto: 'Auto-fetch',
    steam: 'Steam',
    gog: 'GOG',
    itch: 'itch.io',
    dlsite: 'DLsite',
    vndb: 'VNDB',
    ryuugames: 'Ryuugames',
    f95zone: 'F95Zone',
    google: 'Google / DDG',
    ai: 'Gemini AI',
    web: 'web search',
  }[src] || src;
}
function candidateFromMetadata(meta) {
  return {
    source: meta.source || 'web',
    id: meta.appid || meta.website || meta.name,
    name: meta.name,
    image: meta.headerImage || meta.capsuleImage || meta.background || '',
    year: (meta.releaseDate || '').slice(0, 4),
    shortDescription: meta.shortDescription || meta.about || '',
    raw: meta,
  };
}
