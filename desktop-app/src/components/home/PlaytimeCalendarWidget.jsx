import React from 'react';
import { formatPlaytime } from '../../lib/utils';
import { statisticsGames } from '../../lib/emulator-profile-model.mjs';
import { CALENDAR_HEAT, calendarHeat, normalizeCalendarPreferences, playtimeCalendar } from './playtime-calendar-model.mjs';
import CalendarReminderForm from './CalendarReminderForm';
import Modal from '../Modal';
import { useCalendarReminders } from './use-calendar-reminders.mjs';
import { changeCalendarReminders } from './calendar-reminder-store.mjs';

const MONTHS = Array.from({ length: 12 }, (_, index) => new Date(2024, index, 1).toLocaleDateString(undefined, { month: 'long' }));
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
export default React.memo(function PlaytimeCalendarWidget({ games = [], preferences, onPreferencesChange, onSelect, remindersEnabled = false }) {
  const now = new Date();
  const today = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  const chart = React.useMemo(() => playtimeCalendar(games, preferences, now, {allowFuture:remindersEnabled}), [games, preferences, today, remindersEnabled]);
  const prefs = chart.preferences;
  const [selected, setSelected] = React.useState(null);
  const [editing,setEditing]=React.useState(null),[reminderError,setReminderError]=React.useState('');
  const reminders=useCalendarReminders(remindersEnabled);
  const selectedReminders=reminders.items.filter(item=>item.day===selected).sort((a,b)=>a.at-b.at);
  const reminderCounts=React.useMemo(()=>reminders.items.reduce((counts,item)=>({...counts,[item.day]:(counts[item.day]||0)+1}),{}),[reminders.items]);
  const entry = chart.byDay[selected];
  const selectedVisible = chart.months.some(month => month.cells.some(cell => cell?.key === selected));
  const set = patch => { setSelected(null); setEditing(null); onPreferencesChange?.(normalizeCalendarPreferences({ ...prefs, ...patch }, now, {allowFuture:remindersEnabled})); };
  const navigate = direction => {
    if (prefs.view === 'year') return set({ year: prefs.year + direction });
    const date = new Date(prefs.year, prefs.month + direction, 1, 12);
    set({ year: date.getFullYear(), month: date.getMonth() });
  };
  const maxNext = prefs.year === now.getFullYear() + (remindersEnabled ? 5 : 0) && (prefs.view === 'year' || (remindersEnabled ? prefs.month === 11 : prefs.month >= now.getMonth()));
  const minPrevious = prefs.year === 2000 && (prefs.view === 'year' || prefs.month === 0);
  const button = 'rounded-md border border-[rgb(var(--border))] px-2 py-1.5 text-xs hover:bg-[rgb(var(--accent)/0.12)] disabled:opacity-40';
  const visibleGames = statisticsGames(games, prefs.excludeRoms);
  return <section data-testid="playtime-calendar-widget" className="space-y-3 p-1">
    <div className="flex flex-wrap items-center gap-2">
      {['month', 'year'].map(view => <button key={view} type="button" aria-pressed={prefs.view === view} onClick={() => set({ view })} className={button}>{view === 'month' ? 'Month' : 'Year'}</button>)}
      <button type="button" aria-label="Previous calendar period" disabled={minPrevious} onClick={() => navigate(-1)} className={button}>‹</button>
      <strong className="text-sm">{prefs.view === 'month' ? `${MONTHS[prefs.month]} ` : ''}{prefs.year}</strong>
      <button type="button" aria-label="Next calendar period" disabled={maxNext} onClick={() => navigate(1)} className={button}>›</button>
      <button type="button" onClick={() => set({ year: now.getFullYear(), month: now.getMonth() })} className={button}>Today</button>
      <button type="button" aria-pressed={prefs.excludeRoms} onClick={() => set({ excludeRoms: !prefs.excludeRoms })} className={button}>{prefs.excludeRoms ? '✓ ' : ''}Exclude ROMs from statistics</button>
    </div>
    <label className="flex flex-wrap items-center gap-2 text-xs">Game
      <select aria-label="Calendar game filter" value={prefs.gameId} onChange={event => set({ gameId: event.target.value })} className="min-w-0 max-w-full rounded-md border border-[rgb(var(--border))] bg-panel p-1.5">
        <option value="">All visible games</option>{visibleGames.map(game => <option key={game.id} value={String(game.id)}>{game.name}</option>)}
      </select>
    </label>
    <p className="text-xs text-muted">{formatPlaytime(chart.total)} · {chart.activeDays} active days{chart.busiestDay ? ` · Busiest: ${chart.busiestDay}` : ''}</p>
    <div className={`grid gap-4 ${prefs.view === 'year' ? 'playtime-calendar-year' : ''}`}>
      {chart.months.map(({ month, cells }) => <div key={month} className="min-w-0">
        {prefs.view === 'year' && <button type="button" className="mb-1 text-xs font-bold text-[rgb(var(--accent-2))]" onClick={() => set({ view: 'month', month })}>{MONTHS[month]}</button>}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted" aria-hidden="true">{WEEKDAYS.map((day, index) => <span key={index}>{day}</span>)}</div>
        <div className="mt-1 grid grid-cols-7 gap-1" data-controller-grid>
          {cells.map((cell, index) => cell ? <button key={cell.key} type="button" disabled={cell.future && !remindersEnabled} aria-pressed={selectedVisible && selected === cell.key} data-calendar-day={cell.key} data-has-reminders={reminderCounts[cell.key] ? 'true' : undefined}
            aria-label={`${cell.key}: ${chart.byDay[cell.key] ? formatPlaytime(chart.byDay[cell.key].minutes) : 'No recorded playtime'}${reminderCounts[cell.key] ? ` · ${reminderCounts[cell.key]} reminders` : ''}`}
            title={`${cell.key} · ${chart.byDay[cell.key] ? formatPlaytime(chart.byDay[cell.key].minutes) : 'No recorded playtime'}`}
            onClick={() => { setSelected(cell.key); setEditing(null); setReminderError(''); }} style={{ background: CALENDAR_HEAT[calendarHeat(chart.byDay[cell.key]?.minutes || 0)], outline: reminderCounts[cell.key] ? '1.5px solid rgb(var(--accent-2))' : undefined, outlineOffset: reminderCounts[cell.key] ? 1 : undefined }}
            className={`aspect-square min-h-5 rounded border text-[10px] font-bold disabled:opacity-20 ${selected === cell.key ? 'border-white ring-1 ring-white' : 'border-[rgb(var(--border)/0.4)]'} ${chart.byDay[cell.key]?.minutes >= 240 ? 'text-slate-950' : chart.byDay[cell.key]?.minutes > 0 ? 'text-white' : 'text-muted'}`}>{cell.day}</button> : <span key={`blank-${index}`} />)}
        </div>
      </div>)}
    </div>
    <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted" aria-label="Heat levels: none, under 30 minutes, 30 minutes to 2 hours, 2 to 4 hours, 4 hours or more">
      Less{CALENDAR_HEAT.map((color, index) => <span key={color} title={['No recorded time', 'Under 30m', '30m–2h', '2–4h', '4h+'][index]} className="h-3 w-3 rounded-sm border border-[rgb(var(--border))]" style={{ background: color }} />)}More
    </div>
    {selectedVisible && <CalendarDayPanel enabled={remindersEnabled} day={selected} onClose={()=>{setSelected(null);setEditing(null);}}><div className="rounded-lg border border-[rgb(var(--border))] p-2" aria-live="polite">
      <strong className="text-xs">{selected} · {formatPlaytime(entry?.minutes || 0)}</strong>
      {remindersEnabled && <div className="mt-2 space-y-2" aria-label="Reminders for selected date">
        <button type="button" onClick={()=>setEditing({new:true})} className={button}>Add reminder</button>
        {(reminderError||reminders.error)&&<p role="alert" className="text-xs text-amber-200">{reminderError||reminders.error}</p>}
        {selectedReminders.map(item=><article key={item.id} className="rounded border hairline p-2 text-xs"><strong>{item.time} · {item.acknowledged?'Done':'Reminder'}</strong><p className="whitespace-pre-wrap break-words">{item.text}</p><div className="mt-1 flex gap-2"><button type="button" className={button} onClick={()=>setEditing(item)}>Edit reminder</button><button type="button" className={button} aria-label={`Delete reminder at ${item.time}`} onClick={()=>{try{changeCalendarReminders(items=>items.filter(entry=>entry.id!==item.id));setEditing(null);}catch{setReminderError('Reminder could not be deleted. Please try again.');}}}>Delete</button></div></article>)}
        {editing&&<CalendarReminderForm key={editing.id||selected} day={selected} reminder={editing.new?null:editing} onClose={()=>setEditing(null)}/>}
      </div>}
      {entry ? <ul>{entry.games.map(game => <li key={game.id}><button type="button" onClick={() => onSelect?.(game.id)} className="flex w-full items-center justify-between gap-2 rounded p-1 text-left text-xs hover:bg-[rgb(var(--accent)/0.12)]"><span className="min-w-0 break-words">{game.name}</span><span className="shrink-0">{formatPlaytime(game.minutes)}</span></button></li>)}</ul> : <p className="mt-1 text-xs text-muted">No recorded playtime on this day.</p>}
    </div></CalendarDayPanel>}
    {!chart.activeDays && <p className="text-xs text-muted">No dated sessions for this period yet.</p>}
    <p className="text-[10px] text-muted">Completed local tracked sessions, recorded going forward. Imported lifetime totals and older undated hours are not spread across the calendar. Days begin at local midnight.</p>
  </section>;
});

function CalendarDayPanel({enabled,day,onClose,children}) {
  if(!enabled)return children;
  return <Modal open onClose={onClose} title={`Calendar · ${day}`} testid="calendar-date-menu"><div role="dialog" aria-modal="true" aria-label={`Calendar reminders for ${day}`} className="p-3">{children}<button type="button" data-testid="calendar-date-close" onClick={onClose} className="mt-3 rounded border hairline px-3 py-2 text-xs">Done</button></div></Modal>;
}
