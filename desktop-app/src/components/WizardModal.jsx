import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderSearch, Loader2, Check, X as XIcon, RefreshCw, ChevronRight, Sparkles,
  Search, ArrowRight, ArrowLeft, PlusCircle, FolderOpen, Gamepad2,
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
  const [launcherStatus, setLauncherStatus] = React.useState('');

  // Exclude paths during scan — common launcher folders + custom
  const [skipLaunchers, setSkipLaunchers] = React.useState({
    steam: true, epic: true, ea: true, gog: true, ubisoft: false, riot: false,
  });
  const [customExcludes, setCustomExcludes] = React.useState([]);
  const addExclude = async () => {
    const p = await window.api?.pickFolder?.();
    if (p) setCustomExcludes((cs) => Array.from(new Set([...cs, p])));
  };

  const notifyTodo = (name) =>
    setLauncherStatus(`${name} integration is on the roadmap — for now use "Choose folder" below and point it at your ${name} install directory.`);

  const importLauncher = async (kind) => {
    setLauncherStatus(`Scanning ${kind === 'steam' ? 'Steam' : 'Epic'}…`);
    const api = kind === 'steam' ? window.api?.scanSteam : window.api?.scanEpic;
    if (!api) { setLauncherStatus('Not available in browser preview.'); return; }
    const r = await api();
    if (!r?.ok || !r.items?.length) {
      setLauncherStatus(r?.error || `No installed ${kind} games found.`);
      return;
    }
    setLauncherStatus(`Importing ${r.items.length} ${kind} games…`);
    let imported = 0;
    for (const it of r.items) {
      // Fetch metadata via Steam if we have appid, else multi-source
      let result = null;
      if (kind === 'steam' && it.appid) {
        try { result = await window.api?.fetchMetadata({ query: it.name, skipSources: [], geminiKey }); } catch { /* ignore */ }
      } else {
        try { result = await window.api?.fetchMetadata({ query: it.name, skipSources: [], geminiKey }); } catch { /* ignore */ }
      }
      let coverUrl = result?.capsuleImage || result?.headerImage || null;
      if (coverUrl && coverUrl.startsWith('http')) {
        coverUrl = (await window.api?.cacheImage(coverUrl, result?.name || it.name)) || coverUrl;
      }
      const entry = {
        name: result?.name || it.name,
        exePath: it.launchExe || it.installdir || it.launchUrl,
        launchArgs: '',
        launchUrl: it.launchUrl,
        source: kind === 'steam' ? 'steam-import' : 'epic-import',
        launcher: kind,
        appid: result?.appid || it.appid,
        steamAppId: kind === 'steam' ? it.appid : undefined,
        steamBuildId: it.buildid || undefined,
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
        // Pre-tag with the launcher category so App can group them
        categoryIds: [kind === 'steam' ? '__launcher_steam__' : '__launcher_epic__'],
      };
      if (onAccept) onAccept(entry);
      imported++;
      setLauncherStatus(`Imported ${imported}/${r.items.length}…`);
    }
    setLauncherStatus(`Done — added ${imported} games from ${kind}.`);
    setTimeout(() => onClose(), 800);
  };

  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/immutability */
  React.useEffect(() => {
    if (!open) {
      setStep(1); setRoot(''); setCandidates([]); setCursor(0);
      setCurrent(null); setResult(null); setIcon(null); setBusy(false);
      setAccepted([]); setQueryOverride(''); setSkipSources([]); setLauncherStatus('');
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
    const excludes = [
      ...customExcludes,
      // Common launcher directory name fragments — main process filters paths containing any of these
      ...(skipLaunchers.steam   ? ['steamapps', 'Steam\\steamapps', '/Steam/steamapps'] : []),
      ...(skipLaunchers.epic    ? ['Epic Games', 'EpicGamesLauncher'] : []),
      ...(skipLaunchers.ea      ? ['EA Games', 'Origin Games', 'EA Desktop'] : []),
      ...(skipLaunchers.gog     ? ['GOG Galaxy', 'GOG.com'] : []),
      ...(skipLaunchers.ubisoft ? ['Ubisoft', 'Ubisoft Game Launcher'] : []),
      ...(skipLaunchers.riot    ? ['Riot Games'] : []),
    ];
    const found = (await window.api?.scanDirectory(root, excludes)) || [];
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
    const entry = {
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
    };
    // CRITICAL: persist immediately so games are saved even if the wizard is closed mid-flow.
    if (onAccept) onAccept(entry);
    setAccepted((a) => [...a, entry]);
    advance();
  };

  const skipCurrent = () => advance();

  const goBack = () => {
    if (cursor > 0) {
      setCursor(cursor - 1);
      // remove the most recently accepted/skipped entry from accepted if it matches
      setAccepted((a) => a.slice(0, -1));
    }
  };

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
              Pick a folder to scan, or import directly from your installed launchers below.
              You&apos;ll review every match before anything is added.
            </p>
          </div>

          {/* Launcher imports */}
          <div className="rounded-lg hairline bg-surface/50 p-4">
            <div className="mb-2 text-[10px] uppercase tracking-wider text-muted">Import from a launcher (installed games only)</div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <LauncherBtn label="Steam"       onClick={() => importLauncher('steam')}        testid="launcher-steam" />
              <LauncherBtn label="Epic Games"  onClick={() => importLauncher('epic')}         testid="launcher-epic" />
              <LauncherBtn label="GOG Galaxy"  onClick={() => notifyTodo('GOG Galaxy')}       testid="launcher-gog" />
              <LauncherBtn label="EA App"      onClick={() => notifyTodo('EA App')}           testid="launcher-ea" />
              <LauncherBtn label="Ubisoft"     onClick={() => notifyTodo('Ubisoft Connect')}  testid="launcher-ubi" />
              <LauncherBtn label="Battle.net"  onClick={() => notifyTodo('Battle.net')}       testid="launcher-bnet" />
              <LauncherBtn label="Riot Client" onClick={() => notifyTodo('Riot Client')}      testid="launcher-riot" />
              <LauncherBtn label="Xbox / GP"   onClick={() => notifyTodo('Xbox / Game Pass')} testid="launcher-xbox" />
              <LauncherBtn label="Rockstar"    onClick={() => notifyTodo('Rockstar Games')}   testid="launcher-rockstar" />
            </div>
            {launcherStatus && <div className="mt-3 text-[11px] text-muted">{launcherStatus}</div>}
          </div>

          {/* Manual folder pick */}
          <div className="rounded-lg hairline bg-surface/50 p-4">
            <div className="mb-2 text-[10px] uppercase tracking-wider text-muted">…or scan a folder / drive</div>

            {/* Exclude paths */}
            <div className="mb-3 rounded-md hairline bg-panel/40 px-3 py-2">
              <div className="mb-1.5 flex items-center justify-between">
                <div className="text-[10.5px] uppercase tracking-wider text-muted">Skip these paths during scan</div>
                <button
                  data-testid="wizard-add-exclude"
                  onClick={addExclude}
                  className="text-[10px] text-[rgb(var(--accent))] hover:underline"
                >
                  + Add path
                </button>
              </div>
              <div className="space-y-1">
                {[
                  { key: 'steam', label: 'Steam library folders (use launcher import instead)' },
                  { key: 'epic',  label: 'Epic Games install folder' },
                  { key: 'ea',    label: 'EA App / Origin Games folder' },
                  { key: 'gog',   label: 'GOG Galaxy install folder' },
                  { key: 'ubisoft', label: 'Ubisoft Game Launcher folder' },
                  { key: 'riot', label: 'Riot Games folder' },
                ].map((opt) => (
                  <label key={opt.key} className="flex items-center gap-2 text-[11px] text-muted cursor-pointer hover:text-ink">
                    <input
                      type="checkbox"
                      data-testid={`wizard-skip-${opt.key}`}
                      checked={!!skipLaunchers[opt.key]}
                      onChange={(e) => setSkipLaunchers((s) => ({ ...s, [opt.key]: e.target.checked }))}
                      className="accent-[rgb(var(--accent))]"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              {customExcludes.length > 0 && (
                <div className="mt-2 space-y-1 border-t hairline pt-2">
                  {customExcludes.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 text-[10.5px] font-mono text-muted">
                      <span className="flex-1 truncate">{p}</span>
                      <button
                        data-testid={`wizard-remove-exclude-${i}`}
                        onClick={() => setCustomExcludes((cs) => cs.filter((_, j) => j !== i))}
                        className="text-muted/60 hover:text-red-400"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

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
              {/* Folder path + open-folder for quick inspection */}
              <div className="rounded-md hairline bg-panel/40 p-2 space-y-1.5">
                <div className="text-[10px] uppercase tracking-wider text-muted">Detected folder</div>
                <div className="break-all font-mono text-[10.5px] leading-snug text-ink">
                  {shortenPath(current.exe)}
                </div>
                <button
                  data-testid="wizard-open-folder-btn"
                  onClick={() => window.api?.openContainingDir(current.exe)}
                  className="inline-flex items-center gap-1.5 rounded-md hairline px-2 h-6 text-[10.5px] text-muted hover:text-ink hover:border-[rgb(var(--accent)/0.4)]"
                >
                  <FolderOpen size={11} /> Open this folder
                </button>
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

          <div className="mt-5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                data-testid="wizard-back-btn"
                disabled={cursor === 0}
                onClick={goBack}
                className="inline-flex items-center gap-2 rounded-full hairline px-4 py-2 text-xs text-muted hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed"
                title="Go back to the previous candidate"
              >
                <ArrowLeft size={13} /> Back
              </button>
              <button
                data-testid="wizard-skip-btn"
                onClick={skipCurrent}
                className="inline-flex items-center gap-2 rounded-full hairline px-4 py-2 text-xs text-muted hover:text-ink"
              >
                <XIcon size={13} /> Skip
              </button>
            </div>
            <div className="text-[10px] text-muted/70">
              {cursor + 1} / {candidates.length}
            </div>
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

function LauncherBtn({ label, onClick, testid }) {
  return (
    <button
      data-testid={testid}
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-md hairline px-3 py-2 text-[11.5px] text-ink hover:text-[rgb(var(--accent))] hover:border-[rgb(var(--accent)/0.5)] hover:bg-[rgb(var(--accent)/0.08)] transition-colors"
    >
      <Gamepad2 size={12} />
      {label}
    </button>
  );
}

function shortenPath(p) {
  if (!p) return '';
  // Replace drive letter with simple form, keep last 3 segments
  const parts = p.replace(/\\/g, '/').split('/').filter(Boolean);
  if (parts.length <= 4) return p;
  const tail = parts.slice(-4);
  return tail.join(' / ');
}
