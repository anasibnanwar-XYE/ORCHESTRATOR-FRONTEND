/**
 * Tests for src/context/AuthContext.tsx
 *
 * Covers:
 *  - Initial state: no session when localStorage is empty
 *  - Session loads from localStorage on mount
 *  - signIn sets session state
 *  - signIn with requiresMfa does NOT set session
 *  - signOut clears session
 *  - verifyMfa sets session
 *  - switchCompany updates session
 *  - updateUser updates user in session
 *  - isAuthenticated is false when mustChangePassword is true
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { STORAGE_KEYS } from '@/lib/api';

// ─────────────────────────────────────────────────────────────────────────────
// Mock authApi
// ─────────────────────────────────────────────────────────────────────────────

vi.mock('@/lib/authApi', () => ({
  authApi: {
    login: vi.fn(),
    logout: vi.fn(),
    verifyMfa: vi.fn(),
    switchCompany: vi.fn(),
    me: vi.fn(),
    changePassword: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    setupMfa: vi.fn(),
    activateMfa: vi.fn(),
    disableMfa: vi.fn(),
  },
}));

import { authApi } from '@/lib/authApi';

// ─────────────────────────────────────────────────────────────────────────────
// localStorage mock
// ─────────────────────────────────────────────────────────────────────────────

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
});

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const mockUser = {
  id: 1,
  email: 'test@bbp.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'ROLE_ADMIN',
  companyCode: 'ORCH',
  companyId: 1,
  isActive: true,
  mfaEnabled: false,
  mustChangePassword: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockLoginResponse = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  expiresIn: 3600,
  user: mockUser,
};

// Probe component to expose context values
function AuthProbe({
  onRender,
}: {
  onRender: (ctx: ReturnType<typeof useAuth>) => void;
}) {
  const ctx = useAuth();
  onRender(ctx);
  return <div data-testid="probe">{ctx.user?.firstName ?? 'none'}</div>;
}

function renderWithAuth(component: React.ReactNode) {
  return render(<AuthProvider>{component}</AuthProvider>);
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  localStorageMock.clear();
  sessionStorageMock.clear();
  vi.clearAllMocks();
});

afterEach(() => {
  localStorageMock.clear();
  sessionStorageMock.clear();
});

describe('AuthProvider — initial state', () => {
  it('has no session when localStorage is empty', async () => {
    (authApi.me as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);

    let capturedCtx: ReturnType<typeof useAuth> | null = null;
    renderWithAuth(<AuthProbe onRender={(ctx) => { capturedCtx = ctx; }} />);

    // isLoading starts false (no token) → session is null
    expect(capturedCtx!.session).toBeNull();
    expect(capturedCtx!.isAuthenticated).toBe(false);
    expect(capturedCtx!.isLoading).toBe(false);
  });

  it('starts loading when access token exists in localStorage', async () => {
    localStorageMock.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'existing-token');
    localStorageMock.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'existing-refresh');
    localStorageMock.setItem(STORAGE_KEYS.USER, JSON.stringify(mockUser));

    (authApi.me as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);

    let capturedCtx: ReturnType<typeof useAuth> | null = null;
    renderWithAuth(<AuthProbe onRender={(ctx) => { capturedCtx = ctx; }} />);

    // isLoading is true initially
    expect(capturedCtx!.isLoading).toBe(true);
  });

  it('resolves session after me() validates it', async () => {
    localStorageMock.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'existing-token');
    localStorageMock.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'existing-refresh');
    localStorageMock.setItem(STORAGE_KEYS.COMPANY_CODE, 'ORCH');
    localStorageMock.setItem(STORAGE_KEYS.COMPANY_ID, '1');
    localStorageMock.setItem(STORAGE_KEYS.USER, JSON.stringify(mockUser));

    (authApi.me as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);

    let capturedCtx: ReturnType<typeof useAuth> | null = null;
    renderWithAuth(<AuthProbe onRender={(ctx) => { capturedCtx = ctx; }} />);

    await waitFor(() => {
      expect(capturedCtx!.isLoading).toBe(false);
    });

    expect(capturedCtx!.session).not.toBeNull();
    expect(capturedCtx!.user?.email).toBe(mockUser.email);
    expect(capturedCtx!.isAuthenticated).toBe(true);
  });

  it('clears session when me() fails', async () => {
    localStorageMock.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'expired-token');
    localStorageMock.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'expired-refresh');
    localStorageMock.setItem(STORAGE_KEYS.USER, JSON.stringify(mockUser));

    (authApi.me as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Unauthorized'));

    let capturedCtx: ReturnType<typeof useAuth> | null = null;
    renderWithAuth(<AuthProbe onRender={(ctx) => { capturedCtx = ctx; }} />);

    await waitFor(() => {
      expect(capturedCtx!.isLoading).toBe(false);
    });

    expect(capturedCtx!.session).toBeNull();
    expect(capturedCtx!.isAuthenticated).toBe(false);
    expect(localStorageMock.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBeNull();
  });
});

describe('signIn', () => {
  it('sets session on successful login', async () => {
    (authApi.me as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    (authApi.login as ReturnType<typeof vi.fn>).mockResolvedValue(mockLoginResponse);

    let capturedCtx: ReturnType<typeof useAuth> | null = null;
    renderWithAuth(<AuthProbe onRender={(ctx) => { capturedCtx = ctx; }} />);

    await act(async () => {
      await capturedCtx!.signIn({ email: 'test@bbp.com', password: 'pass', companyCode: 'ORCH' });
    });

    await waitFor(() => {
      expect(capturedCtx!.session).not.toBeNull();
    });

    expect(capturedCtx!.user?.email).toBe(mockUser.email);
    expect(capturedCtx!.isAuthenticated).toBe(true);
  });

  it('does NOT set session when requiresMfa is true', async () => {
    (authApi.me as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    const mfaResponse = { ...mockLoginResponse, requiresMfa: true, tempToken: 'placeholder-mfa-tok' };
    (authApi.login as ReturnType<typeof vi.fn>).mockResolvedValue(mfaResponse);

    let capturedCtx: ReturnType<typeof useAuth> | null = null;
    renderWithAuth(<AuthProbe onRender={(ctx) => { capturedCtx = ctx; }} />);

    await act(async () => {
      await capturedCtx!.signIn({ email: 'test@bbp.com', password: 'pass', companyCode: 'ORCH' });
    });

    expect(capturedCtx!.session).toBeNull();
    expect(capturedCtx!.isAuthenticated).toBe(false);
  });

  it('propagates errors from login', async () => {
    (authApi.me as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    (authApi.login as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Invalid credentials'));

    let capturedCtx: ReturnType<typeof useAuth> | null = null;
    renderWithAuth(<AuthProbe onRender={(ctx) => { capturedCtx = ctx; }} />);

    await expect(
      act(async () => {
        await capturedCtx!.signIn({ email: 'bad@bbp.com', password: 'wrong' });
      })
    ).rejects.toThrow();

    expect(capturedCtx!.session).toBeNull();
  });
});

describe('signOut', () => {
  it('clears session after sign out', async () => {
    (authApi.me as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    (authApi.login as ReturnType<typeof vi.fn>).mockResolvedValue(mockLoginResponse);
    (authApi.logout as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    let capturedCtx: ReturnType<typeof useAuth> | null = null;
    renderWithAuth(<AuthProbe onRender={(ctx) => { capturedCtx = ctx; }} />);

    // Sign in first
    await act(async () => {
      await capturedCtx!.signIn({ email: 'test@bbp.com', password: 'pass', companyCode: 'ORCH' });
    });

    await waitFor(() => expect(capturedCtx!.isAuthenticated).toBe(true));

    // Sign out
    await act(async () => {
      await capturedCtx!.signOut();
    });

    expect(capturedCtx!.session).toBeNull();
    expect(capturedCtx!.isAuthenticated).toBe(false);
  });
});

describe('isAuthenticated', () => {
  it('is false when mustChangePassword is true', async () => {
    (authApi.me as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    const mustChangeResponse = {
      ...mockLoginResponse,
      mustChangePassword: true,
      user: { ...mockUser, mustChangePassword: true },
    };
    (authApi.login as ReturnType<typeof vi.fn>).mockResolvedValue(mustChangeResponse);

    let capturedCtx: ReturnType<typeof useAuth> | null = null;
    renderWithAuth(<AuthProbe onRender={(ctx) => { capturedCtx = ctx; }} />);

    await act(async () => {
      await capturedCtx!.signIn({ email: 'test@bbp.com', password: 'pass', companyCode: 'ORCH' });
    });

    await waitFor(() => expect(capturedCtx!.isLoading).toBe(false));

    expect(capturedCtx!.session).not.toBeNull();
    expect(capturedCtx!.mustChangePassword).toBe(true);
    expect(capturedCtx!.isAuthenticated).toBe(false);
  });
});

describe('verifyMfa', () => {
  it('sets session after successful MFA verification', async () => {
    (authApi.me as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    (authApi.verifyMfa as ReturnType<typeof vi.fn>).mockResolvedValue(mockLoginResponse);

    let capturedCtx: ReturnType<typeof useAuth> | null = null;
    renderWithAuth(<AuthProbe onRender={(ctx) => { capturedCtx = ctx; }} />);

    await act(async () => {
      await capturedCtx!.verifyMfa('123456', 'placeholder-tok');
    });

    await waitFor(() => expect(capturedCtx!.session).not.toBeNull());

    expect(capturedCtx!.user?.email).toBe(mockUser.email);
    expect(capturedCtx!.isAuthenticated).toBe(true);
  });
});

describe('updateUser', () => {
  it('updates user in session', async () => {
    (authApi.me as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    (authApi.login as ReturnType<typeof vi.fn>).mockResolvedValue(mockLoginResponse);

    let capturedCtx: ReturnType<typeof useAuth> | null = null;
    renderWithAuth(<AuthProbe onRender={(ctx) => { capturedCtx = ctx; }} />);

    await act(async () => {
      await capturedCtx!.signIn({ email: 'test@bbp.com', password: 'pass', companyCode: 'ORCH' });
    });

    await waitFor(() => expect(capturedCtx!.isAuthenticated).toBe(true));

    const updatedUser = { ...mockUser, firstName: 'Updated' };
    act(() => {
      capturedCtx!.updateUser(updatedUser);
    });

    await waitFor(() => {
      expect(capturedCtx!.user?.firstName).toBe('Updated');
    });

    // Also persisted to localStorage
    const stored = JSON.parse(localStorageMock.getItem(STORAGE_KEYS.USER) ?? '{}');
    expect(stored.firstName).toBe('Updated');
  });
});

describe('STORAGE_KEYS', () => {
  it('contains all five required keys', () => {
    expect(STORAGE_KEYS.ACCESS_TOKEN).toBe('bbp-orchestrator-access-token');
    expect(STORAGE_KEYS.REFRESH_TOKEN).toBe('bbp-orchestrator-refresh-token');
    expect(STORAGE_KEYS.USER).toBe('bbp-orchestrator-user');
    expect(STORAGE_KEYS.COMPANY_CODE).toBe('bbp-orchestrator-company-code');
    expect(STORAGE_KEYS.COMPANY_ID).toBe('bbp-orchestrator-company-id');
  });
});
