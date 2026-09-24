import React from 'react';
import { Heart, Images, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { JOURNEY_STATUSES } from '../../lib/game-journey-model.mjs';

export default function CollectionActions({
  count = 0,
  categories = [],
  privateCategories = [],
  onDone,
  onFavorite,
  onJourneyStatus,
  onAddCategory,
  onReviewMetadata,
  onReviewArtwork,
  onProtect,
  testid = 'collection-actions',
  compact = false,
}) {
  const selectClass = `h-7 min-w-0 rounded-md bg-transparent px-1 text-[9px] font-bold text-muted outline-none disabled:opacity-35 ${compact ? 'max-w-24' : 'max-w-28'}`;
  const actionClass = 'inline-flex h-7 items-center gap-1 rounded-md px-2 text-[9px] font-bold text-muted hover:bg-[rgb(var(--accent)/0.16)] hover:text-ink disabled:opacity-35';
  const choose = (callback) => (event) => { const value = event.target.value; if (value) callback?.(value); event.target.value = ''; };
  return <div data-testid={testid} className="flex flex-wrap items-center gap-1 rounded-lg border border-[rgb(var(--accent)/0.48)] bg-[rgb(var(--accent)/0.09)] p-1.5">
    <span className="px-1 text-[9px] font-bold text-ink">{count} selected</span>
    <button type="button" disabled={!count} onClick={() => onFavorite?.(true)} className={actionClass}><Heart size={11} /> Favorite</button>
    <button type="button" disabled={!count} onClick={() => onFavorite?.(false)} className={actionClass}>Unfavorite</button>
    <select aria-label="Add selected games to a category" disabled={!count || !categories.length} defaultValue="" onChange={choose(onAddCategory)} className={selectClass}><option value="">Add to…</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
    <select aria-label="Set Journey Status for selected games" disabled={!count} defaultValue="" onChange={choose(onJourneyStatus)} className={selectClass}><option value="">Set status…</option>{JOURNEY_STATUSES.map((status) => <option key={status.id} value={status.id}>{status.label}</option>)}</select>
    <button type="button" disabled={!count} onClick={onReviewMetadata} className={actionClass} title="Review metadata for each selected game"><RefreshCw size={11} /> Metadata</button>
    <button type="button" disabled={!count} onClick={onReviewArtwork} className={actionClass} title="Review artwork for each selected game"><Images size={11} /> Artwork</button>
    <select aria-label="Protect selected games in a private category" disabled={!count || !privateCategories.length} defaultValue="" onChange={choose(onProtect)} className={selectClass} title={privateCategories.length ? 'Add selected games to an unlocked private category' : 'Unlock or create a private category first'}><option value="">Protect in…</option>{privateCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
    {privateCategories.length > 0 && <ShieldCheck size={11} className="text-[rgb(var(--accent-2))]" aria-label="Private category available" />}
    <button type="button" onClick={onDone} className="grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-[rgb(var(--accent)/0.16)] hover:text-ink" title="Leave selection mode"><X size={12} /></button>
  </div>;
}
