import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AdminLayout } from './admin/components/AdminLayout';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}
import { LoginPage } from './admin/pages/LoginPage';
import { ForgotPasswordPage } from './admin/pages/ForgotPasswordPage';
import { ResetPasswordPage } from './admin/pages/ResetPasswordPage';
import { DashboardPage } from './admin/pages/DashboardPage';
import { ApprovalsPage } from './admin/pages/ApprovalsPage';
import { ComponentShowcase } from './shared/pages/ComponentShowcase';
import { DesignSystemBoard } from './shared/pages/DesignSystemBoard';
import { ChatUI } from './shared/pages/ChatUI';
import { SkeinaLanding } from './company/pages/SkeinaLanding';
import { SkeinaHome } from './company/pages/SkeinaHome';
import { SkeinaProduct } from './company/pages/SkeinaProduct';
import { SkeinaPricing } from './company/pages/SkeinaPricing';
import { SkeinaFontVariant } from './company/pages/SkeinaFontVariant';
import { authApi } from './admin/lib/authApi';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  return authApi.isAuthenticated() ? (
    <AdminLayout>{children}</AdminLayout>
  ) : (
    <Navigate to="/login" replace />
  );
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  return !authApi.isAuthenticated() ? (
    <>{children}</>
  ) : (
    <Navigate to="/" replace />
  );
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPasswordPage />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password-superadmin"
          element={
            <PublicRoute>
              <ForgotPasswordPage />
            </PublicRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PublicRoute>
              <ResetPasswordPage />
            </PublicRoute>
          }
        />

        {/* Private Routes */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/approvals"
          element={
            <PrivateRoute>
              <ApprovalsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/users"
          element={
            <PrivateRoute>
              <div className="p-6"><h1>Users</h1></div>
            </PrivateRoute>
          }
        />
        <Route
          path="/roles"
          element={
            <PrivateRoute>
              <div className="p-6"><h1>Roles</h1></div>
            </PrivateRoute>
          }
        />
        <Route
          path="/companies"
          element={
            <PrivateRoute>
              <div className="p-6"><h1>Companies</h1></div>
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <div className="p-6"><h1>Settings</h1></div>
            </PrivateRoute>
          }
        />

        {/* Company website */}
        <Route path="/skeina" element={<SkeinaHome />} />
        <Route path="/skeina/old" element={<SkeinaLanding />} />
        <Route path="/skeina/product" element={<SkeinaProduct />} />
        <Route path="/skeina/pricing" element={<SkeinaPricing />} />
        <Route path="/skeina/fonts" element={<SkeinaFontVariant />} />

        {/* Chat UI - standalone AI interface */}
        <Route path="/chat-ui" element={<ChatUI />} />

        {/* Component Showcase - standalone, no auth needed */}
        <Route path="/showcase" element={<ComponentShowcase />} />
        <Route path="/design-board" element={<DesignSystemBoard />} />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/skeina" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
