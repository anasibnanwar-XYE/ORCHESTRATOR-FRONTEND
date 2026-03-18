/**
 * Tests for ForgotPasswordPage
 *
 * Covers:
 *  - Renders email input
 *  - Shows identical confirmation for any email (enum prevention)
 *  - Calls authApi.forgotPassword on submit
 *  - Shows vague confirmation message after submission
 *  - Never shows different messages for existing vs non-existing emails
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ForgotPasswordPage } from '../ForgotPasswordPage';

// ─────────────────────────────────────────────────────────────────────────────
// Mocks — factories use inline vi.fn()
// ─────────────────────────────────────────────────────────────────────────────

vi.mock('@/lib/authApi', () => ({
  authApi: {
    forgotPassword: vi.fn(),
  },
}));

vi.mock('@/components/ui/OrchestratorLogo', () => ({
  OrchestratorLogo: () => <div data-testid="logo">Logo</div>,
}));

// ─────────────────────────────────────────────────────────────────────────────
// Import after mocks
// ─────────────────────────────────────────────────────────────────────────────

import { authApi } from '@/lib/authApi';
import axios from 'axios';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function renderPage() {
  return render(
    <MemoryRouter>
      <ForgotPasswordPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('ForgotPasswordPage — rendering', () => {
  it('renders email input', () => {
    renderPage();
    expect(screen.getByLabelText(/work email/i)).toBeInTheDocument();
  });

  it('renders send reset link button', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
  });

  it('send button is disabled when email is empty', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeDisabled();
  });
});

describe('ForgotPasswordPage — email enumeration prevention', () => {
  it('shows same confirmation for existing email', async () => {
    vi.mocked(authApi.forgotPassword).mockResolvedValue(undefined);

    renderPage();
    fireEvent.change(screen.getByLabelText(/work email/i), {
      target: { value: 'existing@company.com' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(/if an account/i)).toBeInTheDocument();
      expect(screen.getByText(/check your inbox/i)).toBeInTheDocument();
    });
  });

  it('shows same confirmation even when API returns error (non-existent email)', async () => {
    vi.mocked(authApi.forgotPassword).mockRejectedValue(new Error('Email not found'));

    renderPage();
    fireEvent.change(screen.getByLabelText(/work email/i), {
      target: { value: 'nonexistent@company.com' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));
    });

    // SAME confirmation message — enum attack prevention
    await waitFor(() => {
      expect(screen.getByText(/if an account/i)).toBeInTheDocument();
    });
  });

  it('confirmation message does not reveal whether email exists', async () => {
    vi.mocked(authApi.forgotPassword).mockResolvedValue(undefined);

    renderPage();
    fireEvent.change(screen.getByLabelText(/work email/i), {
      target: { value: 'test@company.com' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));
    });

    await waitFor(() => {
      const confirmText = screen.getByText(/if an account/i);
      // The confirmation text should be deliberately vague
      expect(confirmText.textContent).toMatch(/if an account/i);
      // Should NOT reveal account existence
      expect(confirmText.textContent).not.toMatch(/your account exists/i);
      expect(confirmText.textContent).not.toMatch(/email address is registered/i);
    });
  });
});

describe('ForgotPasswordPage — controlled persistence failure (VAL-AUTH-012)', () => {
  it('shows retryable failure state when authApi throws ForgotPasswordPersistenceError', async () => {
    // Backend returned a controlled non-success response (persistence failure).
    // The UI must show a retryable state — NOT the same "check your email" confirmation
    // which would mislead the user into thinking an email was sent.
    const persistenceErr = new Error('Temporary failure');
    persistenceErr.name = 'ForgotPasswordPersistenceError';
    vi.mocked(authApi.forgotPassword).mockRejectedValue(persistenceErr);

    renderPage();
    fireEvent.change(screen.getByLabelText(/work email/i), {
      target: { value: 'user@company.com' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));
    });

    await waitFor(() => {
      // Must show retryable failure message — NOT the "check your email" confirmation
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(screen.queryByText(/check your email/i)).not.toBeInTheDocument();
      // Must show a retry button
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });
  });

  it('shows retryable failure state when server returns 5xx error', async () => {
    // 5xx errors from the backend also indicate a persistence failure.
    const serverErr = new axios.AxiosError(
      'Internal Server Error',
      '500',
      undefined,
      undefined,
      {
        status: 500,
        statusText: 'Internal Server Error',
        data: { success: false, message: 'Internal server error' },
        headers: {},
        config: {} as never,
      } as never
    );
    vi.mocked(authApi.forgotPassword).mockRejectedValue(serverErr);

    renderPage();
    fireEvent.change(screen.getByLabelText(/work email/i), {
      target: { value: 'user@company.com' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(screen.queryByText(/check your email/i)).not.toBeInTheDocument();
    });
  });

  it('retryable failure state allows the user to try again', async () => {
    const persistenceErr = new Error('Temporary failure');
    persistenceErr.name = 'ForgotPasswordPersistenceError';
    vi.mocked(authApi.forgotPassword).mockRejectedValueOnce(persistenceErr);
    // Second attempt succeeds
    vi.mocked(authApi.forgotPassword).mockResolvedValueOnce(undefined);

    renderPage();
    fireEvent.change(screen.getByLabelText(/work email/i), {
      target: { value: 'user@company.com' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    // Click "Try again" — should go back to the form
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    });

    expect(screen.getByLabelText(/work email/i)).toBeInTheDocument();
  });

  it('shows same confirmation (not retryable state) for non-persistence errors (enum prevention)', async () => {
    // Network errors, 4xx, or masked not-found errors should all show the same confirmation
    // to prevent email enumeration attacks.
    vi.mocked(authApi.forgotPassword).mockRejectedValue(new Error('Network Error'));

    renderPage();
    fireEvent.change(screen.getByLabelText(/work email/i), {
      target: { value: 'nonexistent@company.com' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
    });
  });
});

describe('ForgotPasswordPage — canonical path (VAL-AUTH-011)', () => {
  it('calls the canonical /auth/password/forgot endpoint only', async () => {
    vi.mocked(authApi.forgotPassword).mockResolvedValue(undefined);

    renderPage();
    fireEvent.change(screen.getByLabelText(/work email/i), {
      target: { value: 'user@company.com' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));
    });

    // Must call forgotPassword (the canonical path) — the retired superadmin alias
    // POST /api/v1/auth/password/forgot/superadmin must never be called
    expect(authApi.forgotPassword).toHaveBeenCalledWith({ email: 'user@company.com' });
    expect(authApi.forgotPassword).toHaveBeenCalledTimes(1);
  });
});

describe('ForgotPasswordPage — submission', () => {
  it('calls forgotPassword with entered email', async () => {
    vi.mocked(authApi.forgotPassword).mockResolvedValue(undefined);

    renderPage();
    fireEvent.change(screen.getByLabelText(/work email/i), {
      target: { value: 'user@company.com' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));
    });

    expect(authApi.forgotPassword).toHaveBeenCalledWith({ email: 'user@company.com' });
  });

  it('shows check email confirmation after submit', async () => {
    vi.mocked(authApi.forgotPassword).mockResolvedValue(undefined);

    renderPage();
    fireEvent.change(screen.getByLabelText(/work email/i), {
      target: { value: 'user@company.com' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });
  });

  it('hides the form after submit', async () => {
    vi.mocked(authApi.forgotPassword).mockResolvedValue(undefined);

    renderPage();
    fireEvent.change(screen.getByLabelText(/work email/i), {
      target: { value: 'user@company.com' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));
    });

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /send reset link/i })).not.toBeInTheDocument();
    });
  });
});
