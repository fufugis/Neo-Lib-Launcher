import React from 'react';
import { welcomeFinishPatch } from './first-run-model.mjs';

export function useFirstRunFlow({ nativeApi, settings, updateSetting, startupReady, setShowWizard, showWizard, setTutorialOpen, setTutorialVisualsOpen, setVisualsOpen, setShowSettings, version, tutorialOpen }) {
  const [firstRunFlow, setFirstRunFlow] = React.useState({ phase: 'loading', firstRun: false, next: 'explore' });
  const [improveNeolib, setImproveNeolib] = React.useState(false);
  const [welcomeBusy, setWelcomeBusy] = React.useState(false);
  const [welcomeError, setWelcomeError] = React.useState('');
  const welcomeSaving = React.useRef(false);
  const firstRunPhase = firstRunFlow.phase;
  React.useEffect(() => {
    if (startupReady && firstRunPhase === 'welcome' && firstRunFlow.firstRun && settings.welcomeStartedVersion !== 1) updateSetting({ welcomeStartedVersion: 1 });
  }, [startupReady, firstRunPhase, firstRunFlow.firstRun, settings.welcomeStartedVersion, updateSetting]);
  /* --- "What's new" changelog modal — shown once per installed version --- */
  const [changelogOpen, setChangelogOpen] = React.useState(false);
  React.useEffect(() => { if (startupReady && firstRunPhase === 'notes') setChangelogOpen(true); }, [startupReady, firstRunPhase]);
  const chooseFirstRun = async choice => {
    if (welcomeSaving.current) return;
    welcomeSaving.current = true; setWelcomeBusy(true); setWelcomeError('');
    try {
      const next = { ...settings, ...welcomeFinishPatch(choice, improveNeolib) };
      if (nativeApi?.saveSettings) { const result = await nativeApi.saveSettings(next); if (result === false || result?.ok === false) throw new Error('Save failed'); }
      else localStorage.setItem('neolib:first-run', JSON.stringify(next));
      updateSetting(welcomeFinishPatch(choice, improveNeolib));
      setFirstRunFlow({ phase: 'notes', firstRun: true, next: choice === 'wizard' ? 'wizard' : 'explore' });
    } catch { setWelcomeError('Could not save your setup choices. Please try again; nothing was sent.'); }
    finally { welcomeSaving.current = false; setWelcomeBusy(false); }
  };
  const closeStartupNotes = () => {
    setChangelogOpen(false);
    const wizard = firstRunPhase === 'notes' && firstRunFlow.firstRun && firstRunFlow.next === 'wizard';
    updateSetting({ lastSeenVersion: version, ...(firstRunFlow.firstRun ? { firstRunPending: wizard ? 'wizard' : '' } : {}) });
    if (firstRunPhase === 'notes') {
      setFirstRunFlow(previous => ({ ...previous, phase: wizard ? 'wizard' : 'ready' }));
      if (wizard) setShowWizard(true);
    }
  };
  const closeStartupTutorial = () => {
    setTutorialVisualsOpen(false); setVisualsOpen(false); setShowSettings(false); setTutorialOpen(false);
    if (firstRunPhase === 'tutorial') { setFirstRunFlow(previous => ({ ...previous, phase: 'welcome' })); updateSetting({ mode: 'home' }); }
  };
  const startFirstRunTutorial = () => { setFirstRunFlow(previous => ({ ...previous, phase: 'tutorial' })); setTutorialOpen(true); };
  React.useEffect(() => {
    if (firstRunPhase !== 'wizard' || showWizard) return;
    updateSetting({ firstRunPending: '' });
    setFirstRunFlow(previous => ({ ...previous, phase: 'ready' }));
  }, [firstRunPhase, showWizard, updateSetting]);
  const isElectron = Boolean(nativeApi);
  const [fungistWelcomeKey, setFungistWelcomeKey] = React.useState(0);
  const postIntroGreetingScheduled = React.useRef(false);
  React.useEffect(() => {
    // Open tutorial if user hasn't dismissed it AND setting allows
    const seen = isElectron ? settings.tutorialSeen : (typeof localStorage !== 'undefined' && localStorage.getItem('neo-lib-tutorial-seen') === '1');
    if (startupReady && firstRunPhase === 'ready' && (!seen || settings.tutorialAlwaysShow)) {
      // Never put tutorial audio or a spotlight over the startup sequence.
      const t = setTimeout(() => setTutorialOpen(true), 340);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [startupReady, firstRunPhase, settings.tutorialSeen, settings.tutorialAlwaysShow]);

  React.useEffect(() => {
    if (!startupReady || firstRunPhase !== 'ready' || tutorialOpen || postIntroGreetingScheduled.current) return undefined;
    const timer = window.setTimeout(() => {
      postIntroGreetingScheduled.current = true;
      setFungistWelcomeKey(Date.now());
    }, 620);
    return () => window.clearTimeout(timer);
  }, [startupReady, firstRunPhase, tutorialOpen]);
  return { fungistWelcomeKey, setFirstRunFlow, firstRunPhase, improveNeolib, setImproveNeolib, welcomeBusy, welcomeError, chooseFirstRun, closeStartupNotes, closeStartupTutorial, startFirstRunTutorial, changelogOpen, setChangelogOpen };
}
