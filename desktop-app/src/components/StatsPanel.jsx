import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  BarChart3, X, Trophy, Clock, CalendarDays, ExternalLink,
  GripVertical, RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { playtimeSource } from '../lib/utils';

/**
 * StatsPanel — a "stats & connected clients" side panel that pops up next
 * to the Stats tab button. Deliberately NOT a social profile: no name, no
 * avatar, no friends. Just numbers and rankings.
 *
 * v1.2.9 launch scope:
 *   • Shows every launcher/client we have games imported from (Steam, GOG,
 *     itch.io, EA, Ubisoft, Epic, Battle.net, GOG Galaxy, standalone).
 *   • Total hours across the library (sum of `playtime` minutes).
 *   • Most-played ranking with hours and lastPlayed date.
 *   • Filter chips: This week / This month / This year / All time.
 *   • "Link Discord" placeholder button (already wired via Rich Presence).
 *   • Small hint bar at the bottom: "More coming here — suggest a metric."
 */

const CLIENT_META = {
  steam:      { label: 'Steam',      color: '#66c0f4' },
  gog:        { label: 'GOG',        color: '#c599ff' },
  itch:       { label: 'itch.io',    color: '#ff6494' },
  ea:         { label: 'EA',         color: '#ff5a5a' },
  ubisoft:    { label: 'Ubisoft',    color: '#4dbcff' },
  epic:       { label: 'Epic',       color: '#e5e5e5' },
  battlenet:  { label: 'Battle.net', color: '#00aeff' },
  gog_galaxy: { label: 'GOG Galaxy', color: '#c599ff' },
  standalone: { label: 'Standalone', color: '#94a3b8' },
  local:      { label: 'Local',      color: '#94a3b8' },
};

function clientOf(g) {
  // Explicit `source` field always wins (Steam scanner/GOG scanner set this).
  // Only fall back to heuristics when source is truly missing (e.g. legacy
  // demo entries). v1.2.10 — no longer classifies "any game with an appid"
  // as steam, because a manual itch game can pick up an appid from an
  // accidental metadata fetch. Explicit source > appid > website > local.
  const s = (g?.source || '').toLowerCase();
  if (s && CLIENT_META[s]) return s;
  if (!s && /itch\.io/i.test(g?.website || '')) return 'itch';
  if (!s && g?.gogId) return 'gog';
  if (!s && g?.appid) return 'steam';
  return 'local';
}

function fmtHours(mins) {
  if (!mins || mins < 1) return '—';
  const h = mins / 60;
  return h < 10 ? `${h.toFixed(1)}h` : `${Math.round(h)}h`;
}

function fmtDate(ms) {
  if (!ms) return 'never';
  const d = new Date(ms);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7)   return `${diffDays}d ago`;
  if (diffDays < 30)  return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

const RANGE_META = {
  week:  { label: 'This week',  days: 7 },
  month: { label: 'This month', days: 30 },
  year:  { label: 'This year',  days: 365 },
  all:   { label: 'All time',   days: 0 },
};

