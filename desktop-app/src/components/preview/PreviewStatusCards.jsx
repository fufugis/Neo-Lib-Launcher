import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Download, ExternalLink, Wrench } from 'lucide-react';
import UpdateHistoryModal from '../UpdateHistoryModal';
import { manifestPresentation, newsAgeLabel, updatePresentation } from './preview-status-model.mjs';

export function SteamManifestLine({ game }) {
  const [info, setInfo] = React.useState(null);
  const [state, setState] = React.useState('idle'); // 'idle' | 'loading' | 'ok' | 'none'

  React.useEffect(() => {
    let alive = true;
    setInfo(null); setState('idle');
    if (!game || game.source !== 'steam' || !game.appid) return () => { alive = false; };
    if (!(typeof window !== 'undefined' && window.api?.getSteamManifest)) return () => { alive = false; };
    setState('loading');
    window.api.getSteamManifest(game.appid).then((res) => {
      if (!alive) return;
      if (res?.ok && (res.buildid || res.lastUpdated)) {
        setInfo(res); setState('ok');
      } else {
        setState('none');
      }
    }).catch(() => { if (alive) setState('none'); });
    return () => { alive = false; };
  }, [game?.id, game?.appid, game?.source]);

  if (state !== 'ok' || !info) return null;

  const { updated, size: sizeStr } = manifestPresentation(info);

  return (
    <div
      className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]"
      data-testid="steam-manifest-line"
    >
      {updated && (
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 hairline bg-panel/40"
          style={{ color: 'rgb(var(--accent-2))' }}
          title={new Date(info.lastUpdated).toLocaleString()}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'rgb(var(--accent-2))' }} />
          Updated {updated}
        </span>
      )}
      {info.buildid && (
        <span className="font-mono text-muted">Build <span className="text-ink">{info.buildid}</span></span>
      )}
      {sizeStr && (
        <span className="font-mono text-muted">· {sizeStr} on disk</span>
      )}
    </div>
  );
}



