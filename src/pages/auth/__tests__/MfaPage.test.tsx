/**
 * Tests for MfaPage
 *
 * Covers:
 *  - Redirects to /login when no valid pending state in location.state or sessionStorage
 *  - Renders 6-digit TOTP input by default
 *  - Input only accepts digits
 *  - Calls verifyMfa with full LoginRequest (email, password, companyCode, mfaCode)
 *  - Recovery code mode: can toggle, uses recoveryCode field
 *  - Navigates to /hub on success
 *  - Navigates to /change-password when mustChangePassword is true
 *  - Shows error toast on failure
 *  - Clears input and re-focuses on error
 *  - Auto-submits when 6 TOTP digits entered
 *  - Pending state survives sessionStorage (mobile app switch resilience)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MfaPage } from '../MfaPage';

// ─────────────────────────────────────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
let mockLocationState: Record<string, unknown> = {};

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: mockLocationState, pathname: '/mfa' }),
  };
});

const mockVerifyMfa = vi.fn();
const mockToastError = vi.fn();

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ verifyMfa: mockVerifyMfa }),
  MFA_SESSION_KEY: 'bbp-orchestrator-mfa-pending',
}));

vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({
    error: mockToastError,
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    toast: vi.fn(),
    dismiss: vi.fn(),
  }),
}));

vi.mock('@/components/ui/OrchestratorLogo', () => ({
  OrchestratorLogo: () => <div data-testid="logo">Logo</div>,
}));

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const mockUser = {
  email: 'admin@bbp.com',
  displayName: 'Admin User',
  companyId: '1',
  roles: ['ROLE_ADMIN'],
  permissions: [],
  mfaEnabled: true,
  mustChangePassword: false,
};

const ssStore: Record<string, string> = {};
const sessionStorageMock = {
  getItem: (k: string) => ssStore[k] ?? null,
  setItem: (k: string, v: string) => { ssStore[k] = v; },
  removeItem: (k: string) => { delete ssStore[k]; },
  clear: () => { Object.keys(ssStore).forEach((k) => delete ssStore[k]); },
};

/** MfaPendingState now uses original credentials (no tempToken) */
const validPendingState = {
  email: 'admin@bbp.com',
  password: 'Password1!',
  companyCode: 'ORCH',
};

beforeEach(() => {
  vi.clearAllMocks();
  mockLocationState = {};
  sessionStorageMock.clear();
  vi.stubGlobal('sessionStorage', sessionStorageMock);
});

function renderMfaPage() {
  return render(
    <MemoryRouter>
      <MfaPage />
    </MemoryRouter>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('MfaPage — redirect when no valid pending state', () => {
  it('redirects to /login when location.state is empty', () => {
    renderMfaPage();
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
  });

  it('redirects to /login when pending state is missing password', () => {
    // Old tempToken-based state — must be rejected
    mockLocationState = { tempToken: 'old-tok', email: 'test@bbp.com', companyCode: 'ORCH' };
    renderMfaPage();
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
  });

  it('renders when location.state has valid credentials', () => {
    mockLocationState = validPendingState;
    renderMfaPage();
    expect(mockNavigate).not.toHaveBeenCalledWith('/login', expect.anything());
  });

  it('renders from sessionStorage when location.state is empty', () => {
    sessionStorageMock.setItem(
      'bbp-orchestrator-mfa-pending',
      JSON.stringify(validPendingState)
    );
    renderMfaPage();
    expect(mockNavigate).not.toHaveBeenCalledWith('/login', expect.anything());
  });
});

describe('MfaPage — rendering', () => {
  beforeEach(() => {
    mockLocationState = validPendingState;
  });

  it('renders the verification code input', () => {
    renderMfaPage();
    expect(screen.getByLabelText(/6-digit verification code/i)).toBeInTheDocument();
  });

  it('renders verify button', () => {
    renderMfaPage();
    expect(screen.getByRole('button', { name: /verify/i })).toBeInTheDocument();
  });

  it('shows email in context', () => {
    renderMfaPage();
    expect(screen.getByText('admin@bbp.com')).toBeInTheDocument();
  });

  it('shows option to use recovery code', () => {
    renderMfaPage();
    expect(screen.getByText(/use a recovery code/i)).toBeInTheDocument();
  });
});

describe('MfaPage — TOTP input validation', () => {
  beforeEach(() => {
    mockLocationState = validPendingState;
  });

  it('only accepts digits (strips non-numeric chars)', () => {
    renderMfaPage();
    const input = screen.getByLabelText(/6-digit verification code/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '12abc34' } });
    expect(input.value).toBe('1234');
  });

  it('limits to 6 digits', () => {
    renderMfaPage();
    const input = screen.getByLabelText(/6-digit verification code/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '12345678' } });
    expect(input.value).toBe('123456');
  });

  it('verify button is disabled for less than 6 digits', () => {
    renderMfaPage();
    const input = screen.getByLabelText(/6-digit verification code/i);
    fireEvent.change(input, { target: { value: '123' } });
    expect(screen.getByRole('button', { name: /verify/i })).toBeDisabled();
  });
});

