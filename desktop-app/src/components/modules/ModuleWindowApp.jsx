import React from 'react';
import NeoLounge from '../lounge/NeoLounge';
import AddonPage from '../addons/AddonPage';
import { applyStockThemePalette, setCustomThemes } from '../../themes/stock-theme-registry.mjs';
import { setSoundPack } from '../../lib/sound';
import ControllerNavigationBridge from '../controller/ControllerNavigationBridge';

export default function ModuleWindowApp() {
  const [context, setContext] = React.useState(null);
  const [error, setError] = React.useState('');
  const pendingRequests = React.useRef(new Set());
  React.useEffect(() => {
    let live = true; let received = false; let base = null; let pendingPatch = {};
    const update = value => {
      if (!live) return;
      if (!value?.ok) { setError(value?.error || 'Module unavailable.'); return; }
      if (value.patch && !base) { pendingPatch = { ...pendingPatch, ...value.lounge }; return; }
      if (value.patch) base = { ...base, lounge: { ...base.lounge, ...value.lounge } };
      else { received = true; base = value; if (Object.keys(pendingPatch).length) { base = { ...base, lounge: { ...base.lounge, ...pendingPatch } }; pendingPatch = {}; } }
      setContext(base);
    };
    const unsubscribe = window.api?.onModuleContext?.(update);
    Promise.resolve(window.api?.moduleSnapshot?.()).then(value => { if (!received) update(value); }).catch(() => live && setError('The module bridge could not start.'));
    return () => { live = false; unsubscribe?.(); };
  }, []);
  const request = React.useCallback(async action => {
    const job = Promise.resolve(window.api?.moduleRequest?.(action));
    pendingRequests.current.add(job);
    try {
      const result = await job;
      if (!result?.ok) setError(result?.error || 'Core request failed.');
      return result?.ok === true;
    } catch { setError('The core module bridge could not complete this request.'); return false; }
    finally { pendingRequests.current.delete(job); }
  }, []);
  const close = React.useCallback(async () => {
    window.dispatchEvent(new Event('neolib:lounge-flush'));
    let timer;
    try { await Promise.race([Promise.allSettled([...pendingRequests.current]), new Promise(resolve => { timer = window.setTimeout(resolve, 1500); })]); }
    finally { window.clearTimeout(timer); }
    return (await window.api?.closeModule?.())?.ok === true;
  }, []);
  React.useEffect(() => window.api?.onModuleCloseRequest?.(() => { void close(); }), [close]);
  const value = context?.lounge;
  const theme = value?.theme || context?.theme || 'synthwave';
  React.useEffect(() => {
    setCustomThemes(value?.installedCustomThemes || []);
    document.documentElement.setAttribute('data-theme', theme.startsWith('custom:') ? 'custom' : theme);
    applyStockThemePalette(document.documentElement, theme);
    document.documentElement.setAttribute('data-motion-cadence', value?.themeSettings?.motionCadence || 'full');
    document.documentElement.setAttribute('data-neolib-cursor', value?.themeSettings?.cursorTheme || 'windows');
    setSoundPack(value?.resting || value?.soundsEnabled === false ? 'none' : value?.themeSettings?.soundPack || 'synthwave');
    return () => setSoundPack('none');
  }, [theme, value?.installedCustomThemes, value?.resting, value?.soundsEnabled, value?.themeSettings]);
  const saveStorage = React.useCallback(storage => { void request({ type: 'storage', value: storage }); }, [request]);
  if (!context) return <main className="flex h-screen flex-col items-center justify-center gap-4 bg-surface text-ink"><p>{error || 'Starting module…'}</p><button type="button" onClick={close}>Back to NEO-LIB</button></main>;
  return <main className="h-screen w-screen bg-surface text-ink" data-testid="module-window">
    {context.official?.official === true && value ? <>
      <ControllerNavigationBridge enabled={value.controllerEnabled} preferredFingerprint={value.themeSettings?.preferredControllerFingerprint || ''} resting={false} privacyEpoch={value.games.map(game => game.id).join('|')} onBlockedLaunch={() => setError('Use the visible Launch button with mouse or keyboard.')} />
      <NeoLounge {...value} onExit={close} onPreferencesChange={preferences => { void request({ type: 'preferences', value: preferences }); }} onResumeChange={resume => { void request({ type: 'resume', value: resume }); }} onSavedPresetsChange={presets => { void request({ type: 'presets', value: presets }); }} onLayoutChange={layout => { void request({ type: 'layout', value: layout }); }} onRequestPrivateGames={() => { void request({ type: 'unlock' }); }} onLaunch={(game, token) => request({ type: 'launch', gameId: game.id, token })} />
      <span className="pointer-events-none fixed bottom-1 right-2 z-[9900] rounded bg-black/40 px-2 py-1 text-[9px] text-white/75" data-testid="official-module-owner">Official Lounge module · NEO-LIB</span>
    </> : <AddonPage namespace="module" key={context.module.id} addon={context.module} config={context.config} games={context.games} theme={context.theme} onStorageChange={saveStorage} onClose={close} />}
    {error && <div role="alert" className="fixed right-4 top-4 z-[10000] max-w-sm rounded border border-red-300/50 bg-black/90 p-3 text-sm text-red-100"><p>{error}</p><button type="button" onClick={() => setError('')}>Dismiss</button><button type="button" className="ml-4" onClick={close}>Back to NEO-LIB</button></div>}
  </main>;
}
