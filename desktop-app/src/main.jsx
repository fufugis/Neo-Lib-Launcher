import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
import { getSkimlinksScriptSrc } from './lib/deals';

// Inject Skimlinks once at startup (if an ID is configured at build time).
// Auto-affiliates any rendered anchor-tag clicks once the publisher account is approved.
(() => {
  const src = getSkimlinksScriptSrc();
  if (!src || document.querySelector(`script[src="${src}"]`)) return;
  const s = document.createElement('script');
  s.type = 'text/javascript';
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
})();

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
