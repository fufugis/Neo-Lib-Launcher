// Actual sidebar components and compiled production CSS, isolated hidden profile.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
if (!process.versions.electron) {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE;
  const run = require('node:child_process').spawnSync(require('electron'), [__filename], { env, stdio: 'inherit', windowsHide: true, timeout: 60000 });
  if (run.error) console.error(run.error.message);
  process.exit(run.status ?? 1);
}
const { app, BrowserWindow } = require('electron');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'neolib-sidebar-icons-'));
app.setPath('userData', profile);
app.whenReady().then(async () => {
  const root = path.resolve(__dirname, '..');
  const assets = path.join(root, 'dist-renderer/assets');
  const cssFile = fs.readdirSync(assets).find(name => /^index-.*\.css$/.test(name));
  if (!cssFile) throw new Error('Build renderer CSS before running the sidebar geometry fixture.');
  const css = fs.readFileSync(path.join(assets, cssFile), 'utf8');
  const esbuild = require('node:module').createRequire(require.resolve('vite'))('esbuild');
  const bundle = await esbuild.build({ stdin: { resolveDir: root, loader: 'jsx', contents: `
    import React from 'react'; import { createRoot } from 'react-dom/client'; import { flushSync } from 'react-dom';
    import { SideNavigationRail } from './src/components/Sidebar.jsx';
    globalThis.fixture = { React, createRoot, flushSync, SideNavigationRail };
  ` }, plugins: [{ name: 'omit-unused-media', setup(build) {
    build.onLoad({ filter: /\.(?:png|jpe?g|webp|svg|mp3|wav|css)$/ }, () => ({ contents: 'export default "fixture-media";', loader: 'js' }));
  } }], bundle: true, write: false, format: 'iife', banner: { js: 'const __fixtureGlob = () => ({});' }, define: { 'process.env.NODE_ENV': '"development"', 'import.meta.glob': '__fixtureGlob', 'import.meta.env': '{}' }, logLevel: 'silent' });
  const win = new BrowserWindow({ show: false, width: 1100, height: 1000, webPreferences: { contextIsolation: true, sandbox: true, backgroundThrottling: false } });
  win.webContents.on('console-message', (_event, level, message) => { if (level >= 2) console.error(message); });
  await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent('<!doctype html><body style="margin:0;--surface:25 40 60;--panel:35 50 70;--ink:230 240 250;--muted:180 190 200;--border:80 100 120;--accent:100 180 240"></body>'));
  await win.webContents.executeJavaScript(bundle.outputFiles[0].text);
  const result = await win.webContents.executeJavaScript(`(async()=>{
    const {React,createRoot,flushSync,SideNavigationRail}=fixture;
    const style=document.createElement('style'); style.textContent=${JSON.stringify(css)}+'*{transition:none!important;animation:none!important}'; document.head.append(style);
    const host=document.createElement('div'); host.style.height='960px';document.body.append(host);
    const root=createRoot(host), check=(v,m)=>{if(!v)throw new Error(m)};
    let count=0;
    const render=(mode,buttonSize,iconSize)=>flushSync(()=>root.render(React.createElement(SideNavigationRail,{mode:'library', sidebarTweaks:{mode,buttonSize,iconSize},addonsEnabled:true,addons:[{id:'sample',name:'Example addon'}]})));
    for(const mode of ['icons','default'])for(const buttonSize of [75,100,150])for(const iconSize of [14,21,30]){
      render(mode,buttonSize,iconSize);
      const nav=host.querySelector('nav');
      flushSync(()=>nav.dispatchEvent(new MouseEvent('mouseover',{bubbles:true,relatedTarget:null})));
      for(const button of nav.querySelectorAll('.neo-rail-button')){
        const frame=button.querySelector('.neo-rail-button__icon'),svg=frame?.querySelector('svg');if(!svg)continue;
        const b=button.getBoundingClientRect(),f=frame.getBoundingClientRect(),s=svg.getBoundingClientRect();
        const detail=button.getAttribute('aria-label')+' '+mode+' '+buttonSize+'/'+iconSize;
        check(Math.abs(s.left+s.width/2-f.left-f.width/2)<0.6 && Math.abs(s.top+s.height/2-f.top-f.height/2)<0.6,'centered glyph: '+detail);
        check(s.left>=f.left+0.5 && s.top>=f.top+0.5 && s.right<=f.right-0.5 && s.bottom<=f.bottom-0.5,'glyph fits frame border: '+detail);
        check(f.top>=b.top && f.bottom<=b.bottom && f.left>=b.left && f.right<=b.right,'frame fits button: '+detail);
        check(Math.abs(f.top+f.height/2-b.top-b.height/2)<0.6,'vertically centered button icon: '+detail);
        if(mode==='icons')check(Math.abs(f.left+f.width/2-b.left-b.width/2)<0.6,'compact button horizontal center: '+detail);
        count++;
      }
    }
    render('icons',100,30);
    for(const [id,title,hint] of [['tab-home','Home','Your dashboard'],['sidebar-rail-wizard-btn','Add games','Wizard'],['sidebar-rail-visuals-menu-btn','Visuals','Choose an option'],['addon-sample','Example addon','Custom page'],['sidebar-rail-quit-btn','Quit','Close NEO-LIB']]){
      const target=host.querySelector('[data-testid="'+id+'"]');check(target,'target '+id);
      target.scrollIntoView({block:'nearest'});
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      flushSync(()=>target.dispatchEvent(new MouseEvent('mouseover',{bubbles:true,relatedTarget:null})));
      await new Promise(resolve=>requestAnimationFrame(resolve));
      const tip=document.querySelector('[data-testid="sidebar-instant-label"]');
      check(tip?.querySelector('[data-sidebar-label]')?.textContent===title,'immediate main label '+id+' '+JSON.stringify({tooltip:tip?.outerHTML,target:target.outerHTML}));
      check(tip?.querySelector('[data-sidebar-hint]')?.textContent===hint,'matching subtext '+id);
      const t=tip.getBoundingClientRect(),main=tip.querySelector('[data-sidebar-label]').getBoundingClientRect(),sub=tip.querySelector('[data-sidebar-hint]').getBoundingClientRect();
      check(sub.top>=main.bottom && t.left>=8 && t.right<=innerWidth-8 && t.top>=8 && t.bottom<=innerHeight-8,'two lines fit viewport '+id);
      flushSync(()=>target.focus());check(document.querySelector('[data-testid="sidebar-instant-label"] [data-sidebar-hint]')?.textContent===hint,'keyboard subtext '+id);
    }
    flushSync(()=>root.unmount());return {buttonGeometryChecks:count,layouts:2,buttonSizes:3,iconSizes:3,twoLineHoverAndFocus:true};
  })()`);
  console.log('PASS: production sidebar icon centering and two-line labels:', result);
  win.destroy(); app.quit();
}).catch(error=>{console.error(error);app.exit(1)});
app.on('will-quit',()=>{
  if(path.dirname(profile)===os.tmpdir() && path.basename(profile).startsWith('neolib-sidebar-icons-')){
    try{fs.rmSync(profile,{recursive:true,force:true})}catch{/* Chromium may retain a log handle briefly. */}
  }
});
