// Isolated hidden renderer; audio/network mocked, no player data or sounds used.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
if(!process.versions.electron){const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;const run=require('node:child_process').spawnSync(require('electron'),[__filename],{env,stdio:'inherit',windowsHide:true,timeout:60000});if(run.error)console.error(run.error.message);process.exit(run.status??1);}
const {app,BrowserWindow}=require('electron');
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'neolib-team-news-'));app.setPath('userData',profile);
app.whenReady().then(async()=>{
 const root=path.resolve(__dirname,'..'),esbuild=require('node:module').createRequire(require.resolve('vite'))('esbuild');
 const bundle=await esbuild.build({stdin:{resolveDir:root,loader:'jsx',contents:`
  import React from 'react';import {createRoot} from 'react-dom/client';import {flushSync} from 'react-dom';
  import NewsInbox from './src/components/news/NewsInbox.jsx';import FungistMascot from './src/components/FungistMascot.jsx';
  globalThis.fixture={React,createRoot,flushSync,NewsInbox,FungistMascot};
 `},bundle:true,write:false,format:'iife',define:{'process.env.NODE_ENV':'"development"','import.meta.env.BASE_URL':'"./"'},plugins:[{name:'mock-news-feedback',setup(build){
  build.onLoad({filter:/[\\/]lib[\\/]sound\.js$/},()=>({loader:'js',contents:'export function playFungistCue(){};export function playNewsChime(options){if(options.enabled)globalThis.chimes++;return options.enabled;}'}));
  build.onLoad({filter:/[\\/]lib[\\/]mascotVoice\.js$/},()=>({loader:'js',contents:'export function stopMascotVoice(){};export function fungistChatVoiceFor(){return ""};export function playMascotVoice(id,options){if(options.enabled)globalThis.voices++;return options.enabled;}'}));
 }}]});
 const win=new BrowserWindow({show:false,useContentSize:true,width:1100,height:800,webPreferences:{contextIsolation:true,sandbox:true,backgroundThrottling:false}});
 await win.loadURL('data:text/html;charset=utf-8,'+encodeURIComponent('<!doctype html><body style="margin:0;--surface:25 40 60;--panel:35 50 70;--ink:240 245 255;--muted:180 195 215;--accent:100 210 240;--accent-2:220 160 255"></body>'));
 // data: storage may be disabled in Chromium; a real in-memory Storage-shaped fixture is used.
 await win.webContents.executeJavaScript(`
  const values=new Map();globalThis.storageFails=false;
  Object.defineProperty(window,'localStorage',{value:{getItem:key=>values.get(key)||null,setItem:(key,value)=>{if(storageFails)throw new Error('storage fixture');values.set(key,value)},removeItem:key=>values.delete(key)},configurable:true});
  globalThis.chimes=0;globalThis.voices=0;globalThis.reactions=0;
  window.addEventListener('neolib:team-news',()=>reactions++);
  let clock=Date.now();Date.now=()=>clock;globalThis.advance=ms=>{clock+=ms};
  const realTimeout=window.setTimeout.bind(window),realInterval=window.setInterval.bind(window);
  window.setTimeout=(fn,ms,...args)=>realTimeout(fn,ms===60000?12:ms,...args);
  window.setInterval=(fn,ms,...args)=>realInterval(fn,ms===1500?20:ms,...args);
  Object.defineProperty(document,'hasFocus',{value:()=>true,configurable:true});
  Object.defineProperty(document,'visibilityState',{value:'visible',configurable:true});
  window.matchMedia=query=>({matches:query.includes('prefers-reduced-motion'),media:query,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});
  window.fetch=async()=>new Response(JSON.stringify({schemaVersion:1,messages:[]}));
  void 0;
 `);
 await win.webContents.executeJavaScript(bundle.outputFiles[0].text);
 const css=fs.readFileSync(path.join(root,'src/styles.css'),'utf8');
 const result=await win.webContents.executeJavaScript(`(async()=>{
  const {React,createRoot,flushSync,NewsInbox,FungistMascot}=fixture;
  const check=(v,m)=>{if(!v)throw new Error(m)},tick=()=>new Promise(resolve=>setTimeout(resolve,260));
  const style=document.createElement('style');style.textContent=${JSON.stringify(css)}+'*{box-sizing:border-box}';document.head.append(style);
  const host=document.createElement('div');document.body.append(host);let root=createRoot(host),options={};
  const key='neolib:news-inbox:v1',settings={fungistEnabled:true,soundsEnabled:true,fungistVoiceEnabled:true,soundPack:'synthwave',mascotId:'fifi'};
  const seed=id=>localStorage.setItem(key,JSON.stringify({messages:[{id,title:'Team announcement',body:'Test message to see if the mailbox and popup works.',read:false,notified:false}],seenIds:[id],lastCheckedAt:Date.now()}));
  const render=()=>flushSync(()=>root.render(React.createElement(React.Fragment,null,
   React.createElement(NewsInbox,{paused:!!options.paused,mascotResting:!!options.rest,settings:{...settings,...options.settings}}),
   React.createElement(FungistMascot,{mascotId:'fifi',enabled:options.settings?.fungistEnabled!==false,resting:!!options.rest,voiceEnabled:false,soundsEnabled:false}))));
  const popup=()=>document.querySelector('[data-testid="news-popup"]');
  const remount=()=>{flushSync(()=>root.unmount());root=createRoot(host);render();advance(60001)};
  seed('normal-test');render();await tick();check(!popup(),'startup minute is respected');advance(60001);await tick();
  check(popup(),'centered announcement appears');
  let box=popup().getBoundingClientRect();check(Math.abs(box.left+box.width/2-innerWidth/2)<1 && Math.abs(box.top+box.height/2-innerHeight/2)<1,'center of actual viewport '+JSON.stringify({x:box.x,y:box.y,width:box.width,height:box.height,innerWidth,innerHeight,transform:getComputedStyle(popup()).transform}));
  check(chimes===1&&voices===1&&reactions===1,'one chime, mascot voice and visual reaction');
  check(document.querySelector('[data-news-reaction="true"]'),'actual mascot responds');
  const layer=document.querySelector('[data-testid="news-announcement-layer"]');layer.dispatchEvent(new MouseEvent('mousedown',{bubbles:true}));layer.click();
  document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));advance(600000);await tick();check(popup(),'outside, Escape and elapsed time never dismiss');
  document.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true}));check(document.activeElement.getAttribute('aria-label')==='Close announcement','keyboard focus stays on deliberate close');
  remount();await tick();check(popup(),'unacknowledged announcement restores after restart');check(chimes===1&&voices===1&&reactions===1,'restore does not replay feedback');
  storageFails=true;popup().querySelector('button').click();await tick();check(popup()&&popup().querySelector('[role="alert"]'),'failed persistence cannot discard announcement');storageFails=false;
  popup().querySelector('button').click();await tick();check(!popup(),'only X acknowledges and closes');
  check(JSON.parse(localStorage.getItem(key)).messages[0].acknowledged===true,'X persists acknowledgement');
  let mail=document.querySelector('[data-testid="news-mail-button"]');check(mail?.textContent.includes('News')&&mail.textContent.includes('1')&&mail.dataset.unread==='true','prominent mailbox retains saved unread copy');
  remount();await tick();check(!popup(),'acknowledged message does not replay');
  flushSync(()=>root.unmount());root=createRoot(host);seed('zzz-test');chimes=voices=reactions=0;options={rest:true};render();advance(60001);await tick();
  check(popup()&&chimes===1&&voices===0&&reactions===0,'ZZZ still delivers centered message and chime without mascot feedback');
  check(!document.querySelector('[aria-label="Talk to FiFi"]'),'ZZZ never wakes mascot');
  popup().querySelector('button').click();await tick();
  flushSync(()=>root.unmount());root=createRoot(host);seed('mute-test');chimes=voices=reactions=0;options={rest:true,settings:{soundsEnabled:false}};render();advance(60001);await tick();
  check(popup()&&chimes===0&&voices===0&&reactions===0,'mute and ZZZ suppress audio/mascot without suppressing message');
  popup().querySelector('button').click();await tick();
  flushSync(()=>root.unmount());root=createRoot(host);seed('paused-test');chimes=voices=reactions=0;options={paused:true};render();advance(60001);await tick();check(!popup(),'onboarding pause still defers delivery');
  options={};render();await tick();check(popup(),'deferred message delivers when eligible');
  popup().querySelector('button').click();await tick();
  flushSync(()=>root.unmount());root=createRoot(host);seed('background-game');chimes=voices=reactions=0;
  Object.defineProperty(document,'visibilityState',{value:'hidden',configurable:true});
  Object.defineProperty(document,'hasFocus',{value:()=>false,configurable:true});
  options={rest:true};render();advance(60001);await tick();
  check(popup()&&chimes===1&&reactions===0,'unfocused gameplay/rest creates persistent popup and chime without mascot');
  advance(7200000);document.dispatchEvent(new Event('visibilitychange'));await tick();
  check(popup(),'message stays ready when returning from game');
  Object.defineProperty(document,'visibilityState',{value:'visible',configurable:true});
  popup().querySelector('button').click();await tick();
  const lounge=document.createElement('section');lounge.dataset.controllerSurface='lounge';lounge.setAttribute('role','dialog');lounge.setAttribute('aria-modal','true');document.body.append(lounge);
  flushSync(()=>root.unmount());root=createRoot(host);seed('lounge-news');options={};render();advance(60001);await tick();
  check(popup(),'Lounge workspace does not block messages');lounge.remove();
  popup().querySelector('button').click();await tick();
  flushSync(()=>root.unmount());root=createRoot(host);
  localStorage.setItem(key,JSON.stringify({messages:[],seenIds:[],lastCheckedAt:0}));
  window.fetch=async()=>new Response(JSON.stringify({schemaVersion:1,messages:[{id:'live-background-feed',title:'Arrived during play',body:'Fresh message fetched while unfocused.',publishedAt:new Date(Date.now()).toISOString()}]}));
  Object.defineProperty(document,'visibilityState',{value:'hidden',configurable:true});
  options={rest:true};render();advance(60001);await tick();
  check(popup()?.textContent.includes('Arrived during play'),'new feed is fetched and presented in the background, not just seeded inbox mail');
  Object.defineProperty(document,'visibilityState',{value:'visible',configurable:true});
  return {centered:true,xOnly:true,restartSafe:true,zzz:true,mute:true,mailbox:true,mascotReaction:true,backgroundGame:true};
 })()`);
 console.log('PASS: actual centered persistent News, explicit X, storage/restart, ZZZ/chime-only, mute, mascot reaction and mailbox:',result);
 win.setContentSize(480,320);
 await win.webContents.executeJavaScript(`(async()=>{
  const popup=document.querySelector('[data-testid="news-popup"]');popup.querySelector('p').textContent='Long announcement. '.repeat(300);
  await new Promise(resolve=>setTimeout(resolve,60));
  const box=popup.getBoundingClientRect();
  if(box.left<0||box.right>innerWidth||box.top<0||box.bottom>innerHeight||Math.abs(box.left+box.width/2-innerWidth/2)>1||Math.abs(box.top+box.height/2-innerHeight/2)>1)throw new Error('small viewport center/fit');
  popup.scrollTop=popup.scrollHeight;await new Promise(resolve=>setTimeout(resolve,60));
  const close=popup.querySelector('button').getBoundingClientRect();if(close.top<box.top||close.bottom>box.bottom)throw new Error('X must remain visible while long body scrolls');
 })()`);
 console.log('PASS: 480x320 viewport, long content bounded and X remains visible while scrolling.');
 win.destroy();app.quit();
}).catch(error=>{console.error(error);app.exit(1)});
app.on('will-quit',()=>{if(path.dirname(profile)===os.tmpdir()&&path.basename(profile).startsWith('neolib-team-news-'))try{fs.rmSync(profile,{recursive:true,force:true})}catch{/* Chromium may retain a log handle briefly. */}});
