import assert from 'node:assert/strict';
import { createMetadataWorkflow } from '../src/services/metadata-workflow.mjs';
import { EMPTY_REFRESH_QUEUE } from '../src/state/metadata-refresh-state.mjs';

function harness(overrides = {}) {
  const events = {
    notices: [], reviews: [], fetching: [], updates: [], accepts: [], troubleshoot: [],
    queue: [], picker: [], selected: [], modes: [], confirms: [], tidy: [],
  };
  const games = overrides.games || [{ id: 'game-1', name: 'Test Game', exePath: 'C:\\Games\\Test\\game.exe' }];
  const nativeApi = overrides.nativeApi || {
    fetchMetadata: async () => ({ name: 'Test Game', source: 'gog', headerImage: 'https://images.test/header.jpg' }),
    cacheImage: async (url) => `cached:${url}`,
  };
  const workflow = createMetadataWorkflow({
    isElectron: overrides.isElectron ?? true,
    notify: (message) => events.notices.push(message),
    setRefreshReview: (value) => events.reviews.push(value),
    setFetching: (value) => events.fetching.push(value),
    nativeApi,
    settings: { geminiKey: '', aiModel: 'gemini-2.5-flash', ...(overrides.settings || {}) },
    setAcceptPreview: (value) => events.accepts.push(value),
    setTroubleshoot: (value) => events.troubleshoot.push(value),
    updateGame: (id, patch) => events.updates.push({ id, patch }),
    libraryRef: { current: { games } },
    setMetadataRepairQueue: (value) => events.queue.push(value),
    setTidyOpen: (value) => events.tidy.push(value),
    setSelectedId: (value) => events.selected.push(value),
    setMode: (value) => events.modes.push(value),
    setFetchPickerGame: (value) => events.picker.push(value),
    metadataRepairQueue: overrides.metadataRepairQueue || { ...EMPTY_REFRESH_QUEUE },
    currentItems: games,
    setConfirmCfg: (value) => events.confirms.push(value),
    guessNameFromPath: () => 'Derived Game',
    now: () => Date.UTC(2026, 8, 17),
  });
  return { workflow, events, nativeApi, games };
}

{
  const { workflow, events } = harness({ isElectron: false });
  assert.equal(await workflow.refetchGame({ id: 'game-1', name: 'Test Game' }, { silent: true }), null);
  assert.deepEqual(events.notices, ['Re-fetch only works in the installed app.']);
}

{
  let calls = 0;
  const { workflow, events } = harness({ nativeApi: { fetchMetadata: async () => { calls += 1; return null; } } });
  await workflow.refetchGame({ id: 'game-1', name: 'Test Game' });
  assert.equal(calls, 0, 'Normal refresh must open reviewed candidates instead of replacing metadata');
  assert.equal(events.reviews[0]?.field, 'all-locked');
}

{
  const requests = [];
  const { workflow, events } = harness({
    nativeApi: {
      deriveMetadataHints: async () => ({ hints: [{ query: 'Wrong extra title' }] }),
      fetchMetadata: async (request) => { requests.push(request); return { name: 'Steam Result', source: 'steam', headerImage: 'https://images.test/steam.jpg' }; },
      cacheImage: async (url) => `cached:${url}`,
    },
  });
  await workflow.refetchGame({ id: 'steam', name: 'Steam Game', appid: 42, launcher: 'steam', exePath: 'C:\\Games\\Steam\\game.exe' }, { silent: true });
  assert.equal(requests.length, 1);
  assert.equal(requests[0].lockedAppid, 42, 'Known Steam identity must remain locked during automatic refresh');
  assert.equal(events.updates[0].patch.coverUrl, 'cached:https://images.test/steam.jpg');
  assert.deepEqual(events.fetching, [true, false]);
}

{
  const requests = [];
  const { workflow, events } = harness({
    nativeApi: {
      deriveMetadataHints: async () => ({ hints: [] }),
      fetchMetadata: async (request) => { requests.push(request); return { name: 'World of Warcraft', source: 'battlenet' }; },
      cacheImage: async (url) => url,
    },
  });
  await workflow.refetchGame({ id: 'wow', name: 'World of Warcraft', appid: 999, launcher: 'battlenet', launcherProductId: 'wow' }, { autoApply: true });
  assert.equal(requests[0].lockedAppid, null, 'Battle.net must use its own product identity rather than a stale store app id');
  assert.equal(events.updates[0].patch.source, 'battlenet');
  assert.equal(events.accepts.length, 0);
}

{
  const { workflow, events, games } = harness();
  workflow.beginMetadataRepairQueue(games);
  assert.equal(events.queue[0]?.active, true);
  assert.equal(events.selected[0], 'game-1');
  assert.equal(events.modes[0], 'library');
  assert.equal(events.picker[0]?.id, 'game-1');
}

{
  const games = [{ id: 'game-1', name: 'Test Game', manualOverride: false }];
  const { workflow, events } = harness({ games });
  workflow.requestMetadataRefresh('full');
  assert.equal(events.confirms[0]?.confirmLabel, 'Refresh all 1');
  events.confirms[0].onConfirm();
  assert.equal(events.reviews[0]?.games[0]?.id, 'game-1');
  assert.match(events.notices.at(-1), /Nothing is replaced without your selection/);
}

console.log('PASS: metadata workflow preserves reviewed refresh, store identity locks, Battle.net identity, cached artwork, repair queues and bulk confirmation. Injected native API only.');
