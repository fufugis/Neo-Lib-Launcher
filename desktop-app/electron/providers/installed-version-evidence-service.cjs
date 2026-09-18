function createInstalledVersionEvidenceService({
  fs, path, execFile, platform, processEnv = {}, now = Date.now, appStartedAt = 0,
}) {
  if (!fs || !path || typeof execFile !== 'function') {
    throw new TypeError('createInstalledVersionEvidenceService requires filesystem, path and process dependencies.');
  }

  function readWindowsExecutableVersion(exePath) {
    if (platform !== 'win32' || !exePath) return Promise.resolve(null);
    // Keep PE-resource inspection asleep during the boot/intro window. The
    // selected path is environment data consumed by one fixed encoded script;
    // it can never become PowerShell command text.
    if (now() - appStartedAt < 30_000) return Promise.resolve(null);
    const script = [
      "$target=[Environment]::GetEnvironmentVariable('NEOLIB_VERSION_TARGET','Process')",
      'if([string]::IsNullOrWhiteSpace($target)){exit 2}',
      '$v=(Get-Item -LiteralPath $target -ErrorAction Stop).VersionInfo',
      'if($v.ProductVersion){$v.ProductVersion}elseif($v.FileVersion){$v.FileVersion}',
    ].join(';');
    const encodedScript = Buffer.from(script, 'utf16le').toString('base64');
    return new Promise(resolve => {
      execFile('powershell.exe', ['-NoLogo', '-NoProfile', '-NonInteractive', '-EncodedCommand', encodedScript], {
        windowsHide: true,
        timeout: 4_500,
        maxBuffer: 32 * 1024,
        env: { ...processEnv, NEOLIB_VERSION_TARGET: exePath },
      }, (error, stdout) => {
        if (error) return resolve(null);
        const match = String(stdout || '').match(/\d+(?:[.,]\d+){1,4}(?:[\s-]*(?:alpha|beta|rc)\d*|[a-z])?/i);
        return resolve(match ? match[0].replace(/,/g, '.').replace(/\s+/g, '') : null);
      });
    });
  }

  async function derive(game = {}) {
    const exePath = String(game.exePath || '');
    if (!exePath || !path.isAbsolute(exePath)) return null;
    const roots = [path.dirname(exePath), path.dirname(path.dirname(exePath))];
    const candidates = [];
    const seen = new Set();
    const exeStem = path.basename(exePath, path.extname(exePath));
    const unityData = path.join(path.dirname(exePath), `${exeStem}_Data`);
    for (const filename of ['globalgamemanagers', 'boot.config']) {
      const fullPath = path.join(unityData, filename);
      try {
        if (fs.statSync(fullPath).isFile()) candidates.push(fullPath);
      } catch { /* Optional Unity data file is absent. */ }
    }
    for (const root of roots) {
      try {
        for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
          if (candidates.length >= 24) break;
          if (!entry.isFile()) continue;
          const fullPath = path.join(root, entry.name);
          if (seen.has(fullPath)) continue;
          seen.add(fullPath);
          if (/^\.build\.info$/i.test(entry.name) || /^(?:version|changelog|patch|readme|release|notes|about|config|game|build|manifest|app).*\.(?:txt|md|nfo|html?|json|ini|cfg|info|ya?ml|xml|properties)$/i.test(entry.name)) candidates.push(fullPath);
        }
      } catch { /* An inaccessible game folder is not an error. */ }
    }
    const nameVersion = value => String(value || '').match(/(?:\bv(?:ersion)?\s*|[_\- ])(\d+(?:\.\d+){1,3}(?:[\s-]*(?:alpha|beta|rc)\d*|[a-z])?)(?=$|[_\- .])/i)?.[1];
    for (const file of candidates) {
      try {
        const raw = fs.readFileSync(file);
        const text = raw.subarray(0, /globalgamemanagers$/i.test(file) ? 2_000_000 : 96_000).toString('utf8');
        if (/\.build\.info$/i.test(file)) {
          const [headerLine, valueLine] = text.split(/\r?\n/).filter(Boolean);
          const headers = String(headerLine || '').split('|').map(value => value.split('!')[0].trim().toLowerCase());
          const values = String(valueLine || '').split('|').map(value => value.trim());
          const versionIndex = headers.findIndex(value => /^(version|productversion|buildid)$/.test(value));
          const buildVersion = versionIndex >= 0 ? values[versionIndex] : '';
          if (/^\d+(?:\.\d+){1,4}(?:[\s-]*(?:alpha|beta|rc)\d*|[a-z])?$/i.test(buildVersion)) {
            return { version: buildVersion.replace(/\s+/g, ''), evidence: '.build.info' };
          }
        }
        const match = text.match(/(?:\b(?:game\s+)?version|\bbuild|bundleversion|productversion|applicationversion|assemblyversion)\s*[\s\0]*(?:is|:|=|#|-|to)?[\s\0]*["']?v?(\d+(?:\.\d+){1,3}(?:[\s-]*(?:alpha|beta|rc)\d*|[a-z])?)/i)
          || text.match(/["'](?:version|gameVersion|buildVersion|productVersion)["']\s*:\s*["']v?(\d+(?:\.\d+){1,3}(?:[\s-]*(?:alpha|beta|rc)\d*|[a-z])?)["']/i)
          || text.match(/<\s*(?:version|applicationversion|assemblyversion)\s*>\s*v?(\d+(?:\.\d+){1,3}(?:[\s-]*(?:alpha|beta|rc)\d*|[a-z])?)\s*<\s*\/\s*(?:version|applicationversion|assemblyversion)\s*>/i);
        if (match?.[1]) return { version: match[1].replace(/\s+/g, ''), evidence: path.basename(file) };
      } catch { /* Skip unreadable or non-text candidates. */ }
    }
    const fromExe = nameVersion(path.basename(exePath));
    if (fromExe) return { version: fromExe, evidence: path.basename(exePath) };
    const resourceVersion = await readWindowsExecutableVersion(exePath);
    return resourceVersion ? { version: resourceVersion, evidence: 'Windows executable version resource', confidence: 'weak' } : null;
  }

  return Object.freeze({ derive, readWindowsExecutableVersion });
}

module.exports = { createInstalledVersionEvidenceService };
