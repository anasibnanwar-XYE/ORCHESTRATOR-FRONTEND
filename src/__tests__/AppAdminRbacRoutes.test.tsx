import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Outlet } from 'react-router-dom';

let mockAuth = {
  session: {
    user: {
      displayName: 'Alex User',
      email: 'alex@example.com',
      roles: ['ROLE_ADMIN'],
      permissions: [],
      mfaEnabled: false,
      companyId: '1',
    },
  },
  user: {
    displayName: 'Alex User',
    email: 'alex@example.com',
    roles: ['ROLE_ADMIN'],
    permissions: [],
    mfaEnabled: false,
    companyId: '1',
  },
  isAuthenticated: true,
  mustChangePassword: false,
  isLoading: false,
  enabledModules: [],
};

vi.mock('@/context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => mockAuth,
}));

vi.mock('@/components/ui/Toast', () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('@/components/CommandPalette', () => ({
  CommandPaletteProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({ isDark: false, toggle: vi.fn() }),
}));

vi.mock('@/components/ui/Loader', () => ({
  WelcomeLoader: () => <div>Welcome loader</div>,
  PageLoader: () => <div>Page loader</div>,
}));

vi.mock('@/layouts/AdminLayout', () => ({
  AdminLayout: () => (
    <div>
      Admin layout
      <Outlet />
    </div>
  ),
}));

vi.mock('@/layouts/SuperadminLayout', () => ({
  SuperadminLayout: () => (
    <div>
      Superadmin layout
      <Outlet />
    </div>
  ),
}));

vi.mock('@/pages/admin/AdminDashboardPage', () => ({
  AdminDashboardPage: () => <div>Admin dashboard page</div>,
}));

vi.mock('@/pages/admin/PortalInsightsPage', () => ({
  PortalInsightsPage: () => <div>Portal insights page</div>,
}));

vi.mock('@/pages/admin/OperationsControlPage', () => ({
  OperationsControlPage: () => <div>Operations control page</div>,
}));

vi.mock('@/pages/superadmin/SuperadminRuntimePage', () => ({
  SuperadminRuntimePage: () => <div>Superadmin tenant runtime page</div>,
}));

vi.mock('@/pages/superadmin/SuperadminDashboardPage', () => ({
  SuperadminDashboardPage: () => <div>Superadmin dashboard page</div>,
}));

import App from '@/App';

describe('App route RBAC moves', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects /admin/tenant-runtime back to the admin dashboard for admins', async () => {
    mockAuth = {
      ...mockAuth,
      user: { ...mockAuth.user, roles: ['ROLE_ADMIN'] },
      session: { user: { ...mockAuth.user, roles: ['ROLE_ADMIN'] } },
    };

    window.history.pushState({}, '', '/admin/tenant-runtime');
    render(<App />);

    expect(await screen.findByText('Admin dashboard page')).toBeInTheDocument();
    expect(screen.queryByText('Superadmin tenant runtime page')).not.toBeInTheDocument();
  });

  it('serves the moved governance pages from superadmin routes', async () => {
    mockAuth = {
      ...mockAuth,
      user: { ...mockAuth.user, roles: ['ROLE_SUPER_ADMIN'] },
      session: { user: { ...mockAuth.user, roles: ['ROLE_SUPER_ADMIN'] } },
    };

    window.history.pushState({}, '', '/superadmin/tenant-runtime');
    const tenantRuntimeRender = render(<App />);
    expect(await screen.findByText('Superadmin tenant runtime page')).toBeInTheDocument();
    tenantRuntimeRender.unmount();

    window.history.pushState({}, '', '/superadmin/portal-insights');
    const portalInsightsRender = render(<App />);
    expect(await screen.findByText('Portal insights page')).toBeInTheDocument();
    portalInsightsRender.unmount();

    window.history.pushState({}, '', '/superadmin/operations-control');
    render(<App />);
    expect(await screen.findByText('Operations control page')).toBeInTheDocument();
  });
});
