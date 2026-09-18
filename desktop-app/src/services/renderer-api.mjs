const gateways = new WeakMap();

export function getRendererApi(targetWindow = typeof window === 'undefined' ? null : window) {
  const api = targetWindow?.api;
  if (!api || typeof api !== 'object') return null;
  if (gateways.has(api)) return gateways.get(api);
  const gateway = new Proxy(Object.create(null), {
    get(_target, property) {
      const member = api[property];
      return typeof member === 'function' ? (...args) => member.apply(api, args) : member;
    },
    has(_target, property) { return property in api; },
  });
  gateways.set(api, gateway);
  return gateway;
}

export function hasRendererApi(targetWindow = typeof window === 'undefined' ? null : window) {
  return Boolean(getRendererApi(targetWindow));
}

export async function callRendererApi(api, method, payload, fallback = null) {
  if (!api || typeof api[method] !== 'function') return fallback;
  try { return await api[method](payload); } catch { return fallback; }
}
