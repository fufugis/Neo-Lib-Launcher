const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
if(!process.versions.electron){const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;const result=require('node:child_process').spawnSync(require('electron'),[__filename],{env,stdio:'inherit',windowsHide:true,timeout:60000});process.exit(result.status??1);}
const {app,BrowserWindow,screen}=require('electron');app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'neolib-launch-perch-')));
app.whenReady().then(async()=>{
 const root=path.resolve(__dirname,'..'),esbuild=require('node:module').createRequire(require.resolve('vite'))('esbuild');
 const bundle=await esbuild.build({stdin:{resolveDir:root,loader:'jsx',contents:`
 import React from 'react';import {createRoot} from 'react-dom/client';import {flushSync} from 'react-dom';import Mascot from './src/components/FungistMascot.jsx';import Actions from './src/components/preview/PreviewActionBar.jsx';
 window.api={};window.launches=[];const root=createRoot(document.getElementById('root'));
 function Fixture({size,id,left,top}){const [launch,setLaunch]=React.useState(null);return <><div style={{position:'fixed',left,top,width:600}}><Actions game={{id:'g',name:'Synthetic game'}} categories={[]} settings={{soundsEnabled:false}} onLaunch={(game,token,origin)=>{window.launches.push(origin);setLaunch({key:Date.now(),origin,gameName:game.name})}}/></div><Mascot mascotSize={size} mascotId={id} soundsEnabled={false} voiceEnabled={false} healthState="healthy" launchCelebration={launch} dockPosition={{x:-100,y:-40}}/></>}
 window.show=(size,id,left,top)=>flushSync(()=>root.render(<Fixture key={[size,id,left,top].join('-')} {...{size,id,left,top}}/>));window.show(100,'fungist',40,320);
 `},bundle:true,write:false,format:'iife',platform:'browser',define:{'process.env.NODE_ENV':'"production"','import.meta.env.BASE_URL':'"./"'},plugins:[{name:'fixture-stock-assets',setup(build){build.onLoad({filter:/stock-theme-registry\.mjs$/},args=>({loader:'js',contents:fs.readFileSync(args.path,'utf8').replace(/^const (modules|assets) = import\.meta\.glob\(.*$/gm,'const $1 = {};')}));}}]});
 const area=screen.getPrimaryDisplay().workAreaSize;
 const win=new BrowserWindow({show:false,width:Math.min(1200,area.width-24),height:Math.min(850,area.height-24),webPreferences:{contextIsolation:false,nodeIntegration:false,offscreen:true,backgroundThrottling:false}});
 await win.loadURL('data:text/html,'+encodeURIComponent('<html><body><div id="root"></div></body></html>'));
 const assets=path.join(root,'dist-renderer/assets');await win.webContents.insertCSS(fs.readFileSync(path.join(assets,fs.readdirSync(assets).find(n=>/^index-.*\.css$/.test(n))),'utf8')+'\n'+fs.readFileSync(path.join(root,'src/styles.css'),'utf8'));
 const run=code=>win.webContents.executeJavaScript(code),wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 await run(bundle.outputFiles[0].text);await wait(300);
 const width=await run('innerWidth');
 for(const [size,id,left,top] of [[70,'fungist',40,320],[145,'fungist',40,320],[145,'fifi',width-240,30],[100,'fungist',width/2,30]]){
   await run(`window.show(${size},'${id}',${left},${top});void 0`);await wait(250);
   const point=await run(`(()=>{window.launches=[];const button=document.querySelector('[data-testid=detail-launch-btn]'),b=button.getBoundingClientRect(),x=Math.round(b.x+b.width/2),y=Math.round(b.y+b.height/2);if(!button.contains(document.elementFromPoint(x,y)))throw Error('Fixture Launch must be inside the visible viewport before native input');return {x,y}})()`);
   win.webContents.focus();
   win.webContents.sendInputEvent({type:'mouseMove',...point});win.webContents.sendInputEvent({type:'mouseDown',button:'left',clickCount:1,...point});win.webContents.sendInputEvent({type:'mouseUp',button:'left',clickCount:1,...point});await wait(1000);
   const state=await run(`(()=>{const button=document.querySelector('[data-testid=detail-launch-btn]'),mascot=document.querySelector('[data-testid=mascot-scaled-body]');const b=button.getBoundingClientRect(),m=mascot.getBoundingClientRect();return {bounds:window.launches.at(-1)?.bounds,clear:m.right<=b.left-12||m.left>=b.right+12||m.bottom<=b.top-12||m.top>=b.bottom+12,inView:m.left>=0&&m.right<=innerWidth&&m.top>=0&&m.bottom<=innerHeight,hit:button.contains(document.elementFromPoint(${point.x},${point.y})),clickThrough:getComputedStyle(mascot).pointerEvents==='none'}})()`);
   assert(state.bounds,'Actual Launch captures full button bounds');assert(state.clear,JSON.stringify({size,id,left,top,state}));assert(state.inView);assert(state.hit,JSON.stringify({size,id,left,top,state}));assert(state.clickThrough);
 }
 console.log('PASS: actual Launch → mascot cheer stays outside button at minimum/maximum size, moved dock and window edges for Fungist/FiFi; launch remains the mouse hit target. Synthetic launches only.');win.destroy();app.quit();
}).catch(error=>{console.error(error);app.exit(1)});
