export const HARDWARE_TOOLS_CATEGORY = Object.freeze({ id: '__hardware_tools__', name: 'Hardware & graphics', colorId: 'lime', private: false, pinnedBottom: true });

export function sameToolName(a, b) {
  return String(a || '').replace(/[^a-z0-9]/gi, '').toLowerCase() === String(b || '').replace(/[^a-z0-9]/gi, '').toLowerCase();
}

export function withRecommendedGraphicsTools(current = {}, now = Date.now()) {
  const graphicsUtilities = [
    { id: 'recommended-dlss-swapper', name: 'DLSS Swapper', website: 'https://dlss-swapper.com/#download', about: 'Choose your own installed copy of DLSS Swapper to inspect and manage supported upscaler versions. NEO-LIB does not replace game files automatically.' },
    { id: 'recommended-optiscaler', name: 'OptiScaler', website: 'https://github.com/optiscaler/OptiScaler/releases', referenceOnly: true, about: 'Open the official OptiScaler releases or point NEO-LIB at your own downloaded files. OptiScaler is game-specific, not a standalone application to launch; NEO-LIB does not inject files automatically.' },
    { id: 'recommended-reshade', name: 'ReShade', website: 'https://reshade.me/#download', about: 'Open the official ReShade installer or locate an installed copy. Presets and per-game installation remain under your control.' },
  ];
  const tools = [...(current.tools || [])];
  for (const utility of graphicsUtilities) {
    const existingIndex = tools.findIndex((item) => sameToolName(item.name, utility.name));
    if (existingIndex >= 0) {
      const existing = tools[existingIndex];
      tools[existingIndex] = {
        ...existing,
        website: existing.website || utility.website,
        recommendedTool: true,
        referenceOnly: existing.exePath ? Boolean(existing.referenceOnly) : Boolean(utility.referenceOnly),
        availability: existing.exePath || existing.installFolderPath ? 'installed' : 'missing',
      };
      continue;
    }
    tools.push({ ...utility, recommendedTool: true, exePath: '', availability: 'missing', categoryIds: [HARDWARE_TOOLS_CATEGORY.id], shortDescription: 'Optional graphics utility. Locate your copy or get it from the official site.', genres: ['Graphics utility'], source: 'recommended-graphics', addedAt: now });
  }
  const toolCategories = (current.toolCategories || []).some((category) => category.id === HARDWARE_TOOLS_CATEGORY.id)
    ? current.toolCategories : [...(current.toolCategories || []), HARDWARE_TOOLS_CATEGORY];
  return { ...current, tools, toolCategories };
}

// Adds first-run hardware conveniences without replacing a player's own tools.
export function withGpuSetupTools(current = {}, setup = {}, now = Date.now()) {
  const utilities = setup?.utilities || {};
  const existing = current.tools || [];
  const managedDefaults = [
    {
      id: 'managed-gpuz', name: 'GPU-Z', managedTool: 'gpuz', exePath: utilities.gpuz?.exePath || '',
      availability: utilities.gpuz?.exePath ? 'installed' : 'missing', categoryIds: [HARDWARE_TOOLS_CATEGORY.id],
      shortDescription: 'Official TechPowerUp utility for graphics-card information.',
      about: 'GPU-Z shows detailed graphics-card, sensor, driver, and PCIe information. NEO-LIB can locate an existing copy or download the official portable utility after you ask.',
      genres: ['System info'], website: 'https://www.techpowerup.com/gpuz/', source: 'managed-hardware', addedAt: now,
    },
    {
      id: 'managed-cpuz', name: 'CPU-Z', managedTool: 'cpuz', exePath: utilities.cpuz?.exePath || '',
      availability: utilities.cpuz?.exePath ? 'installed' : 'missing', categoryIds: [HARDWARE_TOOLS_CATEGORY.id],
      shortDescription: 'Official CPUID utility for processor, memory, and mainboard information.',
      about: 'CPU-Z reports processor, mainboard, memory, and live clock information. NEO-LIB can locate it or download CPUID’s official interactive installer after you ask.',
      genres: ['System info'], website: 'https://www.cpuid.com/softwares/cpu-z.html', source: 'managed-hardware', addedAt: now,
    },
  ];
  let tools = existing.map((tool) => {
    const managed = managedDefaults.find((item) => sameToolName(item.name, tool.name));
    if (!managed) return tool;
    return { ...managed, ...tool, managedTool: managed.managedTool, availability: tool.exePath || managed.exePath ? 'installed' : 'missing' };
  });
  for (const tool of managedDefaults) if (!tools.some((item) => sameToolName(item.name, tool.name))) tools.push(tool);

  const control = setup?.controlCenter;
  if (control?.target) {
    const controlTool = {
      id: 'managed-gpu-control-center', name: control.name, exePath: control.target,
      launchTargetType: control.exePath ? 'exe' : 'uri', categoryIds: [HARDWARE_TOOLS_CATEGORY.id],
      shortDescription: /^vendor-/.test(control.source) ? 'Detected graphics-driver control centre.' : 'Windows graphics settings shortcut (vendor control centre was not found locally).',
      about: /^vendor-/.test(control.source)
        ? 'A local shortcut to the graphics control centre detected for your installed GPU.'
        : 'A safe Windows fallback shortcut. Install your GPU vendor’s control centre later and NEO-LIB can refresh this shortcut in a future hardware refresh.',
      genres: ['Graphics settings'], source: 'gpu-setup', addedAt: now,
    };
    const existingControl = tools.find((tool) => tool.id === controlTool.id);
    tools = existingControl
      ? tools.map((tool) => tool.id === controlTool.id ? { ...controlTool, addedAt: tool.addedAt || controlTool.addedAt } : tool)
      : [...tools, controlTool];
  }
  const hasManaged = tools.some((tool) => tool.managedTool || tool.id === 'managed-gpu-control-center');
  const categories = hasManaged && !(current.toolCategories || []).some((category) => category.id === HARDWARE_TOOLS_CATEGORY.id)
    ? [...(current.toolCategories || []), HARDWARE_TOOLS_CATEGORY]
    : (current.toolCategories || []);
  return withRecommendedGraphicsTools({ ...current, tools, toolCategories: categories }, now);
}
