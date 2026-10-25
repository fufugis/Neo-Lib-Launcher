const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
if(!process.versions.electron){const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;const result=require('node:child_process').spawnSync(require('electron'),[__filename],{env,stdio:'inherit',windowsHide:true,timeout:60000});if(result.error)console.error(result.error);process.exit(result.status??1);}
const {app,BrowserWindow}=require('electron');
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'neolib-patch-history-')));
app.whenReady().then(async()=>{
 const root=path.resolve(__dirname,'..'),esbuild=require('node:module').createRequire(require.resolve('vite'))('esbuild');
 const bundle=await esbuild.build({stdin:{resolveDir:root,loader:'jsx',contents:`
 import React from 'react';import {createRoot} from 'react-dom/client';import ChangelogModal from './src/components/ChangelogModal.jsx';
 function Fixture(){const [open,setOpen]=React.useState(false);return <><button id="opener" onClick={()=>setOpen(true)}>Patch notes</button><ChangelogModal open={open} currentVersion="1.8.10" lastSeenVersion="1.8.10" onClose={()=>{window.closedNotes=(window.closedNotes||0)+1;setOpen(false)}}/></>}
 createRoot(document.getElementById('root')).render(<Fixture/>);
 `},bundle:true,write:false,format:'iife',define:{'process.env.NODE_ENV':'"development"'},plugins:[{name:'no-network-feedback',setup(build){build.onLoad({filter:/FeedbackModal\.jsx$/},()=>({loader:'js',contents:'export async function sendChangelogReaction(value){window.reaction=value}'}));}}]});
 const win=new BrowserWindow({show:false,width:1200,height:900,webPreferences:{sandbox:true,contextIsolation:true,backgroundThrottling:false,offscreen:true}});
 await win.loadURL('data:text/html,'+encodeURIComponent('<body style="margin:0;--ink:240 245 255;--surface:20 30 45;--panel:30 40 60;--border:90 110 140;--accent:100 200 255;--accent-2:220 160 255"><div id="root"></div></body>'));
 const assets=path.join(root,'dist-renderer/assets');
 await win.webContents.insertCSS(fs.readFileSync(path.join(assets,fs.readdirSync(assets).find(n=>/^index-.*\.css$/.test(n))),'utf8')+'\n'+fs.readFileSync(path.join(root,'src/styles.css'),'utf8'));
 await win.webContents.executeJavaScript(bundle.outputFiles[0].text);
 const run=c=>win.webContents.executeJavaScript(c),settle=()=>new Promise(r=>setTimeout(r,280));
 const click=async s=>{await run(`document.querySelector(${JSON.stringify(s)}).click();void 0`);await settle();};
 await settle();await run("document.querySelector('#opener').focus();void 0");await click('#opener');
 assert.deepEqual(await run("[...document.querySelectorAll('[role=tab]')].map(e=>e.textContent.match(/v[0-9.]+/)[0])"),['v1.8.10','v1.8.9','v1.8.8','v1.8.7','v1.8.6']);
 assert.equal(await run("document.querySelector('[role=tab][aria-selected=true]').dataset.testid"),'changelog-select-1.8.10');
 assert.equal(await run("!!document.querySelector('[data-testid=changelog-entry-upcoming]')"),false);
 await click('[data-testid="changelog-select-1.8.6"]');
 assert.equal(await run("document.querySelector('[data-testid=changelog-notes]').textContent.includes('Fixes')"),true);
 assert.equal(await run('window.closedNotes||0'),0,'Selection must not acknowledge startup notes');
 await click('[data-testid="rate-😍"]');assert.equal(await run('window.reaction.version'),'1.8.6');
 await click('[data-testid="changelog-upcoming"]');
 assert.equal(await run("!!document.querySelector('[data-testid=rate-this-update]')"),false);
 await run("document.querySelector('[data-testid=changelog-notes]').scrollTop=500;void 0");
 await click('[data-testid="changelog-select-1.8.10"]');
 assert.equal(await run("document.querySelector('[data-testid=changelog-notes]').scrollTop"),0);
 await run("document.querySelector('[role=tab]').dispatchEvent(new KeyboardEvent('keydown',{key:'End',bubbles:true}));void 0");await settle();
 assert.equal(await run("document.activeElement.dataset.testid"),'changelog-select-1.8.6');
 await run("document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));void 0");await settle();
 assert.equal(await run('window.closedNotes'),1);assert.equal(await run('document.activeElement.id'),'opener');
 await click('#opener');assert.equal(await run("document.querySelector('[role=tab][aria-selected=true]').dataset.testid"),'changelog-select-1.8.10');
 for(const width of [560,420]){win.setSize(width,740);await settle();assert.equal(await run("(()=>{const d=document.querySelector('[data-testid=changelog-modal]'),b=d.getBoundingClientRect(),f=d.querySelector('footer').getBoundingClientRect();return b.left>=0&&b.right<=innerWidth&&f.bottom<=innerHeight&&d.scrollWidth<=d.clientWidth+1})()"),true,'Small windows retain visible footer and no horizontal overflow');}
 console.log('PASS: real patch-history chooser, latest five/current default, fix-only notes, separate Upcoming, selected-version reactions, scroll reset, keyboard navigation, close/focus/reopen and responsive bounds.');
 win.destroy();app.quit();
}).catch(error=>{console.error(error);app.exit(1);});
