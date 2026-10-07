import React from 'react';
import HomeHub from '../HomeHub';
import LoungeBrowserStage from './LoungeBrowserStage';
import { loungePanelRects, loungeWidgetTopBoundary } from './lounge-widget-layout.mjs';

// Selecting carousel games must not restart Home feeds or redraw widget content.
const ImportedHomeWidgets = React.memo(function ImportedHomeWidgets({ games, ids, onSelect, resting, favoriteIds, filters, onFiltersChange }) {
  const homeLayout = React.useMemo(() => ({ playtimePieFilters: filters }), [filters]);
  return <HomeHub games={games} favoriteIds={favoriteIds} homeLayout={homeLayout} onUpdateHomeLayout={next => onFiltersChange?.(next.playtimePieFilters)} embeddedWidgetIds={ids} onSelect={onSelect} resting={resting} />;
});

export default function LoungeWidgetArea({ game, index, total, preferences, updateLedger, onOpenDetails, games, resting, favoriteIds, onPlaytimePieFiltersChange }) {
  const host = React.useRef(null);
  const [size, setSize] = React.useState({ width: 0, height: 0, available: 320, top: 0, obstacles: [], widgetTop: 16 });
  React.useLayoutEffect(() => {
    const element = host.current;
    const browser = element.closest('.lounge-browser');
    const shelf = browser.querySelector('.lounge-browser-shelf');
    const main = browser.closest('.lounge-main-content');
    const controls = [...main.querySelectorAll('.lounge-browse-dock button, .lounge-scene-shortcuts button, .lounge-hints-toggle, #lounge-control-guide, [data-lounge-collapse-games]')];
    const sync = () => {
      const rect = element.getBoundingClientRect();
      const browserRect = browser.getBoundingClientRect();
      const bottom = browser.dataset.shelfPosition === 'bottom';
      const horizontal = bottom || browser.dataset.shelfPosition === 'top';
      const card = shelf.querySelector('.lounge-browser-card');
      const shelfRect = shelf.getBoundingClientRect();
      // Ordinary cards define the base ceiling. Reserve taller envelopes only
      // where a panel actually crosses the centred selection/neighbour lane.
      const baseline = card?.getBoundingClientRect().bottom ?? shelfRect.top;
      const cardCeiling = card ? baseline - card.offsetHeight * 1.03 : shelfRect.top;
      const centre = shelfRect.left + shelfRect.width / 2 - browserRect.left;
      const pitch = card ? card.offsetWidth + preferences.gap : 0;
      const obstacles = bottom && card ? [-2, -1, 0, 1, 2].map(distance => {
        const scale = distance === 0 ? Math.max(1.03, preferences.selectedGameScale / 100 + 0.09) : Math.abs(distance) === 1 ? 1.22 : 1.11;
        const halfWidth = card.offsetWidth * scale / 2;
        return { left: centre + distance * pitch - halfWidth, right: centre + distance * pitch + halfWidth, top: Math.max(0, baseline - card.offsetHeight * scale - browserRect.top) };
      }) : [];
      const top = horizontal ? bottom ? 0 : Math.max(0, shelf.getBoundingClientRect().bottom - browserRect.top + 16) : 0;
      const ceiling = bottom ? Math.min(window.innerHeight - 16, cardCeiling) : Math.min(window.innerHeight - 16, browserRect.bottom);
      const available = Math.max(0, ceiling - (horizontal ? browserRect.top + top : rect.top));
      const width = horizontal ? browser.clientWidth : element.clientWidth;
      const height = available;
      const origin = horizontal ? browserRect.top + top : rect.top;
      const widgets = loungePanelRects(width, height, preferences, obstacles).widgets;
      const widgetTop = widgets && browser.dataset.shelfPosition !== 'top' ? loungeWidgetTopBoundary(origin, main.getBoundingClientRect().top, { left: (horizontal ? browserRect.left : rect.left) + widgets.left, width: widgets.width }, controls.map(control => control.getBoundingClientRect()).filter(control => control.top < origin)) : 16;
      setSize(current => current.width === width && current.height === height && current.available === available && current.top === top && current.widgetTop === widgetTop && JSON.stringify(current.obstacles) === JSON.stringify(obstacles) ? current : { width, height, available, top, obstacles, widgetTop });
    };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(element); observer.observe(shelf); observer.observe(browser);
    observer.observe(main); controls.forEach(control => observer.observe(control));
    const settled = event => { if (event.target === shelf) sync(); };
    shelf.addEventListener('transitionend', settled);
    window.addEventListener('resize', sync);
    return () => { observer.disconnect(); shelf.removeEventListener('transitionend', settled); window.removeEventListener('resize', sync); };
  }, [preferences.shelfPosition, preferences.carouselVerticalOffset, preferences.selectedGameScale, preferences.carouselShowTitles, preferences.coverSize, preferences.coverAspect, preferences.gap, preferences.widgetAreaEnabled, preferences.widgetPosition, preferences.widgetWidth, preferences.previewPosition, preferences.previewWidth, preferences.controlSize, preferences.quickLinks, preferences.hiddenBrowseFilters]);
  const rectangles = React.useMemo(() => loungePanelRects(size.width, size.height, preferences, size.obstacles, size.widgetTop), [size.width, size.height, size.obstacles, size.widgetTop, preferences.previewPosition, preferences.previewWidth, preferences.previewBoxHeight, preferences.previewVerticalOffset, preferences.widgetAreaEnabled, preferences.widgetPosition, preferences.widgetWidth, preferences.widgetHeight, preferences.widgetVerticalOffset, preferences.shelfPosition]);
  const horizontal = ['top', 'bottom'].includes(preferences.shelfPosition);
  return <div ref={host} className="lounge-composition" data-testid="lounge-widget-composition" data-card-clearance={JSON.stringify(size.obstacles)} data-widget-top={size.widgetTop} style={{ height: size.available, maxHeight: size.available, ...(horizontal ? { position: 'absolute', top: size.top, left: 0, right: 0 } : {}) }}>
    <div className="lounge-composition-hero" style={{ ...rectangles.hero, '--lounge-hero-slot-height': `${rectangles.hero.height}px` }} data-testid="lounge-hero-slot">
      <LoungeBrowserStage game={game} index={index} total={total} preferences={preferences} updateLedger={updateLedger} onOpenDetails={onOpenDetails} />
    </div>
    {preferences.widgetAreaEnabled && <aside aria-label="Lounge Home widgets" data-testid="lounge-widget-area" data-show-box={preferences.widgetShowBox} style={rectangles.widgets}>
      <div className="lounge-widget-zoom" style={{ '--lounge-widget-zoom': preferences.widgetZoom / 100 }}>
        <ImportedHomeWidgets games={games} ids={preferences.widgetIds} onSelect={onOpenDetails} resting={resting} favoriteIds={favoriteIds} filters={preferences.playtimePieFilters} onFiltersChange={onPlaytimePieFiltersChange} />
      </div>
    </aside>}
  </div>;
}
