const { Transform } = require('node:stream');
const { pipeline } = require('node:stream/promises');

function createRetroHttpClient({ http, https, fs, fsp }) {
  function response(url, headers = {}, timeoutMs = 30000, redirects = 0, signal) {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) return reject(new Error('Request cancelled.'));
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) return reject(new Error('Invalid endpoint.'));
      const request = (parsed.protocol === 'https:' ? https : http).get(parsed, { headers, timeout: timeoutMs }, result => {
        clearTimeout(timer);
        if ([301, 302, 303, 307, 308].includes(result.statusCode)) {
          result.destroy();
          let next;
          try { next = new URL(result.headers.location || '', parsed); } catch { reject(new Error('Invalid source redirect.')); return; }
          if (redirects >= 3 || next.origin !== parsed.origin || next.username || next.password) return reject(new Error('Cross-origin redirect refused.'));
          response(next.href, headers, timeoutMs, redirects + 1, signal).then(resolve, reject); return;
        }
        if (result.statusCode !== 200) { result.destroy(); const error = new Error(`Source returned HTTP ${Number(result.statusCode) || 0}.`); error.status = result.statusCode; reject(error); return; }
        // Also bound stalled response bodies, not only the initial connection.
        result.setTimeout(timeoutMs, () => result.destroy(new Error('Source response timed out.')));
        resolve(result);
      });
      const abort = () => request.destroy(new Error('Request cancelled.'));
      signal?.addEventListener('abort', abort, { once: true });
      const timer = setTimeout(() => request.destroy(new Error('Source request timed out.')), timeoutMs);
      timer.unref?.();
      request.on('close', () => { clearTimeout(timer); signal?.removeEventListener('abort', abort); });
      request.on('timeout', () => request.destroy(new Error('Source request timed out.')));
      request.on('error', () => { clearTimeout(timer); reject(new Error(signal?.aborted ? 'Request cancelled.' : 'Could not connect to the source.')); });
    });
  }
  async function bytes(url, { headers = {}, maxBytes = 12 * 1024 * 1024 } = {}) {
    const result = await response(url, headers);
    if (Number(result.headers['content-length']) > maxBytes) { result.destroy(); throw new Error('Source response is too large.'); }
    const parts = []; let size = 0;
    const deadline = setTimeout(() => result.destroy(new Error('Source response timed out.')), 60000); deadline.unref?.();
    try {
      for await (const part of result) { size += part.length; if (size > maxBytes) { result.destroy(); throw new Error('Source response is too large.'); } parts.push(part); }
      return Buffer.concat(parts);
    } finally { clearTimeout(deadline); }
  }
  async function json(url, options) {
    const body = await bytes(url, { ...options, maxBytes: 8 * 1024 * 1024 });
    try { return JSON.parse(body.toString('utf8')); } catch { throw new Error('Source did not return valid JSON.'); }
  }
  async function download(url, output, { headers = {}, maxBytes = 8 * 1024 ** 3, timeoutMs = 60000, expectedBytes, signal } = {}) {
    const controller = new AbortController(); const cancel = () => controller.abort();
    if (signal?.aborted) controller.abort(); else signal?.addEventListener('abort', cancel, { once: true });
    const deadline = setTimeout(cancel, 15 * 60 * 1000); deadline.unref?.();
    let result;
    try { result = await response(url, headers, timeoutMs, 0, controller.signal); }
    catch (error) { clearTimeout(deadline); signal?.removeEventListener('abort', cancel); throw error; }
    let size = 0;
    const limiter = new Transform({ transform(chunk, _encoding, callback) { size += chunk.length; callback(size > maxBytes ? new Error('Download exceeds the configured limit.') : null, chunk); } });
    let created = false;
    try {
      if (Number(result.headers['content-length']) > maxBytes) throw new Error('Download exceeds the configured limit.');
      const handle = await fsp.open(output, 'wx'); created = true;
      await pipeline(result, limiter, handle.createWriteStream(), { signal: controller.signal });
      if (!size || (expectedBytes > 0 && size !== expectedBytes)) throw new Error('Downloaded file size did not match the source.');
      return size;
    } catch (error) { result.destroy(); if (created) await fsp.unlink(output).catch(() => {}); throw error; }
    finally { clearTimeout(deadline); signal?.removeEventListener('abort', cancel); }
  }
  return { bytes, json, download };
}
module.exports = { createRetroHttpClient };
