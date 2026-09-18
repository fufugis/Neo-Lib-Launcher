import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import { getSkimlinksScriptSrc } from './lib/deals';

function readableFailure(error) {
  return String(error?.stack || error?.message || error || 'Unknown startup error').slice(0, 5000);
}

function StartupFailure({ error }) {
  const details = readableFailure(error);
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#111018', color: '#f6efff', padding: 32, fontFamily: 'Segoe UI, sans-serif' }}>
      <section style={{ width: 'min(720px, 100%)', border: '1px solid rgba(255,92,190,.6)', borderRadius: 18, background: 'rgba(36,29,49,.96)', padding: 24, boxShadow: '0 18px 70px rgba(0,0,0,.45)' }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>NEO-LIB could not finish starting</h1>
        <p style={{ lineHeight: 1.55, color: '#d9cfe7' }}>Your library is safe. Please close and reopen NEO-LIB. If this screen returns, use the Feedback button after reopening or include the startup log with a bug report.</p>
        <details style={{ marginTop: 16 }}>
          <summary style={{ cursor: 'pointer', color: '#ff8bd2' }}>Technical details</summary>
          <pre style={{ marginTop: 12, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: 12, color: '#f5c9e5' }}>{details}</pre>
        </details>
      </section>
    </main>
  );
}

class StartupBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) { return { error }; }

  componentDidCatch(error, info) {
    console.error('[NEO-LIB renderer startup]', readableFailure(error), String(info?.componentStack || '').slice(0, 3000));
  }

  render() {
    return this.state.error ? <StartupFailure error={this.state.error} /> : this.props.children;
  }
}

const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);

window.addEventListener('error', (event) => {
  console.error('[NEO-LIB window error]', readableFailure(event.error || event.message));
});
window.addEventListener('unhandledrejection', (event) => {
  console.error('[NEO-LIB unhandled rejection]', readableFailure(event.reason));
});

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

root.render(<div style={{ minHeight: '100vh', background: '#111018' }} />);

import('./App.jsx')
  .then(({ default: App }) => {
    root.render(<StartupBoundary><App /></StartupBoundary>);
  })
  .catch((error) => {
    console.error('[NEO-LIB module startup]', readableFailure(error));
    root.render(<StartupFailure error={error} />);
  });
