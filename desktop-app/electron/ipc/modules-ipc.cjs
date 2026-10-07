const { registerWidgetsIpc } = require('./widgets-ipc.cjs');
const { createWidgetPackageService, normalizeManifest } = require('../widgets/widget-package-service.cjs');
const { guardHandler, guardResult, invalidRequest, invalidResponse, isPlainObject } = require('./contract-guards.cjs');

const LOUNGE_ID = 'neolib.lounge';
const OFFICIAL_LOUNGE = Object.freeze({ id: LOUNGE_ID, name: 'Lounge', owner: 'NEO-LIB', official: true, removable: false, apiVersion: 1 });
const jsonBound = (value, bytes = 8 * 1024 * 1024) => { try { return isPlainObject(value) && Buffer.byteLength(JSON.stringify(value)) <= bytes; } catch { return false; } };
const error = message => ({ ok: false, error: message });

function createModulePackages({ fsp, path, modulesDir, now }) {
  return createWidgetPackageService({ fsp, path, widgetsDir: modulesDir, now, manifestName: 'module.json', manifestNormalizer: raw => {
    if (raw?.kind !== 'window' || String(raw.id || '').startsWith('neolib.')) return null;
    return normalizeManifest({ ...raw, layout: { minCols: 1, minRows: 1, defaultCols: 1, defaultRows: 1 } });
  } });
}

function createModuleWindowService({ packages, getCoreWindow, createWindow, armCoreLaunch, setTimer = setTimeout, clearTimer = clearTimeout }) {
  const windows = new Map(); const pending = new Map();
  let snapshot = null; let serial = 0; let shuttingDown = false;
  const core = () => { const window = getCoreWindow(); return window && !window.isDestroyed?.() ? window.webContents : null; };
  const isTop = event => event?.sender && event.senderFrame === event.sender.mainFrame;
  const isCore = event => isTop(event) && event.sender === core();
  const recordFor = event => isTop(event) ? [...windows.values()].find(record => record.window.webContents === event.sender) : null;
  const sendCore = (channel, payload) => { const target = core(); if (target && !target.isDestroyed?.()) target.send(channel, payload); };
  const announce = () => { sendCore('modules:windows', { count: windows.size }); sendCore('window:loungeFullscreen', windows.has(LOUNGE_ID)); };
  const configFor = id => snapshot?.custom?.config?.[id];
  function contextFor(record) {
    if (record.id === LOUNGE_ID) return { ok: true, official: OFFICIAL_LOUNGE, lounge: snapshot?.lounge };
    const config = configFor(record.id);
    if (snapshot?.custom?.enabled !== true || !config?.enabled || config.version !== record.package.version) return error('Module is disabled or changed.');
    const grants = (Array.isArray(config.grants) ? config.grants : []).filter(value => record.package.permissions.includes(value));
    return { ok: true, official: false, module: record.package, config: { ...config, grants }, games: grants.includes('library.read') ? snapshot.custom.games || [] : [], theme: snapshot.custom.theme || 'synthwave' };
  }
  function discard(record) {
    if (windows.get(record.id) !== record) return;
    windows.delete(record.id);
    if (record.closeTimer) clearTimer(record.closeTimer);
    for (const [id, job] of pending) if (job.record === record) { clearTimer(job.timer); job.resolve(error('Module window closed.')); pending.delete(id); }
    announce();
    if (record.id === LOUNGE_ID && !shuttingDown && core()) getCoreWindow().show();
  }
  async function open(id = LOUNGE_ID) {
    if (!snapshot) return error('Library is not ready yet.');
    if (windows.has(id)) { windows.get(id).window.show(); windows.get(id).window.focus(); return { ok: true }; }
    if (windows.size >= 4) return error('Close a module window before opening another.');
    let packageInfo = null;
    if (id !== LOUNGE_ID) {
      packageInfo = (await packages.list()).widgets.find(item => item.id === id && item.compatible);
      const config = configFor(id);
      if (!packageInfo || snapshot?.custom?.enabled !== true || !config?.enabled || config.version !== packageInfo.version) return error('Enable and review this module first.');
      if (windows.has(id)) { windows.get(id).window.focus(); return { ok: true }; }
      if (windows.size >= 4 || !core()) return error('Module window is no longer available.');
    }
    let openedWindow;
    try {
      shuttingDown = false;
      const window = createWindow({ id, official: id === LOUNGE_ID }); openedWindow = window;
      const record = { id, window, package: packageInfo }; windows.set(id, record);
      window.on('closed', () => discard(record));
      window.on('close', event => {
        if (id !== LOUNGE_ID || record.closing || shuttingDown) return;
        event.preventDefault();
        if (record.closeTimer) return;
        // Let the renderer flush its debounced settings/resume before destruction.
        // A stalled renderer still cannot prevent the user closing the window.
        record.closeTimer = setTimer(() => { record.closing = true; if (!window.isDestroyed()) window.close(); }, 2000);
        window.webContents.send('modules:prepareClose');
      });
      window.webContents.on('render-process-gone', () => window.destroy());
      window.webContents.on('did-fail-load', (_event, _code, _description, _url, mainFrame) => { if (mainFrame) window.destroy(); });
      window.on('leave-full-screen', () => { if (id === LOUNGE_ID) window.close(); });
      window.once('ready-to-show', () => { if (!window.isDestroyed()) { window.show(); if (id === LOUNGE_ID) window.setFullScreen(true); } });
      announce(); return { ok: true };
    } catch { if (openedWindow && !openedWindow.isDestroyed()) openedWindow.destroy(); return error('Could not open module window.'); }
  }
  function publish(event, value) {
    if (!isCore(event) || !jsonBound(value) || !isPlainObject(value.lounge) || !isPlainObject(value.custom)) return error('Invalid core module snapshot.');
    snapshot = { lounge: { ...snapshot?.lounge, ...value.lounge }, custom: { ...snapshot?.custom, ...value.custom } };
    for (const record of windows.values()) {
      const context = contextFor(record);
      if (!context.ok) record.window.close();
      else if (record.id === LOUNGE_ID && record.lastSent) {
        const changed = {};
        for (const [key, item] of Object.entries(context.lounge)) if (JSON.stringify(record.lastSent[key]) !== JSON.stringify(item)) changed[key] = item;
        record.lastSent = context.lounge;
        if (Object.keys(changed).length) record.window.webContents.send('modules:context', { ok: true, patch: true, official: OFFICIAL_LOUNGE, lounge: changed });
      } else {
        record.lastSent = context.lounge;
        record.window.webContents.send('modules:context', context);
      }
    }
    return { ok: true };
  }
  function request(event, action) {
    const record = recordFor(event);
    if (!record || !jsonBound(action, 256 * 1024) || pending.size >= 16) return Promise.resolve(error('Module request rejected.'));
    const allowed = record.id === LOUNGE_ID ? ['preferences', 'resume', 'presets', 'layout', 'launch', 'unlock', 'updates', 'storageScan'] : ['storage'];
    if (!allowed.includes(action.type) || !contextFor(record).ok) return Promise.resolve(error('Module capability denied.'));
    if (action.type === 'storage' && !contextFor(record).config.grants.includes('storage')) return Promise.resolve(error('Storage permission denied.'));
    if (action.type === 'launch' && (!(snapshot.lounge.games || []).some(game => game.id === action.gameId) || typeof action.token !== 'string')) return Promise.resolve(error('Game is not available to Lounge.'));
    return new Promise(resolve => {
      const id = `module-${++serial}`;
      const timeout = ['updates', 'storageScan'].includes(action.type) ? 60000 : 10000;
      const timer = setTimer(() => { pending.delete(id); resolve(error('Core request timed out.')); }, timeout);
      pending.set(id, { resolve, timer, record });
      sendCore('modules:request', { requestId: id, moduleId: record.id, action });
    });
  }
  const complete = (event, value) => {
    if (!isCore(event) || !jsonBound(value)) return error('Only the core can complete requests.');
    const job = pending.get(value.requestId); if (!job) return error('Request expired.');
    clearTimer(job.timer); pending.delete(value.requestId); job.resolve({ ok: value.ok === true, data: value.data, error: typeof value.error === 'string' ? value.error.slice(0, 2000) : '' }); return { ok: true };
  };
  const close = event => { const record = recordFor(event); if (!record) return error('Unknown module window.'); record.closing = true; record.window.close(); return { ok: true }; };
  const closeLounge = () => { windows.get(LOUNGE_ID)?.window.close(); return true; };
  const closeAll = () => { shuttingDown = true; for (const record of windows.values()) record.window.destroy(); snapshot = null; };
  const read = event => { const record = recordFor(event); return record ? contextFor(record) : error('Unknown module window.'); };
  const runtime = async (event, id) => { const record = recordFor(event); return record && record.id !== LOUNGE_ID && id === record.id && contextFor(record).ok ? packages.runtime(id) : error('Module runtime denied.'); };
  const arm = event => recordFor(event)?.id === LOUNGE_ID ? armCoreLaunch({ sender: core() }) : error('Launch capability denied.');
  function authorize(channel, event) {
    if (!event?.sender) return true; // injected no-renderer fixtures only
    if (isCore(event)) return true;
    const record = recordFor(event); if (!record) return false;
    const common = ['modules:snapshot', 'modules:request', 'modules:close', 'modules:runtime'];
    const official = ['modules:armLaunch', 'dialog:importLoungeBackground', 'dialog:loungeBackgroundProfile', 'dialog:importLoungeAudio', 'news:fetchAll', 'releases:weekly', 'app:openExternal', 'widgets:list', 'widgets:runtime'];
    return common.includes(channel) || (record.id === LOUNGE_ID && official.includes(channel));
  }
  return { open, publish, request, complete, close, closeLounge, closeAll, read, runtime, arm, authorize, isCore };
}

