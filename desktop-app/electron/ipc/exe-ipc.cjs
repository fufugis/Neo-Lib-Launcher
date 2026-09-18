const { guardHandler, guardResult, isBoundedString, isPath } = require('./contract-guards.cjs');

function registerExeIpc({ registerIpc, app }) {
  if (typeof registerIpc !== 'function' || typeof app?.getFileIcon !== 'function') {
    throw new TypeError('registerExeIpc requires registerIpc and app.');
  }

  registerIpc('exe:icon', guardResult(guardHandler(async (_event, exePath) => {
    try {
      const image = await app.getFileIcon(exePath, { size: 'large' });
      if (image.isEmpty()) return null;
      return image.toDataURL();
    } catch {
      return null;
    }
  }, exePath => isPath(exePath), null), value => value === null
    || (isBoundedString(value, { required: true, max: 10 * 1024 * 1024 }) && value.startsWith('data:image/')), null));
}

module.exports = { registerExeIpc };
