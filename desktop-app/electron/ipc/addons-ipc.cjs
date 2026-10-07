const { registerWidgetsIpc } = require('./widgets-ipc.cjs');
const { createWidgetPackageService, normalizeManifest } = require('../widgets/widget-package-service.cjs');

// Same bounded installer and contracts, separate manifests and private root.
function createAddonPackageService({ fsp, path, addonsDir, now }) {
  return createWidgetPackageService({ fsp, path, widgetsDir: addonsDir, now,
    manifestName: 'addon.json', manifestNormalizer: raw => {
      if (raw?.kind !== 'page') return null;
      return normalizeManifest({ ...raw, layout: { minCols: 1, minRows: 1, defaultCols: 1, defaultRows: 1 } });
    },
  });
}

function registerAddonsIpc({ registerIpc, addons }) {
  const handlers = {};
  registerWidgetsIpc({ registerIpc: (channel, handler) => { handlers[channel] = handler; }, widgets: addons });
  registerIpc('addons:import', handlers['widgets:import']);
  registerIpc('addons:update', handlers['widgets:update']);
  registerIpc('addons:list', handlers['widgets:list']);
  registerIpc('addons:runtime', handlers['widgets:runtime']);
  registerIpc('addons:remove', handlers['widgets:remove']);
  registerIpc('addons:restore', handlers['widgets:restore']);
}

function guardAddonNavigation(event) {
  // Source documents must not navigate to a new document and shed their CSP.
  const isPage = frame => frame?.url === 'about:srcdoc' || String(frame?.name || '').startsWith('neo-lib-addon:');
  if ((isPage(event.frame) || isPage(event.initiator)) && event.url !== 'about:srcdoc') event.preventDefault();
}

module.exports = { createAddonPackageService, registerAddonsIpc, guardAddonNavigation };
