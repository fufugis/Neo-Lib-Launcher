import React from 'react';
import { Check } from 'lucide-react';
import { releaseSections } from './release-history-model.mjs';

export default function ChangelogReleaseNotes({ entry }) {
  return <section data-testid={`changelog-entry-${entry.version}`}>
    <p className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--accent-2))]">{entry.unreleased ? 'Not released yet' : `Version ${entry.version}`}</p>
    <h4 className="mt-2 text-xl font-bold text-ink">{entry.title}</h4>
    {entry.unreleased && <p className="mt-2 text-xs text-muted">These additions are being prepared. They are not part of an installed release yet.</p>}
    {releaseSections(entry).map((section, index) => <div key={section.title || index} className="mt-5">
      {section.title && <h5 className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[rgb(var(--accent-2))]">{section.title}</h5>}
      <ul className="space-y-3">{section.items.map((item, i) => <li key={i} className="flex items-start gap-2 text-[12.5px] leading-relaxed text-ink/90"><Check size={12} className="mt-1 shrink-0 text-[rgb(var(--accent))]" aria-hidden="true" />{typeof item === 'object' ? <span><strong className="text-ink">{item.title}</strong> — {item.body}</span> : <span>{item}</span>}</li>)}</ul>
    </div>)}
  </section>;
}
