const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
if(!process.versions.electron){const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;const result=require('node:child_process').spawnSync(require('electron'),[__filename],{env,stdio:'inherit',windowsHide:true,timeout:60000});if(result.error)console.error(result.error);process.exit(result.status??1);}
const {app,BrowserWindow}=require('electron');
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'neolib-home-titles-')));
app.whenReady().then(async()=>{
 const root=path.resolve(__dirname,'..'),esbuild=require('node:module').createRequire(require.resolve('vite'))('esbuild');
 const bundle=await esbuild.build({stdin:{resolveDir:root,loader:'jsx',contents:`
 import React from 'react';import {createRoot} from 'react-dom/client';import {flushSync} from 'react-dom';
 import Home from './src/components/HomeHub.jsx';import {HOME_WIDGET_BY_ID} from './src/components/home/home-widget-registry.mjs';
 import {hydrateSettings} from './src/state/settings-state.mjs';
 window.layout={snapToGrid:false,widgetOrder:['news','recent'],hidden:Object.keys(HOME_WIDGET_BY_ID).filter(id=>!['news','recent'].includes(id)),freePositions:{news:{x:0,y:0,width:500,height:350},recent:{x:520,y:0,width:500,height:350}}};
 let root=createRoot(document.getElementById('root'));
 function Fixture(){const [layout,setLayout]=React.useState(window.layout);return <Home games={[]} resting homeLayout={layout} onUpdateHomeLayout={value=>{window.layout=hydrateSettings(JSON.parse(JSON.stringify({homeLayout:value}))).homeLayout;setLayout(window.layout)}}/>}
 window.remount=()=>{flushSync(()=>root.unmount());root=createRoot(document.getElementById('root'));flushSync(()=>root.render(<Fixture/>));};
 flushSync(()=>root.render(<Fixture/>));void 0;
 `},bundle:true,write:false,format:'iife',define:{'process.env.NODE_ENV':'"development"','import.meta.env.BASE_URL':'"./"'},plugins:[{name:'fixture-assets',setup(build){build.onLoad({filter:/stock-theme-registry\.mjs$/},args=>({loader:'js',contents:fs.readFileSync(args.path,'utf8').replace(/^const (modules|assets) = import\.meta\.glob\(.*$/gm,'const $1 = {};')}));}}]});
 const win=new BrowserWindow({show:false,width:1400,height:1000,webPreferences:{sandbox:true,contextIsolation:true,backgroundThrottling:false,offscreen:true}});
 await win.loadURL('data:text/html,'+encodeURIComponent('<body style="margin:0;--ink:240 245 255;--surface:20 30 45;--panel:30 40 60;--border:90 110 140;--accent:100 200 255;--accent-2:220 160 255"><div id="root" style="height:100vh;display:flex"></div></body>'));
 const assets=path.join(root,'dist-renderer/assets');await win.webContents.insertCSS(fs.readFileSync(path.join(assets,fs.readdirSync(assets).find(n=>/^index-.*\.css$/.test(n))),'utf8')+'\n*{transition-duration:0s !important}');
 await win.webContents.executeJavaScript(bundle.outputFiles[0].text);
 const run=c=>win.webContents.executeJavaScript(c),settle=()=>new Promise(resolve=>setTimeout(resolve,300));
 const click=async selector=>{await run(`document.querySelector(${JSON.stringify(selector)}).click();void 0`);await settle();};
 const change=async(label,value)=>{await run(`(()=>{const e=document.querySelector('[aria-label="${label}"]');const p=e.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(p,'value').set.call(e,${JSON.stringify(String(value))});e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));})()`);await settle();};
 const title=id=>run(`(()=>{const e=document.querySelector('[data-home-widget-title="${id}"]');const s=getComputedStyle(e);return {size:s.fontSize,weight:s.fontWeight,color:s.color,uppercase:s.textTransform}})()`);
 const box=()=>run(`(()=>{const e=document.querySelector('[data-testid="home-pane-news"]');return {width:e.offsetWidth,height:e.offsetHeight,left:e.style.left,top:e.style.top}})()`);
 await settle();const original=await box();assert.equal((await title('news')).size,'11px');
 await click('[data-testid="home-widget-settings-button"]');
 await change('Widget title size',18);await change('Widget title weight',700);await change('Widget title colour','bright');await change('Widget title contrast',70);
 assert.equal((await title('news')).size,'18px');assert.equal((await title('recent')).size,'18px');
 assert.equal((await title('news')).color,'rgb(255, 255, 255)');
 await change('Widget size target','news');await change('Widget title size',26);await change('Widget title contrast',85);
 await change('Widget title colour','accent');
 assert.equal(await run(`getComputedStyle(document.querySelector('[data-testid="home-title-settings-preview"] span')).color`),(await title('news')).color,'Preview uses the selected widget accent, not the global theme accent');
 await click('[aria-label="Widget title uppercase"]');
 assert.equal((await title('news')).size,'26px');assert.equal((await title('recent')).size,'18px');assert.equal((await title('news')).uppercase,'uppercase');
 assert.equal(await run(`document.querySelector('[data-testid="home-title-settings-preview"] span').style.fontSize`),'26px');
 assert.equal(await run(`(()=>{const h=document.querySelector('[data-home-widget-titlebar="news"]');const icon=h.querySelectorAll('svg')[1].getBoundingClientRect();const r=h.getBoundingClientRect();return icon.top>=r.top&&icon.bottom<=r.bottom})()`),true);
 assert.deepEqual(await box(),original,'Title tweaks do not resize or move the widget');
 assert.equal(await run(`document.querySelector('[data-testid="home-pane-news"] .home-widget-content-scale').style.zoom`),'1');
 await change('Widget size target','');await change('Widget title size',16);
 assert.equal((await title('news')).size,'26px');assert.equal((await title('recent')).size,'16px');
 await run('window.remount();void 0');await settle();assert.equal((await title('news')).size,'26px');
 await click('[data-testid="home-widget-settings-button"]');await change('Widget size target','news');
 await run(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Use shared title style').click();void 0`);await settle();assert.equal((await title('news')).size,'16px');
 await run(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Reset all title styles').click();void 0`);await settle();assert.equal((await title('news')).size,'11px');
 assert.deepEqual(await box(),original);
 console.log('PASS: actual Home headings and Edit widgets live preview, shared/per-widget size/weight/colour/contrast/case, icon fit, JSON/hydration/reopen/reset and unchanged widget geometry/content zoom.');
 win.destroy();app.quit();
}).catch(error=>{console.error(error);app.exit(1);});
