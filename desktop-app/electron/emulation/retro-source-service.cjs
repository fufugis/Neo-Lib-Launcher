const { inspectGamelist } = require('./gamelist-import.cjs');
const text = (value, max = 500) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const positiveId = value => /^\d{1,12}$/.test(String(value)) && Number(value) > 0;
const list = value => Array.isArray(value) ? value : value ? [value] : [];
const failure = error => ({ ok: false, error });
const releaseDate = value => typeof value === 'number' && Number.isFinite(value) && Math.abs(value) < 253402300800 ? new Date(value * 1000).toISOString().slice(0, 10) : text(value, 80);
const SS_BASE = 'https://api.screenscraper.fr/api2/';
const IMAGE_BYTES = 12 * 1024 * 1024;
const ROM_EXTENSIONS = ['.a26','.d64','.t64','.prg','.crt','.nes','.fds','.sfc','.smc','.z64','.n64','.v64','.gb','.gbc','.gba','.nds','.3ds','.cia','.cci','.gcm','.rvz','.iso','.wbfs','.wia','.wua','.wud','.wux','.rpx','.nsp','.xci','.md','.gen','.bin','.gdi','.cdi','.chd','.cue','.pbp','.m3u','.cso','.zip','.7z'];
const MEDIA_TYPES = Object.freeze({ cover: ['box-2D', 'box-2D-side', 'box-3D'], icon: ['wheel-hd', 'wheel', 'box-2D'], logo: ['wheel-hd', 'wheel', 'marquee'], hero: ['fanart', 'ss', 'sstitle'], background: ['fanart', 'ss', 'sstitle'], video: ['video', 'video-normalized'], manual: ['manuel'] });

