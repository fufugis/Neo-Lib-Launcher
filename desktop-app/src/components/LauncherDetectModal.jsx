import React from 'react';
import Modal from './Modal';
import { Zap, Clock, X } from 'lucide-react';

const LAUNCHER_LABELS = {
  steam:    { name: 'Steam',     color: '#66c0f4' },
  epic:     { name: 'Epic Games', color: '#0078f2' },
  ea:       { name: 'EA App',    color: '#ff4747' },
  ubisoft:  { name: 'Ubisoft Connect', color: '#0070d4' },
  gog:      { name: 'GOG Galaxy', color: '#a87bff' },
  battlenet:{ name: 'Battle.net', color: '#149bf3' },
  riot:     { name: 'Riot Client', color: '#d13639' },
  rockstar: { name: 'Rockstar Games Launcher', color: '#f59f00' },
};

/**
 * LauncherDetectModal — when a launcher is detected running for the first
 * time, prompt the user to import its installed games into a dedicated category.
 * The user can choose: Import, Skip, Remind me later, Don't ask again.
 */
export default function LauncherDetectModal({ open, launcher, onImport, onSkip, onLater, onClose }) {
  if (!open || !launcher) return null;
  const meta = LAUNCHER_LABELS[launcher] || { name: launcher, color: '#888' };
  return (
    <Modal open onClose={onClose} title={`${meta.name} detected`} testid="launcher-detect-modal">
      <div className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div
            className="grid h-12 w-12 shrink-0 place-items-center rounded-lg"
            style={{ background: `${meta.color}33`, color: meta.color }}
          >
            <Zap size={22} />
          </div>
          <div>
            <div className="text-[14px] font-semibold text-ink">{meta.name} is running</div>
            <p className="mt-1 text-[12.5px] text-muted leading-relaxed">
              Want to import your installed <span className="text-ink">{meta.name}</span> games into NEO-LIB?
              They&apos;ll be added to a dedicated <em>{meta.name}</em> category — your existing categories stay untouched.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
          <button
            data-testid="launcher-detect-disable"
            onClick={() => { onSkip?.(true); }}
            className="rounded-md hairline px-3 py-1.5 text-[11px] text-muted hover:text-ink"
          >
            Don&apos;t ask again
          </button>
          <button
            data-testid="launcher-detect-later"
            onClick={() => { onLater?.(); }}
            className="flex items-center gap-1 rounded-md hairline px-3 py-1.5 text-[11px] text-muted hover:text-ink"
          >
            <Clock size={11} /> Remind me later
          </button>
          <button
            data-testid="launcher-detect-skip"
            onClick={() => onSkip?.(false)}
            className="rounded-md hairline px-3 py-1.5 text-[11px] text-muted hover:text-ink"
          >
            No
          </button>
          <button
            data-testid="launcher-detect-import"
            onClick={onImport}
            className="rounded-md px-3 py-1.5 text-[11px] font-semibold text-[rgb(var(--surface))]"
            style={{ background: 'rgb(var(--accent))' }}
          >
            Yes — import
          </button>
        </div>
      </div>
    </Modal>
  );
}
