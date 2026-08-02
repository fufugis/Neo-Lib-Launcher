import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Newspaper, RefreshCw, ExternalLink, MessageCircle, Sparkles,
  Users, Megaphone, Globe2, Filter,
} from 'lucide-react';
import { motion } from 'framer-motion';

const isElectron = typeof window !== 'undefined' && !!window.api;

// feed_type: Steam docs — 0 = official-ish, 1 = external partner site, etc.
// The value is inconsistent across apps, so we group primarily by feedname.
function classifyFeed(item) {
  const fn = (item.feedname || '').toLowerCase();
  const fl = (item.feedlabel || '').toLowerCase();
  if (fn === 'steam_community_announcements' || fl.includes('community announcement')) return 'community';
  if (fn.startsWith('steam_') || fl.includes('steam blog') || fl.includes('press')) return 'official';
  return 'thirdparty';
}

const FEED_META = {
  official:   { label: 'Official',    icon: Megaphone, color: 'rgb(94, 234, 212)' },
  community:  { label: 'Community',   icon: Users,     color: 'rgb(196, 181, 253)' },
  thirdparty: { label: 'Third-party', icon: Globe2,    color: 'rgb(251, 191, 141)' },
};

function timeAgo(ms) {
  const s = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function NewsPanel({ games = [] }) {
  const steamGames = useMemo(
    () => (games || []).filter((g) => g && g.appid && g.source === 'steam'),
    [games]
  );
  const nonSteamCount = (games || []).filter((g) => g && !g.appid).length;

  const [state, setState] = useState({ loading: false, error: '', items: [], fetchedAt: 0 });
  const [enabledFeeds, setEnabledFeeds] = useState({ official: true, community: true, thirdparty: true });
  const fetchedOnce = useRef(false);

  const openExternal = (url) => {
    if (!url) return;
    if (isElectron) window.api.openExternal(url); else window.open(url, '_blank');
  };

  const load = async (force = false) => {
    if (!isElectron || !steamGames.length) return;
    setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      const res = await window.api.fetchSteamNews({
        games: steamGames.map((g) => ({ appid: g.appid, name: g.name, id: g.id })),
        days: 14,
        force,
      });
      if (!res?.ok) throw new Error(res?.error || 'Failed to load news');
      setState({ loading: false, error: '', items: res.items || [], fetchedAt: res.fetchedAt || Date.now() });
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: String(e.message || e) }));
    }
  };

  useEffect(() => {
    if (fetchedOnce.current) return;
    if (!steamGames.length) return;
    fetchedOnce.current = true;
    load(false);
  }, [steamGames.length]);

  const filtered = useMemo(
    () => state.items.filter((it) => enabledFeeds[classifyFeed(it)]),
    [state.items, enabledFeeds]
  );

  const feedCounts = useMemo(() => {
    const c = { official: 0, community: 0, thirdparty: 0 };
    for (const it of state.items) c[classifyFeed(it)] += 1;
    return c;
  }, [state.items]);

  return (
    <div className="flex-1 overflow-y-auto" data-testid="news-panel">
      <div className="mx-auto max-w-3xl p-6 md:p-8">
        {/* Header */}
        <div className="mb-6 flex items-start gap-3">
          <div
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full"
            style={{
              backgroundImage: 'linear-gradient(135deg, rgb(var(--accent)) 0%, rgb(var(--accent-2)) 100%)',
              color: 'rgb(var(--surface))',
            }}
          >
            <Newspaper size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-2xl font-bold tracking-tight">News</h2>
              <span className="rounded-full bg-panel/70 hairline px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-muted">
                Last 14 days
              </span>
            </div>
            <p className="text-sm text-muted">
              {steamGames.length
                ? <>Pulled from Steam for <span className="font-mono text-ink">{steamGames.length}</span> owned {steamGames.length === 1 ? 'game' : 'games'}.</>
                : <>Add Steam games to your library to see patch notes here.</>}
              {state.fetchedAt ? <span className="ml-1 opacity-60">· Updated {timeAgo(state.fetchedAt)}</span> : null}
            </p>
          </div>
          <button
            onClick={() => load(true)}
            disabled={state.loading || !steamGames.length}
            data-testid="news-refresh-btn"
            className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-[12px] font-bold hairline bg-panel/60 hover:bg-panel disabled:opacity-40"
            title="Refresh news"
          >
            <RefreshCw size={13} className={state.loading ? 'animate-spin' : ''} />
            {state.loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>

        {/* Feed filter toggle bar */}
        {state.items.length > 0 && (
          <div
            className="mb-5 flex flex-wrap items-center gap-2 rounded-lg hairline bg-panel/40 p-2"
            data-testid="news-feed-filters"
          >
            <div className="flex items-center gap-1 px-2 text-[10px] uppercase tracking-[0.2em] text-muted">
              <Filter size={11} /> Feeds
            </div>
            {(['official', 'community', 'thirdparty']).map((key) => {
              const meta = FEED_META[key];
              const Icon = meta.icon;
              const active = enabledFeeds[key];
              const count = feedCounts[key];
              return (
                <button
                  key={key}
                  onClick={() => setEnabledFeeds((s) => ({ ...s, [key]: !s[key] }))}
                  data-testid={`news-feed-${key}`}
                  className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold transition"
                  style={{
                    backgroundColor: active ? `${meta.color.replace('rgb', 'rgba').replace(')', ', 0.15)')}` : 'transparent',
                    color: active ? meta.color : 'rgb(var(--muted))',
                    border: `1px solid ${active ? meta.color.replace('rgb', 'rgba').replace(')', ', 0.35)') : 'rgba(255,255,255,0.06)'}`,
                  }}
                >
                  <Icon size={11} />
                  {meta.label}
                  <span className="opacity-60">· {count}</span>
                </button>
              );
            })}
            <div className="ml-auto text-[11px] text-muted">
              Showing <span className="font-mono text-ink">{filtered.length}</span> / {state.items.length}
            </div>
          </div>
        )}

        {/* Body */}
        {!steamGames.length ? (
          <EmptyPlaceholder onDiscord={() => openExternal('https://discord.gg/spk6QWREk8')} />
        ) : state.loading && !state.items.length ? (
          <LoadingSkeleton />
        ) : state.error ? (
          <div className="rounded-lg hairline bg-panel/40 p-4 text-sm text-[rgb(var(--danger,240,120,120))]">
            {state.error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg hairline bg-panel/40 p-6 text-center text-sm text-muted">
            {state.items.length === 0
              ? 'No updates from your Steam games in the last 14 days.'
              : 'All feeds are hidden — enable one above.'}
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((item, idx) => (
              <NewsRow key={item.id} item={item} index={idx} onOpen={() => openExternal(item.url)} />
            ))}
          </ul>
        )}

        {/* Footer note about non-Steam games */}
        {nonSteamCount > 0 && (
          <div className="mt-8 rounded-lg hairline bg-panel/30 p-3 text-[12px] text-muted flex items-center gap-2">
            <Sparkles size={12} className="text-[rgb(var(--accent-2))]" />
            <span>
              <span className="font-mono text-ink">{nonSteamCount}</span> {nonSteamCount === 1 ? 'game has' : 'games have'} no Steam appid.
              GOG announcements &amp; itch.io devlogs are on the roadmap.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function NewsRow({ item, index, onOpen }) {
  const feedKey = classifyFeed(item);
  const meta = FEED_META[feedKey];
  const Icon = meta.icon;
  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: Math.min(index * 0.02, 0.2) }}
      className="group rounded-xl hairline bg-panel/40 p-4 hover:bg-panel/60 transition cursor-pointer"
      onClick={onOpen}
      data-testid={`news-item-${item.id}`}
    >
      <div className="flex items-start gap-3">
        <img
          src={`https://cdn.akamai.steamstatic.com/steam/apps/${item.appid}/capsule_184x69.jpg`}
          alt=""
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
          className="hidden sm:block h-[46px] w-[122px] shrink-0 rounded-md object-cover hairline"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-display text-[13px] font-bold text-ink truncate max-w-[240px]">
              {item.gameName}
            </span>
            <span
              className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.15em]"
              style={{
                backgroundColor: meta.color.replace('rgb', 'rgba').replace(')', ', 0.14)'),
                color: meta.color,
              }}
            >
              <Icon size={9} />
              {meta.label}
            </span>
            <span className="text-[10.5px] text-muted">· {timeAgo(item.date)}</span>
          </div>
          <h4 className="mt-1 font-semibold text-[14.5px] leading-snug text-ink group-hover:text-[rgb(var(--accent))] transition">
            {item.title}
          </h4>
          {item.snippet && (
            <p className="mt-1 text-[12.5px] text-muted line-clamp-2 leading-relaxed">
              {item.snippet}
            </p>
          )}
          <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-[rgb(var(--accent-2))] opacity-0 group-hover:opacity-100 transition">
            Read on Steam <ExternalLink size={10} />
          </div>
        </div>
      </div>
    </motion.li>
  );
}