function rommEndpoint(value, allowInsecure = false) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || (url.protocol === 'http:' && !allowInsecure)) throw new Error('Use HTTPS, or explicitly allow insecure HTTP for your own local server.');
  url.pathname = url.pathname.replace(/\/+$/, '').replace(/\/api$/, '');
  return url.href.replace(/\/$/, '');
}
function imageExtension(bytes) {
  if (bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return '.png';
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return '.jpg';
  if (bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8,12).toString() === 'WEBP') return '.webp';
  if (/^GIF8[79]a$/.test(bytes.subarray(0,6).toString())) return '.gif';
  return '';
}
function localized(value, preference, region = false) {
  if (typeof value === 'string') return text(value, 50000);
  if (Array.isArray(value)) {
    const match = value.find(item => (region ? item.region : item.langue || item.language) === preference) || value.find(item => ['wor','us','en','ss'].includes(region ? item.region : item.langue || item.language)) || value[0];
    return text(match?.text || match?.nom || match?.name, 50000);
  }
  return text(value?.[`nom_${preference}`] || value?.nom_ss || value?.nom_us || value?.text || value?.nom || value?.name, 50000);
}
function createRetroSourceService({ fsp, fs, path, crypto, vault, client, root, artworkRoot, documents, dialog, getWindow, openPath, now = () => Date.now() }) {
  const records = new Map(); const hashes = new Map(); const flights = new Map(); const downloads = new Map();
  let ssQueue = Promise.resolve(); let ssNext = 0; let ssQuotaDay = ''; let ssRemaining = Infinity; let ssMinute = 10;
  let generation = 0;
  const unchanged = revision => { if (revision !== generation) throw new Error('Connection changed. Please search again.'); };
  const within = (directory, file) => { const relative = path.relative(directory, file); return relative && relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative); };
  const put = (key, record) => { records.delete(key); records.set(key, { ...record, seenAt: now(), generation }); if (records.size > 200) records.delete(records.keys().next().value); return records.get(key); };
  async function configuration(source) { return (await vault.read())[source] || {}; }
  async function status() {
    const saved = await vault.read();
    return { ok: true, encryptedStorageAvailable: vault.available(), screenscraper: { configured: Boolean(saved.screenscraper?.developerId && saved.screenscraper?.developerPassword), username: saved.screenscraper?.username || '', region: saved.screenscraper?.region || 'us', language: saved.screenscraper?.language || 'en' }, romm: { configured: Boolean(saved.romm?.url && saved.romm?.token), url: saved.romm?.url || '', allowInsecure: saved.romm?.allowInsecure === true } };
  }
  async function configure({ source, values, forget = false }) {
    if (!['screenscraper','romm'].includes(source)) return failure('Unknown retro source.');
    try {
      const old = await configuration(source); let next;
      if (forget) next = null;
      else if (source === 'screenscraper') {
        next = { developerId: text(values.developerId || old.developerId, 160), developerPassword: text(values.developerPassword || old.developerPassword, 1024), username: text(values.username ?? old.username, 160), password: text(values.password || old.password, 1024), region: text(values.region || old.region || 'us', 12), language: text(values.language || old.language || 'en', 12) };
        if (!next.username) next.password = '';
        else if (next.username !== old.username && !values.password) return failure('Enter a password for this changed ScreenScraper account, or leave both account fields empty.');
        if (!next.developerId || !next.developerPassword || !/^[a-z]{2,8}$/.test(next.region) || !/^[a-z]{2,8}$/.test(next.language)) return failure('ScreenScraper needs developer credentials and valid region/language codes.');
      } else {
        const url = rommEndpoint(values.url || old.url, values.allowInsecure === true);
        // A new server must receive a newly supplied token, never the old server's token.
        const token = text(values.token || (url === old.url ? old.token : ''), 4096);
        if (!token || /[\r\n]/.test(token)) return failure('Enter a client API token for this RomM server.');
        next = { url, token, allowInsecure: values.allowInsecure === true };
      }
      await vault.save(source, next); generation++; records.clear(); hashes.clear(); ssRemaining = Infinity; ssNext = 0;
      for (const controller of downloads.values()) controller.abort();
      return status();
    } catch { return failure('Could not securely save this connection. Check the URL and Windows credential storage.'); }
  }
  async function ssRequest(endpoint, params = {}) {
    const revision = generation;
    const config = await configuration('screenscraper');
    if (!config.developerId || !config.developerPassword) throw new Error('Configure ScreenScraper in Wizard → Retro Library → Sources first. Developer access is required.');
    const url = new URL(endpoint, SS_BASE);
    for (const [key, value] of Object.entries({ devid: config.developerId, devpassword: config.developerPassword, softname: 'NEO-LIB', output: 'json', ssid: config.username || '', sspassword: config.password || '', ...params })) if (value !== '') url.searchParams.set(key, String(value));
    const job = ssQueue.then(async () => {
      unchanged(revision);
      const day = new Date(now()).toISOString().slice(0,10); if (day !== ssQuotaDay) { ssQuotaDay = day; ssRemaining = Infinity; }
      if (ssRemaining <= 0) throw new Error('ScreenScraper daily request allowance is exhausted. Try again tomorrow.');
      const delay = Math.max(0, ssNext - now()); if (delay > 30000) throw new Error('ScreenScraper is cooling down. Try again later.');
      if (delay) await new Promise(resolve => setTimeout(resolve, delay));
      unchanged(revision);
      ssNext = now() + Math.ceil(60000 / ssMinute);
      let body;
      try { body = await client.json(url.href); } catch (error) { if (error.status === 429) ssNext = now() + 60000; throw error; }
      unchanged(revision); const value = body.response || body;
      const user = value.ssuser;
      if (user) {
        const maximum = Number(user.maxrequestsperday); const used = Number(user.requeststoday);
        if (maximum > 0 && Number.isFinite(used)) ssRemaining = Math.max(0, maximum - used);
        const perMinute = Number(user.maxrequestspermin || user.maxrequestsperdmin);
        if (perMinute > 0) ssMinute = Math.min(10, perMinute);
      }
      if (!value || value.error || value.erreur) throw new Error('ScreenScraper rejected the request. Check credentials, account limits or title/platform.');
      return value;
    });
    ssQueue = job.catch(() => {}); return job;
  }
  async function rommRequest(route) {
    const revision = generation;
    const config = await configuration('romm');
    if (!config.url || !config.token) throw new Error('Configure your RomM server and client API token in Retro Sources first.');
    const result = await client.json(`${config.url}/api/${route}`, { headers: { Authorization: `Bearer ${config.token}` } });
    unchanged(revision); return result;
  }
  function ssRecord(raw, config, matchedBy = 'title', complete = false) {
    const id = String(raw.id || ''); if (!positiveId(id) || raw.notgame === true || raw.notgame === 'true') return null;
    const name = localized(raw.noms || raw.nom, config.region, true).slice(0,300); if (!name) return null;
    const metadata = { name, about: localized(raw.synopsis, config.language), developers: list(raw.developpeur).map(item => localized(item)).filter(Boolean), publishers: list(raw.editeur).map(item => localized(item)).filter(Boolean), genres: list(raw.genres).map(item => localized(item.noms || item, config.language)).filter(Boolean), releaseDate: localized(raw.dates, config.region, true), metadataSource: 'screenscraper', screenscraperId: id };
    const media = list(raw.medias).filter(item => item && typeof item.url === 'string').slice(0,100).map(item => ({ type: item.type, region: item.region, url: item.url }));
    const systemId = String(raw.systeme?.id || '');
    put(`screenscraper:${id}`, { metadata, media, systemId, matchedBy, complete });
    return { id, name, source: 'screenscraper', platform: localized(raw.systeme), systemId, matchedBy };
  }
  function rommRecord(raw, complete = false) {
    const id = String(raw.id || ''); const name = text(raw.name || raw.fs_name, 300); if (!positiveId(id) || !name) return null;
    const metadata = { name, about: text(raw.summary || raw.description || raw.igdb_metadata?.summary, 50000), developers: list(raw.metadatum?.developers).map(item => text(item)).filter(Boolean), publishers: list(raw.metadatum?.publishers).map(item => text(item)).filter(Boolean), genres: list(raw.metadatum?.genres || raw.igdb_metadata?.genres).map(item => typeof item === 'string' ? item : text(item?.name)).filter(Boolean), releaseDate: releaseDate(raw.metadatum?.first_release_date ?? raw.igdb_metadata?.first_release_date), metadataSource: 'romm', rommId: id };
    const media = [{ type: 'box-2D', url: raw.path_cover_large || raw.path_cover_small || raw.url_cover }, { type: 'manuel', url: raw.path_manual }, { type: 'video', url: raw.path_video }, ...list(raw.merged_screenshots || raw.path_screenshots || raw.url_screenshots).map(url => ({ type: 'ss', url }))].filter(item => typeof item.url === 'string' && item.url).slice(0,24);
    put(`romm:${id}`, { metadata, media, complete, fsName: text(raw.fs_name, 220), files: list(raw.files).slice(0,50), multiple: raw.has_multiple_files === true || raw.has_nested_single_file === true, bytes: Number(raw.fs_size_bytes || 0), platformId: String(raw.platform_id || ''), platformSlug: text(raw.platform_slug, 80) });
    return { id, name, source: 'romm', platform: text(raw.platform_display_name || raw.platform_name || raw.platform_slug, 160), systemId: String(raw.platform_id || ''), sizeBytes: Number(raw.fs_size_bytes || 0), matchedBy: 'server' };
  }
  async function platforms(source) {
    try {
      const body = source === 'screenscraper' ? await ssRequest('systemesListe.php') : await rommRequest('platforms');
      const values = source === 'screenscraper' ? list(body.systemes) : list(body.items || body);
      return { ok: true, platforms: values.filter(item => positiveId(item.id)).slice(0,600).map(item => ({ id: String(item.id), name: localized(item.noms || item.name || item.nom).slice(0,180), slug: text(item.slug, 80) })) };
    } catch (error) { return failure(error.message); }
  }
  async function search({ source, query = '', systemId = '', offset = 0 }) {
    try {
      const revision = generation;
      const term = text(query, 160); if (source === 'screenscraper' && !term) return failure('Enter a game title.');
      const key = `${source}:${term}:${systemId}:${offset}:${generation}`;
      if (flights.has(key)) return flights.get(key);
      const job = (async () => {
        if (source === 'screenscraper') {
          const config = await configuration(source); const body = await ssRequest('jeuRecherche.php', { recherche: term, ...(systemId ? { systemeid: systemId } : {}) });
          unchanged(revision); return { ok: true, games: list(body.jeux).slice(0,30).map(item => ssRecord(item, config)).filter(Boolean), hasMore: false };
        }
        const params = new URLSearchParams({ limit: '50', offset: String(offset), search_term: term }); if (systemId) params.set('platform_ids', systemId);
        const body = await rommRequest(`roms?${params}`); const values = list(body.items || body);
        unchanged(revision); return { ok: true, games: values.slice(0,50).map(item => rommRecord(item)).filter(Boolean), hasMore: Number(body.total || 0) > offset + values.length, offset };
      })();
      flights.set(key, job); try { return await job; } finally { flights.delete(key); }
    } catch (error) { return failure(error.message); }
  }
  async function record(source, id) {
    const revision = generation;
    const cached = records.get(`${source}:${id}`);
    if (cached?.complete && cached.generation === generation && now() - cached.seenAt < 10 * 60 * 1000) return cached;
    const key = `record:${source}:${id}:${revision}`;
    if (flights.has(key)) return flights.get(key);
    const job = (async () => {
      records.delete(`${source}:${id}`);
      if (source === 'screenscraper') { const config = await configuration(source); const value = await ssRequest('jeuInfos.php', { gameid: id }); unchanged(revision); if (String(value.jeu?.id) !== String(id)) throw new Error('Source returned a different game.'); ssRecord(value.jeu, config, 'title', true); }
      else { const value = await rommRequest(`roms/${id}`); unchanged(revision); if (String(value.id) !== String(id)) throw new Error('Source returned a different game.'); rommRecord(value, true); }
      const result = records.get(`${source}:${id}`); if (!result || result.generation !== generation) throw new Error('This game is no longer available from the source.'); return result;
    })();
    flights.set(key, job); try { return await job; } finally { flights.delete(key); }
  }
  async function cacheImage(url, { headers = {}, local = false, key = url } = {}) {
    const directory = artworkRoot(); await fsp.mkdir(directory, { recursive: true });
    const digest = crypto.createHash('sha256').update(key).digest('hex');
    const flightKey = `image:${digest}`;
    if (flights.has(flightKey)) return flights.get(flightKey);
    const job = (async () => {
    const index = path.join(root(), `image-${digest}.json`);
    try {
      const item = JSON.parse(await fsp.readFile(index, 'utf8'));
      if (/^[a-f\d-]{36}\.(png|jpg|webp|gif)$/.test(item.name) && now() - item.at < 7 * 86400000 && (await fsp.stat(path.join(directory, item.name))).isFile()) return `neolib-background://asset/${item.name}`;
    } catch { /* stale/missing cache is safely retried */ }
    let buffer;
    if (local) {
      const chunks = []; let size = 0;
      for await (const chunk of fs.createReadStream(url)) { size += chunk.length; if (size > IMAGE_BYTES) throw new Error('Artwork is too large.'); chunks.push(chunk); }
      buffer = Buffer.concat(chunks);
    } else buffer = await client.bytes(url, { headers, maxBytes: IMAGE_BYTES });
    if (buffer.length > IMAGE_BYTES) throw new Error('Artwork is too large.');
    const extension = imageExtension(buffer); if (!extension) throw new Error('Source returned unsupported artwork, not an image.');
    const name = `${crypto.randomUUID()}${extension}`; await fsp.writeFile(path.join(directory, name), buffer, { flag: 'wx' });
    await fsp.mkdir(root(), { recursive: true });
    await fsp.writeFile(index, JSON.stringify({ name, at: now() })); return `neolib-background://asset/${name}`;
    })();
    flights.set(flightKey, job); try { return await job; } finally { flights.delete(flightKey); }
  }
  async function mediaRequest(source, item) {
    const config = await configuration(source);
    if (source === 'screenscraper') {
      const url = new URL(item.url);
      if (url.protocol !== 'https:' || !/(^|\.)screenscraper\.fr$/.test(url.hostname) || url.username || url.password) throw new Error('Untrusted artwork host refused.');
      for (const key of ['devid','devpassword','ssid','sspassword']) url.searchParams.delete(key);
      if (url.hostname === 'api.screenscraper.fr') for (const [key, value] of Object.entries({ devid: config.developerId, devpassword: config.developerPassword, ssid: config.username || '', sspassword: config.password || '', softname: 'NEO-LIB' })) url.searchParams.set(key, value);
      return { url: url.href, headers: {}, key: `screenscraper:${item.type}:${item.region}:${new URL(item.url).pathname}:${new URL(item.url).searchParams.get('jeuid') || ''}:${new URL(item.url).searchParams.get('media') || ''}` };
    }
    const url = new URL(item.url, `${config.url}/`); const base = new URL(config.url);
    if (url.origin !== base.origin || url.username || url.password || !url.pathname.startsWith(`${base.pathname.replace(/\/$/,'')}/`)) throw new Error('RomM artwork must stay on the configured server.');
    return { url: url.href, headers: { Authorization: `Bearer ${config.token}` }, key: `romm:${config.url}:${url.pathname}` };
  }
  async function details({ source, id, slot = 'all' }) {
    try {
      const revision = generation;
      const value = await record(source, id); const config = await configuration(source); const roles = slot === 'all' ? ['cover','logo','hero'] : [slot];
      const assets = []; const warnings = [];
      for (const role of roles) {
        const media = value.media.filter(item => MEDIA_TYPES[role]?.includes(item.type)).sort((a,b) => Number(b.region === config.region) - Number(a.region === config.region) || MEDIA_TYPES[role].indexOf(a.type) - MEDIA_TYPES[role].indexOf(b.type));
        const seen = new Set();
        for (const item of media) {
          if (seen.has(item.url) || seen.size >= (slot === 'all' ? 1 : 6)) continue; seen.add(item.url);
          try { const request = await mediaRequest(source, item); const url = await cacheImage(request.url, { ...request, key: `${source}:${id}:${request.key}` }); assets.push({ id: `${source}-${id}-${role}-${assets.length}`, url, thumb: url, author: source, style: role, verifiedBoxArt: role === 'cover' }); }
          catch { warnings.push(`${role} artwork was unavailable; existing artwork is unchanged.`); }
        }
      }
      const metadata = { ...value.metadata };
      const cover = assets.find(item => item.style === 'cover'); const logo = assets.find(item => item.style === 'logo'); const hero = assets.filter(item => item.style === 'hero');
      if (cover) metadata.portraitImage = cover.url;
      if (logo) metadata.logoImage = logo.url;
      if (hero.length) { metadata.headerImage = hero[0].url; metadata.background = hero[0].url; metadata.screenshots = hero.map(item => item.url); }
      metadata.retroMetadataReviewed = true;
      unchanged(revision);
      return { ok: true, metadata, assets, warnings, connectionRevision: revision, systemId: value.platformId || value.systemId || '', mediaAvailable: value.media.some(item => MEDIA_TYPES.video.includes(item.type) || MEDIA_TYPES.manual.includes(item.type)) };
    } catch (error) { return failure(error.message); }
  }
  async function identify({ gameId, systemId, consent }) {
    if (!consent) return failure('Approve sending the ROM filename, size and checksum to ScreenScraper first.');
    try {
      const revision = generation;
      const game = (await documents.loadLibrary()).games.find(item => item.id === gameId && item.source === 'emulation');
      if (!game?.romPath || !path.isAbsolute(game.romPath)) return failure('Only a saved local ROM can be identified.');
      const file = await fsp.realpath(game.romPath); const stat = await fsp.stat(file);
      const profile = (await documents.loadSettings()).retroProfiles?.find(item => item.id === game.emulatorProfileId);
      const bases = [profile?.romFolder, path.join(root(), 'roms')].filter(Boolean);
      let confined = false;
      for (const base of bases) { try { if (within(await fsp.realpath(base), file)) confined = true; } catch { /* missing root */ } }
      if (!confined || !ROM_EXTENSIONS.includes(path.extname(file).toLowerCase())) return failure('ROM must belong to a saved profile or a verified RomM download.');
      if (!stat.isFile() || stat.size > 8 * 1024 ** 3) return failure('Choose a ROM file no larger than 8 GiB.');
      const key = `${file}:${stat.size}:${stat.mtimeMs}`; let hash = hashes.get(key);
      if (!hash) {
        const md5 = crypto.createHash('md5'); const sha1 = crypto.createHash('sha1');
        for await (const chunk of fs.createReadStream(file)) { md5.update(chunk); sha1.update(chunk); }
        const after = await fsp.stat(file); if (after.size !== stat.size || after.mtimeMs !== stat.mtimeMs) return failure('ROM changed while hashing. Try again.');
        hash = { md5: md5.digest('hex'), sha1: sha1.digest('hex') }; hashes.set(key, hash); if (hashes.size > 256) hashes.delete(hashes.keys().next().value);
      }
      const config = await configuration('screenscraper'); const body = await ssRequest('jeuInfos.php', { systemeid: systemId, romtype: 'rom', romnom: path.basename(file), romtaille: stat.size, ...hash });
      unchanged(revision); const candidate = ssRecord(body.jeu, config, 'checksum', true);
      return candidate ? { ok: true, games: [candidate] } : failure('ScreenScraper did not identify this ROM. Use title search instead.');
    } catch { return failure('ROM identification failed. Check source credentials, platform and file accessibility.'); }
  }
  async function gamelist(event, { profileId }) {
    try {
      const profile = (await documents.loadSettings()).retroProfiles?.find(item => item.id === profileId);
      if (!profile?.romFolder) return failure('Save a ROM folder in this profile first.');
      const selected = await dialog.showOpenDialog(getWindow(event), { title: 'Import Skraper / EmulationStation gamelist.xml', defaultPath: profile.romFolder, properties: ['openFile'], filters: [{ name: 'Gamelist XML', extensions: ['xml'] }] });
      if (selected.canceled || !selected.filePaths?.[0]) return { ok: true, items: [], skipped: 0 };
      const result = await inspectGamelist({ fsp, path, file: selected.filePaths[0], root: profile.romFolder, extensions: ROM_EXTENSIONS });
      return { ok: true, ...result };
    } catch { return failure('Could not read this export. It must stay inside the saved ROM folder and contain supported local ROM paths.'); }
  }
  async function prepareGamelist({ profileId, paths }) {
    // Re-read through the chosen export route is not needed: local artwork paths
    // must still be confined to this saved profile's root, never arbitrary files.
    try {
      const profile = (await documents.loadSettings()).retroProfiles?.find(item => item.id === profileId);
      const base = await fsp.realpath(profile.romFolder); const images = {};
      for (const [role, value] of Object.entries(paths)) {
        if (!['image','logo'].includes(role) || !value) continue;
        const file = await fsp.realpath(value);
        if (!within(base, file) || !['.jpg','.jpeg','.png','.gif','.webp'].includes(path.extname(file).toLowerCase()) || (await fsp.stat(file)).size > IMAGE_BYTES) return failure('Artwork must stay inside the selected ROM folder.');
        const stat = await fsp.stat(file); images[role] = await cacheImage(file, { local: true, key: `${file}:${stat.size}:${stat.mtimeMs}` });
      }
      return { ok: true, images };
    } catch { return failure('Export artwork could not be copied.'); }
  }
  async function download({ id, consent, revision: approvedRevision, systemId }) {
    if (!consent) return failure('Confirm downloading your selected ROM first.');
    if (approvedRevision !== generation) return failure('Connection changed since your review. Search and preview this game again.');
    if (downloads.size >= 1) return failure('A ROM download is already running. Wait for it to finish.');
    const controller = new AbortController(); downloads.set(id, controller);
    let temporary;
    try {
      const revision = generation;
      const value = await record('romm', id); const config = await configuration('romm');
      controller.signal.throwIfAborted();
      unchanged(revision);
      if (value.platformId !== systemId) return failure('Source platform changed. Review this game again before downloading.');
      if (!value.fsName || /[\\/\x00-\x1f]/.test(value.fsName) || value.files.length > 1 || value.multiple) return failure('Multi-file games need manual download/extraction from RomM, then a local ROM-folder scan.');
      const extension = path.extname(value.fsName).toLowerCase();
      if (!ROM_EXTENSIONS.includes(extension)) return failure('Only supported ROM formats can be downloaded.');
      const directory = path.join(root(), 'roms', crypto.createHash('sha256').update(config.url).digest('hex').slice(0,16), id); await fsp.mkdir(directory, { recursive: true });
      const canonical = await fsp.realpath(directory); const base = await fsp.realpath(root()); if (!within(base, canonical)) return failure('Download directory is outside private storage.');
      const file = path.join(canonical, value.fsName.replace(/[<>:"|?*]/g,'_')); const marker = `${file}.verified.json`;
      try { const saved = JSON.parse(await fsp.readFile(marker, 'utf8')); const stat = await fsp.stat(file); if (saved.bytes === stat.size && saved.mtimeMs === stat.mtimeMs && saved.id === id && saved.server === config.url) return { ok: true, romPath: file, sizeBytes: stat.size, cached: true, name: value.metadata.name }; } catch { /* no verified download */ }
      try { await fsp.stat(file); return failure('An existing unverified file will not be overwritten. Choose another download or inspect the private folder.'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
      temporary = path.join(canonical, `${crypto.randomUUID()}.part`);
      const url = `${config.url}/api/roms/${id}/content/${encodeURIComponent(value.fsName)}`;
      const size = await client.download(url, temporary, { headers: { Authorization: `Bearer ${config.token}` }, expectedBytes: value.bytes, signal: controller.signal });
      controller.signal.throwIfAborted();
      // Database ROM hashes can describe uncompressed/headerless content,
      // not the downloaded container. Do not reject valid archives against them.
      controller.signal.throwIfAborted();
      unchanged(revision);
      // Link+unlink is an atomic no-overwrite promotion; never replace an existing ROM.
      try { await fsp.link(temporary, file); } finally { await fsp.unlink(temporary).catch(() => {}); }
      await fsp.writeFile(marker, JSON.stringify({ id, server: config.url, bytes: size, mtimeMs: (await fsp.stat(file)).mtimeMs }));
      return { ok: true, romPath: file, sizeBytes: size, name: value.metadata.name };
    } catch { return failure(controller.signal.aborted ? 'Download cancelled. Partial data was removed; no game was imported or launched.' : 'Download failed safely. Check server permissions, free space and the ROM size. No game was launched.'); }
    finally { if (temporary) await fsp.unlink(temporary).catch(() => {}); downloads.delete(id); }
  }
  async function cancelDownload({ id }) { downloads.get(id)?.abort(); return { ok: true }; }
  async function media({ source, id, kind }) {
    try {
      const value = await record(source, id); const item = value.media.find(entry => MEDIA_TYPES[kind]?.includes(entry.type));
      if (!item) return failure('This source has no requested media for this game.');
      const request = await mediaRequest(source, item); const directory = path.join(root(), 'media'); await fsp.mkdir(directory, { recursive: true });
      const file = path.join(directory, `${crypto.randomUUID()}${kind === 'manual' ? '.pdf' : '.mp4'}`);
      const buffer = await client.bytes(request.url, { headers: request.headers, maxBytes: kind === 'manual' ? 32 * 1024 * 1024 : 64 * 1024 * 1024 });
      if (kind === 'manual' ? buffer.subarray(0,5).toString() !== '%PDF-' : buffer.subarray(4,8).toString() !== 'ftyp') return failure('Source returned unsupported media.');
      await fsp.writeFile(file, buffer, { flag: 'wx' }); if (await openPath(file)) return failure('Media was saved, but the system could not open it.');
      return { ok: true };
    } catch { return failure('Could not download/open this media.'); }
  }
  return { status, configure, platforms, search, details, identify, gamelist, prepareGamelist, download, cancelDownload, media };
}
module.exports = { createRetroSourceService, rommEndpoint, imageExtension };
