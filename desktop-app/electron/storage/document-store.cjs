// Versioned NEO-LIB documents layered over the low-level app-data storage.
// Unknown fields are preserved. Validation is intentionally structural and
// conservative so old user customizations are not mistaken for corruption.
const SCHEMA_KEY = '_neoLibSchemaVersion';
const CURRENT_SCHEMA_VERSION = 1;

const isRecord = value => !!value && typeof value === 'object' && !Array.isArray(value);
const optionalArray = (value, key) => value[key] === undefined || Array.isArray(value[key]);
const optionalRecord = (value, key) => value[key] === undefined || isRecord(value[key]);

const DEFINITIONS = Object.freeze({
  library: {
    path: 'libraryFile',
    fallback: () => ({ games: [] }),
    valid: value => isRecord(value)
      && optionalArray(value, 'games')
      && optionalArray(value, 'categories')
      && optionalArray(value, 'tools')
      && optionalArray(value, 'toolCategories')
      && optionalRecord(value, 'gameOrderByCategory')
      && optionalRecord(value, 'toolOrderByCategory'),
    migrateLegacy: value => ({ ...value, games: Array.isArray(value.games) ? value.games : [] }),
  },
  settings: {
    path: 'settingsFile',
    fallback: () => ({ theme: 'synthwave', firstRun: true }),
    valid: isRecord,
    migrateLegacy: value => ({ ...value }),
  },
  playtimeHistory: {
    path: 'playtimeHistoryFile',
    fallback: () => ({}),
    valid: value => isRecord(value) && optionalRecord(value, 'byAppid'),
    migrateLegacy: value => ({ ...value }),
  },
});

