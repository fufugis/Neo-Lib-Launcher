import React from 'react';
import { Music2, Volume2, VolumeX } from 'lucide-react';
import { normalizeLoungePreferences } from './lounge-layout-model.mjs';
import { LOUNGE_AMBIENCE_TRACKS } from './lounge-ambience.mjs';
import { LOUNGE_SAMPLE_ROLES } from './lounge-sample-model.mjs';
import LoungeSamplePicker from './LoungeSamplePicker';

const STYLES = [['glass', 'Glass', 'Clean and airy'], ['pulse', 'Pulse', 'Soft electronic'], ['orbit', 'Orbit', 'Bright and fluid'], ['samples', 'My samples', 'The supplied MP3 collection']];

export default function LoungeSoundControls({ preferences, soundsEnabled = true, onChange, onPreview, ambienceError = '', onRetryAmbience }) {
  const set = patch => onChange(normalizeLoungePreferences({ ...preferences, ...patch }));
  const [importError, setImportError] = React.useState('');
  const [pickerRole, setPickerRole] = React.useState(null);
  const closePicker = () => {
    const role = pickerRole;
    setPickerRole(null);
    window.requestAnimationFrame?.(() => document.getElementById(`lounge-sample-${role}`)?.focus());
  };
  const useSample = id => {
    set({ loungeSamples: { ...preferences.loungeSamples, [pickerRole]: id } });
    closePicker();
  };
  const importAudio = async () => {
    if (!window.api?.importLoungeAudio) { setImportError('Custom audio import is available in the installed Windows app.'); return; }
    try {
      const result = await window.api.importLoungeAudio();
      if (!result) return;
      if (!result.ok) { setImportError(result.error || 'Could not import this audio.'); return; }
      const next = normalizeLoungePreferences({ ...preferences, ambienceCustomUrl: result.url, ambienceTrack: 'custom' });
      if (!next.ambienceCustomUrl) { setImportError('This audio path could not be saved.'); return; }
      setImportError('');
      onChange(next);
    } catch { setImportError('Could not import this audio.'); }
  };
  return <section aria-label="Lounge sound" className="mt-7 border-t border-[rgb(var(--border)/0.7)] pt-5">
    <div className="flex items-center gap-2"><Volume2 size={19} className="text-[rgb(var(--accent-2))]" /><h3 className="text-lg font-black">Soundscape</h3></div>
    <p className="mt-1 text-xs text-muted">Short sounds for moving, OK and Back, plus optional looping Lounge ambience.</p>
    <button type="button" role="switch" aria-checked={preferences.browseSoundEnabled} onClick={() => set({ browseSoundEnabled: !preferences.browseSoundEnabled })} className={`lounge-setting-choice mt-4 inline-flex min-h-12 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold ${preferences.browseSoundEnabled ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.18)]' : 'border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.48)]'}`}>{preferences.browseSoundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}{preferences.browseSoundEnabled ? 'Lounge sounds on' : 'Lounge sounds off'}</button>
    <fieldset className="mt-4"><legend className="mb-2 text-xs font-black uppercase tracking-[0.15em] text-muted">Sound style</legend><div className="grid gap-2 sm:grid-cols-2">{STYLES.map(([id, label, note]) => <button key={id} type="button" aria-pressed={preferences.browseSoundStyle === id} onClick={() => set({ browseSoundStyle: id })} className={`lounge-setting-choice rounded-xl border px-3 py-2 text-left ${preferences.browseSoundStyle === id ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.18)]' : 'border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.48)]'}`}><strong className="block text-sm">{label}</strong><span className="text-xs text-muted">{note}</span></button>)}</div></fieldset>
    {preferences.browseSoundStyle === 'samples' && <section aria-label="Lounge sample assignments" className="mt-5 rounded-xl border border-[rgb(var(--accent)/0.38)] bg-[rgb(var(--panel)/0.35)] p-4"><h4 className="text-sm font-black">Choose where each sample plays</h4><p className="mt-1 text-xs text-muted">Open a role, click any clip to hear it, then press Use beside the one you want. Closing the picker keeps your current choice. Only unusually loud clips are turned down; quiet clips are not boosted.</p><div className="mt-4 grid gap-4">{Object.entries(LOUNGE_SAMPLE_ROLES).map(([role, label]) => <div key={role}><span className="block text-xs font-bold">{label}</span><div className="mt-1 flex gap-2"><button id={`lounge-sample-${role}`} type="button" onClick={() => setPickerRole(role)} className="lounge-setting-choice min-w-0 flex-1 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-2 text-left text-sm text-ink"><span className="block truncate">{preferences.loungeSamples[role] === 'off' ? 'Off' : preferences.loungeSamples[role]}</span><span className="block text-[10px] text-muted">Choose or preview sounds</span></button><button type="button" data-lounge-sound-preview disabled={!preferences.browseSoundEnabled || !soundsEnabled || preferences.browseSoundVolume === 0 || (role === 'move' && preferences.browseMoveLevel === 0) || preferences.loungeSamples[role] === 'off'} onClick={() => onPreview?.(role)} className="lounge-setting-choice rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-xs font-bold disabled:opacity-40">Play</button></div></div>)}</div></section>}
    {pickerRole && <LoungeSamplePicker role={pickerRole} currentId={preferences.loungeSamples[pickerRole]} canPreview={soundsEnabled && preferences.browseSoundVolume > 0} onPreview={id => onPreview?.(pickerRole, id)} onUse={useSample} onClose={closePicker} />}
    <label className="mt-4 block text-sm font-semibold" htmlFor="lounge-sound-volume">Lounge volume · {preferences.browseSoundVolume}%</label><input id="lounge-sound-volume" type="range" min="0" max="100" step="5" value={preferences.browseSoundVolume} onChange={event => set({ browseSoundVolume: Number(event.target.value) })} className="mt-2 w-full accent-[rgb(var(--accent))]" />
    <label className="mt-4 block text-sm font-semibold" htmlFor="lounge-move-level">Move cue · {preferences.browseMoveLevel}%</label><p className="mt-1 text-xs text-muted">Reduce frequent browsing sounds without quieting OK or Back. Set to 0 for silent movement.</p><input id="lounge-move-level" type="range" min="0" max="100" step="10" value={preferences.browseMoveLevel} onChange={event => set({ browseMoveLevel: Number(event.target.value) })} className="mt-2 w-full accent-[rgb(var(--accent))]" />
    {preferences.browseSoundStyle !== 'samples' && <div className="mt-3 flex flex-wrap gap-2">{[['move', 'Move'], ['confirm', 'OK'], ['back', 'Back']].map(([id, label]) => <button key={id} type="button" data-lounge-sound-preview disabled={!preferences.browseSoundEnabled || !soundsEnabled || preferences.browseSoundVolume === 0 || (id === 'move' && preferences.browseMoveLevel === 0)} onClick={() => onPreview?.(id)} className="lounge-setting-choice rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-sm font-bold disabled:opacity-40">Preview {label}</button>)}</div>}
    {!soundsEnabled && <p className="mt-3 text-xs text-amber-200">App-wide sounds are off in Settings, or Lounge is paused.</p>}
    <fieldset className="mt-6 border-t border-[rgb(var(--border)/0.7)] pt-5"><legend className="flex items-center gap-2 text-sm font-black"><Music2 size={18} className="text-[rgb(var(--accent-2))]" /> Background ambience or music</legend><p className="mt-1 text-xs text-muted">Choose one of the four supplied tracks or your own MP3. Off by default; plays only while Lounge is active and focused.</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{LOUNGE_AMBIENCE_TRACKS.map(track => <button key={track.id} type="button" aria-pressed={preferences.ambienceTrack === track.id} onClick={() => set({ ambienceTrack: track.id })} className={`lounge-setting-choice min-h-11 rounded-xl border px-3 py-2 text-left text-sm font-bold ${preferences.ambienceTrack === track.id ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.18)]' : 'border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.48)]'}`}>{track.label}</button>)}{preferences.ambienceCustomUrl && <button type="button" aria-pressed={preferences.ambienceTrack === 'custom'} onClick={() => set({ ambienceTrack: 'custom' })} className={`lounge-setting-choice min-h-11 rounded-xl border px-3 py-2 text-left text-sm font-bold ${preferences.ambienceTrack === 'custom' ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.18)]' : 'border-[rgb(var(--border))] bg-[rgb(var(--panel)/0.48)]'}`}>My audio</button>}</div><button type="button" onClick={importAudio} className="lounge-setting-choice mt-3 min-h-11 rounded-xl border border-[rgb(var(--accent)/0.6)] bg-[rgb(var(--accent)/0.1)] px-4 py-2 text-sm font-bold">{preferences.ambienceCustomUrl ? 'Replace my audio…' : 'Import my MP3…'}</button><p className="mt-1 text-xs text-muted">NEO-LIB saves a private copy; moving the original will not break Lounge.</p>{importError && <p role="alert" className="mt-2 text-xs text-rose-300">{importError}</p>}
      <label className="mt-4 block text-sm font-semibold" htmlFor="lounge-ambience-volume">Ambience volume · {preferences.ambienceVolume}%</label><input id="lounge-ambience-volume" type="range" min="0" max="100" step="5" value={preferences.ambienceVolume} onChange={event => set({ ambienceVolume: Number(event.target.value) })} className="mt-2 w-full accent-[rgb(var(--accent))]" />
      {ambienceError && <div role="alert" className="mt-3 flex flex-wrap items-center gap-2 text-xs text-amber-200"><span>{ambienceError}</span><button type="button" data-lounge-sound-preview onClick={onRetryAmbience} className="lounge-setting-choice rounded-md border border-amber-200/40 px-2 py-1 font-bold">Retry playback</button></div>}
    </fieldset>
  </section>;
}
