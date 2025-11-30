import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    const { error, errorInfo } = this.state;
    if (error) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
          <h2 style={{ color: 'var(--error, #b00020)' }}>Something went wrong</h2>
          <div style={{ margin: '1rem 0' }}>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
              {String(error)}
              {errorInfo ? '\n\n' + (errorInfo.componentStack || errorInfo.stack || '') : ''}
            </pre>
          </div>
          <div>
            <button onClick={() => window.location.reload()} style={{ padding: '.5rem 1rem' }}>
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
