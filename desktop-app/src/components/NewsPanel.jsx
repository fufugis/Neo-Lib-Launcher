import React from 'react';
import { Newspaper, Sparkles, MessageCircle } from 'lucide-react';

/**
 * NewsPanel — placeholder for the upcoming News tab.
 *
 * Future scope (planned): fetch news from Steam news RSS + generic web
 * feeds for every game the user owns, filter to items posted in the last
 * 14 days, group by game, present as an infinite scroll feed.
 */
export default function NewsPanel() {
  const openDiscord = () => {
    const url = 'https://discord.gg/spk6QWREk8';
    if (typeof window !== 'undefined' && window.api?.openExternal) window.api.openExternal(url);
    else window.open(url, '_blank');
  };
  return (
    <div className="flex-1 overflow-y-auto p-8" data-testid="news-panel">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div
            className="grid h-12 w-12 place-items-center rounded-full"
            style={{
              backgroundImage: 'linear-gradient(135deg, rgb(var(--accent)) 0%, rgb(var(--accent-2)) 100%)',
              color: 'rgb(var(--surface))',
            }}
          >
            <Newspaper size={22} />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight">News</h2>
            <p className="text-sm text-muted">Fresh updates from the games you own.</p>
          </div>
        </div>

        <div className="rounded-xl hairline bg-panel/40 p-6 space-y-3">
          <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.22em] text-[rgb(var(--accent-2))]">
            <Sparkles size={11} /> Coming soon
          </div>
          <h3 className="font-display text-lg font-bold text-ink">
            NEO-LIB will pull the latest patch notes for every game you own.
          </h3>
          <ul className="space-y-2 text-[13px] text-muted leading-relaxed">
            <li>· Steam news feed for every Steam game in your library</li>
            <li>· GOG announcements &amp; itch.io devlogs</li>
            <li>· Only items from the last <span className="font-mono text-ink">14 days</span> — no ancient noise</li>
            <li>· Grouped by game, sorted by newest, one-click launch</li>
            <li>· Silent refresh in the background so opening this tab is instant</li>
          </ul>
          <div className="pt-3 flex items-center gap-2">
            <button
              onClick={openDiscord}
              data-testid="news-panel-discord"
              className="inline-flex items-center gap-2 rounded-md px-3 h-8 text-[12px] font-bold text-white"
              style={{
                background: 'linear-gradient(135deg, #5865F2 0%, #7289DA 100%)',
                boxShadow: '0 0 10px -3px rgba(88,101,242,0.6)',
              }}
            >
              <MessageCircle size={13} />
              Suggest a feed source
            </button>
            <span className="text-[11px] text-muted">— ping me on Discord if there's a launcher / community you want covered.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
