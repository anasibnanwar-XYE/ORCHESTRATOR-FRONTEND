/**
 * Tests for FirstPasswordChangePage
 *
 * Covers:
 *  - Redirects to /login when no session
 *  - Renders new password and confirm password fields
 *  - Shows real-time password rule indicators
 *  - Submit button disabled until all rules pass
 *  - Submit button disabled when passwords don't match
 *  - Shows error message when passwords don't match
 *  - Calls authApi.changePassword on submit
 *  - Navigates to /hub on success
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { FirstPasswordChangePage } from '../FirstPasswordChangePage';

// ─────────────────────────────────────────────────────────────────────────────
// Mocks — factories MUST use inline vi.fn(), not outer variables
// ─────────────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Auth context mock — session is controlled via mockSession variable
let mockSession: Record<string, unknown> | null = { user: {} };
const mockSignOut = vi.fn().mockResolvedValue(undefined);
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    get session() { return mockSession; },
    updateUser: vi.fn(),
    signOut: mockSignOut,
  }),
  MFA_SESSION_KEY: 'bbp-orchestrator-mfa-pending',
}));

// authApi mock — use vi.fn() inline, then access via vi.mocked()
vi.mock('@/lib/authApi', () => ({
  authApi: {
    changePassword: vi.fn(),
    me: vi.fn(),
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
// Imports after mocks
// ─────────────────────────────────────────────────────────────────────────────

import { authApi } from '@/lib/authApi';

// ─────────────────────────────────────────────────────────────────────────────
// Test helpers
// ─────────────────────────────────────────────────────────────────────────────

const mockUser = {
  email: 'admin@bbp.com',
  displayName: 'Admin User',
  companyId: '1',
  roles: ['ROLE_ADMIN'],
  permissions: [],
  mfaEnabled: false,
  mustChangePassword: true,
};

function renderPage() {
  return render(
    <MemoryRouter>
      <FirstPasswordChangePage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  // Reset stable toast mock
  toastMock.success.mockReset();
  toastMock.error.mockReset();
  // Ensure signOut returns a resolved promise (since we await it)
  mockSignOut.mockResolvedValue(undefined);
  mockSession = { user: mockUser };
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('FirstPasswordChangePage — redirect', () => {
  it('redirects to /login when session is null', () => {
    mockSession = null;
    renderPage();
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
  });

  it('does not redirect when session exists', () => {
    renderPage();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

describe('FirstPasswordChangePage — rendering', () => {
  it('renders new password field', () => {
    renderPage();
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
  });

  it('renders confirm password field', () => {
    renderPage();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it('renders set password button', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /set password/i })).toBeInTheDocument();
  });

  it('submit button is initially disabled (empty form)', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /set password/i })).toBeDisabled();
  });
});

describe('FirstPasswordChangePage — password rules', () => {
  it('shows password rules when typing', () => {
    renderPage();
    const input = screen.getByLabelText(/new password/i);
    fireEvent.change(input, { target: { value: 'A' } });

    // All rule indicators should appear
    expect(screen.getByTestId('rule-length')).toBeInTheDocument();
    expect(screen.getByTestId('rule-uppercase')).toBeInTheDocument();
    expect(screen.getByTestId('rule-lowercase')).toBeInTheDocument();
    expect(screen.getByTestId('rule-digit')).toBeInTheDocument();
    expect(screen.getByTestId('rule-special')).toBeInTheDocument();
  });

  it('updates rule indicators in real-time', () => {
    renderPage();
    const input = screen.getByLabelText(/new password/i);

    // Type a password with all rules passing
    fireEvent.change(input, { target: { value: 'Abcdefgh1!' } });

    const lengthRule = screen.getByTestId('rule-length');
    expect(lengthRule.getAttribute('aria-label')).toContain('passed');

    const specialRule = screen.getByTestId('rule-special');
    expect(specialRule.getAttribute('aria-label')).toContain('passed');
  });

  it('submit button enabled when all rules pass and passwords match', () => {
    renderPage();
    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    fireEvent.change(newPasswordInput, { target: { value: 'Abcdefgh1!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'Abcdefgh1!' } });

    expect(screen.getByRole('button', { name: /set password/i })).not.toBeDisabled();
  });

  it('submit button disabled when password has missing rule (no special char)', () => {
    renderPage();
    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    fireEvent.change(newPasswordInput, { target: { value: 'Abcdefgh1' } }); // no special
    fireEvent.change(confirmPasswordInput, { target: { value: 'Abcdefgh1' } });

    expect(screen.getByRole('button', { name: /set password/i })).toBeDisabled();
  });

  it('submit button disabled when passwords do not match', () => {
    renderPage();
    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    fireEvent.change(newPasswordInput, { target: { value: 'Abcdefgh1!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'different!' } });

    expect(screen.getByRole('button', { name: /set password/i })).toBeDisabled();
  });

  it('shows mismatch error when passwords differ', () => {
    renderPage();
    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    fireEvent.change(newPasswordInput, { target: { value: 'Abcdefgh1!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'WrongPass1!' } });

    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
  });
});

describe('FirstPasswordChangePage — submission', () => {
  it('calls authApi.changePassword on valid submission', async () => {
    vi.mocked(authApi.changePassword).mockResolvedValue(undefined);
    vi.mocked(authApi.me).mockResolvedValue({ ...mockUser, mustChangePassword: false });

    renderPage();
    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    fireEvent.change(newPasswordInput, { target: { value: 'Abcdefgh1!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'Abcdefgh1!' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /set password/i }));
    });

    expect(authApi.changePassword).toHaveBeenCalledWith(
      expect.objectContaining({
        newPassword: 'Abcdefgh1!',
        confirmPassword: 'Abcdefgh1!',
      })
    );
  });

  it('signs out and navigates to /login after successful password change', async () => {
    // Per backend contract (auth-session-revocation-hardening): password change revokes all
    // previously issued tokens. The UI must clear the local session and force fresh login.
    vi.mocked(authApi.changePassword).mockResolvedValue(undefined);

    renderPage();
    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    fireEvent.change(newPasswordInput, { target: { value: 'Abcdefgh1!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'Abcdefgh1!' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /set password/i }));
    });

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });
  });

  it('shows error toast on API failure', async () => {
    vi.mocked(authApi.changePassword).mockRejectedValue(new Error('Change failed'));

    renderPage();
    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    fireEvent.change(newPasswordInput, { target: { value: 'Abcdefgh1!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'Abcdefgh1!' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /set password/i }));
    });

    await waitFor(() => expect(toastMock.error).toHaveBeenCalled());
  });
});
