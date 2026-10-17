// Own hidden Electron process and temporary profile; never touches the user's app.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
if (!process.versions.electron) {
  const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE;
  const result = require('node:child_process').spawnSync(require('electron'), [__filename], { env, stdio: 'inherit', windowsHide: true, timeout: 60000 });
  if (result.error) console.error(result.error.message);
  process.exit(result.status ?? 1);
}
const { app, BrowserWindow } = require('electron');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'neolib-sidebar-tweaks-'));
app.setPath('userData', profile);
app.whenReady().then(async () => {
  const esbuild = require('node:module').createRequire(require.resolve('vite'))('esbuild');
  const bundle = await esbuild.build({ stdin: { resolveDir: path.resolve(__dirname, '..'), loader: 'jsx', contents: `
    import React from 'react'; import { createRoot } from 'react-dom/client'; import { flushSync } from 'react-dom';
    import SidebarTweaks, { SidebarButtonOrder, useSidebarHoverLabel } from './src/components/library/SidebarTweaks.jsx';
    import { normalizeSidebarTweaks, sidebarIsExpanded, sidebarButtonGeometry } from './src/components/library/sidebar-tweaks-model.mjs';
    globalThis.fixture = { React, createRoot, flushSync, SidebarTweaks, SidebarButtonOrder, useSidebarHoverLabel, normalizeSidebarTweaks, sidebarIsExpanded, sidebarButtonGeometry };
  ` }, bundle: true, write: false, format: 'iife', define: { 'process.env.NODE_ENV': '"development"' } });
  const window = new BrowserWindow({ show: false, width: 1000, height: 800, webPreferences: { contextIsolation: true, sandbox: true, backgroundThrottling: false } });
  await window.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent('<!doctype html><body style="margin:0;--surface:25 40 60;--border:80 90 110;--accent:100 180 240"></body>'));
  await window.webContents.executeJavaScript(bundle.outputFiles[0].text);
  const css = fs.readFileSync(path.join(__dirname, '../src/styles.css'), 'utf8');
  const result = await window.webContents.executeJavaScript(`(async () => {
    const check = (value, message) => { if (!value) throw new Error(message); };
    const { React, createRoot, flushSync, SidebarTweaks, SidebarButtonOrder, useSidebarHoverLabel, normalizeSidebarTweaks, sidebarIsExpanded, sidebarButtonGeometry } = fixture;
    const h = React.createElement, host = document.createElement('div'); document.body.append(host);
    const style = document.createElement('style'); style.textContent = ${JSON.stringify(css)}; document.head.append(style);
    const root = createRoot(host); let saved = normalizeSidebarTweaks(), open = true;
    function Action({ testid, label }) { return h('button', { 'data-testid': testid, 'aria-label': label, className: 'neo-rail-button', style: { display: 'block', width: '100%' } }, h('span', { className: 'neo-rail-button__icon' }, h('svg', { width: 21, height: 21 }))); }
    function Surface() {
      const geometry = sidebarButtonGeometry(saved);
      const labels = useSidebarHoverLabel(saved.mode === 'icons' && !open);
      return h(React.Fragment, null, h('div', { 'data-testid': 'side-navigation-slot', 'data-sidebar-preview': open || undefined, style: { position: 'relative', width: geometry.compact, '--sidebar-expanded-width': geometry.expanded + 'px' } }, h('nav', { 'data-testid': 'side-navigation-rail', onMouseOver: labels.show, onMouseLeave: labels.clear, onFocusCapture: labels.show, style: { width: sidebarIsExpanded(saved, false, open) ? geometry.expanded : geometry.compact, '--sidebar-button-scale': geometry.scale, '--sidebar-icon-size': saved.iconSize * geometry.scale + 'px', '--sidebar-spacing': saved.spacing + 'px', '--sidebar-saturation': saved.saturation / 100 } },
        h(SidebarButtonOrder, { order: saved.order }, h(Action, { testid: 'tab-home', label: 'Home' }), h(React.Fragment, null, h('h2', { 'data-testid': 'side-navigation-test' }, 'Category'), h(Action, { testid: 'tab-library', label: 'Library' }))))), labels.tooltip,
        h(SidebarTweaks, { open, value: saved, onChange: value => { saved = value; render(); }, onClose: () => { open = false; render(); } }));
    }
    function render() { flushSync(() => root.render(h(Surface))); }
    render();
    const click = text => { const button = [...document.querySelectorAll('button')].find(button => button.textContent === text); check(button, 'Missing ' + text); flushSync(() => button.click()); };
    click('Icons only'); check(saved.mode === 'icons', 'mode saves immediately');
    // Call the actual controlled input handler, then validate the resulting CSS in Chromium.
    for (const [label, value] of [['Spacing', 12], ['Icon size', 30], ['Color saturation', 0]]) {
      const input = document.querySelector('input[aria-label="' + label + '"]');
      const key = Object.keys(input).find(key => key.startsWith('__reactProps$'));
      flushSync(() => input[key].onChange({ target: { value: String(value) } }));
    }
    const nav = host.querySelector('nav'), button = nav.querySelector('button');
    check(nav.getBoundingClientRect().width === 148, 'editor keeps icons-only rail expanded');
    const modal = document.querySelector('[data-testid="sidebar-tweaks-modal"]');
    check(getComputedStyle(modal).backdropFilter === 'none' && getComputedStyle(modal).backgroundImage.includes('rgba(0, 0, 0, 0) 156px'), 'backdrop leaves rail clear, with no blur');
    check(getComputedStyle(modal).paddingLeft === '164px', 'panel reserves room beside the rail');
    const slot = host.querySelector('[data-testid="side-navigation-slot"]');
    check(getComputedStyle(slot, '::after').borderTopWidth === '2px' && getComputedStyle(slot, '::after').borderTopColor === 'rgb(100, 180, 240)', 'visible highlight retains accent even at zero saturation');
    const setButtonSize = value => {
      const input = document.querySelector('input[aria-label="Button size"]');
      const key = Object.keys(input).find(key => key.startsWith('__reactProps$'));
      flushSync(() => input[key].onChange({ target: { value: String(value) } }));
    };
    const originalWidth = button.getBoundingClientRect().width;
    setButtonSize(150);
    check(button.getBoundingClientRect().height === 60 && button.getBoundingClientRect().width > originalWidth, 'whole button box grows, not just icon');
    check(nav.getBoundingClientRect().width === 222 && slot.getBoundingClientRect().width === 72, 'expanded and reserved compact widths grow together');
    check(getComputedStyle(modal).paddingLeft === '238px' && getComputedStyle(slot, '::after').width === '222px', 'editor and highlight track larger button bounds');
    check(saved.iconSize === 30 && getComputedStyle(button.querySelector('svg')).width === '45px', 'independent icon setting remains intact while whole object scales');
    setButtonSize(75);
    check(button.getBoundingClientRect().height === 30 && nav.getBoundingClientRect().width === 111, 'whole button shrinks to 75% using real layout dimensions');
    setButtonSize(100);
    check(getComputedStyle(button).marginBottom === '12px', 'real spacing changes');
    check(getComputedStyle(button.querySelector('svg')).width === '30px', 'real SVG size changes');
    check(getComputedStyle(nav).filter === 'saturate(0)', 'whole sidebar is grayscale at zero');
    click('Reorder buttons');
    const move = document.querySelector('[aria-label="Move Library up"]'); flushSync(() => move.click());
    check(saved.order.indexOf('tab-library') < saved.order.indexOf('tab-home'), 'reorder control saves correct order');
    check(nav.querySelector('button').getAttribute('aria-label') === 'Library', 'DOM order matches saved custom order');
    check(!nav.querySelector('h2'), 'old category headers do not contradict custom order');
    // Close the real modal, then hover/focus a compact icon with no timeout.
    flushSync(() => document.querySelector('[data-testid="modal-close-btn"]').click());
    await new Promise(resolve => setTimeout(resolve, 180)); // Let the existing modal exit animation finish.
    check(nav.getBoundingClientRect().width === 48 && !slot.hasAttribute('data-sidebar-preview'), 'closing restores icons-only width and removes highlight');
    const target = nav.querySelector('button'); flushSync(() => target.dispatchEvent(new MouseEvent('mouseover', { bubbles: true })));
    await new Promise(resolve => requestAnimationFrame(resolve));
    check(document.querySelector('[data-testid="sidebar-instant-label"]')?.textContent === 'Library', 'hover label is immediate: ' + JSON.stringify({ mode: saved.mode, target: target.outerHTML, label: document.querySelector('[data-testid="sidebar-instant-label"]')?.outerHTML }));
    check(!nav.contains(document.querySelector('[data-testid="sidebar-instant-label"]')), 'label is outside clipped rail');
    flushSync(() => target.focus()); check(document.querySelector('[data-testid="sidebar-instant-label"]')?.textContent === 'Library', 'keyboard focus identifies button');
    check(JSON.parse(JSON.stringify(saved)).saturation === 0, 'grayscale value survives serialization');
    flushSync(() => root.unmount()); host.remove(); style.remove();
    return { spacing: 12, iconSize: 30, saturation: 0, reordersDOM: true, immediateHoverAndFocusLabels: true };
  })()`);
  console.log('PASS: real Sidebar tweaks controls, CSS, ordering and unclipped instant labels:', result);
  window.destroy(); app.quit();
}).catch(error => { console.error(error); app.exit(1); });
app.on('will-quit', () => {
  if (path.dirname(profile) === os.tmpdir() && path.basename(profile).startsWith('neolib-sidebar-tweaks-')) {
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch { /* Electron may briefly retain a log handle. */ }
  }
});
