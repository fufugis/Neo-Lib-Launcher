const { guardHandler, guardResult, invalidRequest, invalidResponse, isBoundedString, isPath, isPlainObject } = require('./contract-guards.cjs');

function registerShellIpc({ registerIpc, shell }) {
  if (typeof registerIpc !== 'function' || typeof shell?.readShortcutLink !== 'function') {
    throw new TypeError('registerShellIpc requires registerIpc and shell.');
  }

  registerIpc('shell:resolveLnk', guardResult(guardHandler(async (_event, lnkPath) => {
    try {
      const info = shell.readShortcutLink(lnkPath);
      return { ok: true, target: info?.target || null, args: info?.args || '' };
    } catch (error) {
      return { ok: false, error: error?.message || String(error) };
    }
  }, lnkPath => isPath(lnkPath) && /\.lnk$/i.test(lnkPath), invalidRequest('The shortcut request was malformed.')),
  result => isPlainObject(result) && ((result.ok === false && isBoundedString(result.error, { required: true, max: 4000 }))
    || (result.ok === true && (result.target === null || isPath(result.target)) && isBoundedString(result.args, { max: 8192 }))),
  invalidResponse('Shortcut resolution returned an invalid result.')));
}

module.exports = { registerShellIpc };
