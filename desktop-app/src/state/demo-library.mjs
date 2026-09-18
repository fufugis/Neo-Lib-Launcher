/* ---- Browser-preview demo data ---- */
export function createDemoLibrary(hashPin, NOW = Date.now()) {
const games = [
  {
    id: 'demo-1', name: 'Hollow Knight', appid: 367520, source: 'steam',
    exePath: 'C:\\Games\\Hollow Knight\\hollow_knight.exe',
    coverUrl: 'https://cdn.akamai.steamstatic.com/steam/apps/367520/header.jpg',
    headerImage: 'https://cdn.akamai.steamstatic.com/steam/apps/367520/header.jpg',
    background: 'https://cdn.akamai.steamstatic.com/steam/apps/367520/page_bg_generated_v6b.jpg',
    shortDescription: 'Forge your own path in Hollow Knight! An epic action adventure through a vast ruined kingdom of insects and heroes.',
    about: 'Forge your own path in Hollow Knight! An epic action adventure through a vast ruined kingdom of insects and heroes. Explore twisting caverns, ancient cities and deadly wastes; battle tainted creatures and befriend bizarre bugs; and solve ancient mysteries at the kingdom’s heart.',
    genres: ['Action', 'Adventure', 'Indie', 'Metroidvania'],
    developers: ['Team Cherry'], publishers: ['Team Cherry'],
    releaseDate: '24 Feb, 2017', metacritic: 90, website: 'https://hollowknight.com',
    screenshots: [], categoryIds: ['cat-fav'],
    playtime: 16200, lastPlayedAt: NOW - 86400000, addedAt: NOW - 86400000 * 32,
  },
  {
    id: 'demo-2', name: 'Hades', appid: 1145360, source: 'steam',
    exePath: 'C:\\Games\\Hades\\Hades.exe',
    coverUrl: 'https://cdn.akamai.steamstatic.com/steam/apps/1145360/header.jpg',
    headerImage: 'https://cdn.akamai.steamstatic.com/steam/apps/1145360/header.jpg',
    background: 'https://cdn.akamai.steamstatic.com/steam/apps/1145360/page_bg_generated_v6b.jpg',
    shortDescription: 'Defy the god of the dead as you hack and slash out of the Underworld in this rogue-like dungeon crawler.',
    genres: ['Action', 'Indie', 'Rogue-like'],
    developers: ['Supergiant Games'], publishers: ['Supergiant Games'],
    releaseDate: '17 Sep, 2020', metacritic: 93,
    screenshots: [], categoryIds: ['cat-fav', 'cat-rpg'],
    playtime: 38000, lastPlayedAt: NOW - 86400000 * 3, addedAt: NOW - 86400000 * 14,
  },
  {
    id: 'demo-3', name: 'Disco Elysium', appid: 632470, source: 'steam',
    exePath: 'D:\\Games\\Disco Elysium\\disco.exe',
    coverUrl: 'https://cdn.akamai.steamstatic.com/steam/apps/632470/header.jpg',
    headerImage: 'https://cdn.akamai.steamstatic.com/steam/apps/632470/header.jpg',
    shortDescription: 'Disco Elysium - The Final Cut is a groundbreaking role playing game.',
    genres: ['RPG', 'Adventure'],
    developers: ['ZA/UM'], publishers: ['ZA/UM'],
    releaseDate: '15 Oct, 2019', metacritic: 91,
    screenshots: [], categoryIds: ['cat-rpg'],
    playtime: 0, addedAt: NOW - 86400000 * 5,
  },
];
const categories = [
  { id: 'cat-fav', name: 'Favourites', colorId: 'orange', private: false },
  { id: 'cat-rpg', name: 'RPGs', colorId: 'cyan', private: false },
  { id: 'cat-secret', name: 'After hours', colorId: 'magenta', private: true, pinHash: hashPin('1234') },
];

const tools = [
  {
    id: 'tool-1', name: 'GPU-Z', exePath: 'C:\\Tools\\GPU-Z\\GPU-Z.exe',
    shortDescription: 'A lightweight system utility designed to provide vital information about your video card.',
    about: 'TechPowerUp GPU-Z is a lightweight system utility designed to provide vital information about your video card and graphics processor.',
    genres: ['System info'], website: 'https://www.techpowerup.com/gpuz/',
    categoryIds: ['tcat-hw'], addedAt: NOW - 86400000 * 22, source: 'manual',
  },
  {
    id: 'tool-2', name: 'CPU-Z', exePath: 'C:\\Tools\\CPU-Z\\cpuz_x64.exe',
    shortDescription: 'Gathers information on some of the main devices of your system.',
    about: 'CPU-Z is a freeware utility that gathers information on some of the main devices of your system: processor, mainboard, memory.',
    genres: ['System info'], website: 'https://www.cpuid.com',
    categoryIds: ['tcat-hw'], addedAt: NOW - 86400000 * 9, source: 'manual',
  },
  {
    id: 'tool-3', name: 'OBS Studio', exePath: 'C:\\Program Files\\obs-studio\\bin\\64bit\\obs64.exe',
    shortDescription: 'Free open-source software for video recording and live streaming.',
    about: 'OBS Studio is free and open source software for video recording and live streaming.',
    genres: ['Recording'], website: 'https://obsproject.com',
    categoryIds: [], addedAt: NOW - 86400000 * 4, source: 'manual',
  },
];
const toolCategories = [
  { id: 'tcat-hw', name: 'Hardware monitors', colorId: 'lime', private: false },
];

return { games, categories, tools, toolCategories };
}
