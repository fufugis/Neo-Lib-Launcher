import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import AddGameModal from '../AddGameModal';
import ToolMetadataModal from '../ToolMetadataModal';
import WizardModal from '../WizardModal';
import SettingsModal from '../SettingsModal';
import ThemeStudioModal from '../ThemeStudioModal';
import MascotCenterModal from '../MascotCenterModal';
import SettingsRecoveryBoundary from '../SettingsRecoveryBoundary';
import ControllerCenterModal from '../controller/ControllerCenterModal';
import SaveGameModal from '../SaveGameModal';
import LaunchDoctorModal from '../LaunchDoctorModal';
import ChangelogModal from '../ChangelogModal';
import CategoryModal from '../CategoryModal';
import CategoryManagerModal from '../CategoryManagerModal';
import PinModal from '../PinModal';
import { CategoryContextMenu } from '../library/LibraryTree';
import PromptModal from '../PromptModal';
import ConfirmModal from '../ConfirmModal';
import EditMetadataModal from '../EditMetadataModal';
import AcceptMetadataModal from '../AcceptMetadataModal';
import FetchSourcePicker from '../FetchSourcePicker';
import TidyUpModal from '../TidyUpModal';
import PostPlayRatingModal from '../PostPlayRatingModal';
import Confetti from '../Confetti';
import StartupIntro from '../StartupIntro';
import FeedbackModal from '../FeedbackModal';
import PlaytimeImportModal from '../PlaytimeImportModal';
import RefreshCandidatesModal from '../RefreshCandidatesModal';
import TroubleshootModal from '../TroubleshootModal';
import TutorialModal from '../TutorialModal';
import AutoSortModal from '../AutoSortModal';
import DonateModal from '../DonateModal';
import LauncherDetectModal from '../LauncherDetectModal';
import { WINDOWS_CONTROLLER_SETTINGS } from '../../input/controller-model.mjs';

