// Installed-game discovery only. No Electron import, library writes or game launching.
// Dependencies are explicit so the same scanners can run against offline fixtures.
// Shared Steam and Blizzard helpers remain owned by main until a later extraction.
function createLauncherScanners({
  fs, path, spawn, process, isLikelyGameExe,
  defaultSteamPath, readSteamLibraryFolders, parseAcfManifest, battleNetProductFor,
}) {
  const scanners = {};

  scanners['launcher:scan-steam'] = async () => {
    const steamPath = defaultSteamPath();
    if (!steamPath) return { ok: false, error: 'Steam install not found.', items: [] };
    const libraries = readSteamLibraryFolders(steamPath);
    const found = [];
    for (const lib of libraries) {
      const sa = path.join(lib, 'steamapps');
      try {
        const entries = fs.readdirSync(sa);
        for (const e of entries) {
          if (!e.startsWith('appmanifest_') || !e.endsWith('.acf')) continue;
          try {
            const text = fs.readFileSync(path.join(sa, e), 'utf8');
            const m = parseAcfManifest(text);
            if (!m.appid || !m.name) continue;
            // Heuristic: skip Steamworks Common Redistributables / Tools
            if (/^(Steamworks Common|Proton |Steam Linux Runtime|Steam Linux|Steam Audio)/i.test(m.name)) continue;
            const installdir = path.join(sa, 'common', m.installdir);
            // Best-effort: find a primary .exe inside the install dir for launching directly.
            // (We still prefer `steam://run/{appid}` for launching, but we expose the exe so
            //  NEO-LIB can extract an icon + treat it like any other game.)
            let exe = null;
            try {
              const findExe = (dir, depth = 0) => {
                if (depth > 2 || !dir) return null;
                for (const name of fs.readdirSync(dir)) {
                  const full = path.join(dir, name);
                  let stat;
                  try { stat = fs.statSync(full); } catch { continue; }
                  if (stat.isFile() && name.toLowerCase().endsWith('.exe')) {
                    // Import the playable executable, never the first alphabetic
                    // converter/editor/helper that happens to sit beside it.
                    if (!isLikelyGameExe(name)) continue;
                    return full;
                  }
                  if (stat.isDirectory()) {
                    const r = findExe(full, depth + 1);
                    if (r) return r;
                  }
                }
                return null;
              };
              exe = findExe(installdir);
            } catch { /* ignore */ }
            found.push({
              appid: m.appid,
              name: m.name,
              exe: exe || installdir,   // fall back to dir; launch will use steam:// URL anyway
              installdir,
              buildid: m.buildid,
              launchUrl: `steam://run/${m.appid}`,
              launcher: 'steam',
              source: 'steam',
            });
          } catch { /* skip manifest */ }
        }
      } catch { /* skip lib */ }
    }
    return { ok: true, items: found, source: 'steam' };
  };

  // Epic launcher manifest detection.
  scanners['launcher:scan-epic'] = async () => {
    const manifestsDir = path.join(process.env.PROGRAMDATA || 'C:\\ProgramData', 'Epic', 'EpicGamesLauncher', 'Data', 'Manifests');
    if (!fs.existsSync(manifestsDir)) return { ok: false, error: 'Epic Games Launcher manifests not found.' };
    const items = [];
    try {
      for (const f of fs.readdirSync(manifestsDir)) {
        if (!f.endsWith('.item')) continue;
        try {
          const data = JSON.parse(fs.readFileSync(path.join(manifestsDir, f), 'utf8'));
          if (!data.bIsApplication || data.bIsManaged === false) continue;
          items.push({
            name: data.DisplayName,
            installdir: data.InstallLocation,
            appid: data.AppName,
            launchUrl: `com.epicgames.launcher://apps/${data.CatalogNamespace}%3A${data.CatalogItemId}%3A${data.AppName}?action=launch&silent=true`,
            launchExe: data.LaunchExecutable ? path.join(data.InstallLocation, data.LaunchExecutable) : null,
          });
        } catch {}
      }
    } catch {}
    return { ok: true, items, source: 'epic' };
  };
  function queryRegistry(root, view) {
    return new Promise((resolve) => {
      const child = spawn('reg.exe', ['query', root, '/s', view], { windowsHide: true });
      let stdout = '';
      child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
      child.on('error', () => resolve(''));
      child.on('close', () => resolve(stdout));
    });
  }

  function primaryExeIn(folder, depth = 0) {
    if (!folder || depth > 2) return null;
    let entries = [];
    try { entries = fs.readdirSync(folder, { withFileTypes: true }); } catch { return null; }
    for (const entry of entries) {
      const full = path.join(folder, entry.name);
      if (entry.isFile() && isLikelyGameExe(entry.name)) return full;
    }
    for (const entry of entries) {
      if (!entry.isDirectory() || /^(redist|support|__redist|dependencies)$/i.test(entry.name)) continue;
      const found = primaryExeIn(path.join(folder, entry.name), depth + 1);
      if (found) return found;
    }
    return null;
  }

  scanners['launcher:scan-gog'] = async () => {
    const roots = ['HKLM\\SOFTWARE\\WOW6432Node\\GOG.com\\Games', 'HKLM\\SOFTWARE\\GOG.com\\Games'];
    const outputs = await Promise.all(roots.flatMap((root) => ['/reg:64', '/reg:32'].map((view) => queryRegistry(root, view))));
    const blocks = outputs.join('\n').split(/\r?\n\s*(?=HKEY_)/i);
    const items = [];
    const seen = new Set();
    for (const block of blocks) {
      const value = (name) => block.match(new RegExp(`^\\s*${name}\\s+REG_\\w+\\s+(.+)$`, 'im'))?.[1]?.trim() || '';
      const installPath = value('path') || value('PATH');
      const gameId = value('gameID') || value('gameId') || block.match(/\\Games\\([^\\\r\n]+)\s*$/im)?.[1] || '';
      const name = value('gameName') || value('GAMENAME');
      if (!installPath || !name || seen.has(gameId || installPath.toLowerCase()) || !fs.existsSync(installPath)) continue;
      seen.add(gameId || installPath.toLowerCase());
      items.push({
        gogId: gameId,
        name,
        exe: primaryExeIn(installPath) || installPath,
        installdir: installPath,
        launcher: 'gog',
        source: 'gog',
        buildId: value('buildId') || value('BUILDID'),
      });
    }
    return items.length ? { ok: true, items, source: 'gog' } : { ok: false, items: [], error: 'No installed GOG games found in the Windows registry.' };
  };

  scanners['launcher:scan-ea'] = async () => {
    const roots = [
      'HKLM\\SOFTWARE\\EA Games',
      'HKLM\\SOFTWARE\\WOW6432Node\\EA Games',
      'HKLM\\SOFTWARE\\Origin Games',
      'HKLM\\SOFTWARE\\WOW6432Node\\Origin Games',
    ];
    const outputs = await Promise.all(roots.flatMap((root) => ['/reg:64', '/reg:32'].map((view) => queryRegistry(root, view))));
    const blocks = outputs.join('\n').split(/\r?\n\s*(?=HKEY_)/i);
    const items = [];
    const seen = new Set();
    for (const block of blocks) {
      const value = (name) => {
        const escapedName = name.replace(/[^a-z0-9 ]/gi, '\\$&');
        return block.match(new RegExp(`^\\s*${escapedName}\\s+REG_\\w+\\s+(.+)$`, 'im'))?.[1]?.trim() || '';
      };
      const installPath = value('Install Dir') || value('InstallDir') || value('InstallLocation') || value('Path');
      const name = value('DisplayName') || value('GameName') || value('Title');
      const productId = value('Product GUID') || value('ProductId') || value('contentID') || block.match(/\\([^\\\r\n]+)\s*$/im)?.[1] || '';
      if (!installPath || !name || !fs.existsSync(installPath)) continue;
      const key = productId || installPath.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({
        launcherProductId: productId,
        name,
        exe: primaryExeIn(installPath) || installPath,
        installdir: installPath,
        launcher: 'ea',
        source: 'ea',
        installedVersion: value('DisplayVersion') || value('Version'),
      });
    }
    return items.length ? { ok: true, items, source: 'ea' } : { ok: false, items: [], error: 'No installed EA/Origin games found in the Windows registry.' };
  };

  scanners['launcher:scan-ubisoft'] = async () => {
    const roots = [
      'HKLM\\SOFTWARE\\Ubisoft\\Launcher\\Installs',
      'HKLM\\SOFTWARE\\WOW6432Node\\Ubisoft\\Launcher\\Installs',
    ];
    const outputs = await Promise.all(roots.flatMap((root) => ['/reg:64', '/reg:32'].map((view) => queryRegistry(root, view))));
    const blocks = outputs.join('\n').split(/\r?\n\s*(?=HKEY_)/i);
    const items = [];
    const seen = new Set();
    for (const block of blocks) {
      const value = (name) => {
        const escapedName = name.replace(/[^a-z0-9 ]/gi, '\\$&');
        return block.match(new RegExp(`^\\s*${escapedName}\\s+REG_\\w+\\s+(.+)$`, 'im'))?.[1]?.trim() || '';
      };
      const installPath = value('InstallDir') || value('Install Dir') || value('InstallLocation');
      const productId = block.match(/\\Installs\\([^\\\r\n]+)\s*$/im)?.[1] || value('GameId');
      if (!installPath || !productId || !fs.existsSync(installPath) || seen.has(productId)) continue;
      seen.add(productId);
      const folderName = path.basename(installPath.replace(/[\\/]+$/, ''));
      const name = value('DisplayName') || value('GameName') || folderName || `Ubisoft Game ${productId}`;
      items.push({
        launcherProductId: `ubisoft:${productId}`,
        name,
        exe: primaryExeIn(installPath) || installPath,
        installdir: installPath,
        launcher: 'ubisoft',
        source: 'ubisoft',
        launchUrl: `uplay://launch/${productId}/0`,
        nameEvidence: value('DisplayName') || value('GameName') ? 'registry' : 'install-folder',
      });
    }
    return items.length ? { ok: true, items, source: 'ubisoft' } : { ok: false, items: [], error: 'No installed Ubisoft Connect games found in the Windows registry.' };
  };

  scanners['launcher:scan-battlenet'] = async () => {
    const roots = [
      'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
      'HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
    ];
    const outputs = await Promise.all(roots.flatMap((root) => ['/reg:64', '/reg:32'].map((view) => queryRegistry(root, view))));
    const blocks = outputs.join('\n').split(/\r?\n\s*(?=HKEY_)/i);
    const items = [];
    const seen = new Set();
    for (const block of blocks) {
      const value = (name) => {
        const escapedName = name.replace(/[^a-z0-9 ]/gi, '\\$&');
        return block.match(new RegExp(`^\\s*${escapedName}\\s+REG_\\w+\\s+(.+)$`, 'im'))?.[1]?.trim() || '';
      };
      const publisher = value('Publisher');
      const name = value('DisplayName');
      const installPath = value('InstallLocation');
      if (!/blizzard|battle\.net/i.test(publisher) || !name || !installPath || !fs.existsSync(installPath)) continue;
      if (/battle\.net( desktop app)?$/i.test(name.trim())) continue;
      // Battle.net/Windows sometimes gives us an older or shortened display
      // name (for example just "Overwatch"). Match that local evidence against
      // the bounded Blizzard catalogue before any generic store search runs.
      const product = battleNetProductFor(name, installPath, value('ProductID'));
      const canonicalName = product?.name || name;
      const key = `${canonicalName.toLowerCase()}|${installPath.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({
        launcherProductId: `battlenet:${value('ProductID') || canonicalName}`,
        name: canonicalName,
        exe: primaryExeIn(installPath) || installPath,
        installdir: installPath,
        launcher: 'battlenet',
        source: 'battlenet',
        installedVersion: value('DisplayVersion'),
        metadataHint: product ? 'official-battlenet-product' : 'windows-display-name',
      });
    }
    return items.length ? { ok: true, items, source: 'battlenet' } : { ok: false, items: [], error: 'No installed Battle.net games found in Windows installation records.' };
  };

  scanners['launcher:scan-riot'] = async () => {
    const metadataRoot = path.join(process.env.PROGRAMDATA || 'C:\\ProgramData', 'Riot Games', 'Metadata');
    if (!fs.existsSync(metadataRoot)) return { ok: false, items: [], error: 'Riot installed-game metadata was not found.' };
    const files = [];
    const walk = (folder, depth = 0) => {
      if (depth > 3 || files.length >= 100) return;
      let entries = [];
      try { entries = fs.readdirSync(folder, { withFileTypes: true }); } catch { return; }
      for (const entry of entries) {
        const full = path.join(folder, entry.name);
        if (entry.isDirectory()) walk(full, depth + 1);
        else if (/\.product_settings\.ya?ml$/i.test(entry.name)) files.push(full);
      }
    };
    walk(metadataRoot);
    const items = [];
    const seen = new Set();
    for (const file of files) {
      let yaml = '';
      try { yaml = fs.readFileSync(file, 'utf8'); } catch { continue; }
      const field = (name) => yaml.match(new RegExp(`^${name}:\\s*["']?([^"'\\r\\n]+)`, 'im'))?.[1]?.trim() || '';
      const productId = field('product_id') || path.basename(path.dirname(file));
      const name = field('product_name') || field('name') || productId;
      if (!productId || !name || /riot client/i.test(name) || seen.has(productId)) continue;
      const installPath = field('product_install_full_path').replace(/\//g, '\\');
      const configuredExe = field('product_executable_full_path').replace(/\//g, '\\');
      const exe = configuredExe && fs.existsSync(configuredExe) ? configuredExe : primaryExeIn(installPath) || installPath;
      if (!exe || (!fs.existsSync(exe) && !fs.existsSync(installPath))) continue;
      seen.add(productId);
      items.push({
        launcherProductId: `riot:${productId}`,
        name,
        exe,
        installdir: installPath,
        launcher: 'riot',
        source: 'riot',
        installedVersion: field('product_version'),
      });
    }
    return items.length ? { ok: true, items, source: 'riot' } : { ok: false, items: [], error: 'No installed Riot games were present in the local metadata.' };
  };

  scanners['launcher:scan-xbox'] = async () => {
    const roots = [];
    for (let code = 67; code <= 90; code += 1) {
      const candidate = `${String.fromCharCode(code)}:\\XboxGames`;
      try { if (fs.existsSync(candidate)) roots.push(candidate); } catch { /* inaccessible drive */ }
    }
    const items = [];
    const seen = new Set();
    for (const root of roots) {
      let folders = [];
      try { folders = fs.readdirSync(root, { withFileTypes: true }).filter((entry) => entry.isDirectory()); } catch { continue; }
      for (const folder of folders.slice(0, 300)) {
        const content = path.join(root, folder.name, 'Content');
        const configPath = path.join(content, 'MicrosoftGame.config');
        if (!fs.existsSync(configPath)) continue;
        let xml = '';
        try { xml = fs.readFileSync(configPath, 'utf8'); } catch { continue; }
        const attr = (name) => xml.match(new RegExp(`${name}=["']([^"']+)["']`, 'i'))?.[1]?.trim() || '';
        const storeId = attr('StoreId') || attr('Id') || folder.name;
        if (seen.has(storeId)) continue;
        const configuredExe = attr('Executable') || xml.match(/<Executable[^>]+Name=["']([^"']+)["']/i)?.[1] || '';
        const exe = configuredExe ? path.join(content, configuredExe.replace(/\//g, '\\')) : primaryExeIn(content) || content;
        const displayName = attr('DefaultDisplayName');
        const name = displayName && !/^ms-resource:/i.test(displayName) ? displayName : folder.name;
        seen.add(storeId);
        items.push({
          launcherProductId: `xbox:${storeId}`,
          name,
          exe: fs.existsSync(exe) ? exe : content,
          installdir: content,
          launcher: 'xbox',
          source: 'xbox',
          storeId,
        });
      }
    }
    return items.length ? { ok: true, items, source: 'xbox' } : { ok: false, items: [], error: 'No Xbox/Game Pass installs with MicrosoftGame.config were found under local XboxGames roots.' };
  };

  scanners['launcher:scan-rockstar'] = async () => {
    const roots = [
      'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
      'HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
    ];
    const outputs = await Promise.all(roots.flatMap((root) => ['/reg:64', '/reg:32'].map((view) => queryRegistry(root, view))));
    const blocks = outputs.join('\n').split(/\r?\n\s*(?=HKEY_)/i);
    const items = [];
    const seen = new Set();
    for (const block of blocks) {
      const value = (name) => {
        const escapedName = name.replace(/[^a-z0-9 ]/gi, '\\$&');
        return block.match(new RegExp(`^\\s*${escapedName}\\s+REG_\\w+\\s+(.+)$`, 'im'))?.[1]?.trim() || '';
      };
      const publisher = value('Publisher');
      const name = value('DisplayName');
      if (!/rockstar games/i.test(publisher) || !name || /(launcher|social club|sdk)/i.test(name)) continue;
      let installPath = value('InstallLocation');
      if (!installPath) {
        const uninstall = value('UninstallString');
        const executable = uninstall.match(/^"([^"]+\.exe)"/i)?.[1] || uninstall.match(/^([^\s]+\.exe)/i)?.[1] || '';
        if (executable) installPath = path.dirname(executable);
      }
      if (!installPath || !fs.existsSync(installPath)) continue;
      const productId = block.match(/\\([^\\\r\n]+)\s*$/im)?.[1] || name;
      const key = `${name.toLowerCase()}|${installPath.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({
        launcherProductId: `rockstar:${productId}`,
        name,
        exe: primaryExeIn(installPath) || installPath,
        installdir: installPath,
        launcher: 'rockstar',
        source: 'rockstar',
        installedVersion: value('DisplayVersion'),
      });
    }
    return items.length ? { ok: true, items, source: 'rockstar' } : { ok: false, items: [], error: 'No installed Rockstar games found in verified Windows installation records.' };
  };

  // itch.io keeps its configured install locations in its own user preferences.
  // We deliberately do *not* open butler.db here: it is the desktop client's live
  // SQLite catalog and direct/concurrent access is neither needed nor safe for a
  // read-only launcher import. A completed itch install has a receipt marker in
  // the game's folder, so this adapter only reads those known locations and then
  // lets the normal approval-first metadata flow enrich the folder-derived title.
  function itchInstallRoots() {
    const appData = process.env.APPDATA || '';
    const preferences = path.join(appData, 'itch', 'preferences.json');
    if (!preferences || !fs.existsSync(preferences)) return [];
    try {
      const data = JSON.parse(fs.readFileSync(preferences, 'utf8'));
      const locations = data?.installLocations && typeof data.installLocations === 'object'
        ? Object.values(data.installLocations) : [];
      return [...new Set(locations
        .map((location) => typeof location?.path === 'string' ? location.path.trim() : '')
        .filter((location) => location && fs.existsSync(location))
        .map((location) => path.resolve(location)))];
    } catch {
      return [];
    }
  }

  function itchDisplayName(folderName) {
    return String(folderName || '')
      .replace(/\s+\d+$/, '')
      .replace(/^game-\d+$/i, '')
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
      .trim();
  }

  scanners['launcher:scan-itch'] = async () => {
    const roots = itchInstallRoots();
    if (!roots.length) {
      return {
        ok: false,
        items: [],
        error: 'No itch.io install locations were found in the itch desktop app preferences.',
      };
    }
    const items = [];
    const seen = new Set();
    for (const root of roots) {
      let folders = [];
      try { folders = fs.readdirSync(root, { withFileTypes: true }).filter((entry) => entry.isDirectory()); } catch { continue; }
      for (const folder of folders.slice(0, 1_000)) {
        // "downloads" is itch's staging area, never an installed game.
        if (/^downloads$/i.test(folder.name)) continue;
        const installDir = path.join(root, folder.name);
        const receipt = path.join(installDir, '.itch', 'receipt.json.gz');
        if (!fs.existsSync(receipt)) continue;
        const key = installDir.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        const name = itchDisplayName(folder.name) || folder.name;
        items.push({
          launcherProductId: `itch:${key}`,
          name,
          exe: primaryExeIn(installDir) || installDir,
          installdir: installDir,
          launcher: 'itch',
          source: 'itch',
          // The receipt is only a completion marker. Do not parse or copy it;
          // it is not relied upon as a metadata source.
          nameEvidence: 'itch-install-folder',
        });
      }
    }
    return items.length
      ? { ok: true, items, source: 'itch' }
      : { ok: false, items: [], error: 'No completed itch.io installs were found in the configured itch install locations.' };
  };

  return scanners;
}

module.exports = { createLauncherScanners };