export function LatestNewsPill({ game }) {
  const [item, setItem] = React.useState(null);
  const [expanded, setExpanded] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    setItem(null); setExpanded(false);
    if (!game) return () => { alive = false; };
    // The per-game latest-news pill follows the same all-launcher policy as
    // Home: named local and launcher-owned entries may use public discovery.
    const eligible = String(game.name || '').trim();
    if (!eligible) return () => { alive = false; };
    if (!(typeof window !== 'undefined' && window.api?.latestNewsForGame)) return () => { alive = false; };
    window.api.latestNewsForGame({
      id: game.id, appid: game.appid, gogId: game.gogId,
      website: game.website, source: game.source, launcher: game.launcher, name: game.name,
    }).then((res) => {
      if (!alive) return;
      if (res?.ok && res.item) setItem(res.item);
    }).catch(() => {});
    return () => { alive = false; };
  }, [game?.id, game?.appid, game?.gogId, game?.website, game?.launcher, game?.source, game?.name]);

  if (!item) return null;

  const timeStr = newsAgeLabel(item.date);
  const platformLabel = { steam: 'Steam', itch: 'itch.io', gog: 'GOG', 'official-web': 'Official site', web: 'Web discovery' }[item.platform] || 'News';
  const visual = item.image || game.headerImage || game.background || game.hero || game.screenshots?.[0] || game.coverUrl || game.cover || '';

  const openLink = (e) => {
    e.stopPropagation();
    if (!item.url) return;
    if (typeof window !== 'undefined' && window.api?.openExternal) window.api.openExternal(item.url);
    else window.open(item.url, '_blank');
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      onClick={() => setExpanded((v) => !v)}
      className="group relative mb-4 cursor-pointer overflow-hidden rounded-xl"
      style={{
        border: '1.5px solid rgb(var(--accent)/0.55)',
        background:
          'linear-gradient(135deg, rgb(var(--accent)/0.14) 0%, rgb(var(--accent-2)/0.10) 100%)',
        boxShadow: expanded
          ? '0 0 30px -4px rgb(var(--accent)/0.75), inset 0 1px 0 rgb(255,255,255,0.08)'
          : '0 0 18px -4px rgb(var(--accent)/0.55), inset 0 1px 0 rgb(255,255,255,0.06)',
      }}
      data-testid="latest-news-pill"
    >
      {/* Border pulse — animated gradient outline draws attention */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-xl"
        animate={{ opacity: [0.35, 0.75, 0.35] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          boxShadow: 'inset 0 0 0 1.5px rgb(var(--accent))',
        }}
      />
      {/* Shimmer sweep — a diagonal light beam that crosses the pill every 5s */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-12"
        initial={{ x: '-120%' }}
        animate={{ x: '380%' }}
        transition={{ duration: 3.4, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgb(255,255,255,0.10) 50%, transparent 100%)',
        }}
      />
      <div className="relative flex items-center gap-3 px-4 py-3">
        {visual && <div className="h-14 w-24 shrink-0 overflow-hidden rounded-lg border border-[rgb(var(--accent)/0.28)] bg-black/25 shadow-lg"><img src={visual} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" onError={(event) => { event.currentTarget.parentElement.style.display = 'none'; }} /></div>}
        {/* Left rail — big pulsing indicator + LIVE label */}
        <div className="flex shrink-0 items-center gap-2.5">
          <motion.span
            animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.35, 1] }}
            transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-block h-3 w-3 rounded-full"
            style={{
              backgroundColor: 'rgb(var(--accent))',
              boxShadow: '0 0 14px rgb(var(--accent)), 0 0 28px rgb(var(--accent)/0.7)',
            }}
          />
          <div className="flex flex-col leading-tight">
            <span
              className="text-[10.5px] font-black uppercase tracking-[0.28em]"
              style={{
                color: 'rgb(var(--accent))',
                textShadow: '0 0 10px rgb(var(--accent)/0.7)',
              }}
            >
              Live news
            </span>
            <span className="text-[10px] text-muted">
              {platformLabel} · {timeStr}
            </span>
          </div>
        </div>

        {/* Divider */}
        <span className="h-9 w-px shrink-0" style={{ background: 'rgb(var(--accent)/0.35)' }} />

        {/* Title */}
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-[14.5px] font-bold text-ink leading-snug group-hover:text-[rgb(var(--accent))] transition-colors">
            {item.title}
          </h4>
          {!expanded && item.snippet && (
            <p className="mt-0.5 truncate text-[11.5px] text-muted leading-relaxed">
              {item.snippet}
            </p>
          )}
        </div>

        {/* Chevron */}
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full hairline"
          style={{ backgroundColor: 'rgb(var(--accent)/0.18)', color: 'rgb(var(--accent))' }}
        >
          <ChevronDown size={15} />
        </motion.div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 border-t" style={{ borderColor: 'rgb(var(--accent)/0.3)' }}>
              {visual && <img src={visual} alt="" className="mb-3 max-h-44 w-full rounded-lg object-cover" onError={(event) => { event.currentTarget.style.display = 'none'; }} />}
              {item.snippet && (
                <p className="text-[12.5px] leading-relaxed text-muted line-clamp-6">
                  {item.snippet}
                </p>
              )}
              <button
                onClick={openLink}
                data-testid="latest-news-open"
                className="mt-3 inline-flex items-center gap-1.5 rounded-md px-3 h-8 text-[11.5px] font-bold text-white"
                style={{
                  background: 'linear-gradient(135deg, rgb(var(--accent)) 0%, rgb(var(--accent-2)) 100%)',
                  boxShadow: '0 0 14px -4px rgb(var(--accent)/0.7)',
                }}
              >
                Read full on {platformLabel} <ExternalLink size={11} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ---------- Managed hardware utility setup ---------- */
export function ManagedToolSetup({ game, onLocate, onInstall, installing }) {
  if (!game?.managedTool) return null;
  const installed = game.availability === 'installed' && !!game.exePath;
  return (
    <motion.section
      initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
      className={`mb-4 overflow-hidden rounded-xl border ${installed ? 'border-emerald-400/28 bg-emerald-400/[0.06]' : 'border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.38)] opacity-85'}`}
      data-testid="managed-tool-setup"
    >
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <span className={`grid h-9 w-9 place-items-center rounded-lg ${installed ? 'bg-emerald-400/12 text-emerald-300' : 'bg-[rgb(var(--muted)/0.16)] text-muted'}`}><Wrench size={16} /></span>
        <div className="min-w-0 flex-1"><p className={`text-[10px] font-black uppercase tracking-[0.17em] ${installed ? 'text-emerald-300' : 'text-muted'}`}>{installed ? 'Ready to launch' : 'Not located yet'}</p><p className="mt-0.5 text-[11px] text-muted">{installed ? `Official utility linked · ${game.managedInstallMode === 'located' ? 'manual location confirmed' : 'managed tool ready'}` : 'Locate an existing copy, or let NEO-LIB download it from its official publisher.'}</p></div>
        {!installed && <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.38)] px-2 py-1 text-[9px] font-black text-muted">USE SET UP ABOVE</span>}
        {installed && <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-1 text-[9px] font-black text-emerald-300">INSTALLED</span>}
      </div>
    </motion.section>
  );
}