export default function AppModalLayer({ context }) {
  const {
    showAdd,
    isTools,
    setShowAdd,
    addGame,
    toolMetadataTarget,
    setToolMetadataTarget,
    addTool,
    updateTool,
    notify,
    showWizard,
    setShowWizard,
    setWizardPrefillRoot,
    setWizardAutoScan,
    requestMetadataRefresh,
    openTidyUp,
    addToGames,
    library,
    wizardPrefillRoot,
    wizardAutoScan,
    settings,
    showSettings,
    setShowSettings,
    themeStudioOpen,
    setThemeStudioOpen,
    mascotCenterOpen,
    setMascotCenterOpen,
    openFeedback,
    persistSettings,
    setChangelogOpen,
    appVersion,
    controllerCenterOpen,
    setControllerCenterOpen,
    nativeApi,
    saveManagerGame,
    setSaveManagerGame,
    updateGame,
    launchDoctorGame,
    setLaunchDoctorGame,
    changelogOpen,
    updateSetting,
    catModal,
    setCatModal,
    updateCategory,
    createCategory,
    categoryManagerOpen,
    setCategoryManagerOpen,
    requestDeleteCategory,
    clearRegularCategories,
    pinModal,
    setPinModal,
    pinThen,
    catCtx,
    setCatCtx,
    handleCategoryAction,
    promptCfg,
    setPromptCfg,
    closePrompt,
    confirmCfg,
    setConfirmCfg,
    editMetaGame,
    setEditMetaGame,
    acceptPreview,
    setAcceptPreview,
    metadataRepairQueue,
    advanceMetadataRepairQueue,
    applyAcceptedMetadata,
    setFetchPickerGame,
    fetchPickerGame,
    stopMetadataRepairQueue,
    tidyOpen,
    setTidyOpen,
    removeGame,
    setSelectedId,
    setMode,
    beginMetadataRepairQueue,
    ratingPromptGame,
    setRatingPromptGame,
    confetti,
    introHiddenThisSession,
    setIntroHiddenThisSession,
    feedbackOpen,
    feedbackInitialMode,
    setFeedbackOpen,
    importPreview,
    setImportPreview,
    applyImportPatches,
    dragOver,
    refreshReview,
    setRefreshReview,
    troubleshoot,
    setTroubleshoot,
    fetching,
    handleTroubleshoot,
    tutorialOpen,
    navigateTutorial,
    setTutorialVisualsOpen,
    setTutorialOpen,
    isElectron,
    autoSortOpen,
    setAutoSortOpen,
    visibleGames,
    currentCats,
    handleAutoSortApply,
    undoAutoSort,
    autoSortUndo,
    refetchMissingGenres,
    donateOpen,
    setDonateOpen,
    detectedLauncher,
    importDetectedLauncher,
    setDetectedLauncher,
    bootDone,
    toast
  } = context;

  return (
    <>
      {/* Modals */}
      <AddGameModal open={showAdd && !isTools} onClose={() => setShowAdd(false)} onCreate={addGame} />
      <ToolMetadataModal
        open={showAdd && isTools}
        tool={toolMetadataTarget}
        onClose={() => { setShowAdd(false); setToolMetadataTarget(null); }}
        onCreate={addTool}
        onUpdate={updateTool}
        onNotice={notify}
      />
      <WizardModal
        open={showWizard}
        onClose={() => { setShowWizard(false); setWizardPrefillRoot(''); setWizardAutoScan(false); }}
        onAccept={addToGames}
        onAddManual={() => setShowAdd(true)}
        onRefreshLibrary={requestMetadataRefresh}
        onTidyLibrary={openTidyUp}
        existingExePaths={(library.games || []).map((g) => g.exePath).filter(Boolean)}
        existingGames={library.games || []}
        prefilledRoot={wizardPrefillRoot}
        autoScan={wizardAutoScan}
        geminiKey={settings.geminiKey || ''}
        aiModel={settings.aiModel || 'gemini-2.5-flash'}
      />
      <SettingsRecoveryBoundary open={showSettings} onClose={() => setShowSettings(false)} onReportBug={() => openFeedback('bug')}>
        <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} settings={settings} setSettings={persistSettings} onShowChangelog={() => setChangelogOpen(true)} currentVersion={appVersion} />
      </SettingsRecoveryBoundary>
      <ThemeStudioModal open={themeStudioOpen} onClose={() => setThemeStudioOpen(false)} settings={settings} setSettings={persistSettings} />
      <MascotCenterModal open={mascotCenterOpen} onClose={() => setMascotCenterOpen(false)} settings={settings} setSettings={persistSettings} />
      <ControllerCenterModal
        open={controllerCenterOpen}
        onClose={() => setControllerCenterOpen(false)}
        preferredFingerprint={settings.preferredControllerFingerprint || ''}
        onSelect={(preferredControllerFingerprint) => persistSettings({ ...settings, preferredControllerFingerprint })}
        onManageWindows={async () => {
          const result = await nativeApi?.openExternal?.(WINDOWS_CONTROLLER_SETTINGS);
          if (!result?.ok) notify(result?.error || 'Could not open Windows controller settings.');
        }}
        onOpenSteamController={async () => {
          const result = await nativeApi?.openSteamController?.();
          if (!result?.ok) notify(result?.error || 'Steam controller settings could not be opened.');
        }}
        onInventoryChange={({ previous, current }) => {
          const connected = current > previous;
          context.setMascotActivity?.({
            key: `controller-${Date.now()}`,
            expiresAt: Date.now() + 20_000,
            preferenceKey: 'controllerConnections',
            title: connected ? 'Controller connected' : 'Controller disconnected',
            body: connected
              ? `${current === 1 ? 'One controller is ready' : `${current} controllers are ready`} in Controller Center.`
              : (current ? `${current} controller${current === 1 ? ' remains' : 's remain'} in Controller Center.` : 'No controllers are currently detected in Controller Center.'),
            voice: connected ? 'take-a-look' : 'ouff',
          });
        }}
      />
      <SaveGameModal
        game={saveManagerGame}
        onClose={() => setSaveManagerGame(null)}
        onSaveFolder={(saveFolder) => { if (saveManagerGame) { updateGame(saveManagerGame.id, { saveFolder }); setSaveManagerGame((game) => game ? { ...game, saveFolder } : game); } }}
        onNotice={notify}
      />
      <LaunchDoctorModal
        game={launchDoctorGame}
        onClose={() => setLaunchDoctorGame(null)}
        onUseExecutable={(exePath) => {
          if (!launchDoctorGame) return;
          updateGame(launchDoctorGame.id, { exePath, launchDoctorSuggested: false, launchProblems: [] });
          notify(`Launch target updated · ${launchDoctorGame.name}`);
          setLaunchDoctorGame(null);
        }}
      />
      <ChangelogModal
        open={changelogOpen}
        currentVersion={appVersion}
        lastSeenVersion={settings.lastSeenVersion}
        theme={settings.theme}
        onClose={() => {
          setChangelogOpen(false);
          // Persist so we don't show it again for this version
          if (settings.lastSeenVersion !== appVersion) {
            updateSetting({ lastSeenVersion: appVersion });
          }
        }}
      />
      <CategoryModal
        open={catModal.open}
        initial={catModal.initial}
        onClose={() => setCatModal({ open: false, initial: null })}
        onSubmit={(data) => {
          if (catModal.initial) {
            updateCategory(catModal.initial.id, data);
            setCatModal({ open: false, initial: null });
          } else createCategory(data);
        }}
      />
      <CategoryManagerModal
        open={categoryManagerOpen}
        onClose={() => setCategoryManagerOpen(false)}
        categories={library.categories || []}
        games={library.games || []}
        onCreate={() => { setCategoryManagerOpen(false); setCatModal({ open: true, initial: null }); }}
        onEdit={(category) => { setCategoryManagerOpen(false); setCatModal({ open: true, initial: category }); }}
        onDelete={requestDeleteCategory}
        onClearRegular={clearRegularCategories}
      />
      <PinModal
        open={pinModal.open}
        mode={pinModal.mode}
        category={pinModal.category}
        categoryName={pinModal.category?.name}
        error={pinModal.error}
        onClose={() => setPinModal({ open: false, mode: 'unlock', category: null, error: '' })}
        onSubmit={(pin) => pinThen && pinThen(pin)}
      />

      <CategoryContextMenu
        open={catCtx.open}
        anchor={catCtx.anchor}
        category={catCtx.category}
        onClose={() => setCatCtx({ open: false, category: null, anchor: null })}
        onAction={handleCategoryAction}
      />

      <PromptModal
        open={!!promptCfg.open}
        title={promptCfg.title}
        label={promptCfg.label}
        defaultValue={promptCfg.defaultValue}
        placeholder={promptCfg.placeholder}
        multiline={promptCfg.multiline}
        confirmLabel={promptCfg.confirmLabel}
        onSubmit={(v) => { promptCfg.onSubmit && promptCfg.onSubmit(v); setPromptCfg({ open: false }); }}
        onClose={() => closePrompt(true)}
      />

      <ConfirmModal
        open={!!confirmCfg.open}
        title={confirmCfg.title}
        message={confirmCfg.message}
        confirmLabel={confirmCfg.confirmLabel}
        cancelLabel={confirmCfg.cancelLabel}
        destructive={confirmCfg.destructive}
        typedConfirm={confirmCfg.typedConfirm}
        onConfirm={() => { confirmCfg.onConfirm && confirmCfg.onConfirm(); }}
        onClose={() => {
          setConfirmCfg((p) => {
            if (p.onCancel) p.onCancel();
            return { open: false };
          });
        }}
      />

      <EditMetadataModal
        open={!!editMetaGame}
        game={editMetaGame}
        onClose={() => setEditMetaGame(null)}
        onSave={(patch) => {
          if (!editMetaGame) return;
          updateGame(editMetaGame.id, patch);
          notify(`Saved · ${patch.name || editMetaGame.name}`);
        }}
      />

      <AcceptMetadataModal
        open={acceptPreview.open}
        game={acceptPreview.game}
        proposed={acceptPreview.proposed}
        busy={acceptPreview.busy}
        onClose={() => metadataRepairQueue.active ? advanceMetadataRepairQueue('skipped') : setAcceptPreview({ open: false, game: null, proposed: null, busy: false })}
        onAccept={async (patch) => {
          const g = acceptPreview.game;
          setAcceptPreview({ open: false, game: null, proposed: null, busy: false });
          if (g) await applyAcceptedMetadata(g, patch);
          if (metadataRepairQueue.active) advanceMetadataRepairQueue('repaired');
        }}
        onTryAgain={async () => {
          // v1.2.0: refetch from accept-preview now opens the unified
          // multi-source picker. User-driven, no more black-box auto cycle.
          const g = acceptPreview.game;
          if (!g) return;
          setAcceptPreview({ open: false, game: null, proposed: null, busy: false });
          setFetchPickerGame(g);
        }}
      />

      {/* Unified multi-source metadata picker — v1.2.0
          One modal handles: Re-fetch from GameDetail, Try again from
          Accept preview, and Wizard refetch. */}
      <FetchSourcePicker
        open={!!fetchPickerGame}
        game={fetchPickerGame}
        geminiKey={settings.geminiKey || ''}
        aiModel={settings.aiModel || 'gemini-2.5-flash'}
        progress={metadataRepairQueue.active ? {
          current: metadataRepairQueue.index + 1,
          total: metadataRepairQueue.ids.length,
          repaired: metadataRepairQueue.repaired,
          skipped: metadataRepairQueue.skipped,
        } : null}
        onStopQueue={stopMetadataRepairQueue}
        onClose={() => metadataRepairQueue.active ? advanceMetadataRepairQueue('skipped') : setFetchPickerGame(null)}
        onPick={(metadata) => {
          const g = fetchPickerGame;
          setFetchPickerGame(null);
          if (g) setAcceptPreview({ open: true, game: g, proposed: metadata, busy: false });
        }}
      />

      <TidyUpModal
        open={tidyOpen}
        games={library.games || []}
        onDelete={(id) => removeGame(id)}
        onSelect={(id) => { setSelectedId(id); setMode('library'); setTidyOpen(false); }}
        onRepairMetadata={beginMetadataRepairQueue}
        onClose={() => setTidyOpen(false)}
      />

      <PostPlayRatingModal
        game={ratingPromptGame?.game || null}
        seconds={ratingPromptGame?.seconds || 0}
        onRate={(rating) => {
          if (ratingPromptGame?.game?.id) updateGame(ratingPromptGame.game.id, { rating, ratingPromptSnoozedUntil: 0 });
          setRatingPromptGame(null);
          notify(`Rated ${ratingPromptGame?.game?.name || 'game'} · ${Number(rating).toFixed(1)}`);
        }}
        onSnooze={() => {
          if (ratingPromptGame?.game?.id) updateGame(ratingPromptGame.game.id, { ratingPromptSnoozedUntil: Date.now() + 7 * 24 * 60 * 60 * 1000 });
          setRatingPromptGame(null);
        }}
        onNever={() => {
          if (ratingPromptGame?.game?.id) updateGame(ratingPromptGame.game.id, { ratingPromptDismissed: true });
          setRatingPromptGame(null);
        }}
      />

      {/* Theme-aware confetti — bumps key when fired, auto-cleans */}
      <Confetti triggerKey={confetti.key} label={confetti.label} origin={confetti.origin} />

      {/* v1.4.0 — 3-second synthwave intro on every boot (skippable) */}
      {(introHiddenThisSession || settings.skipIntro) ? null : (
        <StartupIntro
          muted={settings.soundsEnabled === false}
          onDone={() => {
            setIntroHiddenThisSession(true);
          }}
        />
      )}

      {/* v1.5.0 — Feedback / Bug / Suggestion modal (Discord webhook) */}
      <FeedbackModal
        open={feedbackOpen}
        initialMode={feedbackInitialMode}
        appVersion={appVersion}
        theme={settings.theme}
        onClose={() => setFeedbackOpen(false)}
      />

      {/* v1.6.0 — Playtime Import Preview */}
      <PlaytimeImportModal
        open={importPreview.open}
        games={library.games || []}
        steamData={importPreview.data}
        ownedAppids={importPreview.ownedAppids}
        currentAccount={importPreview.currentAccount}
        debug={importPreview.debug}
        onApply={applyImportPatches}
        onClose={() => setImportPreview((p) => ({ ...p, open: false }))}
        onRefreshSingle={async ({ appid }) => {
          if (!appid || !nativeApi?.importSteamPlaytime) return null;
          const res = await nativeApi.importSteamPlaytime({ force: true });
          return res?.data?.[String(appid)] || null;
        }}
        onRefreshAll={async () => {
          if (!nativeApi?.importSteamPlaytime) return;
          const res = await nativeApi.importSteamPlaytime({ force: true });
          if (res?.ok) {
            setImportPreview((p) => ({
              ...p,
              data: res.data || {},
              ownedAppids: res.ownedAppids || [],
              currentAccount: res.currentAccount || p.currentAccount,
              debug: res.debug || p.debug,
            }));
          }
        }}
      />

      {/* Drag-drop overlay — neon "Drop to add" banner appears when files are over the window */}
      <AnimatePresence>
        {dragOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-none fixed inset-0 z-[400] grid place-items-center"
            data-testid="drop-overlay"
          >
            <div
              className="absolute inset-2 rounded-2xl"
              style={{
                background: 'rgb(var(--surface) / 0.55)',
                backdropFilter: 'blur(8px)',
                border: '2px dashed rgb(var(--accent) / 0.85)',
                boxShadow: 'inset 0 0 120px -20px rgb(var(--accent) / 0.55), 0 0 60px rgb(var(--accent) / 0.4)',
              }}
            />
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: [0.95, 1.02, 0.98, 1.0] }}
              transition={{ duration: 0.7, repeat: Infinity }}
              className="relative flex flex-col items-center gap-3"
            >
              <div className="text-5xl">✨</div>
              <div
                className="font-display text-2xl font-extrabold uppercase tracking-[0.32em]"
                style={{
                  color: 'rgb(var(--ink))',
                  textShadow: '0 0 12px rgb(var(--accent)), 0 0 24px rgb(var(--accent) / 0.6)',
                }}
              >
                Drop to add
              </div>
              <div className="text-xs text-muted">
                .exe · .lnk · or a folder (opens the Wizard)
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {refreshReview && <RefreshCandidatesModal
        key={`${refreshReview.games[refreshReview.index].id}:${refreshReview.field}`}
        game={refreshReview.games[refreshReview.index]}
        field={refreshReview.field}
        options={{ geminiKey: settings.geminiKey || '', aiModel: settings.aiModel || 'gemini-2.5-flash', ...refreshReview.options }}
        progress={refreshReview.games.length > 1 ? `${refreshReview.index + 1} of ${refreshReview.games.length}` : null}
        onClose={() => setRefreshReview(null)}
        onSkip={refreshReview.games.length > 1 ? () => setRefreshReview(review => review.index + 1 < review.games.length ? { ...review, index: review.index + 1 } : null) : null}
        onApply={async patch => {
          const game = refreshReview.games[refreshReview.index];
          updateGame(game.id, refreshReview.field === 'all-locked' ? { ...patch, metadataFetchedAt: Date.now() } : patch);
          notify(`Saved selected ${refreshReview.field === 'all-locked' ? 'metadata' : refreshReview.field} · ${game.name}`);
          setRefreshReview(review => review.index + 1 < review.games.length ? { ...review, index: review.index + 1 } : null);
        }}
      />}
      <TroubleshootModal
        open={troubleshoot.open}
        game={troubleshoot.game}
        busy={fetching}
        onClose={() => setTroubleshoot({ open: false, game: null })}
        onAction={handleTroubleshoot}
      />

      <TutorialModal
        open={tutorialOpen}
        mascotId={settings.mascotId || 'fungist'}
        soundsEnabled={settings.fungistEnabled !== false && settings.soundsEnabled !== false && (settings.soundPack || 'synthwave') !== 'none'}
        voiceEnabled={settings.fungistEnabled !== false && settings.fungistVoiceEnabled !== false}
        voiceVolume={settings.fungistVoiceVolume ?? 72}
        onNavigate={navigateTutorial}
        onClose={() => { setTutorialVisualsOpen(false); setTutorialOpen(false); }}
        onDontShowAgain={() => {
          updateSetting({ tutorialSeen: true, tutorialAlwaysShow: false });
          if (!isElectron && typeof localStorage !== 'undefined') {
            localStorage.setItem('neo-lib-tutorial-seen', '1');
          }
        }}
      />

      <AutoSortModal
        open={autoSortOpen}
        games={visibleGames}
        categories={currentCats}
        onClose={() => setAutoSortOpen(false)}
        onApply={handleAutoSortApply}
        onUndo={undoAutoSort}
        hasUndo={!!autoSortUndo}
        onRefetchMissing={refetchMissingGenres}
      />

      <DonateModal open={donateOpen} onClose={() => setDonateOpen(false)} />

      <LauncherDetectModal
        open={!!detectedLauncher}
        launcher={detectedLauncher}
        onImport={importDetectedLauncher}
        onSkip={(forever) => {
          if (forever) {
            updateSetting({
              launcherDetectDismissed: { ...(settings.launcherDetectDismissed || {}), [detectedLauncher]: true },
            });
          }
          setDetectedLauncher(null);
        }}
        onLater={() => {
          updateSetting({
            launcherAskLater: { ...(settings.launcherAskLater || {}), [detectedLauncher]: Date.now() },
          });
          setDetectedLauncher(null);
        }}
        onClose={() => setDetectedLauncher(null)}
      />

      {!bootDone && settings.crtBootEnabled !== false && <div className="crt-boot" />}

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }}
            data-testid="toast"
            className="pointer-events-none fixed bottom-6 left-1/2 z-[80] -translate-x-1/2 rounded-full hairline glass px-4 py-2 text-xs"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

    </>
  );
}
