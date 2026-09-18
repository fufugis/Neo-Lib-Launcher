const path = require('path');
const { assertRendererFresh } = require('./build-provenance.cjs');

module.exports = async function beforePack(context) {
  const appRoot = context?.appDir || path.resolve(__dirname, '..');
  const fingerprint = assertRendererFresh(appRoot);
  console.log(`Verified current renderer ${fingerprint.slice(0, 12)} before packaging.`);
};