function registerModulesIpc({ registerIpc, packages, windows }) {
  const handlers = {}; registerWidgetsIpc({ registerIpc: (channel, handler) => { handlers[channel] = handler; }, widgets: packages });
  registerIpc('modules:import', handlers['widgets:import']);
  registerIpc('modules:update', handlers['widgets:update']);
  registerIpc('modules:list', handlers['widgets:list']);
  registerIpc('modules:remove', handlers['widgets:remove']);
  registerIpc('modules:restore', handlers['widgets:restore']);
  const result = fn => guardResult(fn, value => jsonBound(value) && typeof value.ok === 'boolean', invalidResponse('Module service failed safely.'));
  registerIpc('modules:runtime', result((event, id) => windows.runtime(event, id)));
  registerIpc('modules:open', result(guardHandler((_event, id) => windows.open(id), id => typeof id === 'string' && /^[a-z0-9.-]{1,80}$/.test(id), invalidRequest('Invalid module ID.'))));
  registerIpc('modules:publish', result((event, value) => windows.publish(event, value)));
  registerIpc('modules:snapshot', result(event => windows.read(event)));
  registerIpc('modules:request', result((event, value) => windows.request(event, value)));
  registerIpc('modules:complete', result((event, value) => windows.complete(event, value)));
  registerIpc('modules:close', result(event => windows.close(event)));
  registerIpc('modules:armLaunch', result(event => windows.arm(event)));
}

module.exports = { LOUNGE_ID, OFFICIAL_LOUNGE, createModulePackages, createModuleWindowService, registerModulesIpc };
