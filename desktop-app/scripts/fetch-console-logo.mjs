const url = process.argv[2];
if (!url?.startsWith('https://commons.wikimedia.org/wiki/Special:Redirect/file/')) process.exit(2);
const response = await fetch(url);
if (!response.ok) throw new Error(`Logo request failed: ${response.status}`);
const svg = await response.text();
if (!response.headers.get('content-type')?.includes('svg') || !svg.includes('<svg') || svg.length > 200_000 || /<script\b|\bon\w+\s*=|<foreignObject\b|(?:href|src)\s*=\s*['\"]https?:/i.test(svg)) throw new Error('Invalid or unsafe SVG');
process.stdout.write(svg);
