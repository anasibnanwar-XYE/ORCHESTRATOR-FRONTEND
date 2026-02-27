import { useCallback, useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import clsx from 'clsx';
import LoginPage from './pages/LoginPage';
import MfaPage from './pages/MfaPage';
import FirstPasswordChangePage from './pages/FirstPasswordChangePage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import UserManagementPage from './pages/UserManagementPage';
import OperationsControlPage from './pages/OperationsControlPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import ApprovalsPage from './pages/ApprovalsPage';
import AdminLayout from './layouts/AdminLayout';
import AccountingLayout from './layouts/AccountingLayout';
import FactoryLayout from './layouts/FactoryLayout';
import SalesLayout from './layouts/SalesLayout';
import DealerLayout from './layouts/DealerLayout';
import SuperadminLayout from './layouts/SuperadminLayout';
import PortalHubPage from './pages/PortalHubPage';
import SuperadminDashboardPage from './pages/superadmin/SuperadminDashboardPage';
import SuperadminTenantsPage from './pages/superadmin/TenantsPage';
import SuperadminPlatformRolesPage from './pages/superadmin/PlatformRolesPage';
import SuperadminAuditPage from './pages/superadmin/AuditPage';
import RolesPage from './pages/admin/RolesPage';
import CompaniesPage from './pages/admin/CompaniesPage';
import EmployeesPage from './pages/admin/EmployeesPage';
import AttendancePage from './pages/admin/AttendancePage';
import PayrollPage from './pages/admin/PayrollPage';
import AccountingPayrollPage from './pages/accounting/PayrollPage';
import AccountingDashboardPage from './pages/accounting/AccountingDashboardPage';
import JournalTabsPage from './pages/accounting/JournalTabsPage';
import AccountsPage from './pages/accounting/AccountsPage';
import AccountingReportsPage from './pages/accounting/ReportsPage';
import CatalogPage from './pages/accounting/CatalogPage';
import DealersPage from './pages/accounting/DealersPage';
import ConfigHealthPage from './pages/accounting/ConfigHealthPage';
import InvoicesPage from './pages/accounting/InvoicesPage';
import ProcurementPage from './pages/accounting/ProcurementPage';
import PeriodsPage from './pages/accounting/PeriodsPage';
import AccountingInventoryPage from './pages/accounting/AccountingInventoryPage';
import AccountingEmployeesPage from './pages/accounting/AccountingEmployeesPage';
import FactoryDashboardPage from './pages/factory/FactoryDashboardPage';
import ProductionPage from './pages/factory/ProductionPage';
import PackingPage from './pages/factory/PackingPage';
import InventoryPage from './pages/factory/InventoryPage';
import ConfigurationPage from './pages/factory/ConfigurationPage';
import SalesReturnsPage from './pages/sales/ReturnsPage';
import SalesDashboardPage from './pages/sales/SalesDashboardPage';
import SalesDealersPage from './pages/sales/DealersPage';
import SalesOrdersPage from './pages/sales/OrdersPage';
import SalesPromotionsPage from './pages/sales/PromotionsPage';
import SalesCreditRequestsPage from './pages/sales/CreditRequestsPage';
import SalesInvoicesPage from './pages/sales/InvoicesPage';
import SalesTargetsPage from './pages/sales/TargetsPage';
import DealerReceivablesPage from './pages/sales/DealerReceivablesPage';
import CreditOverridesPage from './pages/sales/CreditOverridesPage';
import DispatchPage from './pages/sales/DispatchPage';
import DealerDashboardPage from './pages/dealer/DealerDashboardPage';
// import AccountLedgerPage from './pages/dealer/AccountLedgerPage';
import OrdersPage from './pages/dealer/OrdersPage';
import DealerInvoicesPage from './pages/dealer/InvoicesPage';
import DealerLedgerPage from './pages/dealer/LedgerPage';
import DealerAgingPage from './pages/dealer/AgingPage';
import DealerCreditRequestsPage from './pages/dealer/CreditRequestsPage';
import DealerPromotionsPage from './pages/dealer/PromotionsPage';
import DealerProfilePage from './pages/dealer/DealerProfilePage';
import WelcomeLoader from './components/WelcomeLoader';
import AccessibilityDock from './components/AccessibilityDock';
import { AuthProvider } from './context/AuthContext';
import { setApiSession } from './lib/api';
import {
  login as authLogin,
  logout as authLogout,
  getMe as authGetMe,
  keepAlive as authKeepAlive,
  extractAuthError,
} from './lib/authApi';
import type { AuthSuccess, AuthenticatedUser, LoginCredentials, MeResponse, PortalAccessState } from './types/auth';
import { resolvePortalAccess, shouldShowPortalSelection } from './types/portal-routing';

const ALLOW_OFFLINE_AUTH = import.meta.env.DEV && String(import.meta.env.VITE_ALLOW_OFFLINE ?? '').toLowerCase() === 'true';
const SESSION_STORAGE_KEY = 'bbp-orchestrator-session';
const THEME_STORAGE_KEY = 'bbp-orchestrator-theme';
const MFA_STORAGE_KEY = 'bbp-orchestrator-mfa';
const KEEPALIVE_INTERVAL_MS = 4 * 60 * 1000; // 4 minutes
interface StoredSessionPayload {
  session: AuthSuccess;
  email?: string;
}

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> => {
  let timer: number | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = window.setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) window.clearTimeout(timer);
  }
};

