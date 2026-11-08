const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
if(!process.versions.electron){const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;const result=require('node:child_process').spawnSync(require('electron'),[__filename],{env,stdio:'inherit',windowsHide:true,timeout:60000});if(result.error)console.error(result.error);process.exit(result.status??1);}
const {app,BrowserWindow}=require('electron');
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'neolib-steam-artwork-')));
app.whenReady().then(async()=>{
 const root=path.resolve(__dirname,'..'),esbuild=require('node:module').createRequire(require.resolve('vite'))('esbuild');
 const bundle=await esbuild.build({stdin:{resolveDir:root,loader:'jsx',contents:`
 import React from 'react';import {createRoot} from 'react-dom/client';import {flushSync} from 'react-dom';
 import GameArtwork from './src/components/GameArtwork.jsx';import LoungeCover from './src/components/lounge/LoungeCover.jsx';
 const root=createRoot(document.getElementById('root'));
 window.lookups=[];window.api={steamArtwork:async ids=>{window.lookups.push(ids);return ids.map(appid=>({appid,icon:'https://images.test/'+appid+'/square.svg',portraitImage:'https://images.test/'+appid+'/portrait.svg'}))}};
 window.show=(mode)=>{
 const game={id:mode,name:'Steam game',appid:mode==='offline'?'400':'620',icon:'https://images.test/banner.svg',coverUrl:'https://images.test/banner.svg',...(mode==='custom'?{artworkSources:{icon:'Player selected',cover:'Player selected'}}:{})};
 window.original=JSON.stringify(game);
 flushSync(()=>root.render(<><div id="icon"><GameArtwork key={mode+'icon'} game={game} role="icon" loading="eager"/></div><div id="cover"><GameArtwork key={mode+'cover'} game={game} role="cover" loading="eager"/></div><div id="lounge"><LoungeCover key={mode} game={game}/></div></>));
 window.record=game;
 };window.show('normal');
 `},bundle:true,write:false,format:'iife',define:{'process.env.NODE_ENV':'"development"'}});
 const win=new BrowserWindow({show:false,width:1000,height:700,webPreferences:{sandbox:true,contextIsolation:true,backgroundThrottling:false,offscreen:true}});
 await win.webContents.session.protocol.handle('https',request=>{
   const url=new URL(request.url);
   if(url.hostname!=='images.test'||url.pathname.startsWith('/400/'))return new Response('',{status:404});
   const [width,height]=url.pathname.includes('square')?[64,64]:url.pathname.includes('portrait')?[600,900]:[460,215];
   return new Response('<svg xmlns="http://www.w3.org/2000/svg" width="'+width+'" height="'+height+'"><rect width="100%" height="100%" fill="cyan"/></svg>',{headers:{'content-type':'image/svg+xml'}});
 });
 await win.loadURL('data:text/html,'+encodeURIComponent('<style>body{background:#243247;color:white}#root{display:flex;gap:20px}#root>div{width:180px;height:250px;position:relative}img{max-width:100%;max-height:100%}</style><div id="root"></div>'));
 await win.webContents.executeJavaScript(bundle.outputFiles[0].text);
 const run=c=>win.webContents.executeJavaScript(c),settle=()=>new Promise(r=>setTimeout(r,500));
 const image=role=>run(`(()=>{const e=document.querySelector('#${role} img[data-game-artwork]');return {src:e.src,width:e.naturalWidth,height:e.naturalHeight,visible:e.style.visibility}})()`);
 await settle();
 assert((await image('icon')).src.endsWith('/620/square.svg'));assert.equal((await image('icon')).width,64);
 assert((await image('cover')).src.endsWith('/620/portrait.svg'));assert.equal((await image('cover')).height,900);
 assert.equal(await run("document.querySelector('#lounge img[src$=\"/620/portrait.svg\"]').naturalHeight"),900);
 assert.deepEqual(await run('window.lookups'),[['620']],'Icon/cover/Lounge share a single lookup');
 assert.equal(await run('JSON.stringify(window.record)===window.original'),true);
 await run("window.show('custom');void 0");await settle();
 assert((await image('icon')).src.endsWith('/banner.svg'));assert((await image('cover')).src.endsWith('/banner.svg'));
 await run("window.show('offline');void 0");await settle();
 assert((await image('icon')).src.endsWith('/banner.svg'),'Banner remains last-resort artwork when square sources fail');
 assert((await image('cover')).src.endsWith('/banner.svg'),'Banner remains last-resort artwork when portrait sources fail');
 assert.equal((await image('cover')).visible,'visible');
 console.log('PASS: actual Steam Library/Wall artwork component and Lounge prefer square/portrait assets, batch duplicate consumers, preserve custom choices and recover to banner on official-image failure without changing saved fields.');
 win.destroy();app.quit();
}).catch(error=>{console.error(error);app.exit(1)});
