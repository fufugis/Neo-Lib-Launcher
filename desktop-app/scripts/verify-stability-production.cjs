const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
if(!process.versions.electron){const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;const result=require('node:child_process').spawnSync(require('electron'),[__filename],{env,stdio:'inherit',windowsHide:true,timeout:60000});if(result.error)console.error(result.error);process.exit(result.status??1);}
const {app,BrowserWindow,ipcMain}=require('electron');app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'neolib-production-smoke-')));
app.whenReady().then(async()=>{
 const root=path.resolve(__dirname,'..'),preload=path.join(root,'electron/preload.js'),version=require('../package.json').version;
 let library={_neoLibSchemaVersion:1,games:[{id:'safe',name:'Synthetic smoke game',exePath:'C:/Synthetic/Game.exe',categoryIds:[],developers:'Studio',genres:[{description:'Action'}],screenshots:'https://example.invalid/one.png',about:'Synthetic test game'}],categories:[null],tools:[],toolCategories:[]};
 let settings={welcomeCompleted:true,firstRun:false,lastSeenVersion:version,tutorialSeen:true,ratingSystemVersion:2,graphicsSuggestionsVersion:1,gpuSetupVersion:1,soundsEnabled:false,theme:'synthwave'};
 const calls=[];let saveAllowed=true;
 for(const channel of new Set([...fs.readFileSync(preload,'utf8').matchAll(/ipcRenderer\.invoke\(['"]([^'"]+)['"]/g)].map(match=>match[1])))ipcMain.handle(channel,async(_event,value)=>{
   calls.push(channel);
   if(channel==='game:launch')throw Error('No game launch is permitted in this fixture.');
   if(channel==='library:load')return library;if(channel==='settings:load')return settings;
   if(channel==='library:save'){if(!saveAllowed)return false;library=JSON.parse(JSON.stringify(value));return true;}
   if(channel==='settings:save'){settings=JSON.parse(JSON.stringify(value));return true;}
   if(channel==='game:watchExternal')return {ok:true,watching:1,ignored:0};
   if(channel==='launcher:detect')return {};
   if(channel==='news:historyForGame')return {ok:true,items:[],fetchedAt:Date.now(),noSource:true};
   if(/(?:list|load|detectLaunchers)$/.test(channel))return [];
   return {ok:false,error:'Unavailable in isolated smoke fixture'};
 });
 const win=new BrowserWindow({show:false,width:1500,height:950,webPreferences:{preload,contextIsolation:true,nodeIntegration:false,backgroundThrottling:false,offscreen:true}});
 // No network, user app-data, actual launcher services, game launch or file writes.
 win.webContents.session.webRequest.onBeforeRequest({urls:['http://*/*','https://*/*']},(_details,callback)=>callback({cancel:true}));
 const run=source=>win.webContents.executeJavaScript(source),wait=ms=>new Promise(r=>setTimeout(r,ms));
 await win.loadFile(path.join(root,'dist-renderer/index.html'));await wait(2000);
 assert.equal(await run('document.body.textContent.includes("NEO-LIB could not finish starting")'),false);
 assert.equal(await run('!!document.querySelector("[data-testid=side-navigation-rail]")'),true,'production root completed native hydration');
 await run('document.querySelector("[data-testid=tab-library]").click();void 0');await wait(400);
 assert.equal(await run('!!document.querySelector("[data-testid=game-row-safe]")'),true);
 await run('document.querySelector("[data-testid=game-row-safe]").click();void 0');await wait(500);
 assert.equal(await run('document.querySelector("[data-testid=detail-title]")?.textContent'),'Synthetic smoke game');
 assert.equal(await run('!!document.querySelector("[data-testid=preview-recovery]")'),false,'malformed legacy metadata was repaired, not merely caught');
 assert.equal(await run('!!document.querySelector("[data-testid=storage-safety-notice]")'),true,'quarantined category is explained');
 const at=Date.now();win.webContents.send('playtime:externalSession',{gameId:'safe',sessionId:'smoke-session',basePlaytime:0,totalSeconds:60,startedAt:at-60000,at,final:false});await wait(250);
 assert.equal(calls.includes('game:launch'),false);
 assert.equal(library.games[0].developers[0],'Studio');assert.equal(library.libraryRecovery[0].value,null);assert.equal(library.games[0].playtime,1);
 saveAllowed=false;win.webContents.send('playtime:externalSession',{gameId:'safe',sessionId:'smoke-session',basePlaytime:0,totalSeconds:120,startedAt:at-60000,at:at+60000,final:false});await wait(250);
 assert.equal(await run('document.querySelector("[data-testid=storage-safety-notice]")?.textContent.includes("Changes have not been saved")'),true,'production root presents actual false save acknowledgements');
 if(process.env.NEOLIB_CAPTURE_STABILITY){const shot=path.join(os.tmpdir(),'neolib-storage-safety.png');fs.writeFileSync(shot,(await win.capturePage()).toPNG());console.log('Save warning preview:',shot);}
 saveAllowed=true;await run('[...document.querySelectorAll("button")].find(button=>button.textContent==="Retry saving").click();void 0');await wait(250);assert.equal(library.games[0].playtime,2);assert.equal(await run('document.body.textContent.includes("Changes have not been saved")'),false);
 console.log('PASS: compiled production app + real isolated preload boot with malformed saved data; Home/Library navigation, game preview, automatic save and visible recovery notice work. Native services are synthetic; network blocked, no actual installed app or game tested.');
 win.destroy();app.quit();
}).catch(error=>{console.error(error);app.exit(1);});
