/**
 * Tests for ErrorBoundary component.
 *
 * Verifies:
 * - Children render normally when no error
 * - Fallback UI renders when child throws
 * - Error details are accessible
 * - Shell remains intact (error is contained to content area)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

// Suppress console.error for expected error tests
const originalConsoleError = console.error;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** A component that always throws during render */
function Bomber({ message = 'Test error' }: { message?: string }): never {
  throw new Error(message);
}

/** A normal component that renders without error */
function Normal() {
  return <div data-testid="normal-content">Normal content</div>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Suppress expected error output from React during tests
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('renders children when no error is thrown', () => {
    render(
      <ErrorBoundary>
        <Normal />
      </ErrorBoundary>
    );
    expect(screen.getByTestId('normal-content')).toBeInTheDocument();
  });

  it('renders fallback UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <Bomber />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders a "Reload page" button in the fallback', () => {
    render(
      <ErrorBoundary>
        <Bomber />
      </ErrorBoundary>
    );
    expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument();
  });

  it('shows a description in the fallback', () => {
    render(
      <ErrorBoundary>
        <Bomber message="Custom error message for testing" />
      </ErrorBoundary>
    );
    expect(screen.getByText(/custom error message for testing/i)).toBeInTheDocument();
  });

  it('renders custom fallback prop when provided', () => {
    const customFallback = <div data-testid="custom-fallback">Custom error UI</div>;
    render(
      <ErrorBoundary fallback={customFallback}>
        <Bomber />
      </ErrorBoundary>
    );
    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('does NOT crash the surrounding layout when child throws', () => {
    render(
      <div data-testid="shell">
        <div data-testid="sidebar">Sidebar</div>
        <ErrorBoundary>
          <Bomber />
        </ErrorBoundary>
      </div>
    );
    // Shell elements remain intact
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    // Fallback renders inside the boundary
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});
