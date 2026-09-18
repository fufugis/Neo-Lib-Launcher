const DEFAULT_MAX_BYTES = 512 * 1024;
const DEFAULT_KEEP_FILES = 3;
const MAX_REPORT_ENTRIES = 120;

function safeToken(value, fallback = 'unknown', max = 120) {
  const text = String(value || '').trim();
  if (!text || !/^[a-z0-9_.:-]+$/i.test(text)) return fallback;
  return text.slice(0, max);
}

function safeInteger(value, minimum = -2147483648, maximum = 2147483647) {
  const number = Number(value);
  return Number.isInteger(number) && number >= minimum && number <= maximum ? number : undefined;
}

function classifyError(value) {
  const name = String(value?.name || '');
  const message = String(value?.message || value || '');
  const combined = `${name} ${message}`.toLowerCase();
  if (/referenceerror|is not defined/.test(combined)) return 'REFERENCE_ERROR';
  if (/typeerror|is not a function|cannot read prop/.test(combined)) return 'TYPE_ERROR';
  if (/syntaxerror|unexpected token/.test(combined)) return 'SYNTAX_ERROR';
  if (/timeout|timed out|aborterror/.test(combined)) return 'TIMEOUT';
  if (/eacces|eperm|access is denied|permission/.test(combined)) return 'PERMISSION_ERROR';
  if (/enoent|not found|cannot find/.test(combined)) return 'MISSING_FILE';
  if (/network|fetch|enotfound|econn|socket/.test(combined)) return 'NETWORK_ERROR';
  return name || message ? 'UNKNOWN_ERROR' : undefined;
}

function safeSource(value, path) {
  const base = path.basename(String(value || ''));
  return safeToken(base, 'unknown', 120);
}

function sanitizeDetails(details, path) {
  const source = details && typeof details === 'object' ? details : {};
  const clean = {};
  const tokenFields = ['channel', 'domain', 'kind', 'status', 'reason', 'protocol', 'platform', 'receivedType'];
  for (const key of tokenFields) {
    if (source[key] != null) clean[key] = safeToken(source[key]);
  }
  const integerFields = ['level', 'line', 'exitCode', 'errorCode', 'durationMs', 'checked', 'updateCount', 'launcherManagedCount', 'gameCount', 'sinceStartMs'];
  for (const key of integerFields) {
    const value = safeInteger(source[key], key === 'exitCode' || key === 'errorCode' ? -2147483648 : 0);
    if (value !== undefined) clean[key] = value;
  }
  if (source.source != null) clean.source = safeSource(source.source, path);
  const errorCode = safeToken(source.code || classifyError(source.error || source.message), '', 80);
  if (errorCode) clean.code = errorCode;
  return clean;
}

function createDiagnosticRecorder({
  fs,
  path,
  directory,
  appVersion = 'unknown',
  platform = process.platform,
  release = 'unknown',
  arch = process.arch,
  now = () => new Date(),
  maxBytes = DEFAULT_MAX_BYTES,
  keepFiles = DEFAULT_KEEP_FILES,
} = {}) {
  if (!fs || !path || typeof directory !== 'function') {
    throw new TypeError('createDiagnosticRecorder requires fs, path and directory dependencies.');
  }
  const file = () => path.join(directory(), 'neolib-diagnostics.jsonl');

  function ensureDirectory() {
    fs.mkdirSync(directory(), { recursive: true });
  }

  function rotatedFile(index) {
    return `${file()}.${index}`;
  }

  function rotateIfNeeded(extraBytes) {
    let size = 0;
    try { size = fs.statSync(file()).size; } catch { size = 0; }
    if (size + extraBytes <= maxBytes) return;
    for (let index = keepFiles - 1; index >= 1; index -= 1) {
      const from = index === 1 ? file() : rotatedFile(index - 1);
      const to = rotatedFile(index);
      try {
        if (fs.existsSync(to)) fs.unlinkSync(to);
        if (fs.existsSync(from)) fs.renameSync(from, to);
      } catch { /* diagnostics must never affect the app */ }
    }
  }

  function record(event, details = {}) {
    try {
      const entry = {
        at: now().toISOString(),
        event: safeToken(event, 'unknown-event'),
        appVersion: safeToken(appVersion),
        os: safeToken(platform),
        osRelease: safeToken(release),
        arch: safeToken(arch),
        ...sanitizeDetails(details, path),
      };
      const line = `${JSON.stringify(entry)}\n`;
      ensureDirectory();
      rotateIfNeeded(Buffer.byteLength(line, 'utf8'));
      fs.appendFileSync(file(), line, 'utf8');
      return true;
    } catch { return false; }
  }

  function readEntries() {
    const paths = [];
    for (let index = keepFiles - 1; index >= 1; index -= 1) paths.push(rotatedFile(index));
    paths.push(file());
    const entries = [];
    for (const target of paths) {
      let text = '';
      try { text = fs.readFileSync(target, 'utf8'); } catch { continue; }
      for (const line of text.split(/\r?\n/)) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed && typeof parsed === 'object') entries.push(parsed);
        } catch { /* skip a partial final line after power loss */ }
      }
    }
    return entries.slice(-MAX_REPORT_ENTRIES);
  }

  function getReport() {
    const entries = readEntries();
    return {
      ok: true,
      count: entries.length,
      report: JSON.stringify({
        schema: 1,
        generatedAt: now().toISOString(),
        privacy: 'No game names, paths, URLs, searches, message text, keys, PINs, or request payloads.',
        appVersion: safeToken(appVersion),
        os: safeToken(platform),
        osRelease: safeToken(release),
        arch: safeToken(arch),
        events: entries,
      }, null, 2).slice(0, 24000),
    };
  }

  return Object.freeze({ directory, file, record, readEntries, getReport });
}

module.exports = { classifyError, createDiagnosticRecorder, sanitizeDetails };
