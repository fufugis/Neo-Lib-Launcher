export function launcherEntry(item, kind) {
  return {
    name: item.name || 'Unnamed game',
    exePath: item.exe || item.launchExe || item.exePath || item.installdir || item.launchUrl,
    launchUrl: item.launchUrl, launchArgs: item.launchArgs || '',
    launcher: kind, source: `${kind}-import`,
    // Other launchers' app IDs must never be interpreted as Steam IDs.
    appid: kind === 'steam' ? item.appid : undefined,
    steamAppId: kind === 'steam' ? item.appid : undefined,
    launcherProductId: item.launcherProductId || item.appid || item.gogId,
    gogId: item.gogId, steamBuildId: kind === 'steam' ? item.buildid : undefined,
    installedVersion: item.installedVersion || '',
    categoryIds: [`__launcher_${kind}__`], genres: [], genreTags: [],
  };
}

export async function boundedLauncherScan(scan, timeoutMs = 30000) {
  let timer;
  try {
    return await Promise.race([Promise.resolve().then(scan), new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('Launcher scan timed out. No games were added. Try again or choose the game folder.')), timeoutMs);
    })]);
  } finally { clearTimeout(timer); }
}
