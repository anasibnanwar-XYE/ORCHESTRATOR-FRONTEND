/**
 * Tests for ResetPasswordPage
 *
 * Covers:
 *  - Redirects to /forgot-password when no token in URL
 *  - Renders new password and confirm password fields
 *  - Shows password rule indicators
 *  - Submit disabled until all rules pass and passwords match
 *  - Calls authApi.resetPassword with token + passwords
 *  - Navigates to /login with success toast on success
 *  - Shows error toast on failure
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ResetPasswordPage } from '../ResetPasswordPage';

// ─────────────────────────────────────────────────────────────────────────────
// Mocks — factories use inline vi.fn()
// ─────────────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [mockSearchParams, vi.fn()],
  };
});

vi.mock('@/lib/authApi', () => ({
  authApi: {
    resetPassword: vi.fn(),
  },
}));

// Stable toast mock — same instance every call
const toastMock = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  toast: vi.fn(),
  dismiss: vi.fn(),
};
vi.mock('@/components/ui/Toast', () => ({
  useToast: () => toastMock,
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
      <ResetPasswordPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  toastMock.success.mockReset();
  toastMock.error.mockReset();
  mockSearchParams = new URLSearchParams();
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('ResetPasswordPage — redirect when no token', () => {
  it('redirects to /forgot-password when token is missing', () => {
    renderPage();
    expect(mockNavigate).toHaveBeenCalledWith('/forgot-password', { replace: true });
  });

  it('renders form when valid token is present', () => {
    mockSearchParams = (() => { const p = new URLSearchParams(); p.set('token', 'xxxxxxxx-valid'); return p; })();
    renderPage();
    expect(mockNavigate).not.toHaveBeenCalledWith('/forgot-password', expect.anything());
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
  });
});

describe('ResetPasswordPage — rendering', () => {
  beforeEach(() => {
    mockSearchParams = (() => { const p = new URLSearchParams(); p.set('token', 'xxxxxxxx-123'); return p; })();
  });

  it('renders new password field', () => {
    renderPage();
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
  });

  it('renders confirm password field', () => {
    renderPage();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it('renders reset password button', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
  });

  it('submit button is initially disabled', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /reset password/i })).toBeDisabled();
  });
});

describe('ResetPasswordPage — password validation', () => {
  beforeEach(() => {
    mockSearchParams = (() => { const p = new URLSearchParams(); p.set('token', 'xxxxxxxx-123'); return p; })();
  });

  it('shows rules when typing', () => {
    renderPage();
    const input = screen.getByLabelText(/new password/i);
    fireEvent.change(input, { target: { value: 'A' } });
    expect(screen.getByTestId('rule-length')).toBeInTheDocument();
    expect(screen.getByTestId('rule-uppercase')).toBeInTheDocument();
    expect(screen.getByTestId('rule-lowercase')).toBeInTheDocument();
    expect(screen.getByTestId('rule-digit')).toBeInTheDocument();
    expect(screen.getByTestId('rule-special')).toBeInTheDocument();
  });

  it('submit button enabled when all rules pass and passwords match', () => {
    renderPage();
    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    fireEvent.change(newPasswordInput, { target: { value: 'Abcdefgh1!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'Abcdefgh1!' } });

    expect(screen.getByRole('button', { name: /reset password/i })).not.toBeDisabled();
  });

  it('submit disabled for weak password (missing special char)', () => {
    renderPage();
    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    fireEvent.change(newPasswordInput, { target: { value: 'Abcdefgh12' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'Abcdefgh12' } });

    expect(screen.getByRole('button', { name: /reset password/i })).toBeDisabled();
  });
});

describe('ResetPasswordPage — submission', () => {
  beforeEach(() => {
    mockSearchParams = (() => { const p = new URLSearchParams(); p.set('token', 'xxxxxxxx'); return p; })();
  });

  it('calls resetPassword with token and passwords', async () => {
    vi.mocked(authApi.resetPassword).mockResolvedValue(undefined);

    renderPage();
    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    fireEvent.change(newPasswordInput, { target: { value: 'Abcdefgh1!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'Abcdefgh1!' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
    });

    expect(authApi.resetPassword).toHaveBeenCalledWith({
      token: 'xxxxxxxx',
      newPassword: 'Abcdefgh1!',
      confirmPassword: 'Abcdefgh1!',
    });
  });

  it('navigates to /login with success toast on success', async () => {
    vi.mocked(authApi.resetPassword).mockResolvedValue(undefined);

    renderPage();
    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    fireEvent.change(newPasswordInput, { target: { value: 'Abcdefgh1!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'Abcdefgh1!' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
    });

    await waitFor(() => {
      expect(toastMock.success).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });
  });

  it('shows inline token error for invalid/expired/used/superseded token — not a toast', async () => {
    // Token-related errors (not password-policy errors) must show as inline recovery
    // banner so users understand they need to request a new link.
    vi.mocked(authApi.resetPassword).mockRejectedValue(new Error('Token expired'));

    renderPage();
    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    fireEvent.change(newPasswordInput, { target: { value: 'Abcdefgh1!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'Abcdefgh1!' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
    });

    await waitFor(() => {
      // Toast should NOT be called for token errors (inline banner is shown instead)
      expect(toastMock.error).not.toHaveBeenCalled();
      // Inline token error state should be shown
      expect(screen.getByText(/reset link.*no longer valid|invalid.*reset link/i)).toBeInTheDocument();
    });
  });

  it('token error state shows a link to /forgot-password — VAL-AUTH-013', async () => {
    // The recovery path for invalid/expired/superseded tokens must point to /forgot-password.
    vi.mocked(authApi.resetPassword).mockRejectedValue(new Error('Token expired'));

    renderPage();
    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'Abcdefgh1!' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'Abcdefgh1!' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
    });

    await waitFor(() => {
      const requestNewLink = screen.getByTestId('request-new-link');
      expect(requestNewLink).toBeInTheDocument();
      // The link must go to /forgot-password for self-service recovery
      expect(requestNewLink).toHaveAttribute('href', '/forgot-password');
    });
  });

  it('shows error toast for password-policy failure', async () => {
    // Password policy errors (message contains "password") still use a toast
    // because the user can correct their input without requesting a new link.
    vi.mocked(authApi.resetPassword).mockRejectedValue(
      new Error('Password does not meet policy: must have special character')
    );

    renderPage();
    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'Abcdefgh1!' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'Abcdefgh1!' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
    });

    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalled();
      // Should NOT show inline token error for password-policy failures
      expect(screen.queryByTestId('request-new-link')).not.toBeInTheDocument();
    });
  });
});