const isAuthResponse = (value: unknown): value is AuthSuccess =>
  !!value &&
  typeof value === 'object' &&
  typeof (value as Record<string, unknown>).accessToken === 'string' &&
  typeof (value as Record<string, unknown>).refreshToken === 'string';

const readStoredSession = (): StoredSessionPayload | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  const serialized = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!serialized) {
    return null;
  }
  try {
    const parsed = JSON.parse(serialized) as StoredSessionPayload;
    if (parsed?.session?.accessToken && parsed?.session?.refreshToken) {
      return parsed;
    }
  } catch {
    // swallow JSON errors and clear invalid cache
  }
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
  return null;
};

const persistStoredSession = (payload: StoredSessionPayload | null) => {
  if (typeof window === 'undefined') {
    return;
  }
  if (!payload) {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
};

type Theme = 'dark' | 'light';

const readStoredTheme = (): Theme | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === 'dark' || stored === 'light' ? stored : null;
};

const persistThemePreference = (value: Theme) => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(THEME_STORAGE_KEY, value);
};

const resolveProfile = async (sessionSnapshot: AuthSuccess, fallbackEmail: string): Promise<AuthenticatedUser> => {
  try {
    // Use the profileApi function for consistency
    const { getCurrentUserProfile } = await import('./lib/profileApi');
    const me = await getCurrentUserProfile(sessionSnapshot);
    return {
      displayName: me.displayName ?? sessionSnapshot.displayName ?? fallbackEmail,
      email: me.email ?? fallbackEmail,
      companyCode: me.companyId ?? sessionSnapshot.companyCode,
      mfaEnabled: me.mfaEnabled,
      roles: me.roles ?? [],
      permissions: me.permissions ?? [],
      expiresIn: sessionSnapshot.expiresIn,
      mustChangePassword: me.mustChangePassword ?? sessionSnapshot.mustChangePassword ?? false,
    };
  } catch (error) {
    if (ALLOW_OFFLINE_AUTH) {
      return {
        displayName: sessionSnapshot.displayName ?? fallbackEmail,
        email: fallbackEmail,
        companyCode: sessionSnapshot.companyCode,
        mfaEnabled: false,
        // Provide full portal access in offline demo mode so the UI can be explored without a backend.
        roles: ['ROLE_ADMIN', 'ROLE_ACCOUNTING', 'ROLE_FACTORY', 'ROLE_SALES', 'ROLE_DEALER'],
        permissions: ['*'],
        expiresIn: sessionSnapshot.expiresIn,
        mustChangePassword: false,
      };
    }
    throw error instanceof Error ? error : new Error('Unable to load user profile.');
  }
};

