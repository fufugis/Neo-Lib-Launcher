export const V1812_CHANGELOG = {
  version: '1.8.12', title: 'A clearer Library',
  major: [
    { title: 'Currently playing at a glance', body: 'The active game appears beside Library search with its icon and green text, including games detected from other launchers.' },
    { title: 'Wizard Library cleanup', body: 'Check missing game files and folders, locate moved games or remove selected Library entries. Offline drives are kept safe; installed game files are never deleted.' },
    { title: 'Live content while arranging', body: 'Home and Library layout editors show actual content inside each box as it resizes. Toggle simple boxes, and Save or Cancel without activating preview controls.' },
    { title: 'Proper Steam artwork', body: 'Steam games prefer official square icons and portrait covers, including existing libraries. Custom choices and related-image fallbacks remain available.' },
  ],
  fixes: [
    'Camo and Ember have lighter surfaces and artwork, with new ice-blue and turquoise accents.',
    'The launch mascot cheers beside the Launch button, with size-aware placement and click-through animation.',
    'Manual-add search results open a visible, clickable metadata review instead of hiding it behind Add Game.',
    'Entire Library reset clears games, Tools and categories after a confirmed save, even if artwork-cache cleanup fails.',
    'Edit preview layout stays in the banner’s top-right corner.',
    'Tools entries show a compact wrench; the category header keeps its name.',
    'Carbon Weave uses finer, consistently sized details instead of stretching with the Library panel.',
  ],
};
