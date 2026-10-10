import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Mail, Newspaper, Trash2, X, ArrowUpRight } from 'lucide-react';
import Modal from '../Modal';
import { renderForegroundPortal } from '../ui/VisualBoundary';
import { playMascotVoice } from '../../lib/mascotVoice';
import { fetchNewsFeed, mergeNewsFeed, newsCheckDue, newsVoiceOptions, normalizeNewsInbox, NEWS_STORAGE_KEY, NEWS_CHECK_MS, NEWS_STARTUP_DELAY_MS, updateNewsMessage } from './news-model.mjs';

export default function NewsInbox({ paused = false, settings = {} }) {
  const [inbox, setInbox] = React.useState(() => {
    try { return normalizeNewsInbox(JSON.parse(localStorage.getItem(NEWS_STORAGE_KEY) || '{}')); }
    catch { return normalizeNewsInbox(null); }
  });
  const current = React.useRef(inbox);
  const button = React.useRef(null);
  const lastAttempt = React.useRef(0);
  const startupNotBefore = React.useRef(Date.now() + NEWS_STARTUP_DELAY_MS);
  const latestSettings = React.useRef(settings);
  latestSettings.current = settings;
  const [open, setOpen] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState('');
  const [popup, setPopup] = React.useState(null);
  const [storageError, setStorageError] = React.useState(false);
  const reducedMotion = useReducedMotion();
  const commit = React.useCallback(next => {
    try { localStorage.setItem(NEWS_STORAGE_KEY, JSON.stringify(next)); }
    catch { setStorageError(true); return false; }
    current.current = next;
    setInbox(next);
    setStorageError(false);
    return true;
  }, []);

  React.useEffect(() => {
    if (paused) { setPopup(null); return undefined; }
    let disposed = false;
    let active = null;
    let nextCheck;
    const check = async () => {
      if (active || disposed) return;
      window.clearTimeout(nextCheck);
      const now = Date.now();
      // Online/focus events must not bypass the patch-note reading window.
      if (now < startupNotBefore.current) {
        nextCheck = window.setTimeout(check, startupNotBefore.current - now);
        return;
      }
      const dueAt = Math.max(current.current.lastCheckedAt, lastAttempt.current) + NEWS_CHECK_MS;
      if (document.visibilityState === 'hidden' || !navigator.onLine
        || !newsCheckDue(current.current) || (lastAttempt.current && now < dueAt)) {
        nextCheck = window.setTimeout(check, Math.max(1000, dueAt - now, document.visibilityState === 'hidden' || !navigator.onLine ? NEWS_CHECK_MS : 0));
        return;
      }
      lastAttempt.current = now;
      const controller = new AbortController();
      active = controller;
      const timeout = window.setTimeout(() => controller.abort(), 12000);
      try {
        const feed = await fetchNewsFeed({ signal: controller.signal });
        if (!disposed && !controller.signal.aborted) commit(mergeNewsFeed(current.current, feed));
      } catch { /* Offline/bad feeds do not erase the inbox or interrupt the app. */ }
      finally { window.clearTimeout(timeout); if (active === controller) active = null;
        if (!disposed) nextCheck = window.setTimeout(check, NEWS_CHECK_MS); }
    };
    const startup = window.setTimeout(check, Math.max(0, startupNotBefore.current - Date.now()));
    window.addEventListener('online', check);
    document.addEventListener('visibilitychange', check);
    return () => { disposed = true; active?.abort(); window.clearTimeout(startup); window.clearTimeout(nextCheck);
      window.removeEventListener('online', check); document.removeEventListener('visibilitychange', check); };
  }, [paused, commit]);

  React.useEffect(() => {
    if (paused || open || popup || !inbox.messages.some(message => !message.notified)) return undefined;
    const showNext = () => {
      if (Date.now() < startupNotBefore.current || document.visibilityState === 'hidden' || !document.hasFocus()
        || document.querySelector('[role="dialog"], [aria-modal="true"], [data-testid="modal-close-btn"], [data-testid="changelog-overlay"], [data-testid="tutorial-overlay"]')) return;
      const message = current.current.messages.find(entry => !entry.notified);
      if (!message || !button.current) return;
      const rect = button.current.getBoundingClientRect();
      const width = Math.min(420, window.innerWidth - 24);
      const left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12));
      const top = Math.min(rect.bottom + 14, Math.max(12, window.innerHeight - 260));
      // Persist before showing: a restart cannot replay an already displayed popup.
      if (commit(updateNewsMessage(current.current, message.id, 'notify'))) {
        setPopup({ message, left, top, width,
          x: rect.left + rect.width / 2 - left - width / 2, y: rect.top + rect.height / 2 - top });
        // Play only for the actual popup, never for polling, reopening or deletion.
        playMascotVoice('news', newsVoiceOptions(latestSettings.current));
      }
    };
    const timer = window.setInterval(showNext, 1500);
    return () => window.clearInterval(timer);
  }, [inbox, paused, open, popup, commit]);

  React.useEffect(() => {
    if (!popup) return undefined;
    const timer = window.setTimeout(() => setPopup(null), 7500);
    const hideWhenBackgrounded = () => { if (document.visibilityState === 'hidden') setPopup(null); };
    document.addEventListener('visibilitychange', hideWhenBackgrounded);
    return () => { window.clearTimeout(timer); document.removeEventListener('visibilitychange', hideWhenBackgrounded); };
  }, [popup]);

  const close = React.useCallback(() => { setOpen(false); window.setTimeout(() => button.current?.focus(), 0); }, []);
  const select = id => { setSelectedId(id); commit(updateNewsMessage(current.current, id, 'read')); };
  const openInbox = id => {
    setPopup(null);
    const target = id || current.current.messages[0]?.id || '';
    select(target);
    setOpen(true);
  };
  React.useEffect(() => {
    if (!open) return undefined;
    const dialog = document.querySelector('[data-news-dialog]');
    dialog?.querySelector('button')?.focus();
    const trap = event => {
      if (event.key !== 'Tab' || !dialog) return;
      const controls = [...dialog.querySelectorAll('button:not(:disabled), a[href]')];
      const index = controls.indexOf(document.activeElement);
      if (!controls.length) return;
      if (event.shiftKey && index <= 0) { event.preventDefault(); controls[controls.length - 1].focus(); }
      else if (!event.shiftKey && (index === controls.length - 1 || index < 0)) { event.preventDefault(); controls[0].focus(); }
    };
    document.addEventListener('keydown', trap);
    return () => document.removeEventListener('keydown', trap);
  }, [open]);
  const selected = inbox.messages.find(message => message.id === selectedId) || inbox.messages[0];
  const unread = inbox.messages.filter(message => !message.read).length;

  return <>
    {inbox.messages.length > 0 && <button ref={button} type="button" data-testid="news-mail-button"
      className="titlebar-action news-mail-button" aria-label={`News inbox: ${inbox.messages.length} messages, ${unread} unread`}
      title={`News · ${inbox.messages.length} messages${storageError ? ' · Inbox could not be saved' : ''}`}
      aria-haspopup="dialog" onClick={() => openInbox()}>
      <Mail size={16} /><span className="news-mail-count">{inbox.messages.length > 99 ? '99+' : inbox.messages.length}</span>
      {unread > 0 && <span className="news-unread-dot" aria-hidden="true" />}
    </button>}
    {renderForegroundPortal(<AnimatePresence>{popup && !paused && <motion.aside key={popup.message.id}
      data-testid="news-popup" role="status" aria-live="polite" className="news-popup titlebar-nodrag"
      style={{ left: popup.left, top: popup.top, width: popup.width }}
      initial={{ opacity: 0, y: reducedMotion ? 0 : -8 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: reducedMotion ? 1 : 0.08, x: reducedMotion ? 0 : popup.x, y: reducedMotion ? 0 : popup.y }}
      transition={{ duration: reducedMotion ? 0.12 : 0.4 }}>
      <header><span><Newspaper size={19} /> News</span><button type="button" aria-label="Keep news in inbox" onClick={() => setPopup(null)}><X size={17} /></button></header>
      <h3>{popup.message.title}</h3><p>{popup.message.body}</p>
      <button type="button" className="news-open" onClick={() => openInbox(popup.message.id)}>Read in inbox <Mail size={15} /></button>
    </motion.aside>}</AnimatePresence>)}
    <Modal open={open} onClose={close} title="News" wide testid="news-inbox-modal">
      <section data-news-dialog role="dialog" aria-modal="true" aria-label="News inbox" className="news-inbox">
        <div className="news-inbox-heading"><p>{inbox.messages.length} saved messages · {unread} unread</p>
          <button type="button" data-controller-close aria-label="Close news inbox" onClick={close}><X size={18} /></button></div>
        {storageError && <p role="alert">Your inbox could not be saved. Changes have not been applied.</p>}
        {inbox.messages.length ? <div className="news-inbox-grid"><nav aria-label="News messages">{inbox.messages.map(message =>
          <button type="button" key={message.id} aria-pressed={message.id === selected?.id} onClick={() => select(message.id)}>
            <Mail size={15} /><span>{message.title}{!message.read && <small>Unread</small>}</span>
          </button>)}</nav><article><h3>{selected.title}</h3>
          {selected.publishedAt && <time dateTime={selected.publishedAt}>{new Date(selected.publishedAt).toLocaleDateString()}</time>}
          <p>{selected.body}</p>
          <footer>{selected.link && <button type="button" onClick={() => {
            if (window.api?.openExternal) window.api.openExternal(selected.link);
            else window.open(selected.link, '_blank', 'noopener,noreferrer');
          }}>Open link <ArrowUpRight size={15} /></button>}
          <button type="button" onClick={() => {
            const next = updateNewsMessage(current.current, selected.id, 'delete');
            if (commit(next)) { setSelectedId(next.messages[0]?.id || ''); if (!next.messages.length) close(); }
          }}><Trash2 size={15} /> Delete message</button></footer>
        </article></div> : <p>Your inbox is empty.</p>}
      </section>
    </Modal>
  </>;
}
