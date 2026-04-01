/**
 * Tests for LoginPage
 *
 * Covers:
 *  - Renders email, password, and companyCode fields
 *  - Submit button starts in enabled state
 *  - Shows loading state during submission
 *  - Triggers o-shake animation class on error
 *  - Calls signIn with correct credentials
 *  - Navigates to /hub on successful login
 *  - Navigates to /mfa when requiresMfa is true — passes credentials (not tempToken)
 *  - Navigates to /change-password when mustChangePassword is true
 *  - Shows toast error on invalid-credential failure (AUTH_001) — VAL-AUTH-001
 *  - Shows distinct lockout banner on lockout (AUTH_005) — VAL-AUTH-002
 *  - Shows runtime denial banner on TENANT_ON_HOLD/TENANT_BLOCKED — VAL-AUTH-003
 *  - Handles MFA redirect via 428 error — passes credentials to /mfa
 *  - Restores intended destination after login when accessible — VAL-CROSS-002
 *  - Falls back to role-based default when intended destination is inaccessible
 *  - Passes intendedDestination to MFA pending state for corridor preservation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from '../LoginPage';

// ─────────────────────────────────────────────────────────────────────────────
// Mock dependencies
// ─────────────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockSignIn = vi.fn();
const mockToastError = vi.fn();

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ signIn: mockSignIn }),
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
  mfaEnabled: false,
  mustChangePassword: false,
};

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  // Mock sessionStorage
  const ss: Record<string, string> = {};
  vi.stubGlobal('sessionStorage', {
    getItem: (k: string) => ss[k] ?? null,
    setItem: (k: string, v: string) => { ss[k] = v; },
    removeItem: (k: string) => { delete ss[k]; },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('LoginPage — rendering', () => {
  it('renders email field', () => {
    renderLoginPage();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
  });

  it('renders password field', () => {
    renderLoginPage();
    expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument();
  });

  it('renders company code field', () => {
    renderLoginPage();
    expect(screen.getByLabelText(/company code/i)).toBeInTheDocument();
  });

  it('company code defaults to empty string', () => {
    renderLoginPage();
    const input = screen.getByLabelText(/company code/i) as HTMLInputElement;
    expect(input.value).toBe('');
  });

  it('renders sign in button', () => {
    renderLoginPage();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders forgot password link', () => {
    renderLoginPage();
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
  });
});

describe('LoginPage — successful login', () => {
  it('calls signIn with entered credentials', async () => {
    mockSignIn.mockResolvedValue({
      tokenType: 'Bearer',
      accessToken: 'at',
      refreshToken: 'rt',
      expiresIn: 3600,
      companyCode: 'ORCH',
      displayName: 'Admin User',
      user: mockUser,
    });

    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'admin@bbp.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
      target: { value: 'Password1!' },
    });
    fireEvent.change(screen.getByLabelText(/company code/i), {
      target: { value: 'ORCH' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    });

    expect(mockSignIn).toHaveBeenCalledWith({
      email: 'admin@bbp.com',
      password: 'Password1!',
      companyCode: 'ORCH',
    });
  });

  it('navigates to /hub on successful login', async () => {
    mockSignIn.mockResolvedValue({
      tokenType: 'Bearer',
      accessToken: 'at',
      refreshToken: 'rt',
      expiresIn: 3600,
      companyCode: 'ORCH',
      displayName: 'Admin User',
      user: mockUser,
    });

    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'admin@bbp.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
      target: { value: 'Password1!' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    });

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/hub', { replace: true }));
  });

  it('navigates to /mfa when requiresMfa is true and passes credentials (no tempToken)', async () => {
    mockSignIn.mockResolvedValue({
      tokenType: 'Bearer',
      accessToken: 'at',
      refreshToken: 'rt',
      expiresIn: 3600,
      companyCode: 'ORCH',
      displayName: 'Admin User',
      requiresMfa: true,
      user: mockUser,
    });

    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'mfa@bbp.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
      target: { value: 'Password1!' },
    });
    fireEvent.change(screen.getByLabelText(/company code/i), {
      target: { value: 'ORCH' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        '/mfa',
        expect.objectContaining({
          state: expect.objectContaining({
            email: 'mfa@bbp.com',
            password: 'Password1!',
            companyCode: 'ORCH',
          }),
        })
      );
    });
  });

  it('navigates to /change-password when mustChangePassword is true', async () => {
    mockSignIn.mockResolvedValue({
      tokenType: 'Bearer',
      accessToken: 'at',
      refreshToken: 'rt',
      expiresIn: 3600,
      companyCode: 'ORCH',
      displayName: 'Admin User',
      mustChangePassword: true,
      user: { ...mockUser, mustChangePassword: true },
    });

    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'newuser@bbp.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
      target: { value: 'Password1!' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    });

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/change-password', { replace: true })
    );
  });
});

describe('LoginPage — error handling — VAL-AUTH-001', () => {
  it('shows toast error on invalid credentials (AUTH_001)', async () => {
    const error = Object.assign(new Error('Invalid credentials'), {
      isAxiosError: true,
      response: { status: 401, data: { code: 'AUTH_001', message: 'Invalid credentials' } },
    });
    mockSignIn.mockRejectedValue(error);

    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'bad@bbp.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
      target: { value: 'wrongpass' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    });

    await waitFor(() => expect(mockToastError).toHaveBeenCalled());
    // Should show user-friendly message, not raw code
    const toastMsg = mockToastError.mock.calls[0][0] as string;
    expect(toastMsg).not.toContain('AUTH_001');
    expect(toastMsg.length).toBeGreaterThan(0);
  });

  it('adds o-shake class to form card on credential error', async () => {
    mockSignIn.mockRejectedValue(new Error('Invalid'));

    renderLoginPage();

    const signInBtn = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'bad@bbp.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
      target: { value: 'wrong' },
    });

    await act(async () => {
      fireEvent.click(signInBtn);
    });

    await waitFor(() => {
      expect(document.querySelector('.o-shake')).toBeTruthy();
    });
  });
});

describe('LoginPage — lockout state — VAL-AUTH-002', () => {
  it('shows distinct lockout banner (not toast) on AUTH_005', async () => {
    const error = Object.assign(new Error('Account locked'), {
      isAxiosError: true,
      response: { status: 401, data: { code: 'AUTH_005', message: 'Account locked' } },
    });
    mockSignIn.mockRejectedValue(error);

    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'locked@bbp.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
      target: { value: 'wrongpass' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    });

    // Lockout shows banner, not toast
    await waitFor(() => {
      expect(screen.getByTestId('lockout-banner')).toBeInTheDocument();
    });
    // toast should NOT be called for lockout
    expect(mockToastError).not.toHaveBeenCalled();
  });

  it('disables submit button when lockout banner is showing', async () => {
    const error = Object.assign(new Error('Account locked'), {
      isAxiosError: true,
      response: { status: 401, data: { code: 'AUTH_005', message: 'Account locked' } },
    });
    mockSignIn.mockRejectedValue(error);

    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'locked@bbp.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
      target: { value: 'wrongpass' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    });

    await waitFor(() => {
      expect(screen.getByTestId('lockout-banner')).toBeInTheDocument();
    });

    // Submit button should be disabled
    expect(screen.getByRole('button', { name: /sign in/i })).toBeDisabled();
  });

  it('lockout message is distinct from invalid-credentials message', async () => {
    const error = Object.assign(new Error('Account locked'), {
      isAxiosError: true,
      response: { status: 401, data: { code: 'AUTH_005', message: 'Account locked' } },
    });
    mockSignIn.mockRejectedValue(error);

    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'x@x.com' } });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), { target: { value: 'p' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    });

    await waitFor(() => {
      const banner = screen.getByTestId('lockout-banner');
      // Lockout banner text must NOT say "Invalid email or password"
      expect(banner.textContent).not.toContain('Invalid email or password');
      // Must mention lockout concept
      expect(banner.textContent?.toLowerCase()).toMatch(/lock/);
    });
  });
});

describe('LoginPage — runtime denial states — VAL-AUTH-003', () => {
  const runtimeCodes = [
    { code: 'TENANT_ON_HOLD', expectedPattern: /temporarily unavailable|on hold/i },
    { code: 'TENANT_BLOCKED', expectedPattern: /blocked|contact support/i },
    { code: 'TENANT_REQUEST_RATE_EXCEEDED', expectedPattern: /too many requests|wait/i },
  ];

  runtimeCodes.forEach(({ code, expectedPattern }) => {
    it(`shows runtime denial banner for ${code} — distinct from credential error`, async () => {
      const error = Object.assign(new Error('Denied'), {
        isAxiosError: true,
        response: { status: 403, data: { code, message: 'Denied' } },
      });
      mockSignIn.mockRejectedValue(error);

      renderLoginPage();

      fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'u@x.com' } });
      fireEvent.change(screen.getByPlaceholderText(/enter your password/i), { target: { value: 'p' } });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      });

      await waitFor(() => {
        const banner = screen.getByTestId('runtime-denial-banner');
        expect(banner.textContent).toMatch(expectedPattern);
      });

      // toast should NOT be called for runtime denial
      expect(mockToastError).not.toHaveBeenCalled();
    });
  });

  it('runtime denial message does not look like invalid credentials', async () => {
    const error = Object.assign(new Error('Denied'), {
      isAxiosError: true,
      response: { status: 403, data: { code: 'TENANT_ON_HOLD', message: 'Denied' } },
    });
    mockSignIn.mockRejectedValue(error);

    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'u@x.com' } });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), { target: { value: 'p' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    });

    await waitFor(() => {
      const banner = screen.getByTestId('runtime-denial-banner');
      expect(banner.textContent).not.toContain('Invalid email or password');
    });
  });
});

describe('LoginPage — MFA redirect via 428 error', () => {
  it('navigates to /mfa with credentials (email, password, companyCode) extracted from 428', async () => {
    const error = Object.assign(new Error('MFA required'), {
      isAxiosError: true,
      response: {
        status: 428,
        data: { code: 'AUTH_007', message: 'MFA verification required' },
      },
    });
    mockSignIn.mockRejectedValue(error);

    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'mfa@bbp.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
      target: { value: 'Password1!' },
    });
    fireEvent.change(screen.getByLabelText(/company code/i), {
      target: { value: 'ORCH' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        '/mfa',
        expect.objectContaining({
          state: expect.objectContaining({
            email: 'mfa@bbp.com',
            password: 'Password1!',
            companyCode: 'ORCH',
          }),
        })
      );
    });
  });

  it('passes credentials to /mfa even when no explicit challenge data in response body', async () => {
    // 428 with no extra body data — credentials still passed
    const error = Object.assign(new Error('MFA required'), {
      isAxiosError: true,
      response: { status: 428, data: {} },
    });
    mockSignIn.mockRejectedValue(error);

    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'mfa@bbp.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
      target: { value: 'Password1!' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/mfa', expect.anything());
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Intended destination restoration — VAL-CROSS-002
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Render LoginPage with a router state that simulates being redirected from
 * a protected deep link (e.g. RequirePortal sets state.from before redirect).
 */
