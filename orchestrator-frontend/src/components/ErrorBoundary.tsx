/* eslint-disable react-refresh/only-export-components */
// Error boundaries MUST be class components; Fast Refresh cannot handle class components.
// This file intentionally mixes a class component (ErrorBoundary) with a helper
// function component (DefaultFallback). The ESLint rule is disabled at file level.

/**
 * ErrorBoundary — catches React rendering errors and shows a friendly fallback UI.
 *
 * The error boundary wraps only the content area (<Outlet />) inside each layout
 * so the sidebar and header remain functional even when a page throws.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <Outlet />
 *   </ErrorBoundary>
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** Optional custom fallback UI */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Default fallback UI
// ─────────────────────────────────────────────────────────────────────────────

function DefaultFallback({ error, onReset }: { error: Error | null; onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-[var(--color-surface-tertiary)] flex items-center justify-center mb-5">
        <AlertTriangle
          size={22}
          className="text-[var(--color-text-tertiary)]"
          strokeWidth={1.5}
        />
      </div>
      <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)] mb-2">
        Something went wrong
      </h2>
      <p className="text-[13px] text-[var(--color-text-secondary)] mb-6 max-w-sm">
        {error?.message && !error.message.includes('\n')
          ? error.message
          : 'An unexpected error occurred. Reload this page to try again.'}
      </p>
      <button
        type="button"
        onClick={onReset}
        className="btn-secondary text-[13px]"
      >
        Reload page
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Error boundary class component
// ─────────────────────────────────────────────────────────────────────────────

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Log to console in development; a real app would send to Sentry or similar
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary] Caught error:', error, info.componentStack);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    // Force a hard reload so the page re-initialises cleanly
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <DefaultFallback error={this.state.error} onReset={this.handleReset} />
      );
    }
    return this.props.children;
  }
}
