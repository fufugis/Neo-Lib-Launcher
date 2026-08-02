import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Newspaper, RefreshCw, ExternalLink, MessageCircle, Sparkles,
  Users, Megaphone, Globe2, Filter, Gamepad2, X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const isElectron = typeof window !== 'undefined' && !!window.api;

// Feed classifier (Steam items only). For itch/gog, we bypass this.
function classifyFeed(item) {
  if (item.platform !== 'steam') return item.platform; // 'itch' | 'gog'
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
  itch:       { label: 'itch devlog', icon: Gamepad2,  color: 'rgb(255, 100, 149)' },
  gog:        { label: 'GOG patch',   icon: Megaphone, color: 'rgb(140, 179, 255)' },
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

export default function NewsPanel({ games = [], onClose }) {
  const eligibleGames = useMemo(
    () => (games || []).filter((g) => g && (g.appid || g.gogId || /itch\.io/.test(g.website || '') || g.source === 'itch')),
    [games]
  );
  const sourceCounts = useMemo(() => {
    const c = { steam: 0, itch: 0, gog: 0 };
    for (const g of games || []) {
      if (g?.appid) c.steam += 1;
      else if (g?.gogId) c.gog += 1;
      else if (/itch\.io/.test(g?.website || '') || g?.source === 'itch') c.itch += 1;
    }
    return c;
  }, [games]);
  const coveredCount = sourceCounts.steam + sourceCounts.itch + sourceCounts.gog;
  const uncoveredCount = (games || []).length - coveredCount;

  const [state, setState] = useState({ loading: false, error: '', items: [], fetchedAt: 0 });
  const [enabledFeeds, setEnabledFeeds] = useState({
    official: true, community: true, thirdparty: true, itch: true, gog: true,
  });
  const fetchedOnce = useRef(false);

  const openExternal = (url) => {
    if (!url) return;
    if (isElectron) window.api.openExternal(url); else window.open(url, '_blank');
  };

  const load = async (force = false) => {
    if (!isElectron || !eligibleGames.length) return;
    setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      const payloadGames = eligibleGames.map((g) => ({
        id: g.id, appid: g.appid, name: g.name,
        website: g.website, source: g.source, gogId: g.gogId,
      }));
      const res = await window.api.fetchAllNews({ games: payloadGames, days: 14, force });
      if (!res?.ok) throw new Error(res?.error || 'Failed to load news');
      setState({ loading: false, error: '', items: res.items || [], fetchedAt: res.fetchedAt || Date.now() });
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: String(e.message || e) }));
    }
  };

  useEffect(() => {
    if (fetchedOnce.current) return;
    if (!eligibleGames.length) return;
    fetchedOnce.current = true;
    load(false);
  }, [eligibleGames.length]);

  // Esc to close
  useEffect(() => {
    if (!onClose) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const filtered = useMemo(
    () => state.items.filter((it) => enabledFeeds[classifyFeed(it)]),
    [state.items, enabledFeeds]
  );

  const feedCounts = useMemo(() => {
    const c = { official: 0, community: 0, thirdparty: 0, itch: 0, gog: 0 };
    for (const it of state.items) c[classifyFeed(it)] = (c[classifyFeed(it)] || 0) + 1;
    return c;
  }, [state.items]);

  const body = (
    <AnimatePresence>
      <motion.div
        key="news-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.08 }}
        className="fixed inset-0 z-[80] flex items-start justify-end p-3 pt-16"
        onClick={onClose}
        data-testid="news-backdrop"
      >
        <motion.div
          initial={{ opacity: 0, x: 12, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 12, scale: 0.98 }}
          transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
          className="relative flex w-full max-w-[520px] max-h-[80vh] flex-col overflow-hidden rounded-2xl hairline"
          style={{
            backgroundColor: 'rgb(var(--panel) / 0.96)',
            border: '1px solid rgb(var(--accent) / 0.25)',
            boxShadow: '0 20px 60px -20px rgba(0,0,0,0.85), 0 0 30px -8px rgb(var(--accent)/0.35)',
          }}
          onClick={(e) => e.stopPropagation()}
          data-testid="news-panel"
        >
          {/* HEADER — fixed, doesn't scroll */}
          <div className="flex items-start gap-3 border-b hairline px-6 pt-5 pb-4">
            <div
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full"
              style={{
                backgroundImage: 'linear-gradient(135deg, rgb(var(--accent)) 0%, rgb(var(--accent-2)) 100%)',
                color: 'rgb(var(--surface))',
              }}
            >
              <Newspaper size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-xl font-bold tracking-tight">News</h2>
                <span className="rounded-full bg-panel/70 hairline px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-muted">
                  Last 14 days
                </span>
              </div>
              <p className="text-[12px] text-muted">
                {coveredCount ? (
                  <>
                    Covering <span className="font-mono text-ink">{coveredCount}</span>{' '}
                    {coveredCount === 1 ? 'game' : 'games'}
                    {sourceCounts.steam > 0 && <> · <span className="text-ink/80">{sourceCounts.steam} Steam</span></>}
                    {sourceCounts.itch > 0 && <> · <span className="text-ink/80">{sourceCounts.itch} itch</span></>}
                    {sourceCounts.gog > 0 && <> · <span className="text-ink/80">{sourceCounts.gog} GOG</span></>}
                  </>
                ) : (
                  <>Add Steam, itch.io or GOG games to see updates.</>
                )}
                {state.fetchedAt ? <span className="ml-1 opacity-60">· Updated {timeAgo(state.fetchedAt)}</span> : null}
              </p>
            </div>
            <button
              onClick={() => load(true)}
              disabled={state.loading || !eligibleGames.length}
              data-testid="news-refresh-btn"
              className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-bold hairline bg-panel/60 hover:bg-panel disabled:opacity-40"
              title="Refresh news"
            >
              <RefreshCw size={11} className={state.loading ? 'animate-spin' : ''} />
              {state.loading ? 'Loading…' : 'Refresh'}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                data-testid="news-close-btn"
                className="grid h-8 w-8 place-items-center rounded-md text-muted hover:text-ink hover:bg-panel/60"
                title="Close (Esc)"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* BODY — this is the scroll region. min-h-0 lets flex-1 shrink & overflow. */}
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5" data-testid="news-scroll-body">
            {/* Feed filter toggle bar */}
            {state.items.length > 0 && (
              <div
                className="mb-4 flex flex-wrap items-center gap-2 rounded-lg hairline bg-panel/40 p-2"
                data-testid="news-feed-filters"
              >
                <div className="flex items-center gap-1 px-2 text-[10px] uppercase tracking-[0.2em] text-muted">
                  <Filter size={11} /> Feeds
                </div>
                {(['official', 'community', 'thirdparty', 'itch', 'gog']).map((key) => {
                  if ((feedCounts[key] || 0) === 0) return null;
                  const meta = FEED_META[key];
                  const Icon = meta.icon;
                  const active = enabledFeeds[key];
                  const count = feedCounts[key] || 0;
                  return (
                    <button
                      key={key}
                      onClick={() => setEnabledFeeds((s) => ({ ...s, [key]: !s[key] }))}
                      data-testid={`news-feed-${key}`}
                      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold transition"
                      style={{
                        backgroundColor: active ? meta.color.replace('rgb', 'rgba').replace(')', ', 0.15)') : 'transparent',
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

            {!eligibleGames.length ? (
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
                  ? 'No updates from your games in the last 14 days.'
                  : 'All feeds are hidden — enable one above.'}
              </div>
            ) : (
              <ul className="space-y-3">
                {filtered.map((item, idx) => (
                  <NewsRow key={item.id} item={item} index={idx} onOpen={() => openExternal(item.url)} />
                ))}
              </ul>
            )}

            {uncoveredCount > 0 && (
              <div className="mt-6 rounded-lg hairline bg-panel/30 p-3 text-[12px] text-muted flex items-center gap-2">
                <Sparkles size={12} className="text-[rgb(var(--accent-2))]" />
                <span>
                  <span className="font-mono text-ink">{uncoveredCount}</span> {uncoveredCount === 1 ? 'game has' : 'games have'} no
                  Steam / itch / GOG source and won&apos;t appear here.
                </span>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(body, document.body);
}


function NewsRow({ item, index, onOpen }) {
  const feedKey = classifyFeed(item);
  const meta = FEED_META[feedKey];
  const Icon = meta.icon;
  const capsule = item.platform === 'steam'
    ? `https://cdn.akamai.steamstatic.com/steam/apps/${item.appid}/capsule_184x69.jpg`
    : null;
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
        {capsule ? (
          <img
            src={capsule}
            alt=""
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
            className="hidden sm:block h-[46px] w-[122px] shrink-0 rounded-md object-cover hairline"
          />
        ) : (
          <div
            className="hidden sm:grid h-[46px] w-[122px] shrink-0 place-items-center rounded-md hairline text-[10.5px] font-bold uppercase tracking-widest"
            style={{
              backgroundColor: meta.color.replace('rgb', 'rgba').replace(')', ', 0.12)'),
              color: meta.color,
            }}
          >
            <Icon size={18} />
          </div>
        )}
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
            Read more <ExternalLink size={10} />
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
        Add Steam, itch.io or GOG games to unlock your News feed.
      </h3>
      <ul className="space-y-2 text-[13px] text-muted leading-relaxed">
        <li>· <b>Steam</b> announcements &amp; press coverage (any Steam game with an appid).</li>
        <li>· <b>itch.io</b> devlogs (any game whose website is a *.itch.io page).</li>
        <li>· <b>GOG</b> patch notes (any game fetched via the GOG metadata source).</li>
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
        <span className="text-[11px] text-muted">— ping me for Xbox / EA / standalone launchers.</span>
      </div>
    </div>
  );
}
