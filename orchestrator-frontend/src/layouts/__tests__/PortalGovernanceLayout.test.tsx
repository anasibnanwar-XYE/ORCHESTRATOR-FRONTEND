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
  Sidebar: ({ groups, onSignOut }: { groups: Array<{ label?: string; items: Array<{ id: string; label: string; to: string; icon: React.ComponentType }> }>; onSignOut: () => void }) => (
    <nav>
      {groups.map((g: { label?: string; items: Array<{ id: string; label: string; to: string; icon: React.ComponentType }> }, i: number) => (
        <div key={i}>
          {g.label && <p>{g.label}</p>}
          {g.items.map((item: { id: string; label: string; to: string }) => (
            <a key={item.id} href={item.to} role="link" aria-label={item.label}>{item.label}</a>
          ))}
        </div>
      ))}
      <button onClick={onSignOut}>Sign out</button>
    </nav>
  ),
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
  it('admin sidebar includes all expected nav items', () => {
    mockUserRoles = ['ROLE_ADMIN'];
    renderWithRoute(<AdminLayout />, '/admin');

    // Dashboard (no group label)
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();

    // Management group
    expect(screen.getByRole('link', { name: 'Users' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Roles' })).toBeInTheDocument();

    // Workflows group
    expect(screen.getByRole('link', { name: 'Approvals' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Notifications' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Changelog' })).toBeInTheDocument();

    // Analytics group
    expect(screen.getByRole('link', { name: 'Audit Trail' })).toBeInTheDocument();

    // Finance group
    expect(screen.getByRole('link', { name: 'Dealer Finance' })).toBeInTheDocument();

    // Support group
    expect(screen.getByRole('link', { name: 'Tickets' })).toBeInTheDocument();

    // System group
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument();
  });

  it('shows logical nav groups (Management, Workflows, Analytics, Finance, Support, System)', () => {
    mockUserRoles = ['ROLE_ADMIN'];
    renderWithRoute(<AdminLayout />, '/admin');

    // Group headings
    expect(screen.getByText('Management')).toBeInTheDocument();
    expect(screen.getByText('Workflows')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Finance')).toBeInTheDocument();
    expect(screen.getByText('Support')).toBeInTheDocument();
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
