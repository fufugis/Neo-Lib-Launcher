// Hidden isolated Chromium: no real library, profile or external network.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
if(!process.versions.electron){
  const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
  const run=require('node:child_process').spawnSync(require('electron'),[__filename],{env,stdio:'inherit',windowsHide:true,timeout:60000});
  if(run.error)console.error(run.error.message);process.exit(run.status??1);
}
const {app,BrowserWindow}=require('electron');
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'neolib-new-visuals-'));
app.setPath('userData',profile);
app.whenReady().then(async()=>{
  const root=path.resolve(__dirname,'..');
  const {CURSOR_OPTIONS,normalizeCursorTheme}=await import('../src/lib/cursor-presets.mjs');
  const cursors=CURSOR_OPTIONS.filter(item=>['aurora','ember'].includes(item.id)).map(item=>({id:item.id,label:item.label,data:'data:image/svg+xml;base64,'+fs.readFileSync(new URL(item.preview)).toString('base64')}));
  for(const cursor of cursors)if(normalizeCursorTheme(cursor.id)!==cursor.id)throw new Error('cursor normalization');
  const esbuild=require('node:module').createRequire(require.resolve('vite'))('esbuild');
  const bundle=await esbuild.build({stdin:{resolveDir:root,contents:`
    import {LIBRARY_GRAPHICS,libraryGraphicStyle,LIBRARY_GRAPHIC_PATTERNS} from './src/components/library/library-graphics.mjs';
    import {hydrateSettings} from './src/state/settings-state.mjs';
    globalThis.visualFixture={LIBRARY_GRAPHICS,libraryGraphicStyle,LIBRARY_GRAPHIC_PATTERNS,hydrateSettings};
  `},bundle:true,write:false,format:'iife',loader:{'.webp':'dataurl'},logLevel:'silent'});
  const win=new BrowserWindow({show:false,useContentSize:true,width:1100,height:920,webPreferences:{sandbox:true,contextIsolation:true,backgroundThrottling:false}});
  await win.loadURL('data:text/html;charset=utf-8,'+encodeURIComponent('<!doctype html><body style="margin:0;background:#101927;color:#eef5ff;font:14px Arial"></body>'));
  await win.webContents.executeJavaScript(bundle.outputFiles[0].text);
  let css=fs.readFileSync(path.join(root,'src/styles.css'),'utf8');
  for(const c of cursors)css=css.replaceAll('./assets/cursors/'+c.id+'.svg',c.data);
  const result=await win.webContents.executeJavaScript(`(async()=>{
    const {LIBRARY_GRAPHICS,libraryGraphicStyle,LIBRARY_GRAPHIC_PATTERNS,hydrateSettings}=visualFixture;
    const check=(value,message)=>{if(!value)throw new Error(message)},load=async src=>{const img=new Image();img.src=src;await img.decode();return img};
    const style=document.createElement('style');style.textContent=${JSON.stringify(css)};document.head.append(style);
    const board=document.createElement('main');board.style.cssText='padding:20px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px';document.body.append(board);
    for(const cursor of ${JSON.stringify(cursors)}){
      const image=await load(cursor.data);check(image.naturalWidth===32&&image.naturalHeight===32,'native cursor dimensions');
      const canvas=document.createElement('canvas');canvas.width=canvas.height=32;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,32,32).data;
      check(pixels[(3*32+4)*4+3]>0,'actual click tip has visible pixels '+cursor.id);
      const visible=new Set();for(let y=0;y<32;y++)for(let x=0;x<32;x++)if(pixels[(y*32+x)*4+3]>8)visible.add(y*32+x);
      const seen=new Set(),queue=[visible.values().next().value];while(queue.length){const n=queue.pop();if(seen.has(n)||!visible.has(n))continue;seen.add(n);const x=n%32,y=Math.floor(n/32);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(x+dx>=0&&x+dx<32&&y+dy>=0&&y+dy<32)queue.push((y+dy)*32+x+dx);}
      check(seen.size===visible.size,'one connected arrow, no side accessories '+cursor.id);
      document.body.dataset.neolibCursor=cursor.id;
      const button=document.createElement('button');document.body.append(button);check(getComputedStyle(button).cursor.includes('4 3'),'native cursor hotspot CSS');button.remove();
      const text=document.createElement('input');text.type='text';document.body.append(text);check(getComputedStyle(text).cursor==='text','typing retains I-beam');text.remove();
      const card=document.createElement('section');card.style.cssText='padding:16px;background:#1f2d42;border-radius:12px;min-height:190px';card.innerHTML='<h2>'+cursor.label+'</h2>';
      for(const background of ['#f0f4fa','#101927']){const panel=document.createElement('span');panel.style.cssText='display:inline-grid;place-items:center;width:105px;height:110px;background:'+background+';margin:4px;border-radius:8px';const preview=image.cloneNode();preview.style.cssText='width:80px;height:80px';panel.append(preview);card.append(panel);}board.append(card);
    }
    document.body.removeAttribute('data-neolib-cursor');
    const note=document.createElement('section');note.style.cssText='padding:20px';note.innerHTML='<h2>Classic arrows + material textures</h2><p>32px native pointers · static full-height surfaces · existing opacity control</p>';board.append(note);
    for(const id of ['carbon-weave','obsidian-slate','hammered-titanium']){
      const graphic=LIBRARY_GRAPHICS.find(item=>item.id===id);check(graphic?.fullHeight&&graphic.material,'registered full-height material');
      const full=await load(graphic.art),thumb=await load(graphic.thumbnail);
      check(full.naturalWidth===1024&&full.naturalHeight===1536,'full resolution is not replaced with thumbnail');check(thumb.naturalWidth===160,'picker uses small thumbnail');
      check(libraryGraphicStyle(id).backgroundImage!==libraryGraphicStyle(id,true).backgroundImage,'runtime and preview use distinct assets');
      const saved=hydrateSettings({bgTextureId:id,bgTextureOpacity:37});check(saved.bgTextureId===id&&saved.bgTextureOpacity===37,'selection and opacity persist');
      const card=document.createElement('section');card.style.cssText='height:570px;position:relative;overflow:hidden;border-radius:12px;background:#253a51';
      const art=document.createElement('div');Object.assign(art.style,LIBRARY_GRAPHIC_PATTERNS[id],{position:'absolute',inset:'0',opacity:'0.55',pointerEvents:'none'});card.append(art);
      const label=document.createElement('div');label.style.cssText='position:relative;padding:16px;line-height:2.4;text-shadow:0 1px 3px #000';label.innerHTML='<h2>'+graphic.label+'</h2><p>Full-height Library background</p><p>Game collection</p><p>Favorites</p><p>Recently played</p><p>Opacity stays adjustable</p>';card.append(label);board.append(card);
      for(const [width,height]of [[160,570],[320,740],[560,400]]){card.style.width=width+'px';card.style.height=height+'px';const box=art.getBoundingClientRect(),parent=card.getBoundingClientRect();check(box.width===parent.width&&box.height===parent.height,'surface covers panel at resized aspect ratios');check(getComputedStyle(art).backgroundSize==='100% 100%'&&getComputedStyle(art).backgroundRepeat==='no-repeat','no cropped or uncovered strip');}
      card.style.width='auto';card.style.height='570px';
    }
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));return {cursors:2,materials:3,nativeSize:32,textureSize:'1024x1536',thumbWidth:160};
  })()`);
  const preview=path.join(os.tmpdir(),'neolib-visual-preview-'+Date.now()+'.png');
  fs.writeFileSync(preview,(await win.webContents.capturePage()).toPNG());
  console.log('PASS: native arrow decode, connected silhouettes/hotspots, I-beam semantics, full-resolution textures, thumbnails, persistence and full-panel coverage:',result);
  console.log('PREVIEW '+preview);
  win.destroy();app.quit();
}).catch(error=>{console.error(error);app.exit(1)});
app.on('will-quit',()=>{if(path.dirname(profile)===os.tmpdir()&&path.basename(profile).startsWith('neolib-new-visuals-'))try{fs.rmSync(profile,{recursive:true,force:true})}catch{/* Chromium may briefly retain a log handle. */}});
