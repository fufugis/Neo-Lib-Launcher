const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');

const pluginRequire = createRequire(require.resolve('@vitejs/plugin-react'));
const parser = pluginRequire('@babel/parser');
const traverse = pluginRequire('@babel/traverse').default;

const sourceRoot = path.join(__dirname, '..', 'src');
const browserGlobals = new Set([
  'window', 'document', 'navigator', 'console', 'performance', 'crypto',
  'localStorage', 'sessionStorage', 'fetch', 'getComputedStyle',
  'requestAnimationFrame', 'cancelAnimationFrame', 'setTimeout', 'clearTimeout',
  'setInterval', 'clearInterval', 'CustomEvent', 'Event', 'Image', 'Audio',
  'File', 'Blob', 'FormData', 'URL', 'URLSearchParams', 'TextEncoder',
  'TextDecoder', 'AbortController', 'AbortSignal', 'structuredClone', 'atob',
  'btoa', 'React',
]);
const languageGlobals = new Set([
  'Array', 'Boolean', 'Date', 'Error', 'EvalError', 'Infinity', 'Intl', 'JSON',
  'Map', 'Math', 'NaN', 'Number', 'Object', 'Promise', 'RangeError',
  'ReferenceError', 'RegExp', 'Set', 'String', 'Symbol', 'SyntaxError',
  'TypeError', 'URIError', 'WeakMap', 'WeakSet', 'BigInt', 'undefined',
  'decodeURI', 'decodeURIComponent', 'encodeURI', 'encodeURIComponent',
  'isFinite', 'isNaN', 'parseFloat', 'parseInt',
]);
const injectedBuildGlobals = new Set(['__NEOLIB_BUILD_INFO__']);
const allowed = new Set([...browserGlobals, ...languageGlobals, ...injectedBuildGlobals]);

function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.(?:js|jsx|mjs)$/.test(entry.name) ? [full] : [];
  });
}

const failures = [];
const unusedRootFailures = [];
for (const file of sourceFiles(sourceRoot)) {
  const source = fs.readFileSync(file, 'utf8');
  const ast = parser.parse(source, {
    sourceType: 'module',
    plugins: ['jsx', 'importMeta', 'optionalChaining'],
  });
  traverse(ast, {
    ReferencedIdentifier(identifierPath) {
      const name = identifierPath.node.name;
      if (allowed.has(name) || identifierPath.scope.hasBinding(name)) return;
      failures.push(`${path.relative(sourceRoot, file)}:${identifierPath.node.loc.start.line} references unbound ${name}`);
    },
    FunctionDeclaration: {
      exit(functionPath) {
        if (path.basename(file) !== 'App.jsx' || functionPath.node.id?.name !== 'App') return;
        for (const [name, binding] of Object.entries(functionPath.scope.bindings)) {
          if (!binding.referenced) unusedRootFailures.push(`App.jsx:${binding.path.node.loc.start.line} declares unused App binding ${name}`);
        }
      },
    },
    Program: {
      exit(programPath) {
        if (path.basename(file) !== 'App.jsx') return;
        for (const [name, binding] of Object.entries(programPath.scope.bindings)) {
          if (!binding.referenced) unusedRootFailures.push(`App.jsx:${binding.path.node.loc.start.line} declares unused module binding ${name}`);
        }
      },
    },
  });
}

assert.deepEqual(failures, [], `Renderer contains names that can crash at runtime:\n${failures.join('\n')}`);
assert.deepEqual(unusedRootFailures, [], `App composition contains dead root bindings:\n${unusedRootFailures.join('\n')}`);
console.log(`PASS: ${sourceFiles(sourceRoot).length} renderer modules contain no unbound runtime identifiers, and App composition has no dead root bindings.`);
