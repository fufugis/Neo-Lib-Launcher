const GAME_PROTOCOL = /^(?:steam:\/\/run\/|com\.epicgames\.launcher:\/\/apps\/.*(?:action=launch|launch)|uplay:\/\/launch\/|battlenet:\/\/|ea(?:desktop)?:\/\/.*launch|riotclient:\/\/)/i;
const { isAllowedWindowsSettingsRoute } = require('./windows-settings-routes.cjs');

function createAppOsService({ app, shell, fsp, path, execPath, recordLaunchSafety }) {
  if (typeof app?.setLoginItemSettings !== 'function' || typeof app?.getLoginItemSettings !== 'function'
    || typeof shell?.openExternal !== 'function' || typeof shell?.openPath !== 'function' || typeof shell?.showItemInFolder !== 'function'
    || typeof fsp?.stat !== 'function' || typeof path?.dirname !== 'function' || typeof recordLaunchSafety !== 'function') {
    throw new TypeError('createAppOsService requires app, shell, fsp, path and recordLaunchSafety.');
  }

  async function openExternal(url) {
    const target = String(url || '');
    if (GAME_PROTOCOL.test(target)) {
      recordLaunchSafety('blocked-game-protocol-external', { target: target.slice(0, 180) });
      return { ok: false, error: 'Launch safety blocked a game protocol outside the Launch action.' };
    }
    if (/^ms-settings:/i.test(target) && !isAllowedWindowsSettingsRoute(target)) {
      recordLaunchSafety('blocked-windows-settings-route', { route: target.slice(0, 120) });
      return { ok: false, error: 'That Windows settings page is not approved by NEO-LIB.' };
    }
    recordLaunchSafety('external-open', { protocol: target.split(':', 1)[0].slice(0, 32) || 'unknown' });
    await shell.openExternal(target);
    return { ok: true };
  }

  async function revealInFolder(value) {
    if (!value || typeof value !== 'string') return { ok: false, error: 'No launch path is configured for this game.' };
    try {
      const stat = await fsp.stat(value);
      if (stat.isDirectory()) {
        const error = await shell.openPath(value);
        return error ? { ok: false, error } : { ok: true, opened: value };
      }
      shell.showItemInFolder(value);
      return { ok: true, opened: path.dirname(value) };
    } catch {
      const directory = path.dirname(value);
      const error = await shell.openPath(directory);
      return error
        ? { ok: false, error: 'The configured file no longer exists and its containing folder could not be opened.' }
        : { ok: true, opened: directory, missingTarget: true };
    }
  }

  async function openContainingDir(value) {
    if (!value) return undefined;
    await shell.openPath(path.dirname(value));
    return undefined;
  }

  async function setAutoStart(enabled) {
    try {
      app.setLoginItemSettings({ openAtLogin: !!enabled, path: execPath });
      return { ok: true };
    } catch (error) {
      return { ok: false, error: String(error) };
    }
  }

  async function getAutoStart() {
    try { return !!app.getLoginItemSettings().openAtLogin; } catch { return false; }
  }

  async function openPath(value) {
    if (!value || typeof value !== 'string') return { ok: false, error: 'No path provided.' };
    const error = await shell.openPath(value);
    return error ? { ok: false, error } : { ok: true };
  }

  return Object.freeze({ openExternal, revealInFolder, openContainingDir, setAutoStart, getAutoStart, openPath });
}

module.exports = { createAppOsService };
