import { createRequire } from 'node:module';
import path from 'node:path';
import { randomBytes } from 'node:crypto';

const SERVICE = 'NEO-LIB optional usage';
function entry(account) {
  if (process.platform !== 'win32' || !process.env.APPDATA) throw new Error('Windows Credential Manager required.');
  const require = createRequire(import.meta.url);
  const { Entry } = require(path.join(process.env.APPDATA, 'npm', 'node_modules', '@napi-rs', 'keyring'));
  return new Entry(SERVICE, account);
}
export function readCredential(account) {
  const value = entry(account).getPassword();
  if (typeof value !== 'string' || value.length < 32) throw new Error('Usage credential is missing.');
  return value;
}
export function createCredential(account) {
  const record = entry(account);
  // Creation is explicit and never overwrites a saved credential or stable salt.
  let previous;
  try { previous = record.getPassword(); } catch (error) { if (!String(error.message).match(/NoEntry|not found|no entry/i)) throw error; }
  if (previous) { if (previous.length < 32) throw new Error('Existing usage credential is invalid.'); return previous; }
  const value = randomBytes(48).toString('base64url'); record.setPassword(value); return value;
}
