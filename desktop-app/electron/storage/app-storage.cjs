// NEO-LIB local storage boundary.
// This first extraction intentionally preserves existing paths and JSON behaviour.
// Validation, recovery and migrations belong to later, separately reviewed steps.
function createAppStorage({ app, path, fs, fsp }) {
  if (!app?.getPath || !path?.join || !fs || !fsp) {
    throw new TypeError('createAppStorage requires app, path, fs and fsp dependencies.');
  }

  const dataDir = () => app.getPath('userData');
  const libraryFile = () => path.join(dataDir(), 'library.json');
  const settingsFile = () => path.join(dataDir(), 'settings.json');
  const coversDir = () => path.join(dataDir(), 'covers');
  const saveBackupsDir = () => path.join(dataDir(), 'save-backups');
  const managedToolsDir = () => path.join(dataDir(), 'managed-tools');
  const diagnosticsDir = () => path.join(dataDir(), 'diagnostics');
  const playtimeHistoryFile = () => path.join(dataDir(), 'playtime-history.json');
  const launchSafetyLogFile = () => path.join(dataDir(), 'launch-safety.log');
  const ipcFailureLogFile = () => path.join(dataDir(), 'ipc-failures.log');
  const launchSafetyStateFile = () => path.join(dataDir(), 'launch-safety.json');

  async function ensureDirs() {
    await fsp.mkdir(coversDir(), { recursive: true });
    await fsp.mkdir(saveBackupsDir(), { recursive: true });
    await fsp.mkdir(managedToolsDir(), { recursive: true });
    await fsp.mkdir(diagnosticsDir(), { recursive: true });
  }

  async function readJson(filePath, fallback) {
    try {
      const text = await fsp.readFile(filePath, 'utf8');
      return JSON.parse(text);
    } catch {
      return fallback;
    }
  }

  async function parseJson(filePath) {
    return JSON.parse(await fsp.readFile(filePath, 'utf8'));
  }

  // Atomic write: stage to .tmp then rename, so a killed process or power loss
  // cannot leave the destination containing partially written JSON.
  async function writeJson(filePath, data) {
    await fsp.mkdir(path.dirname(filePath), { recursive: true });
    const tmp = filePath + '.tmp';
    await fsp.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
    await fsp.rename(tmp, filePath);
  }

  async function copyFile(from, to) {
    await fsp.copyFile(from, to);
  }

  function parseJsonSync(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  function readJsonSync(filePath, fallback) {
    try {
      return parseJsonSync(filePath);
    } catch {
      return fallback;
    }
  }

  function writeJsonSync(filePath, data, space = 0) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, space), 'utf8');
  }

  function appendTextSync(filePath, text) {
    fs.appendFileSync(filePath, text, 'utf8');
  }

  return {
    dataDir,
    libraryFile,
    settingsFile,
    coversDir,
    saveBackupsDir,
    managedToolsDir,
    diagnosticsDir,
    playtimeHistoryFile,
    launchSafetyLogFile,
    ipcFailureLogFile,
    launchSafetyStateFile,
    ensureDirs,
    readJson,
    parseJson,
    writeJson,
    copyFile,
    parseJsonSync,
    readJsonSync,
    writeJsonSync,
    appendTextSync,
  };
}

module.exports = { createAppStorage };