function createDocumentStore({ storage }) {
  if (!storage?.writeJson || !storage?.parseJson) {
    throw new TypeError('createDocumentStore requires the low-level app storage boundary.');
  }

  const queues = new Map();
  const diagnostics = new Map();
  const writeBlocked = new Set();
  const definition = name => {
    const value = DEFINITIONS[name];
    if (!value) throw new TypeError(`Unknown NEO-LIB document: ${name}`);
    return value;
  };
  const fileFor = name => storage[definition(name).path]();
  const fallbackFor = name => definition(name).fallback();
  const backupFor = name => `${fileFor(name)}.bak`;

  function prepare(name, input) {
    const spec = definition(name);
    if (!spec.valid(input)) throw new TypeError(`Invalid ${name} document shape.`);
    const version = Number(input[SCHEMA_KEY] || 0);
    if (!Number.isInteger(version) || version < 0) throw new TypeError(`Invalid ${name} schema version.`);
    if (version > CURRENT_SCHEMA_VERSION) {
      const error = new TypeError(`${name} requires a newer NEO-LIB storage schema (${version}).`);
      error.code = 'UNSUPPORTED_SCHEMA';
      throw error;
    }
    const migrated = version === 0 ? spec.migrateLegacy(input) : { ...input };
    return { ...migrated, [SCHEMA_KEY]: CURRENT_SCHEMA_VERSION };
  }

  async function parseValid(name, filePath) {
    const value = await storage.parseJson(filePath);
    return prepare(name, value);
  }

  async function load(name) {
    const filePath = fileFor(name);
    let raw;
    try {
      raw = await storage.parseJson(filePath);
    } catch (error) {
      if (error?.code === 'ENOENT') {
        writeBlocked.delete(name);
        diagnostics.set(name, { state: 'missing', recovered: false });
        return fallbackFor(name);
      }
      try {
        const recovered = await parseValid(name, backupFor(name));
        writeBlocked.delete(name);
        diagnostics.set(name, { state: 'recovered-backup', recovered: true, reason: String(error?.message || error) });
        return recovered;
      } catch {
        writeBlocked.add(name);
        diagnostics.set(name, { state: 'invalid', recovered: false, reason: String(error?.message || error) });
        return fallbackFor(name);
      }
    }

    try {
      const prepared = prepare(name, raw);
      const migrated = Number(raw[SCHEMA_KEY] || 0) < CURRENT_SCHEMA_VERSION;
      if (migrated) {
        try {
          await storage.copyFile(filePath, backupFor(name));
          await storage.writeJson(filePath, prepared);
        } catch (error) {
          // Reading succeeded, so keep showing the user's real data. Block
          // subsequent writes for this session because migration could not
          // establish its rollback point or commit atomically.
          writeBlocked.add(name);
          diagnostics.set(name, { state: 'migration-deferred', recovered: false, reason: String(error?.message || error) });
          return prepared;
        }
      }
      writeBlocked.delete(name);
      diagnostics.set(name, { state: migrated ? 'migrated' : 'ready', recovered: false, migrated });
      return prepared;
    } catch (error) {
      if (error?.code === 'UNSUPPORTED_SCHEMA') {
        writeBlocked.add(name);
        diagnostics.set(name, { state: 'unsupported-newer-schema', recovered: false, reason: String(error.message) });
        return fallbackFor(name);
      }
      try {
        const recovered = await parseValid(name, backupFor(name));
        writeBlocked.delete(name);
        diagnostics.set(name, { state: 'recovered-backup', recovered: true, reason: String(error?.message || error) });
        return recovered;
      } catch {
        writeBlocked.add(name);
        diagnostics.set(name, { state: 'invalid', recovered: false, reason: String(error?.message || error) });
        return fallbackFor(name);
      }
    }
  }

  function enqueue(name, operation) {
    const previous = queues.get(name) || Promise.resolve();
    const current = previous.catch(() => {}).then(operation);
    queues.set(name, current);
    return current.finally(() => { if (queues.get(name) === current) queues.delete(name); });
  }

  async function save(name, value) {
    const prepared = prepare(name, value);
    return enqueue(name, async () => {
      if (writeBlocked.has(name)) {
        throw new Error(`Refusing to overwrite unreadable or newer ${name} storage. Restart after repairing or restoring the file.`);
      }
      const filePath = fileFor(name);
      try {
        await parseValid(name, filePath);
        await storage.copyFile(filePath, backupFor(name));
      } catch (error) {
        const recovered = diagnostics.get(name)?.recovered === true;
        if (error?.code !== 'ENOENT' && !recovered) {
          writeBlocked.add(name);
          throw new Error(`Refusing to overwrite unreadable or newer ${name} storage.`);
        }
        // A recovered document may repair its corrupt primary. Missing files
        // are normal on first run. Neither case replaces the known-good backup.
      }
      await storage.writeJson(filePath, prepared);
      diagnostics.set(name, { state: 'saved', recovered: false });
      return true;
    });
  }

  async function patch(name, changes) {
    if (!isRecord(changes)) throw new TypeError(`Invalid ${name} patch.`);
    return enqueue(name, async () => {
      if (writeBlocked.has(name)) {
        throw new Error(`Refusing to overwrite unreadable or newer ${name} storage.`);
      }
      const current = await load(name);
      if (writeBlocked.has(name)) {
        throw new Error(`Refusing to overwrite unreadable or newer ${name} storage.`);
      }
      const prepared = prepare(name, { ...current, ...changes });
      const filePath = fileFor(name);
      try {
        await parseValid(name, filePath);
        await storage.copyFile(filePath, backupFor(name));
      } catch { /* do not replace a known-good backup with invalid data */ }
      await storage.writeJson(filePath, prepared);
      diagnostics.set(name, { state: 'saved', recovered: false });
      return true;
    });
  }

  function loadSync(name) {
    const filePath = fileFor(name);
    try {
      const prepared = prepare(name, storage.parseJsonSync(filePath));
      writeBlocked.delete(name);
      diagnostics.set(name, { state: 'ready-sync', recovered: false });
      return prepared;
    } catch (error) {
      if (error?.code === 'ENOENT') {
        writeBlocked.delete(name);
        diagnostics.set(name, { state: 'missing-sync', recovered: false });
        return fallbackFor(name);
      }
      if (error?.code === 'UNSUPPORTED_SCHEMA') {
        writeBlocked.add(name);
        diagnostics.set(name, { state: 'unsupported-newer-schema', recovered: false, reason: String(error.message) });
        return fallbackFor(name);
      }
      try {
        const recovered = prepare(name, storage.parseJsonSync(backupFor(name)));
        writeBlocked.delete(name);
        diagnostics.set(name, { state: 'recovered-backup-sync', recovered: true, reason: String(error?.message || error) });
        return recovered;
      } catch {
        writeBlocked.add(name);
        return fallbackFor(name);
      }
    }
  }

  return {
    loadLibrary: () => enqueue('library', () => load('library')),
    saveLibrary: value => save('library', value),
    loadSettings: () => enqueue('settings', () => load('settings')),
    saveSettings: value => save('settings', value),
    patchSettings: changes => patch('settings', changes),
    loadSettingsSnapshot: () => loadSync('settings'),
    loadPlaytimeHistory: () => enqueue('playtimeHistory', () => load('playtimeHistory')),
    savePlaytimeHistory: value => save('playtimeHistory', value),
    getDiagnostics: () => Object.fromEntries(diagnostics),
  };
}

module.exports = { SCHEMA_KEY, CURRENT_SCHEMA_VERSION, createDocumentStore };
