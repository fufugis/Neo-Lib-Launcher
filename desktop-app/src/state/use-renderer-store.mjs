import React from 'react';
import { EMPTY_LIBRARY } from './library-state.mjs';
import { DEFAULT_SETTINGS, mergeSettings } from './settings-state.mjs';

function useDocumentWriter(nativeApi, method) {
  const [status, setStatus] = React.useState({ pending: false, error: false });
  const latest = React.useRef(null), generation = React.useRef(0), mounted = React.useRef(true);
  React.useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const write = React.useCallback(async value => {
    latest.current = value;
    if (!nativeApi?.[method]) return true; // Browser demo has no native storage.
    const run = ++generation.current;
    if (mounted.current) setStatus(previous => ({ ...previous, pending: true }));
    let saved = false;
    try { saved = await nativeApi[method](value) === true; } catch { /* Keep the unsaved snapshot available for retry. */ }
    if (mounted.current && run === generation.current) setStatus({ pending: false, error: !saved });
    return saved;
  }, [nativeApi, method]);
  const retry = React.useCallback(() => latest.current == null ? Promise.resolve(true) : write(latest.current), [write]);
  return { status, write, retry };
}

export function useRendererStore(nativeApi, { ready = true } = {}) {
  const [library, setLibrary] = React.useState(() => ({ ...EMPTY_LIBRARY }));
  const [settings, setSettings] = React.useState(() => ({ ...DEFAULT_SETTINGS }));
  const [selectedId, setSelectedId] = React.useState(null);
  const [selectedToolId, setSelectedToolId] = React.useState(null);
  const [unlockedCategories, setUnlockedCategories] = React.useState([]);
  const skipLibraryPersist = React.useRef(true);
  const skipSettingsPersist = React.useRef(true);
  const libraryWriter = useDocumentWriter(nativeApi, 'saveLibrary');
  const settingsWriter = useDocumentWriter(nativeApi, 'saveSettings');

  React.useEffect(() => {
    if (!ready) return;
    if (skipLibraryPersist.current) { skipLibraryPersist.current = false; return; }
    libraryWriter.write(library);
  }, [library, libraryWriter.write, ready]);

  React.useEffect(() => {
    if (!ready) return;
    if (skipSettingsPersist.current) { skipSettingsPersist.current = false; return; }
    settingsWriter.write(settings);
  }, [settings, settingsWriter.write, ready]);

  const persistSettings = React.useCallback((next) => {
    const safe = mergeSettings(DEFAULT_SETTINGS, next);
    setSettings(safe);
  }, []);

  const updateSetting = React.useCallback((patch) => {
    setSettings((previous) => {
      const next = mergeSettings(previous, patch);
      return next;
    });
  }, []);
  const retrySaves = React.useCallback(() => Promise.all([libraryWriter.retry(), settingsWriter.retry()]), [libraryWriter.retry, settingsWriter.retry]);

  return {
    library, setLibrary, settings, setSettings,
    selectedId, setSelectedId, selectedToolId, setSelectedToolId,
    unlockedCategories, setUnlockedCategories,
    persistSettings, updateSetting,
    saveStatus: { library: libraryWriter.status, settings: settingsWriter.status }, retrySaves,
    saveSettingsWithFeedback: settingsWriter.write,
    saveLibraryWithFeedback: libraryWriter.write,
  };
}
