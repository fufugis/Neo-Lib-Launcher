import React from 'react';
import { motion } from 'framer-motion';
import { ArchiveRestore, ChevronDown, Download, FileText, FolderOpen, Play, RefreshCw, Tag, Wand2, Wrench, Youtube } from 'lucide-react';
import { cn, colorFromId } from '../../lib/utils';
import { hoverThrottled, playLaunch } from '../../lib/sound';
import { renderForegroundPortal } from '../ui/VisualBoundary';
import { normalizeLaunchRoutes } from '../../lib/game-launch-routes-model.mjs';
import { stockThemeAssetUrl, customThemeManifest } from '../../themes/stock-theme-registry.mjs';

function openSearch(query, engine = 'google') {
  const url = engine === 'youtube'
    ? 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query)
    : 'https://www.google.com/search?q=' + encodeURIComponent(query);
  if (typeof window !== 'undefined' && window.api?.openExternal) window.api.openExternal(url);
  else window.open(url, '_blank');
}

/* ---------- Action bar ---------- */
export default function PreviewActionBar({ game, categories, onLaunch, onLaunchError, onRefetch, onRevealFolder, onToggleCategory, onCustomize, onOpenSaveManager, onLocateManagedTool, onInstallManagedTool, managedToolInstalling, fetching, settings = {} }) {
  const [catOpen, setCatOpen] = React.useState(false);
  const [routeOpen, setRouteOpen] = React.useState(false);
  const [routeAnchor, setRouteAnchor] = React.useState(null);
  const [catAnchor, setCatAnchor] = React.useState(null);
  const popRef = React.useRef(null);
  React.useEffect(() => {
    const close = (e) => popRef.current && !popRef.current.contains(e.target) && setCatOpen(false);
    if (catOpen) document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [catOpen]);
  const launchWithSafety = React.useCallback(async (target, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const launchOrigin = { x: rect.left + (rect.width / 2), y: rect.top + (rect.height / 2) };
    if (!window.api?.armGameLaunch) {
      if (settings.soundsEnabled !== false) playLaunch();
      onLaunch(target, '', launchOrigin);
      return;
    }
    const armed = await window.api.armGameLaunch();
    if (!armed?.ok) { onLaunchError?.(armed?.error || 'Launch safety could not verify that click. Please try again.'); return; }
    if (settings.soundsEnabled !== false) playLaunch();
    onLaunch(target, armed.token, launchOrigin);
  }, [onLaunch, onLaunchError, settings.soundsEnabled]);
  const routes = React.useMemo(() => normalizeLaunchRoutes(game.launchRoutes).filter((route) => route.enabled && route.target), [game.launchRoutes]);
  const customControlFrame = String(settings.theme || '').startsWith('custom:') ? stockThemeAssetUrl(settings.theme, 'controlFrame') : '';

  return (
    <div className={`special-control-surface neolib-special-action-art relative z-10 flex flex-wrap items-center gap-3 border-y hairline px-6 py-3${customControlFrame ? ' custom-control-frame' : ''}`} style={{ backgroundColor: 'rgb(var(--surface) / 0.24)', backdropFilter: 'blur(8px) saturate(124%)' }}>
      {customControlFrame && <img src={customControlFrame} alt="" draggable={false} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full object-fill" style={{ opacity: 0.55 * (customThemeManifest(settings.theme)?.layers?.controlFrame?.opacity ?? 1) }} />}
      <motion.button
        data-testid="detail-launch-btn"
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.03 }}
        onMouseEnter={() => { if (settings.soundsEnabled !== false) hoverThrottled(); }}
        disabled={game.managedTool && game.availability !== 'installed'}
        data-neolib-launch="true"
        onClick={(event) => launchWithSafety(game, event)}
        className="neon group inline-flex items-center gap-2 rounded-full bg-[rgb(var(--accent))] px-5 py-2 text-[13px] font-bold tracking-wide text-[rgb(var(--surface))] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Play size={14} className="transition-transform group-hover:translate-x-0.5" />
        {game.managedTool && game.availability !== 'installed' ? 'SET UP REQUIRED' : 'LAUNCH'}
      </motion.button>
      {routes.length > 0 && <div className="relative">
        <button data-testid="detail-route-picker-btn" onClick={(event) => { const rect = event.currentTarget.getBoundingClientRect(); setRouteAnchor({ x: rect.left, y: rect.bottom + 4 }); setRouteOpen((open) => !open); }} className="grid h-9 w-9 place-items-center rounded-full hairline text-muted hover:border-[rgb(var(--accent)/0.58)] hover:text-ink" title="Choose launch route"><ChevronDown size={15} /></button>
        {routeOpen && routeAnchor && renderForegroundPortal(<div className="fixed z-[220] w-56 overflow-hidden rounded-xl hairline glass p-1 shadow-2xl" style={{ left: routeAnchor.x, top: routeAnchor.y }}>
          {routes.map((route) => <button key={route.id} data-neolib-launch="true" onClick={(event) => { setRouteOpen(false); launchWithSafety({ ...game, exePath: route.target, launchArgs: route.arguments || '', launchRouteId: route.id }, event); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-muted hover:bg-[rgb(var(--accent)/0.12)] hover:text-ink"><Play size={12} /><span className="truncate">{route.label}</span></button>)}
        </div>)}
      </div>}

      {game.managedTool && game.availability !== 'installed' && <ManagedToolMenu game={game} onLocate={onLocateManagedTool} onInstall={onInstallManagedTool} installing={managedToolInstalling} />}

      <div className="detail-action-menu flex flex-wrap items-center gap-1 rounded-xl border border-[rgb(var(--border)/0.75)] bg-[rgb(var(--surface)/0.45)] p-1" aria-label="Game actions">
      <button
        data-testid="detail-youtube-btn"
        onClick={() => openSearch(`${game.name} gameplay`, 'youtube')}
        title="Search YouTube for gameplay"
        className="inline-flex items-center gap-2 rounded-full hairline px-4 py-2 text-xs text-muted hover:text-[rgb(var(--accent-2))] hover:border-[rgb(var(--accent-2)/0.5)] transition-colors"
      >
        <Youtube size={13} />
        YouTube
      </button>

      <button
        data-testid="detail-patchnotes-btn"
        onClick={() => {
          const url = game.appid
            ? `https://store.steampowered.com/news/app/${game.appid}`
            : `https://www.google.com/search?q=${encodeURIComponent(game.name + ' patch notes')}`;
          if (typeof window !== 'undefined' && window.api?.openExternal) window.api.openExternal(url);
          else window.open(url, '_blank');
        }}
        title={game.appid ? 'Steam patch notes' : 'Search patch notes online'}
        className="inline-flex items-center gap-2 rounded-full hairline px-4 py-2 text-xs text-muted hover:text-[rgb(var(--accent-2))] hover:border-[rgb(var(--accent-2)/0.5)] transition-colors"
      >
        <FileText size={13} />
        Patch Notes
      </button>

      <button
        data-testid="detail-mods-btn"
        onClick={() => {
          const url = `https://www.nexusmods.com/games?keyword=${encodeURIComponent(game.name)}`;
          if (typeof window !== 'undefined' && window.api?.openExternal) window.api.openExternal(url);
          else window.open(url, '_blank');
        }}
        title="Find mods for this game on Nexus Mods"
        className="inline-flex items-center gap-2 rounded-full hairline px-4 py-2 text-xs text-muted hover:text-[rgb(var(--accent-2))] hover:border-[rgb(var(--accent-2)/0.5)] transition-colors"
      >
        <Wrench size={13} />
        Mods
      </button>

      <button
        data-testid="detail-customize-btn"
        onClick={() => onCustomize?.(game)}
        title="Open Game Workshop to edit artwork, launch routes, library status, and metadata"
        className="group inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold text-[rgb(var(--surface))] transition-all hover:scale-[1.04]"
        style={{
          backgroundImage: 'linear-gradient(135deg, rgb(var(--accent-2)) 0%, rgb(var(--accent)) 100%)',
          boxShadow: '0 0 14px -3px rgb(var(--accent) / 0.55)',
        }}
      >
        <Wand2 size={13} className="transition-transform group-hover:rotate-12" />
        Edit game
      </button>

      <button
        data-testid="detail-refetch-btn"
        onClick={() => onRefetch(game)}
        disabled={fetching}
        className="neon-cyan inline-flex items-center gap-2 rounded-full bg-panel/60 hairline px-4 py-2 text-xs text-ink hover:text-[rgb(var(--accent-2))] disabled:opacity-50 transition-colors"
      >
        <RefreshCw size={13} className={fetching ? 'animate-spin' : ''} />
        {fetching ? 'Fetching…' : 'Re-fetch info'}
      </button>

      <button
        data-testid="detail-reveal-btn"
        onClick={() => onRevealFolder(game)}
        className="inline-flex items-center gap-2 rounded-full hairline px-4 py-2 text-xs text-muted hover:text-ink hover:border-accent/40 transition-colors"
      >
        <FolderOpen size={13} />
        Locate
      </button>

      <button
        data-testid="detail-save-manager-btn"
        onClick={() => onOpenSaveManager?.(game)}
        title="Open save folder, create backups, or recover saves safely"
        className="inline-flex items-center gap-2 rounded-full hairline px-4 py-2 text-xs text-muted hover:text-ink hover:border-accent/40 transition-colors"
      >
        <ArchiveRestore size={13} />
        Save games
      </button>

      {/* Add to category dropdown — portal'd to escape backdrop stacking context */}
      <div className="relative" ref={popRef}>
        <button
          data-testid="detail-category-btn"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setCatAnchor({ x: r.left, y: r.bottom + 4 });
            setCatOpen((v) => !v);
          }}
          className="inline-flex items-center gap-2 rounded-full hairline px-4 py-2 text-xs text-muted hover:text-ink hover:border-accent/40 transition-colors"
        >
          <Tag size={13} />
          Categories
        </button>
        {catOpen && catAnchor && renderForegroundPortal(
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            onMouseDown={(e) => e.stopPropagation()}
            style={{ position: 'fixed', top: catAnchor.y, left: catAnchor.x, zIndex: 1000 }}
            className="w-60 overflow-hidden rounded-lg hairline glass shadow-2xl p-1.5"
          >
            {categories.length === 0 && (
              <div className="px-2 py-3 text-xs text-muted">No categories yet. Create one in the sidebar.</div>
            )}
            {categories.map((c) => {
              const has = (game.categoryIds || []).includes(c.id);
              return (
                <button
                  key={c.id}
                  data-testid={`detail-cat-toggle-${c.id}`}
                  onClick={() => onToggleCategory(game, c.id)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-[rgb(var(--accent)/0.10)]"
                >
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ background: colorFromId(c.colorId) }}
                  />
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className={cn('text-[10px]', has ? 'text-[rgb(var(--accent))]' : 'text-muted/60')}>
                    {has ? '✓' : ''}
                  </span>
                </button>
              );
            })}
          </motion.div>,
        )}
      </div>

      </div>

      <div className="ml-auto flex items-center gap-2 text-[11px] text-muted">
        {(game.categoryIds || []).slice(0, 4).map((cid) => {
          const c = categories.find((x) => x.id === cid);
          if (!c) return null;
          return (
            <span
              key={cid}
              className="inline-flex items-center gap-1.5 rounded-full hairline px-2 py-0.5"
              style={{ borderColor: colorFromId(c.colorId) + '88' }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: colorFromId(c.colorId) }} />
              {c.name}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function ManagedToolMenu({ game, onLocate, onInstall, installing, compact = false }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const close = (event) => { if (ref.current && !ref.current.contains(event.target)) setOpen(false); };
    if (open) document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  return <div ref={ref} className="relative shrink-0"><button onClick={() => setOpen((value) => !value)} disabled={installing} className={`${compact ? 'h-8 px-3 text-[10px]' : 'h-9 px-4 text-[11px]'} inline-flex items-center gap-1.5 rounded-lg border border-[rgb(var(--accent)/0.42)] bg-[rgb(var(--accent)/0.1)] font-black text-[rgb(var(--accent))] hover:bg-[rgb(var(--accent)/0.18)] disabled:opacity-50`} title={`Set up ${game.name}`}><Wrench size={compact ? 12 : 14} />{installing ? 'Downloading…' : 'Set up'}<ChevronDown size={12} className={open ? 'rotate-180 transition-transform' : 'transition-transform'} /></button>{open && <div className="absolute right-0 top-[calc(100%+6px)] z-[90] w-56 overflow-hidden rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.98)] p-1.5 shadow-2xl"><button onClick={() => { setOpen(false); onLocate?.(game); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[10.5px] font-semibold text-ink hover:bg-[rgb(var(--accent)/0.12)]"><FolderOpen size={13} className="text-[rgb(var(--accent-2))]" /><span><b className="block">Locate it</b><span className="text-[9px] font-normal text-muted">Choose an existing official executable</span></span></button><button onClick={() => { setOpen(false); onInstall?.(game); }} className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[10.5px] font-semibold text-ink hover:bg-[rgb(var(--accent)/0.12)]"><Download size={13} className="text-emerald-300" /><span><b className="block">Install from official site</b><span className="text-[9px] font-normal text-muted">Downloads only after this click</span></span></button></div>}</div>;
}
