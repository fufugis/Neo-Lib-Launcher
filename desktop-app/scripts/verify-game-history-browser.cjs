const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
if(!process.versions.electron){const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;const r=require('node:child_process').spawnSync(require('electron'),[__filename],{env,stdio:'inherit',windowsHide:true,timeout:90000});if(r.error)console.error(r.error);process.exit(r.status??1);}
const {app,BrowserWindow}=require('electron');
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'neolib-game-history-')));
app.whenReady().then(async()=>{
 const root=path.resolve(__dirname,'..'),esbuild=require('node:module').createRequire(require.resolve('vite'))('esbuild');
 const bundle=await esbuild.build({stdin:{resolveDir:root,loader:'jsx',contents:`
 import React from 'react';import {createRoot} from 'react-dom/client';import {flushSync} from 'react-dom';
 import Detail from './src/components/GameDetail.jsx';import {PREVIEW_SECTIONS,normalizePreviewLayout} from './src/components/preview/preview-layout-model.mjs';
 window.calls=[];window.opened=[];window.writes=[];window.errors=[];window.addEventListener('error',e=>window.errors.push(e.message));
 const nativeInterval=window.setInterval.bind(window);window.setInterval=(callback,delay,...args)=>{if(delay===30*60000)window.historyInterval=callback;return nativeInterval(callback,delay,...args);};
 const entries=Array.from({length:10},(_,i)=>({id:'entry-'+i,title:i===9?'<img src=x onerror=alert(1)>':'Patch '+i,url:'https://game.test/news/'+i,date:Date.parse('2020-01-'+String(i+1).padStart(2,'0')),snippet:'Developer notes with fixes and changes. '.repeat(3),platform:'publisher',sourceLabel:'Game developer',kind:i%3?'Patch':'Devblog'}));
 window.api={gameNewsHistory:async payload=>{window.calls.push(payload);if(payload.game.id==='late')return new Promise(resolve=>window.late=resolve);if(window.offline)throw Error('offline');return {ok:true,items:payload.game.id==='empty'?[]:entries,fetchedAt:Date.now(),cached:false,noSource:false,unavailable:false};},openExternal:url=>window.opened.push(url)};
 const base={id:'main',name:'Game',exePath:'C:/private/Game.exe',secret:'must not send',about:'A game with developer history.',source:'epic'};
 const rootNode=createRoot(document.getElementById('root'));
 function Fixture(){const [game,setGame]=React.useState(base),[layout,setLayout]=React.useState(null);window.changeGame=value=>flushSync(()=>setGame({...base,...value}));window.legacy=()=>{const positions=Object.fromEntries(PREVIEW_SECTIONS.filter(s=>s.id!=='history').map((s,i)=>[s.id,{x:0,y:i*190,width:1,height:160}]));window.old={version:1,positions,order:Object.keys(positions)};flushSync(()=>setLayout(JSON.parse(JSON.stringify(window.old))));};return <Detail game={game} categories={[]} settings={{previewLayout:layout,soundsEnabled:false}} onUpdateGame={(id,patch)=>{window.writes.push({id,patch});setGame(g=>({...g,...patch}))}} onPreviewLayoutChange={value=>{window.saved=JSON.parse(JSON.stringify(value));setLayout(value)}}/>}
 flushSync(()=>rootNode.render(<Fixture/>));void 0;
 `},bundle:true,write:false,format:'iife',define:{'process.env.NODE_ENV':'"development"','import.meta.env.BASE_URL':'"./"'},plugins:[{name:'fixture-assets',setup(build){build.onLoad({filter:/stock-theme-registry\.mjs$/},args=>({loader:'js',contents:fs.readFileSync(args.path,'utf8').replace(/^const (modules|assets) = import\.meta\.glob\(.*$/gm,'const $1 = {};')}));}}]});
 const win=new BrowserWindow({show:false,width:1600,height:1000,webPreferences:{sandbox:true,contextIsolation:true,backgroundThrottling:false,offscreen:true}});
 await win.loadURL('data:text/html,'+encodeURIComponent('<body style="margin:0;--ink:240 245 255;--muted:180 195 210;--surface:20 30 45;--panel:30 40 60;--border:90 110 140;--accent:100 200 255;--accent-2:220 160 255"><div id="root" style="height:100vh;display:flex"></div></body>'));
 const assets=path.join(root,'dist-renderer/assets');await win.webContents.insertCSS(fs.readFileSync(path.join(assets,fs.readdirSync(assets).find(n=>/^index-.*\.css$/.test(n))),'utf8')+'\n'+fs.readFileSync(path.join(root,'src/styles.css'),'utf8'));
 const run=s=>win.webContents.executeJavaScript(s),wait=ms=>new Promise(r=>setTimeout(r,ms)),click=async selector=>{await run('document.querySelector('+JSON.stringify(selector)+').click();void 0');await wait(120);};
 await run(bundle.outputFiles[0].text);await wait(500);
 assert.equal(await run('window.calls.length'),1);assert.equal(await run('window.calls[0].game.exePath'),undefined);assert.equal(await run('window.calls[0].game.secret'),undefined);
 assert.equal(await run('document.querySelectorAll("[data-testid=game-history-entry]").length'),5);
 assert.equal(await run('document.querySelector("[data-testid=game-history-entry] h3").textContent'),'<img src=x onerror=alert(1)>');
 assert.equal(await run('document.querySelectorAll("[data-testid=game-news-history] img").length'),0);
 assert.equal(await run('!!document.querySelector("[data-testid=latest-news-pill]")'),true,'latest pill reuses timeline data');
 await click('[data-testid=game-history-count]');assert.equal(await run('document.querySelectorAll("[data-testid=game-history-entry]").length'),10);assert.equal(await run('window.calls.length'),1);
 assert.equal(await run('(()=>{const viewport=document.querySelector("[data-testid=preview-layout-fit]");viewport.scrollTop=viewport.scrollHeight;const panel=document.querySelector("[data-testid=game-news-history]").getBoundingClientRect();return viewport.scrollHeight>viewport.clientHeight&&panel.bottom<=viewport.getBoundingClientRect().bottom+2})()'),true,'whole preview scroll reaches the history, no inner scrollbox');
 await wait(200);
 assert.equal(await run('getComputedStyle(document.querySelector("[data-testid=preview-layout-fit]")).overflowX'),'hidden','hero motion cannot introduce a horizontal scrollbar beside the timeline');
 if(process.env.NEOLIB_CAPTURE_HISTORY){console.log('History page geometry:',await run('(()=>{const p=document.querySelector("[data-testid=preview-layout-fit]");const s=document.querySelector(".preview-fit-surface");return {client:p.clientWidth,scroll:p.scrollWidth,top:p.scrollTop,canvas:s.getBoundingClientRect().width}})()'));const screenshot=path.join(os.tmpdir(),'neolib-game-history-'+Date.now()+'.png');fs.writeFileSync(screenshot,(await win.capturePage()).toPNG());console.log('History preview:',screenshot);}
 await run('[...document.querySelectorAll("[data-testid=game-history-entry] button")][0].click();void 0');assert.equal(await run('window.opened[0]'),'https://game.test/news/9');
 await click('[data-testid=game-history-source]');
 const input=async value=>run('(()=>{const e=document.querySelector("[aria-label=\\"Game news source URL\\"]");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(e,'+JSON.stringify(value)+');e.dispatchEvent(new Event("input",{bubbles:true}));})()');
 await input('https://127.0.0.1/feed');await run('document.querySelector("[data-testid=game-history-source-form]").dispatchEvent(new Event("submit",{bubbles:true,cancelable:true}));void 0');await wait(100);assert.equal(await run('window.writes.length'),0);
 await input('https://game.test/feed');await run('document.querySelector("[data-testid=game-history-source-form]").dispatchEvent(new Event("submit",{bubbles:true,cancelable:true}));void 0');await wait(400);
 assert.deepEqual(await run('window.writes[0]'),{id:'main',patch:{newsUrl:'https://game.test/feed'}});assert.equal(await run('window.calls.length'),2);
 await run('window.offline=true;void 0');await click('[data-testid=game-history-refresh]');await wait(350);
 assert.equal(await run('document.querySelectorAll("[data-testid=game-history-entry]").length'),5);assert.equal(await run('document.querySelector("[data-testid=game-news-history]").textContent.includes("Showing the last available history")'),true);
 await run('window.offline=false;window.legacy();void 0');await wait(200);
 assert.equal(await run('!!document.querySelector("[data-preview-section=history]")'),true);
 assert.equal(await run('(()=>{const history=document.querySelector("[data-preview-section=history]").getBoundingClientRect();return [...document.querySelectorAll("[data-preview-section]")].filter(e=>e.dataset.previewSection!=="history").every(e=>e.getBoundingClientRect().bottom<=history.top)})()'),true,'old layout gets history below existing rectangles');
 await run('window.callsBeforeEditor=window.calls.length;void 0');await click('[data-testid=preview-edit-layout]');await wait(400);
 assert.equal(await run('!!document.querySelector("[aria-label=\\"Move News and update history\\"]")'),true);
 assert.equal(await run('window.calls.length===window.callsBeforeEditor'),true,'live miniature does not fetch twice');
 assert.equal(await run('!!document.querySelector("[data-live-preview-section=history] [data-testid=game-news-history]")'),true);
 // Save migrated layout using the real editor; coordinates and new section persist.
 await run('[...document.querySelectorAll("button")].find(b=>b.textContent.trim()==="Save layout").click();void 0');await wait(200);
 assert.equal(await run('!!window.saved.positions.history'),true);
 assert.deepEqual(await run('window.saved.positions.hero'),await run('window.old.positions.hero'));
 await run('window.changeGame({id:"late",name:"Late game"});void 0');await wait(300);await run('window.changeGame({id:"empty",name:"Empty game"});void 0');await wait(400);
 assert.equal(await run('document.querySelectorAll("[data-testid=game-history-entry]").length'),0);
 await run('window.late({ok:true,items:[{title:"Wrong game",url:"https://game.test/wrong",date:1}]});void 0');await wait(200);
 assert.equal(await run('document.querySelector("[data-testid=game-news-history]").textContent.includes("Wrong game")'),false);
 assert.equal(await run('!!document.querySelector("[data-testid=game-history-empty]")'),true);
 await run('window.beforePeriodic=window.calls.length;window.realNow=Date.now;Date.now=()=>window.realNow()+31*60000;window.historyInterval();void 0');await wait(400);
 assert.equal(await run('window.calls.length'),await run('window.beforePeriodic+1'));
 assert.equal(await run('window.calls.at(-1).force'),true,'periodic refresh avoids 30-minute cache-boundary double-delay');
 await run('Date.now=window.realNow;void 0');
 assert.deepEqual(await run('window.errors'),[]);
 console.log('PASS: actual preview latest five/ten/date order, safe text/links, saved source/validation, stale offline data, scrollable page, legacy-layout migration/editor/live preview/save and late-game response isolation.');
 win.destroy();app.quit();
}).catch(error=>{console.error(error);app.exit(1);});
