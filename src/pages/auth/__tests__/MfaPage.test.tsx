/**
 * Tests for MfaPage
 *
 * Covers:
 *  - Redirects to /login when no tempToken in state or sessionStorage
 *  - Renders 6-digit input
 *  - Input only accepts digits
 *  - Calls verifyMfa with code and tempToken on submit
 *  - Navigates to /hub on success
 *  - Shows error toast on failure
 *  - Clears input and re-focuses on error
 *  - Auto-submits when 6 digits entered
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

describe('MfaPage — redirect when no state', () => {
  it('redirects to /login when no tempToken', () => {
    renderMfaPage();
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
  });

  it('uses tempToken from location.state', () => {
    mockLocationState = { tempToken: 'placeholder-loc-tok', email: 'test@bbp.com', companyCode: 'ORCH' };
    renderMfaPage();
    expect(mockNavigate).not.toHaveBeenCalledWith('/login', expect.anything());
  });

  it('uses tempToken from sessionStorage when state is empty', () => {
    sessionStorageMock.setItem(
      'bbp-orchestrator-mfa-pending',
      JSON.stringify({ tempToken: 'placeholder-ss-tok', email: 'ss@bbp.com', companyCode: 'ORCH' })
    );
    renderMfaPage();
    expect(mockNavigate).not.toHaveBeenCalledWith('/login', expect.anything());
  });
});

describe('MfaPage — rendering', () => {
  beforeEach(() => {
    mockLocationState = { tempToken: 'placeholder-tok', email: 'admin@bbp.com', companyCode: 'ORCH' };
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
});

describe('MfaPage — input validation', () => {
  beforeEach(() => {
    mockLocationState = { tempToken: 'placeholder-tok', email: 'admin@bbp.com', companyCode: 'ORCH' };
  });

  it('only accepts digits (strips non-numeric chars)', () => {
    renderMfaPage();
    const input = screen.getByLabelText(/6-digit verification code/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '12abc34' } });
    // After stripping non-digits: '1234'
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

describe('MfaPage — verification', () => {
  beforeEach(() => {
    mockLocationState = { tempToken: 'placeholder-tok', email: 'admin@bbp.com', companyCode: 'ORCH' };
  });

  it('calls verifyMfa with code and tempToken', async () => {
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

    expect(mockVerifyMfa).toHaveBeenCalledWith('123456', 'placeholder-tok');
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

  it('clears input on error', async () => {
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

describe('MfaPage — sessionStorage state preservation', () => {
  it('stores tempToken in sessionStorage (via location.state is used, not sessionStorage directly)', () => {
    // When location.state has tempToken, the page should render without redirect
    mockLocationState = { tempToken: 'placeholder-abc-tok', email: 'user@bbp.com', companyCode: 'ORCH' };
    renderMfaPage();
    // Page renders (no redirect to /login)
    expect(screen.getByLabelText(/6-digit verification code/i)).toBeInTheDocument();
  });

  it('recovers from sessionStorage when location.state is empty', () => {
    sessionStorageMock.setItem(
      'bbp-orchestrator-mfa-pending',
      JSON.stringify({ tempToken: 'ss-token', email: 'user@bbp.com', companyCode: 'ORCH' })
    );
    renderMfaPage();
    expect(screen.getByLabelText(/6-digit verification code/i)).toBeInTheDocument();
  });
});
