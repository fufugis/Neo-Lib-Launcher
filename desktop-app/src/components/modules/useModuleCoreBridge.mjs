import React from 'react';
import { moduleSnapshot, moduleStorage } from './module-model.mjs';
import { customThemePackages } from '../../themes/stock-theme-registry.mjs';

// The main renderer stays the sole persistence and game-launch owner.
export function useModuleCoreBridge(options) {
  const { nativeApi, settings } = options;
  const preparedThemes = React.useMemo(() => customThemePackages(), [options.installedCustomThemes]);
  const snapshot = React.useMemo(() => moduleSnapshot({ ...options, installedCustomThemes: preparedThemes }), [options.loungeGames, options.publicGames, settings, options.resting, options.restReason, options.privateGameCount, options.privateGamesUnlocked, preparedThemes]);
  const latest = React.useRef({ options, snapshot }); latest.current = { options, snapshot };
  const previous = React.useRef({ lounge: {}, custom: {} });
  React.useEffect(() => {
    const delta = { lounge: {}, custom: {} }; let changed = false;
    for (const section of ['lounge', 'custom']) for (const [key, value] of Object.entries(snapshot[section])) {
      const encoded = JSON.stringify(value);
      if (previous.current[section][key] !== encoded) { previous.current[section][key] = encoded; delta[section][key] = value; changed = true; }
    }
    if (changed) void nativeApi?.publishModuleContext?.(delta).then(result => { if (!result?.ok) previous.current = { lounge: {}, custom: {} }; }).catch(() => { previous.current = { lounge: {}, custom: {} }; });
  }, [nativeApi, snapshot]);
  React.useEffect(() => nativeApi?.onModuleRequest?.(async message => {
    const { options: current } = latest.current;
    const { moduleId, action } = message;
    let response;
    try {
      if (moduleId === 'neolib.lounge') {
        if (action.type === 'preferences') current.updateSetting({ loungePreferences: action.value });
        else if (action.type === 'resume') current.updateSetting({ loungeResume: action.value });
        else if (action.type === 'presets') current.updateSetting({ loungeSavedPresets: action.value });
        else if (action.type === 'layout' && ['wall', 'browser'].includes(action.value)) current.updateSetting({ loungeLayout: action.value });
        else if (action.type === 'unlock') { await current.lounge.exit(); current.onUnlock(); }
        else if (action.type === 'launch') {
          const game = current.loungeGames.find(item => item.id === action.gameId);
          if (!game) throw new Error('Unavailable game');
          current.lounge.preserveGameLaunch(); const ok = await current.launchGame(game, action.token); if (!ok) current.lounge.cancelGameLaunch(); response = { ok };
        } else if (['updates', 'storageScan'].includes(action.type)) {
          const ids = new Set((action.value?.games || []).map(game => game.id));
          const games = current.loungeGames.filter(game => ids.has(game.id));
          const data = action.type === 'updates' ? await nativeApi.scanGameUpdates({ games, force: action.value?.force === true }) : await nativeApi.scanGameStorage({ games, force: action.value?.force === true });
          response = { ok: data?.ok !== false, data };
        } else throw new Error('Unsupported request');
      } else {
        const config = current.settings.moduleConfig?.[moduleId];
        if (current.settings.modulesEnabled !== true || !config?.enabled || !config.grants?.includes('storage') || action.type !== 'storage') throw new Error('Permission denied');
        current.updateSetting({ moduleConfig: { ...current.settings.moduleConfig, [moduleId]: { ...config, storage: moduleStorage(action.value) } } });
      }
      response ||= { ok: true };
    } catch { response = { ok: false, error: 'Core could not complete this module request.' }; }
    await nativeApi.completeModuleRequest({ requestId: message.requestId, ...response });
  }), [nativeApi]);
  // Explicit latest-state handoff prevents opening against an earlier snapshot.
  const openLoungeModule = React.useCallback(async () => {
    const prepared = await nativeApi?.publishModuleContext?.(latest.current.snapshot);
    return prepared?.ok === true ? latest.current.options.lounge.enter() : false;
  }, [nativeApi]);
  return { openLoungeModule };
}
