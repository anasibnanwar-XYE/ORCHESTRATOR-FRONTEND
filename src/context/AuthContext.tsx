/**
 * AuthContext — session management for the entire app.
 *
 * Responsibilities:
 *  - Load/restore session from localStorage on mount
 *  - Validate stored session with GET /auth/me
 *  - 4-minute keepalive interval (fetch with keepalive:true)
 *  - visibilitychange / pagehide handlers
 *  - signIn, signOut, verifyMfa, switchCompany, updateUser actions
 *  - Expose mustChangePassword flag so the app can gate navigation
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { authApi } from '@/lib/authApi';
import { STORAGE_KEYS } from '@/lib/api';
import type { AuthResult, LoginRequest, SwitchCompanyRequest, User } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const KEEPALIVE_INTERVAL_MS = 4 * 60 * 1000; // 4 minutes
export const MFA_SESSION_KEY = 'bbp-orchestrator-mfa-pending';

/**
 * Minimum duration (ms) to show the branded splash screen on cold load.
 * Set to 0 in test/dev environments to keep tests fast and avoid flicker.
 */
const SPLASH_MIN_MS = import.meta.env.MODE === 'test' ? 0 : 700;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken: string;
  companyCode: string;
  companyId: string;
  mustChangePassword: boolean;
  /**
   * Enabled module keys for the user's company.
   * Empty array means all modules are enabled (default).
   */
  enabledModules: string[];
}

export interface MfaPendingState {
  tempToken: string;
  email: string;
  companyCode: string;
}

interface AuthContextValue {
  /** Full session object or null if not authenticated */
  session: AuthSession | null;
  /** Shortcut to session.user */
  user: User | null;
  /** True only when session exists AND mustChangePassword is false */
  isAuthenticated: boolean;
  /** True when session exists but password change is still required */
  mustChangePassword: boolean;
  /** True while the initial session validation is running */
  isLoading: boolean;
  /**
   * Enabled module keys for the current company.
   * Empty array means all modules are enabled (default when no data available).
   */
  enabledModules: string[];
  signIn: (credentials: LoginRequest) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  verifyMfa: (code: string, tempToken: string) => Promise<AuthResult>;
  switchCompany: (data: SwitchCompanyRequest) => Promise<void>;
  updateUser: (user: User) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function loadSessionFromStorage(): AuthSession | null {
  try {
    const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    const userRaw = localStorage.getItem(STORAGE_KEYS.USER);
    const companyCode = localStorage.getItem(STORAGE_KEYS.COMPANY_CODE) ?? '';
    const companyId = localStorage.getItem(STORAGE_KEYS.COMPANY_ID) ?? '';

    if (!accessToken || !refreshToken || !userRaw) return null;

    const user = JSON.parse(userRaw) as User;
    return {
      user,
      accessToken,
      refreshToken,
      companyCode,
      companyId,
      mustChangePassword: user.mustChangePassword ?? false,
      enabledModules: user.enabledModules ?? [],
    };
  } catch {
    return null;
  }
}

function buildSession(result: AuthResult): AuthSession {
  const { accessToken, refreshToken, user, companyCode, mustChangePassword } = result;
  return {
    user,
    accessToken,
    refreshToken,
    // companyCode comes from the flat DTO (LoginResponse); User no longer carries it
    companyCode: companyCode ?? '',
    companyId: user.companyId ?? '',
    mustChangePassword: mustChangePassword ?? false,
    enabledModules: user.enabledModules ?? [],
  };
}

function sendKeepaliveRequest(): void {
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  if (!token) return;

  fetch('/api/v1/auth/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Company-Code': localStorage.getItem(STORAGE_KEYS.COMPANY_CODE) ?? '',
      'X-Company-Id': localStorage.getItem(STORAGE_KEYS.COMPANY_ID) ?? '',
    },
    keepalive: true,
  }).catch(() => {
    // Silent — keepalive failures should not surface to the user
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() =>
    loadSessionFromStorage()
  );
  // Always start loading so the branded splash is shown on every cold load
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // ─── Validate session on mount ─────────────────────────────────────────────
  useEffect(() => {
    const splashStart = Date.now();

    // Ensure the splash is shown for at least SPLASH_MIN_MS before hiding it
    const finishLoading = () => {
      const elapsed = Date.now() - splashStart;
      const remaining = SPLASH_MIN_MS - elapsed;
      if (remaining > 0) {
        setTimeout(() => setIsLoading(false), remaining);
      } else {
        setIsLoading(false);
      }
    };

    if (!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)) {
      finishLoading();
      return;
    }

    authApi
      .me()
      .then((user) => {
        const stored = loadSessionFromStorage();
        if (stored) {
          const updated: AuthSession = {
            ...stored,
            user,
            mustChangePassword: user.mustChangePassword ?? false,
            enabledModules: user.enabledModules ?? stored.enabledModules,
          };
          setSession(updated);
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        }
      })
      .catch(() => {
        // Token is invalid or expired — clear everything
        Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
        setSession(null);
      })
      .finally(() => finishLoading());
  }, []);

  // ─── Keepalive interval ────────────────────────────────────────────────────
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!session) return;

    intervalRef.current = setInterval(sendKeepaliveRequest, KEEPALIVE_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [session]);

  // ─── visibilitychange / pagehide handlers ──────────────────────────────────
  useEffect(() => {
    if (!session) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        sendKeepaliveRequest();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', sendKeepaliveRequest);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', sendKeepaliveRequest);
    };
  }, [session]);

  // ─── Actions ───────────────────────────────────────────────────────────────

  const signIn = useCallback(
    async (credentials: LoginRequest): Promise<AuthResult> => {
      const result = await authApi.login(credentials);

      // requiresMfa means we need to wait for MFA verification before setting session
      if (!result.requiresMfa) {
        setSession(buildSession(result));
      }

      return result;
    },
    []
  );

  const signOut = useCallback(async (): Promise<void> => {
    try {
      await authApi.logout();
    } finally {
      setSession(null);
    }
  }, []);

  const verifyMfa = useCallback(
    async (code: string, tempToken: string): Promise<AuthResult> => {
      const result = await authApi.verifyMfa(code, tempToken);
      setSession(buildSession(result));
      sessionStorage.removeItem(MFA_SESSION_KEY);
      return result;
    },
    []
  );

  const switchCompany = useCallback(
    async (data: SwitchCompanyRequest): Promise<void> => {
      const result = await authApi.switchCompany(data);
      setSession(buildSession(result));
    },
    []
  );

  const updateUser = useCallback((user: User): void => {
    setSession((prev) => {
      if (!prev) return null;
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      return {
        ...prev,
        user,
        enabledModules: user.enabledModules ?? prev.enabledModules,
      };
    });
  }, []);

  // ─── Context value ─────────────────────────────────────────────────────────

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    isAuthenticated: !!session && !session.mustChangePassword,
    mustChangePassword: session?.mustChangePassword ?? false,
    isLoading,
    enabledModules: session?.enabledModules ?? [],
    signIn,
    signOut,
    verifyMfa,
    switchCompany,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
