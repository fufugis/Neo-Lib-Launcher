function createAppLifecycleService({
  buildTray, destroyTray, clearDiscordActivity, getDiscordSocket, setDiscordSocket,
  getDiscordReady, setDiscordReady, getDiscordAppId, quitApp,
}) {
  const dependencies = [buildTray, destroyTray, clearDiscordActivity, getDiscordSocket, setDiscordSocket, getDiscordReady, setDiscordReady, getDiscordAppId, quitApp];
  if (dependencies.some(dependency => typeof dependency !== 'function')) {
    throw new TypeError('createAppLifecycleService requires tray and Discord state callbacks.');
  }

  async function setMinimizeToTray(enabled) {
    if (enabled) buildTray();
    else destroyTray();
    return enabled;
  }

  async function setDiscordRpc(enabled) {
    if (!enabled) {
      clearDiscordActivity();
      const socket = getDiscordSocket();
      if (socket) {
        try { socket.destroy(); } catch { /* retain existing best-effort behavior */ }
        setDiscordSocket(null);
        setDiscordReady(false);
      }
    }
    return { ok: true, hasAppId: !!getDiscordAppId() };
  }

  async function discordRpcStatus() {
    return { hasAppId: !!getDiscordAppId(), installed: true, ready: !!getDiscordReady() };
  }

  async function quit() {
    quitApp();
    return true;
  }

  return Object.freeze({ setMinimizeToTray, setDiscordRpc, discordRpcStatus, quit });
}

module.exports = { createAppLifecycleService };
