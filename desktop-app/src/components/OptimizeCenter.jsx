import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle, ArrowLeft, CheckCircle2, Cpu, Eye, FolderOpen, Gauge,
  Gamepad2, HardDrive, MemoryStick, MonitorCog, Power, RefreshCw, Rocket,
  Settings2, ShieldCheck, Sparkles, Trash2, X,
} from 'lucide-react';
import Modal from './Modal';

const SUMMARY_KEY = 'neolib.optimize.summary.v1';

function formatBytes(value) {
  const bytes = Number(value || 0);
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(bytes >= 10 * 1024 ** 3 ? 0 : 1)} GB`;
  if (bytes >= 1024 ** 2) return `${Math.round(bytes / 1024 ** 2)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

function loadSummary() {
  try { return JSON.parse(window.localStorage.getItem(SUMMARY_KEY) || '{}'); } catch { return {}; }
}

export default function OptimizeCenter({ open, onClose, games = [] }) {
  const [view, setView] = React.useState('home');
  const [summary, setSummary] = React.useState(loadSummary);
  React.useEffect(() => { if (open) setView('home'); }, [open]);
  const saveSummary = React.useCallback((key, value) => {
    setSummary((current) => {
      const next = { ...current, [key]: { text: value, at: Date.now() } };
      try { window.localStorage.setItem(SUMMARY_KEY, JSON.stringify(next)); } catch { /* optional */ }
      return next;
    });
  }, []);
  // Keep these callback identities stable. Passing a new inline callback into
  // a view that auto-scans made its effect believe the scan settings changed
  // after every saved summary, causing the visible “scan → results → scan”
  // loop and needless disk activity.
  const saveSpeedSummary = React.useCallback((text) => saveSummary('speed', text), [saveSummary]);
  const saveJunkSummary = React.useCallback((text) => saveSummary('junk', text), [saveSummary]);

  return (
    <Modal open={open} onClose={onClose} title="Optimize Center" wide="xl" testid="optimize-center">
      <div className="min-h-[500px] overflow-hidden bg-[radial-gradient(circle_at_50%_0%,rgb(var(--accent)/0.16),transparent_42%)]">
        <AnimatePresence mode="wait">
          {view === 'home' ? (
            <motion.div key="home" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="p-6">
              <PowerHeader />
              <div className="mt-6 grid gap-4">
                <OptimizeRow
                  icon={<Rocket size={24} />}
                  eyebrow="Gaming readiness"
                  title="Speed up gaming"
                  description="See what is using CPU, memory, and GPU, then review Windows gaming settings with clear trade-offs."
                  summary={summary.speed}
                  action="Inspect PC"
                  onClick={() => setView('speed')}
                />
                <OptimizeRow
                  icon={<Trash2 size={23} />}
                  eyebrow="Safe storage review"
                  title="Find junk and leftovers"
                  description="Review old caches, logs, crash reports, and large installers or archives near your configured games."
                  summary={summary.junk}
                  action="Scan safely"
                  onClick={() => setView('junk')}
                />
              </div>
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-3 text-[11px] leading-relaxed text-muted">
                <ShieldCheck size={15} className="mt-0.5 shrink-0 text-emerald-300" />
                <span>NEO-LIB does not inject into games, edit game memory, or apply hidden registry “boosts.” Every action is visible; cleanup uses the Recycle Bin.</span>
              </div>
            </motion.div>
          ) : view === 'speed' ? (
            <SpeedUpView key="speed" onBack={() => setView('home')} onSummary={saveSpeedSummary} />
          ) : (
            <JunkView key="junk" games={games} onBack={() => setView('home')} onSummary={saveJunkSummary} />
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
}

function PowerHeader() {
  return (
    <div className="flex items-center gap-4">
      <div className="relative grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-[rgb(var(--accent)/0.45)] bg-[rgb(var(--accent)/0.12)]">
        <motion.span className="absolute inset-1 rounded-xl border border-[rgb(var(--accent-2)/0.35)]" animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }} />
        <motion.div animate={{ scale: [1, 1.14, 1], filter: ['drop-shadow(0 0 4px rgb(var(--accent)))', 'drop-shadow(0 0 14px rgb(var(--accent-2)))', 'drop-shadow(0 0 4px rgb(var(--accent)))'] }} transition={{ duration: 1.8, repeat: Infinity }}><Power size={28} className="text-[rgb(var(--accent))]" /></motion.div>
        <Sparkles size={13} className="absolute -right-1 -top-1 text-[rgb(var(--accent-2))]" />
      </div>
      <div><p className="text-[10px] font-black uppercase tracking-[0.28em] text-[rgb(var(--accent))]">PC power-up</p><h2 className="mt-1 font-display text-2xl font-black">Prepare Windows for play</h2><p className="mt-1 max-w-xl text-[12px] leading-relaxed text-muted">Find real bottlenecks and reclaim obvious leftovers. Nothing is changed until you choose it.</p></div>
    </div>
  );
}

function OptimizeRow({ icon, eyebrow, title, description, summary, action, onClick }) {
  return (
    <motion.section whileHover={{ y: -2 }} className="group grid gap-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.62)] p-4 shadow-xl min-[650px]:grid-cols-[52px_minmax(0,1fr)_auto] min-[650px]:items-stretch">
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-[rgb(var(--accent)/0.12)] text-[rgb(var(--accent))] transition group-hover:shadow-[0_0_22px_rgb(var(--accent)/0.35)]">{icon}</div>
      <div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[0.22em] text-[rgb(var(--accent-2))]">{eyebrow}</p><h3 className="mt-0.5 text-[16px] font-black">{title}</h3><p className="mt-1 text-[11.5px] leading-relaxed text-muted">{description}</p>{summary?.text && <p className="mt-2 flex items-center gap-1.5 text-[10.5px] font-semibold text-emerald-300"><CheckCircle2 size={12} /> Last result · {summary.text}</p>}</div>
      <button onClick={onClick} className="inline-flex h-10 self-end items-center justify-center gap-2 rounded-xl bg-[rgb(var(--accent))] px-4 text-[11px] font-black text-[rgb(var(--surface))] shadow-[0_0_18px_rgb(var(--accent)/0.24)] hover:brightness-110">{action} <span aria-hidden>›</span></button>
    </motion.section>
  );
}

function SubHeader({ icon, title, subtitle, onBack, action }) {
  return <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.94)] px-5 py-3 backdrop-blur-xl"><button onClick={onBack} className="grid h-9 w-9 place-items-center rounded-lg hairline text-muted hover:text-ink" title="Back to Optimize"><ArrowLeft size={16} /></button><span className="grid h-9 w-9 place-items-center rounded-lg bg-[rgb(var(--accent)/0.12)] text-[rgb(var(--accent))]">{icon}</span><div className="min-w-0 flex-1"><h2 className="text-[14px] font-black">{title}</h2><p className="truncate text-[10px] text-muted">{subtitle}</p></div>{action}</header>;
}

