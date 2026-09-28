import React from 'react';
import { guessNameFromPath } from '../../lib/utils';
import { isExternalFileDrag } from './external-file-drop.mjs';

export function useExternalFileDrop({ enabled, nativeApi, addToGames, setDragOver, setWizardPrefillRoot, setWizardAutoScan, setShowWizard, notify }) {
  React.useEffect(() => {
    if (!enabled) return undefined;
    let leaveTimer;
    let staleTimer;
    const clearOverlay = () => {
      clearTimeout(leaveTimer);
      clearTimeout(staleTimer);
      setDragOver(false);
    };
    const showFileOverlay = () => {
      clearTimeout(leaveTimer);
      clearTimeout(staleTimer);
      setDragOver(true);
      staleTimer = setTimeout(() => setDragOver(false), 1500);
    };
    const onDragStart = event => {
      if (event.dataTransfer?.types?.includes('text/game-id')) clearOverlay();
    };
    const onKeyDown = event => { if (event.key === 'Escape') clearOverlay(); };
    const onVisibilityChange = () => { if (document.visibilityState === 'hidden') clearOverlay(); };
    const onDragEnter = event => {
      if (!isExternalFileDrag(event.dataTransfer)) { clearOverlay(); return; }
      event.preventDefault();
      showFileOverlay();
    };
    const onDragOver = event => {
      if (!isExternalFileDrag(event.dataTransfer)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
      showFileOverlay();
    };
    const onDragLeave = event => {
      if (!isExternalFileDrag(event.dataTransfer)) { clearOverlay(); return; }
      event.preventDefault();
      leaveTimer = setTimeout(() => setDragOver(false), 80);
    };
    const onDrop = async event => {
      event.preventDefault();
      if (!isExternalFileDrag(event.dataTransfer)) { clearOverlay(); return; }
      clearOverlay();
      const files = Array.from(event.dataTransfer?.files || []);
      let added = 0;
      for (const file of files) {
        const target = file.path;
        if (!target) continue;
        if (/\.lnk$/i.test(target) && nativeApi?.resolveLnk) {
          const resolved = await nativeApi.resolveLnk(target);
          if (resolved?.ok && resolved.target) {
            addToGames({ name: guessNameFromPath(resolved.target), exePath: resolved.target, launchArgs: resolved.args || '' });
            added += 1;
            continue;
          }
        }
        if (/\.(exe|bat|cmd)$/i.test(target)) {
          const icon = await nativeApi?.extractIcon?.(target);
          addToGames({ name: guessNameFromPath(target), exePath: target, icon });
          added += 1;
          continue;
        }
        if (!/\.\w{1,5}$/.test(target)) {
          setWizardPrefillRoot(target);
          setWizardAutoScan(true);
          setShowWizard(true);
          notify(`Folder dropped — scanning ${target}`);
        }
      }
      if (added > 0) notify(`Added ${added} game${added !== 1 ? 's' : ''} via drag-drop`);
    };
    window.addEventListener('dragstart', onDragStart);
    window.addEventListener('dragend', clearOverlay);
    window.addEventListener('blur', clearOverlay);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('pointerdown', clearOverlay);
    window.addEventListener('pointerup', clearOverlay);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(staleTimer);
      window.removeEventListener('dragstart', onDragStart);
      window.removeEventListener('dragend', clearOverlay);
      window.removeEventListener('blur', clearOverlay);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('pointerdown', clearOverlay);
      window.removeEventListener('pointerup', clearOverlay);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
    // Event listeners are session-owned; the setters and native bridge are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
