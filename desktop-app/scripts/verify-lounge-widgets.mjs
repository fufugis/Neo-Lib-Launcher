import assert from 'node:assert/strict';
import fs from 'node:fs';
import { normalizeLoungePreferences, DEFAULT_LOUNGE_PREFERENCES } from '../src/components/lounge/lounge-layout-model.mjs';
import { loungePanelPositions, loungePanelRects, loungeWidgetHeightBounds, loungeWidgetTopBoundary } from '../src/components/lounge/lounge-widget-layout.mjs';

assert.equal(DEFAULT_LOUNGE_PREFERENCES.widgetAreaEnabled, false);
assert.equal(DEFAULT_LOUNGE_PREFERENCES.widgetZoom, 100);
assert.equal(normalizeLoungePreferences({}).widgetZoom, 100, 'older preferences retain normal widget size');
assert.equal(normalizeLoungePreferences({ widgetZoom: -1 }).widgetZoom, 75);
assert.equal(normalizeLoungePreferences({ widgetZoom: 999 }).widgetZoom, 200);
assert.equal(normalizeLoungePreferences({ widgetZoom: NaN }).widgetZoom, 100);
for (const widgetZoom of [75, 100, 150, 200]) {
  const p = normalizeLoungePreferences({ widgetAreaEnabled: true, widgetZoom });
  assert.equal(normalizeLoungePreferences(JSON.parse(JSON.stringify(p))).widgetZoom, widgetZoom);
  assert.deepEqual(loungePanelRects(1920, 850, p), loungePanelRects(1920, 850, { ...p, widgetZoom: 100 }), 'zoom never moves or enlarges the outer box');
}
assert.deepEqual(loungePanelPositions('bottom'), ['left', 'center', 'right']);
assert.equal(loungePanelPositions('left').length, 6);
for (const shelfPosition of ['left', 'right', 'top', 'bottom']) {
  for (const previewPosition of loungePanelPositions(shelfPosition)) {
    for (const widgetPosition of loungePanelPositions(shelfPosition)) {
      const preferences = normalizeLoungePreferences({ shelfPosition, previewPosition, widgetPosition, preset: 'custom', widgetAreaEnabled: true, previewWidth: 100, widgetWidth: 100, previewBoxHeight: 8640, widgetHeight: 2160, previewVerticalOffset: -300, widgetVerticalOffset: 300 });
      assert.notEqual(preferences.previewPosition, preferences.widgetPosition);
      for (const [width, height] of [[320, 160], [1920, 700], [3440, 1100]]) {
        const { hero, widgets } = loungePanelRects(width, height, preferences);
        for (const rect of [hero, widgets]) {
          assert(rect.left >= 0 && rect.top >= 0 && rect.width >= 0 && rect.height >= 0);
          assert(rect.left + rect.width <= width && rect.top + rect.height <= height);
        }
        assert(hero.left + hero.width <= widgets.left || widgets.left + widgets.width <= hero.left || hero.top + hero.height <= widgets.top || widgets.top + widgets.height <= hero.top);
      }
      assert.deepEqual(normalizeLoungePreferences(JSON.parse(JSON.stringify(preferences))), preferences);
    }
  }
}
const sanitized = normalizeLoungePreferences({ widgetIds: ['bad', 'recent', 'recent', 'health', 'storage', 'news', 'chronicle'], widgetHeight: 99999, widgetWidth: -50, previewPosition: 'bottom-right', widgetPosition: 'bottom-right', shelfPosition: 'bottom' });
for (const [width, height] of [[977, 850], [3440, 1100]]) {
  const expanded = loungePanelRects(width, height, normalizeLoungePreferences({ widgetAreaEnabled: true, previewPosition: 'left', widgetPosition: 'right', previewWidth: 20, widgetWidth: 100, widgetHeight: 2160 }));
  assert(expanded.widgets.width > width * .7, 'maximum widgets use space left unused by a narrow hero');
  assert.equal(expanded.widgets.height, height - 32, 'maximum widget height fills the safe composition area');
  assert.equal(expanded.widgets.left, expanded.hero.left + expanded.hero.width + 16, 'only the actual hero and safe gap limit growth');
}
assert.deepEqual(sanitized.widgetIds, ['recent', 'health', 'storage', 'news']);
assert.equal(sanitized.widgetHeight, 8640);
assert.equal(sanitized.widgetWidth, 20);
assert.equal(sanitized.previewPosition, 'left');
assert.equal(normalizeLoungePreferences({ previewPanelOpacity: 0 }).previewPanelOpacity, 20);
assert.equal(normalizeLoungePreferences({ previewPanelOpacity: 20 }).previewPanelOpacity, 20);
const widgetBase = normalizeLoungePreferences({ widgetAreaEnabled: true, shelfPosition: 'bottom', previewPosition: 'left', widgetPosition: 'right', widgetHeight: 300 });
const top = loungePanelRects(1920, 1000, { ...widgetBase, widgetVerticalOffset: 300 }).widgets;
const middle = loungePanelRects(1920, 1000, { ...widgetBase, widgetVerticalOffset: 0 }).widgets;
const bottom = loungePanelRects(1920, 1000, { ...widgetBase, widgetVerticalOffset: -300 }).widgets;
assert.equal(top.top, 16); assert.equal(bottom.top + bottom.height, 984);
assert.equal(middle.top, (top.top + bottom.top) / 2, 'position spans full top-to-bottom travel without a dead negative half');
const upperSpace = loungeWidgetTopBoundary(240, 100, { left: 1100, width: 600 }, [{ left: 20, right: 600, bottom: 230, width: 580, height: 50 }, { left: 1000, right: 1800, bottom: 150, width: 800, height: 40 }]);
assert.equal(upperSpace, -74, 'widget can rise into the clear lane beside lower controls');
assert.equal(loungeWidgetTopBoundary(240, 100, { left: 1100, width: 600 }, []), -124, 'without lane controls the main-content edge limits upward movement');
assert.equal(loungeWidgetTopBoundary(240, 100, { left: 1100, width: 600 }, [{ left: 1000, right: 1800, bottom: 235, width: 800, height: 40 }]), 11, 'intersecting controls keep their 16px clearance');
const higherWidgets = loungePanelRects(1920, 1000, { ...widgetBase, widgetVerticalOffset: 300 }, [], upperSpace);
assert.equal(higherWidgets.widgets.top, upperSpace);
assert.deepEqual(higherWidgets.hero, loungePanelRects(1920, 1000, widgetBase).hero, 'extra widget headroom never moves the hero');
assert.equal(loungePanelRects(1920, 1000, { ...widgetBase, widgetVerticalOffset: -300 }, [], upperSpace).widgets.top + 300, 984, 'bottom placement is unchanged');
for (const shelfPosition of ['bottom', 'left']) {
  const p = { ...widgetBase, shelfPosition, previewPosition: shelfPosition === 'left' ? 'bottom-left' : 'left' };
  const hero = loungePanelRects(1920, 1000, p).hero;
  const bounds = loungeWidgetHeightBounds(1000, p, hero);
  let previousHeight = 0;
  for (const percent of [30, 60, 80, 90, 100]) {
    const size = Math.round(bounds.height * percent / 100);
    const widgets = loungePanelRects(1920, 1000, { ...p, widgetHeight: size }).widgets;
    assert(widgets.height > previousHeight, 'each upper slider step increases widget height');
    previousHeight = widgets.height;
    if (percent === 100) assert(Math.abs(widgets.height - bounds.height) <= 1, '100% fills the actual usable row');
  }
}
const settings = fs.readFileSync('src/components/lounge/LoungeSettingsPanel.jsx', 'utf8');
assert(settings.includes('widgetHeightMax * percent / 100') && settings.includes('300 - percent * 6'));
assert(settings.includes('Hero and widget opacity" value={preferences.previewPanelOpacity} min={20}'));
const home = fs.readFileSync('src/components/HomeHub.jsx', 'utf8');
for (const gate of ['!needsNews', '!needsReleases', '!needsUpdates', 'if (embedded) return']) assert(home.includes(gate));
const area = fs.readFileSync('src/components/lounge/LoungeWidgetArea.jsx', 'utf8');
assert(area.includes('React.memo') && area.includes('embeddedWidgetIds={ids}') && !area.includes('[game'));
assert(area.includes("position: 'absolute'") && area.includes('baseline - card.offsetHeight * scale') && area.includes('card.offsetHeight * 1.03'), 'ordinary cards set the base ceiling; peak envelopes are local rather than full width');
assert(!area.includes('window.innerHeight - shelf.offsetHeight'), 'transparent shelf padding cannot shrink the widget area');
assert(!area.includes('Math.min(element.clientHeight, available)'), 'composition cannot constrain itself to its previous shrunken height');
assert(area.includes('observer.observe(browser)') && area.includes('preferences.coverSize'), 'safe bounds refresh when browser or card sizing changes');
const obstacles = [{ left: 760, right: 1160, top: 630 }, { left: 570, right: 760, top: 730 }, { left: 1160, right: 1350, top: 730 }];
const heroOnly = normalizeLoungePreferences({ widgetAreaEnabled: false, previewWidth: 25, previewBoxHeight: 223, previewVerticalOffset: -300 });
const lowLeft = loungePanelRects(1920, 850, { ...heroOnly, previewPosition: 'left' }, obstacles).hero;
const centreHero = loungePanelRects(1920, 850, { ...heroOnly, previewPosition: 'center' }, obstacles).hero;
assert.equal(lowLeft.top + lowLeft.height, 834, 'side hero reaches ordinary-card ceiling');
assert.equal(centreHero.top + centreHero.height, 614, 'centre hero still avoids the enlarged selection');
const broader = loungePanelRects(1920, 850, { ...heroOnly, previewPosition: 'left', previewWidth: 50 }, obstacles).hero;
assert.equal(broader.top + broader.height, 614, 'a wide side panel reserves only the taller cards it actually overlaps');
const lowerWidgets = loungePanelRects(1920, 850, { ...heroOnly, previewPosition: 'center', widgetAreaEnabled: true, widgetPosition: 'right', widgetWidth: 20, widgetHeight: 8640 }, obstacles).widgets;
assert.equal(lowerWidgets.top + lowerWidgets.height, 834, 'side widgets can use ordinary-card clearance too');
const lounge = fs.readFileSync('src/components/lounge/NeoLounge.jsx', 'utf8');
const preview = fs.readFileSync('src/components/lounge/LoungePanelPreview.jsx', 'utf8');
for (const source of [lounge, preview]) assert(source.includes("preferences.specialTheme !== 'theme' || preferences.widgetAreaEnabled"), 'scene hero uses bounded composition even with widgets disabled, including mini preview');
for (const shelfPosition of ['left', 'right', 'top', 'bottom']) {
  for (const previewPosition of loungePanelPositions(shelfPosition)) {
    let previousTop = Infinity;
    for (const offset of [100, 50, 0, -100, -300]) {
      const hero = loungePanelRects(1920, 700, normalizeLoungePreferences({ preset: 'custom', shelfPosition, previewPosition, widgetAreaEnabled: false, previewBoxHeight: 223, previewVerticalOffset: offset })).hero;
      assert(hero.top >= 16 && hero.top + hero.height <= 684, 'standalone hero remains fully inside safe scene at every vertical extreme');
      assert(hero.top >= previousTop || previousTop === Infinity, 'lowering the position never lifts the hero');
      previousTop = hero.top;
    }
  }
}
const styles = fs.readFileSync('src/styles.css', 'utf8');
assert(area.includes('loungeWidgetTopBoundary') && area.includes('observer.observe(main)') && area.includes('data-widget-top={size.widgetTop}'));
for (const source of [preview, settings]) assert(source.includes('data-widget-top') && source.includes('widgetTop'), 'settings and preview consume the measured upper limit');
for (const source of [area, preview]) assert(source.includes("'--lounge-widget-zoom': preferences.widgetZoom / 100") && source.includes('lounge-widget-zoom'), 'live widgets and preview share the global zoom');
assert(settings.includes('Global widget zoom" value={preferences.widgetZoom} min={75} max={200} step={5}'));
const zoomHost = styles.match(/\.lounge-widget-zoom\s*\{([^}]*)\}/)?.[1];
assert(zoomHost.includes('width: 100%') && zoomHost.includes('height: 100%') && !zoomHost.includes('zoom:'), 'outer grid fills the unchanged box without zoom or reciprocal sizing');
assert(/\.lounge-home-widget-heading, \.lounge-home-widget-zoom\s*\{[^}]*zoom: var\(--lounge-widget-zoom, 1\)/.test(styles), 'only tile headings and inner artwork/text/controls are zoomed');
assert(home.includes('className="lounge-home-widget-content"><div className="lounge-home-widget-zoom">{paneContent[id]}</div></div>'), 'unzoomed scrollport surrounds zoomed content');
assert(home.includes('lounge-home-widget-heading') && preview.includes('lounge-home-widget-zoom'));
assert(/\.lounge-composition-hero \.lounge-scene-stage__content\s*\{[^}]*transform: none/.test(styles), 'bounded hero is not translated a second time into a clipping boundary');
assert(lounge.includes("closest?.('[data-testid=\"lounge-widget-area\"]')"));
assert(lounge.includes('safeGames.find(game => game.id === detailsId)'));
console.log('PASS: optional widgets, safe hydration, every placement pair, bounded nonoverlapping geometry, selected-only feeds, stable host and independent wheel scrolling.');
