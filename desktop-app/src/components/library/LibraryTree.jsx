import React from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import {
  RefreshCw, Trash2, Pencil, FolderOpen, MoreVertical, Lock, ChevronRight, ChevronDown,
  Tag, GripVertical, Terminal, Info, ArrowUp, ArrowDown, EyeOff, Pin, PinOff,
  RotateCcw, ArchiveRestore, Stethoscope, Wand2, Wrench,
} from 'lucide-react';
import { categoryHeaderLabel } from '../../lib/categoryHeaderLabel.mjs';
import { cn, colorFromId, formatPlaytime, playtimeSource } from '../../lib/utils';
import { renderForegroundPortal } from '../ui/VisualBoundary';
import { splitLibrarySections } from './library-tree-model.mjs';

/**
 * TwoColumnSections — splits sections into two side-by-side columns such that:
 *   - No category is split across columns
 *   - Both columns are roughly balanced by estimated rendered height
 * Estimation uses: catHeader (≈ catTextSize + 18) + games*(rowSize+rowGap) + catGap.
 */
export function TwoColumnSections({ sections, commonProps }) {
  const { size, catTextSize, rowGap, catGap } = commonProps;
  const [colA, colB] = splitLibrarySections(sections, {
    rowHeight: size.rowH,
    categoryTextSize: catTextSize,
    rowGap,
    categoryGap: catGap,
  });
  // If everything fits in col1, fall back to single column
  if (colB.length === 0) {
    return sections.map((s, idx) => (
      <SectionWrap key={s.id} s={s} idx={idx} commonProps={commonProps} />
    ));
  }
  return (
    <div className="grid grid-cols-2 gap-2" data-testid="sidebar-twocol">
      <div>{colA.map((s, idx) => <SectionWrap key={s.id} s={s} idx={idx} commonProps={commonProps} />)}</div>
      <div>{colB.map((s, idx) => <SectionWrap key={s.id} s={s} idx={idx + colA.length} commonProps={commonProps} />)}</div>
    </div>
  );
}

function SectionWrap({ s, idx, commonProps }) {
  const { collapsed, size, iconPosition, catTextSize, catGlow, rowGap, catGap, catTopGap, selectedId,
    showCategoryDot, categoryMarkerMode, showSubcatStrip,
    pinnedIdsSet,
    onSelect, onGameContext, onCategoryContext, onUnlockCategory, onToggleCollapsed,
    onMoveGameToCategory, onReorderGameInCategory, onReorderCategory,
    unlockedCategories, categories } = commonProps;
  return (
    <LibrarySection
      section={s}
      sectionIdx={idx}
      collapsed={!!collapsed[s.id]}
      size={size}
      iconPosition={iconPosition}
      catTextSize={catTextSize}
      catGlow={catGlow}
      rowGap={rowGap}
      catGap={catGap}
      catTopGap={catTopGap}
      showCategoryDot={showCategoryDot}
      categoryMarkerMode={categoryMarkerMode}
      showSubcatStrip={showSubcatStrip}
      pinnedIdsSet={pinnedIdsSet}
      selectedId={selectedId}
      onSelect={onSelect}
      onContext={(action, payload) => onGameContext(action, payload.game, payload)}
      onCategoryContext={(category, anchor) => onCategoryContext(category, anchor)}
      onUnlockCategory={() => onUnlockCategory(s.category)}
      onToggleCollapsed={() => onToggleCollapsed(s.id)}
      onMoveGameToCategory={onMoveGameToCategory}
      onReorderGameInCategory={onReorderGameInCategory}
      onReorderCategory={onReorderCategory}
      unlockedCategories={unlockedCategories}
      categories={categories}
    />
  );
}

