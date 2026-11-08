const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
if(!process.versions.electron){const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;const r=require('node:child_process').spawnSync(require('electron'),[__filename],{env,stdio:'inherit',windowsHide:true,timeout:90000});if(r.error)console.error(r.error);process.exit(r.status??1);}
const {app,BrowserWindow,ipcMain}=require('electron');
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'neolib-maintenance-')));
app.whenReady().then(async()=>{
 const root=path.resolve(__dirname,'..'),preload=path.join(root,'electron/preload.js'),version=require('../package.json').version;
 let library={games:[{id:'found',name:'Found game',exePath:'C:/Games/found.exe',categoryIds:[]},{id:'move',name:'Moved game',exePath:'C:/Games/gone.exe',categoryIds:[],playtime:23},{id:'remove',name:'Removed game',exePath:'C:/Games/gone2.exe',categoryIds:[]},{id:'offline',name:'Offline drive',exePath:'Z:/Games/gone.exe',categoryIds:[]},{id:'private',name:'Secret game',exePath:'C:/Games/gone3.exe',categoryIds:['private']}],tools:[{id:'tool',name:'Utility'}],categories:[{id:'private',name:'Secret',private:true,pinHash:'keep'}],toolCategories:[]};
 let settings={welcomeCompleted:true,firstRun:false,lastSeenVersion:version,tutorialSeen:true,ratingSystemVersion:2,graphicsSuggestionsVersion:1,gpuSetupVersion:1,soundsEnabled:false,theme:'synthwave'},saveAllowed=true;
 const calls=[],audits=[];
 library.games.push({id:'folder',name:'Folder moved game',exePath:'C:/Old/game.exe',categoryIds:[]});
 for(const channel of new Set([...fs.readFileSync(preload,'utf8').matchAll(/ipcRenderer\.invoke\(['"]([^'"]+)['"]/g)].map(m=>m[1])))ipcMain.handle(channel,async(_event,value)=>{
   calls.push(channel);if(channel==='game:launch')throw Error('Launching is forbidden in this fixture');
   if(channel==='library:load')return library;if(channel==='settings:load')return settings;
   if(channel==='library:save'){if(!saveAllowed)return false;library=structuredClone(value);return true;}
   if(channel==='settings:save'){settings=structuredClone(value);return true;}
   if(channel==='library:clearArtwork')return {ok:false,error:'Synthetic cache permission failure'};
   if(channel==='dialog:pickExe')return 'C:/Moved/found.exe';
   if(channel==='dialog:pickDirectory')return 'C:/Moved';
   if(channel==='game:auditPaths'){audits.push(value);return value.map(row=>{const status=row.id==='offline'?'unavailable':row.id==='found'||row.filePath.includes('/Moved/')?'present':'missing';return {...row,status,file:status==='present'?'present':status==='missing'?'missing':'unavailable',folder:'skip'};});}
   if(channel==='game:watchExternal')return {ok:true,watching:0,ignored:0};if(channel==='launcher:detect')return {};
   if(/(?:list|load|detectLaunchers)$/.test(channel))return [];
   return {ok:false,error:'Unavailable in isolated fixture'};
 });
 const win=new BrowserWindow({show:false,width:1500,height:1000,webPreferences:{preload,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false,offscreen:true}});
 win.webContents.session.webRequest.onBeforeRequest({urls:['http://*/*','https://*/*']},(_d,cb)=>cb({cancel:true}));
 const run=s=>win.webContents.executeJavaScript(s),wait=ms=>new Promise(r=>setTimeout(r,ms));
 const click=async selector=>{await run(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Missing control: '+${JSON.stringify(selector)});e.click()})()`);await wait(200)};
 const type=async text=>{await run(`(()=>{const e=document.querySelector('[data-testid=confirm-modal-typed-input]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(text)});e.dispatchEvent(new Event('input',{bubbles:true}));})()`);await wait(100)};
 await win.loadFile(path.join(root,'dist-renderer/index.html'));await wait(1800);
 assert.equal(await run('document.body.textContent.includes("NEO-LIB could not finish starting")'),false);
 await click('[data-testid=sidebar-rail-wizard-btn]');await click('[data-wizard-tab=care]');await click('[data-testid=missing-games-scan]');
 assert(audits[0].every(row=>row.id!=='private'),'Locked private games never reach the audit request');
 assert.equal(await run('!!document.querySelector("[data-missing-game=found]")'),false);
 assert.equal(await run('document.querySelector("[data-missing-game=offline] input").disabled'),true);
 assert.equal(await run('document.querySelector("[data-missing-game=remove] input").checked'),false);
 await click('[data-missing-game=move] button');await wait(150);
 assert.equal(library.games.find(game=>game.id==='move').exePath,'C:/Moved/found.exe');
 assert.equal(library.games.find(game=>game.id==='move').playtime,23);
 await click('[data-missing-game=folder] button:last-child');await wait(150);
 assert.equal(library.games.find(game=>game.id==='folder').exePath,'C:/Moved/game.exe');
 assert.equal(library.games.find(game=>game.id==='folder').installDir,'C:/Moved');
 await click('[data-missing-game=remove] input');await click('[data-testid=missing-games-remove]');
 await click('[data-testid=confirm-modal-confirm]');await wait(200);
 assert.equal(library.games.some(game=>game.id==='remove'),false);assert(library.games.some(game=>game.id==='offline'));
 assert(library.games.some(game=>game.id==='private'));assert.equal(calls.includes('game:launch'),false);
 await click('[data-testid=wizard-modal] [data-testid=modal-close-btn]');
 await click('[data-testid=sidebar-rail-settings-menu-btn]');await click('[data-testid=sidebar-rail-settings-btn]');
 const count=library.games.length;
 await click('[data-testid=settings-library-reset]');await click('[data-testid=confirm-modal-cancel]');assert.equal(library.games.length,count);
 const reset=async()=>{
   await click('[data-testid=settings-library-reset]');await type('RESET');await click('[data-testid=confirm-modal-confirm]');
   assert.equal(await run('document.querySelector("[data-testid=confirm-modal-typed-input]").value'),'','Final confirmation starts with fresh typed input');
   assert.equal(await run('document.querySelector("[data-testid=confirm-modal-confirm]").disabled'),true);
   await type('CLEAR LIBRARY');await click('[data-testid=confirm-modal-confirm]');await wait(250);
 };
 saveAllowed=false;await reset();assert.equal(library.games.length,count);
 assert.equal(await run('document.body.textContent.includes("nothing was cleared")'),true);
 saveAllowed=true;await reset();
 assert.deepEqual(library.games,[]);assert.deepEqual(library.tools,[]);assert.deepEqual(library.categories,[]);
 assert.equal(library.homeGameDataArchive.move.playtime,23);assert.equal(calls.includes('library:clearArtwork'),true);
 await win.reload();await wait(1500);assert.equal(await run('document.body.textContent.includes("NEO-LIB could not finish starting")'),false);
 assert.deepEqual(library.games,[]);assert.deepEqual(library.tools,[]);
 console.log('PASS: compiled production Wizard audit/private/offline/default selection/locate/remove/recheck and actual Settings two typed confirmations, cancellation, failed-save safety, cache-failure reset and empty Library reload. Synthetic native services; no real user files or games touched.');
 win.destroy();app.quit();
}).catch(error=>{console.error(error);app.exit(1)});
