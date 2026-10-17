export function firstRunState(settings = {}, library = {}, currentVersion = '') {
  if (settings.welcomeStartedVersion === 1 && settings.welcomeCompleted !== true) return { phase: 'welcome', firstRun: true, next: 'explore' };
  const existing = settings.welcomeCompleted === true || Boolean(settings.lastSeenVersion) || settings.tutorialSeen === true || (library.games || []).length > 0;
  const next = settings.firstRunChoice === 'wizard' ? 'wizard' : 'explore';
  if (settings.firstRunPending === 'notes' || settings.firstRunPending === 'wizard') return { phase: 'notes', firstRun: true, next };
  if (!existing) return { phase: 'welcome', firstRun: true, next };
  return { phase: settings.lastSeenVersion && settings.lastSeenVersion !== currentVersion ? 'notes' : 'ready', firstRun: false, next: 'explore' };
}

export function welcomeFinishPatch(choice, improve) {
  return { welcomeCompleted: true, firstRun: false, firstRunPending: 'notes', firstRunChoice: choice === 'wizard' ? 'wizard' : 'explore',
    tutorialSeen: true, usageReportingEnabled: improve === true, usageConsentVersion: improve === true ? 2 : 0 };
}
