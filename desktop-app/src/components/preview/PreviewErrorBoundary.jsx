import React from 'react';

// A bad game must not replace Home, the Library and Settings with a startup error.
export default class PreviewErrorBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { console.error('[NEO-LIB] A game preview failed; other workspaces remain available.'); }
  render() {
    if (!this.state.failed) return this.props.children;
    return <section role="alert" data-testid="preview-recovery" className="m-6 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6 text-ink">
      <h2 className="text-lg font-bold">This game preview could not be displayed</h2>
      <p className="mt-2 text-sm text-muted">Your library has not been cleared. Choose another game, use Home or Settings, or edit this entry and try again.</p>
      <div className="mt-4 flex gap-3"><button type="button" className="rounded-lg border px-3 py-2" onClick={() => this.setState({ failed: false })}>Retry preview</button>{this.props.onEdit && <button type="button" className="rounded-lg border px-3 py-2" onClick={this.props.onEdit}>Edit game</button>}</div>
    </section>;
  }
}
