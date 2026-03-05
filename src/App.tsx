/**
 * App — root routing and auth shell
 *
 * Routes:
 *  /login               → LoginPage (public)
 *  /mfa                 → MfaPage (public, requires tempToken state)
 *  /change-password     → FirstPasswordChangePage (requires session with mustChangePassword)
 *  /forgot-password     → ForgotPasswordPage (public)
 *  /reset-password      → ResetPasswordPage (public, requires ?token=)
 *  /profile             → ProfilePage (requires full authentication)
 *  /hub                 → Placeholder (portal-shell feature will expand this)
 *  /                    → Redirect to /hub or /login
 *
 * Gate logic:
 *  - If isLoading: show splash/loader
 *  - If mustChangePassword: always render FirstPasswordChangePage regardless of route
 *  - If !isAuthenticated on protected route: redirect to /login
 */

import { type ReactNode, useEffect } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ToastProvider } from '@/components/ui/Toast';
import { PageLoader } from '@/components/ui/Loader';
import { LoginPage } from '@/pages/auth/LoginPage';
import { MfaPage } from '@/pages/auth/MfaPage';
import { FirstPasswordChangePage } from '@/pages/auth/FirstPasswordChangePage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { ProfilePage } from '@/pages/auth/ProfilePage';
import { useTheme } from '@/hooks/useTheme';

// ─────────────────────────────────────────────────────────────────────────────
// Theme initialiser — ensures dark class is applied before first paint
// ─────────────────────────────────────────────────────────────────────────────

function ThemeInit() {
  useTheme(); // side-effect only: applies theme to <html>
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Redirect helper — navigates imperatively on auth state change
// ─────────────────────────────────────────────────────────────────────────────

function AuthGate({ children }: { children: ReactNode }) {
  const { isAuthenticated, mustChangePassword, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;

    if (mustChangePassword) {
      // Force to change-password if on a protected route (non-auth route)
      const path = window.location.pathname;
      const publicPaths = ['/login', '/mfa', '/forgot-password', '/reset-password'];
      if (!publicPaths.includes(path) && path !== '/change-password') {
        navigate('/change-password', { replace: true });
      }
    }
  }, [isAuthenticated, mustChangePassword, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface-secondary)]">
        <PageLoader />
      </div>
    );
  }

  return <>{children}</>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Route guards
// ─────────────────────────────────────────────────────────────────────────────

function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, mustChangePassword, isLoading } = useAuth();

  if (isLoading) return null;

  if (mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function RequireGuest({ children }: { children: ReactNode }) {
  const { isAuthenticated, mustChangePassword, isLoading } = useAuth();

  if (isLoading) return null;

  if (mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  if (isAuthenticated) {
    return <Navigate to="/hub" replace />;
  }

  return <>{children}</>;
}

function RequireMustChange({ children }: { children: ReactNode }) {
  const { session, mustChangePassword, isLoading } = useAuth();

  if (isLoading) return null;

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!mustChangePassword) {
    return <Navigate to="/hub" replace />;
  }

  return <>{children}</>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Placeholder portal hub (will be replaced by foundation-portal-shell)
// ─────────────────────────────────────────────────────────────────────────────

function PortalHubPlaceholder() {
  const { user, signOut } = useAuth();
  return (
    <div className="min-h-screen bg-[var(--color-surface-secondary)] flex items-center justify-center p-4">
      <div className="bg-[var(--color-surface-primary)] rounded-2xl border border-[var(--color-border-default)] p-8 text-center max-w-sm w-full shadow-sm">
        <h1 className="text-[17px] font-semibold text-[var(--color-text-primary)] mb-2">
          Welcome back
          {user ? `, ${user.firstName}` : ''}
        </h1>
        <p className="text-[13px] text-[var(--color-text-secondary)] mb-6">
          Portal navigation coming in the next milestone.
        </p>
        <div className="flex gap-2 justify-center">
          <a
            href="/profile"
            className="text-[12px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            My profile
          </a>
          <span className="text-[var(--color-border-default)]">·</span>
          <button
            type="button"
            onClick={() => signOut()}
            className="text-[12px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Router
// ─────────────────────────────────────────────────────────────────────────────

function AppRouter() {
  return (
    <AuthGate>
      <Routes>
        {/* Public auth routes */}
        <Route
          path="/login"
          element={
            <RequireGuest>
              <LoginPage />
            </RequireGuest>
          }
        />
        <Route path="/mfa" element={<MfaPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Password change gate (partially authenticated: has session + mustChangePassword) */}
        <Route
          path="/change-password"
          element={
            <RequireMustChange>
              <FirstPasswordChangePage />
            </RequireMustChange>
          }
        />

        {/* Protected routes */}
        <Route
          path="/hub"
          element={
            <RequireAuth>
              <PortalHubPlaceholder />
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/hub" replace />} />
        <Route path="*" element={<Navigate to="/hub" replace />} />
      </Routes>
    </AuthGate>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <ThemeInit />
          <AppRouter />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
