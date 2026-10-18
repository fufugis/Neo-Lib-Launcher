// Actual GameDetail renderer, isolated profile and synthetic imported games.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), assert = require('node:assert/strict');
if (!process.versions.electron) {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE;
  const result = require('node:child_process').spawnSync(require('electron'), [__filename], { env, stdio: 'inherit', windowsHide: true, timeout: 60000 });
  if (result.error) console.error(result.error.message);
  process.exit(result.status ?? 1);
}
const { app, BrowserWindow } = require('electron');
app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'neolib-wizard-artwork-')));
app.whenReady().then(async () => {
  const root = path.resolve(__dirname, '..');
  const esbuild = require('node:module').createRequire(require.resolve('vite'))('esbuild');
  const bundle = await esbuild.build({ stdin: { resolveDir: root, loader: 'jsx', contents: `
    import React from 'react'; import {createRoot} from 'react-dom/client'; import {flushSync} from 'react-dom';
    import GameDetail from './src/components/GameDetail.jsx';
    window.failures=[];window.nativeCalls=[];
    window.api=new Proxy({}, {get:(_,key)=>()=>{window.nativeCalls.push(key);return Promise.resolve({ok:false})}});
    class Boundary extends React.Component {state={error:null};static getDerivedStateFromError(error){return {error}};componentDidCatch(error){window.failures.push(error.message)}render(){return this.state.error?<div data-crash>{this.state.error.message}</div>:this.props.children}}
    const root=createRoot(document.getElementById('root'));let key=0;
    window.selectGame=game=>flushSync(()=>root.render(<Boundary key={++key}><GameDetail game={game} categories={[]} settings={{}} onUpdateGame={()=>{}} onPreviewLayoutChange={()=>{}}/></Boundary>));
    flushSync(()=>root.render(<div>Wizard import fixture</div>));
  ` }, bundle: true, write: false, format: 'iife', define: { 'process.env.NODE_ENV': '"development"' }, plugins: [{ name: 'omit-unrelated-stock-assets', setup(build) {
    build.onLoad({ filter: /stock-theme-registry\.mjs$/ }, args => ({ loader: 'js', contents: fs.readFileSync(args.path, 'utf8').replace(/^const (modules|assets) = import\.meta\.glob\(.*$/gm, 'const $1 = {};') }));
  } }] });
  const win = new BrowserWindow({ show: false, useContentSize: true, width: 1440, height: 900, webPreferences: { sandbox: true, contextIsolation: true, backgroundThrottling: false } });
  await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent('<!doctype html><body><div id="root" style="height:900px;display:flex"></div></body>'));
  await win.webContents.executeJavaScript(`window.matchMedia=()=>({matches:true,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});window.fetch=()=>{throw Error('Network forbidden in fixture')};void 0;`);
  await win.webContents.executeJavaScript(bundle.outputFiles[0].text);
  const run = code => win.webContents.executeJavaScript(code);
  const scenarios = [
    { id: 'wizard-no-art', name: 'Wizard imported game', exePath: 'C:/Games/Example/game.exe' },
    { id: 'empty-art', name: 'Empty artwork', exePath: '', cover: '', header: '', background: '', screenshots: [] },
    { id: 'null-art', name: 'Null artwork', cover: null, header: null, background: null, screenshots: [] },
    { id: 'broken-art', name: 'Broken image', background: 'data:image/png;base64,bm90LWFuLWltYWdl' },
    { id: 'valid-art', name: 'Valid image', background: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400"><rect width="800" height="400" fill="blue"/></svg>') },
  ];
  for (const game of [...scenarios, scenarios[0]]) {
    await run(`window.selectGame(${JSON.stringify(game)})`);
    await new Promise(resolve => setTimeout(resolve, 100));
    const state = await run(`({errors:window.failures,preview:!!document.querySelector('[data-testid="preview-page-layout"]'),text:document.body.textContent})`);
    assert.deepEqual(state.errors, [], `${game.id}: GameDetail must not crash`);
    assert.equal(state.preview, true, `${game.id}: game details remain reachable`);
    assert(state.text.includes(game.name));
  }
  const reads = await run('window.nativeCalls');
  assert(reads.every(name => ['scanGameUpdates', 'latestNewsForGame'].includes(name)), 'only mocked update/news reads are expected, never launch or data writes');
  console.log('PASS: actual GameDetail handles a newly imported game with absent/empty/null, failed and valid artwork, including a return to missing artwork; preview stays available and no native action ran.');
  win.destroy(); app.quit();
}).catch(error => { console.error(error); app.exit(1); });
