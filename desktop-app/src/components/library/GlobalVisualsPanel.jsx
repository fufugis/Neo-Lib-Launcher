import React from 'react';
import LibraryVisualsPopover from './LibraryVisualsPopover';

export default function GlobalVisualsPanel({ settings, sidebarWidth, wallActive, onUpdateSetting, onOpenFeedback, onClose }) {
  const theme = settings.theme || 'synthwave';
  const perThemeLevel = settings.effectsLevelByTheme?.[theme];
  return <LibraryVisualsPopover
    sidebarWidth={wallActive ? 0 : sidebarWidth}
    rowSize={settings.rowSize ?? 44}
    catTextSize={settings.catTextSize ?? 11}
    catGlow={settings.catGlow ?? 40}
    rowGap={settings.rowGap ?? 2}
    catGap={settings.catGap ?? 8}
    catTopGap={settings.catTopGap ?? 4}
    iconPosition={settings.iconPosition || 'left'}
    categoryMarkerMode={settings.categoryMarkerMode || (settings.showCategoryDot === false ? 'background' : 'dot')}
    onChangeRowSize={(rowSize) => onUpdateSetting({ rowSize })}
    onChangeCatTextSize={(catTextSize) => onUpdateSetting({ catTextSize })}
    onChangeCatGlow={(catGlow) => onUpdateSetting({ catGlow })}
    onChangeRowGap={(rowGap) => onUpdateSetting({ rowGap })}
    onChangeCatGap={(catGap) => onUpdateSetting({ catGap })}
    onChangeCatTopGap={(catTopGap) => onUpdateSetting({ catTopGap })}
    onChangeIconPosition={(iconPosition) => onUpdateSetting({ iconPosition })}
    onChangeCategoryMarkerMode={(categoryMarkerMode) => onUpdateSetting({ categoryMarkerMode, showCategoryDot: categoryMarkerMode === 'dot' })}
    showSubcatStrip={settings.showSubcatStrip !== false}
    onToggleSubcatStrip={(showSubcatStrip) => onUpdateSetting({ showSubcatStrip })}
    nameTextSize={Number.isFinite(settings.nameTextSize) ? settings.nameTextSize : null}
    onChangeNameTextSize={(nameTextSize) => onUpdateSetting({ nameTextSize })}
    libraryFont={settings.libraryFont || 'system'}
    libraryFontWeight={settings.libraryFontWeight || 'regular'}
    libraryFontCursive={settings.libraryFontCursive === true}
    onChangeLibraryFont={(libraryFont) => onUpdateSetting({ libraryFont })}
    onChangeLibraryFontWeight={(libraryFontWeight) => onUpdateSetting({ libraryFontWeight })}
    onChangeLibraryFontCursive={(libraryFontCursive) => onUpdateSetting({ libraryFontCursive })}
    effectsLevel={Number.isFinite(perThemeLevel) ? perThemeLevel : Number.isFinite(settings.effectsLevel) ? settings.effectsLevel : 2}
    currentTheme={theme}
    onChangeEffectsLevel={(effectsLevel) => onUpdateSetting({ effectsLevelByTheme: { ...(settings.effectsLevelByTheme || {}), [theme]: effectsLevel }, effectsLevel })}
    motionCadence={settings.motionCadence || 'full'}
    onChangeMotionCadence={(motionCadence) => onUpdateSetting({ motionCadence })}
    bgTextureId={settings.bgTextureId || 'none'}
    bgTextureOpacity={Number.isFinite(settings.bgTextureOpacity) ? settings.bgTextureOpacity : 40}
    onChangeBgTextureId={(bgTextureId) => onUpdateSetting({ bgTextureId })}
    onChangeBgTextureOpacity={(bgTextureOpacity) => onUpdateSetting({ bgTextureOpacity })}
    cursorTheme={settings.cursorTheme || 'windows'}
    onChangeCursorTheme={(cursorTheme) => onUpdateSetting({ cursorTheme })}
    navigationLayout={settings.navigationLayout === 'sidebar' ? 'sidebar' : 'top'}
    onChangeNavigationLayout={(navigationLayout) => onUpdateSetting({ navigationLayout: navigationLayout === 'sidebar' ? 'sidebar' : 'top' })}
    twoRow={!!settings.twoRow}
    onToggleTwoRow={(twoRow) => onUpdateSetting({ twoRow })}
    libraryIconMode={settings.libraryIconMode === true}
    libraryIconSize={settings.libraryIconSize ?? 48}
    libraryIconSpacing={settings.libraryIconSpacing ?? 8}
    libraryIconRows={settings.libraryIconRows ?? 3}
    onToggleLibraryIconMode={(libraryIconMode) => onUpdateSetting({ libraryIconMode })}
    onChangeLibraryIconSize={(libraryIconSize) => onUpdateSetting({ libraryIconSize })}
    onChangeLibraryIconSpacing={(libraryIconSpacing) => onUpdateSetting({ libraryIconSpacing })}
    onChangeLibraryIconRows={(libraryIconRows) => onUpdateSetting({ libraryIconRows })}
    onOpenFeedback={onOpenFeedback}
    onClose={onClose}
  />;
}
