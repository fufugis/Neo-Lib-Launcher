const fs = require('fs/promises');
const path = require('path');
const { pathToFileURL } = require('url');
const NAME = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}\.(png|jpe?g|webp|gif|apng|mp4|m4v|webm|mov|ogv)$/i;
const MIME = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', apng: 'image/png', gif: 'image/gif', webp: 'image/webp', mp4: 'video/mp4', m4v: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', ogv: 'video/ogg' };

function createLoungeBackgroundHandler(root, fetchFile) {
  return async request => {
    try {
      const url = new URL(request.url);
      const name = decodeURIComponent(url.pathname.slice(1));
      if (url.protocol !== 'neolib-background:' || url.host !== 'asset' || url.username || url.password || url.search || !NAME.test(name) || !['GET', 'HEAD'].includes(request.method)) return new Response(null, { status: 403 });
      const canonicalRoot = await fs.realpath(typeof root === 'function' ? root() : root);
      const file = await fs.realpath(path.join(canonicalRoot, name));
      if (path.dirname(file) !== canonicalRoot || !(await fs.stat(file)).isFile()) return new Response(null, { status: 403 });
      const response = await fetchFile(pathToFileURL(file).href, { method: request.method, headers: request.headers });
      const headers = new Headers(response.headers);
      headers.set('Content-Type', MIME[path.extname(name).slice(1).toLowerCase()]);
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('X-Content-Type-Options', 'nosniff');
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
    } catch { return new Response(null, { status: 404 }); }
  };
}
module.exports = { createLoungeBackgroundHandler };
