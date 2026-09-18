import React from 'react';
import { EMPTY_LIBRARY } from './library-state.mjs';
import { DEFAULT_SETTINGS, mergeSettings } from './settings-state.mjs';

export function useRendererStore(nativeApi) {
  const [library, setLibrary] = React.useState(() => ({ ...EMPTY_LIBRARY }));
  const [settings, setSettings] = React.useState(() => ({ ...DEFAULT_SETTINGS }));
  const [selectedId, setSelectedId] = React.useState(null);
  const [selectedToolId, setSelectedToolId] = React.useState(null);
  const [unlockedCategories, setUnlockedCategories] = React.useState([]);
  const skipLibraryPersist = React.useRef(true);

  React.useEffect(() => {
    if (skipLibraryPersist.current) { skipLibraryPersist.current = false; return; }
    nativeApi?.saveLibrary?.(library).catch(() => {});
  }, [library, nativeApi]);

  const persistSettings = React.useCallback((next) => {
    const safe = mergeSettings(DEFAULT_SETTINGS, next);
    setSettings(safe);
    nativeApi?.saveSettings?.(safe).catch(() => {});
  }, [nativeApi]);

  const updateSetting = React.useCallback((patch) => {
    setSettings((previous) => {
      const next = mergeSettings(previous, patch);
      nativeApi?.saveSettings?.(next).catch(() => {});
      return next;
    });
  }, [nativeApi]);

  return {
    library, setLibrary, settings, setSettings,
    selectedId, setSelectedId, selectedToolId, setSelectedToolId,
    unlockedCategories, setUnlockedCategories,
    persistSettings, updateSetting,
  };
}
