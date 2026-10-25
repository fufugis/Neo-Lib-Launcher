import React from 'react';
import { makeCalendarReminder, MAX_CALENDAR_REMINDERS } from './calendar-reminder-model.mjs';
import { changeCalendarReminders } from './calendar-reminder-store.mjs';
export default function CalendarReminderForm({day, reminder, onClose}) {
  const [date,setDate]=React.useState(reminder?.day||day),[time,setTime]=React.useState(reminder?.time||'09:00');
  const [text,setText]=React.useState(reminder?.text||''),[error,setError]=React.useState('');
  const input='w-full rounded border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-2 text-xs text-ink';
  return <form aria-label={reminder?'Edit reminder':'Add reminder'} className="mt-3 space-y-2 rounded-lg border border-[rgb(var(--accent)/0.5)] p-3" onSubmit={event=>{
    event.preventDefault();try{
      const next=makeCalendarReminder({day:date,time,text},Date.now(),reminder?.id);
      changeCalendarReminders(items=>{if(!reminder&&items.length>=MAX_CALENDAR_REMINDERS)throw new Error('Reminder limit reached. Delete an old reminder first.');return [...items.filter(item=>item.id!==next.id),next];});onClose();
    }catch(reason){setError(reason.message||'Reminder could not be saved.');}
  }}>
    <div className="grid grid-cols-2 gap-2"><label className="text-xs">Date<input autoFocus aria-label="Reminder date" type="date" required value={date} onChange={event=>setDate(event.target.value)} className={input}/></label>
    <label className="text-xs">Time (local)<input aria-label="Reminder time" type="time" required value={time} onChange={event=>setTime(event.target.value)} className={input}/></label></div>
    <label className="block text-xs">Your reminder<textarea aria-label="Reminder text" required maxLength={1000} rows={3} value={text} onChange={event=>setText(event.target.value)} className={input}/></label>
    {error&&<p role="alert" className="text-xs text-amber-200">{error}</p>}
    <div className="flex gap-2"><button type="submit" className="rounded bg-[rgb(var(--accent))] px-3 py-2 text-xs font-bold text-[rgb(var(--surface))]">Save reminder</button><button type="button" onClick={onClose} className="rounded border hairline px-3 py-2 text-xs">Cancel</button></div>
    <p className="text-[10px] text-muted">Saved only on this computer. Neo-Lib must be running; overdue reminders appear when it next opens.</p>
  </form>;
}
