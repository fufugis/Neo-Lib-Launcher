import React from 'react';
import { hours, platformOf, PLATFORM } from './home-model.mjs';
import { JOURNEY_STATUSES } from '../../lib/game-journey-model.mjs';
import { normalizePlaytimePieFilters, playtimePie } from './playtime-pie-model.mjs';

export default React.memo(function PlaytimePieWidget({ games, favoriteIds, filters: savedFilters, onFiltersChange, onSelect }) {
  const filters = React.useMemo(() => normalizePlaytimePieFilters(savedFilters), [savedFilters]);
  const [expanded, setExpanded] = React.useState(false);
  const chart = React.useMemo(() => playtimePie(games, filters, favoriteIds), [games, filters, favoriteIds]);
  const platforms = React.useMemo(() => [...new Set(games.filter(game => !game.homeLocked).map(platformOf))].sort(), [games]);
  const set = patch => onFiltersChange?.(normalizePlaytimePieFilters({ ...filters, ...patch }));
  const field = 'w-full rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.7)] px-2 py-1.5 text-xs text-ink';
  const select = (label, key, options) => <label className="grid min-w-0 gap-1 text-xs text-muted">{label}<select aria-label={label} className={field} value={filters[key]} onChange={event => set({ [key]: event.target.value })}>{options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label>;
  return <section data-testid="playtime-pie-widget" className="space-y-3 p-1">
    <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-muted">Lifetime recorded playtime · {chart.gameCount} games · {hours(chart.total)}</p><button type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)} className={`${field} w-auto`}>Filters</button></div>
    {expanded && <div className="grid gap-2 sm:grid-cols-2" data-controller-grid>
      <label className="grid gap-1 text-xs text-muted">Game title<input aria-label="Game title" className={field} value={filters.search} maxLength={160} onChange={event => set({ search: event.target.value })} /></label>
      {select('Launcher', 'platform', [['all', 'All launchers'], ...platforms.map(id => [id, PLATFORM[id] || id])])}
      {select('Journey', 'journey', [['all', 'All progress'], ...JOURNEY_STATUSES.map(status => [status.id, status.label])])}
      {select('Recently played games', 'recentDays', [[0, 'Any activity'], [7, 'Last 7 days'], [30, 'Last 30 days'], [365, 'Last year']])}
      {['minHours', 'maxHours'].map(key => <label key={key} className="grid gap-1 text-xs text-muted">{key === 'minHours' ? 'Minimum hours' : 'Maximum hours (0 = unlimited)'}<input aria-label={key === 'minHours' ? 'Minimum hours' : 'Maximum hours'} className={field} type="number" min={0} max={1000000} step={0.5} value={filters[key]} onChange={event => set({ [key]: event.target.value })} /></label>)}
      {select('Named slices', 'limit', [[5, 'Top 5 + Other'], [10, 'Top 10 + Other'], [15, 'Top 15 + Other']])}
      <button type="button" aria-pressed={filters.favoritesOnly} onClick={() => set({ favoritesOnly: !filters.favoritesOnly })} className={field}>{filters.favoritesOnly ? '✓ ' : ''}Favourites only</button>
      <button type="button" onClick={() => onFiltersChange?.(normalizePlaytimePieFilters())} className={field}>Reset filters</button>
      <p className="text-xs text-muted">Activity filters choose games, not hours within that period. Imported lifetime totals are not session history.</p>
    </div>}
    {chart.total > 0 ? <div className="flex flex-wrap items-center gap-4">
      <div role="img" aria-label={`Playtime distribution: ${chart.slices.map(slice => `${slice.label} ${slice.percent.toFixed(1)}%`).join(', ')}`} className="aspect-square w-40 max-w-full shrink-0 rounded-full border border-[rgb(var(--border))]" style={{ backgroundImage: chart.gradient }} />
      <ul className="min-w-0 flex-1 space-y-1">{chart.slices.map((slice, index) => <li key={slice.id ?? `other-${index}`}>
        <button type="button" disabled={slice.id === null} onClick={() => onSelect?.(slice.id)} className="flex w-full items-center gap-2 rounded-md px-1 py-1.5 text-left text-xs hover:bg-[rgb(var(--accent)/0.1)] disabled:cursor-default"><span aria-hidden className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: slice.color }} /><span className="min-w-0 flex-1 break-words">{slice.label}</span><span className="shrink-0 tabular-nums">{hours(slice.minutes)} · {slice.percent.toFixed(1)}%</span></button>
      </li>)}</ul>
    </div> : <p className="py-4 text-sm text-muted">No recorded playtime matches these filters. Track or import playtime, or reset your filters.</p>}
  </section>;
});
