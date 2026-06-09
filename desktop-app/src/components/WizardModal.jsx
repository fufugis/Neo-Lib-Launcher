import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderSearch, Loader2, Check, X as XIcon, RefreshCw, ChevronRight, Sparkles,
  Search, ArrowRight, PlusCircle,
} from 'lucide-react';
import Modal from './Modal';
import { guessNameFromPath } from '../lib/utils';

/**
 * Auto-import Wizard
 *  1. Pick folder/drive
 *  2. Scan
 *  3. Review each detected game (multi-source: Steam → GOG → AI → Web)
 *     - Accept / Skip / Re-search (with custom query, skips current source)
 *  4. Done → option to add more manually
 */
export default function WizardModal({ open, onClose, onImport, onAccept, onAddManual, geminiKey }) {
  const [step, setStep] = React.useState(1);
  const [root, setRoot] = React.useState('');
  const [candidates, setCandidates] = React.useState([]);
  const [cursor, setCursor] = React.useState(0);
  const [current, setCurrent] = React.useState(null);
  const [result, setResult] = React.useState(null);
  const [icon, setIcon] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [accepted, setAccepted] = React.useState([]);
  const [queryOverride, setQueryOverride] = React.useState('');
  const [skipSources, setSkipSources] = React.useState([]);

  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/immutability */
  React.useEffect(() => {
    if (!open) {
      setStep(1); setRoot(''); setCandidates([]); setCursor(0);
      setCurrent(null); setResult(null); setIcon(null); setBusy(false);
      setAccepted([]); setQueryOverride(''); setSkipSources([]);
    }
  }, [open]);

  React.useEffect(() => {
    if (step !== 3) return;
    if (candidates.length === 0 || cursor >= candidates.length) return;
    prepCandidate(candidates[cursor]);
  }, [step, cursor, candidates]);
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/immutability */

  const pickRoot = async () => {
    const p = await window.api?.pickDirectory();
    if (p) setRoot(p);
  };

  const startScan = async () => {
    if (!root) return;
    setStep(2);
    setBusy(true);
    const found = (await window.api?.scanDirectory(root)) || [];
    setCandidates(found);
    setBusy(false);
    if (found.length === 0) setStep(4);
    else setStep(3);
  };

  const prepCandidate = async (cand) => {
    setBusy(true);
    setResult(null);
    setSkipSources([]);
    setQueryOverride('');
    setCurrent(cand);
    const guess = cand.folderName || guessNameFromPath(cand.exe);
    const ico = await window.api?.extractIcon(cand.exe);
    setIcon(ico);
    const r = await window.api?.fetchMetadata({ query: guess, skipSources: [], geminiKey });
    setResult(r);
    setBusy(false);
  };

  const reSearch = async () => {
    setBusy(true);
    const q = queryOverride || current?.folderName || '';
    const r = await window.api?.fetchMetadata({ query: q, skipSources, geminiKey });
    setResult(r);
    setBusy(false);
  };

  const trySkipCurrentSource = async () => {
    if (!result?.source) return;
    const newSkips = [...new Set([...skipSources, result.source])];
    setSkipSources(newSkips);
    setBusy(true);
    const r = await window.api?.fetchMetadata({
      query: queryOverride || current?.folderName || '',
      skipSources: newSkips,
      geminiKey,
    });
    setResult(r);
    setBusy(false);
  };

  const acceptCurrent = async () => {
    setBusy(true);
    let coverUrl = result?.capsuleImage || result?.headerImage || null;
    if (coverUrl && coverUrl.startsWith('http')) {
      coverUrl = (await window.api?.cacheImage(coverUrl, result.name)) || coverUrl;
    }
    setAccepted((a) => [
      ...a,
      {
        name: result?.name || current?.folderName,
        exePath: current?.exe,
        icon,
        source: result?.source,
        appid: result?.appid,
        coverUrl: coverUrl || result?.headerImage,
        headerImage: result?.headerImage,
        background: result?.background,
        shortDescription: result?.shortDescription,
        about: result?.about,
        genres: result?.genres || [],
        developers: result?.developers || [],
        publishers: result?.publishers || [],
        releaseDate: result?.releaseDate || '',
        metacritic: result?.metacritic,
        screenshots: result?.screenshots || [],
        website: result?.website || '',
      },
    ]);
    advance();
  };

  const skipCurrent = () => advance();

  const advance = () => {
    const next = cursor + 1;
    if (next >= candidates.length) {
      setStep(4);
      setBusy(false);
    } else {
      setCursor(next);
    }
  };

  const finish = () => {
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Auto-import Wizard" wide testid="wizard-modal">
      {step === 1 && (
        <div className="space-y-4 p-6">
          <div className="flex items-start gap-3">
            <Sparkles size={18} className="mt-0.5 text-[rgb(var(--accent))]" />
            <p className="text-sm text-muted">
              Pick a folder, your Games drive, or even <code className="text-ink">C:\</code>. NEO-LIB
              will scan every program on it and identify which ones are games using Steam, GOG, web
              search and (if enabled) AI. You&apos;ll review every match before anything is added.
            </p>
          </div>
          <div className="rounded-lg hairline bg-surface/50 p-4">
            <div className="mb-2 text-[10px] uppercase tracking-wider text-muted">Folder to scan</div>
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1 truncate text-sm">
                {root || <span className="text-muted">No folder selected</span>}
              </div>
              <button
                data-testid="wizard-pick-root-btn"
                onClick={pickRoot}
                className="inline-flex items-center gap-2 rounded-full hairline px-3 py-1.5 text-xs hover:border-[rgb(var(--accent)/0.5)] hover:bg-[rgb(var(--accent)/0.08)]"
              >
                <FolderSearch size={13} /> Choose…
              </button>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              data-testid="wizard-start-btn"
              disabled={!root}
              onClick={startScan}
              className="neon inline-flex items-center gap-2 rounded-full bg-[rgb(var(--accent))] px-5 py-2 text-xs font-bold text-[rgb(var(--surface))] disabled:opacity-50"
            >
              Start scan <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3 p-10 text-center">
          <Loader2 size={28} className="mx-auto animate-spin text-[rgb(var(--accent))]" />
          <div className="font-display text-base">Scanning {root}…</div>
          <div className="text-xs text-muted">Walking the disk for programs.</div>
        </div>
      )}

      {step === 3 && current && (
        <div className="p-5">
          <div className="mb-4 flex items-center justify-between text-[11px] text-muted">
            <span>Reviewing <span className="text-ink">{cursor + 1}</span> of {candidates.length}</span>
            <span>Accepted: {accepted.length}</span>
          </div>

          <div className="grid gap-4 md:grid-cols-[200px_1fr]">
            <div className="space-y-2">
              <div className="aspect-[3/4] overflow-hidden rounded-lg hairline bg-panel">
                <AnimatePresence mode="wait">
                  {result?.capsuleImage || result?.headerImage ? (
                    <motion.img
                      key={result.capsuleImage || result.headerImage}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      src={result.capsuleImage || result.headerImage}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="skeleton h-full w-full" />
                  )}
                </AnimatePresence>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted">
                {icon && <img src={icon} alt="" className="h-5 w-5 rounded" />}
                <span className="truncate" title={current.exe}>{current.folderName}</span>
              </div>
            </div>

            <div className="min-w-0 space-y-3">
              <div>
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted">
                  Detected match
                  {result?.source && (
                    <span className="rounded-full bg-[rgb(var(--accent-2)/0.12)] text-[rgb(var(--accent-2))] hairline border-[rgb(var(--accent-2)/0.35)] px-2 py-0.5 text-[10px]">
                      via {result.source}
                    </span>
                  )}
                </div>
                <div className="font-display text-xl font-semibold">
                  {busy && !result ? '…' : (result?.name || 'No match found')}
                </div>
              </div>
              <p className="text-[12.5px] leading-relaxed text-muted line-clamp-5 min-h-[60px]">
                {result?.shortDescription || result?.about || (busy ? 'Searching…' : 'No description found.')}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(result?.genres || []).slice(0, 5).map((g) => (
                  <span key={g} className="rounded-full bg-[rgb(var(--accent)/0.12)] text-[rgb(var(--accent))] px-2 py-0.5 text-[10px]">{g}</span>
                ))}
                {result?.releaseDate && (
                  <span className="rounded-full hairline px-2 py-0.5 text-[10px] text-muted">{result.releaseDate}</span>
                )}
              </div>

              <div className="rounded-lg hairline bg-surface/40 p-3 space-y-2">
                <div className="text-[10px] uppercase tracking-wider text-muted">Wrong game? Re-search</div>
                <div className="flex items-center gap-2">
                  <input
                    data-testid="wizard-query-input"
                    value={queryOverride}
                    onChange={(e) => setQueryOverride(e.target.value)}
                    placeholder={current.folderName}
                    className="flex-1 rounded-md bg-panel/60 hairline px-3 h-8 text-xs focus:outline-none focus:border-[rgb(var(--accent)/0.6)]"
                  />
                  <button
                    data-testid="wizard-research-btn"
                    onClick={reSearch}
                    className="inline-flex items-center gap-1.5 rounded-md hairline px-3 h-8 text-xs hover:border-[rgb(var(--accent)/0.5)] hover:bg-[rgb(var(--accent)/0.08)]"
                  >
                    <Search size={12} /> Re-search
                  </button>
                </div>
                {result?.source && (
                  <button
                    data-testid="wizard-try-other-btn"
                    onClick={trySkipCurrentSource}
                    className="text-[11px] text-[rgb(var(--accent-2))] hover:underline"
                  >
                    Try a different source (skip {result.source})
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <button
              data-testid="wizard-skip-btn"
              onClick={skipCurrent}
              className="inline-flex items-center gap-2 rounded-full hairline px-4 py-2 text-xs text-muted hover:text-ink"
            >
              <XIcon size={13} /> Skip
            </button>
            <button
              data-testid="wizard-accept-btn"
              onClick={acceptCurrent}
              disabled={busy || !current}
              className="neon inline-flex items-center gap-2 rounded-full bg-[rgb(var(--accent))] px-5 py-2 text-xs font-bold text-[rgb(var(--surface))] disabled:opacity-50"
            >
              <Check size={13} /> Accept &amp; next
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4 p-8 text-center">
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring' }}
            className="mx-auto grid h-14 w-14 place-items-center rounded-full hairline neon"
          >
            <Check size={20} className="text-[rgb(var(--accent))]" />
          </motion.div>
          <div className="font-display text-xl">Wizard complete</div>
          <div className="text-sm text-muted">
            Imported <span className="text-ink font-medium">{accepted.length}</span> game{accepted.length !== 1 && 's'}.
            {candidates.length > accepted.length && (
              <> Some weren&apos;t identified — you can add the rest manually below.</>
            )}
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              data-testid="wizard-add-manual-btn"
              onClick={() => { onClose(); onAddManual && onAddManual(); }}
              className="inline-flex items-center gap-2 rounded-full hairline px-4 py-2 text-xs text-muted hover:text-ink hover:border-[rgb(var(--accent)/0.5)] hover:bg-[rgb(var(--accent)/0.08)]"
            >
              <PlusCircle size={13} /> Add another manually
            </button>
            <button
              data-testid="wizard-finish-btn"
              onClick={finish}
              className="neon inline-flex items-center gap-2 rounded-full bg-[rgb(var(--accent))] px-5 py-2 text-xs font-bold text-[rgb(var(--surface))]"
            >
              Done <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
