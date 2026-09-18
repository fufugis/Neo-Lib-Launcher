const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const appRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(appRoot, '..');
const excludedDirectories = new Set(['.git', 'node_modules', 'dist', 'dist-renderer', 'NEO-LIB-backups']);
const inspectedExtensions = new Set(['.cjs', '.js', '.jsx', '.mjs', '.json', '.md', '.yml', '.yaml', '.css', '.html']);
const signatures = [
  { name: 'Discord webhook', expression: new RegExp(['discord', '(?:app)?', '\\.com/api/', 'webhooks/', '\\d+/', '[A-Za-z0-9_-]{20,}'].join(''), 'i') },
  { name: 'Google API key', expression: new RegExp(['AI', 'za', '[0-9A-Za-z_-]{30,}'].join('')) },
  { name: 'GitHub token', expression: new RegExp(['github_', 'pat_', '[0-9A-Za-z_]{20,}|gh', '[pousr]_', '[0-9A-Za-z]{20,}'].join('')) },
  { name: 'OpenAI-style key', expression: new RegExp(['sk', '-', '(?:proj-)?', '[0-9A-Za-z_-]{20,}'].join('')) },
  { name: 'private key', expression: new RegExp(['BEGIN ', '(?:RSA |EC |OPENSSH )?', 'PRIVATE KEY'].join('')) },
];

function filesBelow(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && excludedDirectories.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...filesBelow(absolute));
    else if (entry.isFile() && inspectedExtensions.has(path.extname(entry.name).toLowerCase())) files.push(absolute);
  }
  return files;
}

const findings = [];
for (const file of filesBelow(repoRoot)) {
  const source = fs.readFileSync(file, 'utf8');
  for (const signature of signatures) {
    if (signature.expression.test(source)) findings.push(`${path.relative(repoRoot, file)} contains ${signature.name}`);
  }
}
assert.deepEqual(findings, [], `source contains credential-like material:\n${findings.join('\n')}`);

const gitignore = fs.readFileSync(path.join(repoRoot, '.gitignore'), 'utf8');
assert(/^\.env$/m.test(gitignore), 'root .gitignore must exclude .env');
assert(
  /^\.env\.local$/m.test(gitignore) || /^\.env\.\*$/m.test(gitignore),
  'root .gitignore must exclude .env.local directly or through .env.*',
);
const physicalEnvFiles = [];
const findEnvFiles = directory => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && excludedDirectories.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) findEnvFiles(absolute);
    else if (entry.isFile() && /^\.env(?:\.|$)/i.test(entry.name)) physicalEnvFiles.push(path.relative(repoRoot, absolute));
  }
};
findEnvFiles(repoRoot);

let trackedFilesVerified = false;
try {
  const tracked = execFileSync('git', ['ls-files'], { cwd: repoRoot, encoding: 'utf8' }).split(/\r?\n/).filter(Boolean);
  assert.deepEqual(tracked.filter(file => /(^|\/)\.env(?:\.|$)/i.test(file)), [], 'no .env file may be tracked');
  trackedFilesVerified = true;
} catch (error) {
  if (process.env.GITHUB_ACTIONS === 'true') throw error;
  console.warn(`NOTICE: Git tracked-file check unavailable locally (${error.code || error.message}); physical files and ignore rules were still verified.`);
}

const workflow = fs.readFileSync(path.join(repoRoot, '.github', 'workflows', 'build-windows.yml'), 'utf8');
const releaseConfigSource = fs.readFileSync(path.join(appRoot, 'scripts', 'prepare-release-config.cjs'), 'utf8');
const localReleaseBuilder = fs.readFileSync(path.join(appRoot, 'scripts', 'build-release.ps1'), 'utf8');
assert(workflow.includes('persist-credentials: false'), 'checkout must not persist a write-capable GitHub token into the build workspace');
for (const name of ['NEOLIB_FEEDBACK_RELAY_URL', 'NEOLIB_FEEDBACK_RELAY_KEY', 'NEOLIB_DISCORD_APP_ID']) {
  assert(workflow.includes(`secrets.${name}`), `Windows workflow must source ${name} from GitHub Secrets`);
}
for (const requiredFeedbackSecret of ['NEOLIB_FEEDBACK_RELAY_URL', 'NEOLIB_FEEDBACK_RELAY_KEY']) {
  assert(
    releaseConfigSource.includes(`Required release setting ${requiredFeedbackSecret} is missing`),
    `Windows workflow must fail closed when ${requiredFeedbackSecret} is missing`,
  );
}
assert(releaseConfigSource.includes('NEOLIB_FEEDBACK_RELAY_URL must use HTTPS'), 'release configuration must reject an invalid feedback relay URL');
assert(releaseConfigSource.includes('NEOLIB_FEEDBACK_RELAY_KEY must be 32-256 URL-safe characters'), 'release configuration must reject a weak or injectable feedback relay key');
assert(
  workflow.indexOf('node scripts/prepare-release-config.cjs') < workflow.indexOf('yarn build:renderer'),
  'Discord App ID must be prepared before renderer provenance is calculated',
);
assert(
  workflow.indexOf('node scripts/cleanup-release-config.cjs') > workflow.indexOf('yarn build:renderer'),
  'temporary renderer environment must be removed immediately after compilation',
);
assert(
  workflow.indexOf('finally {') < workflow.indexOf('node scripts/cleanup-release-config.cjs'),
  'CI must clean the temporary renderer environment even when compilation fails',
);
assert(
  localReleaseBuilder.indexOf('finally {') < localReleaseBuilder.indexOf('scripts/cleanup-release-config.cjs'),
  'local releases must clean the temporary renderer environment even when compilation fails',
);
assert(
  releaseConfigSource.includes("if (!discordAppId) return ''"),
  'release configuration must explicitly preserve optional Discord behavior when its setting is absent',
);
assert(releaseConfigSource.includes('NEOLIB_DISCORD_APP_ID must contain only the numeric Discord application ID'), 'release configuration must reject unsafe Discord configuration');
const discordConfig = fs.readFileSync(path.join(appRoot, 'electron', 'discord-config.js'), 'utf8');
assert(/DISCORD_APP_ID:\s*['"]['"]/.test(discordConfig), 'checked-in Discord config must remain empty');
const generatedDiscordConfigPath = path.join(appRoot, 'electron', 'discord-config.generated.js');
if (fs.existsSync(generatedDiscordConfigPath)) {
  assert(process.env.NEOLIB_DISCORD_APP_ID, 'generated Discord config may exist only while its matching App ID is explicitly supplied');
  assert(/^\d{10,30}$/.test(process.env.NEOLIB_DISCORD_APP_ID), 'Discord App ID must be numeric');
  assert(fs.readFileSync(generatedDiscordConfigPath, 'utf8').includes(process.env.NEOLIB_DISCORD_APP_ID), 'generated Discord config must match the supplied App ID');
} else if (process.env.GITHUB_ACTIONS === 'true' && process.env.NEOLIB_DISCORD_APP_ID) {
  assert(/^\d{10,30}$/.test(process.env.NEOLIB_DISCORD_APP_ID), 'CI Discord App ID must be numeric');
  assert.fail('generated CI Discord config must exist when its App ID is configured');
}

console.log(`PASS: ${filesBelow(repoRoot).length} source/config/document files contain no known credential signature; ${physicalEnvFiles.length} local .env build input(s) are ignored${trackedFilesVerified ? '/untracked' : ''}; build credentials come from GitHub Secrets, missing feedback credentials stop the release, and optional Discord configuration is evaluated safely.`);
