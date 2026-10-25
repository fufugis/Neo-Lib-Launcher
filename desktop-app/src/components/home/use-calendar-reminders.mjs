import { useEffect, useState } from 'react';
import { readCalendarReminders } from './calendar-reminder-store.mjs';
import { CALENDAR_REMINDERS_KEY, CALENDAR_REMINDERS_EVENT } from './calendar-reminder-model.mjs';
export function useCalendarReminders(enabled = true) {
  const [state,setState]=useState({items:[],error:''});
  useEffect(()=>{
    if (!enabled) return undefined;
    const sync=()=>{try{setState({items:readCalendarReminders(),error:''});}catch{setState(previous=>({...previous,error:'Reminders could not be read or saved. Existing data has not been replaced.'}));}};
    const storage=event=>{if(event.key===CALENDAR_REMINDERS_KEY||event.key===null)sync();};
    sync();window.addEventListener(CALENDAR_REMINDERS_EVENT,sync);window.addEventListener('storage',storage);
    return ()=>{window.removeEventListener(CALENDAR_REMINDERS_EVENT,sync);window.removeEventListener('storage',storage);};
  },[enabled]);
  return state;
}
