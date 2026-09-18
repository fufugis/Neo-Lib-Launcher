const path = require('node:path');
const { cleanupReleaseConfig } = require('./prepare-release-config.cjs');

try {
  const result = cleanupReleaseConfig({ appRoot: path.resolve(__dirname, '..') });
  console.log(`Temporary renderer environment removed: ${result.removed ? 'yes' : 'no'}.`);
} catch (error) {
  console.error(`RELEASE CONFIGURATION CLEANUP FAILED: ${error.message}`);
  process.exitCode = 1;
}
