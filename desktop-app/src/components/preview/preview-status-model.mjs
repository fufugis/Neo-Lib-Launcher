export function manifestPresentation(info = {}, now = Date.now()) {
  const daysAgo = info.lastUpdated
    ? Math.max(0, Math.floor((now - info.lastUpdated) / 86400000))
    : null;
  const updated = daysAgo == null ? null : daysAgo === 0 ? 'today' : daysAgo === 1 ? 'yesterday' : `${daysAgo} days ago`;
  const sizeGb = Number(info.sizeOnDisk || 0) / (1024 ** 3);
  const size = sizeGb >= 1
    ? `${sizeGb.toFixed(sizeGb >= 10 ? 0 : 1)} GB`
    : info.sizeOnDisk ? `${Math.round(info.sizeOnDisk / (1024 ** 2))} MB` : '';
  return { updated, size };
}

export function newsAgeLabel(date, now = Date.now()) {
  const daysAgo = Math.max(0, Math.floor((now - Number(date || now)) / 86400000));
  return daysAgo === 0 ? 'today' : daysAgo === 1 ? 'yesterday' : `${daysAgo}d ago`;
}

export function updatePresentation(update = {}) {
  const watchPage = update.sourceKind === 'watch-page';
  const needsVersionCheck = update.status === 'attention';
  const bytes = Math.max(0, Number(update.remainingBytes) || 0);
  const remaining = watchPage
    ? `${update.currentVersion} → ${update.latestVersion}`
    : bytes >= 1024 ** 3
      ? `${(bytes / 1024 ** 3).toFixed(1)} GB`
      : `${Math.max(1, Math.round(bytes / 1024 ** 2))} MB`;
  return { watchPage, needsVersionCheck, remaining };
}
