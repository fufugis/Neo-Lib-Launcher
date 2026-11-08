import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {gamePathTarget,relocatedGame} from '../src/state/missing-games-model.mjs';
import {createLibraryManagementWorkflow} from '../src/services/library-management-workflow.mjs';
const require=createRequire(import.meta.url),path=require('node:path').win32;
const {createGamePathAuditService}=require('../electron/game/game-path-audit-service.cjs');
const paths=new Map([['C:\\','dir'],['C:\\Games','dir'],['C:\\Games\\ok.exe','file'],['C:\\Games\\game.rom','file'],['C:\\Blocked','denied']]);
let reads=0;const fs={async stat(name){reads++;const type=paths.get(name);if(!type)throw Object.assign(Error('missing'),{code:'ENOENT'});if(type==='denied')throw Object.assign(Error('denied'),{code:'EACCES'});return {isFile:()=>type==='file',isDirectory:()=>type==='dir'};}};
const service=createGamePathAuditService({fsp:fs,path});
const records=[
 {id:'ok',filePath:'C:\\Games\\ok.exe',folderPath:'C:\\Games'},
 {id:'missing',filePath:'C:\\Games\\gone.exe',folderPath:'C:\\Games'},
 {id:'offline',filePath:'Z:\\Games\\gone.exe',folderPath:''},
 {id:'denied',filePath:'',folderPath:'C:\\Blocked'},
 {id:'uri',filePath:'steam://run/620',folderPath:''},
 {id:'network',filePath:'\\\\server\\game.exe',folderPath:''},
 {id:'rom',filePath:'C:\\Games\\game.rom',folderPath:''},
];
assert.deepEqual((await service.audit(records)).map(row=>row.status),['present','missing','unavailable','unavailable','unsupported','unsupported','present']);
assert(reads<records.length*3,'Root stat is cached; no folder traversal');
assert.equal(gamePathTarget({id:'g',romPath:'D:\\roms\\game.rom',exePath:'C:\\Emulator.exe'}).filePath,'D:\\roms\\game.rom');
const routed={id:'g',exePath:'C:\\old.exe',launchRoutes:[{id:'play',label:'Play',kind:'play',target:'C:\\Games\\ok.exe',primary:true}]};
assert.equal(gamePathTarget(routed).filePath,'C:\\Games\\ok.exe');
assert.equal(relocatedGame(routed,{exePath:'C:\\new.exe',installDir:'C:\\'}).launchRoutes[0].target,'C:\\new.exe');
const initial={games:[{id:'g',name:'Game',exePath:'C:\\Games\\gone.exe',playtime:12,categoryIds:['private']}],tools:[{id:'tool'}],categories:[{id:'private',private:true,pinHash:'keep'}],toolCategories:[],gameOrderByCategory:{private:['g']}};
function fixture({save=true,cache=true,confirm=true}={}){
 let library=structuredClone(initial),writes=[],notices=[],prompts=[],selected='g',tool='tool';
 const workflow=createLibraryManagementWorkflow({library,getLibrary:()=>library,saveLibrary:async value=>{writes.push(value);if(save==='throw')throw Error('disk');return save;},
 setLibrary:next=>{library=typeof next==='function'?next(library):next;},setSelectedId:value=>selected=value,setSelectedToolId:value=>tool=value,setUnlockedCategories:()=>{},
 askConfirm:async prompt=>{prompts.push(prompt);return typeof confirm==='function'?confirm(prompt):confirm;},notify:value=>notices.push(value),
 nativeApi:{auditGamePaths:rows=>service.audit(rows),clearLibraryArtwork:async()=>{if(!cache)throw Error('cache locked');return {ok:true,removed:0}}}});
 return {workflow,writes,notices,prompts,get library(){return library},get selected(){return selected},get tool(){return tool}};
}
for(const save of [false,'throw']){const f=fixture({save});await f.workflow.resetLibraryGames();assert.equal(f.library.games.length,1);assert.equal(f.library.tools.length,1);assert(f.notices.at(-1).includes('nothing was cleared'));}
for(const cache of [true,false]){const f=fixture({cache});await f.workflow.resetLibraryGames();assert.equal(f.writes.length,1);assert.deepEqual(f.library.games,[]);assert.deepEqual(f.library.tools,[]);assert.deepEqual(f.library.categories,[]);assert.equal(f.library.homeGameDataArchive.g.playtime,12);assert.equal(f.selected,null);assert.equal(f.tool,null);assert.deepEqual(f.prompts.map(p=>p.typedConfirm),['RESET','CLEAR LIBRARY']);}
const cancel=fixture({confirm:false});await cancel.workflow.resetLibraryGames();assert.equal(cancel.writes.length,0);
const remove=fixture();const target=gamePathTarget(initial.games[0]);assert.deepEqual(await remove.workflow.removeMissingGames([target]),['g']);assert.equal(remove.library.games.length,0);assert.equal(remove.library.tools.length,1);
let large={games:Array.from({length:201},(_,index)=>({id:`missing-${index}`,exePath:`C:\\Games\\missing-${index}.exe`}))};
const batchSizes=[];
const bulk=createLibraryManagementWorkflow({getLibrary:()=>large,setLibrary:update=>{large=update(large);},setSelectedId:()=>{},askConfirm:async()=>true,nativeApi:{auditGamePaths:async rows=>{batchSizes.push(rows.length);return service.audit(rows);}}});
assert.equal((await bulk.removeMissingGames(large.games.map(gamePathTarget))).length,201);
assert.deepEqual(batchSizes,[100,100,1]);assert.equal(large.games.length,0);
paths.set('C:\\Games\\gone.exe','file');const restored=fixture();assert.deepEqual(await restored.workflow.removeMissingGames([target]),[]);assert.equal(restored.library.games.length,1);
console.log('PASS: local path audit missing/offline/access/URI/UNC/ROM classification, primary route repair, recheck before removal, full-reset confirmed save/false/throw/cache-failure/cancel and Home data preservation. Injected filesystem and Library only.');