function LoadingSkeleton() {
  return (
    <ul className="space-y-3">
      {[0, 1, 2, 3].map((i) => (
        <li key={i} className="rounded-xl hairline bg-panel/30 p-4">
          <div className="flex gap-3">
            <div className="hidden sm:block h-[46px] w-[122px] rounded-md bg-panel/60 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-1/3 rounded bg-panel/60 animate-pulse" />
              <div className="h-4 w-3/4 rounded bg-panel/60 animate-pulse" />
              <div className="h-3 w-full rounded bg-panel/50 animate-pulse" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function EmptyPlaceholder({ onDiscord }) {
  return (
    <div className="rounded-xl hairline bg-panel/40 p-6 space-y-3">
      <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.22em] text-[rgb(var(--accent-2))]">
        <Sparkles size={11} /> Nothing to show yet
      </div>
      <h3 className="font-display text-lg font-bold text-ink">
        Add Steam games to unlock your News feed.
      </h3>
      <ul className="space-y-2 text-[13px] text-muted leading-relaxed">
        <li>· Scan your Steam library from the sidebar (top).</li>
        <li>· NEO-LIB fetches official announcements, community posts &amp; press coverage.</li>
        <li>· Only items from the last <span className="font-mono text-ink">14 days</span> — no ancient noise.</li>
      </ul>
      <div className="pt-3 flex items-center gap-2">
        <button
          onClick={onDiscord}
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
        <span className="text-[11px] text-muted">— ping me for GOG / itch / Xbox coverage.</span>
      </div>
    </div>
  );
}
