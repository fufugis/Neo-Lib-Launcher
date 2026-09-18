const assert = require('node:assert/strict');
const { createGeminiProviderService } = require('../electron/providers/gemini-provider-service.cjs');

(async () => {
  const requests = [];
  let reply = JSON.stringify({ name: 'Portal 2', shortDescription: 'Puzzle', about: 'Science', genres: Array(15).fill('Puzzle'), developers: ['Valve'], publishers: ['Valve'], releaseDate: '2011', website: 'https://example.test', metacritic: 95 });
  const service = createGeminiProviderService({
    cleanSearchTerm: value => String(value || '').replace(/[_-]+/g, ' ').trim(),
    models: [{ id: 'gemini-safe', provider: 'gemini' }], defaultModel: 'gemini-safe',
    async httpPostJson(url, body) { requests.push({ url, body }); return { candidates: [{ content: { parts: [{ text: reply }] } }] }; },
  });
  assert.equal(service.resolveModel('unknown'), 'gemini-safe');
  const metadata = await service.requestGameMetadata('secret key', 'Portal_2', 'unknown');
  assert.equal(metadata.name, 'Portal 2');
  assert.equal(metadata.genres.length, 12);
  assert.equal(metadata.queryEvidence, 'Portal 2');
  assert.match(requests[0].url, /models\/gemini-safe:generateContent\?key=secret%20key$/);
  assert.equal(requests[0].body.generationConfig.responseMimeType, 'application/json');
  await assert.rejects(() => service.requestGameMetadata('', 'Game'), /Add a Gemini API key/);
  await assert.rejects(() => service.requestGameMetadata('key', ''), /Enter a game name/);
  reply = 'not json';
  await assert.rejects(() => service.requestGameMetadata('key', 'Game'), /unreadable metadata/);
  reply = 'Hello from Fungist';
  const history = Array.from({ length: 20 }, (_, index) => ({ role: index % 2 ? 'assistant' : 'user', text: `line-${index}` }));
  const chat = await service.requestAssistant('key', 'Help me', 'gemini-safe', history, `Visible\u0000 Game${'x'.repeat(25000)}`);
  assert.equal(chat, 'Hello from Fungist');
  const chatBody = requests.at(-1).body;
  assert.ok(chatBody.contents.length <= 13);
  assert.equal(chatBody.contents.at(-1).parts[0].text, 'Help me');
  assert.ok(chatBody.systemInstruction.parts[0].text.length < 27000);
  assert.ok(!chatBody.systemInstruction.parts[0].text.includes('\u0000'));
  assert.equal(chatBody.generationConfig.maxOutputTokens, 260);
  await assert.rejects(() => service.requestAssistant('', 'Hi'), /Add a Gemini API key/);
  await assert.rejects(() => service.requestAssistant('key', ''), /Write a question/);
  assert.throws(() => createGeminiProviderService({}), /explicit model allow-list/);
  console.log('PASS: Gemini provider enforces its model allow-list, metadata normalization, key/query errors, bounded chat history/context and response settings through injected HTTP only. No network request ran.');
})().catch(error => { console.error(error); process.exitCode = 1; });
