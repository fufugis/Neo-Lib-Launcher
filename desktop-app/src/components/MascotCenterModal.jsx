import React from 'react';
import { Check, Eye, EyeOff, MessageCircle, Sparkles, Volume2 } from 'lucide-react';
import Modal from './Modal';
import { getMascotVoiceLines, playMascotVoice } from '../lib/mascotVoice';
import { SettingsToggle as Toggle } from './settings/SettingsControls';

const NOTIFICATIONS = [
  { id: 'pcHigh', label: 'High PC use', hint: 'Major red alert when CPU or RAM stays high.' },
  { id: 'pcCheck', label: 'PC check', hint: 'A calm reminder when your PC is elevated before gaming.' },
  { id: 'favouriteNews', label: 'Favourite game news', hint: 'Notice when a favourite gets news.' },
  { id: 'favouriteUpdates', label: 'Favourite game updates', hint: 'Notice when a favourite has a verified update.' },
  { id: 'appUpdates', label: 'NEO-LIB updates', hint: 'Notice when a newer NEO-LIB version exists.' },
  { id: 'gameLaunch', label: 'Game launch send-off', hint: 'A brief voice reaction when you launch a game from NEO-LIB.' },
  { id: 'libraryAdditions', label: 'Library additions', hint: 'Celebrate a game or tool you deliberately add or import.' },
  { id: 'categoryPrivacy', label: 'Private category changes', hint: 'Confirm when a PIN category is protected, unlocked or panic-locked.' },
  { id: 'controllerConnections', label: 'Controller changes', hint: 'Mention a connect or disconnect only while Controller Center is open.' },
  { id: 'completion', label: 'Completion celebrations', hint: 'React after successful NEO-LIB actions.' },
  { id: 'idleNap', label: 'Idle nap', hint: 'Use a sleeping pose after a quiet period.' },
];
const MASCOTS = [
  { id: 'fungist', label: 'Fungist', detail: 'Original NEO-LIB companion', asset: 'mascot/fungist-stand.png' },
  { id: 'fifi', label: 'FiFi', detail: 'Living cyber-pet companion', asset: 'mascot/fifi/poses/fifi-idle-v1.png' },
];

