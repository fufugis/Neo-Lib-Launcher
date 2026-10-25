const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
if(!process.versions.electron){const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;const result=require('node:child_process').spawnSync(require('electron'),[__filename],{env,stdio:'inherit',windowsHide:true,timeout:60000});if(result.error)console.error(result.error);process.exit(result.status??1);}
const {app,BrowserWindow}=require('electron');
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'neolib-update-reminder-')));
app.whenReady().then(async()=>{
 const root=path.resolve(__dirname,'..'),esbuild=require('node:module').createRequire(require.resolve('vite'))('esbuild');
 const bundle=await esbuild.build({stdin:{resolveDir:root,loader:'jsx',contents:`
 import React from 'react';import {createRoot} from 'react-dom/client';import {flushSync} from 'react-dom';
 import Reminder from './src/components/UpdateReminder.jsx';
 let clock=2000000000000;Date.now=()=>clock;window.advance=ms=>clock+=ms;
 window.chimes=0;window.downloads=[];window.info={available:true,latestVersion:'9.0',downloadUrl:'https://github.com/fufugis/Neo-Lib-Launcher/releases/download/v9.0/NEO-LIB-Setup.exe'};
 window.options={};const root=createRoot(document.getElementById('root'));
 window.draw=()=>flushSync(()=>root.render(<Reminder info={window.info} settings={window.options} onDownload={url=>window.downloads.push(url)}/>));
 window.draw();void 0;
 `},bundle:true,write:false,format:'iife',define:{'process.env.NODE_ENV':'"development"'},plugins:[{name:'mock-chime',setup(build){build.onLoad({filter:/[\\/]lib[\\/]sound\.js$/},()=>({loader:'js',contents:'export function playNewsChime(o){if(o.enabled)window.chimes++;}'}));}}]});
 const win=new BrowserWindow({show:false,width:1100,height:800,webPreferences:{sandbox:true,contextIsolation:true,backgroundThrottling:false}});
 await win.loadURL('data:text/html,'+encodeURIComponent('<body><button data-testid="titlebar-update-pill" style="position:fixed;right:80px;top:10px">Update</button><div id="root"></div></body>'));
 await win.webContents.executeJavaScript(`
 const values=new Map();Object.defineProperty(window,'localStorage',{value:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)}});
 const interval=window.setInterval.bind(window);window.setInterval=(fn,ms,...args)=>interval(fn,ms===15000?20:ms,...args);void 0;`);
 await win.webContents.insertCSS(fs.readFileSync(path.join(root,'src/styles.css'),'utf8'));
 await win.webContents.executeJavaScript(bundle.outputFiles[0].text);
 const run=c=>win.webContents.executeJavaScript(c),settle=()=>new Promise(resolve=>setTimeout(resolve,100));
 const exists=()=>run(`!!document.querySelector('[data-testid="update-reminder"]')`);
 assert.equal(await exists(),false);
 await run('advance(3599999);void 0');await settle();assert.equal(await exists(),false);
 await run('advance(1);void 0');await settle();assert.equal(await exists(),true);assert.equal(await run('chimes'),1);
 assert.equal(await run(`document.querySelector('[data-testid="titlebar-update-pill"]').dataset.reminder`),'true');
 await run(`document.body.click();document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));advance(7200000);void 0`);await settle();
 assert.equal(await exists(),true);assert.equal(await run('chimes'),1);
 await run(`document.querySelector('.update-reminder-download').click();void 0`);await settle();assert.equal(await exists(),true);
 assert.equal(await run('downloads.length'),1);
 await run(`document.querySelector('[aria-label="Close update reminder"]').click();void 0`);await settle();assert.equal(await exists(),false);
 await run('advance(3599999);void 0');await settle();assert.equal(await exists(),false);
 await run('advance(1);void 0');await settle();assert.equal(await exists(),true);assert.equal(await run('chimes'),2);
 await run(`document.querySelector('[aria-label="Close update reminder"]').click();window.options={soundsEnabled:false};draw();advance(3600000);void 0`);await settle();
 assert.equal(await exists(),true);assert.equal(await run('chimes'),2);
 win.setContentSize(480,320);await settle();
 assert.equal(await run(`(()=>{const r=document.querySelector('[data-testid="update-reminder"]').getBoundingClientRect();const x=document.querySelector('[aria-label="Close update reminder"]').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight&&x.top>=r.top&&x.bottom<=r.bottom})()`),true,'Small-window bubble and X remain inside the viewport');
 await run(`window.info={available:false};draw();void 0`);await settle();assert.equal(await exists(),false);
 console.log('PASS: actual hourly update bubble, anchored blinking icon, single chime, X-only dismissal, download stays open, repeat after hour, mute and no-update cleanup. Isolated clock/storage/audio.');
 win.destroy();app.quit();
}).catch(error=>{console.error(error);app.exit(1);});
