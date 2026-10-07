const assert = require('node:assert/strict');
const fs = require('node:fs'); const fsp = require('node:fs/promises'); const path = require('node:path'); const os = require('node:os'); const crypto = require('node:crypto');
const { Readable, PassThrough } = require('node:stream'); const { EventEmitter } = require('node:events');
const { parseGamelist, inspectGamelist } = require('../electron/emulation/gamelist-import.cjs');
const { createRetroCredentialStore } = require('../electron/emulation/retro-credential-store.cjs');
const { createRetroHttpClient } = require('../electron/emulation/retro-http-client.cjs');
const { createRetroSourceService, rommEndpoint, imageExtension } = require('../electron/emulation/retro-source-service.cjs');
const { registerRetroSourcesIpc } = require('../electron/ipc/retro-sources-ipc.cjs');

async function main() {
  const temporary = await fsp.mkdtemp(path.join(os.tmpdir(), 'neolib-retro-fixture-'));
  // This fixture owns only its newly created temporary directory.
  try {
    const root = () => path.join(temporary, 'private'); const artworkRoot = () => path.join(temporary, 'images');
    const romRoot = path.join(temporary, 'roms'); await fsp.mkdir(romRoot);
    const romPath = path.join(romRoot, 'Example.nes'); await fsp.writeFile(romPath, 'owned-rom-fixture');
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aG3UAAAAASUVORK5CYII=', 'base64');
    await fsp.writeFile(path.join(romRoot, 'art.png'), png);
    assert.equal(imageExtension(png), '.png'); assert.equal(imageExtension(Buffer.from('<html>')), '');
    const xml = '<gameList><!-- <game><path>fake.nes</path></game> --><game><path>./Example.nes</path><name>A &amp; B</name><desc><![CDATA[Safe description]]></desc><image>./art.png</image></game><game><path>../outside.nes</path></game><game><path>https://remote/Example.nes</path></game></gameList>';
    const exportPath = path.join(romRoot, 'gamelist.xml'); await fsp.writeFile(exportPath, xml);
    assert.equal(parseGamelist(xml)[0].name, 'A & B');
    assert.throws(() => parseGamelist('<!DOCTYPE a [<!ENTITY x SYSTEM "file:///secret">]><gameList></gameList>'));
    assert.throws(() => parseGamelist('<gameList>' + '<game><path>a.nes</path></game>'.repeat(2001) + '</gameList>'));
    const inspected = await inspectGamelist({ fsp, path, file: exportPath, root: romRoot, extensions: ['.nes'] });
    assert.equal(inspected.items.length, 1); assert.equal(inspected.skipped, 2); assert.equal(inspected.items[0].media.image, path.join(romRoot, 'art.png'));
    await assert.rejects(inspectGamelist({ fsp, path, file: exportPath, root: root(), extensions: ['.nes'] }));
    // Encryption fixture tests storage boundaries, not Windows DPAPI implementation.
    const key = crypto.randomBytes(32);
    const secure = { isEncryptionAvailable: () => true, encryptString: input => { const iv = crypto.randomBytes(12); const cipher = crypto.createCipheriv('aes-256-gcm', key, iv); const body = Buffer.concat([cipher.update(input), cipher.final()]); return Buffer.concat([iv, cipher.getAuthTag(), body]); }, decryptString: input => { const decipher = crypto.createDecipheriv('aes-256-gcm', key, input.subarray(0,12)); decipher.setAuthTag(input.subarray(12,28)); return Buffer.concat([decipher.update(input.subarray(28)), decipher.final()]).toString(); } };
    const vault = createRetroCredentialStore({ fsp, path, root, safeStorage: secure });
    await vault.save('romm', { url: 'https://romm.example', token: 'fixture-secret' });
    assert.equal((await fsp.readFile(path.join(root(), 'credentials.bin'))).includes(Buffer.from('fixture-secret')), false);
    assert.equal((await createRetroCredentialStore({ fsp, path, root, safeStorage: secure }).read()).romm.token, 'fixture-secret');
    await assert.rejects(createRetroCredentialStore({ fsp, path, root, safeStorage: { isEncryptionAvailable: () => false } }).save('romm', {}));
    await vault.save('romm', null); assert.equal((await vault.read()).romm, undefined);
    assert.throws(() => rommEndpoint('http://local.example')); assert.equal(rommEndpoint('http://local.example/api/', true), 'http://local.example');
    assert.throws(() => rommEndpoint('https://user:secret@romm.example')); assert.throws(() => rommEndpoint('https://romm.example?token=secret'));
    const calls = []; let byteCalls = 0; let downloadCalls = 0; let pendingReply; let clock = 0;
    const rom = { id: 12, name: 'Example', fs_name: 'Example.nes', fs_size_bytes: 4, sha1_hash: crypto.createHash('sha1').update('decoded ROM, not download container').digest('hex'), platform_id: 3, platform_display_name: 'NES', path_cover_large: '/resources/cover.png', merged_screenshots: ['/resources/scene.png'], path_manual: '/resources/manual.pdf', summary: 'A game', metadatum: { genres: ['Adventure'], developers: ['Studio'], publishers: ['Publisher'], first_release_date: 946684800 }, files: [{ file_name: 'Example.nes' }] };
    const ss = { id: '42', noms: [{ region: 'us', text: 'Example' }], synopsis: [{ langue: 'en', text: 'Translated description' }], systeme: { id: '3', text: 'NES' }, medias: [{ type: 'box-2D', region: 'us', url: 'https://api.screenscraper.fr/api2/mediaJeu.php?jeuid=42&media=box-2D&devpassword=do-not-leak' }, { type: 'fanart', url: 'https://malicious.example/leak' }] };
    const client = {
      async json(url, options) { calls.push({ url, options }); if (pendingReply) return pendingReply;
        const parsed = new URL(url);
        if (parsed.hostname === 'api.screenscraper.fr') {
          if (parsed.pathname.endsWith('systemesListe.php')) return { response: { systemes: [{ id: 3, noms: { nom_us: 'NES' } }] } };
          return { response: parsed.pathname.endsWith('jeuRecherche.php') ? { jeux: [ss] } : { jeu: ss } };
        }
        if (parsed.pathname.endsWith('/platforms')) return [{ id: 3, name: 'NES' }];
        if (parsed.pathname.endsWith('/12')) return rom;
        return { items: [rom], total: 60 };
      },
      async bytes(url, options) { byteCalls++; calls.push({ url, options }); return url.endsWith('.pdf') ? Buffer.from('%PDF-fixture') : png; },
      async download(url, file, options) { downloadCalls++; calls.push({ url, options }); await fsp.writeFile(file, 'data', { flag: 'wx' }); return 4; },
    };
    const profile = { id: 'nes', romFolder: romRoot };
    const saved = { id: 'local', source: 'emulation', emulatorProfileId: 'nes', romPath };
    const documents = { loadSettings: async () => ({ retroProfiles: [profile] }), loadLibrary: async () => ({ games: [saved] }) };
    const service = createRetroSourceService({ fsp, fs, path, crypto, vault, client, root, artworkRoot, documents, dialog: { showOpenDialog: async () => ({ filePaths: [exportPath] }) }, getWindow: () => null, openPath: async () => '', now: () => clock += 60001 });
    assert.equal((await service.configure({ source: 'romm', values: { url: 'https://romm.example', token: 'fixture-secret' } })).ok, true);
    const status = await service.status(); assert.equal(status.romm.configured, true); assert.equal(JSON.stringify(status).includes('fixture-secret'), false);
    assert.equal((await service.configure({ source: 'romm', values: { url: 'https://other.example' } })).ok, false);
    assert.equal((await service.platforms('romm')).platforms[0].name, 'NES');
    const search = await service.search({ source: 'romm', query: 'Example', systemId: '3' }); assert.equal(search.hasMore, true); assert.equal(search.games[0].systemId, '3');
    assert.ok(calls.at(-1).url.includes('platform_ids=3')); assert.equal(calls.at(-1).options.headers.Authorization, 'Bearer fixture-secret');
    const detail = await service.details({ source: 'romm', id: '12' }); assert.equal(detail.ok, true); assert.equal(detail.metadata.releaseDate, '2000-01-01'); assert.equal(detail.metadata.developers[0], 'Studio');
    assert.match(detail.metadata.portraitImage, /^neolib-background:\/\/asset\//); assert.equal(JSON.stringify(detail).includes('fixture-secret'), false);
    const beforeCache = byteCalls; await service.details({ source: 'romm', id: '12' }); assert.equal(byteCalls, beforeCache, 'artwork reused rather than fetched again');
    assert.equal((await service.download({ id: '12', consent: false })).ok, false); assert.equal(downloadCalls, 0);
    const approved = { id: '12', consent: true, systemId: '3', revision: detail.connectionRevision };
    assert.equal((await service.download({ ...approved, systemId: '99' })).ok, false);
    const downloaded = await service.download(approved); assert.equal(downloaded.ok, true); assert.equal(await fsp.readFile(downloaded.romPath, 'utf8'), 'data');
    assert.equal((await service.download(approved)).cached, true); assert.equal(downloadCalls, 1);
    await fsp.writeFile(downloaded.romPath, 'modified'); assert.equal((await service.download(approved)).ok, false); assert.equal(await fsp.readFile(downloaded.romPath, 'utf8'), 'modified');
    assert.equal((await service.media({ source: 'romm', id: '12', kind: 'manual' })).ok, true);
    const imported = await service.gamelist({}, { profileId: 'nes' }); assert.equal(imported.items.length, 1);
    const artwork = await service.prepareGamelist({ profileId: 'nes', paths: { image: path.join(romRoot, 'art.png') } }); assert.equal(artwork.ok, true);
    assert.equal((await service.prepareGamelist({ profileId: 'nes', paths: { image: path.join(root(), 'credentials.bin') } })).ok, false);
    assert.equal((await service.configure({ source: 'screenscraper', values: { developerId: 'fixture-id', developerPassword: 'fixture-dev-secret' } })).ok, true);
    assert.equal((await service.platforms('screenscraper')).platforms[0].name, 'NES');
    const ssSearch = await service.search({ source: 'screenscraper', query: 'Example' }); assert.equal(ssSearch.games[0].id, '42');
    const ssDetail = await service.details({ source: 'screenscraper', id: '42' }); assert.equal(ssDetail.ok, true); assert.equal(ssDetail.metadata.about, 'Translated description'); assert.equal(JSON.stringify(ssDetail).includes('secret'), false);
    assert.ok(ssDetail.warnings.length, 'untrusted third-party artwork is refused');
    const beforeConsent = calls.length; assert.equal((await service.identify({ gameId: 'local', systemId: '3', consent: false })).ok, false); assert.equal(calls.length, beforeConsent);
    const identified = await service.identify({ gameId: 'local', systemId: '3', consent: true }); assert.equal(identified.games[0].matchedBy, 'checksum');
    const identifyUrl = new URL(calls.at(-1).url); assert.equal(identifyUrl.searchParams.get('md5'), crypto.createHash('md5').update('owned-rom-fixture').digest('hex')); assert.equal(identifyUrl.searchParams.get('romnom'), 'Example.nes');
    assert.equal((await service.identify({ gameId: 'not-saved', systemId: '3', consent: true })).ok, false);
    let release; pendingReply = new Promise(resolve => { release = resolve; });
    const stale = service.search({ source: 'romm', query: 'stale' }); await new Promise(resolve => setImmediate(resolve));
    await service.configure({ source: 'romm', values: { url: 'https://other.example', token: 'new-fixture-secret' } });
    release({ items: [rom], total: 1 }); pendingReply = null; assert.equal((await stale).ok, false, 'late replies cannot cross a connection change');
    assert.equal((await service.download(approved)).ok, false, 'download review is bound to its connection');
    const handlers = {}; let nativeCalls = 0;
    const names = ['status','configure','platforms','search','details','identify','gamelist','prepareGamelist','download','cancelDownload','media'];
    registerRetroSourcesIpc({ registerIpc: (channel, handler) => { handlers[channel] = handler; }, retro: Object.fromEntries(names.map(name => [name, async () => { nativeCalls++; return { ok: true }; }])) });
    const malformed = { status: {}, configure: { source: 'bad' }, platforms: { source: 'bad' }, search: { source: 'romm', query: 'x'.repeat(161) }, details: { source: 'romm', id: '../file' }, identify: { gameId: 'a', systemId: '3', consent: 'yes' }, gamelist: { profileId: '' }, prepareGamelist: { profileId: 'nes', paths: { arbitrary: '/secret' } }, download: { id: '12', consent: 'yes' }, media: { source: 'romm', id: '12', kind: 'exe' } };
    for (const [name, value] of Object.entries(malformed)) assert.equal((await handlers[`retro-sources:${name}`]({}, value)).code, 'INVALID_REQUEST');
    assert.equal(nativeCalls, 0);
    const valid = { status: undefined, configure: { source: 'romm', values: { url: 'https://romm.example', token: 'token' } }, platforms: { source: 'romm' }, search: { source: 'romm', query: '' }, details: { source: 'romm', id: '12' }, identify: { gameId: 'a', systemId: '3', consent: true }, gamelist: { profileId: 'nes' }, prepareGamelist: { profileId: 'nes', paths: {} }, download: approved, media: { source: 'romm', id: '12', kind: 'manual' } };
    for (const [name, value] of Object.entries(valid)) assert.equal((await handlers[`retro-sources:${name}`]({}, value)).ok, true);
    assert.equal((await handlers['retro-sources:cancelDownload']({}, { id: '../file' })).code, 'INVALID_REQUEST');
    assert.equal((await handlers['retro-sources:cancelDownload']({}, { id: '12' })).ok, true);
    assert.equal(nativeCalls, 11);
    let responses = [{ statusCode: 200, body: 'stream-data' }]; let headers;
    const transport = { get(url, options, callback) { headers = options.headers; const request = new EventEmitter(); request.destroy = () => {};
      queueMicrotask(() => { const next = responses.shift(); const result = next.stream || Readable.from([Buffer.from(next.body || '')]); result.statusCode = next.statusCode; result.headers = next.headers || {}; result.setTimeout = () => {}; callback(result); }); return request; } };
    const httpClient = createRetroHttpClient({ http: transport, https: transport, fs, fsp });
    const streamed = path.join(temporary, 'streamed.nes'); assert.equal(await httpClient.download('https://romm.example/api/roms/12', streamed, { expectedBytes: 11, headers: { Authorization: 'Bearer token' } }), 11); assert.equal(headers.Authorization, 'Bearer token');
    responses = [{ statusCode: 200, body: 'changed' }]; await assert.rejects(httpClient.download('https://romm.example/file', streamed)); assert.equal(await fsp.readFile(streamed, 'utf8'), 'stream-data', 'exclusive output never deletes existing files');
    const partial = path.join(temporary, 'partial.nes'); responses = [{ statusCode: 200, body: 'partial' }]; await assert.rejects(httpClient.download('https://romm.example/file', partial, { expectedBytes: 999 })); await assert.rejects(fsp.stat(partial));
    responses = [{ statusCode: 302, headers: { location: 'https://outside.example/file' } }]; await assert.rejects(httpClient.bytes('https://romm.example/file', { headers: { Authorization: 'Bearer token' } }), /Cross-origin/);
    responses = [{ statusCode: 200, body: 'too large' }]; await assert.rejects(httpClient.bytes('https://romm.example/file', { maxBytes: 2 }));
    responses = [{ statusCode: 404 }]; await assert.rejects(httpClient.json('https://romm.example/file'), /HTTP 404/);
    const cancelled = new AbortController(); cancelled.abort(); await assert.rejects(httpClient.download('https://romm.example/file', partial, { signal: cancelled.signal }), /cancelled/);
    const activeBody = new PassThrough(); const activeCancel = new AbortController(); responses = [{ statusCode: 200, stream: activeBody }];
    const activeTransfer = httpClient.download('https://romm.example/file', partial, { signal: activeCancel.signal });
    const rejection = assert.rejects(activeTransfer); activeBody.write('partial data');
    await new Promise(resolve => setTimeout(resolve, 25)); activeCancel.abort(); await rejection; await assert.rejects(fsp.stat(partial), 'cancelled stream removes its partial output');
    console.log('PASS: retro source fixtures cover encrypted credential boundaries, export confinement/entities, RomM/ScreenScraper normalization, cached artwork, consent/checksums, no-overwrite streaming/cancellation, changed-connection races, cross-origin redirects and all eleven IPC contracts. No live account, ROM download or game launch.');
  } finally { await fsp.rm(temporary, { recursive: true, force: true }); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
