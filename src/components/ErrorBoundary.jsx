import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

// Catches render errors so one broken component doesn't blank the whole app.
// Must be a class component — React has no hook for this yet.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Later: send to an error tracker (Sentry etc.)
    console.error('App crashed:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="crash">
        <AlertTriangle size={44} strokeWidth={1.5} />
        <h1>Something went wrong</h1>
        <p>कुछ गड़बड़ हो गई। पेज दोबारा लोड करें।</p>
        <div className="row-end">
          <button className="btn btn--ghost" onClick={() => { window.location.href = '/'; }}>Go to home</button>
          <button className="btn btn--primary" onClick={() => window.location.reload()}>Reload page</button>
        </div>
      </div>
    );
  }
}
