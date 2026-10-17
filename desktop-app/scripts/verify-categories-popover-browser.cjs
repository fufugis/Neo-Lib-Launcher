// Hidden isolated Chromium, never the player's library/profile.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
if (!process.versions.electron) {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE;
  const run = require('node:child_process').spawnSync(require('electron'), [__filename], { env, stdio: 'inherit', windowsHide: true, timeout: 60000 });
  if (run.error) console.error(run.error.message);
  process.exit(run.status ?? 1);
}
const { app, BrowserWindow } = require('electron');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'neolib-categories-'));
app.setPath('userData', profile);
app.whenReady().then(async () => {
  const esbuild = require('node:module').createRequire(require.resolve('vite'))('esbuild');
  const bundle = await esbuild.build({ stdin: { resolveDir: path.resolve(__dirname, '..'), loader: 'jsx', contents: `
    import React from 'react'; import { createRoot } from 'react-dom/client'; import { flushSync } from 'react-dom';
    import Popover from './src/components/library/LibraryCategoriesPopover.jsx';
    globalThis.fixture = { React, createRoot, flushSync, Popover };
  ` }, bundle: true, write: false, format: 'iife', define: { 'process.env.NODE_ENV': '"development"' } });
  const win = new BrowserWindow({ show: false, width: 1000, height: 700, webPreferences: { contextIsolation: true, sandbox: true, backgroundThrottling: false } });
  await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent('<!doctype html><body style="margin:0;--surface:25 40 60"></body>'));
  await win.webContents.executeJavaScript(bundle.outputFiles[0].text);
  const css = fs.readFileSync(path.join(__dirname, '../src/styles.css'), 'utf8');
  await win.webContents.executeJavaScript(`
    const { React, createRoot, flushSync, Popover } = fixture;
    const style=document.createElement('style'); style.textContent='*{box-sizing:border-box}' + ${JSON.stringify(css)}; document.head.append(style);
    globalThis.host=document.createElement('div'); host.style.cssText='position:absolute;left:140px;top:32px;width:100px;height:32px;overflow:hidden;transform:translateZ(0)'; document.body.append(host);
    const rail=document.createElement('nav'); rail.style.cssText='position:fixed;left:0;top:0;bottom:0;width:160px;z-index:50;background:red'; document.body.append(rail);
    globalThis.anchor=React.createRef(); const panel=React.createRef(); let clicks=0;
    function Surface(){return React.createElement(React.Fragment,null,
      React.createElement('button',{ref:anchor,style:{width:60,height:28}},'Categories'),
      React.createElement(Popover,{anchorRef:anchor,panelRef:panel},React.createElement('button',{style:{display:'block',height:130,width:'100%'},onClick:()=>clicks++},'Show shelves')));}
    flushSync(()=>createRoot(host).render(React.createElement(Surface)));
    globalThis.checkBounds=async()=>{
      await new Promise(resolve=>setTimeout(resolve,60));
      const box=panel.current.getBoundingClientRect(), check=(v,m)=>{if(!v)throw new Error(m)};
      check(box.left>=7.5 && box.right<=innerWidth-7.5 && box.top>=7.5 && box.bottom<=innerHeight-7.5,'viewport bounds');
      check(panel.current.parentNode===document.body,'portal escapes clipped Library');
      const css=getComputedStyle(panel.current);
      check(css.position==='fixed' && css.backgroundColor==='rgb(25, 40, 60)' && css.backdropFilter==='none','opaque fixed menu');
      check(panel.current.contains(document.elementFromPoint(box.right-5,box.top+5)),'menu above rail, outside parent clipping');
      panel.current.querySelector('button').click(); check(clicks>0,'controls clickable');
      return {left:box.left,top:box.top};
    };
    void 0;
  `);
  const initial=await win.webContents.executeJavaScript('checkBounds()');
  if(Math.abs(initial.left-140)>1)throw new Error('menu must align to trigger left');
  win.setSize(350,240); await win.webContents.executeJavaScript('checkBounds()');
  await win.webContents.executeJavaScript("host.style.top='180px'; window.dispatchEvent(new Event('resize'))");
  const flipped=await win.webContents.executeJavaScript('checkBounds()');
  if(flipped.top>=180)throw new Error('menu must flip above a low trigger');
  win.setSize(1000,700);
  await win.webContents.executeJavaScript("host.style.left='850px'; window.dispatchEvent(new Event('resize'))");
  await win.webContents.executeJavaScript('checkBounds()');
  console.log('PASS: actual Categories foreground portal is opaque, unclipped, clickable and bounded through window resizing and edge flips.');
  win.destroy(); app.quit();
}).catch(error=>{console.error(error);app.exit(1)});
app.on('will-quit',()=>{
  if(path.dirname(profile)===os.tmpdir() && path.basename(profile).startsWith('neolib-categories-')){
    try{fs.rmSync(profile,{recursive:true,force:true})}catch{/* Chromium may retain a log handle briefly. */}
  }
});
