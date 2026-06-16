import React from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { Save, Image as ImageIcon, X, GripVertical, Upload, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';

const isElectron = typeof window !== 'undefined' && !!window.api;

/**
 * EditMetadataModal — manual override for game metadata. Critical for itch.io / indie
 * games where Steam / Epic / GOG can't match. Lets the user edit:
 *   - Name
 *   - Icon (file picker -> file:// URL, or paste URL)
 *   - Cover (capsule) image — URL or file picker
 *   - Hero / header image — URL or file picker
 *   - Description (about + shortDescription combined)
 *   - Genres (comma-separated)
 *   - Developers / Publishers / Release date / Website / Metacritic
 *   - Screenshots (one URL per line)
 *
 * On save, calls `onSave(patch)` with only changed fields.
 */
export default function EditMetadataModal({ open, game, onClose, onSave }) {
  const [form, setForm] = React.useState(() => emptyForm(game));
  const dragControls = useDragControls();

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open && game) setForm(emptyForm(game));
  }, [open, game?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open || !game) return null;

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const pickImageFor = async (field) => {
    if (!isElectron || !window.api?.pickImage) return;
    const r = await window.api.pickImage();
    if (r?.url) set(field, r.url);
  };

  const submit = () => {
    const patch = {
      name: form.name.trim() || game.name,
      icon: form.icon.trim() || null,
      coverUrl: form.coverUrl.trim() || null,
      headerImage: form.headerImage.trim() || null,
      background: form.background.trim() || null,
      shortDescription: form.shortDescription.trim(),
      about: form.about.trim(),
      genres: splitList(form.genres),
      developers: splitList(form.developers),
      publishers: splitList(form.publishers),
      releaseDate: form.releaseDate.trim(),
      website: form.website.trim(),
      metacritic: form.metacritic ? Number(form.metacritic) || null : null,
      screenshots: splitLines(form.screenshots),
      // Mark as manually edited so future "Refresh all" / silent refetch doesn't overwrite
      manualOverride: true,
      source: 'manual',
    };
    onSave(patch);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[210] grid place-items-center bg-black/60 backdrop-blur-sm"
        onDoubleClick={onClose}
        data-testid="edit-metadata-overlay"
      >
        <motion.div
          drag
          dragControls={dragControls}
          dragListener={false}
          dragMomentum={false}
          dragElastic={0}
          initial={{ y: 12, opacity: 0, scale: 0.97 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 12, opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-[min(820px,94vw)] max-h-[90vh] overflow-y-auto rounded-xl hairline glass shadow-2xl"
          data-testid="edit-metadata-modal"
        >
          {/* Drag handle / header */}
          <div
            onPointerDown={(e) => dragControls.start(e)}
            className="cursor-move flex items-center justify-between px-5 py-3 border-b border-[rgb(var(--border))]/60 select-none"
          >
            <div className="flex items-center gap-2">
              <GripVertical size={14} className="text-muted" />
              <h3 className="font-display font-bold tracking-[0.18em] text-sm uppercase">
                Edit metadata · {game.name}
              </h3>
            </div>
            <button
              data-testid="edit-meta-close"
              onClick={onClose}
              className="grid h-7 w-7 place-items-center rounded text-muted hover:text-ink hover:bg-panel"
            >
              <X size={14} />
            </button>
          </div>

          <div className="grid gap-4 p-5 md:grid-cols-[180px_1fr]">
            {/* Left column — images preview */}
            <div className="space-y-3">
              <ImageSlot
                label="Icon"
                value={form.icon}
                onChange={(v) => set('icon', v)}
                onPick={() => pickImageFor('icon')}
                aspect="1/1"
                testid="meta-icon"
              />
              <ImageSlot
                label="Cover"
                value={form.coverUrl}
                onChange={(v) => set('coverUrl', v)}
                onPick={() => pickImageFor('coverUrl')}
                aspect="3/4"
                testid="meta-cover"
              />
              <ImageSlot
                label="Hero / header"
                value={form.headerImage}
                onChange={(v) => set('headerImage', v)}
                onPick={() => pickImageFor('headerImage')}
                aspect="16/9"
                testid="meta-header"
              />
              <ImageSlot
                label="Background"
                value={form.background}
                onChange={(v) => set('background', v)}
                onPick={() => pickImageFor('background')}
                aspect="16/9"
                testid="meta-bg"
              />
            </div>

            {/* Right column — text fields */}
            <div className="space-y-3">
              <Field label="Name" testid="meta-name">
                <input
                  data-testid="meta-name-input"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  className={inputCls}
                />
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Release date" testid="meta-release">
                  <input
                    data-testid="meta-release-input"
                    value={form.releaseDate}
                    onChange={(e) => set('releaseDate', e.target.value)}
                    placeholder="e.g. 2024-08-12 or Aug 2024"
                    className={inputCls}
                  />
                </Field>
                <Field label="Metacritic (0–100)" testid="meta-metacritic">
                  <input
                    data-testid="meta-metacritic-input"
                    type="number"
                    min={0}
                    max={100}
                    value={form.metacritic}
                    onChange={(e) => set('metacritic', e.target.value)}
                    className={inputCls}
                  />
                </Field>
              </div>

              <Field label="Genres (comma-separated)" testid="meta-genres">
                <input
                  data-testid="meta-genres-input"
                  value={form.genres}
                  onChange={(e) => set('genres', e.target.value)}
                  placeholder="Action, Roguelike, Indie"
                  className={inputCls}
                />
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Developers" testid="meta-devs">
                  <input
                    data-testid="meta-devs-input"
                    value={form.developers}
                    onChange={(e) => set('developers', e.target.value)}
                    placeholder="Comma-separated"
                    className={inputCls}
                  />
                </Field>
                <Field label="Publishers" testid="meta-pubs">
                  <input
                    data-testid="meta-pubs-input"
                    value={form.publishers}
                    onChange={(e) => set('publishers', e.target.value)}
                    placeholder="Comma-separated"
                    className={inputCls}
                  />
                </Field>
              </div>

              <Field label="Website" testid="meta-website">
                <input
                  data-testid="meta-website-input"
                  value={form.website}
                  onChange={(e) => set('website', e.target.value)}
                  placeholder="https://…"
                  className={inputCls}
                />
              </Field>

              <Field label="Short description (1 line)" testid="meta-shortdesc">
                <input
                  data-testid="meta-shortdesc-input"
                  value={form.shortDescription}
                  onChange={(e) => set('shortDescription', e.target.value)}
                  placeholder="A pixel-art bullet hell built in Pygame…"
                  className={inputCls}
                />
              </Field>

              <Field label="About / description" testid="meta-about">
                <textarea
                  data-testid="meta-about-input"
                  value={form.about}
                  onChange={(e) => set('about', e.target.value)}
                  rows={5}
                  className={cn(inputCls, 'h-auto py-2 resize-y')}
                />
              </Field>

              <Field label="Screenshot URLs (one per line)" testid="meta-shots">
                <textarea
                  data-testid="meta-shots-input"
                  value={form.screenshots}
                  onChange={(e) => set('screenshots', e.target.value)}
                  rows={3}
                  placeholder={'https://…/shot1.png\nhttps://…/shot2.png'}
                  className={cn(inputCls, 'h-auto py-2 font-mono text-[11px] resize-y')}
                />
              </Field>
            </div>
          </div>

          <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-[rgb(var(--border))]/60 bg-panel/80 backdrop-blur px-5 py-3">
            <span className="text-[11px] text-muted">
              Tip: file picker accepts PNG / JPG / WEBP / ICO. Paths are stored locally as <span className="text-ink">file://</span> URLs.
            </span>
            <div className="flex items-center gap-2">
              <button
                data-testid="edit-meta-cancel"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 rounded-md hairline px-3 h-8 text-xs text-muted hover:text-ink hover:border-[rgb(var(--accent)/0.5)]"
              >
                Cancel
              </button>
              <button
                data-testid="edit-meta-save"
                onClick={submit}
                className="inline-flex items-center gap-1.5 rounded-md bg-[rgb(var(--accent))] px-4 h-8 text-xs font-bold text-[rgb(var(--surface))] shadow-[0_0_14px_-2px_rgb(var(--accent)/0.7)] hover:brightness-110"
              >
                <Save size={13} /> Save
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

const inputCls =
  'w-full rounded-md bg-panel/60 hairline px-3 h-8 text-xs text-ink placeholder:text-muted/70 focus:outline-none focus:border-[rgb(var(--accent)/0.6)]';

function Field({ label, children, testid }) {
  return (
    <label className="block" data-testid={testid}>
      <div className="mb-1 text-[10px] uppercase tracking-wider text-muted">{label}</div>
      {children}
    </label>
  );
}

function ImageSlot({ label, value, onChange, onPick, aspect = '1/1', testid }) {
  return (
    <div className="space-y-1" data-testid={testid}>
      <div className="text-[10px] uppercase tracking-wider text-muted">{label}</div>
      <div
        className="relative overflow-hidden rounded-md hairline bg-surface/60"
        style={{ aspectRatio: aspect }}
      >
        {value ? (
          <img src={value} alt={`${label} preview`} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-muted/50">
            <ImageIcon size={20} />
          </div>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onPick}
          className="flex-1 inline-flex items-center justify-center gap-1 rounded-md hairline px-1 h-6 text-[10px] text-muted hover:text-ink hover:border-[rgb(var(--accent)/0.5)] hover:bg-[rgb(var(--accent)/0.08)]"
          title="Pick a local file"
          data-testid={`${testid}-pick`}
        >
          <Upload size={10} /> File
        </button>
        {value && (
          <button
            onClick={() => onChange('')}
            className="grid h-6 w-6 place-items-center rounded-md hairline text-muted hover:text-red-400 hover:border-red-400/40"
            title="Clear"
            data-testid={`${testid}-clear`}
          >
            <RefreshCw size={10} />
          </button>
        )}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="…or paste URL"
        className="w-full rounded-md bg-panel/40 hairline px-2 h-6 text-[10px] text-muted/90 focus:outline-none focus:border-[rgb(var(--accent)/0.6)] focus:text-ink"
        data-testid={`${testid}-url`}
      />
    </div>
  );
}

function emptyForm(g) {
  if (!g) return {};
  return {
    name: g.name || '',
    icon: g.icon || '',
    coverUrl: g.coverUrl || '',
    headerImage: g.headerImage || '',
    background: g.background || '',
    shortDescription: g.shortDescription || '',
    about: g.about || '',
    genres: (g.genres || []).join(', '),
    developers: (g.developers || []).join(', '),
    publishers: (g.publishers || []).join(', '),
    releaseDate: g.releaseDate || '',
    website: g.website || '',
    metacritic: g.metacritic ?? '',
    screenshots: (g.screenshots || []).join('\n'),
  };
}

function splitList(s) {
  return (s || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

function splitLines(s) {
  return (s || '')
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);
}