function SpeedUpView({ onBack, onSummary }) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [closing, setClosing] = React.useState(null);
  const inspect = React.useCallback(async () => {
    setLoading(true); setError('');
    try {
      const result = await window.api?.inspectGamingPerformance?.();
      if (!result?.ok) throw new Error(result?.error || 'Performance inspection failed.');
      setData(result);
      const cpuLeader = [...(result.processes || [])].sort((a, b) => b.cpuPercent - a.cpuPercent)[0];
      onSummary(`Inspected · ${cpuLeader?.name || 'no heavy process'} was highest CPU`);
    } catch (e) { setError(e?.message || 'Performance inspection failed.'); }
    finally { setLoading(false); }
  }, [onSummary]);
  React.useEffect(() => { inspect(); }, [inspect]);
  const closeProcess = async () => {
    if (!closing) return;
    const result = await window.api?.closeOptimizableProcess?.({ pid: closing.pid, name: closing.name });
    if (result?.ok) { onSummary(`Closed ${closing.name} after confirmation`); setClosing(null); inspect(); }
    else setClosing((current) => ({ ...current, error: result?.error || 'Could not close process.' }));
  };
  const processes = data?.processes || [];
  const cpuTop = [...processes].sort((a, b) => b.cpuPercent - a.cpuPercent).slice(0, 5);
  const ramTop = [...processes].sort((a, b) => b.memoryBytes - a.memoryBytes).slice(0, 5);
  const gpuTotal = Math.min(100, (data?.gpu || []).reduce((sum, item) => sum + Number(item.percent || 0), 0));
  return <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}>
    <SubHeader icon={<Rocket size={18} />} title="Speed up gaming" subtitle="On-demand Windows performance snapshot" onBack={onBack} action={<button onClick={inspect} disabled={loading} className="grid h-9 w-9 place-items-center rounded-lg hairline text-muted hover:text-ink" title="Refresh analysis"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /></button>} />
    <div className="space-y-5 p-5">
      {error && <Notice tone="danger">{error}</Notice>}
      {loading && !data ? <LoadingPower text="Sampling real CPU use and Windows gaming status…" /> : <>
        <div className="grid gap-4 min-[760px]:grid-cols-2">
          <ProcessList title="Top CPU use" icon={<Cpu size={15} />} entries={cpuTop} metric={(item) => `${item.cpuPercent.toFixed(1)}%`} warn={(item) => item.cpuPercent > 10} onClose={setClosing} />
          <ProcessList title="Top memory use" icon={<MemoryStick size={15} />} entries={ramTop} metric={(item) => formatBytes(item.memoryBytes)} warn={(item) => item.memoryBytes > 2 * 1024 ** 3} onClose={setClosing} />
        </div>
        <section className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.28)] p-4">
          <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em]"><Gauge size={15} className="text-[rgb(var(--accent))]" /> GPU activity</span><span className={`text-sm font-black ${gpuTotal > 10 ? 'text-amber-300' : 'text-emerald-300'}`}>{data?.gpuAvailable ? `${gpuTotal.toFixed(1)}%` : 'Unavailable'}</span></div>
          {data?.gpuAvailable ? <div className="mt-3 grid gap-1.5 sm:grid-cols-2">{(data.gpu || []).slice(0, 6).map((entry) => <div key={`${entry.pid}-${entry.name}`} className={`flex items-center justify-between rounded-lg px-3 py-2 text-[10.5px] ${entry.percent > 10 ? 'border border-amber-300/25 bg-amber-300/[0.08]' : 'bg-[rgb(var(--panel)/0.45)]'}`}><span className="truncate">{entry.name}</span><span className={entry.percent > 10 ? 'font-black text-amber-300' : 'text-muted'}>{entry.percent.toFixed(1)}%</span></div>)}</div> : <p className="mt-2 text-[10.5px] text-muted">Windows did not expose GPU engine counters on this PC. NEO-LIB leaves the value unknown instead of guessing.</p>}
        </section>
        <WindowsGamingSettings settings={data?.settings || {}} />
      </>}
    </div>
    {closing && <ConfirmProcess process={closing} onCancel={() => setClosing(null)} onConfirm={closeProcess} />}
  </motion.div>;
}

