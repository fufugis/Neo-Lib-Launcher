import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createBoundedOperation } from '../src/services/bounded-operation.mjs';
import { exportOperationDiagnostics, readOperationJournal, recordOperationDiagnostic } from '../src/services/operation-journal.mjs';
import { finishOperation, idleOperation, OPERATION_STATUS, safeOperationDiagnostic, startOperation } from '../src/state/operation-state.mjs';

const memoryStorage = () => { const values = new Map(); return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) }; };
let clock = 1_000;
const started = startOperation('launcher-import', { id: 'launcher-import-test-1', now: clock, total: 3, message: 'private title must not enter diagnostics' });
const done = finishOperation(started, { status: OPERATION_STATUS.PARTIAL, now: 1_350, completed: 2, failed: 1, code: 'PARTIAL', message: 'C:/Private/Game.exe' });
assert.deepEqual(safeOperationDiagnostic(done), { id: 'launcher-import-test-1', domain: 'launcher-import', status: 'partial', startedAt: 1000, endedAt: 1350, durationMs: 350, completed: 2, failed: 1, total: 3, code: 'PARTIAL' });
assert.equal('message' in safeOperationDiagnostic(done), false);
assert.equal(idleOperation('news').status, 'idle');

const storage = memoryStorage();
assert.equal(recordOperationDiagnostic(done, storage), true);
assert.equal(readOperationJournal(storage).length, 1);
assert.doesNotMatch(exportOperationDiagnostics(storage), /Private|Game\.exe/);

const states = [];
const completed = createBoundedOperation({ domain: 'news', total: 2, timeoutMs: 100, task: async () => ({ items: [1, 2] }), onState: (state) => states.push(state), journal: () => {}, now: () => ++clock });
const completedResult = await completed.promise;
assert.equal(completedResult.state.status, 'succeeded');
assert.equal(completedResult.value.items.length, 2);
assert.equal(states[0].status, 'running');

let fireTimeout;
const timed = createBoundedOperation({ domain: 'updates', timeoutMs: 10, task: () => new Promise(() => {}), setTimer: (callback) => { fireTimeout = callback; return 1; }, clearTimer: () => {}, journal: () => {}, now: () => ++clock });
fireTimeout();
assert.equal((await timed.promise).state.status, 'timed-out');

const cancelled = createBoundedOperation({ domain: 'launcher-import', timeoutMs: 100, task: () => new Promise(() => {}), journal: () => {}, now: () => ++clock });
cancelled.cancel();
assert.equal((await cancelled.promise).state.status, 'cancelled');

const partial = createBoundedOperation({ domain: 'metadata-refresh', total: 4, timeoutMs: 100, task: async () => ({ operationCompleted: 3, operationFailed: 1 }), journal: () => {}, now: () => ++clock });
assert.equal((await partial.promise).state.status, 'partial');

const read = (relative) => fs.readFileSync(new URL(`../${relative}`, import.meta.url), 'utf8');
const wizard = read('src/components/WizardModal.jsx');
const home = read('src/components/HomeHub.jsx');
const news = read('src/components/NewsPanel.jsx');
const feedback = read('src/components/FeedbackModal.jsx');
assert.match(wizard, /domain: 'launcher-scan'/);
assert.match(wizard, /domain: 'launcher-import'/);
assert.match(wizard, /domain: 'wizard-folder-scan'/);
assert.match(wizard, /domain: 'wizard-metadata'/);
assert.match(wizard, /domain: 'wizard-image-cache'/);
assert.match(wizard, /timeoutMs: scanDepth === 'deep' \? 55_000 : 32_000/);
assert.match(wizard, /timeoutMs: 28_000/);
assert.match(wizard, /timeoutMs: 12_000/);
assert.match(wizard, /Cancel scan/);
assert.match(wizard, /Cancel lookup/);
assert.match(wizard, /if \(run !== folderScanRun\.current\) return/);
assert.match(wizard, /if \(run !== metadataRun\.current\) return/);
assert.match(wizard, /if \(run !== acceptRun\.current\) return/);
for (const domain of ['home-news', 'weekly-releases', 'game-update-scan', 'storage-scan']) assert.ok(home.includes(`domain: '${domain}'`), `${domain} uses the shared lifecycle`);
assert.match(news, /Cancelled by the player/);
assert.match(feedback, /feedback-include-diagnostics/);
assert.match(feedback, /Discord feedback is not configured in this build/);
assert.match(feedback, /Send to Discord/);
assert.doesNotMatch(feedback, /feedback-github-fallback-btn/);
assert.doesNotMatch(feedback, /Open GitHub report/);
assert.match(feedback, /Safe operation summary \(player approved\)/);
assert.doesNotMatch(read('src/services/operation-journal.mjs'), /gameName|exePath|query|pinHash|apiKey|message:/);

console.log('Operation lifecycle and privacy-safe diagnostic verification passed.');
