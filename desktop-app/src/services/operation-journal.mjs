import { safeOperationDiagnostic } from '../state/operation-state.mjs';

const STORAGE_KEY = 'neolib.safe-operation-diagnostics.v1';
const MAX_ENTRIES = 40;

function defaultStorage() {
  try { return globalThis?.localStorage || null; } catch { return null; }
}

export function readOperationJournal(storage) {
  const target = storage === undefined ? defaultStorage() : storage;
  try {
    const value = JSON.parse(target?.getItem?.(STORAGE_KEY) || '[]');
    return Array.isArray(value) ? value.filter((entry) => entry && typeof entry === 'object').slice(-MAX_ENTRIES) : [];
  } catch { return []; }
}

export function recordOperationDiagnostic(operation, storage) {
  const target = storage === undefined ? defaultStorage() : storage;
  const entry = safeOperationDiagnostic(operation);
  if (!entry) return false;
  try {
    const next = [...readOperationJournal(target).filter((item) => item.id !== entry.id), entry].slice(-MAX_ENTRIES);
    target?.setItem?.(STORAGE_KEY, JSON.stringify(next));
    return true;
  } catch { return false; }
}

export function exportOperationDiagnostics(storage) {
  return JSON.stringify({ schema: 1, generatedAt: Date.now(), operations: readOperationJournal(storage) }, null, 2);
}

export function clearOperationJournal(storage) {
  const target = storage === undefined ? defaultStorage() : storage;
  try { target?.removeItem?.(STORAGE_KEY); return true; } catch { return false; }
}
