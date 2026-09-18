export function normalizeVersion(value) {
  const match = String(value || '').trim().match(/^(?:v\.?\s*)?(\d+(?:\.\d+)*)/i);
  return match?.[1] || '';
}

export function parseVersion(value) {
  const normalized = normalizeVersion(value);
  return normalized ? normalized.split('.').map(part => Number.parseInt(part, 10) || 0) : [0, 0, 0];
}

export function isNewerVersion(latest, current) {
  const left = parseVersion(latest);
  const right = parseVersion(current);
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const next = left[index] || 0;
    const installed = right[index] || 0;
    if (next > installed) return true;
    if (next < installed) return false;
  }
  return false;
}

export function releaseTagForVersion(version) {
  const normalized = normalizeVersion(version);
  return normalized ? `v${normalized}` : '';
}

export function isLegacyCompatibleReleaseTag(tag, version) {
  return tag === releaseTagForVersion(version) && /^v\d+\.\d+\.\d+$/i.test(tag);
}