export default function StatsPanel({ games = [], onClose, anchorSelector, onOpenImportPreview }) {
  const [range, setRange] = useState('all');
  const [importState, setImportState] = useState({ loading: false, error: '', count: 0, accounts: 0, at: 0 });
  const [steamPlaytime, setSteamPlaytime] = useState({}); // appid -> { playtime, lastPlayed }
  // v1.6.4 — Per-appid playtime DELTA (minutes) over the currently-selected
  // range window. Loaded from the local playtime-history.json via IPC. Used
  // to power the "Most played · This week/Month/Year" ranking correctly
  // (Steam's localconfig.vdf only stores lifetime totals, so without this
  // the ranking is always by lifetime hours regardless of the range chip).
  const [historyDeltas, setHistoryDeltas] = useState({});
  const dragControls = useDragControls();

  // On open: import Steam playtime from localconfig.vdf so ranking is accurate.
  const runImport = React.useCallback(async (force = false) => {
    if (typeof window === 'undefined' || !window.api?.importSteamPlaytime) return;
    setImportState((s) => ({ ...s, loading: true, error: '' }));
    try {
      const res = await window.api.importSteamPlaytime({ force });
      if (!res?.ok) {
        setImportState({ loading: false, error: res?.error || 'Import failed.', count: 0, accounts: 0, at: 0 });
        return;
      }
      setSteamPlaytime(res.data || {});
      setImportState({ loading: false, error: '', count: res.count || 0, accounts: res.accounts || 0, at: Date.now() });
    } catch (e) {
      setImportState({ loading: false, error: String(e.message || e), count: 0, accounts: 0, at: 0 });
    }
  }, []);
  useEffect(() => { runImport(false); }, [runImport]);

  // v1.6.4 — Refetch playtime deltas whenever the range chip changes.
  useEffect(() => {
    if (range === 'all') { setHistoryDeltas({}); return undefined; }
    if (typeof window === 'undefined' || !window.api?.playtimeHistory) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const res = await window.api.playtimeHistory({ days: RANGE_META[range].days });
        if (!cancelled && res?.ok) setHistoryDeltas(res.deltas || {});
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [range, importState.at]);

  // Merge Steam-imported playtime into game objects for ranking/aggregation.
  // v1.6.0 — Only merge for games with `steamOwned === true` (set at import
  // preview time based on Steam's own ownership signals). Manual overrides
  // (playtimeManual) always win — never overwritten.
  const mergedGames = useMemo(() => {
    return games.map((g) => {
      if (g.playtimeManual) return g;
      if (g.steamOwned !== true) return g;
      const steam = steamPlaytime[String(g.appid || '')];
      if (!steam) return g;
      return {
        ...g,
        playtime: Math.max(Number(g.playtime || 0), Number(steam.playtime || 0)),
        lastPlayedAt: Math.max(Number(g.lastPlayedAt || 0), Number(steam.lastPlayed || 0)),
      };
    });
  }, [games, steamPlaytime]);

  const [anchorPos, setAnchorPos] = useState(() => {
    if (typeof document === 'undefined' || !anchorSelector) return { top: 76, left: 260 };
    const el = document.querySelector(anchorSelector);
    if (!el) return { top: 76, left: 260 };
    const r = el.getBoundingClientRect();
    return { top: r.bottom + 8, left: r.left };
  });
  useEffect(() => {
    if (typeof document === 'undefined' || !anchorSelector) return;
    const el = document.querySelector(anchorSelector);
    if (!el) return;
    const r = el.getBoundingClientRect();
    setAnchorPos({ top: r.bottom + 8, left: r.left });
  }, [anchorSelector]);

  useEffect(() => {
    if (!onClose) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // v1.6.4 — Range-aware "displayMinutes" per game. For "All time", that's
  // the lifetime playtime. For week/month/year chips, it's the DELTA from
  // playtime-history snapshots (falls back to lifetime playtime for local /
  // non-Steam games that don't have snapshots). Also filters to games with
  // any activity in the window.
  const rangeGames = useMemo(() => {
    if (range === 'all') {
      return mergedGames.map((g) => ({ ...g, displayMinutes: Number(g.playtime || 0) }));
    }
    const cutoff = Date.now() - RANGE_META[range].days * 86400000;
    return mergedGames
      .map((g) => {
        const appid = g.appid ? String(g.appid) : null;
        const deltaMins = appid && historyDeltas[appid] ? Number(historyDeltas[appid]) : 0;
        // Non-Steam games: no snapshot exists, but if lastPlayedAt is within
        // the range, we can't compute a delta — show 0 rather than the full
        // lifetime total so the ranking stays honest.
        const inRange = Number(g.lastPlayedAt || 0) >= cutoff;
        return { ...g, displayMinutes: deltaMins, _inRange: inRange };
      })
      .filter((g) => g.displayMinutes > 0 || g._inRange);
  }, [mergedGames, range, historyDeltas]);

  // Aggregate per client (uses lifetime totals — "clients breakdown" is
  // library composition, not a time-window stat).
  const clientRows = useMemo(() => {
    const m = new Map();
    for (const g of mergedGames) {
      const c = clientOf(g);
      if (!m.has(c)) m.set(c, { key: c, count: 0, mins: 0 });
      const row = m.get(c);
      row.count += 1;
      row.mins += Number(g.playtime || 0);
    }
    return Array.from(m.values()).sort((a, b) => b.count - a.count);
  }, [mergedGames]);

  // Most played ranking — uses displayMinutes so the range chip actually
  // influences the ordering.
  const ranking = useMemo(() => {
    return rangeGames
      .filter((g) => Number(g.displayMinutes || 0) > 0)
      .sort((a, b) => Number(b.displayMinutes || 0) - Number(a.displayMinutes || 0))
      .slice(0, 15);
  }, [rangeGames]);

  // "Tracked" total shown in the header — sum of the range's displayMinutes,
  // not lifetime totals of games touched in-range.
  const totalMins = useMemo(
    () => rangeGames.reduce((s, g) => s + Number(g.displayMinutes || 0), 0),
    [rangeGames]
  );

  const linkDiscord = () => {
    if (typeof window !== 'undefined' && window.api?.openExternal) {
      window.api.openExternal('https://discord.com/');
    } else {
      window.open('https://discord.com/', '_blank');
    }
  };

  const body = (
    <AnimatePresence>
      <motion.div
        key="stats-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.08 }}
        className="fixed inset-0 z-[80] pointer-events-none"
      >
        <motion.div
          drag
          dragControls={dragControls}
          dragListener={false}
          dragMomentum={false}
          dragElastic={0}
          initial={{ opacity: 0, x: -8, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -8, scale: 0.98 }}
          transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-auto absolute flex w-full max-w-[540px] max-h-[74vh] flex-col overflow-hidden rounded-2xl hairline"
          style={{
            top: anchorPos.top,
            left: anchorPos.left,
            backgroundColor: 'rgb(var(--panel) / 0.98)',
            border: '1px solid rgb(var(--accent) / 0.25)',
            boxShadow: '0 20px 60px -20px rgba(0,0,0,0.85), 0 0 30px -8px rgb(var(--accent)/0.35)',
          }}
          onClick={(e) => e.stopPropagation()}
          data-testid="stats-panel"
        >
          {/* HEADER — drag handle */}
          <div
            className="flex items-center gap-3 border-b hairline px-5 pt-4 pb-3 cursor-move select-none"
            onPointerDown={(e) => dragControls.start(e)}
            title="Drag to move"
          >
            <div
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
              style={{
                backgroundImage: 'linear-gradient(135deg, rgb(var(--accent)) 0%, rgb(var(--accent-2)) 100%)',
                color: 'rgb(var(--surface))',
              }}
            >
              <BarChart3 size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-display text-[17px] font-bold">Stats</h2>
                <GripVertical size={11} className="text-muted/60" />
              </div>
              <p className="text-[11px] text-muted">
                {games.length} games · {fmtHours(totalMins)} tracked · {clientRows.length} client{clientRows.length === 1 ? '' : 's'}
                {importState.count > 0 && (
                  <> · <span className="text-[rgb(var(--accent-2))]">{importState.count} imported from Steam</span></>
                )}
              </p>
            </div>
            <button
              onClick={() => onOpenImportPreview ? onOpenImportPreview({ force: true }) : runImport(true)}
              disabled={importState.loading}
              title="Preview & apply Steam playtime import"
              data-testid="stats-reimport-btn"
              className="inline-flex items-center gap-1 rounded-md hairline px-2 h-8 text-[11px] text-ink hover:text-ink hover:border-[rgb(var(--accent)/0.6)] hover:bg-[rgb(var(--accent)/0.10)] disabled:opacity-40"
            >
              <RefreshCw size={12} className={importState.loading ? 'animate-spin' : ''} />
              Import hours
            </button>
            {onClose && (
              <button
                onClick={onClose}
                data-testid="stats-close-btn"
                className="grid h-8 w-8 place-items-center rounded-md text-muted hover:text-ink hover:bg-panel/60"
                title="Close (Esc)"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* BODY — scrolls */}
          <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-5">
            {/* Range chips */}
            <div className="flex flex-wrap gap-1.5" data-testid="stats-range-chips">
              {Object.entries(RANGE_META).map(([key, meta]) => {
                const active = range === key;
                return (
                  <button
                    key={key}
                    data-testid={`stats-range-${key}`}
                    onClick={() => setRange(key)}
                    className="rounded-full px-3 h-7 text-[11px] font-bold transition-all"
                    style={{
                      background: active
                        ? 'linear-gradient(135deg, rgb(var(--accent)) 0%, rgb(var(--accent-2)) 100%)'
                        : 'rgb(var(--panel)/0.7)',
                      color: active ? 'white' : 'rgb(var(--muted))',
                      border: active ? '1px solid transparent' : '1px solid rgb(var(--border))',
                      boxShadow: active ? '0 0 12px -3px rgb(var(--accent)/0.6)' : 'none',
                    }}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>

            {/* Connected clients */}
            <section>
              <SectionHeading icon={<Trophy size={12} />} label="Connected clients" />
              {clientRows.length === 0 ? (
                <div className="rounded-lg hairline bg-panel/40 p-3 text-[12px] text-muted">
                  No games imported yet — scan a launcher to get started.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {clientRows.map((c) => {
                    const meta = CLIENT_META[c.key] || CLIENT_META.local;
                    return (
                      <div
                        key={c.key}
                        className="rounded-lg hairline bg-panel/40 p-2.5"
                        data-testid={`stats-client-${c.key}`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ background: meta.color, boxShadow: `0 0 6px ${meta.color}` }}
                          />
                          <span className="text-[12px] font-bold text-ink">{meta.label}</span>
                        </div>
                        <div className="mt-1 flex items-baseline justify-between">
                          <span className="text-[10px] uppercase tracking-widest text-muted">Games</span>
                          <span className="font-mono text-[13px] text-ink">{c.count}</span>
                        </div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-[10px] uppercase tracking-widest text-muted">Hours</span>
                          <span className="font-mono text-[13px] text-[rgb(var(--accent-2))]">{fmtHours(c.mins)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="mt-3">
                <button
                  onClick={linkDiscord}
                  data-testid="stats-link-discord"
                  className="inline-flex items-center gap-2 rounded-md px-3 h-8 text-[11.5px] font-bold text-white"
                  style={{
                    background: 'linear-gradient(135deg, #5865F2 0%, #7289DA 100%)',
                    boxShadow: '0 0 10px -3px rgba(88,101,242,0.6)',
                  }}
                >
                  Link Discord
                  <ExternalLink size={11} />
                </button>
                <span className="ml-2 text-[10.5px] text-muted">
                  · Rich Presence already active when you launch a game.
                </span>
              </div>
            </section>

            {/* Most played ranking */}
            <section>
              <SectionHeading
                icon={<Clock size={12} />}
                label={`Most played · ${RANGE_META[range].label}`}
                right={ranking.length > 0 ? `${ranking.length} games` : ''}
              />
              {ranking.length === 0 ? (
                <div className="rounded-lg hairline bg-panel/40 p-3 text-[12px] text-muted">
                  No tracked playtime for this range yet. Launch a game — NEO-LIB
                  will start clocking it.
                </div>
              ) : (
                <ol className="space-y-1.5" data-testid="stats-ranking-list">
                  {ranking.map((g, i) => {
                    const client = clientOf(g);
                    const meta = CLIENT_META[client] || CLIENT_META.local;
                    const icon = g.headerImage || g.coverUrl
                      || (g.appid ? `https://cdn.akamai.steamstatic.com/steam/apps/${g.appid}/capsule_184x69.jpg` : '');
                    return (
                    <li
                      key={g.id}
                      className="flex items-center gap-3 rounded-lg hairline bg-panel/30 px-2.5 py-1.5"
                    >
                      <span
                        className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-black"
                        style={{
                          background: i < 3
                            ? 'linear-gradient(135deg, rgb(var(--accent)) 0%, rgb(var(--accent-2)) 100%)'
                            : 'rgb(var(--panel)/0.8)',
                          color: i < 3 ? 'white' : 'rgb(var(--muted))',
                        }}
                      >
                        {i + 1}
                      </span>
                      {icon ? (
                        <img
                          src={icon}
                          alt=""
                          className="h-8 w-14 shrink-0 rounded object-cover hairline"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <div
                          className="grid h-8 w-14 shrink-0 place-items-center rounded hairline bg-panel/60 text-[10px] font-bold uppercase text-muted"
                        >
                          {g.name?.slice(0, 2)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-semibold text-ink flex items-center gap-1.5">
                          {(() => {
                            const src = playtimeSource(g);
                            if (!src) return null;
                            return (
                              <span
                                className="rounded px-1 py-[1px] text-[8px] font-bold tracking-wider shrink-0"
                                style={{
                                  background: `${src.color}25`,
                                  color: src.color,
                                  border: `1px solid ${src.color}55`,
                                }}
                                title={`Playtime source: ${src.label}`}
                                data-testid={`stats-playtime-src-${src.id}`}
                              >
                                {src.label}
                              </span>
                            );
                          })()}
                          <span className="truncate">{g.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10.5px] text-muted">
                          <span
                            className="inline-block h-1.5 w-1.5 rounded-full"
                            style={{ background: meta.color }}
                          />
                          <span>{meta.label}</span>
                          <span>·</span>
                          <CalendarDays size={10} />
                          <span>{fmtDate(g.lastPlayedAt)}</span>
                        </div>
                      </div>
                      <span className="font-mono text-[13px] font-bold text-[rgb(var(--accent-2))]" title={range === 'all' ? 'Lifetime playtime' : `Playtime in the last ${RANGE_META[range].days} days`}>
                        {fmtHours(g.displayMinutes)}
                      </span>
                    </li>
                  );})}
                </ol>
              )}
            </section>

            {/* Hint bar */}
            <div className="rounded-lg hairline bg-panel/30 p-3 text-[11.5px] text-muted">
              <span className="text-[rgb(var(--accent-2))] font-bold">Coming here later</span> —
              Steam Web API playtime import, per-client color coding, monthly
              heat-map calendar, achievement pulls. Ping me on Discord with
              what you want next.
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(body, document.body);
}

function SectionHeading({ icon, label, right }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <div
        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.24em]"
        style={{ color: 'rgb(var(--accent))' }}
      >
        {icon}
        {label}
      </div>
      {right && (
        <div className="text-[10px] uppercase tracking-widest text-muted">{right}</div>
      )}
    </div>
  );
}
