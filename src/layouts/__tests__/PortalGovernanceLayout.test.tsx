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
  it('keeps governance pages out of the admin sidebar while retaining audit trail', () => {
    mockUserRoles = ['ROLE_ADMIN'];
    renderWithRoute(<AdminLayout />, '/admin');

    expect(screen.queryByRole('link', { name: 'Portal Insights' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Tenant Runtime' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Operations Control' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Audit Trail' })).toBeInTheDocument();
  });

  it('adds the moved governance pages to the superadmin sidebar', () => {
    mockUserRoles = ['ROLE_SUPER_ADMIN'];
    renderWithRoute(<SuperadminLayout />, '/superadmin');

    expect(screen.getByRole('link', { name: 'Portal Insights' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tenant Runtime' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Operations Control' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Audit Trail' })).toBeInTheDocument();
  });
});
