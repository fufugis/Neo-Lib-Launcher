// Actual Wizard tab/picker/scan/metadata/review/accept path with mock IPC only.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
if(!process.versions.electron){const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;const result=require('node:child_process').spawnSync(require('electron'),[__filename],{env,stdio:'inherit',windowsHide:true,timeout:60000});if(result.error)console.error(result.error.message);process.exit(result.status??1);}
const {app,BrowserWindow}=require('electron');app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'neolib-wizard-review-')));
app.whenReady().then(async()=>{
 const root=path.resolve(__dirname,'..'),esbuild=require('node:module').createRequire(require.resolve('vite'))('esbuild');
 const bundle=await esbuild.build({stdin:{resolveDir:root,loader:'jsx',contents:`
  import React from 'react';import {createRoot} from 'react-dom/client';import {flushSync} from 'react-dom';import Wizard from './src/components/WizardModal.jsx';
  window.failures=[];window.calls=[];window.accepted=[];window.metadataMode='tags';
  window.api={pickDirectory:async()=>{window.calls.push('pickDirectory');return 'C:/Fixture/Games'},scanDirectory:async()=>{window.calls.push('scanDirectory');return [{exe:'C:/Fixture/Games/Example/game.exe',folderName:'Example Game'}]},extractIcon:async()=>null,
   fetchMetadata:async()=>{window.calls.push('fetchMetadata');return window.metadataMode==='none'?null:{name:'Example Game',description:'Fixture description',source:'steam',genres:window.metadataMode==='empty'?[]:['Action','Adventure'],genreTags:window.metadataMode==='empty'?[]:['Action','Action Roguelike','Online Co-op']}},};
  class Boundary extends React.Component{state={error:null};static getDerivedStateFromError(error){return {error}};componentDidCatch(error){window.failures.push(error.message)}render(){return this.state.error?<div data-crash>{this.state.error.message}</div>:this.props.children}}
  const root=createRoot(document.getElementById('root'));let key=0;
  window.mount=mode=>{window.metadataMode=mode;window.failures=[];window.accepted=[];flushSync(()=>root.render(<Boundary key={++key}><Wizard open onClose={()=>{}} onImport={()=>{}} onAccept={entry=>window.accepted.push(entry)} existingExePaths={[]} existingGames={[]}/></Boundary>))};window.mount('tags');
 `},bundle:true,write:false,format:'iife',define:{'process.env.NODE_ENV':'"development"'},plugins:[{name:'omit-stock-assets',setup(build){build.onLoad({filter:/stock-theme-registry\.mjs$/},args=>({loader:'js',contents:fs.readFileSync(args.path,'utf8').replace(/^const (modules|assets) = import\.meta\.glob\(.*$/gm,'const $1 = {};')}))}}]});
 const win=new BrowserWindow({show:false,width:1500,height:1000,webPreferences:{sandbox:true,contextIsolation:true,backgroundThrottling:false}});
 await win.loadURL('data:text/html;charset=utf-8,'+encodeURIComponent('<!doctype html><body><div id="root"></div></body>'));
 await win.webContents.executeJavaScript(`window.matchMedia=()=>({matches:true,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});window.fetch=()=>{throw Error('Network forbidden')};void 0;`);
 await win.webContents.executeJavaScript(bundle.outputFiles[0].text);
 const run=code=>win.webContents.executeJavaScript(code),settle=()=>new Promise(resolve=>setTimeout(resolve,100));
 const click=async selector=>{await run(`document.querySelector(${JSON.stringify(selector)}).click()`);await settle()};
 for(const mode of ['tags','empty','none']){
  await run(`window.mount('${mode}')`);await settle();
  await click('[data-wizard-tab="folder"]');await click('[data-testid="wizard-pick-root-btn"]');await click('[data-testid="wizard-start-btn"]');
  for(let attempt=0;attempt<30;attempt++){await settle();const state=await run(`({errors:window.failures,ready:!!document.querySelector('[data-testid="wizard-accept-btn"]:not(:disabled)')})`);assert.deepEqual(state.errors,[],mode+': scan metadata must not crash Wizard');if(state.ready)break;if(attempt===29)throw Error('Review did not become ready');}
  if(mode==='tags'){const identity=await run(`document.querySelector('[data-testid="wizard-genre-profile"]').textContent`);assert(identity.includes('Action')&&identity.includes('Online Co-op'),'canonical genre labels must render, not empty objects');}
  assert.equal(await run('window.accepted.length'),0,'scanning and reviewing cannot auto-import');
  await click('[data-testid="wizard-accept-btn"]');assert.equal(await run('window.accepted.length'),1);
  const entry=await run('window.accepted[0]');assert.equal(entry.exePath,'C:/Fixture/Games/Example/game.exe');assert.equal(entry.name,'Example Game');
  if(mode==='tags')assert(entry.genres.includes('Action')&&entry.genreTags.includes('Online Co-op'),'accept must retain reviewed genre metadata');
  assert.equal(await run(`document.body.textContent.includes('Wizard complete')`),true);
 }
 assert((await run('window.calls')).every(name=>['pickDirectory','scanDirectory','fetchMetadata'].includes(name)));
 console.log('PASS: actual Wizard Folder scan tab → mocked picker/scan → metadata/genre review → explicit Accept → completion, with populated, empty and absent metadata. No real folders, network, files or library writes.');
 win.destroy();app.quit();
}).catch(error=>{console.error(error);app.exit(1)});
