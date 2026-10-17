/* Isolated, hidden Electron fixture: never attaches to the running app/profile. */
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

if (!process.versions.electron) {
  const environment = { ...process.env };
  delete environment.ELECTRON_RUN_AS_NODE;
  const result = spawnSync(require('electron'), [__filename], { env: environment, stdio: 'inherit', windowsHide: true, timeout: 120000 });
  if (result.error) console.error(result.error.message);
  process.exit(result.status ?? 1);
}

const { app, BrowserWindow } = require('electron');
const fixtureProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'neolib-visual-perf-'));
app.setPath('userData', fixtureProfile);
app.whenReady().then(async () => {
  const { createRequire } = require('node:module');
  const esbuild = createRequire(require.resolve('vite'))('esbuild');
  const bundle = await esbuild.build({
    stdin: { resolveDir: path.resolve(__dirname, '..'), loader: 'jsx', contents: `
      import React from 'react';
      import { createRoot } from 'react-dom/client';
      import { flushSync } from 'react-dom';
      import { LibraryGameRow } from './src/components/library/LibraryTree.jsx';
      import { ViewingDistancePicker } from './src/components/lounge/LoungeViewingDistance.jsx';
      globalThis.fixtureReact = { React, createRoot, flushSync, LibraryGameRow, ViewingDistancePicker };
    ` },
    bundle: true, write: false, format: 'iife', define: { 'process.env.NODE_ENV': '"development"' },
    loader: { '.svg': 'dataurl', '.png': 'dataurl', '.webp': 'dataurl', '.jpg': 'dataurl' },
    plugins: [{ name: 'count-actual-row-renders', setup(build) {
      build.onLoad({ filter: /LibraryTree\.jsx$/ }, args => ({ loader: 'jsx', contents: fs.readFileSync(args.path, 'utf8').replace('  const [menu, setMenu] =', '  globalThis.fixtureRowRenders = (globalThis.fixtureRowRenders || 0) + 1;\n  const [menu, setMenu] =') }));
    } }],
  });
  const window = new BrowserWindow({ show: false, width: 1000, height: 800, webPreferences: { sandbox: true, contextIsolation: true, backgroundThrottling: false } });
  await window.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent('<!doctype html><html><head></head><body style="margin:0"></body></html>'));
  await window.webContents.executeJavaScript(bundle.outputFiles[0].text);
  const mirrorSource = fs.readFileSync(path.join(__dirname, '../src/components/lounge/lounge-preview-mirror.mjs'), 'utf8').replaceAll('export function ', 'function ');
  const result = await window.webContents.executeJavaScript(`(async () => {
    ${mirrorSource}
    const check = (value, message) => { if (!value) throw new Error(message); };
    const source = document.createElement('div');
    source.style.cssText = 'width:800px;height:300px;display:flex;overflow:auto;';
    const card = document.createElement('button');
    card.id = 'private-real-button'; card.setAttribute('data-controller-target', 'true');
    card.style.cssText = 'width:200px;height:100px;flex-shrink:0;color:rgb(20, 30, 40);';
    card.textContent = 'Original'; source.append(card);
    const embed = document.createElement('iframe'); source.append(embed);
    document.body.append(source);
    const container = document.createElement('div'); document.body.append(container);
    let reads = 0;
    const mirror = createPreviewMirror({ readStyle: node => { reads++; return getComputedStyle(node); } });
    const bounds = source.getBoundingClientRect();
    mirror.sync([source], bounds, container);
    const first = container.firstChild, clone = first.firstChild;
    check(clone.disabled && clone.tabIndex === -1 && !clone.id && !clone.hasAttribute('data-controller-target'), 'mirror stays inert/ID-safe');
    check(container.querySelectorAll('iframe').length === 0 && first.lastChild.textContent === 'Community widget', 'embedded code is not instantiated');
    const initialReads = reads;
    for (let tick = 1; tick <= 120; tick++) {
      card.style.transform = 'translateX(' + tick + 'px)';
      card.style.opacity = '0.7';
      check(mirror.patchMotion(card), 'motion fast path');
    }
    check(reads === initialReads, '120 motion ticks require no computed-style reads/full snapshots');
    const motionStyleReads = reads - initialReads;
    check(clone.style.transform === 'translateX(120px)' && clone.style.opacity === '0.7', 'motion is still reflected');
    mirror.sync([source], bounds, container);
    check(container.firstChild === first && first.firstChild === clone, 'unchanged elements retain DOM identity');
    check(reads === initialReads, 'unchanged tree does not recopy computed styles');
    card.textContent = 'Changed'; card.style.width = '250px';
    mirror.invalidate(source); mirror.sync([source], bounds, container);
    check(first.firstChild === clone && clone.textContent === 'Changed' && clone.style.width === '250px', 'text/layout edits update retained mirror');
    source.removeChild(card); mirror.invalidate(source); mirror.sync([source], bounds, container);
    check(!clone.isConnected && first.children.length === 1, 'removed nodes leave mirror');
    source.prepend(card); mirror.invalidate(source); mirror.sync([source], bounds, container);
    check(first.firstChild === clone, 'reinserted nodes retain correct identity');
    const farCard = document.createElement('div');
    farCard.setAttribute('data-lounge-game', 'true');
    farCard.style.cssText = 'position:absolute;left:2000px;top:0;width:100px;height:100px;';
    farCard.textContent = 'Far card'; source.append(farCard);
    mirror.invalidate(source); mirror.sync([source], bounds, container);
    check(first.lastChild.textContent === '' && first.lastChild.style.width === '100px', 'offscreen cards preserve their layout through spacers');
    farCard.style.left = '0px'; mirror.invalidate(source); mirror.sync([source], bounds, container);
    check(first.lastChild.textContent === 'Far card', 'cards entering the viewport return to the mirror');
    source.remove(); container.remove();

    const { React, createRoot, flushSync, LibraryGameRow } = fixtureReact;
    const host = document.createElement('div'); document.body.append(host);
    const root = createRoot(host);
    const games = Array.from({ length: 500 }, (_, index) => ({ id: 'game-' + index, name: 'Game ' + index }));
    const categories = [];
    let selected = 'game-0', version = 0, clicked, context;
    const render = () => flushSync(() => root.render(React.createElement(React.Fragment, null, games.map((game, index) => {
      const committedVersion = version;
      return React.createElement(LibraryGameRow, {
        key: game.id, g: game, size: { id: 'medium', rowH: 44, icon: 32, font: 12 },
        selected: selected === game.id, indexInCat: index, sectionGames: [...games], categories,
        onClick: () => { clicked = committedVersion; }, onContext: action => { context = [committedVersion, action]; },
        onReorderInCat: () => {}, onMoveBetween: () => {},
      });
    }))));
    render();
    check(fixtureRowRenders === 500, 'initial 500 rows render');
    version = 1; selected = 'game-1'; render();
    check(fixtureRowRenders === 502, 'selection changes render only the two affected row bodies');
    version = 2; render();
    check(fixtureRowRenders === 502, 'new callbacks/size objects/shelf arrays do not rerender unchanged row bodies');
    const row = host.querySelector('[data-testid="game-row-game-0"]');
    row.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    check(clicked === 2, 'memoized rows use latest committed click callback');
    flushSync(() => row.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: 100, clientY: 100 })));
    document.querySelector('[data-testid="game-ctx-refetch-game-0"]').click();
    check(context?.[0] === 2 && context?.[1] === 'refetch', 'context menu uses latest callback');
    flushSync(() => root.unmount()); host.remove();
    return { motionTicks: 120, motionStyleReads, initialRows: 500, selectionRowRenders: 2, unchangedRowRenders: 0 };
  })()`);
  console.log('PASS: real Chromium retained mirror/inertness/layout/content and React row memoization/latest callbacks:', result);
  const viewingCss = fs.readFileSync(path.join(__dirname, '../src/styles.css'), 'utf8');
  const viewingResult = await window.webContents.executeJavaScript(`(() => {
    const { React, createRoot, flushSync, ViewingDistancePicker } = fixtureReact;
    const style = document.createElement('style'); style.textContent = ${JSON.stringify(viewingCss)}; document.head.append(style);
    const scope = document.createElement('section'); scope.setAttribute('data-testid', 'neo-lounge'); document.body.append(scope);
    const host = document.createElement('div'); host.className = 'lounge-settings-category'; scope.append(host);
    const root = createRoot(host);
    const ids = ['compact', 'near', 'comfortable', 'far', 'large'];
    const widths = [48, 57, 66, 81, 96], saved = [];
    let value = 'compact';
    const render = () => {
      scope.setAttribute('data-lounge-control-size', value);
      flushSync(() => root.render(React.createElement(React.Fragment, null,
        React.createElement(ViewingDistancePicker, { value, onChange: next => { value = next; saved.push(next); render(); } }),
        React.createElement('button', { className: 'lounge-top-icon', 'data-fixture-nav': true }, 'Nav')
      )));
    };
    const check = (condition, message) => { if (!condition) throw new Error(message); };
    render();
    for (let step = 1; step <= 5; step++) {
      const slider = host.querySelector('input[type="range"]');
      const label = host.querySelector('label');
      check(slider.value === String(step) && slider.min === '1' && slider.max === '5' && slider.step === '1', 'slider has five real discrete steps');
      check(label.htmlFor === slider.id && slider.getAttribute('aria-valuetext').includes('step ' + step + ' of 5'), 'distance and step accessible');
      check(Math.abs(host.querySelector('[data-fixture-nav]').getBoundingClientRect().width - widths[step - 1]) < 0.01, 'actual CSS size follows step');
      check(getComputedStyle(host.querySelector('fieldset')).borderTopWidth === '2px', 'slider keeps prominent border');
      if (step < 5) host.querySelector('[aria-label="Increase viewing distance"]').click();
    }
    check(host.querySelector('[aria-label="Increase viewing distance"]').disabled, 'maximum cannot overshoot');
    for (let step = 5; step > 1; step--) host.querySelector('[aria-label="Decrease viewing distance"]').click();
    check(value === 'compact' && host.querySelector('[aria-label="Decrease viewing distance"]').disabled, 'minimum and all reverse steps work');
    check(saved.slice(0, 4).join(',') === ids.slice(1).join(','), 'intermediate settings IDs are distinct');
    flushSync(() => root.unmount()); scope.remove(); style.remove();
    return { steps: 5, navigationWidths: widths, reversible: true, highlighted: true };
  })()`);
  console.log('PASS: real five-step viewing-distance control:', viewingResult);
  const popupResult = await window.webContents.executeJavaScript(`(() => {
    const style = document.createElement('style'); style.textContent = ${JSON.stringify(viewingCss)}; document.head.append(style);
    const scope = document.createElement('div');
    scope.style.cssText = 'position:relative;width:320px;height:600px;--surface:13 25 37;--border:70 90 110;';
    scope.innerHTML = '<div data-testid="sidebar-sort-options" class="library-toolbar-popover" style="width:208px;left:0;top:0;max-height:70vh;overflow-y:auto"><section><div><button id="fixture-picker" style="display:block;height:28px">All launchers</button><div data-testid="launcher-dropdown-menu" class="library-toolbar-popover library-toolbar-popover--embedded">' + Array.from({length:6}, (_, i) => '<button style="display:block;height:28px">Launcher ' + i + '</button>').join('') + '</div></div></section><button id="fixture-sort-row" style="display:block;height:28px">Custom order</button></div>';
    document.body.append(scope);
    const list = scope.querySelector('[data-testid="launcher-dropdown-menu"]');
    const sort = scope.querySelector('[data-testid="sidebar-sort-options"]');
    for (const surface of [sort, list]) {
      const computed = getComputedStyle(surface);
      if (computed.backgroundColor !== 'rgb(13, 25, 37)' || computed.opacity !== '1' || computed.backdropFilter !== 'none') throw new Error('Sort/launcher surface must be opaque, not blurred glass');
    }
    if (getComputedStyle(list).position !== 'relative' || getComputedStyle(list).zIndex !== 'auto') throw new Error('shared popup rule overrides embedded flow');
    if (list.getBoundingClientRect().top < scope.querySelector('#fixture-picker').getBoundingClientRect().bottom - 0.1) throw new Error('choices overlap their trigger');
    if (scope.querySelector('#fixture-sort-row').getBoundingClientRect().top < list.getBoundingClientRect().bottom - 0.1) throw new Error('choices overlap the following sort row');
    scope.remove(); style.remove();
    return { opaque: true, embeddedInFlow: true, overlappingSortRows: false };
  })()`);
  console.log('PASS: real Chromium launcher/Sort surface and cascade:', popupResult);
  const { pathToFileURL } = require('node:url');
  const { CURSOR_OPTIONS } = await import(pathToFileURL(path.join(__dirname, '../src/lib/cursor-presets.mjs')).href);
  const cursorData = CURSOR_OPTIONS.filter(option => option.preview).map(option => ({ id: option.id, label: option.label, filename: new URL(option.preview).pathname.split('/').pop(), url: 'data:image/svg+xml;base64,' + fs.readFileSync(new URL(option.preview)).toString('base64') }));
  const cursorCss = viewingCss.replace(/url\('\.\/assets\/cursors\/([^']+)'\)/g, (match, filename) => {
    const image = cursorData.find(option => option.filename === filename);
    return image ? 'url("' + image.url + '")' : match;
  });
  const cursorResult = await window.webContents.executeJavaScript(`(async () => {
    const cursors = ${JSON.stringify(cursorData)};
    const style = document.createElement('style'); style.textContent = ${JSON.stringify(cursorCss)}; document.head.append(style);
    const probe = document.createElement('div');
    probe.innerHTML = '<button>Action</button><input type="text"><input type="checkbox"><button disabled>Disabled</button><span class="cursor-col-resize">Resize</span><span class="cursor-grab">Drag</span>';
    document.body.append(probe);
    let crispRetro = false;
    for (const cursor of cursors) {
      document.documentElement.setAttribute('data-neolib-cursor', cursor.id);
      const computed = getComputedStyle(probe.querySelector('button')).cursor;
      if (!computed.includes(cursor.url) || !computed.includes('4 3')) throw new Error(cursor.id + ': native CSS cursor/hotspot rejected');
      if (getComputedStyle(probe.querySelector('input[type="text"]')).cursor !== 'text') throw new Error('text input lost I-beam');
      if (getComputedStyle(probe.querySelector('input[type="checkbox"]')).cursor === 'text') throw new Error('checkbox incorrectly gets I-beam');
      if (getComputedStyle(probe.querySelector('button:disabled')).cursor !== 'not-allowed') throw new Error('disabled cursor lost');
      if (getComputedStyle(probe.querySelector('.cursor-col-resize')).cursor !== 'col-resize' || getComputedStyle(probe.querySelector('.cursor-grab')).cursor !== 'grab') throw new Error('resize/drag semantics lost');
      const image = new Image(); image.src = cursor.url; await image.decode();
      if (image.naturalWidth !== 32 || image.naturalHeight !== 32) throw new Error(cursor.id + ': bad native dimensions');
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 32;
      const context = canvas.getContext('2d'); context.drawImage(image, 0, 0);
      if (context.getImageData(4, 3, 1, 1).data[3] < 64) throw new Error(cursor.id + ': click point is transparent');
      // One connected silhouette, not an arrow plus a detached decoration.
      const alpha = context.getImageData(0, 0, 32, 32).data;
      const unvisited = new Set(Array.from({length:1024}, (_, index) => index).filter(index => alpha[index * 4 + 3] > 0));
      let components = 0;
      while (unvisited.size) {
        components++;
        const seed = unvisited.values().next().value, pending = [seed]; unvisited.delete(seed);
        while (pending.length) {
          const pixel = pending.pop(), x = pixel % 32, y = Math.floor(pixel / 32);
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx, ny = y + dy, neighbour = ny * 32 + nx;
            if (nx >= 0 && nx < 32 && ny >= 0 && ny < 32 && unvisited.delete(neighbour)) pending.push(neighbour);
          }
        }
      }
      if (components !== 1) throw new Error(cursor.id + ': detached decoration outside cursor silhouette');
      if (cursor.id === 'pixel') {
        const pixels = context.getImageData(0, 0, 32, 32).data;
        crispRetro = Array.from({length:1024}, (_, index) => pixels[index * 4 + 3]).every(alpha => alpha === 0 || alpha === 255);
        if (!crispRetro) throw new Error('Retro has blurred alpha edges');
      }
    }
    document.documentElement.removeAttribute('data-neolib-cursor'); probe.remove();
    document.body.style.cssText = 'margin:0;padding:20px;background:#161a24;color:#edf3ff;font:14px system-ui;';
    document.body.innerHTML = '<h2 style="margin:0 0 16px;font-size:18px">NEO-LIB cursors · native 32px + enlarged detail</h2><div style="display:grid;grid-template-columns:repeat(6,1fr);gap:12px">' + cursors.map(cursor => '<section><h3 style="margin:0 0 10px;font-size:14px">' + cursor.label + '</h3><div style="height:110px;display:flex;align-items:center;gap:4px;background:#edf0f4;border-radius:8px;padding:6px"><img width="32" height="32" src="' + cursor.url + '"><img width="96" height="96" src="' + cursor.url + '"></div><div style="height:110px;display:flex;align-items:center;gap:4px;background:#292e3d;border-radius:8px;padding:6px;margin-top:8px"><img width="32" height="32" src="' + cursor.url + '"><img width="96" height="96" src="' + cursor.url + '"></div></section>').join('') + '</div>';
    await Promise.all([...document.images].map(image => image.decode()));
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return { nativeStyles: cursors.length, hotspotAligned: true, connectedSilhouettes: true, crispRetro, preservedControlCursors: true };
  })()`);
  const cursorPreview = fixtureProfile + '.cursors.png';
  const cursorCapture = await window.webContents.capturePage({ x: 0, y: 0, width: 1000, height: 350 });
  if (!cursorCapture.toBitmap().some((channel, index) => index % 4 !== 3 && channel < 200)) throw new Error('cursor preview capture is blank');
  fs.writeFileSync(cursorPreview, cursorCapture.toPNG());
  console.log('PASS: real Chromium cursor decode/hotspots/control semantics:', cursorResult, 'Preview:', cursorPreview);
  const assert = require('node:assert/strict');
  const postcss = createRequire(require.resolve('vite'))('postcss');
  const rules = postcss.parse(fs.readFileSync(path.join(__dirname, '../src/styles.css'), 'utf8'));
  const selectors = ['.synth-grid', '.synth-grid::before', '.vapor-floor', '.vapor-floor::before, .vapor-floor::after', '.vapor-floor::before', '.vapor-floor::after'];
  const optimized = rules.nodes.filter(node => selectors.includes(node.selector) || (node.type === 'atrule' && node.name === 'keyframes' && ['gridPan', 'vaporFloorPan', 'vaporFloorPanX'].includes(node.params))).join('\n');
  // Original pre-optimization declarations, kept as an independent visual oracle.
  const original = `
    .synth-grid {position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(rgb(var(--accent)/0.10) 1px,transparent 1px),linear-gradient(90deg,rgb(var(--accent-2)/0.08) 1px,transparent 1px);background-size:56px 56px;mask-image:radial-gradient(ellipse 60% 50% at 50% 35%,black 0%,transparent 80%);animation:gridPan 24s linear infinite;}
    @keyframes gridPan {from{background-position:0 0,0 0;}to{background-position:56px 56px,56px 56px;}}
    .vapor-floor {position:absolute;left:-10%;right:-10%;bottom:-10%;height:65%;pointer-events:none;background-image:linear-gradient(rgba(138,79,255,0.55) 1px,transparent 1px),linear-gradient(90deg,rgba(22,176,176,0.45) 1px,transparent 1px);background-size:70px 70px;transform:perspective(700px) rotateX(62deg);transform-origin:center top;mask-image:linear-gradient(to bottom,transparent 0%,black 18%,black 70%,transparent 100%);-webkit-mask-image:linear-gradient(to bottom,transparent 0%,black 18%,black 70%,transparent 100%);animation:vaporFloorPan 14s linear infinite;opacity:0.55;}
    @keyframes vaporFloorPan {from{background-position:0 0,0 0;}to{background-position:0 70px,70px 0;}}
  `;
  let maxMeanDifference = 0, maxChangedFraction = 0;
  for (const [width, height] of [[1280, 720], [3440, 1440]]) {
    window.setContentSize(width, height);
    for (const scene of ['synth-grid', 'vapor-floor']) for (const phase of [0, 0.25, 0.61]) {
      const capture = async stylesheet => {
        await window.webContents.executeJavaScript(`(async () => {
          document.head.innerHTML = '';
          const style = document.createElement('style');
          style.textContent = ${JSON.stringify(stylesheet)};
          document.head.append(style);
          document.body.style.cssText = 'margin:0;background:rgb(10,15,25);--accent:180 90 255;--accent-2:40 200 210;';
          document.body.innerHTML = '<div style="position:fixed;inset:0;overflow:hidden"><div class="${scene}"></div></div>';
          document.body.offsetWidth;
          for (const animation of document.getAnimations()) { animation.pause(); animation.currentTime = ${phase} * animation.effect.getTiming().duration; }
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        })()`);
        return (await window.webContents.capturePage()).toBitmap();
      };
      const before = await capture(original), after = await capture(optimized);
      assert.equal(before.length, after.length);
      let difference = 0, changed = 0;
      for (let index = 0; index < before.length; index += 4) {
        let largest = 0;
        for (let channel = 0; channel < 3; channel++) { const delta = Math.abs(before[index + channel] - after[index + channel]); difference += delta; largest = Math.max(largest, delta); }
        if (largest > 12) changed++;
      }
      const pixels = before.length / 4, mean = difference / (pixels * 3), changedFraction = changed / pixels;
      maxMeanDifference = Math.max(maxMeanDifference, mean); maxChangedFraction = Math.max(maxChangedFraction, changedFraction);
      assert(mean < 0.4 && changedFraction < 0.01, `${scene} ${width}x${height} phase ${phase}: mean pixel difference ${mean}, changed fraction ${changedFraction}`);
    }
  }
  console.log('PASS: original/optimized grid capture comparison at 1280x720 and 3440x1440, three animation phases:', { maxMeanDifference, maxChangedFraction });
  window.destroy();
  app.quit();
}).catch(error => { console.error(error); app.exit(1); });
app.on('will-quit', () => {
  // This exact path was created above solely for this hidden test process.
  if (path.dirname(fixtureProfile) === os.tmpdir() && path.basename(fixtureProfile).startsWith('neolib-visual-perf-')) {
    try { fs.rmSync(fixtureProfile, { recursive: true, force: true }); } catch { /* Electron may retain a log handle until process exit. */ }
  }
});
