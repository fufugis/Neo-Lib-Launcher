const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
if(!process.versions.electron){const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;const result=require('node:child_process').spawnSync(require('electron'),[__filename],{env,stdio:'inherit',windowsHide:true,timeout:60000});if(result.error)console.error(result.error);process.exit(result.status??1);}
const {app,BrowserWindow}=require('electron');
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'neolib-calendar-reminder-')));
app.whenReady().then(async()=>{
 const root=path.resolve(__dirname,'..'),esbuild=require('node:module').createRequire(require.resolve('vite'))('esbuild');
 const bundle=await esbuild.build({stdin:{resolveDir:root,loader:'jsx',contents:`
 import React from 'react';import {createRoot} from 'react-dom/client';import {flushSync} from 'react-dom';
 import Calendar from './src/components/home/PlaytimeCalendarWidget.jsx';import Alarm from './src/components/home/CalendarReminderAlarm.jsx';import Mascot from './src/components/FungistMascot.jsx';
 import {MotionGlobalConfig} from 'framer-motion';MotionGlobalConfig.skipAnimations=true;
 window.options={};window.showCalendar=true;window.chimes=0;window.reactions=0;window.addEventListener('neolib:calendar-reminder',()=>window.reactions++);
 let root=createRoot(document.getElementById('root'));
 function Fixture(){const [preferences,setPreferences]=React.useState({view:'month',year:2030,month:0});return <>{window.showCalendar&&<Calendar games={[]} preferences={preferences} onPreferencesChange={setPreferences} remindersEnabled/>}<Alarm paused={!!window.options.paused} mascotResting={!!window.options.rest} settings={{soundsEnabled:window.options.sounds!==false}}/><Mascot enabled resting={!!window.options.rest} soundsEnabled={false} voiceEnabled={false}/></>}
 window.draw=()=>flushSync(()=>root.render(<Fixture/>));
 window.remount=()=>{flushSync(()=>root.unmount());root=createRoot(document.getElementById('root'));window.draw();};
 window.draw();void 0;
 `},bundle:true,write:false,format:'iife',define:{'process.env.NODE_ENV':'"development"','import.meta.env.BASE_URL':'"./"'},plugins:[{name:'fixture-feedback',setup(build){
 build.onLoad({filter:/[\\/]lib[\\/]sound\.js$/},()=>({loader:'js',contents:'export function playNewsChime(o){if(o.enabled)window.chimes++;}export function playFungistCue(){}'}));
 build.onLoad({filter:/[\\/]lib[\\/]mascotVoice\.js$/},()=>({loader:'js',contents:'export function playMascotVoice(){}export function stopMascotVoice(){}export function fungistChatVoiceFor(){return ""}'}));
 }}]});
 const win=new BrowserWindow({show:false,width:1100,height:900,webPreferences:{sandbox:true,contextIsolation:true,backgroundThrottling:false}});
 await win.loadURL('data:text/html,'+encodeURIComponent('<body style="margin:0;--ink:240 245 255;--surface:20 30 45;--panel:30 40 60;--border:90 110 140;--accent:100 200 255;--accent-2:220 160 255"><div id="root" style="max-width:600px"></div></body>'));
 await win.webContents.executeJavaScript(`
 const values=new Map();window.storageFails=false;
 Object.defineProperty(window,'localStorage',{value:{getItem:k=>values.get(k)||null,setItem:(k,v)=>{if(window.storageFails)throw new Error('fixture quota');values.set(k,v)}}});
 const NativeDate=Date;let clock=new NativeDate(2030,0,10,8).getTime();window.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:[clock]))}static now(){return clock}};
 window.setClock=(day,hour,minute)=>{clock=new NativeDate(2030,0,day,hour,minute).getTime()};
 window.matchMedia=q=>({matches:q.includes('prefers-reduced-motion'),media:q,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});void 0;`);
 const assets=path.join(root,'dist-renderer/assets');await win.webContents.insertCSS(fs.readFileSync(path.join(assets,fs.readdirSync(assets).find(n=>/^index-.*\.css$/.test(n))),'utf8')+'\n'+fs.readFileSync(path.join(root,'src/styles.css'),'utf8'));
 await win.webContents.executeJavaScript(bundle.outputFiles[0].text);
 const run=c=>win.webContents.executeJavaScript(c),settle=()=>new Promise(resolve=>setTimeout(resolve,150));
 const click=async selector=>{await run(`document.querySelector(${JSON.stringify(selector)}).click();void 0`);await settle();};
 const textClick=async text=>{await run(`[...document.querySelectorAll('button')].find(b=>b.textContent===${JSON.stringify(text)}).click();void 0`);await settle();};
 const fill=async(label,value)=>{await run(`(()=>{const e=document.querySelector('[aria-label="${label}"]');const p=e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(p,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));})()`);await settle();};
 const popup=()=>run(`!!document.querySelector('[data-testid="calendar-reminder-popup"]')`);
 const add=async(time,text)=>{await textClick('Add reminder');await fill('Reminder time',time);await fill('Reminder text',text);await textClick('Save reminder');};
 await settle();
 assert.equal(await run(`document.querySelector('[data-calendar-day="2030-01-11"]').disabled`),false,'Future date is selectable');
 await click('[data-calendar-day="2030-01-11"]');
 await add('09:30','Play with friends <not HTML>');
 assert.equal(await run(`document.querySelector('[data-calendar-day="2030-01-11"]').dataset.hasReminders`),'true',await run(`document.querySelector('[role="alert"]')?.textContent||document.querySelector('form')?.textContent||'Reminder not saved'`));
 await add('10:00','Temporary reminder');
 await click('[aria-label="Delete reminder at 10:00"]');
 await textClick('Edit reminder');await fill('Reminder text','Bring snacks <not HTML>');await textClick('Save reminder');
 await add('09:31','Second reminder');
 await run('window.remount();void 0');await settle();
 assert.equal(await run(`document.querySelector('[data-calendar-day="2030-01-11"]').dataset.hasReminders`),'true','Date outline survives reload');
 await run(`setClock(11,9,29);window.dispatchEvent(new Event('focus'));void 0`);await settle();assert.equal(await popup(),false);
 await run(`setClock(11,9,30);window.dispatchEvent(new Event('focus'));void 0`);await settle();assert.equal(await popup(),true);
 assert.equal(await run('chimes'),1);assert.equal(await run('reactions'),1);
 assert.equal(await run(`!!document.querySelector('[data-news-reaction="true"]')`),true,'Actual mascot reacts');
 assert.equal(await run(`document.querySelector('[data-testid="calendar-reminder-popup"] p').textContent`),'Bring snacks <not HTML>');
 await run(`document.querySelector('[data-testid="news-announcement-layer"]').click();document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));setClock(11,11,0);void 0`);await settle();assert.equal(await popup(),true);
 await run('window.remount();void 0');await settle();assert.equal(await popup(),true);assert.equal(await run('chimes'),1,'Restart restores without replay');
 await run('window.storageFails=true;void 0');await click('[aria-label="Close announcement"]');assert.equal(await popup(),true,'Failed save cannot discard alarm');
 await run('window.storageFails=false;void 0');await click('[aria-label="Close announcement"]');await settle();
 assert.equal(await run(`document.querySelector('[data-testid="calendar-reminder-popup"] p').textContent`),'Second reminder','Due reminders queue rather than overwrite');
 assert.equal(await run('chimes'),2);
 await click('[aria-label="Close announcement"]');await settle();assert.equal(await popup(),false);
 await click('[data-calendar-day="2030-01-12"]');await add('10:00','Works outside Home');
 await run(`window.showCalendar=false;window.options={rest:true,sounds:false};window.draw();setClock(12,10,0);window.dispatchEvent(new Event('focus'));void 0`);await settle();
 assert.equal(await popup(),true,'Alarm stays active when calendar is unmounted');
 assert.equal(await run('chimes'),2);assert.equal(await run('reactions'),2,'Muted rest alarm does not wake mascot');
 await click('[aria-label="Close announcement"]');await settle();assert.equal(await popup(),false);
 console.log('PASS: actual calendar add/edit/delete, future dates/outlines/reload, timed centered alarm, mascot/chime, escaped notes, explicit X, storage-failure recovery, queued overdue reminders, restart deduplication and global muted/rest delivery without Home.');
 win.destroy();app.quit();
}).catch(error=>{console.error(error);app.exit(1);});
