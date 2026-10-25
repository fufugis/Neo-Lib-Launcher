import assert from 'node:assert/strict';
import path from 'node:path';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {applyExternalSession} from '../src/state/external-playtime-state.mjs';
import {applyPlaytimeImport} from '../src/state/playtime-state.mjs';
import {localPlayDay} from '../src/state/playtime-days.mjs';
const require=createRequire(import.meta.url);
const {createExternalGameWatchService}=require('../electron/game/external-game-watch-service.cjs');
const {createExternalSessionJournal}=require('../electron/game/external-session-journal.cjs');
const start=new Date(2026,9,22,12).getTime();
const ow={id:'ow',name:'Overwatch',exePath:'C:\\Games\\Overwatch\\OverwatchLauncher.exe',installDir:'C:\\Games\\Overwatch',playtime:100};
function fixture(games=[ow]) {
 let clock=start,records=[],failure=false,serial=0;
 const events=[],states=[],local=new Set();
 const service=createExternalGameWatchService({path:path.win32,platform:'win32',normalWinPath:v=>String(v||'').replaceAll('/','\\').toLowerCase(),isLikelyGameExe:n=>n.endsWith('.exe'),getRunningGameKeys:()=>local,now:()=>clock,makeSessionId:()=>`session-${++serial}`,sendSession:e=>events.push(e),sendExternalState:e=>states.push(e),setTimer:()=>({}),clearTimer:()=>{},execFile:(_f,_a,_o,cb)=>cb(failure?Error('unavailable'):null,JSON.stringify(records))});
 return {service,events,states,local,games,set records(v){records=v.map(ExecutablePath=>({ExecutablePath,StartedAtMs:clock}));},set failure(v){failure=v;},advance:ms=>clock+=ms,async init(){await service.watch({games});await new Promise(r=>setImmediate(r));},async scan(seconds=8){clock+=seconds*1000;return service.scanNow();}};
}
const f=fixture();f.records=['C:\\Games\\Overwatch\\retail\\Overwatch.exe'];await f.init();
assert.equal(f.states.at(-1).active,true);assert.equal(f.events[0].totalSeconds,0);
for(let i=0;i<8;i++)await f.scan();
assert.equal(f.events.at(-1).totalSeconds,64);
const before=f.events.length;await f.service.watch({games:[{...ow,playtime:101}]});assert.equal(f.events.length,before,'library saves do not replay checkpoints');
f.records=[];await f.scan();assert.equal(f.events.at(-1).final,true);assert.equal(f.events.at(-1).totalSeconds,72);
let library={games:[ow],tools:[{id:'tool',playtime:12}]};
for(const event of f.events)library=applyExternalSession(library,event);
assert.equal(library.games[0].playtime,101.2);assert.equal(library.games[0].playtimeDays[localPlayDay(start)],1.2);assert.equal(library.tools[0].playtime,12);
const saved=JSON.parse(JSON.stringify(library));assert.deepEqual(applyExternalSession(saved,f.events.at(-1)),saved);assert.equal(applyExternalSession(library,f.events.at(-1)),library,'exact duplicate is referentially unchanged');
// A failed query is not an exit, and uncertain/sleep time is never billed.
const uncertain=fixture();uncertain.records=['C:\\Games\\Overwatch\\retail\\Overwatch.exe'];await uncertain.init();await uncertain.scan();uncertain.failure=true;await uncertain.scan();assert.equal(uncertain.states.at(-1).active,true);uncertain.failure=false;await uncertain.scan(600);await uncertain.scan();uncertain.records=[];await uncertain.scan();assert.equal(uncertain.events.at(-1).totalSeconds,24);
const sleeping=fixture();sleeping.records=['C:\\Games\\Overwatch\\retail\\Overwatch.exe'];await sleeping.init();await sleeping.scan();sleeping.service.suspend();sleeping.advance(3600000);sleeping.service.resume();await new Promise(r=>setImmediate(r));await sleeping.scan();sleeping.service.shutdown();assert.equal(sleeping.events.at(-1).totalSeconds,16);
// Broad folders, launchers and helper processes must never become playtime.
const unsafe=fixture([{...ow,installDir:'C:\\Games'}]);unsafe.records=['C:\\Games\\Other\\Other.exe','C:\\Games\\Overwatch\\OverwatchLauncher.exe','C:\\Games\\Overwatch\\Agent.exe','C:\\Games\\Overwatch\\crashreporter.exe'];await unsafe.init();assert.equal(unsafe.events.length,0);assert.equal(unsafe.states.length,0);
const concurrent=fixture([ow,{...ow,id:'duplicate'},{id:'steam',name:'Steam game',exePath:'D:\\Steam\\My Game\\Game.exe',playtime:50}]);concurrent.records=['C:\\Games\\Overwatch\\retail\\Overwatch.exe','D:\\Steam\\My Game\\Game.exe'];await concurrent.init();assert.deepEqual(concurrent.events.map(e=>e.gameId),['ow','steam']);for(let i=0;i<8;i++)await concurrent.scan();assert.equal(concurrent.events.filter(e=>e.totalSeconds===64).length,2);concurrent.local.add('ow');await concurrent.scan();assert.equal(concurrent.events.some(e=>e.gameId==='duplicate'),false,'native-owned paths cannot leak through alias entries');
const manual=fixture([{...ow,trackingEnabled:false}]);manual.records=['C:\\Games\\Overwatch\\retail\\Overwatch.exe'];await manual.init();assert.equal(manual.states.at(-1).active,true);assert.equal(manual.events.length,0);
assert.equal(applyExternalSession({games:[{...ow,trackingMethod:'manual'}]},f.events.at(-1)).games[0].playtime,100);
// Recovery journal uses fake disk, including backup fallback and monotonic totals.
const disk=new Map(),fs={readFileSync:n=>{if(!disk.has(n))throw Error('missing');return disk.get(n);},mkdirSync:()=>{},writeFileSync:(n,s)=>disk.set(n,s),existsSync:n=>disk.has(n),copyFileSync:(a,b)=>disk.set(b,disk.get(a)),renameSync:(a,b)=>{disk.set(b,disk.get(a));disk.delete(a);}};
const journal=()=>createExternalSessionJournal({fs,path,file:()=>'/private/external-playtime.json'});
let j=journal();for(const event of f.events)assert(j.record(event));assert.equal(j.entries().length,1);assert(j.entries()[0].final);j.record(f.events[0]);assert(j.entries()[0].final);assert.equal(j.entries()[0].totalSeconds,72);assert.equal(journal().entries()[0].totalSeconds,72);assert(!disk.get('/private/external-playtime.json').includes('Overwatch'));
disk.set('/private/external-playtime.json','broken');assert(journal().entries().length>0,'backup recovered');
const backup=disk.get('/private/external-playtime.json.bak');const recovering=journal();recovering.entries();
const rename=fs.renameSync;fs.renameSync=()=>{throw Error('disk unavailable');};
assert.equal(recovering.record({...f.events.at(-1),sessionId:'retry'}),false);assert.equal(disk.get('/private/external-playtime.json.bak'),backup,'corrupt primary cannot replace good backup');
fs.renameSync=rename;assert.equal(recovering.record({...f.events.at(-1),sessionId:'retry'}),true,'identical snapshot retries failed disk write');assert.equal(journal().entries().some(e=>e.sessionId==='retry'),true);
for(let i=0;i<100;i++)recovering.record({...f.events.at(-1),sessionId:'bounded-'+i});assert.equal(recovering.entries().length,64);
// Exercise the actual root replay adapter, not a copied implementation. Empty
// hydration must not consume recovery; repeated saves must not create IPC loops.
const main=readFileSync(new URL('../electron/main.js',import.meta.url),'utf8'),rootServices={},replayed=[],watched=[];
const context={remainingIpcServices:rootServices,externalSessionJournal:{entries:()=>[f.events.at(-1)]},externalGameWatch:{watch:async value=>{watched.push(value);return {ok:true,watching:value.games.length,ignored:0};}}};
vm.runInNewContext(main.slice(main.indexOf('const externalReplayClients ='),main.indexOf("powerMonitor?.on?.('suspend'")),context);
const page={sender:{id:1,send:(channel,event)=>replayed.push({channel,event})}},watch=rootServices['game:watchExternal'];
await watch(page,{games:[],clientId:'page1'});await watch(page,{games:[ow],clientId:'page1'});assert.equal(replayed.length,1);assert.equal(replayed[0].event.replayed,true);assert.equal(watched.at(-1).games[0].playtime,101.2,'new native baseline includes unsaved journal time');
for(let i=0;i<5;i++)await watch(page,{games:[ow],clientId:'page1'});assert.equal(replayed.length,1);
await watch(page,{games:[ow],clientId:'reloaded'});assert.equal(replayed.length,2,'fresh renderer receives recovery');
await watch(page,{games:[{...ow,playtimeResetAt:start+1000000}],clientId:'reset'});await watch(page,{games:[{...ow,trackingEnabled:false}],clientId:'manual'});assert.equal(replayed.length,2);
// Absolute Steam imports must not double-count the same observed minutes.
const snapshot={gameId:'ow',sessionId:'import',basePlaytime:100,totalSeconds:60,startedAt:start,at:start+60000,final:false};
let imported=applyExternalSession({games:[ow]},snapshot);imported={...imported,games:applyPlaytimeImport(imported.games,[{id:'ow',playtime:105}])};imported=applyExternalSession(imported,{...snapshot,totalSeconds:120,at:start+120000});assert.equal(imported.games[0].playtime,105);imported=applyExternalSession(imported,{...snapshot,totalSeconds:360,at:start+360000});assert.equal(imported.games[0].playtime,106);assert.equal(applyPlaytimeImport(imported.games,[{id:'ow',playtime:90}])[0].playtime,106);
const reset={...imported,games:applyPlaytimeImport(imported.games,[{id:'ow',playtime:0,playtimeResetAt:start+400000}])};assert.equal(applyExternalSession(reset,{...snapshot,totalSeconds:500,at:start+500000}),reset);assert.equal(reset.games[0].playtime,0);
const midnight=new Date(2026,9,23,0,0,30).getTime();const overnight=applyExternalSession({games:[ow]},{...snapshot,sessionId:'midnight',startedAt:midnight-60000,at:midnight});assert.deepEqual(Object.values(overnight.games[0].playtimeDays),[0.5,0.5]);
for(const x of [f,uncertain,sleeping,unsafe,concurrent,manual])x.service.shutdown();
console.log('PASS: external Overwatch/Steam timing, concurrent games, launcher/alias exclusion, minute saves, unknown/sleep gaps, local journal/recovery, idempotent statistics, Steam reconciliation, reset protection and midnight split. No real game or process query ran.');
