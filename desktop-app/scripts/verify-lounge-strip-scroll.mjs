import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { scrollLoungeStripToControl } from '../src/components/lounge/lounge-strip-scroll.mjs';
import { centeredCarouselTarget, glideCarouselPosition } from '../src/components/lounge/lounge-carousel-centering.mjs';

function fixture({ current = 0, stripWidth = 300, contentWidth = 1200, controlLeft = 500, controlWidth = 80 } = {}) {
  const calls = [];
  const strip = {
    scrollLeft: current,
    clientWidth: stripWidth,
    scrollWidth: contentWidth,
    getBoundingClientRect: () => ({ left: 100, width: stripWidth }),
    scrollTo: options => calls.push(options),
  };
  const control = {
    closest: selector => selector.includes('lounge-console-strip') ? strip : null,
    getBoundingClientRect: () => ({ left: controlLeft, width: controlWidth }),
  };
  return { strip, control, calls };
}

const centered = fixture();
assert.equal(scrollLoungeStripToControl(centered.control, 'center'), true);
assert.deepEqual(centered.calls, [{ left: 290, behavior: 'smooth' }]);

const left = fixture({ current: 400, controlLeft: 103 });
scrollLoungeStripToControl(left.control);
assert.equal(left.calls[0].left, 395);

const right = fixture({ current: 100, controlLeft: 370 });
scrollLoungeStripToControl(right.control);
assert.equal(right.calls[0].left, 158);

const alreadyVisible = fixture({ current: 0, controlLeft: 200 });
scrollLoungeStripToControl(alreadyVisible.control);
assert.equal(alreadyVisible.calls.length, 0);
assert.equal(scrollLoungeStripToControl(null), false);

assert.equal(centeredCarouselTarget(0, 500, 100, 100, 800), 50, 'horizontal card centers inside the viewport');
assert.equal(centeredCarouselTarget(400, 100, 100, 100, 800), 50, 'scrolling the nested track keeps the same content target');
assert.equal(centeredCarouselTarget(0, 120, 100, 100, 800), 0, 'the first card never scrolls before the leading edge');
assert.equal(centeredCarouselTarget(160, 330, 100, 120, 360), 270, 'the same geometry centers vertical cards');
const oneFrame = glideCarouselPosition(0, 500, 16);
const twoFrames = glideCarouselPosition(oneFrame, 500, 16);
assert.ok(Math.abs(twoFrames - glideCarouselPosition(0, 500, 32)) < 0.001, 'glide pace is independent of display refresh rate');
assert.ok(glideCarouselPosition(0, 500, 1000) < 500, 'a delayed frame cannot teleport a long carousel jump');
assert.equal(glideCarouselPosition(500, 500, 16), 500, 'a centered card remains still');

const lounge = readFileSync(new URL('../src/components/lounge/NeoLounge.jsx', import.meta.url), 'utf8');
const bridge = readFileSync(new URL('../src/components/controller/ControllerNavigationBridge.jsx', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
assert.match(lounge, /className="lounge-browser-shelf relative z-10 flex min-h-0 shrink-0 overflow-auto"/, 'the carousel retains native scrolling after its visual scrollbar is hidden');
assert.match(styles, /\.lounge-browser\[data-shelf-position='bottom'\] \.lounge-browser-shelf \{ scrollbar-width: none; -ms-overflow-style: none; \}/, 'the horizontal carousel scrollbar does not reserve a visible gutter');
assert.match(styles, /\.lounge-browser\[data-shelf-position='bottom'\] \.lounge-browser-shelf::\-webkit-scrollbar[^\n]*display: none; width: 0; height: 0/, 'the horizontal carousel scrollbar track is fully hidden in Chromium');
assert.match(lounge, /visibleLoungeConsoles\(activeConsole\.id\)/, 'the compact console picker centers the selected system without scrolling the window');
assert.doesNotMatch(lounge, /querySelector\('\[data-lounge-console\][^\n]+scrollIntoView/);
assert.match(lounge, /next\.focus\(\{ preventScroll: true \}\)/);
assert.match(bridge, /!scrollLoungeStripToControl\(element\)/);
console.log('PASS: Lounge tab strips stay local, and nested carousel cards center in their scroll viewport.');
