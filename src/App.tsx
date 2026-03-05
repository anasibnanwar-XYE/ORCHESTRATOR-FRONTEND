/**
 * App — root routing and auth shell.
 *
 * Routes:
 *  /login               → LoginPage (public)
 *  /mfa                 → MfaPage (public, requires tempToken state)
 *  /change-password     → FirstPasswordChangePage (requires session with mustChangePassword)
 *  /forgot-password     → ForgotPasswordPage (public)
 *  /reset-password      → ResetPasswordPage (public, requires ?token=)
 *  /profile             → ProfilePage (requires full authentication)
 *  /hub                 → PortalHubPage (multi-portal users)
 *  /admin/*             → AdminLayout (lazy)
 *  /accounting/*        → AccountingLayout (lazy)
 *  /sales/*             → SalesLayout (lazy)
 *  /factory/*           → FactoryLayout (lazy)
 *  /dealer/*            → DealerLayout (lazy)
 *  /superadmin/*        → SuperadminLayout (lazy, isolated)
 *  /                    → Redirect based on user role
 *
 * Gate logic:
 *  - If isLoading: show WelcomeLoader splash
 *  - If mustChangePassword: gate all routes to /change-password
 *  - If !isAuthenticated on protected route: redirect to /login
 *  - If superadmin: block access to non-superadmin portals
 *  - If not superadmin: block access to /superadmin/*
 */

import { type ReactNode, Suspense, lazy, useEffect } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ToastProvider } from '@/components/ui/Toast';
import { WelcomeLoader, PageLoader } from '@/components/ui/Loader';
import { LoginPage } from '@/pages/auth/LoginPage';
import { MfaPage } from '@/pages/auth/MfaPage';
import { FirstPasswordChangePage } from '@/pages/auth/FirstPasswordChangePage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { ProfilePage } from '@/pages/auth/ProfilePage';
import { PortalHubPage } from '@/pages/hub/PortalHubPage';
import { useTheme } from '@/hooks/useTheme';
import { CommandPaletteProvider } from '@/components/CommandPalette';
import {
  resolvePortalAccess,
  shouldShowHub,
  getDefaultPortalPath,
  canAccessPortal,
} from '@/lib/portal-routing';

// ─────────────────────────────────────────────────────────────────────────────
// Lazy-loaded portal layouts (code splitting per portal chunk)
// ─────────────────────────────────────────────────────────────────────────────

const AdminLayout = lazy(() =>
  import('@/layouts/AdminLayout').then((m) => ({ default: m.AdminLayout }))
);
const AccountingLayout = lazy(() =>
  import('@/layouts/AccountingLayout').then((m) => ({ default: m.AccountingLayout }))
);
const SalesLayout = lazy(() =>
  import('@/layouts/SalesLayout').then((m) => ({ default: m.SalesLayout }))
);
const FactoryLayout = lazy(() =>
  import('@/layouts/FactoryLayout').then((m) => ({ default: m.FactoryLayout }))
);
const DealerLayout = lazy(() =>
  import('@/layouts/DealerLayout').then((m) => ({ default: m.DealerLayout }))
);
const SuperadminLayout = lazy(() =>
  import('@/layouts/SuperadminLayout').then((m) => ({ default: m.SuperadminLayout }))
);

// ─────────────────────────────────────────────────────────────────────────────
// Lazy-loaded portal pages
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Minimal placeholder rendered inside each portal while the
 * actual pages are built in subsequent milestones.
 */
function PortalPlaceholder({ portal }: { portal: string }) {
  return (
    <div className="py-12 text-center">
      <p className="text-[13px] text-[var(--color-text-secondary)]">
        {portal} portal — pages coming soon.
      </p>
    </div>
  );
}

/** Accounting portal — Dashboard */
const AccountingDashboard = lazy(() =>
  import('@/pages/accounting/AccountingDashboardPage').then((m) => ({
    default: m.AccountingDashboardPage,
  }))
);
/** Accounting portal — Chart of Accounts */
const ChartOfAccountsPage = lazy(() =>
  import('@/pages/accounting/ChartOfAccountsPage').then((m) => ({
    default: m.ChartOfAccountsPage,
  }))
);
/** Accounting portal — Journal Entries */
const JournalsPage = lazy(() =>
  import('@/pages/accounting/JournalsPage').then((m) => ({
    default: m.JournalsPage,
  }))
);
/** Accounting portal — Journal Detail */
const JournalDetailPage = lazy(() =>
  import('@/pages/accounting/JournalDetailPage').then((m) => ({
    default: m.JournalDetailPage,
  }))
);
/** Accounting portal — Accounting Periods */
const AccountingPeriodsPage = lazy(() =>
  import('@/pages/accounting/AccountingPeriodsPage').then((m) => ({
    default: m.AccountingPeriodsPage,
  }))
);
/** Accounting portal — Default Accounts */
const DefaultAccountsPage = lazy(() =>
  import('@/pages/accounting/DefaultAccountsPage').then((m) => ({
    default: m.DefaultAccountsPage,
  }))
);
/** Accounting portal — Settlements */
const SettlementsPage = lazy(() =>
  import('@/pages/accounting/SettlementsPage').then((m) => ({
    default: m.SettlementsPage,
  }))
);

