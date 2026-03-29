import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';

let mockUserRoles = ['ROLE_ADMIN'];

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      displayName: 'Taylor Admin',
      email: 'taylor@example.com',
      roles: mockUserRoles,
      permissions: [],
      mfaEnabled: false,
      companyId: '1',
    },
    signOut: vi.fn(),
    enabledModules: [],
  }),
}));

vi.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({ isDark: false, toggle: vi.fn() }),
}));

vi.mock('@/components/ui/ProfileMenu', () => ({
  ProfileMenu: () => <div>Profile menu</div>,
}));

vi.mock('@/components/ui/Breadcrumb', () => ({
  Breadcrumb: () => <div>Breadcrumb</div>,
}));

vi.mock('@/components/ui/OrchestratorLogo', () => ({
  OrchestratorLogo: () => <div>Orchestrator</div>,
}));

vi.mock('@/components/ui/Sidebar', () => ({
  MobileSidebar: ({
    children,
    isOpen,
  }: {
    children: React.ReactNode;
    isOpen: boolean;
  }) => (isOpen ? <div>{children}</div> : null),
}));

vi.mock('@/components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/CompanySwitcher', () => ({
  AdminCompanySwitcher: () => <div>Company switcher</div>,
}));

vi.mock('@/components/CommandPalette', () => ({
  CommandPaletteButton: () => <button type="button">Palette</button>,
}));

import { AdminLayout } from '@/layouts/AdminLayout';
import { SuperadminLayout } from '@/layouts/SuperadminLayout';

function renderWithRoute(element: React.ReactNode, initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="*" element={element}>
          <Route path="*" element={<div>Portal content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('portal governance navigation layouts', () => {
  it('admin sidebar includes all expected nav items including Analytics & Ops group', () => {
    mockUserRoles = ['ROLE_ADMIN'];
    renderWithRoute(<AdminLayout />, '/admin');

    // Core nav items
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Users' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Roles' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Companies' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Approvals' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Notifications' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Changelog' })).toBeInTheDocument();

    // Analytics & Ops group — tenant-scoped analytics accessible to admin
    expect(screen.getByRole('link', { name: 'Orchestrator' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Portal Insights' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Audit Trail' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tenant Runtime' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Operations' })).toBeInTheDocument();
  });

  it('shows logical nav groups (Management, Workflows, Analytics & Ops, System)', () => {
    mockUserRoles = ['ROLE_ADMIN'];
    renderWithRoute(<AdminLayout />, '/admin');

    // Group headings
    expect(screen.getByText('Management')).toBeInTheDocument();
    expect(screen.getByText('Workflows')).toBeInTheDocument();
    expect(screen.getByText('Analytics & Ops')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
  });

  it('adds the governance pages to the superadmin sidebar', () => {
    mockUserRoles = ['ROLE_SUPER_ADMIN'];
    renderWithRoute(<SuperadminLayout />, '/superadmin');

    expect(screen.getByRole('link', { name: 'Portal Insights' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tenant Runtime' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Operations Control' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Audit Trail' })).toBeInTheDocument();
  });
});
