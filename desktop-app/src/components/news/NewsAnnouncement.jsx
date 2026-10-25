import React from 'react';
import { motion } from 'framer-motion';
import { Newspaper, X } from 'lucide-react';

// Acknowledgement is deliberate: no backdrop, timeout or Escape dismissal.
export default function NewsAnnouncement({ message, onDismiss, reducedMotion, storageError, heading = 'NEO-LIB News', Icon = Newspaper, testid = 'news-popup', footer = 'Close with the X to keep this message in your mailbox.', closeTitle = 'Close announcement and keep it in your inbox' }) {
  const closeButton = React.useRef(null);
  React.useEffect(() => {
    const previous = document.activeElement;
    closeButton.current?.focus();
    const keys = event => {
      if (event.key === 'Escape' || event.key === 'Tab') {
        event.preventDefault(); event.stopPropagation();
        closeButton.current?.focus();
      }
    };
    document.addEventListener('keydown', keys, true);
    return () => {
      document.removeEventListener('keydown', keys, true);
      if (previous?.isConnected) previous.focus?.();
    };
  }, []);
  return <motion.div className="news-announcement-layer titlebar-nodrag" data-testid="news-announcement-layer"
    data-controller-surface="modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    transition={{ duration: reducedMotion ? 0 : 0.18 }}>
    <motion.aside data-testid={testid} role="dialog" aria-modal="true" aria-labelledby={`${testid}-title`}
      className="news-popup" initial={{ scale: reducedMotion ? 1 : 0.97, y: reducedMotion ? 0 : 10 }} animate={{ scale: 1, y: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.18 }}>
      <header><span><Icon size={22} /> {heading}</span><button ref={closeButton} type="button"
        aria-label="Close announcement" title={closeTitle} onClick={onDismiss}><X size={22} /></button></header>
      <h3 id={`${testid}-title`}>{message.title}</h3><p>{message.body}</p>
      {storageError && <p role="alert">Could not save your acknowledgement. Please try the X again.</p>}
      <footer>{footer}</footer>
    </motion.aside>
  </motion.div>;
}
