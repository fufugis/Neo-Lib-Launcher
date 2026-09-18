// IPC surface for the custom title-bar controls. The window is resolved at
// invocation time so recreated windows do not leave handlers with stale state.
function registerWindowIpc({ registerIpc, getMainWindow }) {
  if (typeof registerIpc !== 'function' || typeof getMainWindow !== 'function') {
    throw new TypeError('registerWindowIpc requires registerIpc and getMainWindow.');
  }

  registerIpc('window:minimize', guardResult(() => getMainWindow()?.minimize(), value => value === undefined, undefined));
  registerIpc('window:toggleMaximize', guardResult(() => {
    const window = getMainWindow();
    if (!window) return false;
    if (window.isMaximized()) window.unmaximize();
    else window.maximize();
    return window.isMaximized();
  }, value => typeof value === 'boolean', false));
  registerIpc('window:close', guardResult(() => getMainWindow()?.close(), value => value === undefined, undefined));
}

module.exports = { registerWindowIpc };
const { guardResult } = require('./contract-guards.cjs');
