const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
if(!process.versions.electron){const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;const r=require('node:child_process').spawnSync(require('electron'),[__filename],{env,stdio:'inherit',windowsHide:true,timeout:60000});if(r.error)console.error(r.error);process.exit(r.status??1);}
const {app,BrowserWindow}=require('electron');
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'neolib-external-time-')));
app.whenReady().then(async()=>{
 const root=path.resolve(__dirname,'..'),esbuild=require('node:module').createRequire(require.resolve('vite'))('esbuild');
 const bundle=await esbuild.build({stdin:{resolveDir:root,loader:'jsx',contents:`
 import React from 'react';import {createRoot} from 'react-dom/client';import {flushSync} from 'react-dom';
 import {useRendererStore} from './src/state/use-renderer-store.mjs';
 import useGameSessionEvents from './src/hooks/use-game-session-events.mjs';
 import {hydrateLibrary} from './src/state/library-state.mjs';
 import {statisticsGames} from './src/lib/emulator-profile-model.mjs';
 window.writes=[];window.listeners={native:new Set(),external:new Set()};window.problems=[];window.errors=[];window.addEventListener('error',e=>window.errors.push(e.message));
 const subscribe=key=>cb=>{window.listeners[key].add(cb);return()=>window.listeners[key].delete(cb)};
 const api={saveLibrary:async value=>window.writes.push(JSON.parse(JSON.stringify(value))),onGameExited:subscribe('native'),onExternalPlaytime:subscribe('external')};
 const seed={games:[{id:'ow',name:'Overwatch',playtime:100},{id:'steam',name:'Steam Game',playtime:50}],tools:[],categories:[]};
 const rootNode=createRoot(document.getElementById('root'));
 function Fixture(){const {library,setLibrary}=useRendererStore(api),libraryRef=React.useRef(library);React.useLayoutEffect(()=>{libraryRef.current=library;});
 const [running,setRunning]=React.useState({id:'ow',source:'external'}),[prompt,setPrompt]=React.useState(null);window.library=library;window.running=running;window.prompt=prompt;
 useGameSessionEvents({enabled:true,nativeApi:api,libraryRef,setLibrary,setRunningGame:setRunning,setRatingPromptGame:setPrompt,recordLaunchProblem:(...a)=>window.problems.push(a)});
 window.restore=value=>flushSync(()=>setLibrary(hydrateLibrary(value)));React.useEffect(()=>{setLibrary(hydrateLibrary(seed));},[]);
 return <main><div id="library-time">{library.games.find(g=>g.id==='ow')?.playtime}</div><div id="stats-time">{statisticsGames(library.games).reduce((s,g)=>s+(g.playtime||0),0)}</div></main>}
 window.emit=(key,event)=>{flushSync(()=>{for(const listener of window.listeners[key])listener(event);});};
 window.unmount=()=>flushSync(()=>rootNode.unmount());flushSync(()=>rootNode.render(<Fixture/>));void 0;
 `},bundle:true,write:false,format:'iife',define:{'process.env.NODE_ENV':'"development"','import.meta.env.BASE_URL':'"./"'},plugins:[{name:'fixture-assets',setup(build){build.onLoad({filter:/stock-theme-registry\.mjs$/},args=>({loader:'js',contents:fs.readFileSync(args.path,'utf8').replace(/^const (modules|assets) = import\.meta\.glob\(.*$/gm,'const $1 = {};')}));}}]});
 const win=new BrowserWindow({show:false,width:1000,height:700,webPreferences:{sandbox:true,contextIsolation:true,backgroundThrottling:false,offscreen:true}});
 await win.loadURL('data:text/html,'+encodeURIComponent('<div id="root"></div>'));
 const run=s=>win.webContents.executeJavaScript(s),wait=()=>new Promise(r=>setTimeout(r,150));
 await run(bundle.outputFiles[0].text);await wait();
 const at=Date.now(),event={gameId:'ow',sessionId:'external-test',basePlaytime:100,totalSeconds:60,startedAt:at-60000,at,final:false};
 const emit=async(key,value)=>{await run('window.emit('+JSON.stringify(key)+','+JSON.stringify(value)+');void 0');await wait();};
 await emit('external',event);
 assert.equal(await run('document.querySelector("#library-time").textContent'),'101');assert.equal(await run('document.querySelector("#stats-time").textContent'),'151');
 assert.equal(await run('window.running.source'),'external','checkpoint must not clear Rest/running state');
 assert.equal(await run('Object.values(window.writes.at(-1).games[0].playtimeDays)[0]'),1);
 const writes=await run('window.writes.length');await emit('external',event);assert.equal(await run('window.writes.length'),writes,'no save feedback loop');
 await run('window.restore(JSON.parse(JSON.stringify(window.writes.at(-1))));void 0');await wait();await emit('external',{...event,replayed:true});assert.equal(await run('window.library.games[0].playtime'),101,'reload keeps receipt');
 await emit('external',{...event,totalSeconds:120,at:at+60000,final:true});assert.equal(await run('window.library.games[0].playtime'),102);assert.equal(await run('window.listeners.external.size'),1);assert.equal(await run('window.listeners.native.size'),1);
 await emit('native',{gameId:'steam',seconds:120});assert.equal(await run('window.library.games[1].playtime'),52,'native launch tracking retained');assert.equal(await run('window.running.id'),'ow','unrelated exit preserves external running state');
 await emit('external',{...event,sessionId:'recovered-rating',basePlaytime:102,totalSeconds:1000,at:at+1000000,final:true,replayed:true});await new Promise(r=>setTimeout(r,750));assert.equal(await run('window.prompt'),null,'journal recovery never opens a stale rating dialog');
 assert.deepEqual(await run('window.errors'),[]);await run('window.unmount();void 0');assert.equal(await run('window.listeners.external.size'),0);assert.equal(await run('window.listeners.native.size'),0);
 console.log('PASS: actual renderer session subscriptions update Library/statistics/calendar, persist snapshots and receipts, recover without duplicate writes, preserve Rest/native tracking, suppress replay prompts and clean up listeners. Isolated fixture only.');
 win.destroy();app.quit();
}).catch(error=>{console.error(error);app.exit(1);});