// ─────────────────────────────────────────────────────────────────────────────
// Theme initialiser — applies stored theme before first paint
// ─────────────────────────────────────────────────────────────────────────────

function ThemeInit() {
  useTheme(); // side-effect only: applies theme class to <html>
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Suspense fallback
// ─────────────────────────────────────────────────────────────────────────────

function PortalFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--color-surface-secondary)]">
      <PageLoader />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AuthGate — top-level gate that handles loading and forced-change redirect
// ─────────────────────────────────────────────────────────────────────────────

function AuthGate({ children }: { children: ReactNode }) {
  const { isAuthenticated, mustChangePassword, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading) return;

    // When mustChangePassword is set, block ALL routes except /change-password.
    // /mfa, /forgot-password, and /reset-password are not exempted — they are
    // unreachable when authenticated anyway, and a user with a pending forced
    // password change must not bypass the gate via those paths.
    if (mustChangePassword && location.pathname !== '/change-password') {
      navigate('/change-password', { replace: true });
    }
  }, [isAuthenticated, mustChangePassword, isLoading, navigate, location.pathname]);

  if (isLoading) {
    return <WelcomeLoader tagline="Preparing your workspace" />;
  }

  return <>{children}</>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Route guards
// ─────────────────────────────────────────────────────────────────────────────

/** Redirects unauthenticated users to /login. */
function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, mustChangePassword, isLoading } = useAuth();

  if (isLoading) return null;
  if (mustChangePassword) return <Navigate to="/change-password" replace />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

/**
 * Blocks superadmin users from accessing the portal hub and tenant portals.
 * Superadmin users are isolated to /superadmin only.
 */
function RequireNonSuperadmin({ children }: { children: ReactNode }) {
  const { isAuthenticated, mustChangePassword, isLoading, user } = useAuth();

  if (isLoading) return null;
  if (mustChangePassword) return <Navigate to="/change-password" replace />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const access = resolvePortalAccess(user);
  if (access.superadmin) {
    return <Navigate to="/superadmin" replace />;
  }

  return <>{children}</>;
}

/** Redirects authenticated users away from guest-only pages (login, etc.). */
function RequireGuest({ children }: { children: ReactNode }) {
  const { isAuthenticated, mustChangePassword, isLoading, user } = useAuth();

  if (isLoading) return null;
  if (mustChangePassword) return <Navigate to="/change-password" replace />;

  if (isAuthenticated) {
    const access = resolvePortalAccess(user);
    const destination = shouldShowHub(access) ? '/hub' : getDefaultPortalPath(access);
    return <Navigate to={destination} replace />;
  }

  return <>{children}</>;
}

/** Requires a session with mustChangePassword flag. */
function RequireMustChange({ children }: { children: ReactNode }) {
  const { session, mustChangePassword, isLoading } = useAuth();

  if (isLoading) return null;
  if (!session) return <Navigate to="/login" replace />;
  if (!mustChangePassword) {
    const access = resolvePortalAccess(session.user);
    const destination = shouldShowHub(access) ? '/hub' : getDefaultPortalPath(access);
    return <Navigate to={destination} replace />;
  }

  return <>{children}</>;
}

/**
 * Guards a portal section.
 * - Redirects unauthenticated users to /login.
 * - Superadmins are blocked from non-superadmin portals (redirected to /superadmin).
 * - Non-superadmin roles are blocked from /superadmin/* (redirected to /hub or their portal).
 */
