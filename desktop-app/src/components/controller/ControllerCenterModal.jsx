import React from 'react';
import Modal from '../Modal';
import ControllerCenterPrototype from './ControllerCenterPrototype';
import { createControllerInput } from '../../services/controller-input.mjs';

const EMPTY_INVENTORY = Object.freeze({ controllers: [], selectedIndex: null, selectedFingerprint: '', selectedInput: { pressed: [], axes: [] }, connectedCount: 0, access: 'ready', eventOnlyIndexes: [] });

export default function ControllerCenterModal({ open, onClose, preferredFingerprint = '', navigationEnabled = false, onNavigationEnabledChange, onSelect, onManageWindows, onOpenSteamController, onInventoryChange }) {
  const adapter = React.useMemo(() => createControllerInput(), []);
  const [inventory, setInventory] = React.useState(EMPTY_INVENTORY);
  const [refreshedAt, setRefreshedAt] = React.useState(0);
  const [windowsInventory, setWindowsInventory] = React.useState({ ok: null, devices: [], error: '' });
  const [windowsScanning, setWindowsScanning] = React.useState(false);
  const [windowsCheckedAt, setWindowsCheckedAt] = React.useState(0);
  const scanRequest = React.useRef(0);
  const preferredRef = React.useRef(preferredFingerprint);
  const lastInventoryRef = React.useRef(null);
  preferredRef.current = preferredFingerprint;

  const refresh = React.useCallback(() => {
    setInventory(adapter.snapshot(preferredRef.current));
    setRefreshedAt(Date.now());
  }, [adapter]);
  const scanWindows = React.useCallback(async () => {
    const request = ++scanRequest.current;
    setWindowsScanning(true);
    try {
      const result = await window.api?.scanWindowsControllers?.();
      if (request !== scanRequest.current) return;
      setWindowsInventory(result || { ok: false, devices: [], error: 'Windows device scanning is unavailable in this build.' });
      setWindowsCheckedAt(Date.now());
    } catch {
      if (request === scanRequest.current) setWindowsInventory({ ok: false, devices: [], error: 'Windows device scanning failed.' });
    } finally {
      if (request === scanRequest.current) setWindowsScanning(false);
    }
  }, []);
  const refreshAll = () => { refresh(); void scanWindows(); };

  React.useEffect(() => {
    if (!open) return undefined;
    setWindowsInventory({ ok: null, devices: [], error: '' });
    setWindowsCheckedAt(0);
    void scanWindows();
    return () => { scanRequest.current += 1; };
  }, [open, scanWindows]);

  React.useEffect(() => {
    if (!open) return undefined;
    refresh();
    const unsubscribe = adapter.subscribe(refresh);
    const timer = window.setInterval(refresh, 250);
    return () => {
      unsubscribe();
      window.clearInterval(timer);
    };
  }, [adapter, open, refresh]);

  React.useEffect(() => {
    if (open) refresh();
  }, [open, preferredFingerprint, refresh]);

  // Controller discovery remains limited to this open panel. We report only
  // a count change—never button history, device IDs, battery data or a
  // background connection monitor.
  React.useEffect(() => {
    if (!open) { lastInventoryRef.current = null; return; }
    const previous = lastInventoryRef.current;
    const current = Number(inventory.connectedCount || 0);
    lastInventoryRef.current = current;
    if (previous === null || previous === current) return;
    onInventoryChange?.({ previous, current });
  }, [inventory.connectedCount, onInventoryChange, open]);

  const selectController = (fingerprint) => {
    onSelect?.(fingerprint);
    setInventory(adapter.snapshot(fingerprint));
  };

  return <Modal open={open} onClose={onClose} title="Controller Center" wide testid="controller-center-modal">
    <div className="p-5">
      <ControllerCenterPrototype
        inventory={inventory}
        selectedFingerprint={preferredFingerprint || inventory.selectedFingerprint}
        navigationEnabled={navigationEnabled}
        onNavigationEnabledChange={onNavigationEnabledChange}
        onSelect={selectController}
        onManageWindows={onManageWindows}
        onOpenSteamController={onOpenSteamController}
        onRefresh={refreshAll}
        refreshedAt={refreshedAt}
        windowsInventory={windowsInventory}
        windowsScanning={windowsScanning}
        windowsCheckedAt={windowsCheckedAt}
      />
    </div>
  </Modal>;
}
