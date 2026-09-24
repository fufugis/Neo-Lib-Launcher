const assert = require('node:assert/strict');
const { createSpecialistMetadataProviderService } = require('../electron/providers/specialist-metadata-provider-service.cjs');

(async () => {
  const requests = [];
  let offline = false;
  const service = createSpecialistMetadataProviderService({
    cleanTitle: value => String(value || '').replace(/\s+-\s+Download$/i, '').trim(),
    async httpGetText(url) {
      requests.push(url);
      if (offline) throw new Error('offline');
      if (url.includes('itch.io/search')) return '<a class="title game_link" href="https://dev.itch.io/game">Indie Game</a><div data-background_image="cover.jpg"></div>';
      if (url === 'https://dev.itch.io/game') return '<meta property="og:title" content="Indie Game"><meta property="og:description" content="Indie description"><meta property="og:image" content="itch.jpg"><a href="one.png" class="screenshot"></a>';
      if (url.includes('dlsite.com')) return '<meta property="og:title" content="VN Game"><meta property="og:description" content="VN description"><meta property="og:image" content="vn.jpg"><span itemprop="brand"><a>Maker</a></span>';
      if (url === 'https://jaststore.com/games/rmtry001/meltys-quest') return '<meta property="og:title" content="Meltys Quest – JAST"><meta property="og:description" content="Official indie game"><meta property="og:image" content="https://cdn.jast.test/cover.jpg">';
      if (url === 'https://gamejolt.com/games/timore/25427') return '<meta content="Timore - Game Jolt" property="og:title"><meta content="Horror game" property="og:description">';
      if (url.includes('ryuugames.com/?s=')) return '<h2 class="post-title"><a href="https://www.ryuugames.com/post">Game - Download</a></h2>';
      if (url.endsWith('/post')) return '<meta property="og:image" content="ryuu.jpg"><meta property="og:description" content="Ryuu description">';
      throw new Error(`unexpected URL ${url}`);
    },
    async httpPostJson(url, body) {
      requests.push(url);
      if (offline) throw new Error('offline');
      assert.deepEqual(body.filters, ['search', '=', 'Visual Game']);
      return { results: [{ id: 42, title: 'Visual Game', description: '[i]Story[/i]', released: '2020-01-01', image: { url: 'vndb.jpg' }, developers: [{ name: 'Dev' }], screenshots: Array.from({ length: 8 }, (_, index) => ({ url: `s${index}.jpg` })) }] };
    },
  });

  assert.equal(service.extractDLsiteCode('Folder rj01450973 demo'), 'RJ01450973');
  assert.equal(service.extractDLsiteCode('Nothing'), null);
  const itch = await service.itchSearch('Indie Game');
  assert.deepEqual(itch[0], { url: 'https://dev.itch.io/game', title: 'Indie Game', image: 'cover.jpg' });
  const details = await service.itchDetails(itch[0].url);
  assert.equal(details.developer, 'dev');
  assert.deepEqual(details.shots, ['one.png']);
  const dlsite = await service.dlsiteLookup('RJ01450973');
  assert.equal(dlsite.name, 'VN Game');
  assert.deepEqual(dlsite.developers, ['Maker']);
  assert.equal(service.nichePage('jast', 'https://jaststore.com/games/rmtry001/meltys-quest'), 'https://jaststore.com/games/rmtry001/meltys-quest');
  assert.equal(service.nichePage('jast', 'https://jaststore.com.evil.test/games/rmtry001/meltys-quest'), null);
  assert.equal(service.nichePage('gamejolt', 'http://gamejolt.com/games/timore/25427'), null);
  assert.equal(service.nichePage('gamejolt', 'https://gamejolt.com/games/timore/25427'), 'https://gamejolt.com/games/timore/25427');
  assert.deepEqual(service.nicheStoreCandidates('jast', [
    { url: 'https://jaststore.com/games/rmtry001/meltys-quest', title: 'Meltys Quest – JAST Store', snippet: 'Official page' },
    { url: 'https://jaststore.com/games/rmtry001/meltys-quest', title: 'Duplicate' },
    { url: 'https://jaststore.com.evil.test/games/rmtry001/meltys-quest', title: 'Poison' },
    { url: 'https://jaststore.com/page/press', title: 'Not a game' },
  ]).map(item => item.name), ['Meltys Quest']);
  assert.deepEqual(service.nicheStoreCandidates('gamejolt', [{ url: 'https://gamejolt.com/games/timore/25427', title: 'Timore by Vidas Games - Game Jolt' }]).map(item => item.name), ['Timore']);
  assert.equal((await service.nicheStoreDetails('jast', 'https://jaststore.com/games/rmtry001/meltys-quest')).name, 'Meltys Quest');
  assert.equal((await service.nicheStoreDetails('gamejolt', 'https://gamejolt.com/games/timore/25427')).name, 'Timore');
  assert.equal(await service.nicheStoreDetails('jast', 'https://localhost/private'), null);
  const vndb = await service.vndbLookup('Visual Game');
  assert.equal(vndb.about, 'Story');
  assert.equal(vndb.screenshots.length, 6);
  assert.equal(vndb.website, 'https://vndb.org/v42');
  const ryuu = await service.ryuugamesSearch('Game');
  assert.equal(ryuu.name, 'Game');
  assert.equal(ryuu.headerImage, 'ryuu.jpg');
  offline = true;
  assert.deepEqual(await service.itchSearch('Game'), []);
  assert.equal(await service.dlsiteLookup('RJ01450973'), null);
  assert.equal(await service.vndbLookup('Game'), null);
  assert.equal(await service.ryuugamesSearch('Game'), null);
  assert.equal(await service.itchDetails('https://dev.itch.io/game'), null);
  assert.equal(await service.nicheStoreDetails('jast', 'https://jaststore.com/games/rmtry001/meltys-quest'), null);
  console.log('PASS: specialist metadata providers preserve itch.io, DLsite, VNDB, Ryuugames, JAST and Game Jolt parsing, allow-listed pages and offline fallbacks. Injected HTTP only.');
})().catch(error => { console.error(error); process.exitCode = 1; });
