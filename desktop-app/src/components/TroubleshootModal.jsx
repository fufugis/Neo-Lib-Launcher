import React from 'react';
import Modal from './Modal';
import { Check, X, Image as ImageIcon, FileText, Camera, RefreshCw, Search, AlertTriangle } from 'lucide-react';

/**
 * TroubleshootModal — opens when the user presses "Re-fetch info" on a game.
 * Shows the currently detected info, and lets the user surgically fix what's wrong:
 *   - Icon missing       → re-fetch icon only
 *   - Description missing → re-fetch description only
 *   - Screenshots/Images  → re-fetch screenshots only
 *   - Wrong game          → opens a Re-search by name prompt
 *   - Accept              → close (nothing changes)
 *
 * The parent handles the actual fetch via onAction({type, query?}).
 */
export default function TroubleshootModal({
  open, game, onClose, onAction, busy,
}) {
  if (!open || !game) return null;

  const issues = [
    { key: 'icon',         label: 'Icon missing or wrong',        icon: <ImageIcon size={14} />, ok: !!(game.icon || game.coverUrl) },
    { key: 'description',  label: 'Description missing',          icon: <FileText size={14} />,  ok: !!(game.about || game.shortDescription) },
    { key: 'screenshots',  label: "Screenshots don't show",       icon: <Camera size={14} />,    ok: !!(game.screenshots && game.screenshots.length) },
    { key: 'banner',       label: 'Banner / hero image missing',  icon: <ImageIcon size={14} />, ok: !!(game.background || game.headerImage) },
  ];

  return (
    <Modal open onClose={onClose} title="Troubleshoot game" testid="troubleshoot-modal" wide>
      <div className="p-5 space-y-5">
        {/* Detected info preview */}
        <div className="rounded-lg hairline overflow-hidden">
          <div className="flex gap-3 p-3 bg-surface/40">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded hairline bg-surface/70">
              {(game.icon || game.coverUrl) ? (
                <img src={game.icon || game.coverUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center text-xs text-muted">
                  {(game.name || '?').slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-display text-sm font-semibold truncate">{game.name || 'Untitled'}</div>
              <div className="mt-0.5 text-[11px] text-muted truncate">
                {game.appid ? `Steam appid ${game.appid} · ` : ''}
                {game.source || 'unknown source'}
                {game.releaseDate ? ` · ${game.releaseDate}` : ''}
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {(game.genres || []).slice(0, 4).map((g) => (
                  <span key={g} className="rounded-full hairline px-2 py-0.5 text-[10px] text-muted">{g}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-px bg-[rgb(var(--border))]/40">
            {issues.map((it) => (
              <div key={it.key} className="flex items-center gap-2 bg-panel/40 px-3 py-2 text-[11px]">
                <span className={it.ok ? 'text-[rgb(var(--accent-2))]' : 'text-amber-400'}>
                  {it.ok ? <Check size={13} /> : <AlertTriangle size={13} />}
                </span>
                <span className="flex-1 truncate text-muted">{it.label}</span>
                <span className={it.ok ? 'text-[rgb(var(--accent-2))]' : 'text-amber-400'}>
                  {it.ok ? 'OK' : 'Missing'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div>
          <div className="mb-2 text-[10px] uppercase tracking-[0.22em] text-muted">Fix specific field</div>
          <div className="grid grid-cols-2 gap-2">
            <ActionBtn icon={<ImageIcon size={14} />}    label="Re-fetch icon"         onClick={() => onAction({ type: 'icon' })} testid="ts-icon" busy={busy} />
            <ActionBtn icon={<FileText size={14} />}     label="Re-fetch description"  onClick={() => onAction({ type: 'description' })} testid="ts-desc" busy={busy} />
            <ActionBtn icon={<Camera size={14} />}       label="Re-fetch screenshots"  onClick={() => onAction({ type: 'screenshots' })} testid="ts-shots" busy={busy} />
            <ActionBtn icon={<ImageIcon size={14} />}    label="Re-fetch banner"       onClick={() => onAction({ type: 'banner' })} testid="ts-banner" busy={busy} />
          </div>
        </div>

        <div className="h-px bg-[rgb(var(--border))]" />

        <div className="grid grid-cols-2 gap-2">
          <ActionBtn
            icon={<RefreshCw size={14} />}
            label="Refresh everything (locked to current game)"
            onClick={() => onAction({ type: 'all-locked' })}
            testid="ts-all-locked"
            busy={busy}
            primary
          />
          <ActionBtn
            icon={<Search size={14} />}
            label="Wrong game — re-search by name…"
            onClick={() => onAction({ type: 'research' })}
            testid="ts-research"
            busy={busy}
            danger
          />
        </div>

        <div className="flex justify-end pt-1">
          <button
            data-testid="ts-close"
            onClick={onClose}
            className="rounded-md hairline px-3 py-1.5 text-xs text-muted hover:text-ink"
          >
            <X size={12} className="inline mr-1" /> Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ActionBtn({ icon, label, onClick, testid, busy, primary, danger }) {
  return (
    <button
      data-testid={testid}
      disabled={busy}
      onClick={onClick}
      className={
        'flex items-center gap-2 rounded-md px-3 py-2 text-xs text-left transition-colors disabled:opacity-50 ' +
        (primary
          ? 'bg-[rgb(var(--accent))] text-[rgb(var(--surface))] hover:opacity-90'
          : danger
          ? 'hairline text-amber-400 hover:bg-amber-500/10 hover:border-amber-400/50'
          : 'hairline text-ink hover:bg-[rgb(var(--accent)/0.10)] hover:border-[rgb(var(--accent)/0.5)]')
      }
    >
      {icon}
      <span className="flex-1">{label}</span>
    </button>
  );
}
