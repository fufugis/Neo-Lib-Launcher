const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ARCHITECTURE_LABEL = 'Stage 9B source-frozen';
const SOURCE_ROOTS = ['electron', 'src', 'public'];
const SOURCE_FILES = ['package.json', 'vite.config.js'];

function collectFiles(appRoot) {
  const files = [];
  const walk = relative => {
    const absolute = path.join(appRoot, relative);
    for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
      const child = path.join(relative, entry.name);
      if (entry.isDirectory()) walk(child);
      else if (entry.isFile()) files.push(child.replace(/\\/g, '/'));
    }
  };
  for (const root of SOURCE_ROOTS) walk(root);
  for (const file of SOURCE_FILES) if (fs.existsSync(path.join(appRoot, file))) files.push(file);
  return files.sort();
}

function sourceFingerprint(appRoot) {
  const hash = crypto.createHash('sha256');
  for (const relative of collectFiles(appRoot)) {
    hash.update(relative);
    hash.update('\0');
    hash.update(fs.readFileSync(path.join(appRoot, relative)));
    hash.update('\0');
  }
  return hash.digest('hex').toUpperCase();
}

function gitRevision(appRoot) {
  try {
    const options = { cwd: appRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] };
    const head = execFileSync('git', ['rev-parse', '--short', 'HEAD'], options).trim();
    const dirty = Boolean(execFileSync('git', ['status', '--porcelain', '--untracked-files=normal'], options).trim());
    return `${head}${dirty ? '+local' : ''}`;
  } catch {
    return 'source-archive';
  }
}

function createBuildInfo(appRoot, now = new Date()) {
  const fingerprint = sourceFingerprint(appRoot);
  return Object.freeze({
    id: fingerprint.slice(0, 12),
    fingerprint,
    revision: gitRevision(appRoot),
    builtAt: now.toISOString(),
    architecture: ARCHITECTURE_LABEL,
  });
}

function rendererJavaScriptFiles(distDir) {
  if (!fs.existsSync(distDir)) return [];
  const files = [];
  const walk = current => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) walk(absolute);
      else if (entry.isFile() && entry.name.endsWith('.js')) files.push(absolute);
    }
  };
  walk(distDir);
  return files;
}

function assertRendererFresh(appRoot, distDir = path.join(appRoot, 'dist-renderer')) {
  const expected = sourceFingerprint(appRoot);
  const scripts = rendererJavaScriptFiles(distDir);
  if (!scripts.length) throw new Error('Renderer output is missing. Run npm run build:renderer before packaging.');
  if (!scripts.some(file => fs.readFileSync(file).includes(expected))) {
    throw new Error(`Renderer output is stale for source ${expected.slice(0, 12)}. Run npm run build:renderer before Electron Builder.`);
  }
  return expected;
}

module.exports = { ARCHITECTURE_LABEL, collectFiles, sourceFingerprint, createBuildInfo, assertRendererFresh };
