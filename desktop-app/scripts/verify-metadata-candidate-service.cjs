const assert = require('node:assert/strict');
const { createMetadataCandidateService } = require('../electron/providers/metadata-candidate-service.cjs');

(async () => {
  const calls = [];
  const service = createMetadataCandidateService({
    cleanSearchTerm: value => String(value || '').replace(/[_-]+/g, ' ').trim(),
    listSources: {
      steam: async (term, context) => { calls.push(['list', term, context]); return [{ source: 'steam', id: '620' }]; },
      ai: async (term, context) => [{ source: 'ai', name: `${term}:${context.aiModel}`, raw: { ok: true } }],
      broken: async () => { throw new Error('source unavailable'); },
      malformed: async () => ({ nope: true }),
    },
    expandSources: {
      steam: async candidate => ({ source: 'steam', appid: candidate.id }),
      ai: candidate => candidate.raw,
      broken: async () => { throw new Error('expand failed'); },
    },
  });

  assert.deepEqual(await service.listCandidates({ source: 'steam', query: 'Portal_2' }), { candidates: [{ source: 'steam', id: '620' }] });
  assert.equal(calls[0][1], 'Portal 2');
  assert.deepEqual(await service.listCandidates({ source: 'ai', query: 'Game', geminiKey: 'secret', aiModel: 'model-id' }), { candidates: [{ source: 'ai', name: 'Game:model-id', raw: { ok: true } }] });
  assert.deepEqual(await service.listCandidates({ source: 'steam', query: '' }), { candidates: [], error: 'Empty query' });
  assert.deepEqual(await service.listCandidates({ source: 'unknown', query: 'Game' }), { candidates: [], error: 'Unknown source' });
  assert.deepEqual(await service.listCandidates({ source: 'malformed', query: 'Game' }), { candidates: [] });
  assert.match((await service.listCandidates({ source: 'broken', query: 'Game' })).error, /source unavailable/);
  assert.deepEqual(await service.expandCandidate({ candidate: { source: 'steam', id: '620' } }), { source: 'steam', appid: '620' });
  assert.deepEqual(await service.expandCandidate({ candidate: { source: 'ai', raw: { ok: true } } }), { ok: true });
  assert.equal(await service.expandCandidate({ candidate: { source: 'broken' } }), null);
  assert.equal(await service.expandCandidate({ candidate: { source: 'unknown' } }), null);
  assert.equal(await service.expandCandidate({}), null);
  assert.throws(() => createMetadataCandidateService({}), /requires search normalization/);
  console.log('PASS: metadata-candidate orchestration allow-lists list/expand sources, preserves context and normalization, and contains empty, unknown, malformed and throwing providers. No provider or network request ran.');
})().catch(error => { console.error(error); process.exitCode = 1; });
