// Render the actual navigation components without Electron or esbuild.
// Useful for checking artwork in a browser without touching the real library.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { pathToFileURL, fileURLToPath } = require('node:url');
const { createRequire } = require('node:module');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const babel = createRequire(require.resolve('@vitejs/plugin-react'))('@babel/core');
const root = path.resolve(__dirname, '..');

// Small JSX transform for these preview components, using the project's Babel
// parser. This avoids spawning esbuild in restricted environments.
const jsx = ({ types: t }) => ({
  visitor: {
    JSXElement: {
      exit(p) {
        const n = p.node;
        const name = (v) => v.type === 'JSXIdentifier'
          ? (/^[a-z]/.test(v.name) ? t.stringLiteral(v.name) : t.identifier(v.name))
          : t.memberExpression(t.identifier(v.object.name), t.identifier(v.property.name));
        const props = n.openingElement.attributes.map(a => {
          if (a.type === 'JSXSpreadAttribute') return t.spreadElement(a.argument);
          const v = !a.value ? t.booleanLiteral(true) : a.value.type === 'JSXExpressionContainer' ? a.value.expression : a.value;
          return t.objectProperty(t.stringLiteral(a.name.name), v);
        });
        const children = n.children.flatMap(c => {
          if (c.type === 'JSXText') {
            const text = c.value.replace(/\s+/g, ' ').trim();
            return text ? [t.stringLiteral(text)] : [];
          }
          if (c.type === 'JSXExpressionContainer') return c.expression.type === 'JSXEmptyExpression' ? [] : [c.expression];
          return [c];
        });
        p.replaceWith(t.callExpression(t.memberExpression(t.identifier('React'), t.identifier('createElement')),
          [name(n.openingElement.name), t.objectExpression(props), ...children]));
      },
    },
  },
});
const compile = code => babel.transformSync(code, {
  configFile: false, babelrc: false, parserOpts: { plugins: ['jsx'] }, plugins: [jsx],
}).code;

async function main() {
  const artSource = fs.readFileSync(path.join(root, 'src/components/NavButtonArtwork.jsx'), 'utf8')
    .replace("import React from 'react';", '')
    .replace('export default function', 'function')
    .replaceAll('import.meta.env.BASE_URL', "'./'");
  const publicBase = pathToFileURL(path.join(root, 'public', 'index.html')).href;
  const Artwork = new Function('React', 'document', compile(artSource) + ';return NavButtonArtwork;')(React, { baseURI: publicBase });
  const sidebar = fs.readFileSync(path.join(root, 'src/components/Sidebar.jsx'), 'utf8');
  const tabSource = sidebar.slice(sidebar.indexOf('function TabPill('), sidebar.indexOf('function LauncherPill('));
  const motion = { span: ({ layoutId, animate, transition, ...props }) => React.createElement('span', props) };
  const Tab = new Function('React', 'NavButtonArtwork', 'cn', 'motion',
    compile(tabSource) + ';return TabPill;')(React, Artwork, (...c) => c.filter(Boolean).join(' '), motion);
  const lucide = require('lucide-react');
  const icons = [lucide.Home, lucide.Library, lucide.Columns, lucide.Boxes];
  const themes = [['anime', 'Anime'], ['pro', 'Industrial'], ['colorful', 'Magical']];
  let rows = '';
  for (const [theme, label] of themes) {
    for (const opacity of [0.46, 1, 0]) {
      const buttons = ['Home', 'Library', 'Wall', 'Tools'].map((label, i) => React.createElement(Tab, {
        key: label, label, icon: React.createElement(icons[i], { size: 15 }),
        active: i === 0, testid: 'tab-' + label.toLowerCase(),
        decorationTheme: theme, decorationOpacity: opacity,
      }));
      const html = renderToStaticMarkup(React.createElement('div', {
        'data-theme': theme, 'data-special-theme': theme,
        className: 'neolib-app-shell neolib-ui-foreground',
      }, React.createElement('div', { className: 'library-font-scope' },
        React.createElement('div', { 'data-testid': 'top-toolbar',
          className: 'neolib-special-nav-art flex items-stretch' }, buttons))));
      const images = [...html.matchAll(/<img[^>]+src="([^"]+)"/g)];
      assert.equal(images.length, opacity ? (theme === 'pro' ? 4 : theme === 'colorful' ? 24 : 16) : 0, theme + ' visibility');
      assert.equal((html.match(/data-nav-flourish="true"/g) || []).length, opacity && theme !== 'pro' ? (theme === 'colorful' ? 16 : 8) : 0, theme + ' corner flourishes');
      if (theme === 'pro') assert(!html.includes('industrial-control-machinery'), 'no cropped Industrial slabs');
      if (theme === 'pro' && opacity) {
        assert(html.includes('width:100%;height:100%'), 'frame follows button size');
        assert(html.includes('object-fit:fill'), 'horizontal compression, not cropped cover art');
      }
      if (theme === 'colorful' && opacity) {
        assert(html.includes('right:-3px;top:-3px'), 'Magical artwork starts at upper-right');
        assert.equal((html.match(/data-magic-corner=/g) || []).length, 16, 'four magic corners per button');
        assert(html.includes('magical-button-frame-v2.png'), 'existing border lines retained');
        assert(!html.includes('magical-control-runes-v1.png'), 'old chunky corners removed');
      }
      for (const image of images) assert(fs.existsSync(fileURLToPath(image[1])), image[1]);
      assert(!html.includes('neolib-nav-ornament'), 'obsolete mask path');
      rows += '<section style="resize:horizontal;overflow:auto;min-width:360px;padding:8px"><h2>' + label + ' · ' + Math.round(opacity * 100) + '%</h2><p style="font-size:12px">Drag the lower-right corner to test narrower buttons.</p>' + html + '</section>';
    }
  }
  const ordinary = renderToStaticMarkup(React.createElement(Artwork, { theme: 'synthwave', opacity: 1 }));
  assert.equal(ordinary, '', 'ordinary themes have no special trim');
  const css = await require('postcss')([require('tailwindcss')({
    content: [path.join(root, 'src/components/Sidebar.jsx')],
  })]).process(fs.readFileSync(path.join(root, 'src/styles.css'), 'utf8'), { from: path.join(root, 'src/styles.css') });
  const out = path.join(root, 'tmp', 'navigation-preview.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, '<!doctype html><html><head><meta charset="utf-8"><title>Actual NEO-LIB navigation preview</title><style>' +
    css.css + '\nbody{background:#171923;color:#eee;font:14px Arial;padding:24px}section{margin:20px 0;width:580px;max-width:100%}h2{margin-bottom:8px}.neolib-app-shell{background:rgb(var(--surface));border-radius:12px}button{cursor:pointer}</style></head><body><h1>Actual NEO-LIB buttons · Special themes</h1><p>Rendered from TabPill and NavButtonArtwork with the application stylesheet. Rows compare default, full and zero decoration.</p>' + rows + '</body></html>');
  console.log('PASS: all three themes, four buttons each, default/full/zero opacity, real file URLs, ordinary theme exclusion, production CSS compilation.');
  console.log(out);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
