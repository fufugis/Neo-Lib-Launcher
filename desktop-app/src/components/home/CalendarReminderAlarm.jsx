import React from 'react';
import { useReducedMotion } from 'framer-motion';
import { CalendarDays } from 'lucide-react';
import { useCalendarReminders } from './use-calendar-reminders.mjs';
import { changeCalendarReminders } from './calendar-reminder-store.mjs';
import { nextCalendarReminder } from './calendar-reminder-model.mjs';
import NewsAnnouncement from '../news/NewsAnnouncement';
import { notificationSurfaceBlocked } from '../news/notification-surface.mjs';
import { renderForegroundPortal } from '../ui/VisualBoundary';
import { playNewsChime } from '../../lib/sound';

export default function CalendarReminderAlarm({paused=false,mascotResting=false,settings={}}) {
  const {items,error}=useCalendarReminders();
  const [popup,setPopup]=React.useState(null),[storageError,setStorageError]=React.useState(false);
  const sounded=React.useRef(new Set()),latest=React.useRef({settings,mascotResting});latest.current={settings,mascotResting};
  const reducedMotion=useReducedMotion();
  React.useEffect(()=>{
    if(paused||popup||!items.some(item=>!item.acknowledged))return undefined;
    const check=()=>{
      const item=nextCalendarReminder(items);if(!item||notificationSurfaceBlocked(document))return;
      try{changeCalendarReminders(list=>list.map(entry=>entry.id===item.id?{...entry,announced:true}:entry));setStorageError(false);}catch{setStorageError(true);}
      setPopup(item);
      if(!item.announced&&!sounded.current.has(item.id)){
        sounded.current.add(item.id);
        playNewsChime({enabled:latest.current.settings.soundsEnabled!==false&&latest.current.settings.soundPack!=='none'});
        if(!latest.current.mascotResting&&latest.current.settings.fungistEnabled!==false)window.dispatchEvent(new Event('neolib:calendar-reminder'));
      }
    };
    check();const timer=window.setInterval(check,30000);
    const deadline=window.setTimeout(check,Math.max(0,Math.min(2147483647,Math.min(...items.filter(item=>!item.acknowledged).map(item=>item.at))-Date.now())));
    window.addEventListener('focus',check);document.addEventListener('visibilitychange',check);
    return ()=>{window.clearInterval(timer);window.clearTimeout(deadline);window.removeEventListener('focus',check);document.removeEventListener('visibilitychange',check);};
  },[items,paused,popup]);
  const active=popup&&(items.find(item=>item.id===popup.id)||popup);
  return active&&!paused?renderForegroundPortal(<NewsAnnouncement heading="Calendar reminder" Icon={CalendarDays} testid="calendar-reminder-popup" closeTitle="Mark reminder as done" footer="Close with X to mark this reminder as done." message={{title:`${active.day} · ${active.time}`,body:active.text}} reducedMotion={reducedMotion} storageError={storageError||Boolean(error)} onDismiss={()=>{
    try{changeCalendarReminders(list=>list.map(item=>item.id===active.id?{...item,acknowledged:true}:item));setStorageError(false);setPopup(null);}catch{setStorageError(true);}
  }}/>):null;
}
