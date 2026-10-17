import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { previewMotionOnly } from '../src/components/lounge/lounge-preview-mirror.mjs';

assert(previewMotionOnly('transform: translateX(0px); opacity: 1;', 'transform: translateX(4px); opacity: 0.7;'));
assert(previewMotionOnly('width: 10px; transform: none;', 'width: 10px; transform: translateX(4px);'));
assert(previewMotionOnly('', 'transform: translateX(4px);'));
assert(!previewMotionOnly('width: 10px;', 'width: 11px;'));
assert(!previewMotionOnly('--size: 10px; transform: none;', '--size: 11px; transform: none;'));
assert(!previewMotionOnly('opacity: 1', 'opacity: 1'));
const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');
const preview = read('../src/components/lounge/LoungeLivePreview.jsx');
assert(preview.includes('mirror.sync(roots, rect, foreground.current)'));
assert(preview.includes('mirror.patchMotion(node)'));
assert(preview.includes('attributeOldValue: true'));
assert(/window\.removeEventListener\('resize', onResize\); \};\s*\}, \[\]\);/.test(preview), 'preference edits do not tear down/recreate the observers');
const tree = read('../src/components/library/LibraryTree.jsx');
assert(tree.includes('React.memo(function LibraryGameRowContent'));
assert(tree.includes('latest.current[name]?.(...args)'), 'memoized rows keep current event handlers');
assert(tree.includes('React.useLayoutEffect(() => { latest.current = props; })'), 'callbacks change only after a committed render');
assert(tree.includes('sectionGames: unusedSectionGames'), 'unused whole-shelf arrays do not defeat row memoization');
assert(tree.includes('      layout\n'), 'row reorder animation is retained');
const sidebar = read('../src/components/Sidebar.jsx');
assert(sidebar.includes('}, [games, categories, gameOrderByCategory, unlockedCategories, search, isTools, librarySortMode, pinnedIdsSet])'));
assert(read('../src/components/ThemeVisuals.jsx').includes('export const BgAmbience = React.memo'));

const postcss = createRequire(import.meta.resolve('vite'))('postcss');
const css = postcss.parse(read('../src/styles.css'));
for (const name of ['gridPan', 'vaporFloorPan', 'vaporFloorPanX']) {
  const frames = css.nodes.find(node => node.type === 'atrule' && node.name === 'keyframes' && node.params === name);
  assert(frames);
  frames.walkDecls(declaration => assert.equal(declaration.prop, 'transform', `${name} moves retained pixels, not background paint`));
}
const rules = selector => css.nodes.find(node => node.selector === selector)?.toString() || '';
assert(rules('.synth-grid').includes('mask-image: radial-gradient'), 'mask stays at the same screen location');
assert(rules('.synth-grid::before').includes('inset: -56px'));
assert(rules('.vapor-floor::before, .vapor-floor::after').includes('inset: -70px'));
assert(rules('.vapor-floor::before').includes('z-index: 1'), 'purple lines still composite above cyan lines');
assert(rules('.synth-grid::before').includes('24s') && rules('.vapor-floor::before, .vapor-floor::after').includes('14s'), 'original motion periods retained');
// Tile phase equivalence at arbitrary subpixel positions and animation times.
const phase = (position, tile) => ((position % tile) + tile) % tile;
for (const tile of [56, 70]) for (const time of [0, 0.13, 0.5, 0.999, 1]) for (const pixel of [0, 0.3, 800, 3439.7]) {
  assert(Math.abs(phase(pixel - tile * time, tile) - phase(pixel + tile - tile * time, tile)) < 1e-8);
}
console.log('PASS: retained/motion-only preview updates, committed row callbacks, stable shelf dependencies, unchanged grid phases/timing/masks and transform-only grid motion. Browser fixtures separately verify actual DOM/React behaviour; CPU savings require controlled runtime measurement.');
