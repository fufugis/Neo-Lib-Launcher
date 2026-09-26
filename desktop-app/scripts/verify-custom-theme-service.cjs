const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createCustomThemeService } = require('../electron/themes/custom-theme-service.cjs');
const { validateThemeGif } = require('../electron/themes/validate-theme-gif.cjs');
const { validateThemeWebm } = require('../electron/themes/validate-theme-webm.cjs');
const blankTheme = require('../electron/themes/blank-theme.json');

const gifFrame = Buffer.from('21f90400050000002c0000000001000100000202440100', 'hex');
const gifBytes = Buffer.concat([
  Buffer.from('GIF89a', 'ascii'), Buffer.from('01000100800000', 'hex'),
  Buffer.from('000000ffffff', 'hex'), Buffer.from('21ff0b', 'hex'),
  Buffer.from('NETSCAPE2.0', 'ascii'), Buffer.from('0301000000', 'hex'),
  gifFrame, gifFrame, Buffer.from('3b', 'hex'),
]);
// Container-only fixture: the browser metadata gate separately rejects clips
// that are undecodable, over 20 seconds or above 1080p.
const webmBytes = Buffer.concat([
  Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x87, 0x42, 0x82, 0x84]),
  Buffer.from('webm'), Buffer.from([0x18, 0x53, 0x80, 0x67, 0xff, 0x1f, 0x43, 0xb6, 0x75]),
  Buffer.alloc(112),
]);

