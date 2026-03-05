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
