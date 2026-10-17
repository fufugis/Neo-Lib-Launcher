import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { readCredential } from './credential-store.mjs';
import { USAGE_ORIGIN } from './service-config.mjs';
const secretValues = [readCredential('analytics-admin'), readCredential('analytics-salt')];
const root = new URL('../../desktop-app/dist-renderer/', import.meta.url);
let endpointFound = false, checked = 0;
async function visit(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory);
    if (entry.isDirectory()) await visit(file);
    else if (/\.(js|html|json|map)$/.test(entry.name)) {
      const text = await readFile(file, 'utf8'); checked++;
      for (const value of secretValues) assert(!text.includes(value), 'An owner credential must never be present in customer output');
      if (text.includes(`${USAGE_ORIGIN}/events`)) endpointFound = true;
    }
  }
}
await visit(root); assert(endpointFound, 'Public reporting URL must be compiled in this configured build');
console.log(`PASS: public opt-in reporting URL compiled; neither actual private owner credential appears in ${checked} renderer text files.`);
