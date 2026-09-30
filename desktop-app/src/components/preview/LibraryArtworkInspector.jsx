import React from 'react';
import { Image as ImageIcon, RotateCcw, Upload } from 'lucide-react';

/** Inspect and tune the per-game hero artwork without leaving Library. */
export default function LibraryArtworkInspector({
  options = [], activeUrl = '', activeSource = 'Unknown source', dimensions,
  fitLabel = 'Loading artwork…', focalPoint = { x: 50, y: 42 },
  motion = 55, onUse, onPick, onFocalChange, onMotionChange, onReset,
}) {
  const canPick = typeof window !== 'undefined' && !!window.api?.pickImage;
  const [pickError, setPickError] = React.useState('');
  const [measuredDimensions, setMeasuredDimensions] = React.useState(null);
  React.useEffect(() => {
    if (dimensions || !activeUrl) return undefined;
    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      if (!cancelled && image.naturalWidth && image.naturalHeight) {
        setMeasuredDimensions({ src: activeUrl, width: image.naturalWidth, height: image.naturalHeight });
      }
    };
    image.onerror = () => { if (!cancelled) setMeasuredDimensions(null); };
    image.src = activeUrl;
    return () => { cancelled = true; };
  }, [activeUrl, dimensions]);
  const shownDimensions = dimensions || (measuredDimensions?.src === activeUrl ? measuredDimensions : null);
  const pickArtwork = async () => {
    setPickError('');
    try {
      const result = await window.api.pickImage();
      if (result?.url) onPick?.(result.url);
    } catch { setPickError('Could not open the image picker.'); }
  };

  return <details className="group rounded-xl border border-[rgb(var(--border)/0.56)] bg-[rgb(var(--surface)/0.26)]" data-testid="library-artwork-inspector">
    <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-xs font-bold text-ink [&::-webkit-details-marker]:hidden">
      <ImageIcon size={14} className="text-[rgb(var(--accent-2))]" />
      Artwork fit
      <span className="ml-auto max-w-[55%] truncate text-[10px] font-medium text-muted">{activeSource}{shownDimensions ? ` · ${shownDimensions.width} × ${shownDimensions.height}` : ''}</span>
      <span className="text-muted transition-transform group-open:rotate-180" aria-hidden="true">⌄</span>
    </summary>
    <div className="grid gap-3 border-t border-[rgb(var(--border)/0.42)] p-3 lg:grid-cols-[190px_minmax(0,1fr)]">
      <div className="min-w-0">
        <div className="relative aspect-video overflow-hidden rounded-lg border border-[rgb(var(--border)/0.5)] bg-[rgb(var(--surface)/0.5)]">
          {activeUrl ? <img src={activeUrl} alt="Current hero artwork" className="h-full w-full object-cover" style={{ objectPosition: `${focalPoint.x}% ${focalPoint.y}%` }} /> : <div className="grid h-full place-items-center text-muted"><ImageIcon size={24} /></div>}
        </div>
        <p className="mt-2 text-[10px] font-semibold text-ink">{activeSource}</p>
        <p className="mt-0.5 text-[10px] text-muted">{shownDimensions ? `${shownDimensions.width} × ${shownDimensions.height} px` : activeUrl ? 'Reading image dimensions…' : 'No active artwork'} · {fitLabel}</p>
        {canPick && <button type="button" onClick={pickArtwork} className="mt-2 inline-flex items-center gap-1.5 rounded-md hairline px-2.5 py-1.5 text-[10px] font-semibold text-muted hover:border-[rgb(var(--accent)/0.6)] hover:text-ink"><Upload size={11} /> Choose image file</button>}
        {pickError && <p role="alert" className="mt-1 text-[10px] text-red-300">{pickError}</p>}
      </div>
      <div className="min-w-0 space-y-3">
        <p className="text-[10px] leading-relaxed text-muted">Choose another image or animation already attached to this game, or set a custom image/video file. GIF artwork animates; MP4, M4V, WebM, MOV and OGV videos play muted and loop. Choices and framing are saved for this game only.</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
          {options.map((option) => <ArtworkOption key={option.url} option={option} active={option.url === activeUrl} onUse={onUse} />)}
          {!options.length && <p className="col-span-full rounded-lg border border-dashed border-[rgb(var(--border)/0.6)] p-3 text-[10px] text-muted">No artwork candidates are available yet. Choose an image file above.</p>}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <FocalSlider label="Horizontal framing" value={focalPoint.x} onChange={(x) => onFocalChange?.({ ...focalPoint, x })} />
          <FocalSlider label="Vertical framing" value={focalPoint.y} onChange={(y) => onFocalChange?.({ ...focalPoint, y })} />
        </div>
        <FocalSlider label="Living motion · drift and mini-zooms" value={motion} onChange={onMotionChange} />
        <button type="button" onClick={onReset} className="inline-flex items-center gap-1.5 rounded-md px-1 py-1 text-[10px] font-semibold text-muted hover:text-ink"><RotateCcw size={11} /> Restore automatic artwork and framing</button>
      </div>
    </div>
  </details>;
}

function ArtworkOption({ option, active, onUse }) {
  const [size, setSize] = React.useState('');
  return <button type="button" onClick={() => onUse?.(option.url)} aria-pressed={active} title={`${option.source}${size ? ` · ${size} px` : ''}`} className={`min-w-0 overflow-hidden rounded-lg border text-left transition-colors ${active ? 'border-[rgb(var(--accent-2)/0.9)] bg-[rgb(var(--accent-2)/0.12)]' : 'border-[rgb(var(--border)/0.48)] bg-[rgb(var(--surface)/0.25)] hover:border-[rgb(var(--accent)/0.7)]'}`}>
    <div className="aspect-video overflow-hidden bg-[rgb(var(--surface)/0.4)]"><img src={option.url} alt="" loading="lazy" onLoad={(event) => setSize(`${event.currentTarget.naturalWidth} × ${event.currentTarget.naturalHeight}`)} className="h-full w-full object-cover" /></div>
    <span className="block truncate px-2 pt-1.5 text-[9px] font-semibold text-ink">{option.source}</span>
    <span className="block min-h-4 truncate px-2 pb-1.5 text-[8px] text-muted">{size ? `${size} px` : 'Reading size…'}</span>
  </button>;
}

function FocalSlider({ label, value, onChange }) {
  return <label className="block rounded-lg border border-[rgb(var(--border)/0.45)] px-2.5 py-2">
    <span className="flex justify-between gap-2 text-[10px] font-semibold text-ink"><span>{label}</span><span className="text-muted">{Math.round(value)}%</span></span>
    <input aria-label={label} type="range" min="0" max="100" value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-1.5 w-full accent-[rgb(var(--accent))]" />
  </label>;
}
