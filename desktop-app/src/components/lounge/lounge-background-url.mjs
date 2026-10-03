// Keep file URLs in preferences/profile identity; use the app's bounded media
// route for display and pixel sampling from both dev HTTP and packaged pages.
export function loungeBackgroundDisplayUrl(value) {
  if (typeof value !== 'string') return value;
  try {
    const url = new URL(value);
    const match = url.protocol === 'file:' && !url.host && decodeURIComponent(url.pathname).match(/\/lounge-backgrounds\/([\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}\.(?:png|jpe?g|webp|gif|apng|mp4|m4v|webm|mov|ogv))$/i);
    return match ? `neolib-background://asset/${match[1]}` : value;
  } catch { return value; }
}
