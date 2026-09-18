import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { createBuildInfo } = require('./scripts/build-provenance.cjs');
const buildInfo = createBuildInfo(fileURLToPath(new URL('.', import.meta.url)));

export default defineConfig({
  plugins: [react()],
  base: './',
  define: {
    __NEOLIB_BUILD_INFO__: JSON.stringify(buildInfo),
  },
  build: {
    outDir: 'dist-renderer',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
