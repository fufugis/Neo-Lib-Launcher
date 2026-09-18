const CACHE_MS = 15 * 60 * 1000;

function createIndependentUpdateAssessmentService({
  fetchText, stripHtml, discoverSources, deriveInstalledVersion, pageVersions, now = Date.now,
}) {
  if (typeof fetchText !== 'function' || typeof stripHtml !== 'function'
    || typeof discoverSources !== 'function' || typeof deriveInstalledVersion !== 'function'
    || !pageVersions || typeof pageVersions.selectLatest !== 'function' || typeof pageVersions.compare !== 'function') {
    throw new TypeError('createIndependentUpdateAssessmentService requires page, source and installed-version dependencies.');
  }
  const cache = new Map();

  async function assess(game = {}) {
    const localVersion = game.installedVersion
      ? { version: String(game.installedVersion), evidence: 'saved game metadata' }
      : await deriveInstalledVersion(game);
    const sources = await discoverSources(game);
    if (!sources.length) {
      const missing = 'a trustworthy update source';
      return {
        checked: false,
        item: null,
        need: { id: game.id, name: game.name || 'Unnamed game', missing },
        ledger: { id: game.id, status: 'needs-evidence', source: 'Automatic discovery', checkedAt: now(), currentVersion: localVersion?.version || '', missing },
      };
    }

    const cacheKey = `${game.id}|${localVersion?.version || 'unknown'}|${sources.map(source => source.url).join('|')}`;
    const cached = cache.get(cacheKey);
    if (cached && now() - cached.ts < CACHE_MS) {
      if (cached.missing) {
        return {
          checked: true, item: null,
          need: { id: game.id, name: game.name || 'Unnamed game', missing: cached.missing },
          ledger: {
            id: game.id, status: 'needs-evidence', source: 'Automatic update discovery', checkedAt: now(),
            currentVersion: localVersion?.version || '', missing: cached.missing,
          },
        };
      }
      return {
        checked: true,
        item: cached.item ? { ...cached.item } : null,
        need: null,
        ledger: {
          id: game.id,
          status: cached.item?.status === 'attention' ? 'needs-evidence' : cached.item ? 'available' : localVersion ? 'current' : 'needs-evidence',
          source: 'Independent source', checkedAt: now(), currentVersion: localVersion?.version || '',
          latestVersion: cached.latestVersion || cached.item?.latestVersion || localVersion?.version || '',
        },
      };
    }

    try {
      const sourceResults = await Promise.all(sources.map(async source => {
        try {
          const html = await fetchText(source.url, 9_000);
          return { ...source, text: stripHtml(html).replace(/\s+/g, ' ').slice(0, 500_000) };
        } catch { return null; }
      }));
      const latest = pageVersions.selectLatest(sourceResults);
      const latestVersion = latest?.version || '';
      const attemptedSources = sourceResults.filter(Boolean).map(entry => entry.kind).slice(0, 3);

      if (!localVersion || localVersion.confidence === 'weak') {
        const item = latestVersion ? {
          id: game.id, name: game.name, platform: 'Independent source', status: 'attention',
          currentVersion: localVersion?.version || 'Unknown', latestVersion,
          actionUrl: latest.source.url, sourceKind: 'watch-page',
          installedVersionEvidence: localVersion?.evidence || 'not readable from this local build',
          latestVersionEvidence: latest.source.kind,
        } : null;
        cache.set(cacheKey, { ts: now(), item, latestVersion });
        if (item) {
          return {
            checked: true, item, need: null,
            ledger: {
              id: game.id, status: 'needs-evidence', source: 'Public patch evidence', checkedAt: now(),
              currentVersion: localVersion?.version || '', latestVersion,
              missing: localVersion?.confidence === 'weak' ? 'a stronger installed-version signal' : 'installed version',
              evidence: { installed: localVersion?.evidence || 'not readable', latest: latest.source.kind, sourceConfidence: latest.confidence, attemptedSources },
            },
          };
        }
        const missing = 'installed version and an explicit latest version';
        cache.set(cacheKey, { ts: now(), item: null, latestVersion: '', missing });
        return {
          checked: true, item: null,
          need: { id: game.id, name: game.name || 'Unnamed game', missing },
          ledger: { id: game.id, status: 'needs-evidence', source: 'Automatic update discovery', checkedAt: now(), missing },
        };
      }

      const item = latestVersion && pageVersions.compare(latestVersion, localVersion.version) > 0 ? {
        id: game.id, name: game.name, platform: 'Independent source', status: 'available',
        currentVersion: localVersion.version, latestVersion,
        actionUrl: latest.source.url, sourceKind: 'watch-page',
        installedVersionEvidence: localVersion.evidence, latestVersionEvidence: latest.source.kind,
      } : null;
      cache.set(cacheKey, { ts: now(), item, latestVersion });
      if (latestVersion) {
        return {
          checked: true, item, need: null,
          ledger: {
            id: game.id, status: item ? 'available' : 'current', source: 'Automatic update evidence', checkedAt: now(),
            currentVersion: localVersion.version, latestVersion,
            evidence: { installed: localVersion.evidence, latest: latest.source.kind, sourceConfidence: latest.confidence, attemptedSources },
          },
        };
      }
      const missing = 'an explicit latest version';
      cache.set(cacheKey, { ts: now(), item: null, latestVersion: '', missing });
      return {
        checked: true, item: null,
        need: { id: game.id, name: game.name || 'Unnamed game', missing },
        ledger: { id: game.id, status: 'needs-evidence', source: 'Automatic update discovery', checkedAt: now(), currentVersion: localVersion.version, missing },
      };
    } catch {
      const missing = 'a reachable current-version source';
      return {
        checked: true, item: null,
        need: { id: game.id, name: game.name || 'Unnamed game', missing },
        ledger: { id: game.id, status: 'needs-evidence', source: 'Automatic update discovery', checkedAt: now(), currentVersion: localVersion?.version || '', missing },
      };
    }
  }

  return Object.freeze({ assess });
}

module.exports = { createIndependentUpdateAssessmentService };
