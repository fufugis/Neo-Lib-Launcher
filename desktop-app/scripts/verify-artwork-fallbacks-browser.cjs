// Real artwork renderers in isolated Chromium; no player profile or network needed.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), assert = require('node:assert/strict');
if (!process.versions.electron) {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE;
  const result = require('node:child_process').spawnSync(require('electron'), [__filename], { env, stdio: 'inherit', windowsHide: true, timeout: 60000 });
  if (result.error) console.error(result.error.message);
  process.exit(result.status ?? 1);
}
const { app, BrowserWindow } = require('electron');
app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'neolib-artwork-')));
app.whenReady().then(async () => {
  const root = path.resolve(__dirname, '..');
  const esbuild = require('node:module').createRequire(require.resolve('vite'))('esbuild');
  const bundle = await esbuild.build({ stdin: { resolveDir: root, loader: 'jsx', contents: `
    import React from 'react'; import {createRoot} from 'react-dom/client'; import {flushSync} from 'react-dom';
    import GameArtwork from './src/components/GameArtwork.jsx'; import LoungeCover from './src/components/lounge/LoungeCover.jsx';
    import CoverWall from './src/components/CoverWall.jsx'; import Workshop from './src/components/EditMetadataModal.jsx';
    import Gallery from './src/components/WorkshopArtworkGallery.jsx';
    const wide='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="460" height="215"><rect width="460" height="215" fill="orange"/></svg>');
    const broken='data:image/png;base64,broken';
    window.renderFixture=(mode)=>{
      const game=mode==='empty'?{id:'same',name:'Empty game'}:mode==='broken'?{id:'same',name:'Broken game',coverUrl:broken,headerImage:wide}:{id:'same',name:'Wide game',coverUrl:wide};
      flushSync(()=>root.render(<>{['cover','icon','logo','hero','background'].map(role=><div key={role} style={{position:'relative',width:180,height:200}}><GameArtwork game={game} role={role} loading="eager" className="art"/></div>)}<div id="lounge" style={{position:'relative',width:180,height:240}}><LoungeCover game={game}/></div></>));
    };
    window.renderWall=()=>{flushSync(()=>root.render(<CoverWall games={[{id:'wall',name:'Banner game',headerImage:wide}]} />));};
    window.saved=null;
    window.used=null;
    window.renderGallery=()=>{flushSync(()=>root.render(<Gallery state={{slot:'cover',query:'Banner game',games:[],assets:[{id:'wide',url:wide,author:'Fixture'}],selectedGame:{name:'Banner game'}}} setState={()=>{}} game={{name:'Banner game'}} onUse={asset=>window.used=asset}/>));};
    window.renderWorkshop=()=>{flushSync(()=>root.render(<Workshop open game={{id:'edit',name:'Banner game',headerImage:wide}} onClose={()=>{}} onSave={value=>window.saved=value}/>));};
    const root=createRoot(document.getElementById('root')); window.renderFixture('wide'); void 0;
  ` }, bundle: true, write: false, format: 'iife', define: { 'process.env.NODE_ENV': '"development"' } });
  const win = new BrowserWindow({ show: false, width: 1200, height: 900, webPreferences: { sandbox: true, contextIsolation: true, backgroundThrottling: false, offscreen: true } });
  await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent('<!doctype html><style>.art,#lounge img{position:absolute;inset:0;width:100%;height:100%}</style><div id="root" style="display:flex;flex-wrap:wrap"></div>'));
  const assets = path.join(root, 'dist-renderer/assets');
  if (fs.existsSync(assets)) {
    const stylesheet = fs.readdirSync(assets).find(name => /^index-.*\.css$/.test(name));
    if (stylesheet) await win.webContents.insertCSS(fs.readFileSync(path.join(assets, stylesheet), 'utf8'));
  }
  await win.webContents.executeJavaScript(bundle.outputFiles[0].text);
  const run = code => win.webContents.executeJavaScript(code);
  const ready = async generated => {
    for (let i=0;i<100;i++) {
      const state = await run(`[...document.querySelectorAll('[data-game-artwork]')].map(i=>({loaded:i.complete&&i.naturalWidth>0&&i.style.visibility==='visible',generated:i.src.includes('data-neolib-generated')}))`);
      const lounge = await run(`(()=>{const i=document.querySelector('#lounge img.z-\\\\[2\\\\]') || [...document.querySelectorAll('#lounge img')].at(-1);return !!i&&i.complete&&i.naturalWidth>0&&i.classList.contains('visible')})()`);
      if(state.length===5&&state.every(s=>s.loaded&&s.generated===generated)&&lounge) return;
      await new Promise(resolve=>setTimeout(resolve,30));
    }
    throw new Error('Artwork did not reach expected loaded fallback');
  };
  await ready(false);
  assert.equal(await run(`document.querySelector('[data-game-artwork="cover"]').style.objectFit`),'contain','Wide artwork is not stretched/cropped into portrait');
  await run(`window.renderFixture('broken');void 0`); await ready(false);
  assert.equal(await run(`document.querySelector('[data-game-artwork="cover"]').naturalWidth`),460,'Broken cover advances to banner');
  await run(`window.renderFixture('empty');void 0`); await ready(true);
  await run(`window.renderFixture('wide');void 0`); await ready(false);
  assert.equal(await run(`document.querySelectorAll('[data-game-artwork]').length`),5);
  await run(`window.renderWall();void 0`);
  await new Promise(resolve=>setTimeout(resolve,200));
  assert.equal(await run(`document.querySelector('[data-game-artwork="cover"]').naturalWidth`),460,'Actual Wall displays a banner-only game');
  assert.equal(await run(`document.body.textContent.includes('Portrait cover needed')`),false);
  await run(`window.renderWorkshop();void 0`);
  await new Promise(resolve=>setTimeout(resolve,100));
  await run(`document.querySelector('[data-testid="game-workshop-tab-artwork"]').click();void 0`);
  await new Promise(resolve=>setTimeout(resolve,250));
  assert.equal(await run(`[...document.querySelectorAll('[data-game-artwork]')].filter(i=>i.complete&&i.naturalWidth===460&&i.style.visibility==='visible').length`),5,'Actual Workshop populates all five artwork previews from header');
  assert.equal(await run(`document.body.textContent.includes('Automatic same-game fallback')`),true);
  await run(`[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Save game')).click();void 0`);
  assert.equal(await run(`window.saved.coverUrl`),null,'Automatic display does not overwrite saved cover');
  assert.equal(await run(`window.saved.icon`),null);
  await run(`window.renderGallery();void 0`);
  await new Promise(resolve=>setTimeout(resolve,200));
  assert.equal(await run(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Use this cover').disabled`),false,'Wide cover candidate can be selected');
  await run(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Use this cover').click();void 0`);
  assert.equal(await run(`window.used.width`),460);
  console.log('PASS: actual Chromium Wall, Workshop, gallery and Lounge accept landscape art, recover broken covers, generate all empty slots, retry same-game edits and preserve saved fields.');
  win.destroy(); app.quit();
}).catch(error=>{console.error(error);app.exit(1);});
