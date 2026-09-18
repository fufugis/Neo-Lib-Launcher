export function splitLibrarySections(sections = [], { rowHeight = 44, categoryTextSize = 11, rowGap = 0, categoryGap = 8 } = {}) {
  const heights = sections.map((section) => {
    const header = (categoryTextSize || 11) + 22;
    const rows = (section.games?.length || 0) * (rowHeight + (rowGap || 0));
    return header + rows + (categoryGap || 8);
  });
  const target = heights.reduce((sum, height) => sum + height, 0) / 2;
  let accumulated = 0;
  let splitAt = sections.length;

  for (let index = 0; index < sections.length; index += 1) {
    if (accumulated >= target && index > 0) {
      splitAt = index;
      break;
    }
    const afterAdd = accumulated + heights[index];
    if (afterAdd > target && accumulated > target * 0.5 && index > 0) {
      splitAt = index;
      break;
    }
    accumulated = afterAdd;
  }

  return [sections.slice(0, splitAt), sections.slice(splitAt)];
}
