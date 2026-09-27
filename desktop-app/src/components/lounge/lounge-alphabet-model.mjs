export function loungeGameLetter(game) {
  const initial = String(game?.name || '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').charAt(0).toUpperCase();
  return /^[A-Z]$/.test(initial) ? initial : '#';
}

export function loungeAlphabetCounts(games = []) {
  const counts = new Map();
  for (const game of Array.isArray(games) ? games : []) {
    const letter = loungeGameLetter(game);
    counts.set(letter, (counts.get(letter) || 0) + 1);
  }
  return counts;
}

export function filterLoungeLetter(games = [], letter = '') {
  const source = Array.isArray(games) ? games : [];
  return letter ? source.filter(game => loungeGameLetter(game) === letter) : source;
}
