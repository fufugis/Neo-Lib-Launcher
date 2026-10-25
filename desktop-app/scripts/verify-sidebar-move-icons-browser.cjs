const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
if(!process.versions.electron){const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;const result=require('node:child_process').spawnSync(require('electron'),[__filename],{env,stdio:'inherit',windowsHide:true,timeout:60000});if(result.error)console.error(result.error);process.exit(result.status??1);}
const {app,BrowserWindow}=require('electron');
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'neolib-sidebar-icons-')));
app.whenReady().then(async()=>{
 const root=path.resolve(__dirname,'..'),esbuild=require('node:module').createRequire(require.resolve('vite'))('esbuild');
 const bundle=await esbuild.build({stdin:{resolveDir:root,loader:'jsx',contents:`
 import React from 'react';import {createRoot} from 'react-dom/client';import {flushSync} from 'react-dom';
 import {SideNavigationRail} from './src/components/Sidebar.jsx';
 import {normalizeSidebarTweaks} from './src/components/library/sidebar-tweaks-model.mjs';
 window.saved=normalizeSidebarTweaks();window.errors=[];window.actions=[];window.addEventListener('error',e=>window.errors.push(e.message));
 const rootNode=createRoot(document.getElementById('root'));
 function Fixture(){const [value,setValue]=React.useState(window.saved);window.restore=()=>flushSync(()=>setValue(normalizeSidebarTweaks(JSON.parse(JSON.stringify(window.saved)))));
 return <SideNavigationRail mode="home" libraryViewMode="list" onOpenHome={()=>window.actions.push('home')} onOpenLibrary={()=>window.actions.push('library')} sidebarTweaks={value} onSidebarTweaksChange={next=>{window.saved=JSON.parse(JSON.stringify(next));setValue(next);}} addonsEnabled addons={[{id:'shelf',name:'Shelf'}]} />;}
 flushSync(()=>rootNode.render(<Fixture/>));void 0;
 `},bundle:true,write:false,format:'iife',loader:{'.webp':'dataurl'},define:{'process.env.NODE_ENV':'"development"','import.meta.env.BASE_URL':'"./"'},plugins:[{name:'fixture-assets',setup(build){build.onLoad({filter:/stock-theme-registry\.mjs$/},args=>({loader:'js',contents:fs.readFileSync(args.path,'utf8').replace(/^const (modules|assets) = import\.meta\.glob\(.*$/gm,'const $1 = {};')}));}}]});
 const win=new BrowserWindow({show:false,width:1100,height:950,webPreferences:{sandbox:true,contextIsolation:true,backgroundThrottling:false,offscreen:true}});
 await win.loadURL('data:text/html,'+encodeURIComponent('<body style="margin:0;--ink:240 245 255;--muted:180 195 210;--surface:20 30 45;--panel:30 40 60;--border:90 110 140;--accent:100 200 255;--accent-2:220 160 255"><div id="root" style="height:100vh"></div></body>'));
 const assets=path.join(root,'dist-renderer/assets');await win.webContents.insertCSS(fs.readFileSync(path.join(assets,fs.readdirSync(assets).find(n=>/^index-.*\.css$/.test(n))),'utf8')+'\n'+fs.readFileSync(path.join(root,'src/styles.css'),'utf8'));
 const run=s=>win.webContents.executeJavaScript(s),wait=ms=>new Promise(r=>setTimeout(r,ms));
 const click=async selector=>{await run('document.querySelector('+JSON.stringify(selector)+').click();void 0');await wait(100);};
 const textClick=async text=>{await run('[...document.querySelectorAll("button")].find(b=>b.textContent.trim()==='+JSON.stringify(text)+').click();void 0');await wait(100);};
 const setInput=async(selector,value)=>{await run('(()=>{const e=document.querySelector('+JSON.stringify(selector)+');const key=Object.keys(e).find(k=>k.startsWith("__reactProps$"));e[key].onChange({target:{value:'+JSON.stringify(value)+'}});})();void 0');await wait(100);};
 await run(bundle.outputFiles[0].text);await wait(200);
 await click('[data-testid=sidebar-rail-visuals-menu-btn]');await click('[data-testid=sidebar-rail-sidebar-tweaks-btn]');await textClick('Move icons');
 assert.equal(await run('document.querySelectorAll("[data-sidebar-move-id]").length'),12);
 await click('[aria-label="Customize Home icon"]');assert.equal(await run('document.querySelector("[data-testid=sidebar-icon-color-editor] h3").textContent'),'Home');
 await setInput('[aria-label="Home icon colour"]','#ff8800');
 assert.equal(await run('window.saved.colors["tab-home"]'),'#ff8800');
 assert.equal(await run('getComputedStyle(document.querySelector("[data-testid=tab-home] .neo-rail-button__icon")).color'),'rgb(255, 136, 0)');
 assert.equal(await run('getComputedStyle(document.querySelector("[data-testid=tab-library] .neo-rail-button__icon")).color'),'rgb(112, 192, 242)');
 const drag=async(source,target,after=false)=>{await run('(()=>{const source=document.querySelector("[data-sidebar-move-id='+source+']"),target=document.querySelector("[data-sidebar-move-id='+target+']"),dataTransfer=new DataTransfer();source.dispatchEvent(new DragEvent("dragstart",{bubbles:true,dataTransfer}));const bounds=target.getBoundingClientRect();target.dispatchEvent(new DragEvent("dragover",{bubbles:true,cancelable:true,dataTransfer,clientY:bounds.top+'+(after?'bounds.height-1':'1')+'}));target.dispatchEvent(new DragEvent("drop",{bubbles:true,cancelable:true,dataTransfer,clientY:bounds.top+'+(after?'bounds.height-1':'1')+'}));source.dispatchEvent(new DragEvent("dragend",{bubbles:true,dataTransfer}));})();void 0');await wait(100);};
 await drag('tab-home','sidebar-rail-lounge-btn');assert.equal(await run('window.saved.order[0]'),'tab-home');
 assert.equal(await run('document.querySelector("[data-testid=side-navigation-rail] button").dataset.testid'),'tab-home');
 assert.equal(await run('window.saved.colors["tab-home"]'),'#ff8800');
 await drag('addon-shelf','sidebar-rail-quit-btn',true);assert.equal(await run('window.saved.order.at(-1)'),'addon-shelf');
 assert.equal(await run('document.querySelectorAll("[data-drop-position]").length'),0);
 // Cancellation cannot leave a held row or change order on a subsequent drop.
 const order=await run('window.saved.order');await run('(()=>{const e=document.querySelector("[data-sidebar-move-id=tab-home]"),dataTransfer=new DataTransfer();e.dispatchEvent(new DragEvent("dragstart",{bubbles:true,dataTransfer}));e.dispatchEvent(new DragEvent("dragend",{bubbles:true,dataTransfer}));document.querySelector("[data-sidebar-move-id=tab-library]").dispatchEvent(new DragEvent("drop",{bubbles:true,cancelable:true,dataTransfer}));})();void 0');await wait(100);assert.deepEqual(await run('window.saved.order'),order);
 await run('[...document.querySelectorAll("label")].find(l=>l.textContent.includes("Show icon frames")).querySelector("input").click();void 0');await wait(100);
 assert.equal(await run('window.saved.frames'),false);
 assert.equal(await run('document.querySelector("[data-testid=side-navigation-rail]").dataset.sidebarFrames'),'false');
 assert.equal(await run('getComputedStyle(document.querySelector("[data-testid=tab-home]")).backgroundImage'),'none');
 assert.equal(await run('getComputedStyle(document.querySelector("[data-testid=tab-home]")).boxShadow'),'none');
 assert.equal(await run('getComputedStyle(document.querySelector("[data-testid=tab-home] .neo-rail-button__icon")).borderTopColor'),'rgba(0, 0, 0, 0)');
 assert.equal(await run('getComputedStyle(document.querySelector("[data-testid=tab-home] .neo-rail-button__icon")).color'),'rgb(255, 136, 0)');
 if(process.env.NEOLIB_CAPTURE_SIDEBAR){await run('document.querySelector("[aria-label=\\"Sidebar button order\\"]").scrollIntoView({block:"start"});void 0');await wait(200);const shot=path.join(os.tmpdir(),'neolib-sidebar-move-icons.png');fs.writeFileSync(shot,(await win.capturePage()).toPNG());console.log('Sidebar preview:',shot);}
 await textClick('Icons only');await click('[data-testid=modal-close-btn]');await wait(200);await run('window.restore();void 0');await wait(100);
 assert.equal(await run('window.saved.mode'),'icons');assert.equal(await run('window.saved.frames'),false);assert.equal(await run('window.saved.colors["tab-home"]'),'#ff8800');
 await click('[data-testid=tab-home]');assert.deepEqual(await run('window.actions'),['home'],'editing never invokes navigation');
 await click('[data-testid=sidebar-rail-visuals-menu-btn]');await click('[data-testid=sidebar-rail-sidebar-tweaks-btn]');await textClick('Move icons');await click('[aria-label="Customize Visuals icon"]');await setInput('[aria-label="Visuals icon colour"]','#00ff44');assert.equal(await run('getComputedStyle(document.querySelector("[data-testid=sidebar-rail-visuals-menu-btn] .neo-rail-button__icon")).color'),'rgb(0, 255, 68)','flyout triggers use custom colour too');
 await click('[aria-label="Customize Add games icon"]');await setInput('[aria-label="Add games icon colour"]','#aa22ee');assert.equal(await run('getComputedStyle(document.querySelector("[data-testid=sidebar-rail-wizard-btn] .neo-rail-button__icon")).color'),'rgb(170, 34, 238)','nested prominent Add games button keeps its own colour');
 await textClick('Use default colour');assert.equal(await run('window.saved.colors["sidebar-rail-wizard-btn"]'),undefined);
 await textClick('Reset sidebar');assert.equal(await run('window.saved.frames'),true);assert.deepEqual(await run('window.saved.colors'),{});assert.deepEqual(await run('window.saved.order'),[]);assert.deepEqual(await run('window.errors'),[]);
 console.log('PASS: actual sidebar Move icons selection/colour, identity-stable drag/drop and addon ordering, cancellation cleanup, frame-free active symbols, saved reload, navigation isolation, flyout/nested colours and reset. Drag events are scripted Chromium events, not a physical mouse gesture.');
 win.destroy();app.quit();
}).catch(error=>{console.error(error);app.exit(1);});