function renderLoginPageWithFrom(from: string) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/login', state: { from } }]}>
      <LoginPage />
    </MemoryRouter>
  );
}

describe('LoginPage — intended destination restoration (VAL-CROSS-002)', () => {
  it('navigates to the intended destination after successful login when accessible', async () => {
    mockSignIn.mockResolvedValue({
      tokenType: 'Bearer',
      accessToken: 'at',
      refreshToken: 'rt',
      expiresIn: 3600,
      companyCode: 'MOCK',
      displayName: 'Admin User',
      // ROLE_ADMIN can access /accounting
      user: mockUser,
    });

    renderLoginPageWithFrom('/accounting/journals');

    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'admin@bbp.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
      target: { value: 'Password1!' },
    });
    fireEvent.change(screen.getByLabelText(/company code/i), {
      target: { value: 'MOCK' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    });

    // Should navigate to the originally intended deep link, not /hub
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/accounting/journals', { replace: true })
    );
  });

  it('falls back to role-based default when intended destination is inaccessible', async () => {
    mockSignIn.mockResolvedValue({
      tokenType: 'Bearer',
      accessToken: 'at',
      refreshToken: 'rt',
      expiresIn: 3600,
      companyCode: 'MOCK',
      displayName: 'Admin User',
      // ROLE_ADMIN cannot access /superadmin
      user: mockUser,
    });

    // Admin tries to access a superadmin path (e.g. stale bookmark)
    renderLoginPageWithFrom('/superadmin/tenants');

    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'admin@bbp.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
      target: { value: 'Password1!' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    });

    // Falls back to /hub (ROLE_ADMIN default) since /superadmin is off-limits
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/hub', { replace: true })
    );
  });

  it('includes intendedDestination in MFA pending state when from is set — VAL-CROSS-002', async () => {
    mockSignIn.mockResolvedValue({
      tokenType: 'Bearer',
      accessToken: 'at',
      refreshToken: 'rt',
      expiresIn: 3600,
      companyCode: 'MOCK',
      displayName: 'Admin User',
      requiresMfa: true,
      user: mockUser,
    });

    renderLoginPageWithFrom('/accounting/journals');

    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'admin@bbp.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
      target: { value: 'Password1!' },
    });
    fireEvent.change(screen.getByLabelText(/company code/i), {
      target: { value: 'MOCK' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    });

    // The MFA pending state must include intendedDestination so MfaPage can restore it
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        '/mfa',
        expect.objectContaining({
          state: expect.objectContaining({
            email: 'admin@bbp.com',
            password: 'Password1!',
            companyCode: 'MOCK',
            intendedDestination: '/accounting/journals',
          }),
        })
      );
    });
  });

  it('does NOT include intendedDestination when there is no from state', async () => {
    mockSignIn.mockResolvedValue({
      tokenType: 'Bearer',
      accessToken: 'at',
      refreshToken: 'rt',
      expiresIn: 3600,
      companyCode: 'MOCK',
      displayName: 'Admin User',
      requiresMfa: true,
      user: mockUser,
    });

    // Normal render without any from state
    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'admin@bbp.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
      target: { value: 'Password1!' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        '/mfa',
        expect.objectContaining({
          state: expect.not.objectContaining({ intendedDestination: expect.anything() }),
        })
      );
    });
  });

  it('includes intendedDestination in MFA pending state via 428 error path', async () => {
    const error = Object.assign(new Error('MFA required'), {
      isAxiosError: true,
      response: { status: 428, data: { code: 'AUTH_007', message: 'MFA required' } },
    });
    mockSignIn.mockRejectedValue(error);

    renderLoginPageWithFrom('/dealer/invoices');

    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'dealer@bbp.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
      target: { value: 'Password1!' },
    });
    fireEvent.change(screen.getByLabelText(/company code/i), {
      target: { value: 'MOCK' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        '/mfa',
        expect.objectContaining({
          state: expect.objectContaining({
            intendedDestination: '/dealer/invoices',
          }),
        })
      );
    });
  });
});

describe('LoginPage — loading state', () => {
  it('button shows loading text during submission', async () => {
    let resolve!: (value: unknown) => void;
    const pending = new Promise((r) => { resolve = r; });
    mockSignIn.mockReturnValue(pending);

    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'admin@bbp.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
      target: { value: 'Password1!' },
    });

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    });

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /signing in/i })).toBeInTheDocument()
    );

    resolve({
      tokenType: 'Bearer',
      accessToken: 'at',
      refreshToken: 'rt',
      expiresIn: 3600,
      companyCode: 'ORCH',
      displayName: 'Admin User',
      user: mockUser,
    });
  });
});
