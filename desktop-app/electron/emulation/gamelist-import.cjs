// Restricted reader for EmulationStation/Skraper exports; not a general XML engine.
const decode = value => String(value || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_all, entity) => {
  const names = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
  if (Object.hasOwn(names, entity)) return names[entity];
  const code = parseInt(entity.slice(entity[1]?.toLowerCase() === 'x' ? 2 : 1), entity[1]?.toLowerCase() === 'x' ? 16 : 10);
  return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '';
});
function parseGamelist(xml) {
  if (typeof xml === 'string') xml = xml.replace(/<!--[\s\S]*?-->/g, '');
  if (typeof xml !== 'string' || Buffer.byteLength(xml) > 8 * 1024 * 1024 || /<!DOCTYPE|<!ENTITY/i.test(xml) || !/<gameList(?:\s|>)/i.test(xml) || !/<\/gameList>\s*$/i.test(xml.trim())) throw new Error('Choose a supported gamelist.xml without external entities.');
  const blocks = [];
  for (const block of xml.matchAll(/<game\b[^>]*>([\s\S]*?)<\/game>/gi)) {
    if (blocks.length >= 2000) throw new Error('Import at most 2,000 games per exported list.');
    blocks.push(block);
  }
  return blocks.map(match => {
    const fields = {};
    for (const name of ['path', 'name', 'desc', 'image', 'thumbnail', 'marquee', 'video', 'manual', 'releasedate', 'developer', 'publisher', 'genre', 'players', 'rating']) {
      const value = match[1].match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i'));
      if (value) fields[name] = decode(value[1]).trim().slice(0, name === 'desc' ? 50000 : 2048);
    }
    return fields;
  }).filter(row => row.path);
}
async function inspectGamelist({ fsp, path, file, root, extensions }) {
  const canonicalRoot = await fsp.realpath(root);
  const inside = candidate => { const relative = path.relative(canonicalRoot, candidate); return relative && relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative); };
  const canonicalFile = await fsp.realpath(file);
  if (!inside(canonicalFile) || path.extname(canonicalFile).toLowerCase() !== '.xml' || (await fsp.stat(canonicalFile)).size > 8 * 1024 * 1024) throw new Error('The export must be an XML file inside the chosen ROM folder.');
  const rows = parseGamelist(await fsp.readFile(canonicalFile, 'utf8')); const items = []; const seen = new Set(); let skipped = 0;
  async function resolveFile(value, allowed) {
    if (!value || /^[a-z]+:/i.test(value) || path.isAbsolute(value)) return '';
    try { const candidate = await fsp.realpath(path.resolve(path.dirname(canonicalFile), value)); if (!inside(candidate) || !allowed.includes(path.extname(candidate).toLowerCase()) || !(await fsp.stat(candidate)).isFile()) return ''; return candidate; } catch { return ''; }
  }
  for (const row of rows) {
    const romPath = await resolveFile(row.path, extensions);
    if (!romPath || seen.has(romPath)) { skipped++; continue; }
    seen.add(romPath);
    const image = await resolveFile(row.image || row.thumbnail, ['.jpg', '.jpeg', '.png', '.webp', '.gif']);
    const logo = await resolveFile(row.marquee, ['.png', '.webp']);
    const releaseDate = /^(\d{4})(\d{2})(\d{2})T\d{6}$/.test(row.releasedate || '') ? row.releasedate.replace(/^(\d{4})(\d{2})(\d{2})T\d{6}$/, '$1-$2-$3') : row.releasedate;
    items.push({ romPath, sizeBytes: (await fsp.stat(romPath)).size, name: row.name, about: row.desc, releaseDate, developers: row.developer ? [row.developer] : [], publishers: row.publisher ? [row.publisher] : [], genres: row.genre ? row.genre.split(/\s*[,;]\s*/) : [], importedPlayers: row.players, media: { image, logo }, sourceNote: 'Skraper / EmulationStation export' });
  }
  return { items, skipped };
}
module.exports = { parseGamelist, inspectGamelist };