(async () => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'neolib-theme-test-'));
  try {
    const source = path.join(temp, 'source');
    await fs.mkdir(path.join(source, 'assets'), { recursive: true });
    const stock = JSON.parse(await fs.readFile(path.join(__dirname, '../src/themes/stock/home/theme.json'), 'utf8'));
    const emitter = { id: 'fireflies', asset: 'assets/firefly.png', count: 12, sizePx: 20, opacity: 0.45, durationSeconds: 16, direction: 'rise' };
    const manifest = { ...stock, id: 'example-theme', name: 'Example Theme', effects: { particles: [emitter] } };
    const sourceImage = path.join(__dirname, '../src/themes/stock/home/assets/home-atmosphere.png');
    const manifestPath = path.join(source, 'theme.json');
    await fs.copyFile(sourceImage, path.join(source, 'assets/home-atmosphere.png'));
    await fs.copyFile(sourceImage, path.join(source, 'assets/firefly.png'));
    await fs.writeFile(manifestPath, JSON.stringify(manifest));
    const service = createCustomThemeService({ root: () => path.join(temp, 'installed'), reservedIds: ['home'] });
    assert.match((await service.inspect(manifestPath)).previewUrl, /^data:image\/png;base64,/);
    assert.equal((await service.install(manifestPath)).ok, true);
    assert.equal((await service.install(manifestPath)).ok, false, 'an existing user theme must not be overwritten');
    const installed = await service.list();
    assert.equal(installed.themes.length, 1);
    assert.equal(installed.themes[0].manifest.name, 'Example Theme');
    assert.equal(installed.themes[0].manifest.effects.particles[0].id, 'fireflies');
    assert.match(installed.themes[0].assetUrls['assets/home-atmosphere.png'], /^data:image\/png;base64,/);
    assert.match(installed.themes[0].assetUrls['assets/firefly.png'], /^data:image\/png;base64,/);
    const remix = await service.fork({ sourceId: 'example-theme', newId: 'example-remix', newName: 'Example Remix', creator: 'Tester', palette: { ...manifest.palette, accent: [10, 20, 30] }, panels: manifest.panels,
      layers: { ...manifest.layers, atmosphere: { type: 'none' }, sidebar: { type: 'image', sourcePath: sourceImage, opacity: 0.7 } }, particles: [
      { ...emitter, count: 8, placement: 'middle', depth: 'far', rotation: 45, glow: 8, reaction: 'celebrate' },
      { ...emitter, id: 'sparkle', sourcePath: sourceImage, count: 6, direction: 'fall' },
    ] });
    assert.equal(remix.ok, true, remix.error);
    const afterRemix = await createCustomThemeService({ root: () => path.join(temp, 'installed'), reservedIds: ['home'] }).list();
    assert.equal(afterRemix.themes.length, 2);
    const remixed = afterRemix.themes.find(theme => theme.manifest.id === 'example-remix');
    assert.equal(remixed.manifest.effects.particles[0].count, 8);
    assert.equal(remixed.manifest.effects.particles[0].placement, 'middle');
    assert.equal(remixed.manifest.effects.particles[0].depth, 'far');
    assert.equal(remixed.manifest.effects.particles[0].rotation, 45);
    assert.equal(remixed.manifest.effects.particles[0].glow, 8);
    assert.equal(remixed.manifest.effects.particles[0].reaction, 'celebrate');
    assert.deepEqual(remixed.manifest.palette.accent, [10, 20, 30]);
    assert.match(remixed.manifest.license.attribution, /Remix: Tester/);
    assert.match(remixed.assetUrls[remixed.manifest.effects.particles[1].asset], /^data:image\/png;base64,/);
    assert.equal(remixed.manifest.layers.atmosphere.type, 'none');
    assert.equal(remixed.manifest.layers.sidebar.opacity, 0.7);
    assert.match(remixed.assetUrls[remixed.manifest.layers.sidebar.asset], /^data:image\/png;base64,/);
    assert.equal(installed.themes[0].manifest.layers.atmosphere.type, 'image', 'source artwork must stay unchanged');
    assert.equal((await service.fork({ sourceId: 'example-theme', newId: 'example-remix', newName: 'Duplicate', creator: 'Tester', particles: [] })).ok, false, 'remix must never replace a theme');
    const firstTheme = await service.fork({ sourceId: 'blank-starter', newId: 'from-scratch', newName: 'From Scratch', creator: 'Creator', tone: 'bright', palette: blankTheme.palette, panels: blankTheme.panels,
      layers: { ...blankTheme.layers, atmosphere: { type: 'image', sourcePath: sourceImage, opacity: 1 } },
      particles: [{ ...emitter, sourcePath: sourceImage }] });
    assert.equal(firstTheme.ok, true, firstTheme.error);
    const made = (await service.list()).themes.find(theme => theme.manifest.id === 'from-scratch');
    assert.equal(made.manifest.license.attribution, 'Creator');
    assert.equal(made.manifest.tone, 'bright');
    assert.match(made.assetUrls[made.manifest.effects.particles[0].asset], /^data:image\/png;base64,/);
    assert.match(made.assetUrls[made.manifest.layers.atmosphere.asset], /^data:image\/png;base64,/);
    const canvasTheme = await service.fork({ sourceId: 'blank-starter', newId: 'image-canvas', newName: 'Image Canvas', creator: 'Creator',
      layers: { ...blankTheme.layers, canvas: { type: 'image', sourcePath: sourceImage, opacity: 0.45 } }, particles: [] });
    assert.equal(canvasTheme.ok, true, canvasTheme.error);
    const savedCanvas = (await service.list()).themes.find(theme => theme.manifest.id === 'image-canvas');
    assert.equal(savedCanvas.manifest.layers.canvas.opacity, 0.45);
    assert.match(savedCanvas.assetUrls[savedCanvas.manifest.layers.canvas.asset], /^data:image\/png;base64,/);
    assert.equal(validateThemeGif(gifBytes).frames, 2);
    assert.equal(validateThemeGif(gifBytes).durationMs, 100);
    assert.throws(() => validateThemeGif(gifBytes.subarray(0, -1)), /trailer/);
    const tooFast = Buffer.from(gifBytes);
    tooFast[tooFast.indexOf(gifFrame) + 4] = 1;
    assert.throws(() => validateThemeGif(tooFast), /pace/);
    const tooWide = Buffer.from(gifBytes);
    tooWide.writeUInt16LE(1921, 6);
    assert.throws(() => validateThemeGif(tooWide), /dimensions/);
    const noLoop = Buffer.from(gifBytes);
    Buffer.from('LOOPDISABLE').copy(noLoop, noLoop.indexOf('NETSCAPE2.0'));
    assert.throws(() => validateThemeGif(noLoop), /infinite loop/);
    const gifFolder = path.join(temp, 'gif-source');
    await fs.mkdir(path.join(gifFolder, 'assets'), { recursive: true });
    await fs.writeFile(path.join(gifFolder, 'assets/motion.gif'), gifBytes);
    await fs.copyFile(sourceImage, path.join(gifFolder, 'assets/still.png'));
    const gifManifest = { ...blankTheme, id: 'animated-theme', name: 'Animated Theme',
      layers: { ...blankTheme.layers, atmosphere: { type: 'gif', asset: 'assets/motion.gif', reducedMotionAsset: 'assets/still.png', loop: 'while-visible', opacity: 0.6 } } };
    const gifManifestPath = path.join(gifFolder, 'theme.json');
    await fs.writeFile(gifManifestPath, JSON.stringify(gifManifest));
    assert.equal((await service.install(gifManifestPath)).ok, true);
    const savedGif = (await service.list()).themes.find(theme => theme.manifest.id === 'animated-theme');
    assert.match(savedGif.assetUrls['assets/motion.gif'], /^data:image\/gif;base64,/);
    assert.match(savedGif.assetUrls['assets/still.png'], /^data:image\/png;base64,/);
    const gifRemix = await service.fork({ sourceId: 'animated-theme', newId: 'animated-remix', newName: 'Animated Remix', creator: 'Tester', layers: gifManifest.layers, particles: [] });
    assert.equal(gifRemix.ok, true, gifRemix.error);
    assert.equal((await service.list()).themes.find(theme => theme.manifest.id === 'animated-remix').manifest.layers.atmosphere.type, 'gif');
    const gifFromLab = await service.fork({ sourceId: 'blank-starter', newId: 'animated-from-lab', newName: 'Animated From Lab', creator: 'Tester',
      layers: { ...blankTheme.layers, atmosphere: { type: 'gif', sourcePath: path.join(gifFolder, 'assets/motion.gif'), reducedMotionSourcePath: sourceImage, loop: 'while-visible', opacity: 0.6 } }, particles: [] });
    assert.equal(gifFromLab.ok, true, gifFromLab.error);
    const labGif = (await service.list()).themes.find(theme => theme.manifest.id === 'animated-from-lab');
    assert.match(labGif.assetUrls[labGif.manifest.layers.atmosphere.asset], /^data:image\/gif;base64,/);
    assert.match(labGif.assetUrls[labGif.manifest.layers.atmosphere.reducedMotionAsset], /^data:image\/png;base64,/);
    const onceGifManifest = { ...gifManifest, id: 'once-gif-theme', name: 'Once GIF', layers: { ...gifManifest.layers,
      atmosphere: { ...gifManifest.layers.atmosphere, loop: 'once' } } };
    await fs.writeFile(gifManifestPath, JSON.stringify(onceGifManifest));
    assert.equal((await service.inspect(gifManifestPath)).manifest.layers.atmosphere.playbackMs, 100);
    assert.equal((await service.install(gifManifestPath)).ok, true);
    assert.equal((await service.list()).themes.find(theme => theme.manifest.id === 'once-gif-theme').manifest.layers.atmosphere.playbackMs, 100);
    const canvasGif = await service.fork({ sourceId: 'blank-starter', newId: 'canvas-gif', newName: 'Canvas GIF', creator: 'Tester',
      layers: { ...blankTheme.layers, canvas: { type: 'gif', sourcePath: path.join(gifFolder, 'assets/motion.gif'), reducedMotionSourcePath: sourceImage, loop: 'once', opacity: 0.5 } }, particles: [] });
    assert.equal(canvasGif.ok, true, canvasGif.error);
    assert.equal((await service.list()).themes.find(theme => theme.manifest.id === 'canvas-gif').manifest.layers.canvas.playbackMs, 100);
    const slowGif = Buffer.from(gifBytes);
    let frameOffset = slowGif.indexOf(gifFrame);
    slowGif.writeUInt16LE(1001, frameOffset + 4);
    frameOffset = slowGif.indexOf(gifFrame, frameOffset + gifFrame.length);
    slowGif.writeUInt16LE(1001, frameOffset + 4);
    await fs.writeFile(path.join(gifFolder, 'assets/motion.gif'), slowGif);
    assert.equal((await service.inspect(gifManifestPath)).ok, false, 'one-shot GIFs over 20 seconds are rejected');
    await fs.writeFile(path.join(gifFolder, 'assets/motion.gif'), gifBytes);
    assert.equal(validateThemeWebm(webmBytes).bytes, webmBytes.length);
    assert.throws(() => validateThemeWebm(Buffer.from('not a video')), /WebM/);
    assert.throws(() => validateThemeWebm(Buffer.alloc(8 * 1024 * 1024 + 1)), /8 MB/);
    const webmFolder = path.join(temp, 'webm-source');
    await fs.mkdir(path.join(webmFolder, 'assets'), { recursive: true });
    await fs.writeFile(path.join(webmFolder, 'assets/motion.webm'), webmBytes);
    await fs.copyFile(sourceImage, path.join(webmFolder, 'assets/still.png'));
    const webmManifest = { ...blankTheme, id: 'video-theme', name: 'Video Theme',
      layers: { ...blankTheme.layers, atmosphere: { type: 'video', asset: 'assets/motion.webm', reducedMotionAsset: 'assets/still.png', loop: 'once', opacity: 0.6 } } };
    const webmManifestPath = path.join(webmFolder, 'theme.json');
    await fs.writeFile(webmManifestPath, JSON.stringify(webmManifest));
    assert.match((await service.inspect(webmManifestPath)).previewUrl, /^data:image\/png;base64,/, 'video import preview uses the still');
    assert.equal((await service.install(webmManifestPath)).ok, true);
    const savedVideo = (await service.list()).themes.find(theme => theme.manifest.id === 'video-theme');
    assert.match(savedVideo.assetUrls['assets/motion.webm'], /^data:video\/webm;base64,/);
    const canvasVideo = await service.fork({ sourceId: 'blank-starter', newId: 'canvas-video', newName: 'Canvas Video', creator: 'Tester',
      layers: { ...blankTheme.layers, canvas: { type: 'video', sourcePath: path.join(webmFolder, 'assets/motion.webm'), reducedMotionSourcePath: sourceImage, loop: 'while-visible', opacity: 0.5 } }, particles: [] });
    assert.equal(canvasVideo.ok, true, canvasVideo.error);
    const savedCanvasVideo = (await service.list()).themes.find(theme => theme.manifest.id === 'canvas-video');
    assert.match(savedCanvasVideo.assetUrls[savedCanvasVideo.manifest.layers.canvas.asset], /^data:video\/webm;base64,/);
    const doubleAnimation = await service.fork({ sourceId: 'blank-starter', newId: 'double-animation', newName: 'Too Much Motion', creator: 'Tester',
      layers: { ...blankTheme.layers, canvas: { type: 'video', sourcePath: path.join(webmFolder, 'assets/motion.webm'), reducedMotionSourcePath: sourceImage, loop: 'always' }, atmosphere: { type: 'gif', sourcePath: path.join(gifFolder, 'assets/motion.gif'), reducedMotionSourcePath: sourceImage, loop: 'always' } }, particles: [] });
    assert.equal(doubleAnimation.ok, false, 'only one full-screen animation is permitted');
    const videoRemix = await service.fork({ sourceId: 'video-theme', newId: 'video-remix', newName: 'Video Remix', creator: 'Tester', layers: webmManifest.layers, particles: [] });
    assert.equal(videoRemix.ok, true, videoRemix.error);
    const videoFromLab = await service.fork({ sourceId: 'blank-starter', newId: 'video-from-lab', newName: 'Video From Lab', creator: 'Tester',
      layers: { ...blankTheme.layers, atmosphere: { type: 'video', sourcePath: path.join(webmFolder, 'assets/motion.webm'), reducedMotionSourcePath: sourceImage, loop: 'while-visible' } }, particles: [] });
    assert.equal(videoFromLab.ok, true, videoFromLab.error);
    await fs.writeFile(webmManifestPath, JSON.stringify({ ...webmManifest, layers: { ...webmManifest.layers, atmosphere: { ...webmManifest.layers.atmosphere, reducedMotionAsset: '../outside.png' } } }));
    assert.equal((await service.inspect(webmManifestPath)).ok, false, 'video fallback path must stay confined');
    await fs.writeFile(gifManifestPath, JSON.stringify({ ...gifManifest, layers: { ...gifManifest.layers, atmosphere: { ...gifManifest.layers.atmosphere, reducedMotionAsset: '../outside.png' } } }));
    assert.equal((await service.inspect(gifManifestPath)).ok, false, 'GIF fallback path must stay confined');
    const badArtwork = path.join(temp, 'fake.png');
    await fs.writeFile(badArtwork, 'not an image');
    const invalidArtwork = await service.fork({ sourceId: 'blank-starter', newId: 'bad-artwork', newName: 'Bad Artwork', creator: 'Creator', layers: { ...blankTheme.layers, atmosphere: { type: 'image', sourcePath: badArtwork } }, particles: [] });
    assert.equal(invalidArtwork.ok, false, 'invalid artwork bytes must not be installed');
    await fs.writeFile(manifestPath, JSON.stringify({ ...manifest, script: 'alert(1)' }));
    assert.equal((await service.inspect(manifestPath)).ok, false, 'scripts must be rejected');
    await fs.writeFile(manifestPath, JSON.stringify({ ...manifest, effects: { particles: [{ ...emitter, count: 1000 }] } }));
    assert.equal((await service.inspect(manifestPath)).ok, false, 'unbounded particle counts must be rejected');
    for (const patch of [{ placement: 'everywhere' }, { depth: 'foreground' }, { rotation: 181 }, { glow: 21 }, { reaction: 'execute' }]) {
      await fs.writeFile(manifestPath, JSON.stringify({ ...manifest, effects: { particles: [{ ...emitter, ...patch }] } }));
      assert.equal((await service.inspect(manifestPath)).ok, false, 'unsafe particle extension must be rejected');
    }
    await fs.writeFile(manifestPath, JSON.stringify({ ...manifest, id: 'home' }));
    assert.equal((await service.inspect(manifestPath)).ok, false, 'stock IDs must not be replaced');
    await fs.writeFile(manifestPath, JSON.stringify({ ...manifest, layers: { ...manifest.layers, atmosphere: { type: 'image', asset: '../outside.png' } } }));
    assert.equal((await service.inspect(manifestPath)).ok, false, 'path traversal must be rejected');
    await fs.writeFile(path.join(temp, 'installed/example-theme/assets/home-atmosphere.png'), 'not an image');
    assert.equal((await service.list()).themes.some(theme => theme.manifest.id === 'example-theme'), false, 'modified installed artwork must not load');
    console.log('PASS: custom themes inspect, install without overwrite, survive reload, and reject script, reserved ID, traversal and tampering.');
  } finally { await fs.rm(temp, { recursive: true, force: true }); }
})().catch(error => { console.error(error); process.exitCode = 1; });
