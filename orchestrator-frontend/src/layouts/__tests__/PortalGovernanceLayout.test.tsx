import { beforeEach, describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';

let mockUserRoles = ['ROLE_ADMIN'];
const storage = new Map<string, string>();

vi.stubGlobal('localStorage', {
  getItem: vi.fn((key: string) => storage.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => {
    storage.set(key, String(value));
  }),
  removeItem: vi.fn((key: string) => {
    storage.delete(key);
  }),
  clear: vi.fn(() => {
    storage.clear();
  }),
});

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
  Sidebar: ({
    groups,
  }: {
    groups: Array<{ label?: string; items: Array<{ id: string; label: string; to: string }> }>;
  }) => (
    <nav>
      {groups.map((group) => (
        <section key={group.label ?? group.items.map((item) => item.id).join('-')}>
          {group.label && <h2>{group.label}</h2>}
          {group.items.map((item) => (
            <a key={item.id} href={item.to}>
              {item.label}
            </a>
          ))}
        </section>
      ))}
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
  beforeEach(() => {
    storage.clear();
  });

  it('admin sidebar includes the current admin navigation items', () => {
    mockUserRoles = ['ROLE_ADMIN'];
    renderWithRoute(<AdminLayout />, '/admin');

    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Users' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Roles' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Approvals' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Notifications' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Changelog' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Audit Trail' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Dealer Finance' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tickets' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument();
  });

  it('shows logical nav groups for the current admin information architecture', () => {
    mockUserRoles = ['ROLE_ADMIN'];
    renderWithRoute(<AdminLayout />, '/admin');

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
