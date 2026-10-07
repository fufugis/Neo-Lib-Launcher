import React from 'react';
import Modal from '../Modal';
import AddonSettings from '../addons/AddonSettings';
import { OFFICIAL_LOUNGE } from './module-model.mjs';

export default function ModuleManagerModal({ open, onClose, settings, onChange, onOpenLounge }) {
  const api = React.useMemo(() => ({ listAddons: window.api?.listModules, importAddon: window.api?.importModule, updateAddon: window.api?.updateModule,
    removeAddon: window.api?.removeModule, restoreAddon: window.api?.restoreModule, pickAddonManifest: window.api?.pickModuleManifest, openPackage: window.api?.openModule }), []);
  const patch = change => onChange({ ...(Object.hasOwn(change, 'addonsEnabled') ? { modulesEnabled: change.addonsEnabled } : {}), ...(Object.hasOwn(change, 'addonConfig') ? { moduleConfig: change.addonConfig } : {}) });
  return <Modal open={open} onClose={onClose} title="Modules" wide testid="module-manager"><div className="space-y-5 p-5">
    <section className="rounded-xl border border-[rgb(var(--accent)/0.5)] bg-[rgb(var(--accent)/0.08)] p-4" data-testid="official-lounge-module"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold">{OFFICIAL_LOUNGE.name}</h2><p className="text-sm">Official built-in module · Owned and maintained by {OFFICIAL_LOUNGE.owner}</p></div><button type="button" className="rounded-lg border border-[rgb(var(--accent))] px-4 py-2" onClick={async () => { if (await onOpenLounge()) onClose(); }}>Open Lounge</button></div><p className="mt-2 text-xs text-muted">Included with NEO-LIB. Keeps its top sidebar position. Runs in its own window; cannot be replaced or uninstalled by imported packages.</p></section>
    <section><h2 className="mb-3 font-bold">Your custom modules</h2><p className="mb-3 text-xs text-muted">Custom coded pages open in separate module windows. They are not official NEO-LIB modules, regardless of the author name in their manifest. Addons remain separate embedded pages.</p><AddonSettings namespace="module" api={api} settings={{ addonsEnabled: settings.modulesEnabled, addonConfig: settings.moduleConfig }} onChange={patch} /></section>
  </div></Modal>;
}