/* ---------------- Section ---------------- */
export function LibrarySection({
  section, sectionIdx, collapsed, size, iconPosition, selectedId, onSelect,
  onContext, onCategoryContext, onUnlockCategory, onToggleCollapsed,
  onMoveGameToCategory, onReorderGameInCategory, onReorderCategory,
  unlockedCategories, categories,
  catTextSize = 11, catGlow = 40, rowGap = 2, catGap = 8, catTopGap = 4,
  showCategoryDot = true, categoryMarkerMode = 'dot',
  showSubcatStrip = true,
  pinnedIdsSet = new Set(),
}) {
  const isUncat = section.id === '__uncat__';
  const c = section.category;
  const color = colorFromId(c.colorId);
  const backdropOpacity = Math.round((0.10 + (Math.max(0, Math.min(300, catGlow)) / 300) * 0.55) * 255).toString(16).padStart(2, '0');
  // v1.6.5 — glow/halo sizes used to be fixed px regardless of catTextSize,
  // so a small text size + tight category gap let the bloom bleed into the
  // section above/below. Scale every glow dimension off the same slider.
  const catScale = Math.max(0.55, Math.min(1.3, (catTextSize || 11) / 11));
  // A category header is one typographic unit. The Visuals slider therefore
  // drives its name, launcher badge, count, arrow glyph, dot, and options
  // glyph together instead of leaving fixed toolbar-sized pieces behind.
  const categoryUiFontSize = Math.max(6, Math.min(18, Math.round(catTextSize || 11)));
  const categoryArrowSize = Math.max(6, Math.round(categoryUiFontSize * 0.86));
  const categoryControlSize = Math.max(14, Math.min(26, categoryUiFontSize + 6));
  const categoryMetaIconSize = Math.max(6, Math.round(categoryUiFontSize * 0.9));
  const categoryBadgePadX = Math.max(2, Math.round(categoryUiFontSize * 0.24));
  const categoryBadgePadY = Math.max(0, Math.round(categoryUiFontSize * 0.08));
  // Backdrop is a real companion to the category type, rather than a fixed
  // stripe that feels oversized at small text or cramped at large text.
  // Backdrop follows the actual text line-height closely: a marker should
  // frame a category label, not become a second, oversized row.
  const backdropPadY = Math.max(1, Math.round(1.5 * catScale));
  const backdropPadX = Math.max(3, Math.round(5 * catScale));
  const backdropLeft = Math.max(5, Math.round(8 * catScale));
  const backdropBorder = Math.max(1, Math.round(2 * catScale));
  // Zero truly means close: keep only a tiny collision-safe breathing room
  // for the first game, scaled with the category label so tight settings do
  // not cause a glow/header overlap.
  const firstGameGap = Math.max(Number(catTopGap) || 0, 0);
  const [hover, setHover] = React.useState(false);
  const sectionRef = React.useRef(null);

  // Drag handlers — section header acts as both drop-target for games AND drag-source for category reorder
  const onSectionDragOver = (e) => {
    const types = e.dataTransfer.types;
    if (types.includes('text/game-id') || types.includes('text/cat-id')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = e.ctrlKey ? 'copy' : 'move';
      sectionRef.current?.classList.add('drop-target');
    }
  };
  const onSectionDragLeave = () => sectionRef.current?.classList.remove('drop-target');
  const onSectionDrop = (e) => {
    e.preventDefault();
    sectionRef.current?.classList.remove('drop-target');
    const gameId = e.dataTransfer.getData('text/game-id');
    const rawFromCat = e.dataTransfer.getData('text/game-from-cat');
    // v1.4.0 — treat the '__uncat__' sentinel as null when calling move handler
    const fromCat = (!rawFromCat || rawFromCat === '__uncat__') ? null : rawFromCat;
    const catId = e.dataTransfer.getData('text/cat-id');
    if (gameId) {
      onMoveGameToCategory(gameId, fromCat, isUncat ? null : c.id, { copy: e.ctrlKey });
      return;
    }
    if (catId && catId !== c.id && !isUncat) {
      onReorderCategory(catId, c.id);
    }
  };

  return (
    <div
      ref={sectionRef}
      style={{ marginBottom: catGap }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onDragOver={onSectionDragOver}
      onDragLeave={onSectionDragLeave}
      onDrop={onSectionDrop}
    >
      <div
        draggable={!isUncat && !section.isGhost}
        onDragStart={(e) => {
          if (isUncat || section.isGhost) return;
          e.dataTransfer.setData('text/cat-id', c.id);
          e.dataTransfer.effectAllowed = 'move';
        }}
        onContextMenu={(e) => {
          if (isUncat) return;
          e.preventDefault();
          e.stopPropagation();
          onCategoryContext(c, { x: e.clientX, y: e.clientY });
        }}
        onClick={() => {
          if (section.isGhost) onUnlockCategory();
          else onToggleCollapsed();
        }}
        data-testid={`section-${c.id}`}
        className={cn(
          'group flex cursor-pointer select-none items-center gap-1 rounded-md px-1.5 py-1.5 transition-colors',
          'hover:bg-[rgb(var(--accent)/0.06)]'
        )}
        style={
          // When the category dot is disabled, use a subtle coloured backdrop
          // stripe for every real category, including a locked PIN category.
          // The visual identity remains while its games and count stay private.
          categoryMarkerMode === 'background' && !isUncat
            ? {
                background: `linear-gradient(90deg, ${color}${backdropOpacity} 0%, ${color}24 58%, transparent 100%)`,
                borderLeft: `${backdropBorder}px solid ${color}`,
                paddingLeft: `${backdropLeft}px`,
                paddingRight: `${backdropPadX}px`,
                paddingTop: `${backdropPadY}px`,
                paddingBottom: `${backdropPadY}px`,
              }
            : undefined
        }
      >
        {/* Drag handle */}
        <span
          className={cn(
            'mr-0.5 shrink-0 text-muted/60 transition-opacity',
            hover && !isUncat ? 'opacity-100' : 'opacity-0'
          )}
        >
          <GripVertical size={categoryMetaIconSize} />
        </span>

        {/* A solid, deliberately generous category control: it remains easy to
            see and hit even in compact Library layouts. */}
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            if (section.isGhost) onUnlockCategory();
            else onToggleCollapsed();
          }}
          className="grid shrink-0 place-items-center rounded-md border border-[rgb(var(--border)/0.9)] bg-[rgb(var(--surface)/0.56)] text-[rgb(var(--accent-2))] shadow-sm transition hover:border-[rgb(var(--accent)/0.68)] hover:bg-[rgb(var(--accent)/0.14)] hover:text-ink"
          style={{ width: categoryControlSize, height: categoryControlSize }}
          title={section.isGhost ? 'Unlock Private category' : collapsed ? 'Expand category' : 'Collapse category'}
          aria-label={section.isGhost ? 'Unlock Private category' : collapsed ? 'Expand category' : 'Collapse category'}
        >
          {section.isGhost ? <Lock size={categoryArrowSize} strokeWidth={2.6} /> : collapsed ? <ChevronRight size={categoryArrowSize} strokeWidth={3} /> : <ChevronDown size={categoryArrowSize} strokeWidth={3} />}
        </button>

        {/* Color marker and launcher badge are separate signals. A launcher
            label such as Steam must not silently replace the player's chosen
            Dot marker mode—both get their own stable slot after the arrow. */}
        {!isUncat && <>
          {categoryMarkerMode === 'dot' && (
            <span
              data-testid={`category-marker-${c.id}`}
              className="relative z-[2] shrink-0 rounded-full cat-icon"
              style={{
                width: Math.max(5, Math.round(categoryUiFontSize * 0.78)),
                height: Math.max(5, Math.round(categoryUiFontSize * 0.78)),
                background: color,
                boxShadow: `0 0 ${Math.round((4 + catGlow * 0.18) * catScale)}px ${color}, 0 0 ${Math.round(catGlow * 0.35 * catScale)}px ${color}80`,
                color, // for filter:drop-shadow on hover
              }}
            />
          )}
          {!section.isGhost && c.logoLabel ? (
            <span
              className="shrink-0 rounded font-extrabold leading-none"
              style={{
                background: color,
                color: '#0a0414',
                boxShadow: `0 0 8px ${color}AA`,
                fontSize: categoryUiFontSize,
                letterSpacing: '0.08em',
                paddingInline: categoryBadgePadX,
                paddingBlock: categoryBadgePadY,
              }}
            >
              {c.logoLabel}
            </span>
          ) : categoryMarkerMode === 'background' ? (
            // The backdrop already signals colour. Keep only a small stable
            // spacer so the category name still aligns with Dot mode.
            <span aria-hidden className="shrink-0" style={{ width: 2, height: 2 }} />
          ) : null}
        </>}

        {/* Name — applies dynamic font size + glow (catTextSize / catGlow sliders) */}
        <span
          className={cn(
            // Fixed UI wording must stay complete. When the sidebar is narrow,
            // wrap at a natural word boundary instead of hiding the last words.
            'library-font-ui min-w-0 flex-1 break-words whitespace-normal font-display font-bold uppercase leading-[1.12] tracking-[0.18em]',
            section.isGhost ? 'text-[rgb(var(--accent))]/80' : 'text-ink/95'
          )}
          style={(() => {
            const g = Math.max(0, Math.min(300, catGlow)) / 100; // 0..3, smooth
            const base = `${categoryUiFontSize}px`;
            if (section.isGhost || isUncat || g === 0) {
              return { fontSize: base };
            }
            // v1.2.2 — bigger dynamic range so the slider actually feels
            // smooth instead of "3 levels". Layered halos: inner (crisp core),
            // outer (soft bloom), punch (far diffuse), plus a super-bright
            // core kick that only engages above ~120% for extra pop.
            const inner   = ((3 + g * 8) * catScale).toFixed(1);     // scales down at small catTextSize
            const outer   = ((10 + g * 22) * catScale).toFixed(1);
            const punch   = ((12 + g * 26) * catScale).toFixed(1);
            const coreG   = Math.max(0, g - 1.2);       // 0..1.8 kick at high glow
            const shadows = [
              `0 0 ${inner}px ${color}`,
              `0 0 ${outer}px ${color}`,
              `0 0 ${punch}px ${color}80`,
            ];
            if (coreG > 0) {
              shadows.unshift(`0 0 ${((2 + coreG * 6) * catScale).toFixed(1)}px #ffffff`);
              shadows.push(`0 0 ${((20 + coreG * 30) * catScale).toFixed(1)}px ${color}`);
            }
            return {
              fontSize: base,
              textShadow: shadows.join(', '),
              filter: g > 1.5 ? `drop-shadow(0 0 ${(g * 6 * catScale).toFixed(1)}px ${color}) brightness(${(1 + coreG * 0.15).toFixed(2)})` : undefined,
              letterSpacing: '0.2em',
            };
          })()}
        >
          {section.isGhost ? (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onUnlockCategory();
              }}
              className="-my-1 inline-flex max-w-full items-center gap-1.5 rounded-md px-1 py-1 text-left hover:bg-[rgb(var(--accent)/0.14)] hover:text-[rgb(var(--accent))]"
              title={`Unlock ${c.name}`}
            >
              <span className="min-w-0 break-words">Unlock {c.name}</span>
            </button>
          ) : categoryHeaderLabel(c)}
        </span>

        {/* Count */}
        {section.count !== '' && <span className="shrink-0 rounded-full bg-panel/60 hairline text-muted" style={{ fontSize: categoryUiFontSize, lineHeight: 1, paddingInline: categoryBadgePadX + 1, paddingBlock: categoryBadgePadY + 1 }}>
          {section.count}
        </span>}

        {/* Kebab menu — guaranteed access to Rename / Set Private / Delete (alongside right-click) */}
        {!isUncat && (
          <button
            data-testid={`section-menu-btn-${c.id}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const r = e.currentTarget.getBoundingClientRect();
              onCategoryContext(c, { x: r.right - 8, y: r.bottom + 4 });
            }}
            title="Category options"
            className={cn(
              'ml-1 grid shrink-0 place-items-center rounded transition-colors',
              'text-muted/70 hover:text-ink hover:bg-[rgb(var(--accent)/0.15)]',
              hover ? 'opacity-100' : 'opacity-60'
            )}
            style={{ width: categoryControlSize, height: categoryControlSize }}
          >
            <MoreVertical size={categoryMetaIconSize} />
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {!collapsed && !section.isGhost && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ overflow: 'hidden' }}
            onAnimationComplete={(d) => {
              // Allow dropdown menus to escape the bounds after expand animation
              if (d?.height === 'auto') {
                /* noop — content is fully expanded */
              }
            }}
          >
            <div className="pl-4" style={{ overflow: 'visible', paddingTop: firstGameGap }}>
              {section.games.length === 0 ? (
                <div className="px-3 py-2 text-[11px] text-muted/70 italic">
                  Empty — drop a game here.
                </div>
              ) : (
                section.games.map((g, idx) => (
                  <LibraryGameRow
                    key={g.id}
                    g={g}
                    size={size}
                    iconPosition={iconPosition}
                    rowGap={rowGap}
                    showCategoryDot={showCategoryDot}
                    showSubcatStrip={showSubcatStrip}
                    isPinned={pinnedIdsSet.has(g.id)}
                    selected={selectedId === g.id}
                    indexInCat={idx}
                    sectionGames={section.games}
                    fromCatId={isUncat ? null : c.id}
                    onClick={() => onSelect(g.id)}
                    onContext={(action) => onContext(action, { game: g })}
                    onReorderInCat={(fromId, beforeId) =>
                      onReorderGameInCategory(isUncat ? '__uncat__' : c.id, fromId, beforeId)
                    }
                    onMoveBetween={onMoveGameToCategory}
                    categories={categories}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------------- Game row ---------------- */
export function LibraryGameRow({
  g, size, selected, onClick, onContext, fromCatId, indexInCat,
  sectionGames, onReorderInCat, onMoveBetween, categories,
  iconPosition = 'left', rowGap = 2, showCategoryDot = true, showSubcatStrip = true, isPinned = false, flatList = false,
}) {
  const [menu, setMenu] = React.useState({ open: false, x: 0, y: 0 });
  const ref = React.useRef(null);

  React.useEffect(() => {
    const close = (e) => {
      // Close on any click anywhere — the menu items themselves stopPropagate before closing
      setMenu((m) => (m.open ? { ...m, open: false } : m));
    };
    if (menu.open) {
      document.addEventListener('mousedown', close);
      document.addEventListener('contextmenu', close);
    }
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('contextmenu', close);
    };
  }, [menu.open]);

  const openMenuAt = (x, y) => {
    // Clamp to viewport
    const W = window.innerWidth, H = window.innerHeight;
    const w = 240, h = 320;
    setMenu({
      open: true,
      x: Math.min(x, W - w - 8),
      y: Math.min(y, H - h - 8),
    });
  };

  const isSmall = size.id === 'small';
  const isBig = size.id === 'big';
  const isNewToLibrary = g.librarySeenAt === null;
  // v1.6.5 — the gold ring used to be a fixed inset:0 regardless of text
  // size, so at very small nameTextSize the ring (sized to the full row box)
  // visually overlapped the row above/below. Scale the ring inward as the
  // font shrinks below the ~14px baseline.
  const ringScale = Math.max(0.45, Math.min(1.15, (size?.font || 13) / 14));

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -6 }}
      transition={{ duration: 0.14 }}
      draggable={!flatList}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/game-id', g.id);
        // v1.4.0 — always set the from-cat key. Use '__uncat__' as the
        // sentinel for uncategorized so the reorder-vs-move check below
        // doesn't fall through to the fragile null/empty-string edge case.
        e.dataTransfer.setData('text/game-from-cat', fromCatId || '__uncat__');
        e.dataTransfer.effectAllowed = 'copyMove';
        e.currentTarget.classList.add('is-dragging');
      }}
      onDragEnd={(e) => e.currentTarget.classList.remove('is-dragging')}
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes('text/game-id')) return;
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.style.boxShadow = 'inset 0 2px 0 rgb(var(--accent))';
      }}
      onDragLeave={(e) => (e.currentTarget.style.boxShadow = '')}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.style.boxShadow = '';
        const gameId = e.dataTransfer.getData('text/game-id');
        // v1.4.0 — normalize both sides to the '__uncat__' sentinel so drops
        // WITHIN Uncategorized correctly enter the reorder branch.
        const rawFromCat = e.dataTransfer.getData('text/game-from-cat') || '__uncat__';
        const rawTargetCat = fromCatId || '__uncat__';
        if (!gameId || gameId === g.id) return;
        if (rawFromCat === rawTargetCat) {
          // Same category → reorder
          onReorderInCat(gameId, g.id);
        } else {
          // Move/copy across categories — drop before this game in the target cat
          onMoveBetween(gameId, rawFromCat === '__uncat__' ? null : rawFromCat, fromCatId, { copy: e.ctrlKey, beforeGameId: g.id });
        }
      }}
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); openMenuAt(e.clientX, e.clientY); }}
      onClick={onClick}
      data-testid={`game-row-${g.id}`}
      className={cn(
        'group relative flex min-w-0 cursor-pointer items-center gap-2.5 overflow-hidden rounded-md transition-colors',
        selected ? 'bg-[rgb(var(--accent)/0.10)] text-ink' : 'text-muted hover:bg-panel/70 hover:text-ink',
        g.managedTool && g.availability !== 'installed' && 'opacity-60 grayscale-[0.3]',
        isSmall ? 'px-1.5' : 'px-2',
        Number(g.rating) === 5 && 'row-5star-shimmer'
      )}
      style={{
        minHeight: size.rowH,
        marginBottom: rowGap,
        '--ring-scale': ringScale,
        // Compress vertical padding aggressively when gap is small or negative
        paddingTop: Math.max(0, 6 + Math.min(0, rowGap) + (isBig ? 2 : 0)),
        paddingBottom: Math.max(0, 6 + Math.min(0, rowGap) + (isBig ? 2 : 0)),
        // v1.4.0 — 5-star favorite games get a subtle warm-gold gradient wash
        // behind the row. Kept intentionally soft so it never overpowers the
        // selection highlight.
        ...(Number(g.rating) === 5
          ? {
              background: selected
                ? 'linear-gradient(90deg, rgba(255,204,74,0.16) 0%, rgba(255,204,74,0.06) 55%, rgb(var(--accent) / 0.10) 100%)'
                : 'linear-gradient(90deg, rgba(255,204,74,0.11) 0%, rgba(255,204,74,0.03) 60%, transparent 100%)',
            }
          : {}),
      }}
    >
      {/* Selection bar */}
      <span
        className={cn(
          'absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full',
          selected ? 'bg-[rgb(var(--accent))] shadow-[0_0_8px_rgb(var(--accent))]' : 'bg-transparent'
        )}
      />

      {isNewToLibrary && (
        <span
          className="pointer-events-none absolute right-5 top-1.5 rounded-sm border border-[rgb(var(--accent)/0.72)] bg-[rgb(var(--surface)/0.92)] px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.14em] text-[rgb(var(--accent-2))] shadow-[0_0_10px_rgb(var(--accent)/0.28)]"
          data-testid={`game-new-badge-${g.id}`}
          title="New to your library — clears after opening this game from the Library"
        >
          New
        </span>
      )}

      {/* Icon — position controlled by iconPosition setting (left | right | none) */}
      {iconPosition !== 'none' && iconPosition !== 'right' && (
        <div
          className="relative shrink-0 overflow-hidden rounded hairline bg-surface/70"
          style={{ width: size.icon, height: size.icon }}
        >
          {g.icon ? (
            <img src={g.icon} alt="" className="h-full w-full object-cover" />
          ) : g.coverUrl ? (
            <img src={g.coverUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-[9px] text-muted">
              {(g.name || '?').slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
      )}

      {/* Name + meta */}
      <div className="flex min-w-0 flex-1 flex-col justify-end overflow-hidden">
        {/* Genre/meta strip — shown when the "Sub-category" toggle is on and
            row size is not the compact "small" preset (where there's no room).
            Category color dots hide when the "Category dot" toggle is off. */}
        {!isSmall && showSubcatStrip && (
          <div className="mb-1 flex items-center gap-1.5 truncate text-[10.5px] text-muted">
            {showCategoryDot && (g.categoryIds || []).slice(0, 3).map((cid) => {
              const cc = categories.find((x) => x.id === cid);
              if (!cc) return null;
              return (
                <span
                  key={cid}
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: colorFromId(cc.colorId), boxShadow: `0 0 4px ${colorFromId(cc.colorId)}` }}
                />
              );
            })}
            <span className="truncate flex items-center gap-1">
              {g.playtime ? (
                <>
                  {(() => {
                    const src = playtimeSource(g);
                    if (!src) return null;
                    return (
                      <span
                        className="rounded px-1 py-[1px] text-[8px] font-bold tracking-wider shrink-0"
                        style={{
                          background: `${src.color}25`,
                          color: src.color,
                          border: `1px solid ${src.color}55`,
                        }}
                        title={`Playtime imported from ${src.label}`}
                        data-testid={`playtime-src-${src.id}`}
                      >
                        {src.label}
                      </span>
                    );
                  })()}
                  <span className="truncate">{formatPlaytime(g.playtime)} played</span>
                </>
              ) : (
                <span>{g.managedTool && g.availability !== 'installed' ? 'Set up required' : (g.genres?.[0] || 'Local game')}</span>
              )}
            </span>
          </div>
        )}
        <div className="game-row-nameplate" style={{ fontSize: size.font }} title={g.name || 'Untitled'}>
          {g.name || 'Untitled'}
        </div>
      </div>

      {/* Icon on right side */}
      {iconPosition === 'right' && (
        <div
          className="relative shrink-0 overflow-hidden rounded hairline bg-surface/70"
          style={{ width: size.icon, height: size.icon }}
        >
          {g.icon ? (
            <img src={g.icon} alt="" className="h-full w-full object-cover" />
          ) : g.coverUrl ? (
            <img src={g.coverUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-[9px] text-muted">
              {(g.name || '?').slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
      )}

      {g.managedTool && g.availability !== 'installed' && <Wrench size={12} className="shrink-0 text-[rgb(var(--accent-2))]" title="Select this tool to locate or install it" />}

      {/* Hover menu trigger */}
      <button
        data-testid={`game-row-menu-${g.id}`}
        onClick={(e) => {
          e.stopPropagation();
          const r = e.currentTarget.getBoundingClientRect();
          openMenuAt(r.right - 8, r.bottom + 4);
        }}
        className="opacity-0 group-hover:opacity-100 text-muted hover:text-ink transition-opacity"
      >
        <MoreVertical size={13} />
      </button>

      {menu.open && renderForegroundPortal(
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.12 }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.stopPropagation()}
          style={{ position: 'fixed', top: menu.y, left: menu.x, zIndex: 200, width: 240 }}
          className="overflow-hidden rounded-lg hairline glass shadow-2xl py-1"
        >
          <Item icon={<RefreshCw size={13} />} label="Refresh info (this game)" onClick={() => { setMenu({ ...menu, open: false }); onContext('refetch'); }} testid={`game-ctx-refetch-${g.id}`} />
          <Item icon={<Wand2 size={13} />} label="Re-search by name…" onClick={() => { setMenu({ ...menu, open: false }); onContext('research'); }} testid={`game-ctx-research-${g.id}`} />
          <Divider />
          <Item
            icon={isPinned ? <PinOff size={13} /> : <Pin size={13} />}
            label={isPinned ? 'Unpin from top' : 'Pin to top (max 5)'}
            onClick={() => { setMenu({ ...menu, open: false }); onContext(isPinned ? 'unpin' : 'pin'); }}
            testid={`game-ctx-pin-${g.id}`}
          />
          <Divider />
          <Item icon={<Pencil size={13} />} label="Rename" onClick={() => { setMenu({ ...menu, open: false }); onContext('rename'); }} testid={`game-ctx-rename-${g.id}`} />
          <Item icon={<Terminal size={13} />} label="Edit launch args" onClick={() => { setMenu({ ...menu, open: false }); onContext('args'); }} testid={`game-ctx-args-${g.id}`} />
          <Item icon={<Info size={13} />} label="Details / edit cover" onClick={() => { setMenu({ ...menu, open: false }); onContext('details'); }} testid={`game-ctx-details-${g.id}`} />
          <Divider />
          <Item icon={<Tag size={13} />} label="Manage categories…" onClick={() => { setMenu({ ...menu, open: false }); onContext('manage-categories'); }} testid={`game-ctx-cats-${g.id}`} />
          <Item icon={<FolderOpen size={13} />} label="Reveal in folder" onClick={() => { setMenu({ ...menu, open: false }); onContext('reveal'); }} testid={`game-ctx-reveal-${g.id}`} />
          <Item icon={<ArchiveRestore size={13} />} label="Save game folder…" onClick={() => { setMenu({ ...menu, open: false }); onContext('save-games'); }} testid={`game-ctx-save-games-${g.id}`} />
          {g.launchDoctorSuggested && <Item icon={<Stethoscope size={13} />} label="Launch Doctor" onClick={() => { setMenu({ ...menu, open: false }); onContext('launch-doctor'); }} testid={`game-ctx-launch-doctor-${g.id}`} />}
          <Divider />
          <Item icon={<RotateCcw size={13} />} label="Reset playtime to 0" onClick={() => { setMenu({ ...menu, open: false }); onContext('reset-playtime'); }} testid={`game-ctx-reset-playtime-${g.id}`} />
          <Item icon={<RefreshCw size={13} />} label="Re-import from Steam" onClick={() => { setMenu({ ...menu, open: false }); onContext('reimport-steam'); }} testid={`game-ctx-reimport-steam-${g.id}`} />
          <Divider />
          <Item icon={<Trash2 size={13} />} label="Remove from library" danger onClick={() => { setMenu({ ...menu, open: false }); onContext('remove'); }} testid={`game-ctx-remove-${g.id}`} />
        </motion.div>,
      )}
    </motion.div>
  );
}

function Item({ icon, label, onClick, testid, danger }) {
  return (
    <button
      data-testid={testid}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-xs transition-colors',
        danger ? 'text-red-400 hover:bg-red-500/10' : 'text-ink hover:bg-[rgb(var(--accent)/0.10)]'
      )}
    >
      <span className="text-muted">{icon}</span>
      {label}
    </button>
  );
}

function Divider() {
  return <div className="my-1 h-px bg-[rgb(var(--border))]" />;
}

/* ---------------- Category context menu ---------------- */
export function CategoryContextMenu({ open, anchor, category, onClose, onAction }) {
  const ref = React.useRef(null);
  const dragControls = useDragControls();
  React.useEffect(() => {
    if (!open) return undefined;
    const close = (e) => {
      if (ref.current && ref.current.contains(e.target)) return;
      onClose();
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('contextmenu', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('contextmenu', close);
    };
  }, [open, onClose]);

  if (!open || !category || !anchor) return null;
  const menuPos = {
    x: Math.max(10, Math.min(anchor.x, window.innerWidth - 236)),
    y: Math.max(10, Math.min(anchor.y, window.innerHeight - 80)),
  };
  const dragBounds = {
    left: Math.min(0, 10 - menuPos.x),
    right: Math.max(0, window.innerWidth - menuPos.x - 236),
    top: Math.min(0, 10 - menuPos.y),
    bottom: Math.max(0, window.innerHeight - menuPos.y - 80),
  };

  const items = [
    { icon: <Pencil size={13} />, label: 'Rename / recolor', action: 'edit' },
    category.private
      ? { icon: <EyeOff size={13} />, label: 'Remove privacy', action: 'remove-private' }
      : { icon: <Lock size={13} />, label: 'Set as private (Ghost)…', action: 'set-private' },
    { icon: <ArrowUp size={13} />, label: 'Move up', action: 'up' },
    { icon: <ArrowDown size={13} />, label: 'Move down', action: 'down' },
    { divider: true },
    { icon: <Trash2 size={13} />, label: 'Delete category', action: 'delete', danger: true },
  ];

  return renderForegroundPortal(
    <motion.div
      ref={ref}
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={dragBounds}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{ position: 'fixed', top: menuPos.y, left: menuPos.x, zIndex: 200 }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.stopPropagation()}
      data-testid="category-context-menu"
      className="w-56 overflow-hidden rounded-lg hairline glass shadow-2xl py-1"
    >
      <div
        onPointerDown={(e) => dragControls.start(e)}
        className="cursor-move px-3 pt-1 pb-2 text-[10px] uppercase tracking-wider text-muted select-none flex items-center gap-1.5"
        title="Drag to move"
      >
        <GripVertical size={10} /> {category.name}
      </div>
      {items.map((it, i) =>
        it.divider ? (
          <Divider key={i} />
        ) : (
          <Item
            key={it.action}
            icon={it.icon}
            label={it.label}
            danger={it.danger}
            testid={`cat-ctx-${it.action}-${category.id}`}
            onClick={() => onAction(it.action)}
          />
        )
      )}
    </motion.div>,
  );
}


/* ---------------- Pinned strip ---------------- */
/**
 * PinnedStrip — horizontal row of pinned games shown above ALL categories.
 * Stays full-width above both columns in two-row mode (it's rendered outside
 * the column-split logic). Max 5 enforced by App.jsx on pin action.
 */
export function PinnedStrip({ games, selectedId, onSelect, onContext }) {
  if (!games || games.length === 0) return null;
  return (
    <div
      className="mb-2 mt-1 rounded-md hairline bg-panel/40 px-2 py-1.5"
      data-testid="pinned-strip"
    >
      <div className="mb-1 flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-[9.5px] uppercase tracking-[0.22em] text-muted">
          <Pin size={9} className="text-[rgb(var(--accent))]" />
          Pinned
        </div>
        <div className="text-[9px] text-muted/60">{games.length}/5</div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {games.map((g) => (
          <button
            key={g.id}
            data-testid={`pinned-tile-${g.id}`}
            onClick={() => onSelect(g.id)}
            onContextMenu={(e) => {
              e.preventDefault();
              onContext('open-menu', g, { x: e.clientX, y: e.clientY });
            }}
            className={cn(
              'group relative flex items-center gap-1.5 rounded-md px-2 h-7 text-[10.5px] font-medium transition-all',
              selectedId === g.id
                ? 'bg-[rgb(var(--accent)/0.18)] text-ink shadow-[inset_0_0_0_1px_rgb(var(--accent)/0.55)]'
                : 'bg-surface/40 text-muted hover:text-ink hover:bg-[rgb(var(--accent)/0.10)]'
            )}
            style={{ maxWidth: 140 }}
            title={g.name}
          >
            <span className="h-4 w-4 shrink-0 overflow-hidden rounded-sm hairline bg-surface/60">
              {(g.icon || g.coverUrl) ? (
                <img src={g.icon || g.coverUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="grid h-full w-full place-items-center text-[7px] text-muted">
                  {(g.name || '?').slice(0, 1).toUpperCase()}
                </span>
              )}
            </span>
            <span className="truncate">{g.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