function ProcessList({ title, icon, entries, metric, warn, onClose }) {
  return <section className="overflow-hidden rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.28)]"><header className="flex items-center gap-2 border-b border-[rgb(var(--border)/0.7)] px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.16em] text-muted">{icon}{title}</header><div className="divide-y divide-[rgb(var(--border)/0.45)]">{entries.map((item) => <div key={`${title}-${item.pid}`} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 px-3 py-2"><div className="min-w-0"><p className="truncate text-[11px] font-bold" title={item.path || item.name}>{item.name}</p><p className="text-[8.5px] text-muted">PID {item.pid}{item.protected ? ' · Windows protected' : ''}</p></div><span className={`text-[10.5px] font-black ${warn(item) ? 'text-amber-300' : 'text-emerald-300'}`}>{metric(item)}</span>{item.protected ? <ShieldCheck size={13} className="text-muted" /> : <button onClick={() => onClose(item)} className="rounded-md border border-red-400/20 px-2 py-1 text-[9px] font-bold text-red-300 hover:bg-red-400/10">Exit</button>}</div>)}{!entries.length && <p className="p-3 text-[10px] text-muted">No process data available.</p>}</div></section>;
}

function WindowsGamingSettings({ settings }) {
  const plan = String(settings.powerPlan || 'Unknown');
  const cards = [
    { label: 'Game Mode', status: settings.gameMode || 'unknown', good: settings.gameMode !== 'off', route: 'ms-settings:gaming-gamemode', pro: 'Prioritizes game responsiveness and reduces disruptive background activity.', con: 'Usually beneficial; rare older games or capture setups may prefer it off.' },
    { label: 'GPU scheduling', status: settings.hags || 'unknown', good: settings.hags === 'on', route: 'ms-settings:display-advancedgraphics', pro: 'Can reduce scheduling overhead and latency on supported GPUs.', con: 'Results vary by driver and game; a restart is required after changing it.' },
    { label: 'Background capture', status: settings.backgroundCapture || 'unknown', good: settings.backgroundCapture === 'off', route: 'ms-settings:gaming-captures', pro: 'Turning background recording off can save disk writes and some GPU/CPU time.', con: 'You lose automatic recording of the previous moments of gameplay.' },
    { label: 'Power plan', status: /high performance|ultimate performance/i.test(plan) ? 'performance' : /power saver/i.test(plan) ? 'power saver' : 'balanced', good: !/power saver/i.test(plan), route: 'ms-settings:powersleep', pro: 'Balanced is sensible for most desktops; performance plans reduce aggressive power saving.', con: 'Performance modes use more electricity, create heat, and reduce laptop battery life.' },
  ];
  return <section><div className="mb-2 flex items-end justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-[rgb(var(--accent))]">Windows gaming checks</p><p className="mt-1 text-[10px] text-muted">Open the real Windows page to make a change. NEO-LIB records no hidden tweaks.</p></div>{settings.pendingRestart && <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-2 py-1 text-[9px] font-bold text-amber-300">Restart pending</span>}</div><div className="grid gap-2 sm:grid-cols-2">{cards.map((card) => <div key={card.label} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.46)] p-3"><div className="flex items-center justify-between gap-2"><span className="flex items-center gap-1.5 text-[11px] font-black"><MonitorCog size={13} className="text-[rgb(var(--accent))]" />{card.label}</span><span className={`rounded-full px-2 py-0.5 text-[8.5px] font-black uppercase ${card.good ? 'bg-emerald-400/10 text-emerald-300' : 'bg-amber-300/10 text-amber-300'}`}>{card.status}</span></div><p className="mt-2 text-[9.5px] leading-relaxed text-muted"><b className="text-emerald-300">Pro:</b> {card.pro}</p><p className="mt-1 text-[9.5px] leading-relaxed text-muted"><b className="text-amber-300">Trade-off:</b> {card.con}</p><button onClick={() => window.api?.openExternal?.(card.route)} className="mt-2 inline-flex items-center gap-1 text-[9.5px] font-bold text-[rgb(var(--accent-2))] hover:underline"><Settings2 size={11} /> Open Windows setting</button></div>)}</div></section>;
}

function ConfirmProcess({ process: item, onCancel, onConfirm }) {
  return <div className="absolute inset-0 z-40 grid place-items-center bg-black/70 p-5 backdrop-blur-sm"><div className="w-full max-w-sm rounded-2xl border border-red-400/30 bg-[rgb(var(--panel))] p-5 shadow-2xl"><AlertTriangle size={24} className="text-amber-300" /><h3 className="mt-3 text-base font-black">Exit {item.name}?</h3><p className="mt-2 text-[11px] leading-relaxed text-muted">Unsaved work in this program may be lost. NEO-LIB sends a normal close request for the exact process from the fresh scan and will not force-kill it if Windows refuses.</p>{item.error && <p className="mt-2 text-[10px] text-red-300">{item.error}</p>}<div className="mt-4 flex justify-end gap-2"><button onClick={onCancel} className="rounded-lg hairline px-3 py-2 text-[10px] text-muted">Cancel</button><button onClick={onConfirm} className="rounded-lg bg-red-500 px-3 py-2 text-[10px] font-black text-white">Exit program</button></div></div></div>;
}

function JunkView({ games, onBack, onSummary }) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [reviewed, setReviewed] = React.useState(() => new Set());
  const [selected, setSelected] = React.useState(() => new Set());
  const [confirmStage, setConfirmStage] = React.useState(0);
  const [typed, setTyped] = React.useState('');
  const scan = React.useCallback(async () => {
    setLoading(true); setError(''); setReviewed(new Set()); setSelected(new Set()); setConfirmStage(0);
    try {
      const payload = { games: (games || []).map(({ id, name, exePath, saveFolder }) => ({ id, name, exePath, saveFolder })) };
      const result = await window.api?.scanSafeJunk?.(payload);
      if (!result?.ok) throw new Error(result?.error || 'Junk scan failed.');
      setData(result); onSummary(`Found ${result.items?.length || 0} reviewable files · nothing removed`);
    } catch (e) { setError(e?.message || 'Junk scan failed.'); }
    finally { setLoading(false); }
  }, [games, onSummary]);
  React.useEffect(() => { scan(); }, [scan]);
  const items = data?.items || [];
  const selectedItems = items.filter((item) => selected.has(item.token));
  const selectedBytes = selectedItems.reduce((sum, item) => sum + item.bytes, 0);
  const toggleReviewed = (token) => setReviewed((current) => { const next = new Set(current); if (next.has(token)) { next.delete(token); setSelected((chosen) => { const copy = new Set(chosen); copy.delete(token); return copy; }); } else next.add(token); return next; });
  const toggleSelected = (token) => { if (!reviewed.has(token)) return; setSelected((current) => { const next = new Set(current); if (next.has(token)) next.delete(token); else next.add(token); return next; }); };
  const trash = async () => {
    const result = await window.api?.trashSafeJunk?.({ tokens: selectedItems.map((item) => item.token) });
    const count = result?.trashed?.length || 0;
    const reclaimed = Number(result?.reclaimedBytes || 0);
    onSummary(`Moved ${count} file${count === 1 ? '' : 's'} (${formatBytes(reclaimed)}) to Recycle Bin`);
    setData((current) => ({ ...current, items: (current?.items || []).filter((item) => !(result?.trashed || []).some((done) => done.token === item.token)) }));
    setSelected(new Set()); setReviewed(new Set()); setConfirmStage(0); setTyped('');
    if (result?.failed?.length) setError(`${result.failed.length} file(s) changed or could not be moved. They were left in place.`);
  };
  return <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}>
    <SubHeader icon={<HardDrive size={18} />} title="Safe junk review" subtitle="Inspect first · exact files only · Recycle Bin recovery" onBack={onBack} action={<button onClick={scan} disabled={loading} className="grid h-9 w-9 place-items-center rounded-lg hairline text-muted hover:text-ink" title="Scan again"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /></button>} />
    <div className="space-y-4 p-5">
      <Notice tone="safe"><ShieldCheck size={14} /> The scan is limited to known Windows temp/crash locations and folders beside games already configured in NEO-LIB. It never scans whole drives or deletes folders.</Notice>
      {error && <Notice tone="danger">{error}</Notice>}
      {loading && !data ? <LoadingPower text="Checking bounded cache and game-adjacent locations…" /> : <>
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.3)] px-4 py-3"><div><p className="text-[12px] font-black">{items.length} file{items.length === 1 ? '' : 's'} to inspect · {formatBytes(data?.totalBytes)}</p><p className="mt-0.5 text-[9.5px] text-muted">Large archives/installers are suggestions, not proof of junk. Open their folder and identify them yourself.</p></div><span className="rounded-full bg-[rgb(var(--accent)/0.1)] px-2 py-1 text-[9px] font-bold text-[rgb(var(--accent))]">{data?.visited || 0} bounded entries checked</span></div>
        <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">{items.map((item) => <div key={item.token} className={`rounded-xl border p-3 ${selected.has(item.token) ? 'border-[rgb(var(--accent)/0.55)] bg-[rgb(var(--accent)/0.08)]' : 'border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.4)]'}`}><div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"><div className="min-w-0"><p className="truncate text-[11px] font-bold" title={item.path}>{item.name}</p><p className="mt-0.5 truncate text-[9px] text-muted" title={item.folder}>{item.folder}</p><div className="mt-1.5 flex flex-wrap gap-1.5"><span className="rounded bg-black/20 px-1.5 py-0.5 text-[8.5px] text-muted">{item.kind}</span><span className="rounded bg-black/20 px-1.5 py-0.5 text-[8.5px] font-bold text-amber-300">{formatBytes(item.bytes)}</span><span className="rounded bg-black/20 px-1.5 py-0.5 text-[8.5px] text-muted">{new Date(item.modifiedAt).toLocaleDateString()}</span></div></div><button onClick={() => window.api?.openContainingDir?.(item.path)} className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg hairline px-2 text-[9.5px] font-bold text-[rgb(var(--accent-2))]"><FolderOpen size={12} /> Open folder</button></div><div className="mt-2 flex flex-wrap items-center gap-3 border-t border-[rgb(var(--border)/0.45)] pt-2"><label className="flex cursor-pointer items-center gap-1.5 text-[9.5px] text-muted"><input type="checkbox" checked={reviewed.has(item.token)} onChange={() => toggleReviewed(item.token)} /> I physically inspected this file</label><label className={`ml-auto flex items-center gap-1.5 text-[9.5px] font-bold ${reviewed.has(item.token) ? 'cursor-pointer text-ink' : 'cursor-not-allowed text-muted/50'}`}><input type="checkbox" disabled={!reviewed.has(item.token)} checked={selected.has(item.token)} onChange={() => toggleSelected(item.token)} /> Move to Recycle Bin</label></div></div>)}{!items.length && <div className="grid min-h-40 place-items-center rounded-xl border border-dashed border-emerald-400/25 text-center"><div><CheckCircle2 size={24} className="mx-auto text-emerald-300" /><p className="mt-2 text-[12px] font-black">No obvious leftovers found</p><p className="mt-1 text-[10px] text-muted">NEO-LIB did not broaden the scan just to produce a result.</p></div></div>}</div>
        <div className="sticky bottom-0 flex items-center justify-between gap-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.94)] p-3 backdrop-blur-xl"><div><p className="text-[11px] font-black">{selectedItems.length} reviewed · {formatBytes(selectedBytes)}</p><p className="text-[8.5px] text-muted">Two confirmations are required.</p></div><button disabled={!selectedItems.length} onClick={() => setConfirmStage(1)} className="rounded-lg bg-red-500 px-4 py-2 text-[10px] font-black text-white disabled:cursor-not-allowed disabled:opacity-35"><Trash2 size={12} className="mr-1 inline" /> Review removal</button></div>
      </>}
    </div>
    {confirmStage > 0 && <div className="absolute inset-0 z-40 grid place-items-center bg-black/75 p-5 backdrop-blur-sm"><div className="w-full max-w-md rounded-2xl border border-red-400/30 bg-[rgb(var(--panel))] p-5 shadow-2xl"><button onClick={() => { setConfirmStage(0); setTyped(''); }} className="float-right text-muted"><X size={15} /></button><AlertTriangle size={25} className="text-amber-300" /><h3 className="mt-3 text-base font-black">{confirmStage === 1 ? 'First check: are these truly disposable?' : 'Final check: move reviewed files?'}</h3>{confirmStage === 1 ? <><p className="mt-2 text-[11px] leading-relaxed text-muted">You selected {selectedItems.length} exact file(s), totaling {formatBytes(selectedBytes)}. Confirm that you opened their folders and checked they are not saves, mods, installers you need, or active game data.</p><div className="mt-4 flex justify-end gap-2"><button onClick={() => setConfirmStage(0)} className="rounded-lg hairline px-3 py-2 text-[10px] text-muted">Go back</button><button onClick={() => setConfirmStage(2)} className="rounded-lg bg-amber-400 px-3 py-2 text-[10px] font-black text-black">I inspected them</button></div></> : <><p className="mt-2 text-[11px] leading-relaxed text-muted">Files will go to the Windows Recycle Bin and may be recoverable until it is emptied. Type <b className="text-ink">RECYCLE</b> to authorize the exact files from this scan.</p><input value={typed} onChange={(event) => setTyped(event.target.value)} placeholder="Type RECYCLE" autoFocus className="mt-3 w-full rounded-lg hairline bg-[rgb(var(--surface)/0.45)] px-3 py-2 text-[12px] outline-none" /><div className="mt-4 flex justify-end gap-2"><button onClick={() => setConfirmStage(1)} className="rounded-lg hairline px-3 py-2 text-[10px] text-muted">Back</button><button disabled={typed.trim() !== 'RECYCLE'} onClick={trash} className="rounded-lg bg-red-500 px-3 py-2 text-[10px] font-black text-white disabled:opacity-35">Move to Recycle Bin</button></div></>}</div></div>}
  </motion.div>;
}

function LoadingPower({ text }) {
  return <div className="grid min-h-56 place-items-center"><div className="text-center"><motion.div animate={{ rotate: 360, scale: [1, 1.15, 1] }} transition={{ rotate: { duration: 1.8, repeat: Infinity, ease: 'linear' }, scale: { duration: 1, repeat: Infinity } }} className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-[rgb(var(--accent)/0.4)] text-[rgb(var(--accent))]"><Gamepad2 size={24} /></motion.div><p className="mt-4 text-[11px] font-bold text-muted">{text}</p></div></div>;
}

function Notice({ children, tone = 'safe' }) {
  return <div className={`flex items-start gap-2 rounded-xl border p-3 text-[10.5px] leading-relaxed ${tone === 'danger' ? 'border-red-400/25 bg-red-400/[0.07] text-red-200' : 'border-emerald-400/20 bg-emerald-400/[0.06] text-muted'}`}>{children}</div>;
}
