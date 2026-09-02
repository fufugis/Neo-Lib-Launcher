import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CircleAlert, ExternalLink, FolderSearch, Gamepad2, RefreshCw, X } from 'lucide-react';

const PLATFORMS = [
  { id: 'steam', label: 'Steam', short: 'S' },
  { id: 'battlenet', label: 'Battle.net', short: 'B' },
  { id: 'epic', label: 'Epic', short: 'E' },
  { id: 'ea', label: 'EA app', short: 'EA' },
  { id: 'ubisoft', label: 'Ubisoft Connect', short: 'U' },
];

/** Privacy-first launcher hub: local status detection and native client handoff only. */
export default function FriendsPanel({ manualPaths = {}, onUpdateManualPaths, resting = false, variant = 'titlebar' }) {
  const [open, setOpen] = React.useState(false);
  const [filter, setFilter] = React.useState('all');
  const [clients, setClients] = React.useState({});
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const rootRef = React.useRef(null);

  const refresh = React.useCallback(async (paths = manualPaths) => {
    if (!window.api?.inspectSocialClients) return;
    setLoading(true);
    try { setClients((await window.api.inspectSocialClients(paths)) || {}); }
    catch { setMessage('Could not check launcher status right now. Try Rescan.'); }
    finally { setLoading(false); }
  }, [manualPaths]);

  React.useEffect(() => {
    if (!open || resting) return undefined;
    setMessage('');
    refresh();
    const timer = window.setInterval(refresh, 15_000);
    return () => window.clearInterval(timer);
  }, [open, refresh, resting]);

  React.useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => { if (!rootRef.current?.contains(event.target)) setOpen(false); };
    const onKeyDown = (event) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('mousedown', onPointerDown); document.removeEventListener('keydown', onKeyDown); };
  }, [open]);

  const visiblePlatforms = filter === 'all' ? PLATFORMS : PLATFORMS.filter((platform) => platform.id === filter);
  const runningCount = PLATFORMS.filter((platform) => clients[platform.id]?.running).length;

  const openNativeClient = async (platform) => {
    setMessage('');
    try {
      const result = await window.api?.openLauncherSocial?.(platform.id, manualPaths[platform.id]);
      setMessage(result?.ok ? `${platform.label} opened.` : (result?.error || `${platform.label} could not be opened.`));
    } catch { setMessage(`${platform.label} could not be opened.`); }
  };

  const locateClient = async (platform) => {
    const executable = await window.api?.pickSocialClient?.(platform.id);
    if (!executable) return;
    const next = { ...manualPaths, [platform.id]: executable };
    onUpdateManualPaths?.(next);
    setMessage(`${platform.label} saved locally. Checking it now…`);
    refresh(next);
  };

  const isFooter = variant === 'footer';

  return (
    <div ref={rootRef} className={`${isFooter ? 'relative' : variant === 'detail' ? 'relative w-full' : 'titlebar-nodrag relative'}`}>
      <button
        data-testid="friends-hub-button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className={`group ${variant === 'detail' ? 'flex h-11 w-full items-center justify-between rounded-lg px-3.5 text-xs' : isFooter ? 'inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[10.5px]' : 'inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[10.5px]'} border font-bold transition-all ${open ? 'border-[rgb(var(--accent-2)/0.85)] bg-[rgb(var(--accent)/0.15)] text-ink' : 'border-[rgb(var(--border))] bg-panel/45 text-muted hover:border-[rgb(var(--accent-2)/0.6)] hover:text-ink'}`}
        title="Launchers — inspect and open your installed game clients"
      >
        <Gamepad2 size={13} className="text-[rgb(var(--accent-2))]" />
        <span className={variant === 'detail' || isFooter ? 'inline' : 'hidden min-[960px]:inline'}>Launchers</span>
        {variant === 'detail' && <span className="ml-auto mr-2 text-[10px] font-medium text-muted">Check your running launchers</span>}
        <span className={`h-1.5 w-1.5 rounded-full ${runningCount ? 'bg-emerald-400 shadow-[0_0_7px_rgb(74_222_128/0.8)]' : 'bg-muted/60'}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.section
            initial={{ opacity: 0, y: -8, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -5, scale: 0.985 }} transition={{ duration: 0.16, ease: 'easeOut' }}
            data-testid="friends-hub-panel"
            className={`absolute right-0 z-[100] w-[min(500px,calc(100vw-24px))] overflow-hidden rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.88)] shadow-2xl backdrop-blur-xl ${variant === 'detail' || isFooter ? 'bottom-[calc(100%+8px)]' : 'top-9'}`}
          >
            <header className="flex items-center justify-between border-b border-[rgb(var(--border)/0.8)] px-5 py-3.5">
              <div>
                <div className="flex items-center gap-2">
                  <Gamepad2 size={17} className="text-[rgb(var(--accent-2))]" />
                  <h2 className="text-[15px] font-black tracking-tight">Launchers</h2>
                  <span className="rounded-full bg-[rgb(var(--accent)/0.16)] px-2 py-0.5 text-[10px] font-bold text-[rgb(var(--accent-2))]">{loading ? 'checking' : `${runningCount} running`}</span>
                </div>
                <p className="mt-0.5 text-[11px] text-muted">Clients are checked locally when you open this panel.</p>
              </div>
              <div className="flex items-center gap-1">
                <button data-testid="friends-hub-refresh" onClick={() => refresh()} className="grid h-7 w-7 place-items-center rounded-md text-muted transition-colors hover:bg-panel hover:text-ink" title="Rescan game clients"><RefreshCw size={13} className={loading ? 'animate-spin' : ''} /></button>
                <button onClick={() => setOpen(false)} className="grid h-7 w-7 place-items-center rounded-md text-muted transition-colors hover:bg-panel hover:text-ink" aria-label="Close Launchers"><X size={15} /></button>
              </div>
            </header>
            <div className="flex gap-1 overflow-x-auto border-b border-[rgb(var(--border)/0.7)] px-4 py-2.5 scrollbar-none">
              <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>All</FilterButton>
              {PLATFORMS.map((platform) => <FilterButton key={platform.id} active={filter === platform.id} onClick={() => setFilter(platform.id)}>{platform.label.replace(' Connect', '').replace(' app', '')}</FilterButton>)}
            </div>
            <div className="max-h-[min(500px,calc(100vh-112px))] overflow-y-auto p-2.5">
              {visiblePlatforms.map((platform) => <PlatformRow key={platform.id} platform={platform} client={clients[platform.id]} onOpen={() => openNativeClient(platform)} onLocate={() => locateClient(platform)} />)}
            </div>
            <footer className="border-t border-[rgb(var(--border)/0.7)] bg-[rgb(var(--surface)/0.38)] px-5 py-3 text-[11px] leading-relaxed text-muted">
              {resting ? 'Rest Mode is active while a game is running. Launcher checks are paused until it closes.' : (message || 'NEO-LIB only checks ordinary local client status and opens the original launcher. It never reads accounts, friends, or chats.')}
            </footer>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterButton({ active, children, onClick }) {
  return <button onClick={onClick} className={`shrink-0 rounded-md border px-2.5 py-1.5 text-[10.5px] font-semibold transition-colors ${active ? 'border-[rgb(var(--accent-2)/0.8)] bg-[rgb(var(--accent)/0.15)] text-ink' : 'border-[rgb(var(--border)/0.8)] text-muted hover:border-[rgb(var(--accent)/0.55)] hover:text-ink'}`}>{children}</button>;
}

function PlatformRow({ platform, client, onOpen, onLocate }) {
  const state = client?.running ? 'running' : client?.installed ? 'installed' : client?.savedPathMissing ? 'attention' : 'missing';
  const copy = {
    running: ['Running', 'Open launcher', 'Open this launcher normally.'],
    installed: ['Installed · not running', 'Start launcher', 'Open the installed launcher normally.'],
    attention: ['Saved path needs attention', 'Locate again', 'The previously selected executable is no longer available.'],
    missing: ['Not detected', 'Locate client', 'Choose its executable once if it is installed somewhere custom.'],
  }[state];
  const active = state === 'running';
  return (
    <div className="group flex items-center gap-3.5 rounded-lg px-3 py-3.5 transition-colors hover:bg-[rgb(var(--accent)/0.07)]">
      <div className="relative grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.65)] text-[10.5px] font-black text-[rgb(var(--accent-2))]">
        {platform.short}<span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[rgb(var(--panel))] ${active ? 'bg-emerald-400' : state === 'attention' ? 'bg-amber-400' : 'bg-muted/60'}`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2"><span className="truncate text-[13px] font-bold">{platform.label}</span><span className={`text-[10.5px] font-medium ${active ? 'text-emerald-400' : state === 'attention' ? 'text-amber-300' : 'text-muted'}`}>{copy[0]}</span></div>
        <p className="mt-0.5 truncate text-[10.5px] text-muted">{copy[2]}</p>
      </div>
      {state === 'running' || state === 'installed' ? (
        <button data-testid={`friends-hub-open-${platform.id}`} onClick={onOpen} className="inline-flex shrink-0 items-center gap-1 rounded-md border border-[rgb(var(--border))] px-2.5 py-1.5 text-[10.5px] font-bold text-muted transition-colors hover:border-[rgb(var(--accent-2)/0.65)] hover:bg-[rgb(var(--accent)/0.12)] hover:text-ink"><ExternalLink size={11} />{copy[1]}</button>
      ) : (
        <button data-testid={`friends-hub-locate-${platform.id}`} onClick={onLocate} className="inline-flex shrink-0 items-center gap-1 rounded-md border border-[rgb(var(--border))] px-2.5 py-1.5 text-[10.5px] font-bold text-muted transition-colors hover:border-[rgb(var(--accent-2)/0.65)] hover:bg-[rgb(var(--accent)/0.12)] hover:text-ink">{state === 'attention' ? <CircleAlert size={11} /> : <FolderSearch size={11} />}{copy[1]}</button>
      )}
    </div>
  );
}
