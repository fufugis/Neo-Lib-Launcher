// Actual Home and shared layout editor, isolated data/profile; no real native work.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
if(!process.versions.electron){const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;const run=require('node:child_process').spawnSync(require('electron'),[__filename],{env,stdio:'inherit',windowsHide:true,timeout:90000});if(run.error)console.error(run.error);process.exit(run.status??1);}
const {app,BrowserWindow}=require('electron');
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'neolib-live-layout-')));
app.whenReady().then(async()=>{
 const root=path.resolve(__dirname,'..'),esbuild=require('node:module').createRequire(require.resolve('vite'))('esbuild');
 const bundle=await esbuild.build({stdin:{resolveDir:root,loader:'jsx',contents:`
 import React from 'react';import {createRoot} from 'react-dom/client';import {flushSync} from 'react-dom';
 import Home from './src/components/HomeHub.jsx';import Page from './src/components/preview/PreviewPageLayout.jsx';
 import {HOME_WIDGET_BY_ID} from './src/components/home/home-widget-registry.mjs';import {PREVIEW_SECTIONS} from './src/components/preview/preview-layout-model.mjs';
 const root=createRoot(document.getElementById('root'));
 window.writes=[];window.actions=0;window.nativeCalls=[];window.api={};
 const games=[{id:'g',name:'An actual game from your Library',playtime:120,playtimeMinutes:120,lastPlayedAt:Date.now(),addedAt:Date.now(),rating:4}];
 const initial={snapToGrid:false,editorSnapToGrid:false,widgetOrder:['recent','playtime-pie'],hidden:Object.keys(HOME_WIDGET_BY_ID).filter(id=>!['recent','playtime-pie'].includes(id)),freePositions:{recent:{x:0,y:0,width:500,height:350},'playtime-pie':{x:520,y:0,width:500,height:400}}};
 function Fixture(){const [layout,setLayout]=React.useState(initial);return <Home games={games} resting homeLayout={layout} onSelect={()=>window.actions++} onUpdateHomeLayout={value=>{window.writes.push(value);setLayout(value)}}/>}
 window.showHome=()=>flushSync(()=>root.render(<Fixture/>));
 function Probe(){return <div data-probe style={{fontSize:16,lineHeight:'24px'}}><p data-wrap>{'Real descriptive text that wraps naturally to the box width. '.repeat(12)}</p><div data-grid style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))'}}>{['One','Two','Three'].map(x=><span key={x}>{x}</span>)}</div><button data-action onClick={()=>window.actions++}>Launch</button></div>}
 const blocks=Object.fromEntries(PREVIEW_SECTIONS.map(s=>[s.id,<Probe key={s.id}/>]));
 function Preview(){const [layout,setLayout]=React.useState({version:1,snap:false,order:PREVIEW_SECTIONS.map(s=>s.id),positions:Object.fromEntries(PREVIEW_SECTIONS.map((s,i)=>[s.id,{x:0,y:i*350,width:1,height:320}]))});return <Page blocks={blocks} savedLayout={layout} onLayoutChange={value=>{window.writes.push(value);setLayout(value)}}/>}
 window.showPreview=()=>flushSync(()=>root.render(<Preview/>));window.showHome();
 `},loader:{'.webp':'dataurl','.svg':'dataurl','.png':'dataurl'},bundle:true,write:false,format:'iife',define:{'process.env.NODE_ENV':'"development"','import.meta.env.BASE_URL':'"./"'},plugins:[{name:'assets',setup(build){build.onLoad({filter:/stock-theme-registry\.mjs$/},args=>({loader:'js',contents:fs.readFileSync(args.path,'utf8').replace(/^const (modules|assets) = import\.meta\.glob\(.*$/gm,'const $1 = {};')}));}}]});
 const win=new BrowserWindow({show:false,width:1500,height:1000,useContentSize:true,webPreferences:{sandbox:true,contextIsolation:true,backgroundThrottling:false,offscreen:true}});
 await win.loadURL('data:text/html,'+encodeURIComponent('<body style="margin:0;--ink:240 245 255;--muted:180 195 210;--surface:20 30 45;--panel:30 40 60;--border:90 110 140;--accent:100 200 255;--accent-2:220 160 255"><div id="root" class="neolib-ui-foreground" style="height:100vh;display:flex"></div></body>'));
 const assets=path.join(root,'dist-renderer/assets');await win.webContents.insertCSS(fs.readFileSync(path.join(assets,fs.readdirSync(assets).find(n=>/^index-.*\.css$/.test(n))),'utf8')+'\n'+fs.readFileSync(path.join(root,'src/styles.css'),'utf8'));
 win.webContents.on('console-message',(_event,level,message)=>{if(level>=2)console.error(message)});
 const run=async s=>{try{return await win.webContents.executeJavaScript(s)}catch(error){throw Error('Fixture expression '+s.slice(0,180)+': '+error.message)}},settle=()=>new Promise(r=>setTimeout(r,220));
 const click=async s=>{await run(`document.querySelector(${JSON.stringify(s)}).click();void 0`);await settle();};
 const field=async(label,value)=>{await run(`(()=>{const e=document.querySelector('[aria-label="${label}"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'${value}');e.dispatchEvent(new Event('input',{bubbles:true}));})()`);await settle();};
 await run(bundle.outputFiles[0].text);await settle();
 const before=await run('window.writes.length');
 await click('[data-testid=home-widget-settings-button]');await click('[data-testid=home-layout-lock-toggle]');
 assert.equal(await run('document.querySelectorAll("[data-editor-live-content]").length'),2);
 assert.equal(await run('document.querySelector("[data-editor-live-content=recent]").textContent.includes("An actual game from your Library")'),true);
 assert.equal(await run('document.querySelectorAll("[data-testid=playtime-pie-widget]").length'),1,'Built-in content mounts once, not both behind and inside the editor');
 assert.equal(await run('document.querySelector("[data-editor-live-content]").inert'),true);
 const original=await run('document.querySelector("[data-editor-widget-id=recent]").style.width');
 await run(`document.querySelector('[aria-label="Resize Recently active"]').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));void 0`);await settle();
 assert.notEqual(await run('document.querySelector("[data-editor-widget-id=recent]").style.width'),original);
 assert.equal(await run('document.querySelector("[data-editor-live-content=recent] [data-home-pane-id=recent]").style.width'),await run('document.querySelector("[data-editor-widget-id=recent]").style.width'));
 await run(`document.querySelector('[aria-label="Resize Recently active"]').scrollIntoView({block:'center',inline:'center'});void 0`);await settle();
 const grip=await run(`(()=>{const b=document.querySelector('[aria-label="Resize Recently active"]').getBoundingClientRect();return {x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2)}})()`);
 win.webContents.focus();win.webContents.sendInputEvent({type:'mouseMove',...grip});
 win.webContents.sendInputEvent({type:'mouseDown',button:'left',clickCount:1,modifiers:['leftButtonDown'],...grip});
 win.webContents.sendInputEvent({type:'mouseMove',x:grip.x+45,y:grip.y+5,modifiers:['leftButtonDown']});await settle();
 assert.equal(await run('document.querySelector("[data-editor-live-content=recent] [data-home-pane-id=recent]").style.width'),await run('document.querySelector("[data-editor-widget-id=recent]").style.width'),'Real content updates during the held native resize, before release');
 win.webContents.sendInputEvent({type:'mouseUp',button:'left',clickCount:1,x:grip.x+45,y:grip.y+5});await settle();
 const homeProof=path.join(os.tmpdir(),'neolib-home-live-boxes-'+Date.now()+'.png');
 fs.writeFileSync(homeProof,(await win.webContents.capturePage()).toPNG());console.log('Home live-content preview:',homeProof);
 await click('[data-testid=editor-content-preview-toggle]');assert.equal(await run('document.querySelectorAll("[data-editor-live-content]").length'),0);
 await click('[data-testid=editor-content-preview-toggle]');assert.equal(await run('document.querySelectorAll("[data-testid=playtime-pie-widget]").length'),1);
 await click('[data-controller-close]');assert.equal(await run('window.writes.length'),before,'Cancel leaves Home settings alone');
 assert.equal(await run('document.querySelectorAll("[data-testid=playtime-pie-widget]").length'),1);
 await run('window.showPreview();void 0');await settle();await click('[data-testid=preview-edit-layout]');
 assert.equal(await run('document.querySelectorAll("[data-editor-live-content]").length'),8);
 assert.equal(await run('!!document.querySelector("[data-testid=preview-layout-live]")'),false,'Separate miniature is optional, not duplicated by default');
 const height=()=>run('document.querySelector("[data-editor-live-content=hero] [data-wrap]").offsetHeight');
 const wide=await height();
 await field('Section width',320);await field('Section height',700);
 const narrow=await height();assert(narrow>wide,'Text reflows at the resized width rather than scaling');
 assert.equal(await run('getComputedStyle(document.querySelector("[data-editor-live-content=hero] [data-probe]")).fontSize'),'16px');
 assert.equal(await run('getComputedStyle(document.querySelector("[data-editor-live-content=hero] [data-grid]")).gridTemplateColumns.split(" ").length'),2);
 await field('Section width',180);
 assert.equal(await run('getComputedStyle(document.querySelector("[data-editor-live-content=hero] [data-grid]")).gridTemplateColumns.split(" ").length'),1);
 await run('document.querySelector("[data-editor-live-content=hero] [data-action]").click();void 0');assert.equal(await run('window.actions'),0,'Even programmatic bubbling clicks are blocked before preview actions');
 assert.equal(await run('window.writes.length'),before,'Draft adjustments do not write settings');
 await click('[data-testid=home-editor-save]');assert.equal(await run('window.writes.length'),before+1);
 await click('[data-testid=preview-edit-layout]');assert.equal(await run(`document.querySelector('input[aria-label="Section width"]').value`),'180','Saved dimensions reopen');
 await click('[data-controller-close]');
 console.log('PASS: real Home content once, inert preview/toggle/cancel, matching resized widget frame; Library in-box live text/grid reflow, unchanged font size, blocked actions, optional miniature and draft Save/reopen.');
 win.destroy();app.quit();
}).catch(error=>{console.error(error);app.exit(1)});