function RequirePortal({
  children,
  pathPrefix,
}: {
  children: ReactNode;
  pathPrefix: string;
}) {
  const { isAuthenticated, mustChangePassword, isLoading, user } = useAuth();

  if (isLoading) return null;
  if (mustChangePassword) return <Navigate to="/change-password" replace />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const access = resolvePortalAccess(user);

  // Superadmin isolation: superadmin can ONLY access /superadmin
  if (access.superadmin && pathPrefix !== '/superadmin') {
    return <Navigate to="/superadmin" replace />;
  }

  // Non-superadmin: block /superadmin access
  if (!access.superadmin && pathPrefix === '/superadmin') {
    const destination = shouldShowHub(access) ? '/hub' : getDefaultPortalPath(access);
    return <Navigate to={destination} replace />;
  }

  // Check if user can access this portal
  if (!canAccessPortal(access, pathPrefix)) {
    const destination = shouldShowHub(access) ? '/hub' : getDefaultPortalPath(access);
    return <Navigate to={destination} replace />;
  }

  return <>{children}</>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Default redirect — sends users to the right place after auth
// ─────────────────────────────────────────────────────────────────────────────

function DefaultRedirect() {
  const { isAuthenticated, mustChangePassword, isLoading, user } = useAuth();

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (mustChangePassword) return <Navigate to="/change-password" replace />;

  const access = resolvePortalAccess(user);
  const destination = shouldShowHub(access) ? '/hub' : getDefaultPortalPath(access);
  return <Navigate to={destination} replace />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Router
// ─────────────────────────────────────────────────────────────────────────────

function AppRouter() {
  return (
    <AuthGate>
      <Suspense fallback={<PortalFallback />}>
        <Routes>
          {/* ── Public auth routes ─────────────────────────────────── */}
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

          {/* ── Forced password change gate ────────────────────────── */}
          <Route
            path="/change-password"
            element={
              <RequireMustChange>
                <FirstPasswordChangePage />
              </RequireMustChange>
            }
          />

          {/* ── Portal hub (multi-portal users, non-superadmin only) ─ */}
          <Route
            path="/hub"
            element={
              <RequireNonSuperadmin>
                <PortalHubPage />
              </RequireNonSuperadmin>
            }
          />

          {/* ── Profile (portal-agnostic) ──────────────────────────── */}
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <ProfilePage />
              </RequireAuth>
            }
          />

          {/* ── Admin portal ───────────────────────────────────────── */}
          <Route
            path="/admin/*"
            element={
              <RequirePortal pathPrefix="/admin">
                <AdminLayout />
              </RequirePortal>
            }
          >
            <Route index element={<PortalPlaceholder portal="Admin" />} />
            <Route path="*" element={<PortalPlaceholder portal="Admin" />} />
          </Route>

          {/* ── Accounting portal ──────────────────────────────────── */}
          <Route
            path="/accounting/*"
            element={
              <RequirePortal pathPrefix="/accounting">
                <AccountingLayout />
              </RequirePortal>
            }
          >
            <Route index element={<AccountingDashboard />} />
            <Route path="chart-of-accounts" element={<ChartOfAccountsPage />} />
            <Route path="journals" element={<JournalsPage />} />
            <Route path="journals/new" element={<JournalsPage />} />
            <Route path="journals/:id" element={<JournalDetailPage />} />
            <Route path="periods" element={<AccountingPeriodsPage />} />
            <Route path="default-accounts" element={<DefaultAccountsPage />} />
            <Route path="settlements" element={<SettlementsPage />} />
            <Route path="*" element={<AccountingDashboard />} />
          </Route>

          {/* ── Sales portal ────────────────────────────────────────── */}
          <Route
            path="/sales/*"
            element={
              <RequirePortal pathPrefix="/sales">
                <SalesLayout />
              </RequirePortal>
            }
          >
            <Route index element={<PortalPlaceholder portal="Sales" />} />
            <Route path="*" element={<PortalPlaceholder portal="Sales" />} />
          </Route>

          {/* ── Factory portal ──────────────────────────────────────── */}
          <Route
            path="/factory/*"
            element={
              <RequirePortal pathPrefix="/factory">
                <FactoryLayout />
              </RequirePortal>
            }
          >
            <Route index element={<PortalPlaceholder portal="Factory" />} />
            <Route path="*" element={<PortalPlaceholder portal="Factory" />} />
          </Route>

          {/* ── Dealer portal ───────────────────────────────────────── */}
          <Route
            path="/dealer/*"
            element={
              <RequirePortal pathPrefix="/dealer">
                <DealerLayout />
              </RequirePortal>
            }
          >
            <Route index element={<PortalPlaceholder portal="Dealer" />} />
            <Route path="*" element={<PortalPlaceholder portal="Dealer" />} />
          </Route>

          {/* ── Superadmin portal (isolated) ───────────────────────── */}
          <Route
            path="/superadmin/*"
            element={
              <RequirePortal pathPrefix="/superadmin">
                <SuperadminLayout />
              </RequirePortal>
            }
          >
            <Route index element={<PortalPlaceholder portal="Platform" />} />
            <Route path="*" element={<PortalPlaceholder portal="Platform" />} />
          </Route>

          {/* ── Default ─────────────────────────────────────────────── */}
          <Route path="/" element={<DefaultRedirect />} />
          <Route path="*" element={<DefaultRedirect />} />
        </Routes>
      </Suspense>
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
          <CommandPaletteProvider>
            <ThemeInit />
            <AppRouter />
          </CommandPaletteProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