export default function MascotCenterModal({ open, onClose, settings, setSettings }) {
  const setKey = (patch) => setSettings({ ...settings, ...patch });
  const mascotId = settings.mascotId === 'fifi' ? 'fifi' : 'fungist';
  const mascot = MASCOTS.find((entry) => entry.id === mascotId) || MASCOTS[0];
  const visible = settings.fungistEnabled !== false;
  const voiceLines = getMascotVoiceLines(mascotId);
  const setVisible = (value) => setKey(value
    ? { fungistEnabled: true, fungistVoiceEnabled: settings.fungistVoiceEnabledBeforeDisable !== false }
    : { fungistEnabled: false, fungistVoiceEnabledBeforeDisable: settings.fungistVoiceEnabled !== false, fungistVoiceEnabled: false });

  return <Modal open={open} onClose={onClose} title="Mascot Center" wide testid="mascot-center-modal">
    <div className="p-5 space-y-4">
      <div className="rounded-xl border border-[rgb(var(--accent)/0.28)] bg-[rgb(var(--accent)/0.06)] p-3"><div className="flex gap-2.5"><Sparkles size={16} className="mt-0.5 shrink-0 text-[rgb(var(--accent))]" /><div><p className="text-[12px] font-black text-ink">Your companion, your rules</p><p className="mt-0.5 text-[10px] leading-relaxed text-muted">Choose the mascot, what it can watch for, voice reactions and chat behaviour. Rest Mode still pauses all reactions.</p></div></div></div>
      <div className="rounded-xl hairline bg-[rgb(var(--surface)/0.42)] p-3"><Toggle label="Show NEO-LIB mascot" hint={`Hiding ${mascot.label} also mutes mascot voice lines. You can always restore the companion here.`} value={visible} onChange={setVisible} testid="mascot-center-enabled" /></div>
      <section><p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-[rgb(var(--accent-2))]">Choose companion</p><div className="grid gap-2 sm:grid-cols-2">{MASCOTS.map((entry) => { const active = entry.id === mascotId; return <button key={entry.id} type="button" data-testid={`mascot-center-${entry.id}`} aria-pressed={active} onClick={() => setKey({ mascotId: entry.id })} className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${active ? 'border-[rgb(var(--accent)/0.72)] bg-[rgb(var(--accent)/0.11)]' : 'border-[rgb(var(--border)/0.7)] hover:border-[rgb(var(--accent)/0.45)]'}`}><img src={`${import.meta.env.BASE_URL}${entry.asset}`} alt="" className="h-12 w-12 object-contain" /><span className="min-w-0 flex-1"><b className="block text-[12px] text-ink">{entry.label}</b><span className="mt-0.5 block text-[9px] text-muted">{entry.detail}</span></span>{active && <Check size={15} className="text-[rgb(var(--accent))]" />}</button>; })}</div></section>
      <div className={`grid gap-4 lg:grid-cols-2 ${visible ? '' : 'opacity-55'}`}>
        <section className="rounded-xl hairline bg-[rgb(var(--surface)/0.38)] p-3"><div className="flex items-center gap-2"><Volume2 size={15} className="text-[rgb(var(--accent))]" /><p className="text-[12px] font-black text-ink">Voice & reactions</p></div><div className="mt-3 space-y-3"><Toggle label={`${mascot.label} voice lines`} hint="Short event-limited reactions. They obey UI Sounds and Rest Mode." value={settings.fungistVoiceEnabled !== false} onChange={(value) => visible && setKey({ fungistVoiceEnabled: value })} disabled={!visible} testid="mascot-center-voice" /><label className="block"><span className="flex justify-between text-[10px] font-bold text-ink"><span>Voice volume</span><span className="text-muted">{Math.round(Number(settings.fungistVoiceVolume ?? 72))}%</span></span><input aria-label="Mascot voice volume" disabled={!visible} type="range" min="20" max="100" value={Number(settings.fungistVoiceVolume ?? 72)} onChange={(event) => setKey({ fungistVoiceVolume: Number(event.target.value) })} className="mt-1.5 w-full accent-[rgb(var(--accent))]" /></label><details><summary className="cursor-pointer text-[10px] font-bold text-[rgb(var(--accent-2))]">Preview voice map · {voiceLines.length} lines</summary><div className="mt-2 grid grid-cols-2 gap-1.5">{voiceLines.map((line) => <button key={line.id} type="button" disabled={!visible || settings.soundsEnabled === false || settings.fungistVoiceEnabled === false} onClick={() => playMascotVoice(line.id, { mascotId, volume: settings.fungistVoiceVolume ?? 72, cooldownMs: 0, priority: true })} className="rounded-md hairline px-2 py-1.5 text-left text-[9px] hover:border-[rgb(var(--accent)/0.55)] disabled:opacity-45"><b className="block text-ink">{line.label}</b><span className="text-muted">{line.use}</span></button>)}</div></details></div></section>
        <section className="rounded-xl hairline bg-[rgb(var(--surface)/0.38)] p-3"><div className="flex items-center gap-2"><MessageCircle size={15} className="text-[rgb(var(--accent))]" /><p className="text-[12px] font-black text-ink">Chat settings</p></div><p className="mt-1 text-[10px] leading-relaxed text-muted">Mascot chat uses only the connected Gemini model and your intentional prompts. It does not quietly read your accounts or private messages.</p><button type="button" aria-pressed className="mt-3 flex w-full items-center justify-between rounded-lg border border-[rgb(var(--accent)/0.6)] bg-[rgb(var(--accent)/0.10)] px-3 py-2 text-left"><span><b className="block text-[11px] text-ink">Gemini 2.5 Flash</b><span className="block text-[9px] text-muted">Current connected mascot chat model</span></span><Check size={14} className="text-[rgb(var(--accent))]" /></button><p className="mt-3 text-[9px] leading-relaxed text-muted">AI key and connection testing remain in Settings → AI fallback.</p></section>
      </div>
      <section className="rounded-xl hairline bg-[rgb(var(--surface)/0.38)] p-3"><p className="text-[12px] font-black text-ink">What {mascot.label} observes</p><p className="mt-0.5 text-[10px] leading-relaxed text-muted">Enable only the notices you want. NEO-LIB records no input history and Rest Mode pauses every reaction.</p><div className="mt-3 grid gap-2 md:grid-cols-2">{NOTIFICATIONS.map((item) => <Toggle key={item.id} label={item.label} hint={item.hint} value={(settings.fungistNotifications || {})[item.id] !== false} onChange={(value) => setKey({ fungistNotifications: { ...(settings.fungistNotifications || {}), [item.id]: value } })} testid={`mascot-observe-${item.id}`} />)}</div></section>
    </div>
  </Modal>;
}
