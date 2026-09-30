const assert = require('node:assert/strict');
const { createMetadataCandidateService } = require('../electron/providers/metadata-candidate-service.cjs');

(async () => {
  const calls = [];
  const service = createMetadataCandidateService({
    cleanSearchTerm: value => String(value || '').replace(/[_-]+/g, ' ').trim(),
    listSources: {
      steam: async (term, context) => { calls.push(['list', term, context]); return [{ source: 'steam', id: '620', name: term }]; },
      gog: async term => [{ source: 'gog', id: 'gog-1', name: term, raw: { coverVertical: 'https://art.test/cover.jpg' } }],
      unrelated: async () => [{ source: 'unrelated', id: 'random', name: 'Totally Different Game' }],
      ai: async (term, context) => [{ source: 'ai', name: `${term}:${context.aiModel}`, raw: { ok: true } }],
      steamgriddb: async (term, context) => context.steamGridDbKey ? [{ source: 'steamgriddb', id: 'sgdb-1', name: term }] : [],
      broken: async () => { throw new Error('source unavailable'); },
      malformed: async () => ({ nope: true }),
    },
    expandSources: {
      steam: async candidate => candidate.id === '12345' ? null : ({ source: 'steam', appid: candidate.id }),
      ai: candidate => candidate.raw,
      steamgriddb: candidate => ({ source: 'steamgriddb', name: candidate.name, portraitImage: 'https://art.test/portrait.jpg' }),
      broken: async () => { throw new Error('expand failed'); },
    },
  });

  assert.deepEqual(await service.listCandidates({ source: 'steam', query: 'Portal_2' }), { candidates: [{ source: 'steam', id: '620', name: 'Portal 2' }] });
  assert.equal(calls[0][1], 'Portal 2');
  assert.deepEqual(await service.listCandidates({ source: 'ai', query: 'Game', geminiKey: 'secret', aiModel: 'model-id' }), { candidates: [{ source: 'ai', name: 'Game:model-id', raw: { ok: true } }] });
  const all = await service.listCandidates({ source: 'all', query: 'Windrose' });
  assert.equal(all.candidates.length, 2, 'all-source search keeps relevant provider results and filters unrelated titles');
  assert.deepEqual(new Set(all.candidates.map(candidate => candidate.source)), new Set(['steam', 'gog']));
  assert.equal(all.sourcesSearched, 5, 'configured optional providers are skipped when no keys are entered');
  assert.ok(all.sourceErrors.includes('broken'), 'a provider failure is reported without discarding successful results');
  const withAi = await service.listCandidates({ source: 'all', query: 'Windrose', geminiKey: 'secret', aiModel: 'model-id' });
  assert.ok(withAi.candidates.some(candidate => candidate.source === 'ai'));
  const withArtwork = await service.listCandidates({ source: 'all', query: 'Windrose', geminiKey: 'secret', steamGridDbKey: 'private-key', aiModel: 'model-id' });
  assert.ok(withArtwork.candidates.some(candidate => candidate.source === 'steamgriddb'));
  assert.equal(withArtwork.sourcesSearched, 7, 'configured AI and artwork sources join the all-source search');
  assert.deepEqual(await service.listCandidates({ source: 'steam', query: '' }), { candidates: [], error: 'Empty query' });
  assert.deepEqual(await service.listCandidates({ source: 'unknown', query: 'Game' }), { candidates: [], error: 'Unknown source' });
  assert.deepEqual(await service.listCandidates({ source: 'malformed', query: 'Game' }), { candidates: [] });
  assert.match((await service.listCandidates({ source: 'broken', query: 'Game' })).error, /source unavailable/);
  assert.deepEqual(await service.expandCandidate({ candidate: { source: 'steam', id: '620' } }), { source: 'steam', appid: '620' });
  assert.deepEqual(await service.expandCandidate({ candidate: { source: 'ai', raw: { ok: true } } }), { ok: true });
  const fallback = await service.expandCandidate({ candidate: { source: 'broken', id: 'windrose', name: 'Windrose', image: 'https://art.test/windrose.jpg' } });
  assert.equal(fallback.metadataFallback, true, 'failed detail expansion still returns the reviewed search candidate');
  assert.equal(fallback.capsuleImage, 'https://art.test/windrose.jpg');
  const steamFallback = await service.expandCandidate({ candidate: { source: 'steam', id: '12345', name: 'Windrose', image: 'https://art.test/header.jpg' } });
  assert.equal(steamFallback.appid, '12345');
  assert.match(steamFallback.portraitImage, /12345\/library_600x900\.jpg$/);
  assert.equal(await service.expandCandidate({ candidate: { source: 'unknown' } }), null);
  assert.equal(await service.expandCandidate({}), null);
  assert.throws(() => createMetadataCandidateService({}), /requires search normalization/);
  console.log('PASS: metadata-candidate orchestration allow-lists list/expand sources, preserves context and normalization, and contains empty, unknown, malformed and throwing providers. No provider or network request ran.');
})().catch(error => { console.error(error); process.exitCode = 1; });
