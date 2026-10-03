// Optional asset maintenance tool: node scripts/prepare-sidebar-artwork.cjs [sharp module path].
// Originals remain untouched. Preserve their aspect ratio and centre-cover composition.
const fs = require('node:fs');
const path = require('node:path');
const sharp = require(process.argv[2] || 'sharp');
async function main() {
  const root = path.resolve(__dirname, '../src/themes/stock');
  let before = 0, after = 0, count = 0;
  for (const dir of fs.readdirSync(root)) {
    const manifest = JSON.parse(fs.readFileSync(path.join(root, dir, 'theme.json'), 'utf8'));
    const layer = manifest.layers?.sidebar;
    if (layer?.type !== 'image' || !layer.asset) continue;
    const input = path.join(root, dir, layer.asset);
    const output = path.join(root, dir, 'assets/sidebar.webp');
    await sharp(input).resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 90 }).toFile(output);
    before += fs.statSync(input).size; after += fs.statSync(output).size; count++;
  }
  console.log(JSON.stringify({ count, originalBytes: before, sidebarBytes: after }));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
