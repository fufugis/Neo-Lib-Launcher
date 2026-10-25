import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { PREVIEW_SECTIONS, normalizePreviewLayout, previewLayoutDraft, savePreviewLayout, previewCanvasBox, fitPreviewSurface, previewContentMeasurement, previewContentSize, updatePreviewSection } from '../src/components/preview/preview-layout-model.mjs';
import { adjustEditorBox } from '../src/components/home/home-layout-editor-model.mjs';
import { hydrateSettings } from '../src/state/settings-state.mjs';

assert.equal(normalizePreviewLayout(null), null);
assert.equal(normalizePreviewLayout({ version: 2, positions: {} }), null);
const legacyPositions=Object.fromEntries(PREVIEW_SECTIONS.filter(section=>section.id!=='history').map((section,index)=>[section.id,{x:0,y:index*200,width:1,height:180}]));
const migrated=normalizePreviewLayout({version:1,positions:legacyPositions});
for(const id of Object.keys(legacyPositions))assert.deepEqual(migrated.positions[id],legacyPositions[id],'adding history never resets existing preview rectangles');
assert(migrated.positions.history.y>Math.max(...Object.values(legacyPositions).map(box=>box.y+box.height)));
assert.equal(migrated.order.at(-1),'history');
assert.deepEqual(normalizePreviewLayout(JSON.parse(JSON.stringify(migrated))),migrated);
assert.equal(savePreviewLayout({}), null);
const captured = Object.fromEntries(PREVIEW_SECTIONS.map((section, index) => [section.id, { x: index === 5 ? 650 : 0, y: index * 180, width: 500, height: 160 }]));
const original = JSON.parse(JSON.stringify(captured));
const draft = previewLayoutDraft(captured, 1200, 1700, null);
assert.deepEqual(captured, original, 'capturing the page must not mutate it');
const modified = { ...draft, positions: { ...draft.positions, description: adjustEditorBox(draft.positions.description, -180, 100, draft, false, true) } };
assert.equal(modified.positions.description.width, 320, 'description narrows independently');
assert.equal(draft.positions.description.width, 500, 'Cancel keeps the original draft geometry');
const saved = savePreviewLayout(modified);
assert.equal(saved.positions.description.width, 320 / 1200);
assert.deepEqual(normalizePreviewLayout(JSON.parse(JSON.stringify(saved))), saved);
assert.deepEqual(hydrateSettings({ previewLayout: saved }).previewLayout, saved, 'global layout survives settings hydration');
assert.equal(previewContentSize(NaN), 100);
assert.equal(previewContentSize(1), 70);
assert.equal(previewContentSize(999), 150);
const sizedDraft = updatePreviewSection(draft, 'description', 'contentSize', 125);
assert.equal(sizedDraft.contentSizes.description, 125);
assert.equal(draft.contentSizes.description, undefined, 'sliders do not mutate saved/draft input');
assert.deepEqual(sizedDraft.positions.description, draft.positions.description, 'content slider does not scale the whole page or box');
const sizedSaved = savePreviewLayout(sizedDraft);
assert.equal(hydrateSettings({ previewLayout: sizedSaved }).previewLayout.contentSizes.description, 125);
assert.equal(previewLayoutDraft({}, 1200, 900, sizedSaved).contentSizes.description, 125);
assert.equal(updatePreviewSection(draft, 'description', 'x', 99999).positions.description.x, draft.width - draft.positions.description.width);
assert.equal(updatePreviewSection(draft, 'description', 'y', -99).positions.description.y, 0);
assert.equal(updatePreviewSection(draft, 'unknown', 'x', 10), draft);
assert(!Object.hasOwn(normalizePreviewLayout({ ...sizedSaved, contentSizes: { unknown: 120, description: 900 } }).contentSizes, 'unknown'));
assert.equal(normalizePreviewLayout({ ...sizedSaved, contentSizes: { description: 900 } }).contentSizes.description, 150);
assert.deepEqual(previewLayoutDraft({}, 1200, 800, saved).positions.description, modified.positions.description);
for (const width of [1, 150, 320, 900, 3440]) for (const box of Object.values(saved.positions)) {
  const rect = previewCanvasBox(box, width);
  assert(rect.left >= 0 && rect.width > 0 && rect.left + rect.width <= width + 0.001, 'every section stays inside resized page width');
}
const unsafe = JSON.parse(JSON.stringify(saved));
unsafe.positions.hero = { x: 999, y: -999, width: 9, height: Infinity };
assert.equal(normalizePreviewLayout(unsafe), null);
unsafe.positions.hero.height = 100000;
const bounded = normalizePreviewLayout(unsafe);
assert.deepEqual(bounded.positions.hero, { x: 0, y: 0, width: 1, height: 10000 });
unsafe.order = ['unknown', 'source', 'source']; unsafe.positions.unknown = { x: 0, y: 0, width: 1, height: 100 };
assert(!normalizePreviewLayout(unsafe).order.includes('unknown'));
assert(!Object.hasOwn(normalizePreviewLayout(unsafe).positions, 'unknown'), 'only fixed preview sections are accepted, never imported widgets');
const sparse = { hero: { x: 0, y: 0, width: 1200, height: 250 }, notices: { x: 0, y: 250, width: 1200, height: 0 }, details: { x: 0, y: 250, width: 1200, height: 60 }, capabilities: { x: 0, y: 310, width: 1200, height: 0 }, description: { x: 0, y: 310, width: 600, height: 400 }, media: { x: 650, y: 310, width: 550, height: 350 }, source: { x: 0, y: 710, width: 600, height: 60 } };
const reserved = previewLayoutDraft(sparse, 1200, 800);
assert(reserved.positions.details.y >= reserved.positions.notices.y + 80);
assert(reserved.positions.description.y >= reserved.positions.capabilities.y + 80, 'absent rows need space for another game sharing this layout');
assert.equal(sparse.notices.height, 0);

