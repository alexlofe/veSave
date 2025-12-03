import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary component that catches JavaScript errors anywhere in the child
 * component tree and displays a fallback UI instead of crashing the entire app.
 *
 * This is critical for handling wallet/provider failures gracefully.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error details for debugging
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);

    this.setState({ errorInfo });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI matching project styles
      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <div style={styles.iconContainer}>
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#e85169"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            <h1 style={styles.title}>Something went wrong</h1>

            <p style={styles.description}>
              An unexpected error occurred. This might be due to a wallet connection
              issue or network problem.
            </p>

            {this.state.error && (
              <div style={styles.errorBox}>
                <span style={styles.errorLabel}>Error Details</span>
                <code style={styles.errorMessage}>
                  {this.state.error.message || 'Unknown error'}
                </code>
              </div>
            )}

            <div style={styles.actions}>
              <button
                onClick={this.handleReset}
                style={styles.primaryButton}
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                style={styles.secondaryButton}
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Inline styles matching the project's design system
const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '2rem',
    background: 'radial-gradient(circle at top, rgba(58, 99, 255, 0.1), transparent 45%), radial-gradient(circle at bottom, rgba(109, 66, 235, 0.1), transparent 50%), #05070d',
  },
  card: {
    width: '100%',
    maxWidth: '480px',
    background: 'rgba(12, 16, 39, 0.86)',
    border: '1px solid rgba(84, 95, 160, 0.35)',
    borderRadius: '20px',
    padding: 'clamp(1.5rem, 4vw, 2rem)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1.25rem',
    boxShadow: '0 16px 32px rgba(4, 16, 56, 0.35)',
    textAlign: 'center',
  },
  iconContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: 'rgba(232, 81, 105, 0.15)',
  },
  title: {
    margin: 0,
    fontSize: 'clamp(1.5rem, 4vw, 1.75rem)',
    letterSpacing: '-0.015em',
    color: '#dbe4ff',
    fontWeight: 600,
  },
  description: {
    margin: 0,
    color: '#94a3f4',
    fontSize: '0.95rem',
    lineHeight: 1.6,
  },
  errorBox: {
    width: '100%',
    padding: '1rem 1.2rem',
    borderRadius: '12px',
    border: '1px solid rgba(255, 100, 100, 0.35)',
    background: 'rgba(60, 12, 20, 0.6)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    textAlign: 'left',
  },
  errorLabel: {
    color: 'rgba(255, 180, 180, 0.8)',
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  errorMessage: {
    color: '#ffb4b4',
    fontSize: '0.85rem',
    fontFamily: "'Fira Code', 'Source Code Pro', 'Courier New', monospace",
    wordBreak: 'break-word',
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem',
    justifyContent: 'center',
    marginTop: '0.5rem',
  },
  primaryButton: {
    borderRadius: '12px',
    border: '1px solid transparent',
    padding: '0.7rem 1.4rem',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    minHeight: '44px',
    minWidth: '140px',
    background: 'linear-gradient(135deg, #6574ff, #4a53e6)',
    color: '#fff',
    boxShadow: '0 10px 20px rgba(86, 104, 255, 0.35)',
    transition: 'transform 0.18s ease, box-shadow 0.18s ease',
  },
  secondaryButton: {
    borderRadius: '12px',
    border: '1px solid rgba(84, 95, 160, 0.5)',
    padding: '0.7rem 1.4rem',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    minHeight: '44px',
    minWidth: '140px',
    background: 'rgba(19, 26, 54, 0.85)',
    color: '#c3d1ff',
    transition: 'transform 0.18s ease, border-color 0.18s ease',
  },
};

export default ErrorBoundary;
