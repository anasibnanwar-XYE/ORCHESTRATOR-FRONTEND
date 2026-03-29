 /**
  * Tests for RolesPage
  *
  * Covers:
  *  - Renders DataTable with role key, name, permissions count, system badge
  *  - Shows skeleton loading state
  *  - Shows error state with retry button
  *  - Empty state with CTA
  *  - System roles show system badge
  *  - SUPER_ADMIN role hidden for tenant admin (non-superadmin)
  *  - SUPER_ADMIN role visible for superadmin user
  */
 
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';

 vi.mock('lucide-react', () => {
   const M = () => null;
   return {
     Plus: M, Shield: M, AlertCircle: M, RefreshCcw: M, MoreHorizontal: M,
     ChevronRight: M, CheckCircle2: M, Lock: M, Pencil: M, Check: M,
     X: M, Search: M, ArrowUpDown: M, ArrowUp: M, ArrowDown: M,
    ChevronLeft: M, ChevronDown: M,
    AlertTriangle: M, Info: M,
   };
 });
 
 vi.mock('@/lib/adminApi', () => ({
   adminApi: {
     getRoles: vi.fn(),
     createRole: vi.fn(),
   },
 }));
 
 vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ toast: vi.fn(), success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), dismiss: vi.fn() }),
   ToastProvider: ({ children }: { children: React.ReactNode }) => children,
 }));

 // Mock useAuth — RolesPage uses useAuth() to check for SUPER_ADMIN role
 let mockUserRoles: string[] = ['ROLE_ADMIN'];
 vi.mock('@/context/AuthContext', () => ({
   useAuth: () => ({
     user: {
       email: 'admin@test.com',
       displayName: 'Test Admin',
       roles: mockUserRoles,
       permissions: [],
       mfaEnabled: false,
     },
     session: null,
     isAuthenticated: true,
   }),
 }));
 
 const mockNavigate = vi.fn();
 vi.mock('react-router-dom', async () => {
   const actual = await vi.importActual('react-router-dom');
   return { ...actual, useNavigate: () => mockNavigate };
 });
 
 import { RolesPage } from '../RolesPage';
 import { adminApi } from '@/lib/adminApi';
 
 const mockRoles = [
   {
     key: 'ROLE_SUPER_ADMIN',
     name: 'Super Admin',
     description: 'Full platform governance',
     permissions: ['ALL'],
     isSystem: true,
     createdAt: '2024-01-01T00:00:00Z',
     updatedAt: '2024-01-01T00:00:00Z',
   },
   {
     key: 'ROLE_ADMIN',
     name: 'Administrator',
     description: 'Full system access',
     permissions: ['USERS_READ', 'USERS_WRITE', 'COMPANIES_READ'],
     isSystem: true,
     createdAt: '2024-01-01T00:00:00Z',
     updatedAt: '2024-01-01T00:00:00Z',
   },
   {
     key: 'ROLE_CUSTOM',
     name: 'Custom Role',
     description: 'Custom permissions',
     permissions: ['USERS_READ'],
     isSystem: false,
     createdAt: '2024-01-01T00:00:00Z',
     updatedAt: '2024-01-01T00:00:00Z',
   },
 ];
 
 function renderPage() {
   return render(
     <MemoryRouter initialEntries={['/admin/roles']}>
       <RolesPage />
     </MemoryRouter>
   );
 }
 
 describe('RolesPage', () => {
   beforeEach(() => {
     vi.clearAllMocks();
     // Default: tenant admin (not superadmin)
     mockUserRoles = ['ROLE_ADMIN'];
   });
 
   it('renders page heading', async () => {
     (adminApi.getRoles as ReturnType<typeof vi.fn>).mockResolvedValue(mockRoles);
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Role Management')).toBeDefined();
     });
   });
 
   it('shows skeleton loading state while data loads', () => {
     (adminApi.getRoles as ReturnType<typeof vi.fn>).mockImplementation(() => new Promise(() => {}));
     renderPage();
     const skeletons = document.querySelectorAll('.animate-pulse');
     expect(skeletons.length).toBeGreaterThan(0);
   });
 
   it('renders role names in the table', async () => {
     (adminApi.getRoles as ReturnType<typeof vi.fn>).mockResolvedValue(mockRoles);
     renderPage();
     await waitFor(() => {
      expect(screen.getAllByText('Administrator').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Custom Role').length).toBeGreaterThan(0);
     });
   });
 
   it('shows system badge for built-in roles', async () => {
     (adminApi.getRoles as ReturnType<typeof vi.fn>).mockResolvedValue(mockRoles);
     renderPage();
     await waitFor(() => {
      expect(screen.getAllByText('System').length).toBeGreaterThan(0);
     });
   });
 
   it('shows permissions count', async () => {
     (adminApi.getRoles as ReturnType<typeof vi.fn>).mockResolvedValue(mockRoles);
     renderPage();
     await waitFor(() => {
       // Administrator has 3 permissions
      expect(screen.getAllByText('3').length).toBeGreaterThan(0);
     });
   });
 
   it('shows error state on API failure', async () => {
     (adminApi.getRoles as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));
     renderPage();
     await waitFor(() => {
       const msgs = screen.queryAllByText(/failed|error|couldn't/i);
       expect(msgs.length).toBeGreaterThan(0);
     });
   });
 
   it('shows read-only notice — no create role button', async () => {
     (adminApi.getRoles as ReturnType<typeof vi.fn>).mockResolvedValue(mockRoles);
     renderPage();
     await waitFor(() => expect(screen.getByText('Role Management')).toBeDefined());
     // No standalone "New Role" button should be present (role creation is superadmin-only)
     const buttons = document.querySelectorAll('button');
     const createBtn = Array.from(buttons).find((b) => /^new role$/i.test(b.textContent ?? ''));
     expect(createBtn).toBeUndefined();
     // A read-only notice should be visible
     const notices = screen.queryAllByText(/platform administrators|managed by/i);
     expect(notices.length).toBeGreaterThan(0);
   });
 
   it('shows empty state when no roles', async () => {
     (adminApi.getRoles as ReturnType<typeof vi.fn>).mockResolvedValue([]);
     renderPage();
     await waitFor(() => {
      expect(screen.getAllByText(/no roles/i).length).toBeGreaterThan(0);
     });
   });

   it('hides ROLE_SUPER_ADMIN from list for tenant admin user', async () => {
     // Default: mockUserRoles = ['ROLE_ADMIN'] (tenant admin, not superadmin)
     (adminApi.getRoles as ReturnType<typeof vi.fn>).mockResolvedValue(mockRoles);
     renderPage();
     await waitFor(() => {
       // Administrator and Custom Role should be visible
       expect(screen.getAllByText('Administrator').length).toBeGreaterThan(0);
     });
     // Super Admin role should NOT be visible for tenant admin
     const superAdminRows = screen.queryAllByText('Super Admin');
     expect(superAdminRows.length).toBe(0);
   });

   it('shows ROLE_SUPER_ADMIN in list for superadmin user', async () => {
     // Override to superadmin
     mockUserRoles = ['ROLE_SUPER_ADMIN'];
     (adminApi.getRoles as ReturnType<typeof vi.fn>).mockResolvedValue(mockRoles);
     renderPage();
     await waitFor(() => {
       // Super Admin role SHOULD be visible for superadmin user
       expect(screen.getAllByText('Super Admin').length).toBeGreaterThan(0);
     });
   });
 });
