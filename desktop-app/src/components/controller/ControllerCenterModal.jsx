import React from 'react';
import Modal from '../Modal';
import ControllerCenterPrototype from './ControllerCenterPrototype';
import { createControllerInput } from '../../services/controller-input.mjs';

const EMPTY_INVENTORY = Object.freeze({ controllers: [], selectedIndex: null, selectedFingerprint: '', selectedInput: { pressed: [], axes: [] }, connectedCount: 0 });

export default function ControllerCenterModal({ open, onClose, preferredFingerprint = '', onSelect, onManageWindows, onOpenSteamController, onInventoryChange }) {
  const adapter = React.useMemo(() => createControllerInput(), []);
  const [inventory, setInventory] = React.useState(EMPTY_INVENTORY);
  const [refreshedAt, setRefreshedAt] = React.useState(0);
  const preferredRef = React.useRef(preferredFingerprint);
  const lastInventoryRef = React.useRef(null);
  preferredRef.current = preferredFingerprint;

  const refresh = React.useCallback(() => {
    setInventory(adapter.snapshot(preferredRef.current));
    setRefreshedAt(Date.now());
  }, [adapter]);

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
        onSelect={selectController}
        onManageWindows={onManageWindows}
        onOpenSteamController={onOpenSteamController}
        onRefresh={refresh}
        refreshedAt={refreshedAt}
      />
    </div>
  </Modal>;
}