export default function App() {
  const [theme, setTheme] = useState<Theme>(() => readStoredTheme() ?? 'light');
  const [initializing, setInitializing] = useState(true);
  const [brightness, setBrightness] = useState(1);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeUser, setActiveUser] = useState<AuthenticatedUser | null>(null);
  const [session, setSession] = useState<AuthSuccess | null>(null);
  const [showLoader, setShowLoader] = useState(false);
  const [accessibilityEnabled, setAccessibilityEnabled] = useState(true);
  const [step, setStep] = useState<'login' | 'mfa' | 'change-password-first' | 'forgot-password' | 'forgot-password-superadmin' | 'reset-password'>('login');
  const [pendingBase, setPendingBase] = useState<Pick<LoginCredentials, 'email' | 'password' | 'companyCode'> | null>(null);
  const [tempToken, setTempToken] = useState<string | null>(null);

  useEffect(() => {
    setApiSession(session);
  }, [session]);

  // Dismiss the HTML pre-React splash once React has mounted
  useEffect(() => {
    const splash = document.getElementById('app-splash');
    if (splash) {
      splash.classList.add('hide');
      setTimeout(() => splash.remove(), 400);
    }
  }, []);

  const persistMfaState = (value: { email: string; password: string; companyCode: string } | null) => {
    if (typeof window === 'undefined') return;
    if (!value) {
      // Clear both localStorage and sessionStorage
      window.localStorage.removeItem(MFA_STORAGE_KEY);
      window.sessionStorage.removeItem('bbp-orchestrator-mfa-pending');
      return;
    }
    // Store in both localStorage (for email/companyCode) and sessionStorage (for password)
    // sessionStorage persists across app switches on mobile, localStorage persists across browser sessions
    window.localStorage.setItem(MFA_STORAGE_KEY, JSON.stringify({ email: value.email, companyCode: value.companyCode, ts: Date.now() }));
    window.sessionStorage.setItem('bbp-orchestrator-mfa-pending', JSON.stringify({ ...value, ts: Date.now() }));
  };

  const readMfaState = (): { email: string; password: string; companyCode: string } | null => {
    if (typeof window === 'undefined') return null;
    // Try sessionStorage first (has password), fallback to localStorage (email/companyCode only)
    try {
      const sessionRaw = window.sessionStorage.getItem('bbp-orchestrator-mfa-pending');
      if (sessionRaw) {
        const parsed = JSON.parse(sessionRaw) as { email: string; password: string; companyCode: string; ts?: number };
        // Only restore if stored within last 10 minutes
        if (parsed?.email && parsed?.password && parsed?.companyCode) {
          if (parsed.ts && Date.now() - parsed.ts < 10 * 60 * 1000) {
            return { email: parsed.email, password: parsed.password, companyCode: parsed.companyCode };
          } else {
            // Expired, clear it
            window.sessionStorage.removeItem('bbp-orchestrator-mfa-pending');
            window.localStorage.removeItem(MFA_STORAGE_KEY);
          }
        }
      }
    } catch { }

    // Fallback to localStorage (legacy, no password)
    try {
      const raw = window.localStorage.getItem(MFA_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { email: string; companyCode: string; ts?: number };
        if (parsed?.email && parsed?.companyCode) {
          // Return without password - user will need to re-enter it
          return { email: parsed.email, password: '', companyCode: parsed.companyCode };
        }
      }
    } catch { }
    return null;
  };

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const isDark = theme === 'dark';
    root.classList.toggle('dark', isDark);
    body.classList.toggle('dark', isDark);
    body.classList.toggle('light', !isDark);
    root.dataset.theme = theme;
    body.dataset.theme = theme;
    persistThemePreference(theme);
  }, [theme]);

  useEffect(() => {
    // Apply to html to ensure it covers everything including portals and isn't overridden by body styles
    document.documentElement.style.filter = `brightness(${brightness})`;
    return () => {
      document.documentElement.style.filter = '';
    };
  }, [brightness]);
  // Keep session alive on mobile/desktop while app is open or backgrounded briefly
  useEffect(() => {
    if (!session) return;
    let timer: number | undefined;

    const sendKeepAlive = async () => {
      try {
        // Use the generated client for the full keepalive (can inspect mustChangePassword)
        const me = await authGetMe();
        // Check if mustChangePassword flag is set
        if (step !== 'change-password-first') {
          const mustChange = me?.mustChangePassword;
          if (mustChange && isAuthenticated && activeUser && !activeUser.mustChangePassword) {
            setTempToken(session.accessToken);
            setPendingBase({
              email: activeUser.email,
              password: '',
              companyCode: activeUser.companyCode,
            });
            setStep('change-password-first');
          }
        }
      } catch { }
    };

    timer = window.setInterval(sendKeepAlive, KEEPALIVE_INTERVAL_MS);

    const visHandler = () => {
      if (document.visibilityState === 'hidden') {
        // Fire-and-forget keepalive — uses fetch with keepalive:true for page unload safety
        authKeepAlive(session.accessToken, session.tokenType ?? 'Bearer');
      } else {
        sendKeepAlive();
      }
    };
    document.addEventListener('visibilitychange', visHandler);

    const pageHide = () => {
      authKeepAlive(session.accessToken, session.tokenType ?? 'Bearer');
    };
    window.addEventListener('pagehide', pageHide);

    return () => {
      if (timer) window.clearInterval(timer);
      document.removeEventListener('visibilitychange', visHandler);
      window.removeEventListener('pagehide', pageHide);
    };
  }, [session, isAuthenticated, activeUser, step]);

  useEffect(() => {
    // Check for reset password token in URL
    if (typeof window !== 'undefined' && !isAuthenticated) {
      try {
        // Safely parse the URL to avoid decodeURI errors
        const url = new URL(window.location.href);
        const params = new URLSearchParams(url.search);
        const resetToken = params.get('token');
        if (resetToken) {
          setStep('reset-password');
          setInitializing(false);
          return;
        }
      } catch (err) {
        // If URL parsing fails, try a simpler approach
        console.warn('Failed to parse URL for reset token:', err);
        try {
          const search = window.location.search;
          if (search) {
            const match = search.match(/[?&]token=([^&]+)/);
            if (match && match[1]) {
              setStep('reset-password');
              setInitializing(false);
              return;
            }
          }
        } catch {
          // Ignore errors in fallback parsing
        }
      }
    }

    let cancelled = false;
    const cached = readStoredSession();
    if (!cached) {
      // If we were in the middle of MFA, resume that step so users don't get stuck on mobile refresh
      // If we were in the middle of MFA, resume that step so users don't get stuck on mobile refresh/app switch
      const pending = readMfaState();
      if (pending && pending.email && pending.companyCode) {
        // Restore credentials from storage (password may be empty if from old localStorage entry)
        setPendingBase({
          email: pending.email,
          password: pending.password || '',
          companyCode: pending.companyCode
        });
        setStep('mfa');
      }
      setInitializing(false);
      return;
    }
    (async () => {
      try {
        const profile = await withTimeout(
          resolveProfile(
            cached.session,
            cached.email ?? cached.session.displayName ?? cached.session.companyCode
          ),
          10000,
          'Session restore'
        );
        if (cancelled) {
          return;
        }

        // Check if user must change password - redirect to password change screen IMMEDIATELY
        if (profile.mustChangePassword || cached.session.mustChangePassword) {
          setTempToken(cached.session.accessToken);
          setPendingBase({
            email: cached.email ?? profile.email ?? '',
            password: cached.session.accessToken || '', // Pre-fill with temp token for reference
            companyCode: cached.session.companyCode,
          });
          setStep('change-password-first');
          setInitializing(false);
          return;
        }

        setSession(cached.session);
        setActiveUser(profile);
        setIsAuthenticated(true);

        // Only show welcome loader if we're on login/root routes (fresh login scenario)
        // Skip loader on refresh when user is already on a valid route (enterprise UX)
        const currentPath = window.location.pathname;
        const isOnValidRoute = currentPath && currentPath !== '/' && currentPath !== '/login' && currentPath !== '/signin';
        setShowLoader(!isOnValidRoute);
        setInitializing(false);
      } catch {
        if (!cancelled) {
          persistStoredSession(null);
          persistMfaState(null);
          setInitializing(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const brightnessStyle = useMemo(() => ({ filter: `brightness(${brightness})` }), [brightness]);

  const authenticate = async (credentials: LoginCredentials): Promise<AuthSuccess> => {
    try {
      const requestBody = {
        email: credentials.email,
        password: credentials.password,
        companyCode: credentials.companyCode,
        ...(credentials.mfaCode?.trim() ? { mfaCode: credentials.mfaCode.trim() } : {}),
        ...(credentials.recoveryCode?.trim() ? { recoveryCode: credentials.recoveryCode.trim() } : {}),
      };

      const authData = await authLogin(requestBody);

      if (!isAuthResponse(authData)) {
        throw new Error('Unexpected authentication response from backend.');
      }

      // Check for mustChangePassword flag
      if (authData.mustChangePassword) {
        setTempToken(authData.accessToken!);
        setPendingBase({
          email: credentials.email,
          password: credentials.password,
          companyCode: credentials.companyCode,
        });
        setStep('change-password-first');
        return { ...authData } as AuthSuccess;
      }

      return authData as AuthSuccess;
    } catch (error) {
      // MFA required — switch to MFA step
      if (error instanceof Error && (error as any).mfaRequired) {
        setPendingBase({ email: credentials.email, password: credentials.password, companyCode: credentials.companyCode });
        setStep('mfa');
        persistMfaState({ email: credentials.email, password: credentials.password, companyCode: credentials.companyCode });
        throw error;
      }

      if (ALLOW_OFFLINE_AUTH) {
        return {
          tokenType: 'Bearer',
          accessToken: 'offline-access-token',
          refreshToken: 'offline-refresh-token',
          expiresIn: 3600,
          companyCode: credentials.companyCode,
          displayName: 'Admin',
        };
      }

      // Re-throw with a human-readable message
      throw new Error(extractAuthError(error, "We couldn't sign you in. Check your details and try again."));
    }
  };

  const verifyMfa = async (mfaCode?: string, recoveryCode?: string) => {
    // Try to restore credentials from sessionStorage if pendingBase is missing password (mobile app switch scenario)
    let credentials = pendingBase;
    if (!credentials || !credentials.password) {
      try {
        const stored = window.sessionStorage.getItem('bbp-orchestrator-mfa-pending');
        if (stored) {
          const parsed = JSON.parse(stored) as { email: string; password: string; companyCode: string; ts?: number };
          if (parsed.email && parsed.password && parsed.companyCode) {
            // Only use if stored within last 10 minutes
            if (parsed.ts && Date.now() - parsed.ts < 10 * 60 * 1000) {
              credentials = { email: parsed.email, password: parsed.password, companyCode: parsed.companyCode };
              setPendingBase(credentials);
            } else {
              // Expired
              window.sessionStorage.removeItem('bbp-orchestrator-mfa-pending');
              throw new Error('Session expired. Please login again.');
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes('Session expired')) {
          throw err;
        }
      }
    }

    if (!credentials) throw new Error('No login session to verify. Please login again.');

    const requestBody = {
      email: credentials.email,
      password: credentials.password,
      companyCode: credentials.companyCode,
      ...(mfaCode?.trim() ? { mfaCode: mfaCode.trim() } : {}),
      ...(recoveryCode?.trim() ? { recoveryCode: recoveryCode.trim() } : {}),
    };

    try {
      const authData = await authLogin(requestBody);

      if (!isAuthResponse(authData)) {
        throw new Error('Unexpected authentication response from backend.');
      }

      // Check for mustChangePassword after MFA
      if (authData.mustChangePassword) {
        setTempToken(authData.accessToken!);
        setPendingBase({
          email: credentials.email,
          password: credentials.password,
          companyCode: credentials.companyCode,
        });
        setStep('change-password-first');
        return;
      }

      await handleAuthenticated(authData as AuthSuccess, credentials as LoginCredentials);
      setPendingBase(null);
      setStep('login');
    } catch (error) {
      // Re-throw with human-readable message
      throw new Error(
        extractAuthError(error, 'That verification code is incorrect or expired. Try again or use a recovery code.')
      );
    }
  };

  const handlePasswordChanged = async (newTokens: { accessToken: string; refreshToken: string }) => {
    if (!pendingBase) throw new Error('No login session found.');

    // Create new session with full tokens
    const newSession: AuthSuccess = {
      tokenType: 'Bearer',
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
      expiresIn: 86400, // 24 hours
      companyCode: pendingBase.companyCode,
      displayName: pendingBase.email,
      mustChangePassword: false, // Password changed, flag cleared
    };

    // Refresh profile to ensure mustChangePassword is cleared
    const profile = await withTimeout(resolveProfile(newSession, pendingBase.email), 10000, 'Profile refresh');

    // If mustChangePassword is still true, something went wrong
    if (profile.mustChangePassword) {
      throw new Error('Password change verification failed. Please try again.');
    }

    await handleAuthenticated(newSession, {
      email: pendingBase.email,
      password: '', // Not needed after password change
      companyCode: pendingBase.companyCode,
    });
    setTempToken(null);
    setPendingBase(null);
    setStep('login');
  };

  const handleAuthenticated = async (result: AuthSuccess, credentials: LoginCredentials) => {
    const profile = await withTimeout(resolveProfile(result, credentials.email), 10000, 'Profile load');
    persistStoredSession({ session: result, email: credentials.email });
    setSession(result);
    setActiveUser(profile);
    setIsAuthenticated(true);
    setShowLoader(true);
  };

  const handleSignOut = useCallback(() => {
    if (session?.refreshToken) {
      authLogout(session.refreshToken);
    }
    setSession(null);
    setIsAuthenticated(false);
    setActiveUser(null);
    setBrightness(1);
    setPendingBase(null);
    setShowLoader(false);
    setStep('login');
    persistStoredSession(null);
    persistMfaState(null);
    // Clear remember-session flag on explicit sign-out
    localStorage.removeItem('bbp-orchestrator-remember-session');
  }, [session]);

  const authContextValue = useMemo(
    () => ({ session, user: activeUser, signOut: handleSignOut }),
    [session, activeUser, handleSignOut]
  );
  const dismissWelcomeLoader = useCallback(() => {
    setShowLoader(false);
  }, []);

  // Safety net for desktop/Electron startup: loader must never block beyond a few seconds.
  useEffect(() => {
    if (!showLoader) return;
    const timer = window.setTimeout(() => {
      setShowLoader(false);
    }, 6000);
    return () => window.clearTimeout(timer);
  }, [showLoader]);

  const accessibilityControls = accessibilityEnabled ? (
    <AccessibilityDock
      theme={theme}
      onThemeChange={setTheme}
      brightness={brightness}
      onBrightnessChange={setBrightness}
      onDisable={() => setAccessibilityEnabled(false)}
    />
  ) : null;

  const portalAccess = useMemo<PortalAccessState>(() => resolvePortalAccess(activeUser), [activeUser]);
  const hasPortalAccess = portalAccess.superadmin || portalAccess.admin || portalAccess.accounting || portalAccess.factory || portalAccess.sales || portalAccess.dealer;
  const portalCount = Number(portalAccess.superadmin) + Number(portalAccess.admin) + Number(portalAccess.accounting) + Number(portalAccess.factory) + Number(portalAccess.sales) + Number(portalAccess.dealer);
  const singlePortalDefault = portalAccess.superadmin && !portalAccess.admin && !portalAccess.accounting && !portalAccess.factory && !portalAccess.sales && !portalAccess.dealer
    ? '/superadmin'
    : (!portalAccess.admin && portalAccess.accounting
      ? '/accounting'
      : (!portalAccess.admin && portalAccess.factory
        ? '/factory'
        : (!portalAccess.admin && portalAccess.sales
          ? '/sales'
          : (!portalAccess.admin && portalAccess.dealer ? '/dealer' : '/dashboard'))));
  const defaultLanding = portalCount > 1 ? '/portals' : singlePortalDefault;

  // Ensure that after loader we land on a concrete portal route when at root/login
  useEffect(() => {
    if (!showLoader && isAuthenticated && activeUser) {
      const p = window.location.pathname;
      if (p === '/' || p === '' || p === '/login') {
        try {
          window.history.replaceState(null, '', defaultLanding);
        } catch {
          // ignore history errors
        }
      }
    }
  }, [showLoader, isAuthenticated, activeUser, defaultLanding]);

  // Redirect to correct portal if authenticated but on an invalid portal path
  useEffect(() => {
    if (!showLoader && isAuthenticated && activeUser && portalAccess) {
      const p = window.location.pathname;
      const isOnInvalidPortal =
        (p.startsWith('/superadmin') && !portalAccess.superadmin) ||
        (p.startsWith('/dealer') && !portalAccess.dealer) ||
        (p.startsWith('/factory') && !portalAccess.factory) ||
        (p.startsWith('/sales') && !portalAccess.sales) ||
        (p.startsWith('/accounting') && !portalAccess.accounting) ||
        (p.startsWith('/dashboard') && !portalAccess.admin) ||
        (p.startsWith('/admin') && !portalAccess.admin);
      if (isOnInvalidPortal) {
        try {
          window.history.replaceState(null, '', defaultLanding);
        } catch {
          // ignore history errors
        }
      }
    }
  }, [showLoader, isAuthenticated, activeUser, portalAccess, defaultLanding]);

  // Redirect to login if not authenticated and not on a public route
  useEffect(() => {
    if (initializing) return; // Don't redirect while session is being restored
    if (!isAuthenticated && step === 'login') {
      const p = window.location.pathname;
      const isPublicRoute = p === '/' || p === '' || p === '/login' ||
        p.startsWith('/forgot-password') ||
        p.startsWith('/reset-password');
      if (!isPublicRoute) {
        try {
          window.history.replaceState(null, '', '/login');
        } catch {
          // ignore history errors
        }
      }
    }
  }, [initializing, isAuthenticated, step]);

  // While restoring session, show a minimal branded splash instead of flashing the login page
  if (initializing) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="font-brand text-[10px] font-semibold uppercase tracking-[0.3em] text-tertiary animate-pulse">
            Orchestrator
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !activeUser) {
    return (
      <AuthProvider value={authContextValue}>
        <div className={clsx('min-h-screen transition-colors duration-300 bg-background')}>
          {step === 'change-password-first' && tempToken && pendingBase ? (
            <FirstPasswordChangePage
              theme={theme}
              onThemeChange={setTheme}
              baseCredentials={pendingBase}
              tempToken={tempToken}
              onPasswordChanged={handlePasswordChanged}
            />
          ) : step === 'forgot-password' ? (
            <ForgotPasswordPage
              theme={theme}
              onThemeChange={setTheme}
              onBack={() => setStep('login')}
            />
          ) : step === 'forgot-password-superadmin' ? (
            <ForgotPasswordPage
              theme={theme}
              onThemeChange={setTheme}
              onBack={() => setStep('login')}
              isSuperadmin
            />
          ) : step === 'reset-password' ? (
            <ResetPasswordPage
              theme={theme}
              onThemeChange={setTheme}
              onBack={() => setStep('login')}
              onForgotPassword={() => setStep('forgot-password')}
            />
          ) : step === 'mfa' && pendingBase ? (
            <MfaPage theme={theme} onThemeChange={setTheme} baseCredentials={pendingBase} onVerify={verifyMfa} onBack={() => { setStep('login'); }} />
          ) : (
            <LoginPage
              theme={theme}
              onThemeChange={setTheme}
              authenticate={authenticate}
              onAuthenticated={handleAuthenticated}
              onOpenAccessibility={() => setAccessibilityEnabled(true)}
              onForgotPassword={() => setStep('forgot-password')}
            />
          )}
          {accessibilityControls}
        </div>
      </AuthProvider>
    );
  }

  // Block navigation if mustChangePassword is true - redirect to password change
  if (isAuthenticated && activeUser?.mustChangePassword) {
    if (step !== 'change-password-first') {
      if (session && !tempToken) {
        setTempToken(session.accessToken);
        setPendingBase({
          email: activeUser.email,
          password: '',
          companyCode: activeUser.companyCode,
        });
        setStep('change-password-first');
      }
      return (
        <AuthProvider value={authContextValue}>
          <div className={clsx('min-h-screen transition-colors duration-300 bg-background')}>
            <div className="flex min-h-screen items-center justify-center">
              <div className="text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent mx-auto" />
                <p className="mt-4 text-sm text-secondary">Redirecting to password change...</p>
              </div>
            </div>
          </div>
        </AuthProvider>
      );
    }

    return (
      <AuthProvider value={authContextValue}>
        <div className={clsx('min-h-screen transition-colors duration-300 bg-background')}>
          <FirstPasswordChangePage
            theme={theme}
            onThemeChange={setTheme}
            baseCredentials={pendingBase || { email: activeUser.email, password: '', companyCode: activeUser.companyCode }}
            tempToken={tempToken || session?.accessToken || ''}
            onPasswordChanged={handlePasswordChanged}
          />
          {accessibilityControls}
        </div>
      </AuthProvider>
    );
  }

  if (!hasPortalAccess) {
    return (
      <AuthProvider value={authContextValue}>
        <div
          className={clsx(
            'min-h-screen px-6 py-12 transition-colors duration-300 bg-background text-primary'
          )}
        >
          <div className="mx-auto max-w-md rounded-3xl border border-border bg-surface p-8 text-center shadow-xl">
            <p className="text-sm uppercase tracking-[0.3em] text-secondary">Access pending</p>
            <h1 className="mt-2 text-2xl font-semibold text-primary">No Module Assigned</h1>
            <p className="mt-4 text-sm text-secondary">
              Your account is active but no modules have been assigned. Contact an administrator to assign module access.
            </p>
            <button
              type="button"
              onClick={handleSignOut}
              className="mt-6 w-full rounded-2xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-brand-700"
            >
              Sign out
            </button>
          </div>
          {accessibilityControls}
        </div>
      </AuthProvider>
    );
  }

  return (
    <AuthProvider value={authContextValue}>
      <div className={clsx('relative min-h-screen transition-colors duration-300 bg-background text-primary')}>
        {showLoader && activeUser && (
          <div className="fixed inset-0 z-[10000]">
            <WelcomeLoader displayName={activeUser.displayName} onFinished={dismissWelcomeLoader} />
          </div>
        )}
        <BrowserRouter>
          <Routes>
            <Route index element={<Navigate to={defaultLanding} replace />} />
            <Route path="/login" element={<Navigate to={defaultLanding} replace />} />
            <Route path="/signin" element={<Navigate to={defaultLanding} replace />} />
            <Route
              path="/portals"
              element={
                shouldShowPortalSelection(portalAccess) ? (
                  <PortalHubPage
                    theme={theme}
                    onThemeChange={setTheme}
                    portalAccess={portalAccess}
                    onSignOut={handleSignOut}
                  />
                ) : (
                  <Navigate to={defaultLanding} replace />
                )
              }
            />
            {/* Superadmin control-plane — completely isolated from tenant portals */}
            <Route
              path="/superadmin/*"
              element={
                portalAccess.superadmin ? (
                  <SuperadminLayout theme={theme} onThemeChange={setTheme} />
                ) : (
                  <Navigate to={defaultLanding} replace />
                )
              }
            >
              <Route index element={<SuperadminDashboardPage />} />
              <Route path="tenants" element={<SuperadminTenantsPage />} />
              <Route path="roles" element={<SuperadminPlatformRolesPage />} />
              <Route path="audit" element={<SuperadminAuditPage />} />
              <Route path="*" element={<Navigate to="/superadmin" replace />} />
            </Route>
            {/* Accounting portal as a separate shell (not inside AdminLayout) */}
            <Route
              path="/accounting/*"
              element={
                portalAccess.accounting ? (
                  <AccountingLayout theme={theme} onThemeChange={setTheme} />
                ) : (
                  <Navigate to={defaultLanding} replace />
                )
              }
            >
              {/* Primary routes — 11-item nav */}
              <Route index element={<AccountingDashboardPage />} />
              <Route path="journal" element={<JournalTabsPage />} />
              <Route path="accounts" element={<AccountsPage />} />
              <Route path="invoices" element={<InvoicesPage />} />
              <Route path="dealers" element={<DealersPage />} />
              <Route path="procurement" element={<ProcurementPage />} />
              <Route path="inventory" element={<AccountingInventoryPage />} />
              <Route path="payroll" element={<AccountingPayrollPage />} />
              <Route path="employees" element={<AccountingEmployeesPage />} />
              <Route path="reports" element={<AccountingReportsPage />} />
              <Route path="periods" element={<PeriodsPage />} />

              {/* Kept routes — accessible via command palette and links */}
              <Route path="catalog" element={<CatalogPage />} />
              <Route path="config-health" element={<ConfigHealthPage />} />

              {/* User routes */}
              <Route path="profile" element={<ProfilePage user={activeUser} />} />
              <Route path="settings" element={<SettingsPage />} />

              {/* Legacy redirects — old bookmarks still work */}
              <Route path="transactions" element={<Navigate to="/accounting/journal" replace />} />
              <Route path="ledger" element={<Navigate to="/accounting/journal?tab=ledger" replace />} />
              <Route path="payments" element={<Navigate to="/accounting/journal?tab=payments" replace />} />
              <Route path="partners" element={<Navigate to="/accounting/dealers" replace />} />
              <Route path="suppliers" element={<Navigate to="/accounting/procurement?tab=suppliers" replace />} />
              <Route path="purchase-orders" element={<Navigate to="/accounting/procurement?tab=purchase-orders" replace />} />
              <Route path="goods-receipts" element={<Navigate to="/accounting/procurement?tab=goods-receipts" replace />} />
              <Route path="audit-digest" element={<Navigate to="/accounting/reports" replace />} />
              <Route path="periods-management" element={<Navigate to="/accounting/periods" replace />} />
              <Route path="month-end" element={<Navigate to="/accounting/periods" replace />} />
              <Route path="bank-reconciliation" element={<Navigate to="/accounting/periods" replace />} />
            </Route>

            {/* Sales portal as a separate shell */}
            <Route
              path="/sales/*"
              element={
                portalAccess.sales ? (
                  <SalesLayout theme={theme} onThemeChange={setTheme} />
                ) : (
                  <Navigate to={defaultLanding} replace />
                )
              }
            >
              <Route index element={<SalesDashboardPage />} />
              <Route path="dealers" element={<SalesDealersPage />} />
              <Route path="orders" element={<SalesOrdersPage />} />
              <Route path="promotions" element={<SalesPromotionsPage />} />
              <Route path="credit-requests" element={<SalesCreditRequestsPage />} />
              <Route path="invoices" element={<SalesInvoicesPage />} />
              <Route path="targets" element={<SalesTargetsPage />} />
              <Route path="dealers/:dealerId/receivables" element={<DealerReceivablesPage />} />
              <Route path="credit-overrides" element={<CreditOverridesPage />} />
              <Route path="dispatch" element={<DispatchPage />} />
              <Route path="returns" element={<SalesReturnsPage />} />
              <Route path="*" element={<Navigate to="/sales" replace />} />
            </Route>

            {/* Dealer portal as a separate shell */}
            <Route
              path="/dealer/*"
              element={
                portalAccess.dealer ? (
                  <DealerLayout theme={theme} onThemeChange={setTheme} />
                ) : (
                  <Navigate to={defaultLanding} replace />
                )
              }
            >
              <Route index element={<DealerDashboardPage />} />
              {/* <Route path="ledger" element={<AccountLedgerPage />} /> */}
              <Route path="orders" element={<OrdersPage />} />
              <Route path="invoices" element={<DealerInvoicesPage />} />
              <Route path="ledger" element={<DealerLedgerPage />} />
              <Route path="aging" element={<DealerAgingPage />} />
              <Route path="credit-requests" element={<DealerCreditRequestsPage />} />
              <Route path="promotions" element={<DealerPromotionsPage />} />
              <Route path="profile" element={<DealerProfilePage user={activeUser} />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/dealer" replace />} />
            </Route>

            {/* Factory portal as a separate shell */}
            <Route
              path="/factory/*"
              element={
                portalAccess.factory ? (
                  <FactoryLayout theme={theme} onThemeChange={setTheme} />
                ) : (
                  <Navigate to={defaultLanding} replace />
                )
              }
            >
              <Route index element={<FactoryDashboardPage />} />
              <Route path="production" element={<ProductionPage />} />
              <Route path="packing" element={<PackingPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="config" element={<ConfigurationPage />} />

              {/* Legacy redirects for old bookmarks */}
              <Route path="orders" element={<Navigate to="/factory/production" replace />} />
              <Route path="batches" element={<Navigate to="/factory/production" replace />} />
              <Route path="tasks" element={<Navigate to="/factory/production" replace />} />
              <Route path="packing-queue" element={<Navigate to="/factory/packing" replace />} />
              <Route path="dispatch" element={<Navigate to="/factory/packing" replace />} />
              <Route path="raw-materials" element={<Navigate to="/factory/inventory" replace />} />
              <Route path="finished-goods" element={<Navigate to="/factory/inventory" replace />} />
              <Route path="adjustments" element={<Navigate to="/factory/inventory" replace />} />
              <Route path="packaging-mappings" element={<Navigate to="/factory/config" replace />} />
              <Route path="*" element={<Navigate to="/factory" replace />} />
            </Route>

            {/* Admin portal */}
            <Route
              path="/"
              element={
                portalAccess.admin ? (
                  <AdminLayout user={activeUser} onSignOut={handleSignOut} theme={theme} onThemeChange={setTheme} />
                ) : (
                  <Navigate to={portalAccess.accounting ? '/accounting' : defaultLanding} replace />
                )
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="users" element={<UserManagementPage />} />
              <Route path="roles" element={<RolesPage />} />
              <Route path="companies" element={<CompaniesPage />} />
              <Route path="hr/employees" element={<EmployeesPage />} />
              <Route path="hr/attendance" element={<AttendancePage />} />
              <Route path="hr/payroll" element={<PayrollPage />} />
              <Route path="operations" element={<OperationsControlPage />} />
              <Route path="approvals" element={<ApprovalsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="profile" element={<ProfilePage user={activeUser} />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
            <Route path="*" element={<Navigate to={defaultLanding} replace />} />
          </Routes>
        </BrowserRouter>
        {accessibilityControls}
      </div>
    </AuthProvider>
  );
}

