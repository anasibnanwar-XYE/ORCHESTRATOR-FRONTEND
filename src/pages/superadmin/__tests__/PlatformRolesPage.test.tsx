 /**
  * Tests for PlatformRolesPage
  */
 
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { render, screen, waitFor } from '@testing-library/react';
 import { MemoryRouter } from 'react-router-dom';
 
 vi.mock('lucide-react', () => {
   const M = () => null;
   return {
     Shield: M, Plus: M, RefreshCw: M, ChevronDown: M, AlertCircle: M,
    CheckSquare: M, Users: M, Key: M, Lock: M, ChevronRight: M,
   };
 });
 
 vi.mock('@/lib/superadminApi', () => ({
   superadminRolesApi: {
     listRoles: vi.fn(),
     createRole: vi.fn(),
   },
 }));
 
 vi.mock('@/components/ui/Toast', () => ({
   useToast: () => ({ toast: vi.fn() }),
 }));
 
 import { PlatformRolesPage } from '../PlatformRolesPage';
 import { superadminRolesApi } from '@/lib/superadminApi';
 
 const mockRoles = [
   {
     key: 'ROLE_SUPER_ADMIN',
     name: 'Super Admin',
     description: 'Full platform governance',
     permissions: ['TENANT_MANAGE', 'USER_MANAGE'],
     isSystem: true,
     createdAt: '2024-01-01T00:00:00Z',
     updatedAt: '2024-01-01T00:00:00Z',
   },
   {
     key: 'ROLE_SUPPORT',
     name: 'Support Agent',
     description: 'View and respond to tickets',
     permissions: ['TICKET_VIEW', 'TICKET_RESPOND'],
     isSystem: false,
     createdAt: '2024-02-01T00:00:00Z',
     updatedAt: '2024-02-01T00:00:00Z',
   },
 ];
 
 function renderPage() {
   return render(
     <MemoryRouter initialEntries={['/superadmin/roles']}>
       <PlatformRolesPage />
     </MemoryRouter>
   );
 }
 
 describe('PlatformRolesPage', () => {
   beforeEach(() => { vi.clearAllMocks(); });
 
   it('renders page heading', async () => {
     (superadminRolesApi.listRoles as ReturnType<typeof vi.fn>).mockResolvedValue(mockRoles);
     renderPage();
     await waitFor(() => {
       expect(screen.getByText('Platform Roles')).toBeDefined();
     });
   });
 
   it('renders role names in table', async () => {
     (superadminRolesApi.listRoles as ReturnType<typeof vi.fn>).mockResolvedValue(mockRoles);
     renderPage();
     await waitFor(() => {
       expect(screen.getAllByText('Super Admin').length).toBeGreaterThan(0);
       expect(screen.getAllByText('Support Agent').length).toBeGreaterThan(0);
     });
   });
 
   it('shows system badge for system roles', async () => {
     (superadminRolesApi.listRoles as ReturnType<typeof vi.fn>).mockResolvedValue(mockRoles);
     renderPage();
     await waitFor(() => {
       const systemBadge = screen.queryAllByText(/system/i);
       expect(systemBadge.length).toBeGreaterThan(0);
     });
   });
 
   it('shows permissions count', async () => {
     (superadminRolesApi.listRoles as ReturnType<typeof vi.fn>).mockResolvedValue(mockRoles);
     renderPage();
     await waitFor(() => {
       const permissionTexts = screen.queryAllByText(/permission|perm/i);
       expect(permissionTexts.length).toBeGreaterThan(0);
     });
   });
 
   it('shows Create Role button', async () => {
     (superadminRolesApi.listRoles as ReturnType<typeof vi.fn>).mockResolvedValue(mockRoles);
     renderPage();
     await waitFor(() => {
       expect(screen.getByText(/create role/i)).toBeDefined();
     });
   });
 
   it('shows loading skeleton', () => {
     (superadminRolesApi.listRoles as ReturnType<typeof vi.fn>).mockImplementation(
       () => new Promise(() => {})
     );
     renderPage();
     const skeletons = document.querySelectorAll('.animate-pulse');
     expect(skeletons.length).toBeGreaterThan(0);
   });
 
   it('shows error state on API failure', async () => {
     (superadminRolesApi.listRoles as ReturnType<typeof vi.fn>).mockRejectedValue(
       new Error('Network error')
     );
     renderPage();
     await waitFor(() => {
       const retryBtns = screen.queryAllByText(/retry/i);
       const errorMsgs = screen.queryAllByText(/failed|error/i);
       expect(retryBtns.length > 0 || errorMsgs.length > 0).toBe(true);
     });
   });
 });