const read = path => fs.readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8');
const page = read('components/preview/PreviewPageLayout.jsx'), detail = read('components/GameDetail.jsx');
for (const text of ['Restore default', 'onLayoutChange?.(null)', 'onCancel={() => setEditor(null)}', 'savePreviewLayout(draft)', 'data-preview-section', 'new ResizeObserver', 'y: rect.top - base.top', 'One layout for every game', 'fitToWindow', 'previewContentMeasurement(content', 'intrinsicWidths.current = {}']) assert(page.includes(text));
assert(!page.includes('previewSurfaceScale') && !page.includes('transform:') && !page.includes('/ scale'), 'live preview never scales its text or captures scaled geometry');
assert(!/window\.api|CommunityWidgetHost|HOME_WIDGET_BY_ID|onUpdateGame|game\.id/.test(page), 'layout owns geometry only, no native commands, metadata writes or widget runtime');
assert(detail.includes('savedLayout={settings.previewLayout}'));
assert(read('App.jsx').includes('onPreviewLayoutChange={previewLayout => updateSetting({ previewLayout })}'));
const css = read('styles.css');
assert(css.includes('@container preview-box (min-width: 520px)'));
assert(css.includes('.preview-custom-block { box-sizing: border-box; position: absolute; min-width: 0; min-height: 0; overflow: visible;'));
assert(css.includes('.preview-fit-viewport { position: relative; overflow-y: auto; overflow-x: hidden; min-width: 0; }'), 'whole-page vertical scrolling stays reachable without sideways scroll from hero effects');
assert(!page.includes('overflow-auto'), 'preview page and individual boxes are not scrollports');
const grown = fitPreviewSurface(saved, 1200, { description: 1700, hero: 800 }, { media: 800 });
assert(grown.boxes.description.height >= 1702 && grown.boxes.hero.height >= 802);
assert(grown.boxes.media.left + grown.boxes.media.width <= 1200, 'wide content cannot widen the whole page; it reflows within available width');
assert(grown.height >= grown.boxes.description.top + grown.boxes.description.height);
for (const a of Object.keys(grown.boxes)) for (const b of Object.keys(grown.boxes)) if (a !== b) {
  const one = grown.boxes[a], two = grown.boxes[b];
  const overlaps = one.left < two.left + two.width - .1 && two.left < one.left + one.width - .1 && one.top < two.top + two.height && two.top < one.top + one.height;
  assert(!overlaps, 'expanded content cannot cover another section');
}
for (const viewport of [{ width: 320, height: 240 }, { width: 3440, height: 1440 }, { width: 900, height: 500 }]) {
  const responsive = fitPreviewSurface(saved, viewport.width, { description: 1700 }, { media: 800 }, viewport.height);
  assert(responsive.width <= viewport.width);
  assert(responsive.boxes.description.height >= 1702, 'long content keeps normal size and extends the page rather than shrinking');
}
const desktopMain = fs.readFileSync(new URL('../electron/main.js', import.meta.url), 'utf8');
assert(desktopMain.includes('Math.round(defaultW * 0.70)') && desktopMain.includes('Math.round(defaultH * 0.70)'));
assert(desktopMain.includes('minWidth: minimumW') && desktopMain.includes('minHeight: minimumH'));
assert.equal(previewLayoutDraft({ description: { x: 10, y: 400, width: 500, height: 1702 } }, 1200, grown.height, saved).positions.description.height, saved.positions.description.height, 'reopening retains requested geometry, not a temporary content-expanded size');
for (const id of ['hero', 'notices', 'details']) {
  const smaller = updatePreviewSection(updatePreviewSection(draft, id, 'width', 300), id, 'height', 110);
  const restored = previewLayoutDraft({ [id]: { x: 0, y: 0, width: 1000, height: 600 } }, 1200, 900, savePreviewLayout(smaller));
  assert.equal(restored.positions[id].width, 300);
  assert.equal(restored.positions[id].height, 110);
  assert.equal(fitPreviewSurface(savePreviewLayout(smaller), 1200, {}, { [id]: 1000 }).boxes[id].width, 300, 'intrinsic width cannot undo a deliberate resize');
}
let floor = 0, stable = fitPreviewSurface(saved, 1200);
for (let frame = 0; frame < 1000; frame++) {
  const allocated = stable.boxes.description.width;
  const measured = previewContentMeasurement({ clientWidth: allocated, scrollWidth: allocated, offsetHeight: 300, scrollHeight: 300 }, floor);
  floor = measured.width;
  stable = fitPreviewSurface(saved, 1200, { description: measured.height }, { description: floor });
}
assert.equal(floor, 0, 'allocated width never becomes an intrinsic growth request');
assert.equal(stable.boxes.description.width, saved.positions.description.width * 1200, '1000 measurement cycles cannot inflate the preview and shrink its scale');
const overflow = previewContentMeasurement({ clientWidth: 320, scrollWidth: 800, offsetHeight: 400, scrollHeight: 400 });
assert.equal(overflow.width, 800);
assert.equal(previewContentMeasurement({ clientWidth: 800, scrollWidth: 800, offsetHeight: 400, scrollHeight: 400 }, overflow.width).width, 800, 'retain genuine overflow after growth to prevent alternating grow/shrink');
const require = createRequire(import.meta.url), babel = createRequire(require.resolve('@vitejs/plugin-react'))('@babel/core');
for (const source of [page, detail]) babel.parseSync(source, { configFile: false, babelrc: false, parserOpts: { plugins: ['jsx'] } });
const live = read('components/preview/PreviewLayoutLivePreview.jsx'), inspector = read('components/preview/PreviewLayoutInspector.jsx');
for (const source of [live, inspector]) babel.parseSync(source, { configFile: false, babelrc: false, parserOpts: { plugins: ['jsx'] } });
assert(page.includes('renderPreview=') && page.includes('renderInspector='));
assert(live.includes('fitPreviewSurface(layout, viewport.width') && live.includes('inert=""') && live.includes('current window'));
assert(!/window\.api|fetch\(/.test(live), 'preview itself never launches games, fetches or changes metadata');
for (const label of ['Section content size', 'Section ${axis.toUpperCase()} position', 'Selected section']) assert(inspector.includes(label));
console.log('PASS: fixed preview sections, draft isolation, narrower description, absent-row reservations, global persistence, resize bounds, safe reset and independent geometry-only host; live acceptance pending.');
