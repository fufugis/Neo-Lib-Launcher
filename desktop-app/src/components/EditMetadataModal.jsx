import React from 'react';
import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import { Check, GripVertical, Image as ImageIcon, Plus, RefreshCw, Save, Trash2, Upload, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { JOURNEY_STATUSES, normalizeJourneyStatus } from '../lib/game-journey-model.mjs';
import { LAUNCH_ROUTE_KINDS, normalizeLaunchRoutes, primaryLaunchRoute } from '../lib/game-launch-routes-model.mjs';
import { GAME_SIGNAL_DEFINITIONS, gameSignals } from '../lib/game-signals-model.mjs';

const isElectron = typeof window !== 'undefined' && !!window.api;
const TABS = [
  ['overview', 'Overview'],
  ['artwork', 'Artwork'],
  ['play', 'Play & routes'],
  ['library', 'Library'],
  ['signals', 'Signals'],
  ['advanced', 'Advanced'],
];
const CONTENT_SIGNALS = GAME_SIGNAL_DEFINITIONS.filter(({ group }) => group === 'content');

/**
 * Game Workshop is the single source of truth for a game’s player-managed
 * details. It preserves the former metadata fields while arranging them into
 * focused sections and only stores typed, bounded route/status data.
 */
export default function EditMetadataModal({ open, game, onClose, onSave }) {
  const [form, setForm] = React.useState(() => emptyForm(game));
  const [tab, setTab] = React.useState('overview');
  const dragControls = useDragControls();
  const dragBoundsRef = React.useRef(null);

  React.useEffect(() => {
    if (!open || !game) return;
    setForm(emptyForm(game));
    setTab('overview');
  }, [open, game?.id]);

  if (!open || !game) return null;

  const set = (key, value) => setForm((previous) => ({ ...previous, [key]: value }));

  const pickImageFor = async (field) => {
    if (!isElectron || !window.api?.pickImage) return;
    const result = await window.api.pickImage();
    if (result?.url) set(field, result.url);
  };

  const pickExeFor = async () => {
    if (!isElectron || !window.api?.pickExe) return;
    const result = await window.api.pickExe();
    const picked = typeof result === 'string' ? result : result?.exePath;
    if (picked) set('exePath', picked);
  };

  const submit = () => {
    const launchRoutes = normalizeLaunchRoutes(form.launchRoutes);
    const primaryRoute = primaryLaunchRoute(launchRoutes);
    const primaryLaunchPatch = primaryRoute?.targetType === 'executable' && primaryRoute.target
      ? { exePath: primaryRoute.target, launchArgs: primaryRoute.arguments }
      : {
        ...(form.exePath.trim() ? { exePath: form.exePath.trim() } : {}),
        ...(form.launchArgs !== (game.launchArgs || '') ? { launchArgs: form.launchArgs } : {}),
      };
    onSave({
      name: form.name.trim() || game.name,
      icon: form.icon.trim() || null,
      coverUrl: form.coverUrl.trim() || null,
      portraitImage: form.coverUrl.trim() || null,
      headerImage: form.headerImage.trim() || null,
      background: form.background.trim() || null,
      logo: form.logo.trim() || null,
      shortDescription: form.shortDescription.trim(),
      about: form.about.trim(),
      genres: splitList(form.genres),
      developers: splitList(form.developers),
      publishers: splitList(form.publishers),
      releaseDate: form.releaseDate.trim(),
      website: form.website.trim(),
      metacritic: form.metacritic ? Number(form.metacritic) || null : null,
      screenshots: splitLines(form.screenshots),
      journeyStatus: normalizeJourneyStatus(form.journeyStatus),
      playerNotes: form.playerNotes.trim(),
      contentFlags: normalizeContentFlags(form.contentFlags),
      launchRoutes,
      installedVersion: form.installedVersion.trim(),
      updateWatchUrl: form.updateWatchUrl.trim(),
      manualOverride: true,
      source: 'manual',
      ...primaryLaunchPatch,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={dragBoundsRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[210] grid place-items-center bg-black/60 backdrop-blur-sm"
        onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.(); }}
        data-testid="game-workshop-overlay"
      >
        <motion.div
          drag
          dragControls={dragControls}
          dragListener={false}
          dragMomentum={false}
          dragElastic={0}
          dragConstraints={dragBoundsRef}
          initial={{ y: 12, opacity: 0, scale: 0.97 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 12, opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
          className="relative flex max-h-[90vh] w-[min(920px,95vw)] flex-col overflow-hidden rounded-xl hairline glass shadow-2xl"
          data-testid="game-workshop-modal"
        >
          <div
            onPointerDown={(event) => dragControls.start(event)}
            className="flex cursor-move items-center justify-between border-b border-[rgb(var(--border))]/60 px-5 py-3 select-none"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <GripVertical size={14} className="shrink-0 text-muted" />
                <h3 className="truncate font-display text-sm font-bold uppercase tracking-[0.18em]">Game Workshop</h3>
              </div>
              <p className="ml-5 mt-0.5 truncate text-[10px] text-muted">{game.name} · local edits stay in your Library</p>
            </div>
            <button data-testid="game-workshop-close" onClick={onClose} className="grid h-7 w-7 place-items-center rounded text-muted hover:bg-panel hover:text-ink">
              <X size={14} />
            </button>
          </div>

          <div className="flex gap-1 overflow-x-auto border-b border-[rgb(var(--border))]/60 px-3 py-2" role="tablist" aria-label="Game Workshop sections">
            {TABS.map(([id, label]) => (
              <button
                key={id}
                role="tab"
                aria-selected={tab === id}
                data-testid={`game-workshop-tab-${id}`}
                onClick={() => setTab(id)}
                className={cn(
                  'shrink-0 rounded-md px-3 py-1.5 text-[10px] font-bold transition-colors',
                  tab === id ? 'bg-[rgb(var(--accent)/0.20)] text-ink hairline' : 'text-muted hover:bg-panel/70 hover:text-ink',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            {tab === 'overview' && <Overview form={form} set={set} />}
            {tab === 'artwork' && <Artwork form={form} set={set} onPick={pickImageFor} />}
            {tab === 'play' && <PlayRoutes form={form} set={set} onPickExe={pickExeFor} />}
            {tab === 'library' && <LibraryForm form={form} set={set} game={game} />}
            {tab === 'signals' && <Signals form={form} set={set} game={game} />}
            {tab === 'advanced' && <Advanced form={form} set={set} game={game} />}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[rgb(var(--border))]/60 bg-panel/80 px-5 py-3 backdrop-blur">
            <span className="text-[10px] text-muted">Changes apply only when you choose Save.</span>
            <div className="flex items-center gap-2">
              <button data-testid="game-workshop-cancel" onClick={onClose} className="rounded-md hairline px-3 py-2 text-xs text-muted hover:border-[rgb(var(--accent)/0.5)] hover:text-ink">Cancel</button>
              <button data-testid="game-workshop-save" onClick={submit} className="inline-flex items-center gap-1.5 rounded-md bg-[rgb(var(--accent))] px-4 py-2 text-xs font-bold text-[rgb(var(--surface))] shadow-[0_0_14px_-2px_rgb(var(--accent)/0.7)] hover:brightness-110">
                <Save size={13} /> Save game
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Overview({ form, set }) {
  return <div className="space-y-3">
    <Section title="Identity" description="Player-visible facts and store metadata.">
      <Field label="Name"><input data-testid="meta-name-input" value={form.name} onChange={(event) => set('name', event.target.value)} className={inputCls} /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Release date"><input value={form.releaseDate} onChange={(event) => set('releaseDate', event.target.value)} placeholder="2024-08-12" className={inputCls} /></Field>
        <Field label="Metacritic (0–100)"><input type="number" min={0} max={100} value={form.metacritic} onChange={(event) => set('metacritic', event.target.value)} className={inputCls} /></Field>
      </div>
      <Field label="Genres (comma-separated)"><input value={form.genres} onChange={(event) => set('genres', event.target.value)} placeholder="Action, Roguelike, Indie" className={inputCls} /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Developers"><input value={form.developers} onChange={(event) => set('developers', event.target.value)} className={inputCls} /></Field>
        <Field label="Publishers"><input value={form.publishers} onChange={(event) => set('publishers', event.target.value)} className={inputCls} /></Field>
      </div>
      <Field label="Website"><input value={form.website} onChange={(event) => set('website', event.target.value)} placeholder="https://…" className={inputCls} /></Field>
    </Section>
    <Section title="Story" description="Manual writing stays yours; reviewed refreshes remain separate.">
      <Field label="Short description"><input value={form.shortDescription} onChange={(event) => set('shortDescription', event.target.value)} className={inputCls} /></Field>
      <Field label="About / description"><textarea value={form.about} onChange={(event) => set('about', event.target.value)} rows={7} className={cn(inputCls, 'h-auto resize-y py-2')} /></Field>
    </Section>
  </div>;
}

function Artwork({ form, set, onPick }) {
  return <div className="space-y-4">
    <Section title="Artwork" description="Choose local files or paste a URL. Artwork Workshop comparisons come next.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ImageSlot label="Icon" value={form.icon} onChange={(value) => set('icon', value)} onPick={() => onPick('icon')} aspect="1/1" />
        <ImageSlot label="Cover" value={form.coverUrl} onChange={(value) => set('coverUrl', value)} onPick={() => onPick('coverUrl')} aspect="3/4" />
        <ImageSlot label="Hero / header" value={form.headerImage} onChange={(value) => set('headerImage', value)} onPick={() => onPick('headerImage')} aspect="16/9" />
        <ImageSlot label="Background" value={form.background} onChange={(value) => set('background', value)} onPick={() => onPick('background')} aspect="16/9" />
        <ImageSlot label="Logo" value={form.logo} onChange={(value) => set('logo', value)} onPick={() => onPick('logo')} aspect="16/9" />
      </div>
    </Section>
    <Section title="Screenshots" description="One public image URL per line.">
      <Field label="Screenshot URLs"><textarea value={form.screenshots} onChange={(event) => set('screenshots', event.target.value)} rows={5} placeholder={'https://…/shot1.png\nhttps://…/shot2.png'} className={cn(inputCls, 'h-auto resize-y py-2 font-mono text-[11px]')} /></Field>
    </Section>
  </div>;
}

function PlayRoutes({ form, set, onPickExe }) {
  return <div className="space-y-4">
    <Section title="Primary launch" description="This is the normal guarded Play target.">
      <Field label="Executable or launcher target">
        <div className="flex gap-2">
          <input value={form.exePath} onChange={(event) => set('exePath', event.target.value)} placeholder="C:\\Games\\YourGame.exe" className={cn(inputCls, 'flex-1 font-mono text-[11px]')} />
          <button onClick={onPickExe} className="inline-flex items-center gap-1.5 rounded-md hairline px-3 text-[11px] text-muted hover:border-[rgb(var(--accent)/0.5)] hover:text-ink"><Upload size={12} /> Choose…</button>
        </div>
      </Field>
      <Field label="Launch arguments"><input value={form.launchArgs} onChange={(event) => set('launchArgs', event.target.value)} placeholder="--windowed -no-intro" className={cn(inputCls, 'font-mono text-[11px]')} /></Field>
    </Section>
    <Section title="Launch Routes" description="Save up to twelve named game actions. A selected primary executable becomes the normal Play target; additional routes are kept ready for the route picker.">
      <RouteEditor routes={form.launchRoutes} onChange={(routes) => set('launchRoutes', routes)} />
    </Section>
  </div>;
}

function LibraryForm({ form, set, game }) {
  return <div className="space-y-4">
    <Section title="Journey Status" description="Your relationship with this game. First tracked Play changes Not started or Backlog to In progress.">
      <Field label="Status">
        <select value={form.journeyStatus} onChange={(event) => set('journeyStatus', event.target.value)} className={inputCls}>
          {JOURNEY_STATUSES.map((status) => <option key={status.id} value={status.id}>{status.label}</option>)}
        </select>
      </Field>
      <Field label="Personal notes"><textarea value={form.playerNotes} onChange={(event) => set('playerNotes', event.target.value)} rows={6} placeholder="Your spoiler-free note, build idea, or next objective…" className={cn(inputCls, 'h-auto resize-y py-2')} /></Field>
    </Section>
    <Section title="Existing library placement" description="Categories, favorites, private shelves and ratings retain their current dedicated controls.">
      <div className="grid gap-2 text-xs text-muted sm:grid-cols-3">
        <Fact label="Categories" value={Array.isArray(game.categoryIds) && game.categoryIds.length ? `${game.categoryIds.length} assigned` : 'Uncategorized'} />
        <Fact label="Personal rating" value={Number.isFinite(Number(game.rating)) ? `${Number(game.rating).toFixed(1)} / 5` : 'Not rated'} />
        <Fact label="Source" value={game.launcher || game.source || 'Local library'} />
      </div>
    </Section>
  </div>;
}

function Signals({ form, set, game }) {
  const signals = gameSignals({ ...game, contentFlags: form.contentFlags });
  return <div className="space-y-4">
    <Section title="Game Signals" description="Feature signals remain evidence-led. Sensitive content signals only appear when explicitly stored.">
      <div className="flex flex-wrap gap-2">
        {signals.length ? signals.map((signal) => <span key={signal.id} className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface)/0.42)] px-2.5 py-1 text-[10px] text-ink" title={signal.detail || `Source: ${signal.source}`}>{signal.label} <span className="text-muted">· {signal.source}</span></span>) : <p className="text-xs text-muted">No source-declared signals yet.</p>}
      </div>
    </Section>
    <Section title="Explicit content flags" description="These never inspect descriptions, names, artwork or AI text. Mark only what you deliberately know.">
      <div className="grid gap-2 sm:grid-cols-2">
        {CONTENT_SIGNALS.map((signal) => {
          const checked = hasContentFlag(form.contentFlags, signal.id);
          return <label key={signal.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-[rgb(var(--border)/0.72)] bg-[rgb(var(--surface)/0.20)] px-3 py-2 text-xs text-muted hover:border-[rgb(var(--accent)/0.42)]">
            <input type="checkbox" checked={checked} onChange={() => set('contentFlags', toggleContentFlag(form.contentFlags, signal.id))} />
            <span className={checked ? 'text-ink' : ''}>{signal.label}</span>
          </label>;
        })}
      </div>
    </Section>
  </div>;
}

function Advanced({ form, set, game }) {
  return <div className="space-y-4">
    <Section title="Independent update watch" description="NEO-LIB only reads explicit public version labels; it never downloads or installs files.">
      <div className="grid gap-3 sm:grid-cols-[0.8fr_1.2fr]">
        <Field label="Installed version"><input value={form.installedVersion} onChange={(event) => set('installedVersion', event.target.value)} placeholder="e.g. 0.14.2" className={inputCls} /></Field>
        <Field label="Update watch page"><input value={form.updateWatchUrl} onChange={(event) => set('updateWatchUrl', event.target.value)} placeholder="Official page, itch.io, or public forum thread" className={inputCls} /></Field>
      </div>
    </Section>
    <Section title="Stored source information" description="Read-only identity kept for troubleshooting and reviewed refreshes.">
      <div className="grid gap-2 text-xs text-muted sm:grid-cols-2">
        <Fact label="Library source" value={game.source || 'Local library'} />
        <Fact label="Launcher" value={game.launcher || 'Standalone'} />
        <Fact label="Game ID" value={game.appid || game.productId || game.id || 'Not available'} mono />
        <Fact label="Manual override" value={game.manualOverride ? 'Enabled' : 'Not enabled'} />
      </div>
    </Section>
  </div>;
}

function RouteEditor({ routes, onChange }) {
  const list = Array.isArray(routes) ? routes : [];
  const update = (index, patch) => onChange(list.map((route, routeIndex) => routeIndex === index ? { ...route, ...patch } : route));
  const makePrimary = (index) => onChange(list.map((route, routeIndex) => ({ ...route, primary: routeIndex === index })));
  const remove = (index) => onChange(list.filter((_, routeIndex) => routeIndex !== index));
  const add = () => {
    if (list.length >= 12) return;
    onChange([...list, {
      id: `route-${Date.now()}`,
      label: 'New action',
      kind: 'utility',
      targetType: 'executable',
      target: '',
      arguments: '',
      workingDirectory: '',
      enabled: true,
      primary: list.length === 0,
    }]);
  };
  return <div className="space-y-3">
    {list.map((route, index) => <div key={route.id || index} className="rounded-lg border border-[rgb(var(--border)/0.72)] bg-[rgb(var(--surface)/0.20)] p-3">
      <div className="flex flex-wrap items-center gap-2">
        <input value={route.label || ''} onChange={(event) => update(index, { label: event.target.value })} aria-label="Route label" placeholder="Action name" className={cn(inputCls, 'min-w-[150px] flex-1')} />
        <select value={route.kind || 'utility'} onChange={(event) => update(index, { kind: event.target.value })} aria-label="Route kind" className={cn(inputCls, 'w-auto')}>
          {LAUNCH_ROUTE_KINDS.map((kind) => <option key={kind.id} value={kind.id}>{kind.label}</option>)}
        </select>
        <button onClick={() => makePrimary(index)} className={cn('rounded-md border px-2 py-1.5 text-[10px] font-bold', route.primary ? 'border-[rgb(var(--accent)/0.7)] bg-[rgb(var(--accent)/0.15)] text-ink' : 'border-[rgb(var(--border))] text-muted hover:text-ink')} title="Use as normal Play target">{route.primary ? <><Check size={11} className="mr-1 inline" /> Primary</> : 'Make primary'}</button>
        <button onClick={() => remove(index)} className="grid h-7 w-7 place-items-center rounded text-muted hover:bg-red-400/10 hover:text-red-300" title="Remove route"><Trash2 size={13} /></button>
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_150px]">
        <input value={route.target || ''} onChange={(event) => update(index, { target: event.target.value })} aria-label="Route target" placeholder="Executable or launcher target" className={cn(inputCls, 'font-mono text-[11px]')} />
        <input value={route.arguments || ''} onChange={(event) => update(index, { arguments: event.target.value })} aria-label="Route arguments" placeholder="Arguments" className={cn(inputCls, 'font-mono text-[11px]')} />
      </div>
    </div>)}
    <button data-testid="game-workshop-add-route" onClick={add} disabled={list.length >= 12} className="inline-flex items-center gap-1.5 rounded-md hairline px-3 py-2 text-xs text-muted hover:border-[rgb(var(--accent)/0.5)] hover:text-ink disabled:opacity-50"><Plus size={13} /> Add route</button>
  </div>;
}

function Section({ title, description, children }) {
  return <section className="rounded-xl border border-[rgb(var(--border)/0.72)] bg-[rgb(var(--surface)/0.18)] p-4">
    <div className="mb-3"><h4 className="text-xs font-bold uppercase tracking-[0.14em] text-ink">{title}</h4><p className="mt-1 text-[10px] leading-relaxed text-muted">{description}</p></div>
    <div className="space-y-3">{children}</div>
  </section>;
}

function Field({ label, children }) {
  return <label className="block"><span className="mb-1 block text-[10px] uppercase tracking-wider text-muted">{label}</span>{children}</label>;
}

function Fact({ label, value, mono = false }) {
  return <div className="rounded-md border border-[rgb(var(--border)/0.55)] bg-panel/30 px-2.5 py-2"><span className="block text-[9px] uppercase tracking-wider text-muted">{label}</span><span className={cn('mt-0.5 block truncate text-[11px] text-ink', mono && 'font-mono')} title={String(value)}>{value}</span></div>;
}

function ImageSlot({ label, value, onChange, onPick, aspect = '1/1' }) {
  return <div className="space-y-1.5">
    <span className="block text-[10px] uppercase tracking-wider text-muted">{label}</span>
    <div className="relative overflow-hidden rounded-md hairline bg-surface/60" style={{ aspectRatio: aspect }}>
      {value ? <img src={value} alt={`${label} preview`} className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-muted/50"><ImageIcon size={20} /></div>}
    </div>
    <div className="flex gap-1">
      <button onClick={onPick} className="inline-flex flex-1 items-center justify-center gap-1 rounded-md hairline px-1 py-1.5 text-[10px] text-muted hover:border-[rgb(var(--accent)/0.5)] hover:text-ink"><Upload size={10} /> File</button>
      {value && <button onClick={() => onChange('')} className="grid w-7 place-items-center rounded-md hairline text-muted hover:border-red-400/40 hover:text-red-400" title="Clear"><RefreshCw size={10} /></button>}
    </div>
    <input value={value} onChange={(event) => onChange(event.target.value)} placeholder="…or paste URL" className="w-full rounded-md bg-panel/40 hairline px-2 py-1.5 text-[10px] text-muted/90 focus:border-[rgb(var(--accent)/0.6)] focus:outline-none focus:text-ink" />
  </div>;
}

const inputCls = 'w-full rounded-md bg-panel/60 hairline px-3 py-2 text-xs text-ink placeholder:text-muted/70 focus:border-[rgb(var(--accent)/0.6)] focus:outline-none';

function emptyForm(game) {
  if (!game) return {};
  return {
    name: game.name || '',
    icon: game.icon || '',
    coverUrl: game.coverUrl || game.portraitImage || '',
    headerImage: game.headerImage || game.hero || '',
    background: game.background || '',
    logo: game.logo || '',
    shortDescription: game.shortDescription || '',
    about: game.about || '',
    genres: (game.genres || []).join(', '),
    developers: (game.developers || []).join(', '),
    publishers: (game.publishers || []).join(', '),
    releaseDate: game.releaseDate || '',
    website: game.website || '',
    metacritic: game.metacritic ?? '',
    screenshots: (game.screenshots || []).join('\n'),
    exePath: game.exePath || '',
    launchArgs: game.launchArgs || '',
    launchRoutes: normalizeLaunchRoutes(game.launchRoutes || []),
    journeyStatus: normalizeJourneyStatus(game.journeyStatus),
    playerNotes: game.playerNotes || '',
    contentFlags: normalizeContentFlags(game.contentFlags),
    installedVersion: game.installedVersion || '',
    updateWatchUrl: game.updateWatchUrl || '',
  };
}

function splitList(value) {
  return String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
}

function splitLines(value) {
  return String(value || '').split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
}

function normalizeContentFlags(flags) {
  const allowed = new Set(CONTENT_SIGNALS.map(({ id }) => id));
  const seen = new Set();
  return (Array.isArray(flags) ? flags : []).flatMap((flag) => {
    const id = typeof flag === 'string' ? flag : flag?.id;
    if (!allowed.has(id) || seen.has(id)) return [];
    seen.add(id);
    return [{ id, source: typeof flag === 'object' && flag?.source ? String(flag.source).slice(0, 80) : 'Player' }];
  });
}

function hasContentFlag(flags, id) {
  return normalizeContentFlags(flags).some((flag) => flag.id === id);
}

function toggleContentFlag(flags, id) {
  const current = normalizeContentFlags(flags);
  return hasContentFlag(current, id)
    ? current.filter((flag) => flag.id !== id)
    : [...current, { id, source: 'Player' }];
}
