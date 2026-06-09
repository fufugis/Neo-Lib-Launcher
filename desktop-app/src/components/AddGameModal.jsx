import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FilePlus, Loader2, Check, AlertCircle } from 'lucide-react';
import Modal from './Modal';
import { guessNameFromPath } from '../lib/utils';

/**
 * AddGameModal - Manual add flow:
 *  1. Pick executable
 *  2. Auto-search Steam for metadata
 *  3. User picks the right match (or skips for empty entry)
 */
export default function AddGameModal({ open, onClose, onCreate }) {
  const [exePath, setExePath] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [icon, setIcon] = React.useState(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    if (!open) {
      setExePath('');
      setQuery('');
      setResults([]);
      setIcon(null);
      setLoading(false);
    }
  }, [open]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const pick = async () => {
    const p = await window.api?.pickExe();
    if (!p) return;
    setExePath(p);
    const guessed = guessNameFromPath(p);
    setQuery(guessed);
    const ico = await window.api?.extractIcon(p);
    setIcon(ico);
    if (guessed) await runSearch(guessed);
  };

  const runSearch = async (q) => {
    setLoading(true);
    const r = (await window.api?.searchSteam(q)) || [];
    setResults(r);
    setLoading(false);
  };

  const accept = async (match) => {
    setLoading(true);
    let details = null;
    if (match) details = await window.api?.steamDetails(match.appid);
    const coverUrl = details
      ? await window.api?.cacheImage(details.capsuleImage || details.headerImage, details.name)
      : null;
    onCreate({
      name: details?.name || match?.name || query || 'Untitled',
      exePath,
      icon,
      appid: match?.appid,
      coverUrl: coverUrl || details?.headerImage,
      headerImage: details?.headerImage,
      background: details?.background,
      shortDescription: details?.shortDescription,
      about: details?.aboutTheGame,
      genres: details?.genres || [],
      developers: details?.developers || [],
      publishers: details?.publishers || [],
      releaseDate: details?.releaseDate || '',
      metacritic: details?.metacritic,
      screenshots: details?.screenshots || [],
      website: details?.website || '',
    });
    setLoading(false);
  };

  const skipMetadata = () =>
    onCreate({
      name: query || guessNameFromPath(exePath) || 'Untitled',
      exePath,
      icon,
      genres: [],
      developers: [],
      publishers: [],
      screenshots: [],
    });

  return (
    <Modal open={open} onClose={onClose} title="Add Game" wide testid="add-game-modal">
      <div className="space-y-5 p-5">
        {/* Exe picker */}
        <div className="rounded-lg hairline bg-surface/50 p-4">
          <div className="mb-2 text-[10px] uppercase tracking-wider text-muted">Step 1 · Executable</div>
          <div className="flex items-center gap-3">
            {icon && <img src={icon} alt="" className="h-10 w-10 rounded hairline" />}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm">{exePath || 'No file selected'}</div>
              <div className="truncate text-[11px] text-muted">{exePath ? 'Looks good.' : 'Choose a game executable.'}</div>
            </div>
            <button
              data-testid="pick-exe-btn"
              onClick={pick}
              className="inline-flex items-center gap-2 rounded-full hairline px-3 py-1.5 text-xs hover:border-accent/40 hover:bg-accent/10 transition-all"
            >
              <FilePlus size={13} /> Browse…
            </button>
          </div>
        </div>

        {/* Search */}
        <div className={'rounded-lg hairline bg-surface/50 p-4 ' + (!exePath ? 'opacity-50 pointer-events-none' : '')}>
          <div className="mb-2 text-[10px] uppercase tracking-wider text-muted">Step 2 · Find metadata online</div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                data-testid="add-search-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runSearch(query)}
                placeholder="Game title…"
                className="w-full rounded-full bg-panel/60 hairline pl-9 pr-3 h-9 text-sm focus:outline-none focus:border-accent/60"
              />
            </div>
            <button
              data-testid="add-search-btn"
              onClick={() => runSearch(query)}
              className="inline-flex items-center gap-2 rounded-full bg-accent text-surface px-4 h-9 text-xs font-semibold hover:opacity-90"
            >
              {loading ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
              Search
            </button>
          </div>

          {/* Results */}
          <div className="mt-3 max-h-72 overflow-y-auto rounded-md">
            <AnimatePresence>
              {results.map((r, i) => (
                <motion.button
                  key={r.appid}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  data-testid={`match-${r.appid}`}
                  onClick={() => accept(r)}
                  className="group flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-accent/10 transition-colors"
                >
                  {r.tinyImage ? (
                    <img src={r.tinyImage} alt="" className="h-10 w-20 rounded object-cover hairline" />
                  ) : (
                    <div className="h-10 w-20 rounded hairline bg-panel" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">{r.name}</div>
                    <div className="text-[11px] text-muted">App ID · {r.appid}</div>
                  </div>
                  <span className="opacity-0 group-hover:opacity-100 text-accent text-xs">Use ↵</span>
                </motion.button>
              ))}
              {results.length === 0 && !loading && query && (
                <div className="flex items-center gap-2 p-3 text-xs text-muted">
                  <AlertCircle size={13} /> No matches found. Try a different title or skip.
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            data-testid="add-skip-btn"
            onClick={skipMetadata}
            disabled={!exePath}
            className="rounded-full hairline px-4 py-2 text-xs text-muted hover:text-ink hover:border-accent/40 disabled:opacity-50"
          >
            Add without metadata
          </button>
        </div>
      </div>
    </Modal>
  );
}
