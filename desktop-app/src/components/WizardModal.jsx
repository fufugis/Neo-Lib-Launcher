import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderSearch, Loader2, Check, X as XIcon, ChevronRight, RefreshCw, ArrowLeft, ArrowRight, Sparkles,
} from 'lucide-react';
import Modal from './Modal';
import { guessNameFromPath } from '../lib/utils';

/**
 * WizardModal - Multi-step:
 *  1. Pick folder/drive
 *  2. Scanning…  (collect candidates)
 *  3. Review each candidate with a Steam match; Accept / Try next / Skip
 *  4. Done summary -> commit to library
 */
export default function WizardModal({ open, onClose, onImport }) {
  const [step, setStep] = React.useState(1);
  const [root, setRoot] = React.useState('');
  const [candidates, setCandidates] = React.useState([]);
  const [cursor, setCursor] = React.useState(0);
  const [current, setCurrent] = React.useState(null);
  const [matches, setMatches] = React.useState([]);
  const [matchIdx, setMatchIdx] = React.useState(0);
  const [details, setDetails] = React.useState(null);
  const [icon, setIcon] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [accepted, setAccepted] = React.useState([]);
  const [queryOverride, setQueryOverride] = React.useState('');

  // Reset on open/close
  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/immutability */
  React.useEffect(() => {
    if (!open) {
      setStep(1);
      setRoot('');
      setCandidates([]);
      setCursor(0);
      setCurrent(null);
      setMatches([]);
      setMatchIdx(0);
      setDetails(null);
      setIcon(null);
      setBusy(false);
      setAccepted([]);
      setQueryOverride('');
    }
  }, [open]);

  // When cursor moves, prep next candidate
  React.useEffect(() => {
    if (step !== 3) return;
    if (candidates.length === 0 || cursor >= candidates.length) return;
    prepCandidate(candidates[cursor]);
  }, [step, cursor, candidates]);
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/immutability */

  const pickRoot = async () => {
    const p = await window.api?.pickDirectory();
    if (!p) return;
    setRoot(p);
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
    setDetails(null);
    setMatches([]);
    setMatchIdx(0);
    setCurrent(cand);
    setQueryOverride('');
    const guess = cand.folderName || guessNameFromPath(cand.exe);
    const ico = await window.api?.extractIcon(cand.exe);
    setIcon(ico);
    const res = (await window.api?.searchSteam(guess)) || [];
    setMatches(res);
    if (res.length > 0) await loadDetails(res[0].appid);
    setBusy(false);
  };

  const loadDetails = async (appid) => {
    setBusy(true);
    const d = await window.api?.steamDetails(appid);
    setDetails(d);
    setBusy(false);
  };

  const refetchSearch = async () => {
    setBusy(true);
    setDetails(null);
    const q = queryOverride || current?.folderName || '';
    const res = (await window.api?.searchSteam(q)) || [];
    setMatches(res);
    setMatchIdx(0);
    if (res.length > 0) await loadDetails(res[0].appid);
    setBusy(false);
  };

  const nextMatch = async () => {
    if (matches.length === 0) return;
    const ni = (matchIdx + 1) % matches.length;
    setMatchIdx(ni);
    await loadDetails(matches[ni].appid);
  };

  const acceptCurrent = async () => {
    setBusy(true);
    const m = matches[matchIdx];
    let coverUrl = null;
    if (details) coverUrl = await window.api?.cacheImage(details.capsuleImage || details.headerImage, details.name);

    const entry = {
      name: details?.name || m?.name || current?.folderName,
      exePath: current?.exe,
      icon,
      appid: m?.appid,
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
    };
    setAccepted((a) => [...a, entry]);
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
    onImport(accepted);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Auto-import Wizard" wide testid="wizard-modal">
      {step === 1 && (
        <div className="space-y-4 p-6">
          <div className="flex items-start gap-3">
            <Sparkles size={18} className="mt-0.5 text-accent" />
            <p className="text-sm text-muted">
              Pick a folder (a hard drive root, or your <i>Games</i> directory) and we&apos;ll scan it for installed games.
              You&apos;ll review each match before anything is added.
            </p>
          </div>
          <div className="rounded-lg hairline bg-surface/50 p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted mb-2">Folder to scan</div>
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1 truncate text-sm">
                {root || <span className="text-muted">No folder selected</span>}
              </div>
              <button
                data-testid="wizard-pick-root-btn"
                onClick={pickRoot}
                className="inline-flex items-center gap-2 rounded-full hairline px-3 py-1.5 text-xs hover:border-accent/40 hover:bg-accent/10"
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
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-xs font-semibold text-surface disabled:opacity-50 hover:opacity-90"
            >
              Start scan <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3 p-10 text-center">
          <Loader2 size={28} className="mx-auto animate-spin text-accent" />
          <div className="font-display text-base">Scanning {root}…</div>
          <div className="text-xs text-muted">This may take a moment for large drives.</div>
        </div>
      )}

      {step === 3 && current && (
        <div className="p-5">
          <div className="mb-4 flex items-center justify-between text-[11px] text-muted">
            <span>
              Reviewing <span className="text-ink">{cursor + 1}</span> of {candidates.length}
            </span>
            <span>Accepted: {accepted.length}</span>
          </div>

          {/* Preview card */}
          <div className="grid gap-4 md:grid-cols-[200px_1fr]">
            <div className="space-y-2">
              <div className="aspect-[3/4] overflow-hidden rounded-lg hairline bg-panel">
                <AnimatePresence mode="wait">
                  {details?.capsuleImage || details?.headerImage ? (
                    <motion.img
                      key={details.capsuleImage || details.headerImage}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      src={details.capsuleImage || details.headerImage}
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
                <div className="text-[10px] uppercase tracking-wider text-muted">Detected match</div>
                <div className="font-display text-xl font-semibold">
                  {busy && !details ? '…' : details?.name || matches[matchIdx]?.name || 'No match found'}
                </div>
              </div>
              <p className="text-[12.5px] leading-relaxed text-muted line-clamp-5 min-h-[60px]">
                {details?.shortDescription || (busy ? 'Loading description…' : 'No description available.')}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(details?.genres || []).slice(0, 5).map((g) => (
                  <span key={g} className="rounded-full bg-accent/12 text-accent px-2 py-0.5 text-[10px]">{g}</span>
                ))}
                {details?.releaseDate && (
                  <span className="rounded-full hairline px-2 py-0.5 text-[10px] text-muted">{details.releaseDate}</span>
                )}
              </div>

              <div className="rounded-lg hairline bg-surface/40 p-3 space-y-2">
                <div className="text-[10px] uppercase tracking-wider text-muted">Not the right game?</div>
                <div className="flex items-center gap-2">
                  <input
                    data-testid="wizard-query-input"
                    value={queryOverride}
                    onChange={(e) => setQueryOverride(e.target.value)}
                    placeholder={current.folderName}
                    className="flex-1 rounded-md bg-panel/60 hairline px-3 h-8 text-xs focus:outline-none focus:border-accent/60"
                  />
                  <button
                    data-testid="wizard-research-btn"
                    onClick={refetchSearch}
                    className="inline-flex items-center gap-1.5 rounded-md hairline px-3 h-8 text-xs hover:border-accent/40 hover:bg-accent/10"
                  >
                    <RefreshCw size={12} /> Re-search
                  </button>
                </div>
                {matches.length > 1 && (
                  <button
                    data-testid="wizard-next-match-btn"
                    onClick={nextMatch}
                    className="text-[11px] text-accent hover:underline"
                  >
                    Try next match ({matchIdx + 1}/{matches.length}) →
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Action bar */}
          <div className="mt-5 flex items-center justify-between">
            <button
              data-testid="wizard-skip-btn"
              onClick={skipCurrent}
              className="inline-flex items-center gap-2 rounded-full hairline px-4 py-2 text-xs text-muted hover:text-ink hover:border-accent/40"
            >
              <XIcon size={13} /> Skip
            </button>
            <button
              data-testid="wizard-accept-btn"
              onClick={acceptCurrent}
              disabled={busy || !current}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-xs font-semibold text-surface disabled:opacity-50 hover:opacity-90"
            >
              <Check size={13} /> Accept & next
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-3 p-10 text-center">
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring' }}
            className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accent/15 text-accent"
          >
            <Check size={20} />
          </motion.div>
          <div className="font-display text-xl">Wizard complete</div>
          <div className="text-sm text-muted">
            Imported <span className="text-ink font-medium">{accepted.length}</span> game{accepted.length !== 1 && 's'}.
          </div>
          <button
            data-testid="wizard-finish-btn"
            onClick={finish}
            className="mt-2 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-xs font-semibold text-surface hover:opacity-90"
          >
            Add to library <ArrowRight size={13} />
          </button>
        </div>
      )}
    </Modal>
  );
}
