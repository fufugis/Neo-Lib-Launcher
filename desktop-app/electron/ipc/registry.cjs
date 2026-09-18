// Single registration point for every renderer-to-main command.
// Contract-aware handlers remain unchanged; the registry only gives them the
// channel context needed for useful, privacy-safe diagnostics.
function createIpcRegistry({ ipcMain, onFailure = () => {} }) {
  if (!ipcMain?.handle) throw new TypeError('createIpcRegistry requires Electron ipcMain.');
  const registrations = new Map();

  function handle(channel, handler) {
    if (typeof channel !== 'string' || !/^[a-z][a-z0-9-]*:[A-Za-z][A-Za-z0-9-]*$/.test(channel)) {
      throw new TypeError(`Invalid IPC channel: ${String(channel)}`);
    }
    if (typeof handler !== 'function') throw new TypeError(`IPC handler for ${channel} must be a function.`);
    if (registrations.has(channel)) throw new Error(`Duplicate IPC channel registration: ${channel}`);
    const record = Object.freeze({ channel, domain: channel.split(':', 1)[0] });
    registrations.set(channel, record);
    if (typeof handler.setFailureReporter === 'function') {
      handler.setFailureReporter(failure => onFailure({ ...record, ...failure }));
    }
    ipcMain.handle(channel, handler);
    return handler;
  }

  function list() {
    return Object.freeze(Array.from(registrations.values()));
  }

  return Object.freeze({ handle, list });
}

module.exports = { createIpcRegistry };