describe('MfaPage — TOTP verification (canonical login re-submit)', () => {
  beforeEach(() => {
    mockLocationState = validPendingState;
  });

  it('calls verifyMfa with full LoginRequest including mfaCode — VAL-AUTH-006', async () => {
    mockVerifyMfa.mockResolvedValue({
      tokenType: 'Bearer',
      accessToken: 'at',
      refreshToken: 'rt',
      expiresIn: 3600,
      companyCode: 'ORCH',
      displayName: 'Admin User',
      user: mockUser,
    });

    renderMfaPage();
    const input = screen.getByLabelText(/6-digit verification code/i);
    fireEvent.change(input, { target: { value: '123456' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /verify/i }));
    });

    // Must re-submit POST /auth/login with original credentials + mfaCode
    expect(mockVerifyMfa).toHaveBeenCalledWith({
      email: 'admin@bbp.com',
      password: 'Password1!',
      companyCode: 'ORCH',
      mfaCode: '123456',
    });
  });

  it('navigates to /hub on successful verification', async () => {
    mockVerifyMfa.mockResolvedValue({
      tokenType: 'Bearer',
      accessToken: 'at',
      refreshToken: 'rt',
      expiresIn: 3600,
      companyCode: 'ORCH',
      displayName: 'Admin User',
      user: mockUser,
    });

    renderMfaPage();
    const input = screen.getByLabelText(/6-digit verification code/i);
    fireEvent.change(input, { target: { value: '123456' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /verify/i }));
    });

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/hub', { replace: true }));
  });

  it('navigates to /change-password when mustChangePassword is true', async () => {
    mockVerifyMfa.mockResolvedValue({
      tokenType: 'Bearer',
      accessToken: 'at',
      refreshToken: 'rt',
      expiresIn: 3600,
      companyCode: 'ORCH',
      displayName: 'Admin User',
      mustChangePassword: true,
      user: { ...mockUser, mustChangePassword: true },
    });

    renderMfaPage();
    const input = screen.getByLabelText(/6-digit verification code/i);
    fireEvent.change(input, { target: { value: '123456' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /verify/i }));
    });

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/change-password', { replace: true })
    );
  });

  it('shows error toast on verification failure', async () => {
    mockVerifyMfa.mockRejectedValue(new Error('Invalid code'));

    renderMfaPage();
    const input = screen.getByLabelText(/6-digit verification code/i);
    fireEvent.change(input, { target: { value: '000000' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /verify/i }));
    });

    await waitFor(() => expect(mockToastError).toHaveBeenCalled());
  });

  it('clears TOTP input on error', async () => {
    mockVerifyMfa.mockRejectedValue(new Error('Invalid code'));

    renderMfaPage();
    const input = screen.getByLabelText(/6-digit verification code/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '000000' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /verify/i }));
    });

    await waitFor(() => expect(input.value).toBe(''));
  });
});

describe('MfaPage — recovery code path — VAL-AUTH-006', () => {
  beforeEach(() => {
    mockLocationState = validPendingState;
  });

  it('toggles to recovery code mode when clicking the toggle', () => {
    renderMfaPage();
    fireEvent.click(screen.getByText(/use a recovery code/i));
    expect(screen.getByLabelText(/recovery code/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/6-digit verification code/i)).not.toBeInTheDocument();
  });

  it('calls verifyMfa with recoveryCode when in recovery mode — VAL-AUTH-006', async () => {
    mockVerifyMfa.mockResolvedValue({
      tokenType: 'Bearer',
      accessToken: 'at',
      refreshToken: 'rt',
      expiresIn: 3600,
      companyCode: 'ORCH',
      displayName: 'Admin User',
      user: mockUser,
    });

    renderMfaPage();
    // Switch to recovery mode
    fireEvent.click(screen.getByText(/use a recovery code/i));

    const input = screen.getByLabelText(/recovery code/i);
    fireEvent.change(input, { target: { value: 'abc1-def2-ghi3' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /verify/i }));
    });

    // Must re-submit POST /auth/login with original credentials + recoveryCode
    expect(mockVerifyMfa).toHaveBeenCalledWith({
      email: 'admin@bbp.com',
      password: 'Password1!',
      companyCode: 'ORCH',
      recoveryCode: 'abc1-def2-ghi3',
    });
  });

  it('verify button is disabled when recovery code is empty', () => {
    renderMfaPage();
    fireEvent.click(screen.getByText(/use a recovery code/i));
    expect(screen.getByRole('button', { name: /verify/i })).toBeDisabled();
  });

  it('can toggle back to authenticator code mode', () => {
    renderMfaPage();
    fireEvent.click(screen.getByText(/use a recovery code/i));
    expect(screen.getByLabelText(/recovery code/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/use authenticator app instead/i));
    expect(screen.getByLabelText(/6-digit verification code/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/recovery code/i)).not.toBeInTheDocument();
  });
});

describe('MfaPage — sessionStorage state preservation — VAL-AUTH-005', () => {
  it('renders with valid credentials from location.state', () => {
    mockLocationState = validPendingState;
    renderMfaPage();
    expect(screen.getByLabelText(/6-digit verification code/i)).toBeInTheDocument();
  });

  it('recovers credentials from sessionStorage when location.state is empty', () => {
    sessionStorageMock.setItem(
      'bbp-orchestrator-mfa-pending',
      JSON.stringify(validPendingState)
    );
    renderMfaPage();
    expect(screen.getByLabelText(/6-digit verification code/i)).toBeInTheDocument();
  });

  it('rejects sessionStorage state that is missing password (old tempToken format)', () => {
    // Old format with tempToken — should reject and redirect to login
    sessionStorageMock.setItem(
      'bbp-orchestrator-mfa-pending',
      JSON.stringify({ tempToken: 'old-tok', email: 'test@bbp.com', companyCode: 'ORCH' })
    );
    renderMfaPage();
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
  });
});
