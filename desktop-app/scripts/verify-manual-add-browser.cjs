const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
if(!process.versions.electron){const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;const result=require('node:child_process').spawnSync(require('electron'),[__filename],{env,stdio:'inherit',windowsHide:true,timeout:60000});process.exit(result.status??1);}
const {app,BrowserWindow}=require('electron');
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'neolib-manual-add-')));
app.whenReady().then(async()=>{
 const root=path.resolve(__dirname,'..'),esbuild=require('node:module').createRequire(require.resolve('vite'))('esbuild');
 const bundle=await esbuild.build({stdin:{resolveDir:root,loader:'jsx',contents:`
 import React from 'react';import {createRoot} from 'react-dom/client';import Add from './src/components/AddGameModal.jsx';
 window.created=[];window.lookups=[];window.api={pickExe:async()=> 'C:/Games/Portal/portal.exe',extractIcon:async()=>null,searchSteam:async()=>[{appid:620,name:'Portal 2'}],steamDetails:async id=>{window.lookups.push(id);return {name:'Portal 2',shortDescription:'Synthetic test description',genres:[],screenshots:[]}}};
 createRoot(document.getElementById('root')).render(<Add open onClose={()=>{}} onCreate={game=>window.created.push(game)}/>);
 `},bundle:true,write:false,format:'iife',platform:'browser',define:{'process.env.NODE_ENV':'"production"'}});
 const win=new BrowserWindow({show:false,width:1300,height:1000,webPreferences:{contextIsolation:false,nodeIntegration:false,offscreen:true}});
 win.webContents.on('console-message',(_event,level,message)=>{if(level>=2)console.error(message)});
 await win.loadURL('data:text/html,'+encodeURIComponent('<html><body><div id="root" class="neolib-ui-foreground" style="position:relative;z-index:20"></div></body></html>'));
 const assets=path.join(root,'dist-renderer/assets');await win.webContents.insertCSS(fs.readFileSync(path.join(assets,fs.readdirSync(assets).find(n=>/^index-.*\.css$/.test(n))),'utf8')+'\n'+fs.readFileSync(path.join(root,'src/styles.css'),'utf8'));
 const run=async code=>{try{return await win.webContents.executeJavaScript(code)}catch(error){throw Error(code.slice(0,100)+': '+error.message)}},wait=()=>new Promise(resolve=>setTimeout(resolve,350));
 const click=async(selector,part='center')=>{
   const point=await run(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Missing '+${JSON.stringify(selector)});e.scrollIntoView({block:'center'});const b=e.getBoundingClientRect();return {x:Math.round(b.x+${part==='use'?'b.width-25':'b.width/2'}),y:Math.round(b.y+b.height/2)}})()`);
   win.webContents.sendInputEvent({type:'mouseMove',...point});win.webContents.sendInputEvent({type:'mouseDown',button:'left',clickCount:1,...point});win.webContents.sendInputEvent({type:'mouseUp',button:'left',clickCount:1,...point});await wait();
 };
 await run(bundle.outputFiles[0].text);await wait();await click('[data-testid=pick-exe-btn]');await wait();
 await run(`(()=>{const e=document.querySelector('[data-testid=add-search-input]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'Portal 2');e.dispatchEvent(new Event('input',{bubbles:true}));})()`);await wait();await click('[data-testid=add-search-btn]');
 for(const part of ['center','use']){
   await click('[data-testid=match-620]',part);
   assert.equal(await run('window.lookups.length'),part==='center'?1:2);
   assert.equal(await run(`(()=>{const e=document.querySelector('[data-testid=accept-meta-modal]');if(!e)return false;const b=e.getBoundingClientRect();return e.contains(document.elementFromPoint(b.x+b.width/2,b.y+30))})()`),true,'Selected metadata review must be above Add Game and receive real pointer input');
   if(part==='center')await click('[data-testid=accept-meta-cancel]');
 }
 await click('[data-testid=accept-meta-accept]');
 assert.equal(await run('window.created.length'),1);assert.equal(await run('window.created[0].name'),'Portal 2');assert.equal(await run('window.created[0].exePath'),'C:/Games/Portal/portal.exe');
 console.log('PASS: real pointer clicks on manual-add result and Use show an interactive metadata review; cancel/reselect and accept create the intended entry. Synthetic data only.');win.destroy();app.quit();
}).catch(error=>{console.error(error);app.exit(1)});