export function UpdateAvailablePill({ game }) {
  const [update, setUpdate] = React.useState(null);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [openError, setOpenError] = React.useState('');
  React.useEffect(() => {
    let alive = true;
    setUpdate(null);
    setOpenError('');
    if (game?.managedTool) return () => { alive = false; };
    if ((!game?.appid && !(game?.exePath || game?.installedVersion || game?.updateWatchUrl || game?.website)) || !window.api?.scanGameUpdates) return () => { alive = false; };
    window.api.scanGameUpdates({ games: [{ id: game.id, name: game.name, appid: game.appid, launcher: game.launcher, source: game.source, steamOwned: game.steamOwned, installedVersion: game.installedVersion, updateWatchUrl: game.updateWatchUrl, website: game.website, exePath: game.exePath }] })
      .then((result) => { if (alive) setUpdate(result?.items?.[0] || null); })
      .catch(() => {});
    return () => { alive = false; };
  }, [game?.id, game?.appid, game?.name, game?.launcher, game?.source, game?.installedVersion, game?.updateWatchUrl, game?.website, game?.exePath]);
  if (!update) return null;
  const { watchPage: isWatchPage, needsVersionCheck, remaining } = updatePresentation(update);
  const tone = needsVersionCheck ? {
    border: 'border-amber-300/45', bg: 'bg-amber-300/[0.08]', icon: 'bg-amber-300/15 text-amber-200', text: 'text-amber-200', shadow: 'rgb(251 191 36 / .78)',
  } : {
    border: 'border-emerald-400/40', bg: 'bg-emerald-400/[0.07]', icon: 'bg-emerald-400/15 text-emerald-300', text: 'text-emerald-300', shadow: 'rgb(52 211 153 / .85)',
  };
  const openUpdateAction = async () => {
    setOpenError('');
    if (isWatchPage) { setHistoryOpen(true); return; }
    const result = await window.api?.openLauncherDownloads?.(update.platform);
    if (!result?.ok) setOpenError(result?.error || 'The launcher Downloads page could not be opened.');
  };
  return <>
    <motion.button
      onClick={openUpdateAction}
      animate={{ opacity: [1, 0.78, 1], boxShadow: [`0 0 12px -4px ${tone.shadow}`, `0 0 28px 0px ${tone.shadow}`, `0 0 12px -4px ${tone.shadow}`] }}
      transition={{ duration: 2.2, repeat: Infinity }}
      className={`mb-4 flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left ${tone.border} ${tone.bg}`}
      data-testid="game-update-available"
    >
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${tone.icon}`}><Download size={16} /></span>
      <span className="min-w-0 flex-1"><span className={`block text-[10px] font-black uppercase tracking-[0.22em] ${tone.text}`}>{needsVersionCheck ? 'Possible update · comparison needed' : `New update · ${update.platform}`}</span><span className="mt-0.5 block text-[12px] font-bold text-ink">{needsVersionCheck ? `Latest public version ${update.latestVersion} found` : isWatchPage ? `Version ${remaining} available` : `${remaining} remains in the launcher queue`}</span><span className="mt-0.5 block text-[10.5px] text-muted">{needsVersionCheck ? update.currentVersion && update.currentVersion !== 'Unknown' ? `NEO-LIB found ${update.currentVersion} in the Windows executable, but needs stronger game-owned evidence before comparing it. Open patch history.` : 'NEO-LIB could not read this local build version yet. Open patch history to compare it safely.' : `There is a new update for this game you might want to check out${update.installedVersionEvidence ? ` · local version found in ${update.installedVersionEvidence}` : ''}.`}</span></span>
      <span className={`shrink-0 text-[10px] font-bold ${tone.text}`}>{isWatchPage ? 'Patch history' : 'Open downloads'} ↗</span>
    </motion.button>
    {openError && <p role="status" className="-mt-2 mb-3 rounded-lg border border-amber-300/30 bg-amber-300/[0.08] px-3 py-2 text-[10px] font-bold text-amber-200">{openError}</p>}
    <UpdateHistoryModal item={historyOpen ? update : null} onClose={() => setHistoryOpen(false)} />
  </>;
}
