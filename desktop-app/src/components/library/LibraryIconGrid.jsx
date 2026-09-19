import React from 'react';
import { LibraryGameRow } from './LibraryTree';

/**
 * Compact icon-only Library. The lane setting intentionally controls how many
 * icons fit across the sidebar while the normal vertical Library scroll stays
 * familiar. Category names, pinned shelves and game labels are omitted.
 */
export default function LibraryIconGrid({
  games = [], selectedId, iconSize = 48, spacing = 8, rows = 3,
  categories = [], onSelect, onGameContext,
}) {
  const safeIconSize = Math.max(24, Math.min(96, Number(iconSize) || 48));
  const safeSpacing = Math.max(0, Math.min(24, Number(spacing) || 0));
  const safeRows = Math.max(1, Math.min(3, Math.round(Number(rows) || 3)));
  const size = { id: safeIconSize < 36 ? 'small' : safeIconSize > 64 ? 'big' : 'medium', rowH: safeIconSize, icon: safeIconSize, font: 0 };

  return (
    <div
      data-testid="library-icon-grid"
      className="grid justify-center py-1"
      style={{ gridTemplateColumns: `repeat(${safeRows}, ${safeIconSize}px)`, gap: safeSpacing }}
    >
      {games.map((game, index) => (
        <LibraryGameRow
          key={game.id}
          g={game}
          size={size}
          iconOnly
          flatList
          selected={selectedId === game.id}
          indexInCat={index}
          sectionGames={games}
          fromCatId={null}
          onClick={() => onSelect?.(game.id)}
          onContext={(action) => onGameContext?.(action, game)}
          onReorderInCat={() => {}}
          onMoveBetween={() => {}}
          categories={categories}
        />
      ))}
      {!games.length && (
        <div className="col-span-full px-3 py-4 text-center text-[11px] italic text-muted/75">
          No visible games match this view.
        </div>
      )}
    </div>
  );
}
