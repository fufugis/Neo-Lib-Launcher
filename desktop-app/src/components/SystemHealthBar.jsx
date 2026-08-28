import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronUp, CircleAlert, CircleCheck, Gauge, MemoryStick, RefreshCw } from 'lucide-react';

const POLL_INTERVAL_MS = 5_000;

function usageLevel(value) {
  if (!Number.isFinite(value)) return 'checking';
  if (value >= 80) return 'high';
  if (value >= 50) return 'medium';
  return 'low';
}

function readiness(health) {
  const cpu = health?.cpuPercent;
  const ram = health?.ramPercent;
  if (!Number.isFinite(cpu) || !Number.isFinite(ram)) return 'checking';
  if (cpu >= 80 || ram >= 80) return 'high';
  if (cpu >= 50 || ram >= 50) return 'check';
  return 'ready';
}

const STATUS = {
  checking: { title: 'CHECKING PC', color: '#93a4bd', Icon: RefreshCw },
  ready: { title: 'GAME READY', color: '#4ade80', Icon: CircleCheck },
  check: { title: 'CHECK YOUR PC', color: '#fbbf24', Icon: CircleAlert },
  high: { title: 'HIGH USAGE', color: '#fb4b5c', Icon: CircleAlert },
};

/** Full-width Library footer overlay. It intentionally sits above the game rows. */
export default function SystemHealthBar() {
  const [open, setOpen] = React.useState(false);
  const [health, setHealth] = React.useState(null);
  const [failed, setFailed] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const refresh = React.useCallback(async () => {
    if (!window.api?.getSystemHealth) {
      setFailed(true);
      return;
    }
    setLoading(true);
    try {
      const result = await window.api.getSystemHealth();
      setHealth(result || null);
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const state = failed ? 'checking' : readiness(health);
  const config = STATUS[state];
  const StatusIcon = config.Icon;
  const cpuLevel = usageLevel(health?.cpuPercent);
  const ramLevel = usageLevel(health?.ramPercent);
  const pulseClass = state === 'check' || state === 'high' ? 'motion-safe:animate-pulse' : '';
  const tips = [];
  if (cpuLevel === 'high') tips.push('CPU is very busy. Pause downloads, updates, or heavy background apps before launching.');
  else if (cpuLevel === 'medium') tips.push('CPU use is elevated. Check browser tabs, updates, and launchers running in the background.');
  if (ramLevel === 'high') tips.push('RAM is nearly full. Close memory-heavy apps to help avoid stutter.');
  else if (ramLevel === 'medium') tips.push('RAM use is elevated. Closing a few background apps will leave more room for your game.');
  if (!tips.length && state === 'ready') tips.push('Your current CPU and RAM use look comfortable for launching a game.');
  if (failed) tips.push('The local system check is unavailable right now. Try refresh in the desktop app.');

  return (
    <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-40" data-testid="system-health-footer">
      <AnimatePresence>
        {open && (
          <motion.section
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={{ duration: 0.16, ease: 'easeOut' }}
            className="pointer-events-auto absolute bottom-full left-2 right-2 mb-2 overflow-hidden rounded-xl border border-[rgb(var(--border))] glass-strong shadow-2xl"
            data-testid="system-health-details"
          >
            <header className="flex items-center justify-between gap-3 border-b border-[rgb(var(--border)/0.75)] px-3 py-2.5">
              <div className="flex min-w-0 items-center gap-2">
                <StatusIcon size={16} style={{ color: config.color }} className={pulseClass} />
                <div className="min-w-0"><h2 className="text-xs font-black tracking-[0.12em]">{config.title}</h2><p className="text-[10px] text-muted">Local, read-only check · refreshes every 5 seconds</p></div>
              </div>
              <button onClick={refresh} className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted hover:bg-panel hover:text-ink" title="Refresh system check"><RefreshCw size={13} className={loading ? 'animate-spin' : ''} /></button>
            </header>
            <div className="grid gap-2 p-3 min-[330px]:grid-cols-2"><Metric icon={<Gauge size={14} />} label="CPU" value={health?.cpuPercent} level={cpuLevel} /><Metric icon={<MemoryStick size={14} />} label="RAM" value={health?.ramPercent} level={ramLevel} detail={health ? `${health.memoryUsedGb} / ${health.memoryTotalGb} GB used` : ''} /></div>
            <div className="border-t border-[rgb(var(--border)/0.75)] bg-[rgb(var(--surface)/0.28)] px-3 py-2.5"><p className="text-[10.5px] leading-relaxed text-muted">{tips.map((tip) => <span key={tip} className="block">• {tip}</span>)}</p></div>
          </motion.section>
        )}
      </AnimatePresence>
      <button
        type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}
        className="pointer-events-auto flex w-full flex-wrap items-center gap-x-3 gap-y-1 border-t border-[rgb(var(--border)/0.8)] px-3 py-2.5 text-left backdrop-blur-xl transition-colors hover:bg-[rgb(var(--surface)/0.68)]"
        style={{ background: 'linear-gradient(90deg, rgb(var(--surface)/0.94) 0%, rgb(var(--panel)/0.84) 55%, rgb(var(--surface)/0.94) 100%)' }} title="Open Game Ready details"
      >
        <span className={`flex shrink-0 items-center gap-2 text-[11px] font-black tracking-[0.13em] ${pulseClass}`} style={{ color: config.color }}><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: config.color, boxShadow: `0 0 10px ${config.color}` }} />{config.title}</span>
        <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-0.5 text-[10.5px] text-muted"><span className="whitespace-nowrap">CPU <UsageText level={cpuLevel} value={health?.cpuPercent} /></span><span className="hidden text-muted/45 min-[260px]:inline">·</span><span className="whitespace-nowrap">RAM <UsageText level={ramLevel} value={health?.ramPercent} /></span></span>
        <ChevronUp size={15} className={`shrink-0 text-muted transition-transform ${open ? '' : 'rotate-180'}`} />
      </button>
    </div>
  );
}

function UsageText({ level, value }) {
  const colors = { low: 'text-emerald-400', medium: 'text-amber-300', high: 'text-red-400', checking: 'text-muted' };
  const labels = { low: 'Low', medium: 'Medium', high: 'High', checking: 'Checking' };
  return <span className={`font-bold ${colors[level]}`}>{labels[level]}{Number.isFinite(value) ? ` (${value}%)` : ''}</span>;
}

function Metric({ icon, label, value, level, detail = '' }) {
  const colors = { low: '#4ade80', medium: '#fbbf24', high: '#fb4b5c', checking: '#93a4bd' };
  return <div className="rounded-lg border border-[rgb(var(--border)/0.75)] bg-[rgb(var(--surface)/0.38)] p-2.5"><div className="flex items-center justify-between gap-2 text-[10px] font-bold text-muted"><span className="flex items-center gap-1.5">{icon}{label}</span><UsageText level={level} value={value} /></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/25"><span className="block h-full rounded-full transition-all duration-500" style={{ width: `${Number.isFinite(value) ? value : 0}%`, background: colors[level] }} /></div>{detail && <p className="mt-1.5 text-[9.5px] text-muted">{detail}</p>}</div>;
}
