import React from 'react';
import { setCustomThemes, customThemeList } from './stock-theme-registry.mjs';

export function useCustomThemes(nativeApi) {
  const [installedCustomThemes, setInstalledCustomThemes] = React.useState([]);
  const refreshCustomThemes = React.useCallback(async () => {
    if (!nativeApi?.listThemes) return;
    const result = await nativeApi.listThemes();
    if (!result?.ok) return;
    setCustomThemes(result.themes);
    setInstalledCustomThemes(customThemeList());
  }, [nativeApi]);
  React.useEffect(() => { refreshCustomThemes(); }, [refreshCustomThemes]);
  return { installedCustomThemes, refreshCustomThemes };
}
