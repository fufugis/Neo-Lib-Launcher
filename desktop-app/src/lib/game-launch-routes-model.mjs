export const LAUNCH_ROUTE_KINDS = Object.freeze([
  Object.freeze({ id: 'play', label: 'Play' }),
  Object.freeze({ id: 'configuration', label: 'Configuration' }),
  Object.freeze({ id: 'mods', label: 'Mods' }),
  Object.freeze({ id: 'saves', label: 'Save folder' }),
  Object.freeze({ id: 'benchmark', label: 'Benchmark' }),
  Object.freeze({ id: 'emulator', label: 'Emulator profile' }),
  Object.freeze({ id: 'utility', label: 'Utility' }),
]);

const KINDS = new Set(LAUNCH_ROUTE_KINDS.map(({ id }) => id));
const text = (value, max = 500) => String(value || '').trim().slice(0, max);
const safeId = (value) => text(value, 80).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 56);

export function normalizeLaunchRoutes(routes = []) {
  const output = [];
  const ids = new Set();
  for (const raw of Array.isArray(routes) ? routes.slice(0, 12) : []) {
    const label = text(raw?.label, 64);
    const id = safeId(raw?.id || label);
    const kind = KINDS.has(raw?.kind) ? raw.kind : 'utility';
    if (!id || !label || ids.has(id)) continue;
    ids.add(id);
    output.push(Object.freeze({
      id,
      label,
      kind,
      targetType: raw?.targetType === 'uri' ? 'uri' : 'executable',
      target: text(raw?.target, 1_024),
      arguments: text(raw?.arguments, 1_024),
      workingDirectory: text(raw?.workingDirectory, 1_024),
      primary: raw?.primary === true,
      enabled: raw?.enabled !== false,
    }));
  }
  const firstPrimary = output.findIndex((route) => route.primary && route.enabled);
  return Object.freeze(output.map((route, index) => Object.freeze({ ...route, primary: index === firstPrimary })));
}

export function primaryLaunchRoute(routes = []) {
  const normalized = normalizeLaunchRoutes(routes);
  return normalized.find((route) => route.primary && route.enabled)
    || normalized.find((route) => route.kind === 'play' && route.enabled)
    || normalized.find((route) => route.enabled)
    || null;
}
