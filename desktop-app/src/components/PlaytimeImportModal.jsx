import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, RefreshCw, Edit3, AlertTriangle, Filter } from 'lucide-react';
import { formatPlaytime, playtimeSource } from '../lib/utils';

/**
 * PlaytimeImportModal — v1.6.0.
 *
 * Shown after a Steam import. Presents a scrollable table of every game in
 * the library alongside its Steam-imported hours + last-played timestamp,
 * with per-row controls:
 *   • toggle apply/skip
 *   • refresh (re-read Steam)
 *   • manual override (click the hour cell, type your own number)
 *
 * Only games whose appid is in the `ownedAppids` whitelist are treated as
 * Steam-owned. Everything else stays locally-tracked and won't get Steam
 * hours merged in.
 *
 * Manual overrides tag the game with `playtimeManual: true` so future imports
 * skip it and a `[MANUAL]` chip shows up beside the hours.
 *
 * onApply(patch) → array of { id, playtime, lastPlayedAt, steamOwned, playtimeManual }
 */
export default function PlaytimeImportModal({
  open,
  games = [],
  steamData = {},        // { <appid>: { playtime, lastPlayed } }
  ownedAppids = [],      // string[] — whitelist for steamOwned=true
  currentAccount = null, // { steamid3, personaName }
  onApply,
  onClose,
  onRefreshSingle,       // optional (game) => Promise<{ playtime, lastPlayed }>
}) {
  const ownedSet = React.useMemo(() => new Set(ownedAppids.map(String)), [ownedAppids]);
  const [rows, setRows] = React.useState([]);
  const [filter, setFilter] = React.useState('all'); // all | changes | steam | owned | notOwned | manual

  React.useEffect(() => {
    if (!open) return;
    const built = games.map((g) => {
      const appid = g.appid ? String(g.appid) : null;
      const steam = appid ? steamData[appid] : null;
      const owned = appid ? ownedSet.has(appid) : false;
      const proposed = (owned && steam) ? Number(steam.playtime) : Number(g.playtime) || 0;
      const willChange = owned && steam
        && Number(steam.playtime) > (Number(g.playtime) || 0)
        && !g.playtimeManual;
      return {
        id: g.id,
        name: g.name,
        currentHours: Number(g.playtime) || 0,
        proposedHours: proposed,
        steamHours: steam ? Number(steam.playtime) : null,
        lastPlayed: steam ? Number(steam.lastPlayed) : (Number(g.lastPlayedAt) || 0),
        appid,
        owned,
        wasManual: !!g.playtimeManual,
        apply: willChange && !g.playtimeManual, // default on for real Steam-owned changes only
        overrideValue: null, // if user manually types
      };
    });
    setRows(built);
  }, [open, games, steamData, ownedSet]);

  if (!open) return null;

  const filtered = rows.filter((r) => {
    if (filter === 'all') return true;
    if (filter === 'changes') return r.apply || r.overrideValue !== null;
    if (filter === 'steam')   return r.owned && r.steamHours !== null;
    if (filter === 'owned')   return r.owned;
    if (filter === 'notOwned') return !r.owned && r.appid;
    if (filter === 'manual')  return r.wasManual || r.overrideValue !== null;
    return true;
  });

  const toggleRow = (id) => {
    setRows((r) => r.map((row) => row.id === id ? { ...row, apply: !row.apply, overrideValue: row.apply ? null : row.overrideValue } : row));
  };
  const setManual = (id, minutes) => {
    setRows((r) => r.map((row) => row.id === id
      ? { ...row, overrideValue: Math.max(0, Math.round(Number(minutes) || 0)), apply: true }
      : row
    ));
  };
  const refreshOne = async (id) => {
    if (!onRefreshSingle) return;
    const row = rows.find((r) => r.id === id);
    if (!row) return;
    try {
      const res = await onRefreshSingle({ id, appid: row.appid });
      if (res && res.playtime !== undefined) {
        setRows((r) => r.map((rr) => rr.id === id
          ? { ...rr, steamHours: Number(res.playtime), proposedHours: Number(res.playtime), lastPlayed: Number(res.lastPlayed) || rr.lastPlayed, apply: true }
          : rr
        ));
      }
    } catch { /* ignore */ }
  };

  const apply = () => {
    const patches = [];
    for (const row of rows) {
      // Steam ownership flag is ALWAYS applied — that's the whole point of
      // this modal. Playtime is only written if the row is checked (or user
      // typed a manual value).
      const patch = { id: row.id, steamOwned: !!row.owned };
      if (row.overrideValue !== null) {
        patch.playtime = row.overrideValue;
        patch.playtimeManual = true;
        patch.lastPlayedAt = row.overrideValue > 0 ? Date.now() : 0;
      } else if (row.apply && row.steamHours !== null && !row.wasManual) {
        patch.playtime = row.steamHours;
        patch.playtimeManual = false;
        if (row.lastPlayed) patch.lastPlayedAt = row.lastPlayed;
      }
      patches.push(patch);
    }
    onApply?.(patches);
  };

  const applyCount = rows.filter((r) => r.apply || r.overrideValue !== null).length;
  const totalChanges = rows.filter((r) =>
    (r.apply && r.proposedHours !== r.currentHours) || r.overrideValue !== null
  ).length;

  const body = (
    <AnimatePresence>
      <motion.div
        key="import-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
        className="fixed inset-0 z-[9989] grid place-items-center"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
        data-testid="import-backdrop"
      >
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.97 }}
          onMouseDown={(e) => e.stopPropagation()}
          className="w-full max-w-3xl max-h-[86vh] flex flex-col rounded-2xl overflow-hidden hairline shadow-2xl"
          style={{
            backgroundColor: 'rgb(var(--panel))',
            border: '1px solid rgb(var(--accent) / 0.5)',
            boxShadow: '0 30px 80px -20px rgba(0,0,0,0.9), 0 0 60px -10px rgb(var(--accent)/0.5)',
          }}
          data-testid="playtime-import-modal"
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 border-b border-[rgb(var(--border))] px-5 py-3"
            style={{ background: 'linear-gradient(90deg, rgb(var(--accent)/0.14), rgb(var(--accent-2)/0.10))' }}
          >
            <RefreshCw size={16} className="text-[rgb(var(--accent))]" />
            <div className="flex-1">
              <div className="text-[15px] font-bold text-ink">Playtime import preview</div>
              <div className="text-[11px] text-muted">
                {currentAccount?.personaName ? (
                  <>Signed-in Steam account: <span className="text-[rgb(var(--accent-2))] font-semibold">{currentAccount.personaName}</span></>
                ) : 'Currently signed-in Steam account'}
                {' · '}
                {ownedAppids.length} owned appids
              </div>
            </div>
            <button
              onClick={onClose}
              data-testid="import-close-btn"
              className="grid h-8 w-8 place-items-center rounded-md text-muted hover:text-ink hover:bg-surface/40"
            >
              <X size={14} />
            </button>
          </div>

          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-1 border-b border-[rgb(var(--border))] px-4 py-2 text-[11.5px]">
            <Filter size={11} className="mr-1 text-muted" />
            {[
              { k: 'all',      label: `All (${rows.length})` },
              { k: 'changes',  label: `Will change (${rows.filter((r) => r.apply || r.overrideValue !== null).length})` },
              { k: 'steam',    label: `Steam-owned (${rows.filter((r) => r.owned && r.steamHours !== null).length})` },
              { k: 'notOwned', label: `Not owned (${rows.filter((r) => !r.owned && r.appid).length})` },
              { k: 'manual',   label: `Manual (${rows.filter((r) => r.wasManual || r.overrideValue !== null).length})` },
            ].map((t) => (
              <button
                key={t.k}
                onClick={() => setFilter(t.k)}
                data-testid={`import-filter-${t.k}`}
                className={
                  'rounded-md px-2 py-1 transition-colors ' +
                  (filter === t.k
                    ? 'bg-[rgb(var(--accent)/0.18)] text-ink border border-[rgb(var(--accent)/0.55)]'
                    : 'text-muted hover:text-ink hover:bg-[rgb(var(--accent)/0.08)] border border-transparent')
                }
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 border-b border-[rgb(var(--border))] px-4 py-2 text-[10.5px] text-muted">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ background: '#1b8fe3' }} /> STEAM = confirmed owned in signed-in account
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ background: '#ffcc4a' }} /> MANUAL = you typed the hours
            </span>
            <span className="inline-flex items-center gap-1">
              <AlertTriangle size={11} className="text-[#ff5a6e]" /> unowned appid — tracked locally, no Steam merge
            </span>
          </div>

          {/* Scroll list */}
          <div className="flex-1 overflow-y-auto px-3 py-2" data-testid="import-scroll">
            {filtered.length === 0 && (
              <div className="p-8 text-center text-[13px] text-muted">No games match this filter.</div>
            )}
            {filtered.map((row) => (
              <ImportRow
                key={row.id}
                row={row}
                onToggle={() => toggleRow(row.id)}
                onManualEdit={(v) => setManual(row.id, v)}
                onRefresh={() => refreshOne(row.id)}
                hasRefresh={!!onRefreshSingle && !!row.appid}
              />
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-2 border-t border-[rgb(var(--border))] bg-panel/80 px-5 py-3">
            <div className="text-[11.5px] text-muted">
              <span className="text-[rgb(var(--accent-2))] font-bold">{applyCount}</span> row{applyCount === 1 ? '' : 's'} selected
              {totalChanges > 0 && (<>, <span className="text-[rgb(var(--accent))] font-bold">{totalChanges}</span> actual change{totalChanges === 1 ? '' : 's'}</>)}
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                data-testid="import-cancel-btn"
                className="rounded-md hairline px-4 h-9 text-[12px] hover:bg-surface/40"
              >
                Cancel
              </button>
              <button
                onClick={apply}
                data-testid="import-apply-btn"
                className="inline-flex items-center gap-1.5 rounded-md px-4 h-9 text-[12px] font-bold text-white hover:scale-[1.03] transition-transform"
                style={{
                  background: 'linear-gradient(135deg, rgb(var(--accent)) 0%, rgb(var(--accent-2)) 100%)',
                  boxShadow: '0 0 14px -3px rgb(var(--accent)/0.7)',
                }}
              >
                <Check size={12} /> Apply changes
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
  if (typeof document === 'undefined') return body;
  return createPortal(body, document.body);
}

function ImportRow({ row, onToggle, onManualEdit, onRefresh, hasRefresh }) {
  const [editing, setEditing] = React.useState(false);
  const [tmp, setTmp] = React.useState(row.overrideValue !== null ? String(row.overrideValue) : String(row.currentHours));
  const src = playtimeSource({
    steamOwned: row.owned,
    playtimeManual: row.overrideValue !== null || row.wasManual,
    appid: row.appid,
  });
  const changed = (row.apply && row.proposedHours !== row.currentHours) || row.overrideValue !== null;
  return (
    <div
      className={
        'group flex items-center gap-3 rounded-md px-2.5 py-2 mb-1 transition-colors ' +
        (changed ? 'bg-[rgb(var(--accent)/0.06)]' : 'hover:bg-surface/40')
      }
      data-testid={`import-row-${row.id}`}
    >
      <input
        type="checkbox"
        checked={row.apply || row.overrideValue !== null}
        onChange={onToggle}
        data-testid={`import-check-${row.id}`}
        className="h-4 w-4 accent-[rgb(var(--accent))] cursor-pointer"
        disabled={!row.owned && row.overrideValue === null}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {src && (
            <span
              className="rounded px-1 py-[1px] text-[8px] font-bold tracking-wider shrink-0"
              style={{ background: `${src.color}25`, color: src.color, border: `1px solid ${src.color}55` }}
            >{src.label}</span>
          )}
          {!row.owned && row.appid && (
            <span
              className="inline-flex items-center gap-0.5 rounded px-1 py-[1px] text-[8px] font-bold tracking-wider shrink-0"
              style={{ background: '#ff5a6e25', color: '#ff5a6e', border: '1px solid #ff5a6e55' }}
              title={`appid ${row.appid} is NOT in your signed-in Steam account's ownership list — treated as a local/pirated copy.`}
            >
              <AlertTriangle size={8} /> UNOWNED
            </span>
          )}
          <span className="truncate text-[13px] font-medium text-ink">{row.name}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[10.5px] text-muted">
          <span>Current: <span className="text-ink/80">{formatPlaytime(row.currentHours)}</span></span>
          {row.steamHours !== null && (
            <>
              <span>·</span>
              <span>Steam: <span className="text-[rgb(var(--accent-2))]">{formatPlaytime(row.steamHours)}</span></span>
            </>
          )}
          {row.appid && <><span>·</span><span>appid {row.appid}</span></>}
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        {editing ? (
          <>
            <input
              type="number"
              min={0}
              value={tmp}
              onChange={(e) => setTmp(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { onManualEdit(tmp); setEditing(false); }
                if (e.key === 'Escape') { setEditing(false); setTmp(String(row.overrideValue ?? row.currentHours)); }
              }}
              className="w-20 rounded-md hairline bg-panel/40 px-2 py-1 text-[12px] tabular-nums outline-none focus:border-[rgb(var(--accent)/0.6)]"
              placeholder="min"
              autoFocus
              data-testid={`import-manual-input-${row.id}`}
            />
            <span className="text-[10px] text-muted">min</span>
            <button
              onClick={() => { onManualEdit(tmp); setEditing(false); }}
              data-testid={`import-manual-ok-${row.id}`}
              className="grid h-7 w-7 place-items-center rounded-md hairline text-[rgb(var(--accent))] hover:bg-[rgb(var(--accent)/0.12)]"
            >
              <Check size={12} />
            </button>
          </>
        ) : (
          <button
            onClick={() => { setEditing(true); setTmp(String(row.overrideValue ?? row.proposedHours ?? row.currentHours)); }}
            data-testid={`import-manual-btn-${row.id}`}
            title="Click to type your own value (marks the game as MANUAL and skips future Steam merges)"
            className="inline-flex items-center gap-1 rounded-md hairline px-2 h-7 text-[11.5px] tabular-nums text-ink hover:border-[rgb(var(--accent)/0.5)]"
          >
            {formatPlaytime(row.overrideValue !== null ? row.overrideValue : row.proposedHours)}
            <Edit3 size={9} className="text-muted opacity-60 group-hover:opacity-100" />
          </button>
        )}
        {hasRefresh && (
          <button
            onClick={onRefresh}
            data-testid={`import-refresh-${row.id}`}
            title="Re-read this game's hours from Steam"
            className="grid h-7 w-7 place-items-center rounded-md hairline text-muted hover:text-ink hover:border-[rgb(var(--accent)/0.5)]"
          >
            <RefreshCw size={11} />
          </button>
        )}
      </div>
    </div>
  );
}
